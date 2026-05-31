/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, Invoice, LedgerEntry, CashTransaction } from '../types';

// Pre-seeded products
export const initialProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Aashirvaad Shudh Chakki Atta (10kg)',
    sku: 'ATA-AAS-10',
    hsn: '1101',
    stock: 25,
    minStockAlert: 8,
    unit: 'bags',
    purchasePrice: 380,
    salePrice: 440,
    gstRate: 0, // wheat flour GST is 0% if unbranded or generic raw, standard brands can be 5% if packed/branded. Let's say 0% for simple retail unpacked or prepackaged raw.
    category: 'Groceries'
  },
  {
    id: 'prod-2',
    name: 'Fortune Mustard Oil (1 Ltr)',
    sku: 'OIL-FOR-01',
    hsn: '1514',
    stock: 4, // Low Stock Alert Triggered!
    minStockAlert: 15,
    unit: 'pcs',
    purchasePrice: 145,
    salePrice: 175,
    gstRate: 5,
    category: 'Oil & Ghee'
  },
  {
    id: 'prod-3',
    name: 'Tata Salt Lite (1kg)',
    sku: 'SLT-TAT-01',
    hsn: '2501',
    stock: 45,
    minStockAlert: 10,
    unit: 'pcs',
    purchasePrice: 20,
    salePrice: 28,
    gstRate: 0,
    category: 'Groceries'
  },
  {
    id: 'prod-4',
    name: 'Daawat Rozana Basmati Rice (5kg)',
    sku: 'RIC-DAW-05',
    hsn: '1006',
    stock: 18,
    minStockAlert: 5,
    unit: 'bags',
    purchasePrice: 340,
    salePrice: 420,
    gstRate: 5,
    category: 'Groceries'
  },
  {
    id: 'prod-5',
    name: 'Surf Excel Easy Wash (1kg)',
    sku: 'DET-SUR-01',
    hsn: '3402',
    stock: 30,
    minStockAlert: 10,
    unit: 'pcs',
    purchasePrice: 110,
    salePrice: 140,
    gstRate: 18,
    category: 'Household'
  },
  {
    id: 'prod-6',
    name: 'Amul Masti Dahi (400g)',
    sku: 'DY-AMU-400',
    hsn: '0403',
    stock: 2, // Low stock!
    minStockAlert: 10,
    unit: 'pcs',
    purchasePrice: 28,
    salePrice: 35,
    gstRate: 5,
    category: 'Dairy & Bakery'
  },
  {
    id: 'prod-7',
    name: 'Haldirams Bhujia Sev (400g)',
    sku: 'SNK-HAL-400',
    hsn: '2106',
    stock: 50,
    minStockAlert: 15,
    unit: 'pcs',
    purchasePrice: 85,
    salePrice: 110,
    gstRate: 12,
    category: 'Snacks & Packaged'
  },
  {
    id: 'prod-8',
    name: 'Colgate MaxFresh Paste (150g)',
    sku: 'HC-COL-150',
    hsn: '3306',
    stock: 40,
    minStockAlert: 12,
    unit: 'pcs',
    purchasePrice: 75,
    salePrice: 98,
    gstRate: 18,
    category: 'Personal Care'
  },
  {
    id: 'prod-9',
    name: 'Tata Tea Premium (1kg)',
    sku: 'TEA-TAT-1K',
    hsn: '0902',
    stock: 14,
    minStockAlert: 8,
    unit: 'pcs',
    purchasePrice: 320,
    salePrice: 390,
    gstRate: 5,
    category: 'Groceries'
  },
  {
    id: 'prod-10',
    name: 'Cadbury Dairy Milk Silk (60g)',
    sku: 'CHO-CAD-60',
    hsn: '1806',
    stock: 35,
    minStockAlert: 10,
    unit: 'pcs',
    purchasePrice: 62,
    salePrice: 80,
    gstRate: 18,
    category: 'Snacks & Packaged'
  }
];

