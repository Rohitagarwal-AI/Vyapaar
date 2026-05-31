import { useMemo, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import type {
  BusinessStore,
  Customer,
  Delivery,
  Order,
  OrderItem,
  Payment,
  Product,
  StaffMember,
  Supplier,
} from '../types';
import { currency, orderSubtotal, orderTotal, today } from '../lib/utils';
import { Button, FormField, Modal } from './ui';

const value = (data: FormData, key: string) => String(data.get(key) ?? '').trim();
const numberValue = (data: FormData, key: string) => Number(data.get(key) ?? 0);

export function ProductForm({ store, initial, onClose, onSave }: { store: BusinessStore; initial?: Product; onClose: () => void; onSave: (product: Product) => void }) {
  return <Modal title={initial ? 'Edit product' : 'Add product'} subtitle="Maintain pricing, stock and supplier information." onClose={onClose}>
    <form className="modal-form" onSubmit={(event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      onSave({
        id: initial?.id ?? `prd-${Date.now()}`, name: value(data, 'name'), sku: value(data, 'sku'), category: value(data, 'category'),
        stock: numberValue(data, 'stock'), minStock: numberValue(data, 'minStock'), unit: value(data, 'unit'), purchasePrice: numberValue(data, 'purchasePrice'),
        sellingPrice: numberValue(data, 'sellingPrice'), supplierId: value(data, 'supplierId'), gst: numberValue(data, 'gst'), sold: initial?.sold ?? 0,
      });
    }}>
      <div className="form-grid"><FormField label="Product name"><input required name="name" defaultValue={initial?.name} placeholder="e.g. Century Plywood 18mm" /></FormField><FormField label="SKU code"><input required name="sku" defaultValue={initial?.sku} placeholder="PLY-CEN-18" /></FormField><FormField label="Category"><input required name="category" defaultValue={initial?.category} placeholder="Plywood" /></FormField><FormField label="Supplier"><select required name="supplierId" defaultValue={initial?.supplierId}>{store.suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></FormField><FormField label="Stock quantity"><input required min="0" type="number" name="stock" defaultValue={initial?.stock ?? 0} /></FormField><FormField label="Low-stock alert"><input required min="0" type="number" name="minStock" defaultValue={initial?.minStock ?? 10} /></FormField><FormField label="Unit"><input required name="unit" defaultValue={initial?.unit ?? 'sheets'} /></FormField><FormField label="GST %"><input required min="0" type="number" name="gst" defaultValue={initial?.gst ?? 18} /></FormField><FormField label="Purchase price"><input required min="0" type="number" name="purchasePrice" defaultValue={initial?.purchasePrice ?? 0} /></FormField><FormField label="Selling price"><input required min="0" type="number" name="sellingPrice" defaultValue={initial?.sellingPrice ?? 0} /></FormField></div>
      <div className="modal-footer"><Button variant="secondary" type="button" onClick={onClose}>Cancel</Button><Button type="submit">{initial ? 'Save changes' : 'Add product'}</Button></div>
    </form>
  </Modal>;
}

export function CustomerForm({ onClose, onSave }: { onClose: () => void; onSave: (customer: Customer) => void }) {
  return <Modal title="Add customer" subtitle="Create a buyer profile with a sensible credit limit." onClose={onClose}><form className="modal-form" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); onSave({ id: `cus-${Date.now()}`, name: value(data, 'name'), phone: value(data, 'phone'), location: value(data, 'location'), balance: 0, creditLimit: numberValue(data, 'creditLimit'), totalPurchases: 0, lastPurchase: today(), reminderCount: 0 }); }}>
    <div className="form-grid"><FormField label="Customer name"><input required name="name" placeholder="Business or buyer name" /></FormField><FormField label="Phone number"><input required name="phone" placeholder="+91 98765 43210" /></FormField><FormField label="Area or village"><input required name="location" placeholder="Sikar" /></FormField><FormField label="Credit limit"><input required min="0" type="number" name="creditLimit" defaultValue="25000" /></FormField></div>
    <div className="modal-footer"><Button variant="secondary" type="button" onClick={onClose}>Cancel</Button><Button type="submit">Add customer</Button></div>
  </form></Modal>;
}

