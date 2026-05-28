const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let detail = "Request failed";
    try {
      const error = await response.json();
      detail = error.detail || detail;
    } catch {
      detail = response.statusText;
    }
    throw new Error(detail);
  }

  if (response.status === 204) {
    return null;
  }
  return response.json();
}

export const api = {
  getDashboard: () => request("/dashboard/summary"),
  getAutomationPlan: () => request("/automation/plan"),
  listCustomers: (search = "") =>
    request(`/customers${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  createCustomer: (payload) =>
    request("/customers", { method: "POST", body: JSON.stringify(payload) }),
  updateCustomer: (id, payload) =>
    request(`/customers/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  listCredits: () => request("/credits"),
  createCredit: (payload) =>
    request("/credits", { method: "POST", body: JSON.stringify(payload) }),
  updatePayment: (id, amountPaid) =>
    request(`/credits/${id}/payment`, {
      method: "PATCH",
      body: JSON.stringify({ amount_paid: Number(amountPaid) }),
    }),
  recordPayment: (id, payload) =>
    request(`/credits/${id}/payments`, {
      method: "POST",
      body: JSON.stringify({
        ...payload,
        amount: Number(payload.amount),
      }),
    }),
  markReminderSent: (id) =>
    request(`/credits/${id}/reminder-sent`, { method: "POST" }),
  listProducts: (search = "") =>
    request(`/inventory/products${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  createProduct: (payload) =>
    request("/inventory/products", { method: "POST", body: JSON.stringify(payload) }),
  generateReminder: (payload) =>
    request("/ai/reminder", { method: "POST", body: JSON.stringify(payload) }),
  analyzeCustomerRisk: (customerId) => request(`/ai/risk/customer/${customerId}`),
  askAssistant: (question) =>
    request("/ai/business-assistant", {
      method: "POST",
      body: JSON.stringify({ question }),
    }),
  getDailyReport: () => request("/reports/daily"),
  getMonthlyReport: () => request("/reports/monthly"),
  getPendingCreditReport: () => request("/reports/pending-credit"),
  getInventoryReport: () => request("/reports/inventory"),
};

export function formatCurrency(value) {
  return `Rs ${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
}

export function formatDate(value) {
  if (!value) return "Not sold yet";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
