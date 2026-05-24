import { CalendarDays, FileText, PackageSearch, ReceiptText } from "lucide-react";
import { useState } from "react";
import { api, formatCurrency, formatDate } from "../api/client.js";
import Badge from "../components/Badge.jsx";

export default function Reports() {
  const [activeReport, setActiveReport] = useState("daily");
  const [data, setData] = useState(null);
  const [message, setMessage] = useState("");

  const loaders = {
    daily: api.getDailyReport,
    monthly: api.getMonthlyReport,
    pending: api.getPendingCreditReport,
    inventory: api.getInventoryReport,
  };

  const loadReport = async (type) => {
    setActiveReport(type);
    const response = await loaders[type]();
    setData(response);
    setMessage("");
  };

  return (
    <div className="page-grid">
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Reports</p>
            <h3>Daily, monthly, credit, and inventory summaries</h3>
          </div>
        </div>
        <div className="report-tabs">
          <button onClick={() => loadReport("daily")} type="button">
            <CalendarDays size={18} />
            Daily
          </button>
          <button onClick={() => loadReport("monthly")} type="button">
            <FileText size={18} />
            Monthly
          </button>
          <button onClick={() => loadReport("pending")} type="button">
            <ReceiptText size={18} />
            Pending credit
          </button>
          <button onClick={() => loadReport("inventory")} type="button">
            <PackageSearch size={18} />
            Inventory
          </button>
        </div>
        {message ? <p className="inline-message">{message}</p> : null}
      </section>

      {data ? (
        <section className="panel">
          <div className="section-heading">
            <h3>{activeReport.replace("-", " ")} report</h3>
            <Badge>AI recommendations included</Badge>
          </div>
          <ReportBody type={activeReport} data={data} />
          <div className="action-list">
            {(data.recommendations || []).map((item) => (
              <div className="action-item" key={item}>
                <span className="dot" />
                <p>{item}</p>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="panel">
          <div className="empty-state">
            <strong>Select a report</strong>
            <span>Choose one report type above to generate a summary.</span>
          </div>
        </section>
      )}
    </div>
  );
}

function ReportBody({ type, data }) {
  if (type === "daily") {
    return (
      <div className="report-metrics">
        <Metric label="Date" value={formatDate(data.date)} />
        <Metric label="Sales total" value={formatCurrency(data.sales_total)} />
        <Metric label="Sales count" value={data.sales_count} />
        <Metric label="Credit due today" value={data.credit_due_today.length} />
      </div>
    );
  }

  if (type === "monthly") {
    return (
      <div className="report-metrics">
        <Metric label="Month" value={`${data.month}/${data.year}`} />
        <Metric label="Sales total" value={formatCurrency(data.sales_total)} />
        <Metric label="Pending credit" value={formatCurrency(data.pending_credit)} />
        <Metric label="Overdue accounts" value={data.overdue_accounts} />
      </div>
    );
  }

  if (type === "pending") {
    return (
      <>
        <div className="report-metrics">
          <Metric label="Total pending" value={formatCurrency(data.total_pending)} />
          <Metric label="Open records" value={data.records.length} />
        </div>
        <CompactTable
          headers={["Customer", "Outstanding", "Due date", "Status"]}
          rows={data.records.map((record) => [
            record.customer?.store_name,
            formatCurrency(record.outstanding_amount),
            formatDate(record.due_date),
            record.status,
          ])}
        />
      </>
    );
  }

  return (
    <>
      <div className="report-metrics">
        <Metric label="Total products" value={data.total_products} />
        <Metric label="Low stock" value={data.low_stock_count} />
        <Metric label="Dead stock" value={data.dead_stock_count} />
      </div>
      <CompactTable
        headers={["Product", "Stock", "Minimum", "Last sold"]}
        rows={data.products.slice(0, 8).map((product) => [
          product.name,
          product.current_stock,
          product.minimum_stock,
          formatDate(product.last_sold_date),
        ])}
      />
    </>
  );
}

function Metric({ label, value }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function CompactTable({ headers, rows }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.join("-")}>
              {row.map((cell) => (
                <td key={cell}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

