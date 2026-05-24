import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  IndianRupee,
  PackageMinus,
  ShoppingBag,
} from "lucide-react";
import { useEffect, useState } from "react";
import { api, formatCurrency, formatDate } from "../api/client.js";
import Badge from "../components/Badge.jsx";
import EmptyState from "../components/EmptyState.jsx";
import StatCard from "../components/StatCard.jsx";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [automation, setAutomation] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.getDashboard(), api.getAutomationPlan()])
      .then(([summaryData, automationData]) => {
        setSummary(summaryData);
        setAutomation(automationData);
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <EmptyState title="Backend not reachable" message={error} />;
  }

  if (!summary) {
    return <EmptyState title="Loading dashboard" message="Fetching shop data..." />;
  }

  return (
    <div className="page-grid">
      <section className="website-hero">
        <div>
          <p className="eyebrow">Vyapaar command center</p>
          <h3>Automate credit follow-ups, stock decisions, and daily shop planning.</h3>
          <p>
            A professional retail website for local businesses that turns everyday
            customer and inventory data into clear next actions.
          </p>
        </div>
        <div className="hero-insight">
          <BrainCircuit size={24} />
          <span>Smart action queue</span>
          <strong>{automation?.automation_score ?? "--"}/100</strong>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard
          icon={IndianRupee}
          label="Total pending credit"
          value={formatCurrency(summary.total_pending_credit)}
          helper="Across open credit records"
          tone="green"
        />
        <StatCard
          icon={AlertTriangle}
          label="Overdue customers"
          value={summary.overdue_customers}
          helper="Need follow-up"
          tone="red"
        />
        <StatCard
          icon={PackageMinus}
          label="Low stock products"
          value={summary.low_stock_products}
          helper="Below minimum stock"
          tone="amber"
        />
        <StatCard
          icon={ShoppingBag}
          label="Today's sales"
          value={formatCurrency(summary.todays_sales)}
          helper="From sample sales records"
          tone="blue"
        />
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Automated priorities</p>
            <h3>Today's action plan</h3>
          </div>
        </div>
        <div className="action-list">
          {summary.ai_suggested_actions.map((action) => (
            <div className="action-item" key={action}>
              <span className="dot" />
              <p>{action}</p>
            </div>
          ))}
        </div>
      </section>

      {automation ? (
        <section className="automation-strip">
          <div>
            <span>Collection focus</span>
            <strong>{formatCurrency(automation.collection_target)}</strong>
            <p>Target from priority overdue accounts.</p>
          </div>
          <div>
            <span>Follow-up queue</span>
            <strong>{automation.follow_ups.length} customers</strong>
            <p>Sorted by amount, overdue days, and reminders.</p>
          </div>
          <div>
            <span>Reorder queue</span>
            <strong>{automation.reorder_items.length} products</strong>
            <p>Auto-detected from minimum stock rules.</p>
          </div>
          <div className="strip-action">
            <ArrowRight size={20} />
            <p>Open Automation for generated reminders and reorder planning.</p>
          </div>
        </section>
      ) : null}

      <section className="two-column">
        <div className="panel">
          <div className="section-heading">
            <h3>Overdue credit</h3>
            <Badge tone="red">{summary.recent_overdue.length} records</Badge>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Outstanding</th>
                  <th>Due date</th>
                </tr>
              </thead>
              <tbody>
                {summary.recent_overdue.map((record) => (
                  <tr key={record.id}>
                    <td>{record.customer?.store_name}</td>
                    <td>{formatCurrency(record.outstanding_amount)}</td>
                    <td>{formatDate(record.due_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="section-heading">
            <h3>Low stock alerts</h3>
            <Badge tone="amber">{summary.low_stock_items.length} items</Badge>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Stock</th>
                  <th>Minimum</th>
                </tr>
              </thead>
              <tbody>
                {summary.low_stock_items.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{product.current_stock}</td>
                    <td>{product.minimum_stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
