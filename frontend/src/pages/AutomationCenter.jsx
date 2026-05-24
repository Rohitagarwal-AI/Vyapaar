import {
  Bell,
  Clipboard,
  PackageCheck,
  RefreshCw,
  Route,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { api, formatCurrency, formatDate } from "../api/client.js";
import Badge from "../components/Badge.jsx";
import EmptyState from "../components/EmptyState.jsx";
import StatCard from "../components/StatCard.jsx";

function priorityTone(priority) {
  if (priority === "High") return "red";
  if (priority === "Medium") return "amber";
  return "green";
}

export default function AutomationCenter() {
  const [plan, setPlan] = useState(null);
  const [messages, setMessages] = useState({});
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  const loadPlan = async () => {
    setLoading(true);
    try {
      const response = await api.getAutomationPlan();
      setPlan(response);
      setNotice("Smart automation plan refreshed");
    } catch (err) {
      setNotice(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlan();
  }, []);

  const generateReminder = async (item) => {
    const response = await api.generateReminder({
      customer_name: item.customer_name,
      amount: item.amount,
      product: item.product,
      due_date: item.due_date,
      days_overdue: item.days_overdue,
      tone: item.tone,
      language: item.language,
    });
    setMessages((current) => ({
      ...current,
      [item.credit_record_id]: response.message,
    }));
    setNotice("Reminder generated");
  };

  const copyMessage = async (recordId) => {
    await navigator.clipboard.writeText(messages[recordId]);
    setNotice("Reminder copied");
  };

  const markReminderSent = async (item) => {
    await api.markReminderSent(item.credit_record_id);
    setNotice("Reminder count updated");
    loadPlan();
  };

  if (loading && !plan) {
    return <EmptyState title="Building automation plan" message="Scanning credit, stock, and sales data..." />;
  }

  if (!plan) {
    return <EmptyState title="Automation unavailable" message={notice || "Try refreshing the page."} />;
  }

  return (
    <div className="page-grid">
      <section className="automation-hero">
        <div>
          <p className="eyebrow">Vyapaar automation engine</p>
          <h3>Run your shop from one daily action queue</h3>
          <p>
            Vyapaar automatically turns credit, inventory, and customer signals into
            follow-ups, reorder tasks, and practical daily priorities.
          </p>
        </div>
        <button className="primary-button" onClick={loadPlan} type="button">
          <RefreshCw size={18} />
          Refresh plan
        </button>
      </section>

      <section className="stats-grid">
        <StatCard
          icon={Sparkles}
          label="Automation score"
          value={`${plan.automation_score}/100`}
          helper="Higher means fewer urgent actions"
          tone="blue"
        />
        <StatCard
          icon={Bell}
          label="Follow-ups"
          value={plan.follow_ups.length}
          helper="Prioritized by risk"
          tone="red"
        />
        <StatCard
          icon={PackageCheck}
          label="Reorder tasks"
          value={plan.reorder_items.length}
          helper="Low-stock products"
          tone="amber"
        />
        <StatCard
          icon={ShieldAlert}
          label="Collection target"
          value={formatCurrency(plan.collection_target)}
          helper="Suggested focus today"
          tone="green"
        />
      </section>

      <section className="two-column">
        <div className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Auto follow-up queue</p>
              <h3>Customers to contact first</h3>
            </div>
            <Badge tone="red">{plan.follow_ups.length} accounts</Badge>
          </div>
          <div className="automation-list">
            {plan.follow_ups.length ? (
              plan.follow_ups.map((item) => (
                <article className="automation-card" key={item.credit_record_id}>
                  <div className="automation-card-head">
                    <div>
                      <strong>{item.customer_name}</strong>
                      <span>{item.phone}</span>
                    </div>
                    <Badge tone={priorityTone(item.priority)}>{item.priority}</Badge>
                  </div>
                  <p>{item.product}</p>
                  <div className="automation-meta">
                    <span>{formatCurrency(item.amount)}</span>
                    <span>{item.days_overdue} days overdue</span>
                    <span>{item.reminders} reminders</span>
                  </div>
                  <div className="next-step">{item.next_step}</div>
                  <div className="automation-actions">
                    <button onClick={() => generateReminder(item)} type="button">
                      <Bell size={16} />
                      Generate reminder
                    </button>
                    {messages[item.credit_record_id] ? (
                      <button onClick={() => copyMessage(item.credit_record_id)} type="button">
                        <Clipboard size={16} />
                        Copy
                      </button>
                    ) : null}
                    <button onClick={() => markReminderSent(item)} type="button">
                      Mark sent
                    </button>
                  </div>
                  {messages[item.credit_record_id] ? (
                    <div className="generated-message">{messages[item.credit_record_id]}</div>
                  ) : null}
                </article>
              ))
            ) : (
              <EmptyState title="No urgent follow-ups" message="No overdue customer needs action right now." />
            )}
          </div>
        </div>

        <div className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Auto reorder queue</p>
              <h3>Products to buy before stockout</h3>
            </div>
            <Badge tone="amber">{plan.reorder_items.length} items</Badge>
          </div>
          <div className="automation-list">
            {plan.reorder_items.length ? (
              plan.reorder_items.map((item) => (
                <article className="automation-card compact" key={item.product_id}>
                  <div className="automation-card-head">
                    <div>
                      <strong>{item.name}</strong>
                      <span>{item.category}</span>
                    </div>
                    <Badge tone={priorityTone(item.priority)}>{item.priority}</Badge>
                  </div>
                  <div className="automation-meta">
                    <span>Stock {item.current_stock}</span>
                    <span>Min {item.minimum_stock}</span>
                    <span>Order {item.suggested_quantity}</span>
                  </div>
                  <div className="next-step">
                    Supplier: {item.supplier || "Not added"} · Est. cost{" "}
                    {formatCurrency(item.estimated_cost)}
                  </div>
                </article>
              ))
            ) : (
              <EmptyState title="Stock looks healthy" message="No products are below minimum stock." />
            )}
          </div>
        </div>
      </section>

      <section className="two-column">
        <div className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Daily playbook</p>
              <h3>What Vyapaar will prioritize today</h3>
            </div>
            <Route size={22} />
          </div>
          <div className="playbook-list">
            {plan.daily_playbook.map((item) => (
              <div className="playbook-item" key={item.title}>
                <span>{item.type}</span>
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Smart rules</p>
              <h3>Automation built into the website</h3>
            </div>
          </div>
          <div className="action-list">
            {plan.automation_rules.map((rule) => (
              <div className="action-item" key={rule}>
                <span className="dot" />
                <p>{rule}</p>
              </div>
            ))}
          </div>
          {plan.slow_stock.length ? (
            <div className="slow-stock-box">
              <strong>Slow stock actions</strong>
              {plan.slow_stock.map((item) => (
                <span key={item.product_id}>
                  {item.name}: {item.dead_stock_days} days unsold. {item.action}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {notice ? <p className="inline-message">{notice}</p> : null}
    </div>
  );
}
