import { PackagePlus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { api, formatCurrency, formatDate } from "../api/client.js";
import Badge from "../components/Badge.jsx";

const emptyProduct = {
  name: "",
  category: "",
  current_stock: "",
  minimum_stock: "",
  purchase_price: "",
  selling_price: "",
  supplier: "",
  last_sold_date: "",
};

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyProduct);
  const [message, setMessage] = useState("");

  const load = () => {
    api.listProducts(search).then(setProducts).catch((err) => setMessage(err.message));
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    try {
      await api.createProduct({
        ...form,
        current_stock: Number(form.current_stock),
        minimum_stock: Number(form.minimum_stock),
        purchase_price: Number(form.purchase_price),
        selling_price: Number(form.selling_price),
        last_sold_date: form.last_sold_date || null,
      });
      setForm(emptyProduct);
      setMessage("Product added");
      load();
    } catch (err) {
      setMessage(err.message);
    }
  };

  const lowStock = products.filter((product) => product.is_low_stock);
  const deadStock = products.filter(
    (product) => product.dead_stock_days !== null && product.dead_stock_days >= 60,
  );

  return (
    <div className="page-grid">
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Inventory management</p>
            <h3>Add products and detect stock issues</h3>
          </div>
          <div className="badge-row">
            <Badge tone="amber">{lowStock.length} low stock</Badge>
            <Badge tone="red">{deadStock.length} slow moving</Badge>
          </div>
        </div>
        <form className="form-grid" onSubmit={submit}>
          <label>
            Product name
            <input
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="A4 Copier Paper Box"
            />
          </label>
          <label>
            Category
            <input
              required
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
              placeholder="Stationery"
            />
          </label>
          <label>
            Current stock
            <input
              required
              min="0"
              type="number"
              value={form.current_stock}
              onChange={(event) => setForm({ ...form, current_stock: event.target.value })}
            />
          </label>
          <label>
            Minimum stock
            <input
              required
              min="0"
              type="number"
              value={form.minimum_stock}
              onChange={(event) => setForm({ ...form, minimum_stock: event.target.value })}
            />
          </label>
          <label>
            Purchase price
            <input
              min="0"
              type="number"
              value={form.purchase_price}
              onChange={(event) => setForm({ ...form, purchase_price: event.target.value })}
            />
          </label>
          <label>
            Selling price
            <input
              min="0"
              type="number"
              value={form.selling_price}
              onChange={(event) => setForm({ ...form, selling_price: event.target.value })}
            />
          </label>
          <label>
            Supplier
            <input
              value={form.supplier}
              onChange={(event) => setForm({ ...form, supplier: event.target.value })}
              placeholder="Supplier name"
            />
          </label>
          <label>
            Last sold date
            <input
              type="date"
              value={form.last_sold_date}
              onChange={(event) => setForm({ ...form, last_sold_date: event.target.value })}
            />
          </label>
          <button className="primary-button" type="submit">
            <PackagePlus size={18} />
            Add product
          </button>
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
              onKeyDown={(event) => event.key === "Enter" && load()}
              placeholder="Search products by name or category"
            />
          </div>
          <button className="secondary-button" onClick={load} type="button">
            Search
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Margin</th>
                <th>Supplier</th>
                <th>Last sold</th>
                <th>Alert</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>
                    {product.current_stock} / {product.minimum_stock}
                  </td>
                  <td>{formatCurrency(product.selling_price - product.purchase_price)}</td>
                  <td>{product.supplier || "-"}</td>
                  <td>{formatDate(product.last_sold_date)}</td>
                  <td>
                    {product.is_low_stock ? <Badge tone="amber">Low stock</Badge> : null}
                    {product.dead_stock_days >= 60 ? (
                      <Badge tone="red">{product.dead_stock_days} days</Badge>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

