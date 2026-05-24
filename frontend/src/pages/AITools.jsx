import { Bot, Clipboard, MessageCircle, ShieldAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api, formatCurrency } from "../api/client.js";
import Badge from "../components/Badge.jsx";

export default function AITools() {
  const [customers, setCustomers] = useState([]);
  const [credits, setCredits] = useState([]);
  const [selectedCreditId, setSelectedCreditId] = useState("");
  const [tone, setTone] = useState("polite");
  const [language, setLanguage] = useState("English");
  const [reminder, setReminder] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [risk, setRisk] = useState(null);
  const [question, setQuestion] = useState("Give me today's action plan.");
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([api.listCustomers(), api.listCredits()])
      .then(([customerData, creditData]) => {
        setCustomers(customerData);
        setCredits(creditData.filter((record) => record.outstanding_amount > 0));
      })
      .catch((err) => setMessage(err.message));
  }, []);

  const selectedCredit = useMemo(
    () => credits.find((record) => String(record.id) === String(selectedCreditId)),
    [credits, selectedCreditId],
  );

  const generateReminder = async () => {
    if (!selectedCredit) return;
    const response = await api.generateReminder({
      customer_name: selectedCredit.customer?.store_name || "Customer",
      amount: selectedCredit.outstanding_amount,
      product: selectedCredit.product_description,
      due_date: selectedCredit.due_date,
      days_overdue: selectedCredit.days_overdue,
      tone,
      language,
    });
    setReminder(response.message);
    setMessage(`Generated with ${response.provider} mode`);
  };

  const copyReminder = async () => {
    await navigator.clipboard.writeText(reminder);
    setMessage("Reminder copied to clipboard");
  };

  const analyzeRisk = async () => {
    if (!selectedCustomerId) return;
    const response = await api.analyzeCustomerRisk(selectedCustomerId);
    setRisk(response);
  };

  const askAssistant = async () => {
    const response = await api.askAssistant(question);
    setAnswer(response.answer);
    setMessage(`Answered with ${response.provider} mode`);
  };

  return (
    <div className="page-grid">
      <section className="two-column">
        <div className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">AI WhatsApp reminder</p>
              <h3>Generate payment follow-ups</h3>
            </div>
            <MessageCircle size={22} />
          </div>
          <div className="form-grid compact">
            <label>
              Credit record
              <select
                value={selectedCreditId}
                onChange={(event) => setSelectedCreditId(event.target.value)}
              >
                <option value="">Select pending credit</option>
                {credits.map((record) => (
                  <option key={record.id} value={record.id}>
                    {record.customer?.store_name} - {formatCurrency(record.outstanding_amount)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tone
              <select value={tone} onChange={(event) => setTone(event.target.value)}>
                <option>polite</option>
                <option>friendly</option>
                <option>professional</option>
                <option>strong</option>
              </select>
            </label>
            <label>
              Language
              <select value={language} onChange={(event) => setLanguage(event.target.value)}>
                <option>English</option>
                <option>Hindi</option>
                <option>Hinglish</option>
              </select>
            </label>
            <button className="primary-button" onClick={generateReminder} type="button">
              <Bot size={18} />
              Generate
            </button>
          </div>
          {reminder ? (
            <div className="generated-box">
              <p>{reminder}</p>
              <button className="secondary-button" onClick={copyReminder} type="button">
                <Clipboard size={16} />
                Copy
              </button>
            </div>
          ) : null}
        </div>

        <div className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Customer risk analyzer</p>
              <h3>Low, medium, or high risk</h3>
            </div>
            <ShieldAlert size={22} />
          </div>
          <div className="form-grid compact">
            <label>
              Customer
              <select
                value={selectedCustomerId}
                onChange={(event) => setSelectedCustomerId(event.target.value)}
              >
                <option value="">Select customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.store_name}
                  </option>
                ))}
              </select>
            </label>
            <button className="primary-button" onClick={analyzeRisk} type="button">
              Analyze risk
            </button>
          </div>
          {risk ? (
            <div className="risk-card">
              <Badge tone={risk.risk_level === "High" ? "red" : risk.risk_level === "Medium" ? "amber" : "green"}>
                {risk.risk_level} risk
              </Badge>
              <strong>Score {risk.score}/100</strong>
              <p>{risk.reason}</p>
              <span>{risk.recommended_action}</span>
            </div>
          ) : null}
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">AI business assistant</p>
            <h3>Ask questions about your shop data</h3>
          </div>
        </div>
        <div className="assistant-box">
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            rows={3}
            placeholder="Which customers should I follow up today?"
          />
          <button className="primary-button" onClick={askAssistant} type="button">
            Ask assistant
          </button>
        </div>
        {answer ? <div className="answer-box">{answer}</div> : null}
        {message ? <p className="inline-message">{message}</p> : null}
      </section>
    </div>
  );
}