export function OrderForm({ store, onClose, onSave }: { store: BusinessStore; onClose: () => void; onSave: (order: Order) => void }) {
  const [items, setItems] = useState<OrderItem[]>([{ productId: store.products[0]?.id ?? '', quantity: 1, price: store.products[0]?.sellingPrice ?? 0 }]);
  const [discount, setDiscount] = useState(0);
  const [gst, setGst] = useState(18);
  const total = useMemo(() => orderTotal(items, discount, gst), [items, discount, gst]);
  const setProduct = (index: number, productId: string) => setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, productId, price: store.products.find((product) => product.id === productId)?.sellingPrice ?? 0 } : item));
  const setQuantity = (index: number, quantity: number) => setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, quantity: Math.max(1, quantity) } : item));
  return <Modal title="Create order and invoice" subtitle="Add multiple products, discount and GST. Totals calculate automatically." onClose={onClose} wide><form className="modal-form" onSubmit={(event) => {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    onSave({ id: `ord-${Date.now()}`, invoiceNo: `INV-${Date.now().toString().slice(-8)}`, customerId: value(data, 'customerId'), date: today(), items, discount, gst, total, paid: numberValue(data, 'paid'), status: 'Confirmed' });
  }}>
    <div className="form-grid"><FormField label="Customer"><select required name="customerId">{store.customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></FormField><FormField label="Amount paid now"><input min="0" max={total} type="number" name="paid" defaultValue="0" /></FormField></div>
    <div className="order-lines"><div className="order-lines-title"><strong>Invoice items</strong><Button type="button" size="sm" variant="secondary" onClick={() => setItems((current) => [...current, { productId: store.products[0]?.id ?? '', quantity: 1, price: store.products[0]?.sellingPrice ?? 0 }])}><Plus size={14} />Add row</Button></div>
      {items.map((item, index) => <div className="order-line" key={`${index}-${item.productId}`}><select value={item.productId} onChange={(event) => setProduct(index, event.target.value)}>{store.products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select><input type="number" min="1" value={item.quantity} onChange={(event) => setQuantity(index, Number(event.target.value))} /><span>{currency(item.price * item.quantity)}</span><button type="button" onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))} disabled={items.length === 1}><Minus size={15} /></button></div>)}
    </div>
    <div className="invoice-calculation"><label>Discount %<input type="number" min="0" max="100" value={discount} onChange={(event) => setDiscount(Number(event.target.value))} /></label><label>GST %<input type="number" min="0" value={gst} onChange={(event) => setGst(Number(event.target.value))} /></label><div><span>Subtotal {currency(orderSubtotal(items))}</span><strong>Total {currency(total)}</strong></div></div>
    <div className="modal-footer"><Button variant="secondary" type="button" onClick={onClose}>Cancel</Button><Button type="submit">Create invoice</Button></div>
  </form></Modal>;
}

export function PaymentForm({ store, onClose, onSave }: { store: BusinessStore; onClose: () => void; onSave: (payment: Payment) => void }) {
  return <Modal title="Record payment" subtitle="Log a customer collection and update the pending balance." onClose={onClose}><form className="modal-form" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); onSave({ id: `pay-${Date.now()}`, customerId: value(data, 'customerId'), amount: numberValue(data, 'amount'), mode: value(data, 'mode') as Payment['mode'], date: today(), status: 'Paid' }); }}>
    <div className="form-grid"><FormField label="Customer"><select required name="customerId">{store.customers.filter((item) => item.balance > 0).map((customer) => <option key={customer.id} value={customer.id}>{customer.name} · {currency(customer.balance)} due</option>)}</select></FormField><FormField label="Amount received"><input required min="1" type="number" name="amount" /></FormField><FormField label="Payment mode"><select name="mode"><option>Cash</option><option>UPI</option><option>Bank</option><option>Credit</option></select></FormField></div>
    <div className="modal-footer"><Button variant="secondary" type="button" onClick={onClose}>Cancel</Button><Button type="submit">Record collection</Button></div>
  </form></Modal>;
}

