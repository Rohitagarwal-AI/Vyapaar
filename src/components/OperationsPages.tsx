import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownToLine,
  BarChart3,
  BellRing,
  Boxes,
  CalendarCheck,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Download,
  Edit3,
  FileText,
  Filter,
  IndianRupee,
  MapPin,
  PackageCheck,
  Phone,
  Plus,
  Printer,
  Search,
  ShieldCheck,
  Trash2,
  Truck,
  UserRound,
  Users,
  WalletCards,
} from 'lucide-react';
import type {
  BusinessStore,
  DeliveryStatus,
  Order,
  OrderStatus,
  PaymentStatus,
  Product,
  ShopSettings,
  StaffMember,
} from '../types';
import { csvDownload, currency, profitForOrder, shortDate } from '../lib/utils';
import { Badge, Button, Card, EmptyState, FormField, SectionTitle } from './ui';

const orderTone = (status: OrderStatus) => status === 'Delivered' ? 'green' : status === 'Cancelled' ? 'red' : status === 'Confirmed' ? 'blue' : 'amber';
const paymentTone = (status: PaymentStatus) => status === 'Paid' ? 'green' : status === 'Overdue' ? 'red' : 'amber';
const deliveryTone = (status: DeliveryStatus) => status === 'Delivered' ? 'green' : status === 'Delayed' ? 'red' : status === 'Out for delivery' ? 'amber' : 'blue';

function PageToolbar({ search, setSearch, placeholder, action }: { search: string; setSearch: (value: string) => void; placeholder: string; action: React.ReactNode }) {
  return (
    <div className="page-toolbar">
      <label className="search-field"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={placeholder} /></label>
      {action}
    </div>
  );
}

function SummaryStrip({ items }: { items: Array<{ label: string; value: string; icon: typeof Boxes; tone?: string }> }) {
  return (
    <div className="summary-strip">
      {items.map(({ label, value, icon: Icon, tone }) => (
        <Card key={label} className="summary-card"><span className={`summary-icon ${tone ?? ''}`}><Icon size={17} /></span><div><small>{label}</small><strong>{value}</strong></div></Card>
      ))}
    </div>
  );
}

export function InventoryPage({ store, onAdd, onEdit, onDelete }: { store: BusinessStore; onAdd: () => void; onEdit: (product: Product) => void; onDelete: (id: string) => void }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const categories = ['All', ...new Set(store.products.map((product) => product.category))];
  const products = store.products.filter((product) => (category === 'All' || product.category === category) && `${product.name} ${product.sku}`.toLowerCase().includes(search.toLowerCase()));
  const inventoryValue = store.products.reduce((sum, product) => sum + product.stock * product.purchasePrice, 0);
  const lowStock = store.products.filter((product) => product.stock <= product.minStock);

  return <div className="page-stack">
    <SummaryStrip items={[
      { label: 'Inventory value', value: currency(inventoryValue), icon: IndianRupee, tone: 'violet' },
      { label: 'Products listed', value: String(store.products.length), icon: Boxes, tone: 'blue' },
      { label: 'Low-stock alerts', value: String(lowStock.length), icon: AlertTriangle, tone: 'amber' },
    ]} />
    <Card>
      <SectionTitle eyebrow="Stock catalog" title="Products" subtitle="Search, filter and maintain your sellable inventory." />
      <PageToolbar search={search} setSearch={setSearch} placeholder="Search product or SKU..." action={<Button onClick={onAdd}><Plus size={16} />Add product</Button>} />
      <div className="filter-chips">{categories.map((item) => <button className={category === item ? 'active' : ''} key={item} onClick={() => setCategory(item)}>{item}</button>)}</div>
      {products.length === 0 ? <EmptyState title="No products found" copy="Try a different filter or add a new stock item." /> : <div className="table-scroll"><table><thead><tr><th>Product</th><th>Category</th><th>Supplier</th><th>Stock</th><th>Purchase</th><th>Selling</th><th>Margin</th><th>Actions</th></tr></thead><tbody>
        {products.map((product) => {
          const supplier = store.suppliers.find((item) => item.id === product.supplierId);
          const low = product.stock <= product.minStock;
          return <tr key={product.id}><td><strong>{product.name}</strong><small>{product.sku}</small></td><td>{product.category}</td><td>{supplier?.name ?? 'Not assigned'}</td><td><Badge tone={low ? 'red' : 'green'}>{product.stock} {product.unit}</Badge>{low && <small className="warning-copy">Reorder below {product.minStock}</small>}</td><td>{currency(product.purchasePrice)}</td><td><strong>{currency(product.sellingPrice)}</strong></td><td>{Math.round(((product.sellingPrice - product.purchasePrice) / product.sellingPrice) * 100)}%</td><td><div className="row-actions"><button onClick={() => onEdit(product)} aria-label="Edit product"><Edit3 size={15} /></button><button onClick={() => onDelete(product.id)} aria-label="Delete product"><Trash2 size={15} /></button></div></td></tr>;
        })}
      </tbody></table></div>}
    </Card>
  </div>;
}

