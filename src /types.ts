/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface InvoiceItem {
  id: string;
  name: string;
  sku?: string;
  hsn?: string;
  rate: number;
  quantity: number;
  gstRate: number; // percentage, e.g., 5, 12, 18, 28
  discount: number; // percentage
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerPhone?: string;
  customerGstin?: string;
  items: InvoiceItem[];
  subtotal: number; // sum of taxableValues
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  discountTotal: number;
  totalAmount: number;
  paymentMethod: 'Cash' | 'UPI' | 'Bank Transfer' | 'Due';
  paymentStatus: 'Paid' | 'Unpaid' | 'Partially Paid';
  amountPaid: number;
  notes?: string;
}

export interface Product {
  id: string;
  name: string;
  sku?: string;
  hsn?: string;
  stock: number;
  minStockAlert: number;
  unit: 'pcs' | 'kgs' | 'ltrs' | 'box' | 'pack' | 'bags';
  purchasePrice: number;
  salePrice: number;
  gstRate: number; // percentage, e.g., 0, 5, 12, 18, 28
  category: string;
  supplierName?: string;
}

export type TransactionType = 'Credit' | 'Debit' | 'Payment';

export interface LedgerEntry {
  id: string;
  date: string;
  customerName: string;
  customerPhone?: string;
  type: TransactionType; // Credit: sales on credit (udhaar), Debit: purchases on credit, Payment: customer paying off arrears
  amount: number;
  relatedInvoiceId?: string;
  notes?: string;
}

export interface CustomerDetail {
  id: string;
  name: string;
  phone?: string;
  netUdhaar: number;
  lastTransactionDate?: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  notes?: string;
  reminderCount: number;
  dueDate?: string;
}

export interface CustomerSummary {
  name: string;
  phone?: string;
  netUdhaar: number; // positive means they owe us (Credit/outstanding)
  lastTransactionDate?: string;
}

export interface CashTransaction {
  id: string;
  date: string;
  type: 'In' | 'Out';
  category: 'Sales' | 'Purchase' | 'Expenses' | 'Udhaar Payment' | 'Other';
  amount: number;
  description: string;
}

export interface BusinessStats {
  totalSales: number;
  totalExpenses: number;
  totalUdhaarOutstanding: number; // customer receivables
  netProfit: number;
  cashInHand: number;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface UserProfile {
  fullName: string;
  shopName: string;
  emailOrMobile: string;
  businessType: string;
  isFresh?: boolean;
}

export interface ActionItem {
  id: string;
  title: string;
  category: 'Overdue' | 'Low Stock' | 'General';
  done: boolean;
  refId?: string;
}