export function SupplierForm({ onClose, onSave }: { onClose: () => void; onSave: (supplier: Supplier) => void }) {
  return <Modal title="Add supplier" subtitle="Save vendor contact and payable information." onClose={onClose}><form className="modal-form" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); onSave({ id: `sup-${Date.now()}`, name: value(data, 'name'), contact: value(data, 'contact'), category: value(data, 'category'), pending: numberValue(data, 'pending'), purchases: numberValue(data, 'purchases'), lastOrder: today() }); }}>
    <div className="form-grid"><FormField label="Supplier name"><input required name="name" /></FormField><FormField label="Phone number"><input required name="contact" /></FormField><FormField label="Category"><input required name="category" placeholder="Hardware" /></FormField><FormField label="Opening payable"><input min="0" type="number" name="pending" defaultValue="0" /></FormField><FormField label="Historical purchases"><input min="0" type="number" name="purchases" defaultValue="0" /></FormField></div>
    <div className="modal-footer"><Button variant="secondary" type="button" onClick={onClose}>Cancel</Button><Button type="submit">Add supplier</Button></div>
  </form></Modal>;
}

export function DeliveryForm({ store, onClose, onSave }: { store: BusinessStore; onClose: () => void; onSave: (delivery: Delivery) => void }) {
  return <Modal title="Schedule delivery" subtitle="Assign the address, route and responsible staff member." onClose={onClose}><form className="modal-form" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); const orderId = value(data, 'orderId'); onSave({ id: `del-${Date.now()}`, orderId, customerId: store.orders.find((item) => item.id === orderId)?.customerId ?? '', address: value(data, 'address'), village: value(data, 'village') || undefined, date: value(data, 'date'), assignee: value(data, 'assignee'), status: 'Scheduled' }); }}>
    <div className="form-grid"><FormField label="Order"><select required name="orderId">{store.orders.filter((item) => item.status !== 'Cancelled').map((order) => <option key={order.id} value={order.id}>{order.invoiceNo}</option>)}</select></FormField><FormField label="Delivery date"><input required type="date" name="date" defaultValue={today()} /></FormField><FormField label="Address"><input required name="address" /></FormField><FormField label="Nearby village (optional)"><input name="village" /></FormField><FormField label="Assigned staff"><select name="assignee">{store.staff.map((member) => <option key={member.id}>{member.name}</option>)}</select></FormField></div>
    <div className="modal-footer"><Button variant="secondary" type="button" onClick={onClose}>Cancel</Button><Button type="submit">Schedule delivery</Button></div>
  </form></Modal>;
}

export function StaffForm({ onClose, onSave }: { onClose: () => void; onSave: (member: StaffMember) => void }) {
  return <Modal title="Add staff member" subtitle="Set a role, task and permission profile." onClose={onClose}><form className="modal-form" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); onSave({ id: `stf-${Date.now()}`, name: value(data, 'name'), phone: value(data, 'phone'), role: value(data, 'role'), attendance: 'Present', task: value(data, 'task'), access: value(data, 'access') }); }}>
    <div className="form-grid"><FormField label="Full name"><input required name="name" /></FormField><FormField label="Phone number"><input required name="phone" /></FormField><FormField label="Role"><input required name="role" placeholder="Store Assistant" /></FormField><FormField label="Assigned task"><input required name="task" /></FormField><FormField label="Access permissions"><select name="access"><option>Inventory only</option><option>Delivery only</option><option>Billing + Payments</option><option>Inventory + Delivery</option><option>Administrator</option></select></FormField></div>
    <div className="modal-footer"><Button variant="secondary" type="button" onClick={onClose}>Cancel</Button><Button type="submit">Add staff member</Button></div>
  </form></Modal>;
}
