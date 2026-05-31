import {
  ArrowUpRight,
  Banknote,
  Boxes,
  CircleAlert,
  ClipboardPlus,
  CreditCard,
  IndianRupee,
  PackagePlus,
  Plus,
  Truck,
  UserPlus,
  UsersRound,
} from 'lucide-react';
import type { BusinessStore, PageId } from '../types';
import { currency, profitForOrder, shortDate } from '../lib/utils';
import { Badge, Button, Card, SectionTitle } from './ui';

const revenueSeries = [42, 58, 49, 66, 61, 74, 82, 77, 91, 88, 104, 118];
const monthLabels = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'];

function RevenueChart() {
  const max = Math.max(...revenueSeries);
  const points = revenueSeries.map((value, index) => {
    const x = (index / (revenueSeries.length - 1)) * 760;
    const y = 188 - (value / max) * 160;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="chart-wrap">
      <svg viewBox="0 0 760 210" preserveAspectRatio="none" aria-label="Monthly revenue chart">
        <defs>
          <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity=".24" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[30, 82, 134, 186].map((y) => <line key={y} x1="0" x2="760" y1={y} y2={y} stroke="#e2e8f0" strokeWidth="1" />)}
        <polygon points={`0,210 ${points} 760,210`} fill="url(#revenueFill)" />
        <polyline points={points} fill="none" stroke="#4f46e5" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {revenueSeries.map((value, index) => {
          const x = (index / (revenueSeries.length - 1)) * 760;
          const y = 188 - (value / max) * 160;
          return <circle key={value + index} cx={x} cy={y} r="4" fill="#fff" stroke="#4f46e5" strokeWidth="3" />;
        })}
      </svg>
      <div className="chart-labels">{monthLabels.map((label) => <span key={label}>{label}</span>)}</div>
    </div>
  );
}