export function CustomersPage({ store, onAdd, onReminder }: { store: BusinessStore; onAdd: () => void; onReminder: (id: string) => void }) {
  const [search, setSearch] = useState('');
  const customers = store.customers.filter((customer) => `${customer.name} ${customer.phone} ${customer.location}`.toLowerCase().includes(search.toLowerCase()));
  const pending = store.customers.reduce((sum, customer) => sum + customer.balance, 0);
  return <div className="page-stack">
    <SummaryStrip items={[
      { label: 'Active customers', value: String(store.customers.length), icon: Users, tone: 'blue' },
      { label: 'Total receivables', value: currency(pending), icon: WalletCards, tone: 'amber' },
      { label: 'Credit customers', value: String(store.customers.filter((item) => item.balance > 0).length), icon: CircleDollarSign, tone: 'violet' },
    ]} />
    <Card>
      <SectionTitle eyebrow="Customer CRM" title="Customer directory" subtitle="Keep contact details, purchase value and udhaari exposure visible." />
      <PageToolbar search={search} setSearch={setSearch} placeholder="Search customer, phone or location..." action={<Button onClick={onAdd}><Plus size={16} />Add customer</Button>} />
      <div className="table-scroll"><table><thead><tr><th>Customer</th><th>Contact</th><th>Last purchase</th><th>Total purchases</th><th>Credit usage</th><th>Pending</th><th>Action</th></tr></thead><tbody>
        {customers.map((customer) => <tr key={customer.id}><td><div className="avatar-cell"><i>{customer.name.slice(0, 2)}</i><strong>{customer.name}<small>{customer.location}</small></strong></div></td><td>{customer.phone}</td><td>{shortDate(customer.lastPurchase)}</td><td>{currency(customer.totalPurchases)}</td><td><div className="credit-meter"><span><i style={{ width: `${Math.min(100, customer.balance / Math.max(customer.creditLimit, 1) * 100)}%` }} /></span><small>{currency(customer.creditLimit)} limit</small></div></td><td><Badge tone={customer.balance > 0 ? 'amber' : 'green'}>{customer.balance > 0 ? currency(customer.balance) : 'Clear'}</Badge></td><td>{customer.balance > 0 ? <button className="table-link" onClick={() => onReminder(customer.id)}><BellRing size={14} />Remind</button> : <span className="muted-copy">No dues</span>}</td></tr>)}
      </tbody></table></div>
    </Card>
  </div>;
}

