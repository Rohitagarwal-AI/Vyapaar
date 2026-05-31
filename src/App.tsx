import { useEffect, useState } from 'react';
import AIAssistant from './components/AIAssistant';
import Dashboard from './components/Dashboard';
import {
  CustomerForm,
  DeliveryForm,
  OrderForm,
  PaymentForm,
  ProductForm,
  StaffForm,
  SupplierForm,
} from './components/Forms';
import Layout from './components/Layout';
import {
  AnalyticsPage,
  CustomersPage,
  DeliveryPage,
  InventoryPage,
  OrdersPage,
  PaymentsPage,
  ReportsPage,
  SettingsPage,
  StaffPage,
  SuppliersPage,
} from './components/OperationsPages';
import { initialStore } from './data/mockData';
import { currency } from './lib/utils';
import type {
  BusinessStore,
  Delivery,
  DeliveryStatus,
  Order,
  OrderStatus,
  PageId,
  Payment,
  Product,
  ShopSettings,
  StaffMember,
  Supplier,
  Customer,
} from './types';

type Dialog = 'product' | 'customer' | 'order' | 'payment' | 'supplier' | 'delivery' | 'staff' | null;
const STORAGE_KEY = 'vyapaar-premium-store-v1';

const readStore = (): BusinessStore => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) as BusinessStore : initialStore;
  } catch {
    return initialStore;
  }
};

const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (match) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[match]!);