export default function Dashboard({
  store,
  onNavigate,
  onQuickAction,
}: {
  store: BusinessStore;
  onNavigate: (page: PageId) => void;
  onQuickAction: (action: 'product' | 'customer' | 'order' | 'payment') => void;
}) {
  const completedOrders = store.orders.filter((order) => order.status !== 'Cancelled');
  const sales = completedOrders.reduce((sum, order) => sum + order.total, 0);
  const profit = completedOrders.reduce((sum, order) => sum + profitForOrder(order, store.products), 0);
  const pending = store.customers.reduce((sum, customer) => sum + customer.balance, 0);
  const lowStock = store.products.filter((product) => product.stock <= product.minStock);
  const todaysOrders = store.orders.filter((order) => order.date === '2026-05-31');
  const deliveryCounts = store.deliveries.reduce<Record<string, number>>((acc, delivery) => {
    acc[delivery.status] = (acc[delivery.status] ?? 0) + 1;
    return acc;
  }, {});
  const topProducts = [...store.products].sort((a, b) => b.sold - a.sold).slice(0, 4);

  const stats = [
    { label: 'Total sales', value: currency(sales), change: '+18.4% this month', icon: IndianRupee, tone: 'violet' },
    { label: 'Estimated profit', value: currency(profit), change: '+12.8% this month', icon: Banknote, tone: 'green' },
    { label: 'Pending payments', value: currency(pending), change: `${store.customers.filter((customer) => customer.balance > 0).length} customers to follow up`, icon: CreditCard, tone: 'amber' },
    { label: 'Low-stock items', value: String(lowStock.length), change: 'Needs attention today', icon: CircleAlert, tone: 'red' },
  ];

  return (
    <div className="page-stack">
      <Card className="welcome-banner">
        <div>
          <p>Good morning, Mohit</p>
          <h2>Your business is moving steadily.</h2>
          <span>You have <strong>{lowStock.length} stock alerts</strong> and <strong>{currency(pending)}</strong> in customer dues to review today.</span>
        </div>
        <Button onClick={() => onNavigate('analytics')}>View business insights <ArrowUpRight size={16} /></Button>
      </Card>

      <div className="stats-grid">
        {stats.map(({ label, value, change, icon: Icon, tone }) => (
          <Card className="stat-card" key={label}>
            <div className={`stat-icon stat-${tone}`}><Icon size={19} /></div>
            <div><span>{label}</span><strong>{value}</strong><small>{change}</small></div>
          </Card>
        ))}
      </div>

      <div className="quick-actions">
        <strong>Quick actions</strong>
        <button onClick={() => onQuickAction('product')}><PackagePlus size={17} />Add product</button>
        <button onClick={() => onQuickAction('customer')}><UserPlus size={17} />Add customer</button>
        <button onClick={() => onQuickAction('order')}><ClipboardPlus size={17} />Create invoice</button>
        <button onClick={() => onQuickAction('payment')}><Plus size={17} />Record payment</button>
      </div>

      <div className="dashboard-grid">
        <Card className="revenue-card">
          <SectionTitle eyebrow="Revenue trend" title="Monthly revenue" subtitle="Sales performance over the last 12 months" action={<Badge tone="green">+18.4%</Badge>} />
          <div className="chart-metric"><strong>{currency(118000)}</strong><span>May revenue</span></div>
          <RevenueChart />
        </Card>
        <Card className="today-card">
          <SectionTitle eyebrow="Live desk" title="Today's orders" subtitle={`${todaysOrders.length} orders created`} action={<button className="text-link" onClick={() => onNavigate('orders')}>View all</button>} />
          <div className="compact-list">
            {todaysOrders.map((order) => {
              const customer = store.customers.find((item) => item.id === order.customerId);
              return (
                <div key={order.id}>
                  <span className="mini-icon"><ClipboardPlus size={15} /></span>
                  <div><strong>{customer?.name}</strong><small>{order.invoiceNo}</small></div>
                  <b>{currency(order.total)}</b>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="triple-grid">
        <Card>
          <SectionTitle eyebrow="Fast movers" title="Top-selling products" action={<button className="text-link" onClick={() => onNavigate('inventory')}>Inventory</button>} />
          <div className="ranked-list">
            {topProducts.map((product, index) => (
              <div key={product.id}>
                <i>{index + 1}</i>
                <div><strong>{product.name}</strong><span>{product.sold} units sold</span></div>
                <b>{currency(product.sellingPrice)}</b>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <SectionTitle eyebrow="Relationships" title="Recent customers" action={<button className="text-link" onClick={() => onNavigate('customers')}>Customers</button>} />
          <div className="customer-list">
            {[...store.customers].sort((a, b) => b.lastPurchase.localeCompare(a.lastPurchase)).slice(0, 4).map((customer) => (
              <div key={customer.id}>
                <i>{customer.name.slice(0, 2)}</i>
                <div><strong>{customer.name}</strong><span>{customer.location} · {shortDate(customer.lastPurchase)}</span></div>
                {customer.balance > 0 ? <Badge tone="amber">{currency(customer.balance)} due</Badge> : <Badge tone="green">Clear</Badge>}
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <SectionTitle eyebrow="Dispatch" title="Delivery status" action={<button className="text-link" onClick={() => onNavigate('delivery')}>Manage</button>} />
          <div className="delivery-summary">
            {[
              ['Scheduled', deliveryCounts.Scheduled ?? 0, '#6366f1'],
              ['Out for delivery', deliveryCounts['Out for delivery'] ?? 0, '#f59e0b'],
              ['Delivered', deliveryCounts.Delivered ?? 0, '#10b981'],
              ['Delayed', deliveryCounts.Delayed ?? 0, '#ef4444'],
            ].map(([label, value, color]) => (
              <div key={String(label)}>
                <span><i style={{ background: color }} />{label}</span><strong>{value}</strong>
              </div>
            ))}
          </div>
          <button className="delivery-cta" onClick={() => onNavigate('delivery')}><Truck size={16} />Open dispatch board</button>
        </Card>
      </div>

      <Card>
        <SectionTitle eyebrow="Payments" title="Recent transactions" subtitle="Latest collections and due payment entries" action={<button className="text-link" onClick={() => onNavigate('payments')}>Payment ledger</button>} />
        <div className="table-scroll">
          <table>
            <thead><tr><th>Customer</th><th>Mode</th><th>Date</th><th>Status</th><th className="align-right">Amount</th></tr></thead>
            <tbody>
              {store.payments.slice(0, 5).map((payment) => {
                const customer = store.customers.find((item) => item.id === payment.customerId);
                return <tr key={payment.id}><td><strong>{customer?.name}</strong></td><td>{payment.mode}</td><td>{shortDate(payment.date)}</td><td><Badge tone={payment.status === 'Paid' ? 'green' : payment.status === 'Overdue' ? 'red' : 'amber'}>{payment.status}</Badge></td><td className="align-right"><strong>{currency(payment.amount)}</strong></td></tr>;
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