export function OrdersPage({ store, onAdd, onStatus, onPrint }: { store: BusinessStore; onAdd: () => void; onStatus: (id: string, status: OrderStatus) => void; onPrint: (order: Order) => void }) {
  const [search, setSearch] = useState('');
  const orders = store.orders.filter((order) => {
    const customer = store.customers.find((item) => item.id === order.customerId);
    return `${order.invoiceNo} ${customer?.name}`.toLowerCase().includes(search.toLowerCase());
  });
  const sales = store.orders.filter((order) => order.status !== 'Cancelled').reduce((sum, order) => sum + order.total, 0);
  return <div className="page-stack">
    <SummaryStrip items={[
      { label: 'Gross sales', value: currency(sales), icon: IndianRupee, tone: 'green' },
      { label: 'Orders this month', value: String(store.orders.length), icon: ClipboardList, tone: 'blue' },
      { label: 'Pending dispatch', value: String(store.orders.filter((item) => item.status === 'Pending' || item.status === 'Confirmed').length), icon: Truck, tone: 'amber' },
    ]} />
    <Card>
      <SectionTitle eyebrow="Sales desk" title="Orders and invoices" subtitle="Create bills, update fulfilment, and print clean invoices." />
      <PageToolbar search={search} setSearch={setSearch} placeholder="Search invoice or customer..." action={<Button onClick={onAdd}><Plus size={16} />Create order</Button>} />
      <div className="table-scroll"><table><thead><tr><th>Invoice</th><th>Customer</th><th>Date</th><th>Items</th><th>Status</th><th>Total</th><th>Paid</th><th>Actions</th></tr></thead><tbody>
        {orders.map((order) => {
          const customer = store.customers.find((item) => item.id === order.customerId);
          return <tr key={order.id}><td><strong>{order.invoiceNo}</strong></td><td>{customer?.name}</td><td>{shortDate(order.date)}</td><td>{order.items.reduce((sum, item) => sum + item.quantity, 0)} units</td><td><select className="status-select" value={order.status} onChange={(event) => onStatus(order.id, event.target.value as OrderStatus)}>{['Pending', 'Confirmed', 'Delivered', 'Cancelled'].map((status) => <option key={status}>{status}</option>)}</select><Badge tone={orderTone(order.status)}>{order.status}</Badge></td><td><strong>{currency(order.total)}</strong></td><td>{currency(order.paid)}</td><td><button className="table-link" onClick={() => onPrint(order)}><Printer size={14} />Invoice</button></td></tr>;
        })}
      </tbody></table></div>
    </Card>
  </div>;
}

export function PaymentsPage({ store, onAdd }: { store: BusinessStore; onAdd: () => void }) {
  const [search, setSearch] = useState('');
  const payments = store.payments.filter((payment) => {
    const customer = store.customers.find((item) => item.id === payment.customerId);
    return `${customer?.name} ${payment.mode} ${payment.status}`.toLowerCase().includes(search.toLowerCase());
  });
  const paid = store.payments.reduce((sum, payment) => sum + payment.amount, 0);
  const due = store.customers.reduce((sum, customer) => sum + customer.balance, 0);
  return <div className="page-stack">
    <SummaryStrip items={[
      { label: 'Collected amount', value: currency(paid), icon: CheckCircle2, tone: 'green' },
      { label: 'Pending amount', value: currency(due), icon: WalletCards, tone: 'amber' },
      { label: 'Overdue warnings', value: String(store.payments.filter((item) => item.status === 'Overdue').length), icon: AlertTriangle, tone: 'red' },
    ]} />
    <Card>
      <SectionTitle eyebrow="Collection ledger" title="Payments" subtitle="Review payment modes, due dates and warning states." />
      <PageToolbar search={search} setSearch={setSearch} placeholder="Search payment or customer..." action={<Button onClick={onAdd}><Plus size={16} />Record payment</Button>} />
      <div className="table-scroll"><table><thead><tr><th>Customer</th><th>Reference</th><th>Payment mode</th><th>Date</th><th>Due date</th><th>Status</th><th className="align-right">Amount</th></tr></thead><tbody>
        {payments.map((payment) => {
          const customer = store.customers.find((item) => item.id === payment.customerId);
          const order = store.orders.find((item) => item.id === payment.orderId);
          return <tr key={payment.id}><td><strong>{customer?.name}</strong></td><td>{order?.invoiceNo ?? 'Account payment'}</td><td>{payment.mode}</td><td>{shortDate(payment.date)}</td><td>{payment.dueDate ? shortDate(payment.dueDate) : '-'}</td><td><Badge tone={paymentTone(payment.status)}>{payment.status}</Badge></td><td className="align-right"><strong>{currency(payment.amount)}</strong></td></tr>;
        })}
      </tbody></table></div>
    </Card>
  </div>;
}

