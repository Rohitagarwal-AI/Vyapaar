import {
  AlertTriangle,
  Bell,
  CalendarDays,
  IndianRupee,
  ReceiptText,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api, formatCurrency, formatDate } from "../api/client.js";
import Badge from "../components/Badge.jsx";
import EmptyState from "../components/EmptyState.jsx";
import StatCard from "../components/StatCard.jsx";

const today = new Date().toISOString().slice(0, 10);

const creditForm = {
  customer_id: "",
  product_description: "",
  amount_due: "",
  amount_paid: 0,
  due_date: today,
  status: "pending",
  reminder_count: 0,
};

const paymentDefaults = {
  amount: "",
  payment_date: today,
  payment_mode: "cash",
  notes: "",
};

function statusTone(status) {
  if (status === "overdue") return "red";
  if (status === "partial") return "amber";
  return "green";
}

function toNumber(value) {
  return Number(value || 0);
}

function sortByDueDate(records) {
  return [...records].sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
}

export default function CreditTracker() {
  const [customers, setCustomers] = useState([]);
  const [credits, setCredits] = useState([]);
  const [form, setForm] = useState(creditForm);
  const [paymentForms, setPaymentForms] = useState({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCustomerId, setSelectedCustomerId] = useState("all");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [customerData, creditData] = await Promise.all([
      api.listCustomers(),
      api.listCredits(),
    ]);
    setCustomers(customerData);
    setCredits(creditData);
    setLoading(false);
  };

  useEffect(() => {
    load().catch((err) => {
      setMessage(err.message);
      setLoading(false);
    });
  }, []);

  const summary = useMemo(() => {
    const outstanding = credits.reduce(
      (total, record) => total + toNumber(record.outstanding_amount),
      0,
    );
    const collected = credits.reduce((total, record) => total + toNumber(record.amount_paid), 0);
    const overdueRecords = credits.filter((record) => record.status === "overdue");
    const dueWithinWeek = credits.filter((record) => {
      if (record.outstanding_amount <= 0) return false;
      const due = new Date(record.due_date);
      const now = new Date(today);
      const diff = (due - now) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 7;
    });

    return {
      outstanding,
      collected,
      overdueAccounts: new Set(overdueRecords.map((record) => record.customer_id)).size,
      dueWithinWeek: dueWithinWeek.length,
    };
  }, [credits]);

  const customerLedgers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return customers
      .map((customer) => {
        const customerRecords = sortByDueDate(
          credits.filter((record) => record.customer_id === customer.id),
        ).filter((record) => {
          const matchesStatus = statusFilter === "all" || record.status === statusFilter;
          const matchesCustomer =
            selectedCustomerId === "all" || String(record.customer_id) === selectedCustomerId;
          const matchesSearch =
            !term ||
            customer.store_name.toLowerCase().includes(term) ||
            customer.phone.toLowerCase().includes(term) ||
            record.product_description.toLowerCase().includes(term);
          return matchesStatus && matchesCustomer && matchesSearch;
        });

        const outstanding = customerRecords.reduce(
          (total, record) => total + toNumber(record.outstanding_amount),
          0,
        );
        const totalDue = customerRecords.reduce(
          (total, record) => total + toNumber(record.amount_due),
          0,
        );
        const paid = customerRecords.reduce(
          (total, record) => total + toNumber(record.amount_paid),
          0,
        );
        const overdueRecords = customerRecords.filter((record) => record.status === "overdue");
        const nextDue = customerRecords.find((record) => record.outstanding_amount > 0)?.due_date;
        const reminders = customerRecords.reduce(
          (total, record) => total + toNumber(record.reminder_count),
          0,
        );

        return {
          customer,
          records: customerRecords,
          totalDue,
          paid,
          outstanding,
          overdueRecords,
          reminders,
          nextDue,
        };
      })
      .filter((ledger) => ledger.records.length > 0);
  }, [credits, customers, search, selectedCustomerId, statusFilter]);

  const submit = async (event) => {
    event.preventDefault();
    try {
      await api.createCredit({
        ...form,
        customer_id: Number(form.customer_id),
        amount_due: Number(form.amount_due),
        amount_paid: Number(form.amount_paid || 0),
      });
      setForm(creditForm);
      setMessage("Credit entry added to the customer ledger");
      load();
    } catch (err) {
      setMessage(err.message);
    }
  };

  const updatePaymentForm = (recordId, updates) => {
    setPaymentForms((current) => ({
      ...current,
      [recordId]: {
        ...paymentDefaults,
        ...(current[recordId] || {}),
        ...updates,
      },
    }));
  };

  const recordPayment = async (record) => {
    const payment = { ...paymentDefaults, ...(paymentForms[record.id] || {}) };
    if (!payment.amount) {
      setMessage("Enter a payment amount first");
      return;
    }
    try {
      await api.recordPayment(record.id, payment);
      setPaymentForms((current) => ({ ...current, [record.id]: paymentDefaults }));
      setMessage("Payment recorded with date");
      load();
    } catch (err) {
      setMessage(err.message);
    }
  };

  const reminderSent = async (record) => {
    await api.markReminderSent(record.id);
    setMessage("Reminder count updated");
    load();
  };

  if (loading) {
    return <EmptyState title="Loading credit ledgers" message="Organizing customer accounts..." />;
  }

  return (
    <div className="page-grid">
      <section className="stats-grid">
        <StatCard
          icon={IndianRupee}
          label="Total outstanding"
          value={formatCurrency(summary.outstanding)}
          helper="Open amount across customers"
          tone="green"
        />
        <StatCard
          icon={AlertTriangle}
          label="Overdue accounts"
          value={summary.overdueAccounts}
          helper="Customers needing action"
          tone="red"
        />
        <StatCard
          icon={CalendarDays}
          label="Due this week"
          value={summary.dueWithinWeek}
          helper="Open credit entries"
          tone="amber"
        />
        <StatCard
          icon={ReceiptText}
          label="Collected so far"
          value={formatCurrency(summary.collected)}
          helper="Recorded paid amount"
          tone="blue"
        />
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Customer-wise credit ledger</p>
            <h3>Add a dated credit entry</h3>
          </div>
          <Badge>{credits.length} entries</Badge>
        </div>
        <form className="form-grid" onSubmit={submit}>
          <label>
            Customer
            <select
              required
              value={form.customer_id}
              onChange={(event) => setForm({ ...form, customer_id: event.target.value })}
            >
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.store_name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Product, invoice, or work details
            <input
              required
              value={form.product_description}
              onChange={(event) =>
                setForm({ ...form, product_description: event.target.value })
              }
              placeholder="Plywood sheets invoice #1041"
            />
          </label>
          <label>
            Total bill amount
            <input
              required
              min="0"
              type="number"
              value={form.amount_due}
              onChange={(event) => setForm({ ...form, amount_due: event.target.value })}
            />
          </label>
          <label>
            Paid at billing
            <input
              min="0"
              type="number"
              value={form.amount_paid}
              onChange={(event) => setForm({ ...form, amount_paid: event.target.value })}
            />
          </label>
          <label>
            Due date
            <input
              required
              type="date"
              value={form.due_date}
              onChange={(event) => setForm({ ...form, due_date: event.target.value })}
            />
          </label>
          <button className="primary-button" type="submit">
            <IndianRupee size={18} />
            Add to ledger
          </button>
        </form>
        {message ? <p className="inline-message">{message}</p> : null}
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Ledger controls</p>
            <h3>Find the right customer account fast</h3>
          </div>
        </div>
        <div className="credit-controls">
          <div className="search-box">
            <Search size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search customer, phone, invoice, or product"
            />
          </div>
          <label>
            Customer
            <select
              value={selectedCustomerId}
              onChange={(event) => setSelectedCustomerId(event.target.value)}
            >
              <option value="all">All customers</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.store_name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All status</option>
              <option value="overdue">Overdue</option>
              <option value="partial">Partial</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </select>
          </label>
        </div>
      </section>

      {customerLedgers.length === 0 ? (
        <EmptyState
          title="No matching credit records"
          message="Clear filters or add a new credit entry for a customer."
        />
      ) : (
        <section className="credit-board">
          {customerLedgers.map((ledger) => (
            <article className="customer-credit-column" key={ledger.customer.id}>
              <header className="ledger-header">
                <div>
                  <p className="eyebrow">Customer account</p>
                  <h3>{ledger.customer.store_name}</h3>
                  <span>{ledger.customer.phone}</span>
                </div>
                <Badge tone={ledger.overdueRecords.length ? "red" : "green"}>
                  {ledger.overdueRecords.length ? "Needs follow-up" : "On track"}
                </Badge>
              </header>

              <div className="ledger-metrics">
                <Metric label="Outstanding" value={formatCurrency(ledger.outstanding)} />
                <Metric label="Total credit" value={formatCurrency(ledger.totalDue)} />
                <Metric label="Paid" value={formatCurrency(ledger.paid)} />
                <Metric label="Next due" value={ledger.nextDue ? formatDate(ledger.nextDue) : "Clear"} />
                <Metric label="Reminders" value={ledger.reminders} />
                <Metric label="Overdue entries" value={ledger.overdueRecords.length} />
              </div>

              <div className="customer-note">
                <strong>Address</strong>
                <span>{ledger.customer.address || "No address added"}</span>
                <strong>Notes</strong>
                <span>{ledger.customer.notes || "No customer notes yet"}</span>
              </div>

              <div className="ledger-timeline">
                {ledger.records.map((record) => {
                  const paymentForm = { ...paymentDefaults, ...(paymentForms[record.id] || {}) };
                  return (
                    <div className="credit-entry" key={record.id}>
                      <div className="credit-entry-header">
                        <div>
                          <strong>{record.product_description}</strong>
                          <span>
                            Added {formatDate(record.created_at)} · Due {formatDate(record.due_date)}
                          </span>
                        </div>
                        <Badge tone={statusTone(record.status)}>{record.status}</Badge>
                      </div>

                      <div className="credit-amount-grid">
                        <Metric label="Bill" value={formatCurrency(record.amount_due)} />
                        <Metric label="Paid" value={formatCurrency(record.amount_paid)} />
                        <Metric label="Balance" value={formatCurrency(record.outstanding_amount)} />
                        <Metric
                          label="Overdue"
                          value={record.days_overdue ? `${record.days_overdue} days` : "No"}
                        />
                      </div>

                      <div className="mini-actions">
                        <button onClick={() => reminderSent(record)} type="button">
                          <Bell size={16} />
                          Reminder sent ({record.reminder_count})
                        </button>
                      </div>

                      <div className="payment-recorder">
                        <label>
                          Payment amount
                          <input
                            min="1"
                            max={record.outstanding_amount}
                            type="number"
                            value={paymentForm.amount}
                            onChange={(event) =>
                              updatePaymentForm(record.id, { amount: event.target.value })
                            }
                            placeholder="Collect amount"
                          />
                        </label>
                        <label>
                          Date
                          <input
                            type="date"
                            value={paymentForm.payment_date}
                            onChange={(event) =>
                              updatePaymentForm(record.id, { payment_date: event.target.value })
                            }
                          />
                        </label>
                        <label>
                          Mode
                          <select
                            value={paymentForm.payment_mode}
                            onChange={(event) =>
                              updatePaymentForm(record.id, { payment_mode: event.target.value })
                            }
                          >
                            <option value="cash">Cash</option>
                            <option value="upi">UPI</option>
                            <option value="bank">Bank</option>
                            <option value="cheque">Cheque</option>
                            <option value="other">Other</option>
                          </select>
                        </label>
                        <label>
                          Note
                          <input
                            value={paymentForm.notes}
                            onChange={(event) =>
                              updatePaymentForm(record.id, { notes: event.target.value })
                            }
                            placeholder="Receipt or collection note"
                          />
                        </label>
                        <button
                          className="primary-button"
                          disabled={record.outstanding_amount <= 0}
                          onClick={() => recordPayment(record)}
                          type="button"
                        >
                          Record payment
                        </button>
                      </div>

                      <div className="payment-history">
                        <strong>Dated payment history</strong>
                        {record.payments?.length ? (
                          record.payments.map((payment) => (
                            <div className="payment-row" key={payment.id}>
                              <span>{formatDate(payment.payment_date)}</span>
                              <b>{formatCurrency(payment.amount)}</b>
                              <small>{payment.payment_mode}</small>
                              {payment.notes ? <em>{payment.notes}</em> : null}
                            </div>
                          ))
                        ) : (
                          <span>No dated payments recorded yet.</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="ledger-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
