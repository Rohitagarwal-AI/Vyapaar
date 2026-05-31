export type PageId =
  | 'dashboard'
  | 'inventory'
  | 'customers'
  | 'orders'
  | 'payments'
  | 'suppliers'
  | 'delivery'
  | 'staff'
  | 'analytics'
  | 'reports'
  | 'settings';

export type PaymentMode = 'Cash' | 'UPI' | 'Bank' | 'Credit';
export type OrderStatus = 'Pending' | 'Confirmed' | 'Delivered' | 'Cancelled';
export type PaymentStatus = 'Paid' | 'Partial' | 'Overdue' | 'Pending';
export type DeliveryStatus = 'Scheduled' | 'Out for delivery' | 'Delivered' | 'Delayed';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  minStock: number;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  supplierId: string;
  gst: number;
  sold: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  location: string;
  balance: number;
  creditLimit: number;
  totalPurchases: number;
  lastPurchase: string;
  reminderCount: number;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  invoiceNo: string;
  customerId: string;
  date: string;
  items: OrderItem[];
  discount: number;
  gst: number;
  total: number;
  paid: number;
  status: OrderStatus;
}

export interface Payment {
  id: string;
  customerId: string;
  orderId?: string;
  amount: number;
  mode: PaymentMode;
  date: string;
  dueDate?: string;
  status: PaymentStatus;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  category: string;
  pending: number;
  purchases: number;
  lastOrder: string;
}

export interface Delivery {
  id: string;
  orderId: string;
  customerId: string;
  address: string;
  village?: string;
  date: string;
  assignee: string;
  status: DeliveryStatus;
}

export interface StaffMember {
  id: string;
  name: string;
  phone: string;
  role: string;
  attendance: 'Present' | 'Absent' | 'Half day';
  task: string;
  access: string;
}

export interface ShopSettings {
  shopName: string;
  ownerName: string;
  phone: string;
  gstin: string;
  address: string;
  lowStockAlerts: boolean;
  paymentReminders: boolean;
  dailySummary: boolean;
}

export interface BusinessStore {
  products: Product[];
  customers: Customer[];
  orders: Order[];
  payments: Payment[];
  suppliers: Supplier[];
  deliveries: Delivery[];
  staff: StaffMember[];
  settings: ShopSettings;
}