export function SuppliersPage({ store, onAdd }: { store: BusinessStore; onAdd: () => void }) {
  const [search, setSearch] = useState('');
  const suppliers = store.suppliers.filter((supplier) => `${supplier.name} ${supplier.category}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="page-stack">
    <SummaryStrip items={[
      { label: 'Active suppliers', value: String(store.suppliers.length), icon: PackageCheck, tone: 'blue' },
      { label: 'Total purchases', value: currency(store.suppliers.reduce((sum, item) => sum + item.purchases, 0)), icon: IndianRupee, tone: 'violet' },
      { label: 'Supplier payable', value: currency(store.suppliers.reduce((sum, item) => sum + item.pending, 0)), icon: WalletCards, tone: 'amber' },
    ]} />
    <Card>
      <SectionTitle eyebrow="Vendor records" title="Suppliers" subtitle="Maintain supplier contacts and payment exposure." />
      <PageToolbar search={search} setSearch={setSearch} placeholder="Search supplier or category..." action={<Button onClick={onAdd}><Plus size={16} />Add supplier</Button>} />
      <div className="table-scroll"><table><thead><tr><th>Supplier</th><th>Category</th><th>Contact</th><th>Last order</th><th>Total purchases</th><th>Pending payment</th></tr></thead><tbody>
        {suppliers.map((supplier) => <tr key={supplier.id}><td><strong>{supplier.name}</strong></td><td>{supplier.category}</td><td>{supplier.contact}</td><td>{shortDate(supplier.lastOrder)}</td><td>{currency(supplier.purchases)}</td><td><Badge tone={supplier.pending > 0 ? 'amber' : 'green'}>{supplier.pending > 0 ? currency(supplier.pending) : 'Clear'}</Badge></td></tr>)}
      </tbody></table></div>
    </Card>
  </div>;
}

export function DeliveryPage({ store, onAdd, onStatus }: { store: BusinessStore; onAdd: () => void; onStatus: (id: string, status: DeliveryStatus) => void }) {
  return <div className="page-stack">
    <SummaryStrip items={[
      { label: 'Open deliveries', value: String(store.deliveries.filter((item) => item.status !== 'Delivered').length), icon: Truck, tone: 'amber' },
      { label: 'Nearby villages', value: String(store.deliveries.filter((item) => item.village).length), icon: MapPin, tone: 'violet' },
      { label: 'Completed', value: String(store.deliveries.filter((item) => item.status === 'Delivered').length), icon: CheckCircle2, tone: 'green' },
    ]} />
    <Card>
      <SectionTitle eyebrow="Dispatch board" title="Delivery management" subtitle="Assign drivers and group nearby-village orders efficiently." action={<Button onClick={onAdd}><Plus size={16} />Schedule delivery</Button>} />
      <div className="delivery-board">
        {store.deliveries.map((delivery) => {
          const customer = store.customers.find((item) => item.id === delivery.customerId);
          const order = store.orders.find((item) => item.id === delivery.orderId);
          return <article className="delivery-card" key={delivery.id}><div><Badge tone={deliveryTone(delivery.status)}>{delivery.status}</Badge><strong>{customer?.name}</strong><span><MapPin size={14} />{delivery.address}</span>{delivery.village && <small>Nearby village route: {delivery.village}</small>}</div><hr /><div className="delivery-meta"><span><FileText size={14} />{order?.invoiceNo}</span><span><CalendarCheck size={14} />{shortDate(delivery.date)}</span><span><UserRound size={14} />{delivery.assignee}</span></div><select value={delivery.status} onChange={(event) => onStatus(delivery.id, event.target.value as DeliveryStatus)}>{['Scheduled', 'Out for delivery', 'Delivered', 'Delayed'].map((status) => <option key={status}>{status}</option>)}</select></article>;
        })}
      </div>
    </Card>
  </div>;
}

export function StaffPage({ store, onAdd, onAttendance }: { store: BusinessStore; onAdd: () => void; onAttendance: (id: string, attendance: StaffMember['attendance']) => void }) {
  return <div className="page-stack">
    <SummaryStrip items={[
      { label: 'Team members', value: String(store.staff.length), icon: Users, tone: 'blue' },
      { label: 'Present today', value: String(store.staff.filter((item) => item.attendance === 'Present').length), icon: CheckCircle2, tone: 'green' },
      { label: 'Permission profiles', value: String(new Set(store.staff.map((item) => item.access)).size), icon: ShieldCheck, tone: 'violet' },
    ]} />
    <Card>
      <SectionTitle eyebrow="Team operations" title="Staff and attendance" subtitle="Assign clear responsibilities and limit sensitive access." action={<Button onClick={onAdd}><Plus size={16} />Add staff</Button>} />
      <div className="staff-grid">
        {store.staff.map((member) => <article className="staff-card" key={member.id}><div className="staff-top"><i>{member.name.slice(0, 2)}</i><div><strong>{member.name}</strong><span>{member.role}</span></div></div><p>{member.task}</p><div className="staff-access"><ShieldCheck size={14} />{member.access}</div><div className="staff-footer"><select value={member.attendance} onChange={(event) => onAttendance(member.id, event.target.value as StaffMember['attendance'])}><option>Present</option><option>Absent</option><option>Half day</option></select><span><Phone size={13} />{member.phone}</span></div></article>)}
      </div>
    </Card>
  </div>;
}

export function AnalyticsPage({ store }: { store: BusinessStore }) {
  const sales = store.orders.filter((item) => item.status !== 'Cancelled').reduce((sum, item) => sum + item.total, 0);
  const profit = store.orders.reduce((sum, item) => sum + profitForOrder(item, store.products), 0);
  const inventoryValue = store.products.reduce((sum, item) => sum + item.stock * item.purchasePrice, 0);
  const bestCustomers = [...store.customers].sort((a, b) => b.totalPurchases - a.totalPurchases).slice(0, 4);
  return <div className="page-stack">
    <SummaryStrip items={[
      { label: 'Revenue', value: currency(sales), icon: IndianRupee, tone: 'green' },
      { label: 'Estimated profit', value: currency(profit), icon: BarChart3, tone: 'violet' },
      { label: 'Inventory value', value: currency(inventoryValue), icon: Boxes, tone: 'blue' },
    ]} />
    <div className="analytics-grid">
      <Card><SectionTitle eyebrow="Monthly summary" title="Sales growth" subtitle="A clear view of business momentum." /><div className="bar-chart">{[54, 72, 66, 82, 75, 96].map((height, index) => <div key={index}><i style={{ height: `${height}%` }} /><span>{['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'][index]}</span></div>)}</div></Card>
      <Card><SectionTitle eyebrow="Performance" title="Business health" /><div className="health-score"><strong>82</strong><span>Healthy growth</span></div><ul className="insight-list"><li><CheckCircle2 size={15} />Strong repeat purchases from interior firms</li><li><AlertTriangle size={15} />Hardware reorder cycle needs attention</li><li><CircleDollarSign size={15} />Collect high-value customer dues this week</li></ul></Card>
    </div>
    <div className="analytics-grid">
      <Card><SectionTitle eyebrow="Customer value" title="Best customers" /><div className="ranked-list">{bestCustomers.map((customer, index) => <div key={customer.id}><i>{index + 1}</i><div><strong>{customer.name}</strong><span>{customer.location}</span></div><b>{currency(customer.totalPurchases)}</b></div>)}</div></Card>
      <Card><SectionTitle eyebrow="Profitability" title="Category opportunity" /><div className="category-bars">{[['Hardware', 78], ['Plywood', 68], ['Laminates', 61], ['Boards', 48]].map(([name, score]) => <div key={String(name)}><span>{name}<b>{score}%</b></span><i><em style={{ width: `${score}%` }} /></i></div>)}</div></Card>
    </div>
  </div>;
}

export function ReportsPage({ store }: { store: BusinessStore }) {
  const reportCards = [
    { title: 'Sales report', copy: 'Invoice-wise revenue, paid amounts and fulfilment status.', icon: ClipboardList, onClick: () => csvDownload('vyapaar-sales-report.csv', [['Invoice', 'Customer', 'Date', 'Total', 'Paid', 'Status'], ...store.orders.map((order) => [order.invoiceNo, store.customers.find((item) => item.id === order.customerId)?.name ?? '', order.date, order.total, order.paid, order.status])]) },
    { title: 'Pending payment report', copy: 'Customer credit exposure and reminder priority.', icon: WalletCards, onClick: () => csvDownload('vyapaar-pending-payments.csv', [['Customer', 'Phone', 'Location', 'Pending', 'Credit Limit'], ...store.customers.filter((item) => item.balance > 0).map((item) => [item.name, item.phone, item.location, item.balance, item.creditLimit])]) },
    { title: 'Inventory report', copy: 'Stock levels, pricing, supplier and reorder thresholds.', icon: Boxes, onClick: () => csvDownload('vyapaar-inventory-report.csv', [['SKU', 'Product', 'Category', 'Stock', 'Unit', 'Purchase', 'Selling', 'Min Stock'], ...store.products.map((item) => [item.sku, item.name, item.category, item.stock, item.unit, item.purchasePrice, item.sellingPrice, item.minStock])]) },
    { title: 'Supplier payable report', copy: 'Purchases and pending payments for each supplier.', icon: PackageCheck, onClick: () => csvDownload('vyapaar-supplier-report.csv', [['Supplier', 'Contact', 'Category', 'Purchases', 'Pending'], ...store.suppliers.map((item) => [item.name, item.contact, item.category, item.purchases, item.pending])]) },
  ];
  return <div className="page-stack">
    <Card className="report-banner"><div><span><FileText size={18} /></span><h2>Business reports</h2><p>Keep clean records ready for planning, GST review and payment follow-ups.</p></div><Button variant="secondary" onClick={() => window.print()}><Printer size={16} />Print summary</Button></Card>
    <div className="report-grid">{reportCards.map(({ title, copy, icon: Icon, onClick }) => <Card className="report-card" key={title}><span><Icon size={19} /></span><h3>{title}</h3><p>{copy}</p><Button variant="secondary" onClick={onClick}><Download size={15} />Download CSV</Button></Card>)}</div>
  </div>;
}

export function SettingsPage({ settings, onSave }: { settings: ShopSettings; onSave: (settings: ShopSettings) => void }) {
  const [draft, setDraft] = useState(settings);
  const update = <K extends keyof ShopSettings>(key: K, value: ShopSettings[K]) => setDraft((current) => ({ ...current, [key]: value }));
  return <div className="settings-grid">
    <Card>
      <SectionTitle eyebrow="Business profile" title="Shop details" subtitle="Used on invoices, reports and reminders." />
      <form className="settings-form" onSubmit={(event) => { event.preventDefault(); onSave(draft); }}>
        <div className="form-grid"><FormField label="Shop name"><input value={draft.shopName} onChange={(event) => update('shopName', event.target.value)} /></FormField><FormField label="Owner name"><input value={draft.ownerName} onChange={(event) => update('ownerName', event.target.value)} /></FormField><FormField label="Phone"><input value={draft.phone} onChange={(event) => update('phone', event.target.value)} /></FormField><FormField label="GSTIN"><input value={draft.gstin} onChange={(event) => update('gstin', event.target.value)} /></FormField></div>
        <FormField label="Business address"><textarea value={draft.address} onChange={(event) => update('address', event.target.value)} /></FormField>
        <Button type="submit">Save business profile</Button>
      </form>
    </Card>
    <Card>
      <SectionTitle eyebrow="Automation" title="Notification preferences" subtitle="Keep daily operations visible without unnecessary noise." />
      <div className="toggle-list">
        {[['lowStockAlerts', 'Low-stock alerts', 'Notify when product quantity drops below its reorder level.'], ['paymentReminders', 'Payment reminders', 'Surface overdue customer payments for quick follow-up.'], ['dailySummary', 'Daily business summary', 'Prepare a compact end-of-day sales and task digest.']].map(([key, title, copy]) => <label key={key}><div><strong>{title}</strong><span>{copy}</span></div><input type="checkbox" checked={draft[key as keyof ShopSettings] as boolean} onChange={(event) => update(key as keyof ShopSettings, event.target.checked)} /><i /></label>)}
      </div>
    </Card>
  </div>;
}
