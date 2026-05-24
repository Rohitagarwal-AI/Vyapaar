import { Search, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import Badge from "../components/Badge.jsx";

const emptyForm = {
  store_name: "",
  phone: "",
  address: "",
  notes: "",
};

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("");

  const loadCustomers = () => {
    api.listCustomers(search).then(setCustomers).catch((err) => setMessage(err.message));
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    try {
      if (editingId) {
        await api.updateCustomer(editingId, form);
        setMessage("Customer updated");
      } else {
        await api.createCustomer(form);
        setMessage("Customer added");
      }
      setForm(emptyForm);
      setEditingId(null);
      loadCustomers();
    } catch (err) {
      setMessage(err.message);
    }
  };

  const startEdit = (customer) => {
    setEditingId(customer.id);
    setForm({
      store_name: customer.store_name,
      phone: customer.phone,
      address: customer.address || "",
      notes: customer.notes || "",
    });
  };

  return (
    <div className="page-grid">
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Customer management</p>
            <h3>Add, search, edit, and view profiles</h3>
          </div>
          <Badge>{customers.length} customers</Badge>
        </div>

        <form className="form-grid" onSubmit={submit}>
          <label>
            Store name
            <input
              required
              value={form.store_name}
              onChange={(event) => setForm({ ...form, store_name: event.target.value })}
              placeholder="Sharma Hardware"
            />
          </label>
          <label>
            Phone
            <input
              required
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              placeholder="+91 98765 43210"
            />
          </label>
          <label>
            Address
            <input
              value={form.address}
              onChange={(event) => setForm({ ...form, address: event.target.value })}
              placeholder="Main market"
            />
          </label>
          <label>
            Notes
            <input
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              placeholder="Payment habits or business notes"
            />
          </label>
          <button className="primary-button" type="submit">
            <UserPlus size={18} />
            {editingId ? "Update customer" : "Add customer"}
          </button>
          {editingId ? (
            <button
              className="secondary-button"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
              type="button"
            >
              Cancel edit
            </button>
          ) : null}
        </form>
        {message ? <p className="inline-message">{message}</p> : null}
      </section>

      <section className="panel">
        <div className="toolbar">
          <div className="search-box">
            <Search size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && loadCustomers()}
              placeholder="Search customers by name, phone, or address"
            />
          </div>
          <button className="secondary-button" onClick={loadCustomers} type="button">
            Search
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Store</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.store_name}</td>
                  <td>{customer.phone}</td>
                  <td>{customer.address || "-"}</td>
                  <td className="row-actions">
                    <button onClick={() => setSelected(customer)} type="button">
                      View
                    </button>
                    <button onClick={() => startEdit(customer)} type="button">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selected ? (
        <section className="panel profile-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Customer profile</p>
              <h3>{selected.store_name}</h3>
            </div>
            <Badge>ID {selected.id}</Badge>
          </div>
          <div className="detail-grid">
            <span>Phone</span>
            <strong>{selected.phone}</strong>
            <span>Address</span>
            <strong>{selected.address || "No address added"}</strong>
            <span>Notes</span>
            <strong>{selected.notes || "No notes yet"}</strong>
          </div>
        </section>
      ) : null}
    </div>
  );
}