export default function App() {
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [store, setStore] = useState<BusinessStore>(readStore);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [editingProduct, setEditingProduct] = useState<Product>();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(store)), [store]);
  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const notify = (message: string) => setToast(message);
  const closeDialog = () => { setDialog(null); setEditingProduct(undefined); };

  const saveProduct = (product: Product) => {
    setStore((current) => ({ ...current, products: current.products.some((item) => item.id === product.id) ? current.products.map((item) => item.id === product.id ? product : item) : [product, ...current.products] }));
    notify(editingProduct ? 'Product updated successfully.' : 'Product added to inventory.');
    closeDialog();
  };

  const saveCustomer = (customer: Customer) => {
    setStore((current) => ({ ...current, customers: [customer, ...current.customers] }));
    notify('Customer profile created.');
    closeDialog();
  };

  const saveOrder = (order: Order) => {
    setStore((current) => ({
      ...current,
      orders: [order, ...current.orders],
      products: current.products.map((product) => {
        const line = order.items.find((item) => item.productId === product.id);
        return line ? { ...product, stock: Math.max(0, product.stock - line.quantity), sold: product.sold + line.quantity } : product;
      }),
      customers: current.customers.map((customer) => customer.id === order.customerId ? { ...customer, balance: customer.balance + Math.max(0, order.total - order.paid), totalPurchases: customer.totalPurchases + order.total, lastPurchase: order.date } : customer),
      payments: order.paid > 0 ? [{ id: `pay-${Date.now()}`, customerId: order.customerId, orderId: order.id, amount: order.paid, mode: 'Cash', date: order.date, status: order.paid >= order.total ? 'Paid' : 'Partial' }, ...current.payments] : current.payments,
    }));
    notify(`Invoice ${order.invoiceNo} created.`);
    closeDialog();
  };

  const savePayment = (payment: Payment) => {
    setStore((current) => ({
      ...current,
      payments: [payment, ...current.payments],
      customers: current.customers.map((customer) => customer.id === payment.customerId ? { ...customer, balance: Math.max(0, customer.balance - payment.amount) } : customer),
    }));
    notify('Payment recorded and customer balance updated.');
    closeDialog();
  };

  const printInvoice = (order: Order) => {
    const customer = store.customers.find((item) => item.id === order.customerId);
    const popup = window.open('', '_blank', 'width=860,height=760');
    if (!popup) { notify('Please allow popups to print this invoice.'); return; }
    const lines = order.items.map((item) => {
      const product = store.products.find((candidate) => candidate.id === item.productId);
      return `<tr><td>${escapeHtml(product?.name ?? 'Product')}</td><td>${item.quantity}</td><td>${currency(item.price)}</td><td>${currency(item.quantity * item.price)}</td></tr>`;
    }).join('');
    popup.document.write(`<!doctype html><html><head><title>${escapeHtml(order.invoiceNo)}</title><style>body{font-family:Arial,sans-serif;padding:42px;color:#172033}header{display:flex;justify-content:space-between;border-bottom:2px solid #172033;padding-bottom:20px}h1{font-size:24px;margin:0}small{color:#64748b}table{width:100%;border-collapse:collapse;margin-top:28px}th,td{padding:12px;border-bottom:1px solid #e2e8f0;text-align:left}th{background:#f8fafc}.total{text-align:right;margin-top:26px;font-size:18px}.meta{margin-top:25px;line-height:1.7}@media print{button{display:none}}</style></head><body><header><div><h1>${escapeHtml(store.settings.shopName)}</h1><small>${escapeHtml(store.settings.address)}<br>${escapeHtml(store.settings.phone)} · GSTIN ${escapeHtml(store.settings.gstin)}</small></div><div><strong>TAX INVOICE</strong><br><small>${escapeHtml(order.invoiceNo)}<br>${escapeHtml(order.date)}</small></div></header><div class="meta"><strong>Bill to:</strong><br>${escapeHtml(customer?.name ?? '')}<br>${escapeHtml(customer?.phone ?? '')} · ${escapeHtml(customer?.location ?? '')}</div><table><thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>${lines}</tbody></table><div class="total"><small>Discount ${order.discount}% · GST ${order.gst}%</small><br><strong>Grand total: ${currency(order.total)}</strong><br><small>Paid: ${currency(order.paid)} · Pending: ${currency(order.total - order.paid)}</small></div><script>window.onload=()=>window.print()</script></body></html>`);
    popup.document.close();
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard store={store} onNavigate={setActivePage} onQuickAction={(action) => setDialog(action)} />;
      case 'inventory': return <InventoryPage store={store} onAdd={() => setDialog('product')} onEdit={(product) => { setEditingProduct(product); setDialog('product'); }} onDelete={(id) => { if (window.confirm('Delete this product from inventory?')) { setStore((current) => ({ ...current, products: current.products.filter((item) => item.id !== id) })); notify('Product deleted.'); } }} />;
      case 'customers': return <CustomersPage store={store} onAdd={() => setDialog('customer')} onReminder={(id) => { setStore((current) => ({ ...current, customers: current.customers.map((customer) => customer.id === id ? { ...customer, reminderCount: customer.reminderCount + 1 } : customer) })); notify('Payment reminder marked as sent.'); }} />;
      case 'orders': return <OrdersPage store={store} onAdd={() => setDialog('order')} onStatus={(id: string, status: OrderStatus) => setStore((current) => ({ ...current, orders: current.orders.map((item) => item.id === id ? { ...item, status } : item) }))} onPrint={printInvoice} />;
      case 'payments': return <PaymentsPage store={store} onAdd={() => setDialog('payment')} />;
      case 'suppliers': return <SuppliersPage store={store} onAdd={() => setDialog('supplier')} />;
      case 'delivery': return <DeliveryPage store={store} onAdd={() => setDialog('delivery')} onStatus={(id: string, status: DeliveryStatus) => setStore((current) => ({ ...current, deliveries: current.deliveries.map((item) => item.id === id ? { ...item, status } : item) }))} />;
      case 'staff': return <StaffPage store={store} onAdd={() => setDialog('staff')} onAttendance={(id, attendance) => setStore((current) => ({ ...current, staff: current.staff.map((item) => item.id === id ? { ...item, attendance } : item) }))} />;
      case 'analytics': return <AnalyticsPage store={store} />;
      case 'reports': return <ReportsPage store={store} />;
      case 'settings': return <SettingsPage settings={store.settings} onSave={(settings: ShopSettings) => { setStore((current) => ({ ...current, settings })); notify('Business settings saved.'); }} />;
    }
  };

  return <>
    <Layout activePage={activePage} onNavigate={setActivePage} shop={store.settings} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen}>{renderPage()}</Layout>
    <AIAssistant store={store} />
    {toast && <div className="toast">{toast}</div>}
    {dialog === 'product' && <ProductForm store={store} initial={editingProduct} onClose={closeDialog} onSave={saveProduct} />}
    {dialog === 'customer' && <CustomerForm onClose={closeDialog} onSave={saveCustomer} />}
    {dialog === 'order' && <OrderForm store={store} onClose={closeDialog} onSave={saveOrder} />}
    {dialog === 'payment' && <PaymentForm store={store} onClose={closeDialog} onSave={savePayment} />}
    {dialog === 'supplier' && <SupplierForm onClose={closeDialog} onSave={(supplier: Supplier) => { setStore((current) => ({ ...current, suppliers: [supplier, ...current.suppliers] })); notify('Supplier added.'); closeDialog(); }} />}
    {dialog === 'delivery' && <DeliveryForm store={store} onClose={closeDialog} onSave={(delivery: Delivery) => { setStore((current) => ({ ...current, deliveries: [delivery, ...current.deliveries] })); notify('Delivery scheduled.'); closeDialog(); }} />}
    {dialog === 'staff' && <StaffForm onClose={closeDialog} onSave={(member: StaffMember) => { setStore((current) => ({ ...current, staff: [member, ...current.staff] })); notify('Staff member added.'); closeDialog(); }} />}
  </>;
}
