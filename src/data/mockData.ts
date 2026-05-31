import type { BusinessStore } from '../types';

export const initialStore: BusinessStore = {
  settings: {
    shopName: 'Mohit Plywood & Hardware',
    ownerName: 'Mohit Agarwal',
    phone: '+91 98765 43210',
    gstin: '08ABCDE1234F1Z5',
    address: 'Station Road, Sikar, Rajasthan',
    lowStockAlerts: true,
    paymentReminders: true,
    dailySummary: true,
  },
  suppliers: [
    { id: 'sup-1', name: 'Greenlam Industries', contact: '+91 98111 22001', category: 'Laminates', pending: 18400, purchases: 128000, lastOrder: '2026-05-27' },
    { id: 'sup-2', name: 'Century Ply Depot', contact: '+91 99288 11872', category: 'Plywood', pending: 0, purchases: 164500, lastOrder: '2026-05-24' },
    { id: 'sup-3', name: 'Hettich Channel Partner', contact: '+91 97833 56042', category: 'Hardware', pending: 27650, purchases: 87500, lastOrder: '2026-05-29' },
    { id: 'sup-4', name: 'Local Timber House', contact: '+91 94140 22190', category: 'Wood & Boards', pending: 8400, purchases: 61200, lastOrder: '2026-05-18' },
  ],
  products: [
    { id: 'prd-1', name: 'Century Sainik MR Plywood 18mm', sku: 'PLY-CEN-18', category: 'Plywood', stock: 38, minStock: 12, unit: 'sheets', purchasePrice: 1460, sellingPrice: 1740, supplierId: 'sup-2', gst: 18, sold: 84 },
    { id: 'prd-2', name: 'Greenlam Walnut Laminate 1mm', sku: 'LAM-GRN-W01', category: 'Laminates', stock: 7, minStock: 15, unit: 'sheets', purchasePrice: 820, sellingPrice: 1050, supplierId: 'sup-1', gst: 18, sold: 63 },
    { id: 'prd-3', name: 'Hettich Soft Close Channel 18"', sku: 'HDW-HET-18', category: 'Hardware', stock: 11, minStock: 20, unit: 'sets', purchasePrice: 540, sellingPrice: 690, supplierId: 'sup-3', gst: 18, sold: 96 },
    { id: 'prd-4', name: 'Fevicol SH Adhesive 5kg', sku: 'ADH-FEV-05', category: 'Adhesives', stock: 24, minStock: 10, unit: 'buckets', purchasePrice: 990, sellingPrice: 1180, supplierId: 'sup-4', gst: 18, sold: 42 },
    { id: 'prd-5', name: 'MDF Board Interior Grade 18mm', sku: 'BRD-MDF-18', category: 'Boards', stock: 19, minStock: 10, unit: 'sheets', purchasePrice: 1260, sellingPrice: 1510, supplierId: 'sup-4', gst: 18, sold: 51 },
    { id: 'prd-6', name: 'Ebco Cabinet Handle Matte Black', sku: 'HDW-EBC-BLK', category: 'Hardware', stock: 6, minStock: 18, unit: 'pcs', purchasePrice: 160, sellingPrice: 245, supplierId: 'sup-3', gst: 18, sold: 118 },
    { id: 'prd-7', name: 'PVC Edge Band White 22mm', sku: 'EDG-PVC-W22', category: 'Edge Bands', stock: 45, minStock: 15, unit: 'rolls', purchasePrice: 310, sellingPrice: 430, supplierId: 'sup-1', gst: 18, sold: 37 },
    { id: 'prd-8', name: 'Century Club Prime Plywood 12mm', sku: 'PLY-CEN-12', category: 'Plywood', stock: 28, minStock: 10, unit: 'sheets', purchasePrice: 1220, sellingPrice: 1480, supplierId: 'sup-2', gst: 18, sold: 72 },
  ],
  customers: [
    { id: 'cus-1', name: 'Sharma Furniture Works', phone: '+91 98290 11472', location: 'Piprali Road', balance: 32600, creditLimit: 50000, totalPurchases: 184500, lastPurchase: '2026-05-31', reminderCount: 1 },
    { id: 'cus-2', name: 'Balaji Interior Studio', phone: '+91 99822 54018', location: 'Fatehpur Road', balance: 0, creditLimit: 75000, totalPurchases: 246800, lastPurchase: '2026-05-30', reminderCount: 0 },
    { id: 'cus-3', name: 'Raj Woodcraft', phone: '+91 94147 80812', location: 'Danta Ramgarh', balance: 18750, creditLimit: 30000, totalPurchases: 96250, lastPurchase: '2026-05-28', reminderCount: 2 },
    { id: 'cus-4', name: 'Aarav Modular Kitchens', phone: '+91 97995 32161', location: 'Laxmangarh', balance: 45200, creditLimit: 60000, totalPurchases: 212400, lastPurchase: '2026-05-26', reminderCount: 3 },
    { id: 'cus-5', name: 'Walk-in Customer', phone: '+91 90000 00000', location: 'Sikar', balance: 0, creditLimit: 0, totalPurchases: 28400, lastPurchase: '2026-05-31', reminderCount: 0 },
  ],
  orders: [
    { id: 'ord-1', invoiceNo: 'INV-260531-104', customerId: 'cus-1', date: '2026-05-31', items: [{ productId: 'prd-1', quantity: 8, price: 1740 }, { productId: 'prd-3', quantity: 6, price: 690 }], discount: 3, gst: 18, total: 20684, paid: 10000, status: 'Confirmed' },
    { id: 'ord-2', invoiceNo: 'INV-260531-103', customerId: 'cus-5', date: '2026-05-31', items: [{ productId: 'prd-6', quantity: 12, price: 245 }, { productId: 'prd-4', quantity: 2, price: 1180 }], discount: 0, gst: 18, total: 6254, paid: 6254, status: 'Delivered' },
    { id: 'ord-3', invoiceNo: 'INV-260530-102', customerId: 'cus-2', date: '2026-05-30', items: [{ productId: 'prd-8', quantity: 12, price: 1480 }, { productId: 'prd-2', quantity: 8, price: 1050 }], discount: 5, gst: 18, total: 29319, paid: 29319, status: 'Delivered' },
    { id: 'ord-4', invoiceNo: 'INV-260528-101', customerId: 'cus-3', date: '2026-05-28', items: [{ productId: 'prd-5', quantity: 10, price: 1510 }, { productId: 'prd-7', quantity: 4, price: 430 }], discount: 2, gst: 18, total: 19455, paid: 8000, status: 'Confirmed' },
    { id: 'ord-5', invoiceNo: 'INV-260526-100', customerId: 'cus-4', date: '2026-05-26', items: [{ productId: 'prd-1', quantity: 14, price: 1740 }, { productId: 'prd-4', quantity: 3, price: 1180 }], discount: 4, gst: 18, total: 31609, paid: 0, status: 'Pending' },
  ],
  payments: [
    { id: 'pay-1', customerId: 'cus-5', orderId: 'ord-2', amount: 6254, mode: 'UPI', date: '2026-05-31', status: 'Paid' },
    { id: 'pay-2', customerId: 'cus-1', orderId: 'ord-1', amount: 10000, mode: 'Bank', date: '2026-05-31', dueDate: '2026-06-07', status: 'Partial' },
    { id: 'pay-3', customerId: 'cus-2', orderId: 'ord-3', amount: 29319, mode: 'UPI', date: '2026-05-30', status: 'Paid' },
    { id: 'pay-4', customerId: 'cus-3', orderId: 'ord-4', amount: 8000, mode: 'Cash', date: '2026-05-28', dueDate: '2026-06-03', status: 'Partial' },
    { id: 'pay-5', customerId: 'cus-4', orderId: 'ord-5', amount: 0, mode: 'Credit', date: '2026-05-26', dueDate: '2026-05-30', status: 'Overdue' },
  ],
  deliveries: [
    { id: 'del-1', orderId: 'ord-1', customerId: 'cus-1', address: 'Sharma Furniture, Piprali Road', date: '2026-06-01', assignee: 'Rakesh Kumar', status: 'Scheduled' },
    { id: 'del-2', orderId: 'ord-3', customerId: 'cus-2', address: 'Balaji Interior Studio, Fatehpur Road', date: '2026-05-30', assignee: 'Vikram Singh', status: 'Delivered' },
    { id: 'del-3', orderId: 'ord-4', customerId: 'cus-3', address: 'Raj Woodcraft Workshop', village: 'Danta Ramgarh', date: '2026-06-01', assignee: 'Rakesh Kumar', status: 'Out for delivery' },
    { id: 'del-4', orderId: 'ord-5', customerId: 'cus-4', address: 'Aarav Kitchens Site', village: 'Laxmangarh', date: '2026-06-02', assignee: 'Vikram Singh', status: 'Scheduled' },
  ],
  staff: [
    { id: 'stf-1', name: 'Rakesh Kumar', phone: '+91 96104 11024', role: 'Delivery Executive', attendance: 'Present', task: 'Danta Ramgarh delivery route', access: 'Delivery only' },
    { id: 'stf-2', name: 'Vikram Singh', phone: '+91 98282 31147', role: 'Store Assistant', attendance: 'Present', task: 'Prepare dispatch for Aarav Kitchens', access: 'Inventory + Delivery' },
    { id: 'stf-3', name: 'Deepak Saini', phone: '+91 97855 40192', role: 'Billing Manager', attendance: 'Half day', task: 'Reconcile May payment ledger', access: 'Billing + Payments' },
    { id: 'stf-4', name: 'Manoj Jangid', phone: '+91 95091 77308', role: 'Warehouse Helper', attendance: 'Absent', task: 'Stock count: hardware aisle', access: 'Inventory only' },
  ],
};