// Pre-seeded invoices (spanning recent dates)
export const initialInvoices: Invoice[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'INV-2026-001',
    date: '2026-05-15',
    customerName: 'Ramesh Sharma',
    customerPhone: '9876543210',
    items: [
      {
        id: 'item-1',
        name: 'Aashirvaad Shudh Chakki Atta (10kg)',
        sku: 'ATA-AAS-10',
        hsn: '1101',
        rate: 440,
        quantity: 2,
        gstRate: 0,
        discount: 5, // 5% discount
        taxableValue: 836, // (440 * 2) = 880, discount = 44, taxable = 836
        cgst: 0,
        sgst: 0,
        igst: 0,
        total: 836
      },
      {
        id: 'item-2',
        name: 'Fortune Mustard Oil (1 Ltr)',
        sku: 'OIL-FOR-01',
        hsn: '1514',
        rate: 175,
        quantity: 5,
        gstRate: 5,
        discount: 0,
        taxableValue: 875, // 175 * 5 = 875
        cgst: 21.88, // 2.5% of 875
        sgst: 21.88, // 2.5% of 875
        igst: 0,
        total: 918.76 // 875 + 43.76 = 918.76
      }
    ],
    subtotal: 1711,
    cgstTotal: 21.88,
    sgstTotal: 21.88,
    igstTotal: 0,
    discountTotal: 44,
    totalAmount: 1754.76,
    paymentMethod: 'UPI',
    paymentStatus: 'Paid',
    amountPaid: 1754.76,
    notes: 'Paid immediately via PhonePe'
  },
  {
    id: 'inv-2',
    invoiceNumber: 'INV-2026-002',
    date: '2026-05-20',
    customerName: 'Suneeta Devi',
    customerPhone: '9414012345',
    items: [
      {
        id: 'item-3',
        name: 'Daawat Rozana Basmati Rice (5kg)',
        sku: 'RIC-DAW-05',
        hsn: '1006',
        rate: 420,
        quantity: 1,
        gstRate: 5,
        discount: 0,
        taxableValue: 420,
        cgst: 10.5,
        sgst: 10.5,
        igst: 0,
        total: 441
      },
      {
        id: 'item-4',
        name: 'Surf Excel Easy Wash (1kg)',
        sku: 'DET-SUR-01',
        hsn: '3402',
        rate: 140,
        quantity: 2,
        gstRate: 18,
        discount: 10, // 10% disc
        taxableValue: 252, // 280 - 28 = 252
        cgst: 22.68, // 9% of 252
        sgst: 22.68, // 9% of 252
        igst: 0,
        total: 297.36 // 252 + 45.36
      }
    ],
    subtotal: 672,
    cgstTotal: 33.18,
    sgstTotal: 33.18,
    igstTotal: 0,
    discountTotal: 28,
    totalAmount: 738.36,
    paymentMethod: 'Due', // Taken on Credit (Udhaar)
    paymentStatus: 'Unpaid',
    amountPaid: 0,
    notes: 'Pending udhaar payment. Added to Ledger Book.'
  },
  {
    id: 'inv-3',
    invoiceNumber: 'INV-2026-003',
    date: '2026-05-24',
    customerName: 'Ramesh Sharma',
    customerPhone: '9876543210',
    items: [
      {
        id: 'item-5',
        name: 'Tata Tea Premium (1kg)',
        sku: 'TEA-TAT-1K',
        hsn: '0902',
        rate: 390,
        quantity: 1,
        gstRate: 5,
        discount: 0,
        taxableValue: 390,
        cgst: 9.75,
        sgst: 9.75,
        igst: 0,
        total: 409.5
      },
      {
        id: 'item-6',
        name: 'Haldirams Bhujia Sev (400g)',
        sku: 'SNK-HAL-400',
        hsn: '2106',
        rate: 110,
        quantity: 3,
        gstRate: 12,
        discount: 5,
        taxableValue: 313.5, // 330 - 16.5 = 313.5
        cgst: 18.81, // 6% of 313.5
        sgst: 18.81, // 6% of 313.5
        igst: 0,
        total: 351.12 // 313.5 + 37.62
      }
    ],
    subtotal: 703.5,
    cgstTotal: 28.56,
    sgstTotal: 28.56,
    igstTotal: 0,
    discountTotal: 16.5,
    totalAmount: 760.62,
    paymentMethod: 'Due', // Shared Credit (Udhaar)
    paymentStatus: 'Partially Paid',
    amountPaid: 300,
    notes: 'Paid 300 Rs cash, remaining 460.62 Rs is recorded as Udhaar.'
  }
];

// Pre-seeded customer outstanding Udhaar ledger
export const initialLedger: LedgerEntry[] = [
  // Ramesh owes 460.62 from Invoice 3
  {
    id: 'led-1',
    date: '2026-05-24',
    customerName: 'Ramesh Sharma',
    customerPhone: '9876543210',
    type: 'Credit',
    amount: 460.62,
    relatedInvoiceId: 'inv-3',
    notes: 'Outstanding balance from Invoice INV-2026-003'
  },
  // Suneeta Devi owes 738.36 from Invoice 2
  {
    id: 'led-2',
    date: '2026-05-20',
    customerName: 'Suneeta Devi',
    customerPhone: '9414012345',
    type: 'Credit',
    amount: 738.36,
    relatedInvoiceId: 'inv-2',
    notes: 'Full amount credit from Invoice INV-2026-002'
  },
  // Rajeev Verma took raw goods on credit without specific formal invoice earlier
  {
    id: 'led-3',
    date: '2026-05-18',
    customerName: 'Rajeev Verma',
    customerPhone: '9988776655',
    type: 'Credit',
    amount: 1500,
    notes: 'Bulk purchase of Rice and Oil bags recorded on quick book'
  },
  // Ramesh paid back some older historic udhaar
  {
    id: 'led-4',
    date: '2026-05-25',
    customerName: 'Ramesh Sharma',
    customerPhone: '9876543210',
    type: 'Payment',
    amount: 500,
    notes: 'Paid back cash towards old dairy and grains bill'
  }
];

// Pre-seeded Cash transactions spanning general business actions (rent, stock buy, sales collect)
export const initialCashBook: CashTransaction[] = [
  {
    id: 'cash-1',
    date: '2026-05-01',
    type: 'Out',
    category: 'Expenses',
    amount: 8500,
    description: 'Monthly Kirana Shop Rent paid to houseowner'
  },
  {
    id: 'cash-2',
    date: '2026-05-05',
    type: 'Out',
    category: 'Purchase',
    amount: 12000,
    description: 'Bought bulk stock from wholesale distributor (Atta bags, oil)'
  },
  {
    id: 'cash-3',
    date: '2026-05-15',
    type: 'In',
    category: 'Sales',
    amount: 1754.76,
    description: 'Invoice INV-2026-001 PhonePe UPI received'
  },
  {
    id: 'cash-4',
    date: '2026-05-24',
    type: 'In',
    category: 'Sales',
    amount: 300,
    description: 'Partial payment received on Invoice INV-2026-003'
  },
  {
    id: 'cash-5',
    date: '2026-05-25',
    type: 'In',
    category: 'Udhaar Payment',
    amount: 500,
    description: 'Cash payment clearing old accounts from Ramesh Sharma'
  },
  {
    id: 'cash-6',
    date: '2026-05-26',
    type: 'Out',
    category: 'Expenses',
    amount: 450,
    description: 'kirana Electricity Bill payment'
  }
];
