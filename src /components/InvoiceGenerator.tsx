/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  FileCheck, 
  Printer, 
  RefreshCcw, 
  Share2, 
  CheckCircle,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { Product, Invoice, InvoiceItem } from '../types';

interface InvoiceGeneratorProps {
  products: Product[];
  invoices: Invoice[];
  onSaveInvoice: (invoice: Invoice) => void;
  onNavigate: (tab: string) => void;
}

export default function InvoiceGenerator({
  products,
  invoices,
  onSaveInvoice,
  onNavigate
}: InvoiceGeneratorProps) {
  const currentShopName = (() => {
    try {
      const local = localStorage.getItem('vyapaar_session_user');
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed?.shopName) return parsed.shopName;
      }
    } catch (e) {}
    return "Saraswati Kirana & General Store";
  })();

  const currentBusinessType = (() => {
    try {
      const local = localStorage.getItem('vyapaar_session_user');
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed?.businessType) return parsed.businessType;
      }
    } catch (e) {}
    return "Kirana & General Provisions Store";
  })();

  // Client info
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerGstin, setCustomerGstin] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Due'>('Cash');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Cart / Line items
  const [lineItems, setLineItems] = useState<Partial<InvoiceItem>[]>([
    { id: '1', name: '', sku: '', hsn: '', rate: 0, quantity: 1, gstRate: 0, discount: 0 }
  ]);

  const [savedInvoice, setSavedInvoice] = useState<Invoice | null>(null);
  const [showPrintView, setShowPrintView] = useState(false);

  // Generate unique Invoice Number
  useEffect(() => {
    const year = new Date().getFullYear();
    const count = invoices.length + 1;
    const formattedCount = String(count).padStart(3, '0');
    setInvoiceNumber(`INV-${year}-${formattedCount}`);
  }, [invoices]);

  // Handle product selection in a row
  const handleProductSelect = (rowIndex: number, productId: string) => {
    const selectedProd = products.find(p => p.id === productId);
    if (!selectedProd) return;

    const updated = [...lineItems];
    updated[rowIndex] = {
      ...updated[rowIndex],
      id: selectedProd.id,
      name: selectedProd.name,
      sku: selectedProd.sku,
      hsn: selectedProd.hsn,
      rate: selectedProd.salePrice,
      gstRate: selectedProd.gstRate,
      quantity: updated[rowIndex].quantity || 1,
      discount: updated[rowIndex].discount || 0
    };
    setLineItems(updated);
  };

  const handleRowChange = (rowIndex: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...lineItems];
    updated[rowIndex] = {
      ...updated[rowIndex],
      [field]: value
    };
    setLineItems(updated);
  };

  const addRow = () => {
    setLineItems([
      ...lineItems,
      { id: Date.now().toString(), name: '', sku: '', hsn: '', rate: 0, quantity: 1, gstRate: 0, discount: 0 }
    ]);
  };

  const removeRow = (index: number) => {
    if (lineItems.length === 1) {
      setLineItems([{ id: '1', name: '', sku: '', hsn: '', rate: 0, quantity: 1, gstRate: 0, discount: 0 }]);
      return;
    }
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  // Calculations for billing
  const calculateInvoiceTotals = () => {
    let subtotal = 0; // Taxable Amount after discounts
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;
    let discountTotal = 0;

    const processedItems: InvoiceItem[] = lineItems
      .filter(item => item.name && item.rate && item.quantity)
      .map((item, index) => {
        const rate = Number(item.rate) || 0;
        const qty = Number(item.quantity) || 0;
        const gstRate = Number(item.gstRate) || 0;
        const discPercentage = Number(item.discount) || 0;

        const grossTotal = rate * qty;
        const discountAmount = grossTotal * (discPercentage / 100);
        discountTotal += discountAmount;

        const taxableValue = grossTotal - discountAmount;
        subtotal += taxableValue;

        // In-state GST splitting (Standard SGST & CGST)
        const totalTaxAmount = taxableValue * (gstRate / 100);
        const cgst = totalTaxAmount / 2;
        const sgst = totalTaxAmount / 2;
        
        cgstTotal += cgst;
        sgstTotal += sgst;

        const itemTotal = taxableValue + totalTaxAmount;

        return {
          id: item.id || `custom-${index}`,
          name: item.name!,
          sku: item.sku || '',
          hsn: item.hsn || '',
          rate,
          quantity: qty,
          gstRate,
          discount: discPercentage,
          taxableValue,
          cgst,
          sgst,
          igst: 0,
          total: itemTotal
        };
      });

    const totalAmount = subtotal + cgstTotal + sgstTotal;

    return {
      processedItems,
      subtotal,
      cgstTotal,
      sgstTotal,
      igstTotal,
      discountTotal,
      totalAmount
    };
  };

  const { processedItems, subtotal, cgstTotal, sgstTotal, igstTotal, discountTotal, totalAmount } = calculateInvoiceTotals();

  // Set default paid sum depending on payment method
  useEffect(() => {
    if (paymentMethod === 'Due') {
      setAmountPaid(0);
    } else {
      // Auto fill full payment
      setAmountPaid(Math.round(totalAmount * 100) / 100);
    }
  }, [paymentMethod, totalAmount]);

  // Handle final submission to state
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      alert('Please fill customer name before issuing details.');
      return;
    }

    if (processedItems.length === 0) {
      alert('Invoice must contain at least 1 validated product row.');
      return;
    }

    let paymentStatus: 'Paid' | 'Unpaid' | 'Partially Paid' = 'Paid';
    if (paymentMethod === 'Due') {
      paymentStatus = 'Unpaid';
    } else if (amountPaid < totalAmount - 0.5) {
      paymentStatus = amountPaid > 0 ? 'Partially Paid' : 'Unpaid';
    }

    const finalInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      date,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || undefined,
      customerGstin: customerGstin.trim() || undefined,
      items: processedItems,
      subtotal,
      cgstTotal,
      sgstTotal,
      igstTotal,
      discountTotal,
      totalAmount,
      paymentMethod,
      paymentStatus,
      amountPaid,
      notes: notes.trim() || undefined
    };

    onSaveInvoice(finalInvoice);
    setSavedInvoice(finalInvoice);
    setShowPrintView(true);
  };

  const resetForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setCustomerGstin('');
    setPaymentMethod('Cash');
    setNotes('');
    setLineItems([{ id: '1', name: '', sku: '', hsn: '', rate: 0, quantity: 1, gstRate: 0, discount: 0 }]);
    setSavedInvoice(null);
    setShowPrintView(false);
  };

  const triggerPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {!showPrintView ? (
        <form onSubmit={handleSave} className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden">
          {/* Header */}
          <div className="bg-slate-55 border-b border-slate-100 p-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="text-indigo-600" size={20} />
              <h3 className="font-bold text-slate-800 text-base">GST-Compliant Billing Terminal</h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block uppercase font-bold">Bill Number</span>
              <span className="text-sm font-mono font-bold text-slate-700">{invoiceNumber}</span>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Customer Details Segment */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Customer Name (Grahak Naam) *</label>
                <input 
                  type="text" 
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Ramesh Sharma" 
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-hidden focus:border-indigo-500 text-slate-700 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Phone Number</label>
                <input 
                  type="text" 
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="10 digit mobile" 
                  maxLength={10}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-hidden focus:border-indigo-500 text-slate-700 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Customer GSTIN (Optional)</label>
                <input 
                  type="text" 
                  value={customerGstin}
                  onChange={(e) => setCustomerGstin(e.target.value.toUpperCase())}
                  placeholder="08XXXXX0000X0Z0" 
                  maxLength={15}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-hidden focus:border-indigo-500 text-slate-700 font-mono tracking-widest uppercase"
                />
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Invoicing Table Grid */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Item Details & Calculations</h4>
                <button 
                  type="button" 
                  onClick={addRow}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 border border-indigo-100 py-1.5 px-3 rounded-lg flex items-center gap-1 hover:bg-indigo-100/50 transition-colors"
                >
                  <Plus size={14} /> Add Dry Goods Row
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <th className="pb-2 w-[35%]">Select Product</th>
                      <th className="pb-2 text-center w-[10%]">HSN</th>
                      <th className="pb-2 text-right w-[12%]">Rate (₹)</th>
                      <th className="pb-2 text-center w-[10%]">Quantity</th>
                      <th className="pb-2 text-center w-[10%]">GST %</th>
                      <th className="pb-2 text-center w-[10%]">Discount %</th>
                      <th className="pb-2 text-right w-[15%]">Total (₹)</th>
                      <th className="pb-2 text-center w-[5%]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lineItems.map((item, idx) => (
                      <tr key={item.id || idx} className="align-middle py-2">
                        {/* Preseeded selector */}
                        <td className="py-3">
                          <select 
                            value={item.id && products.some(p => p.id === item.id) ? item.id : ''}
                            onChange={(e) => handleProductSelect(idx, e.target.value)}
                            className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-hidden focus:border-indigo-500 text-slate-700 font-medium bg-white"
                          >
                            <option value="">-- Choose Product to Bill --</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                                {p.name} {p.stock <= 0 ? '(OUT OF STOCK)' : `(Available: ${p.stock} ${p.unit})`}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* HSN code */}
                        <td className="py-3">
                          <input 
                            type="text" 
                            placeholder="HSN"
                            value={item.hsn || ''}
                            onChange={(e) => handleRowChange(idx, 'hsn', e.target.value)}
                            className="w-full text-xs text-center border border-slate-100 rounded-lg p-2 focus:outline-hidden focus:border-indigo-500 text-slate-500 font-mono"
                          />
                        </td>

                        {/* Rate */}
                        <td className="py-3">
                          <input 
                            type="number" 
                            min="0"
                            placeholder="0.00"
                            value={item.rate || ''}
                            onChange={(e) => handleRowChange(idx, 'rate', parseFloat(e.target.value) || 0)}
                            className="w-full text-xs text-right border border-slate-200 rounded-lg p-2 focus:outline-hidden focus:border-indigo-500 text-slate-700 font-mono font-medium"
                          />
                        </td>

                        {/* Qty */}
                        <td className="py-3">
                          <div className="flex items-center justify-center gap-1">
                            <input 
                              type="number" 
                              min="1"
                              value={item.quantity || 1}
                              onChange={(e) => handleRowChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                              className="w-[60px] text-xs text-center border border-slate-200 rounded-lg p-2 focus:outline-hidden focus:border-indigo-500 text-slate-755 font-mono font-bold"
                            />
                          </div>
                        </td>

                        {/* GST % */}
                        <td className="py-3">
                          <select 
                            value={item.gstRate || 0}
                            onChange={(e) => handleRowChange(idx, 'gstRate', parseInt(e.target.value))}
                            className="w-full text-xs text-center border border-slate-200 rounded-lg p-2 focus:outline-hidden focus:border-indigo-500 text-slate-600 bg-white"
                          >
                            <option value="0">0% (Nil)</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                            <option value="28">28%</option>
                          </select>
                        </td>

                        {/* Discount */}
                        <td className="py-3">
                          <input 
                            type="number" 
                            min="0"
                            max="100"
                            placeholder="%"
                            value={item.discount || ''}
                            onChange={(e) => handleRowChange(idx, 'discount', Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                            className="w-[80px] mx-auto text-xs text-center border border-slate-200 rounded-lg p-2 focus:outline-hidden focus:border-indigo-500 text-slate-600 font-mono"
                          />
                        </td>

                        {/* Total calculator */}
                        <td className="py-3 text-right font-mono font-bold text-slate-700 text-xs">
                          ₹{((item.rate || 0) * (item.quantity || 1) * (1 - (item.discount || 0) / 100) * (1 + (item.gstRate || 0) / 100)).toFixed(2)}
                        </td>

                        {/* Trash */}
                        <td className="py-3 text-center">
                          <button 
                            type="button" 
                            onClick={() => removeRow(idx)}
                            className="text-slate-300 hover:text-rose-500 p-1.5 rounded transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Calculations and payment section */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 align-top">
              {/* Left Form controls for dates/payment */}
              <div className="lg:col-span-3 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Billing Date</label>
                    <input 
                      type="date" 
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-hidden focus:border-indigo-500 text-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Payment Channel</label>
                    <select 
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-hidden focus:border-indigo-500 text-slate-700 font-semibold bg-white"
                    >
                      <option value="Cash">💵 Cash Money (Nagadi)</option>
                      <option value="UPI">📱 GPay / PhonePe / PayTM (UPI)</option>
                      <option value="Bank Transfer">🏦 Bank Account Transfer</option>
                      <option value="Due">⏳ Udhaar Outstanding (On Credit)</option>
                    </select>
                  </div>
                </div>

                {paymentMethod !== 'Due' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Amount Paid (₹)</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2.5 text-xs text-slate-400 font-mono font-semibold">₹</span>
                      <input 
                        type="number" 
                        step="0.01"
                        min="0"
                        max={totalAmount}
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(Math.min(totalAmount, parseFloat(e.target.value) || 0))}
                        className="w-full text-xs border border-slate-200 rounded-lg py-2 pl-6 pr-2.5 focus:outline-hidden focus:border-indigo-500 text-slate-700 font-mono font-semibold"
                      />
                    </div>
                    {amountPaid < totalAmount - 0.1 && (
                      <span className="text-[10px] text-amber-600 font-semibold mt-1 block">
                        ⚠️ Note: Rest amount of ₹{(totalAmount - amountPaid).toFixed(2)} will automatically settle into Customer's Credit Ledger (Udhaar).
                      </span>
                    )}
                  </div>
                )}

                {paymentMethod === 'Due' && (
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 flex items-start gap-2 text-amber-700 text-[11px]">
                    <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                    <p>
                      <strong>Automatic Ledger Sync:</strong> Customer has credit terms. Saving this bill automatically files an outstanding Credit record of <strong>₹{totalAmount.toFixed(2)}</strong> under Ramesh/Suneeta’s ledger profile so you can track outstanding balances.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Internal Book Notes</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Delivered grain sacks in hand. Customer agreed to settle by Sunday."
                    rows={2}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-hidden focus:border-indigo-500 text-slate-600"
                  />
                </div>
              </div>

              {/* Right Billing Financial Aggregates */}
              <div className="lg:col-span-2 bg-slate-50 border border-slate-100 rounded-xl p-5 space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest text-center border-b border-slate-200/50 pb-2 mb-2">Invoice Summary</h4>
                
                <div className="flex justify-between text-xs text-slate-650">
                  <span>Gross Subtotal:</span>
                  <span className="font-mono">₹{(subtotal + discountTotal).toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-xs text-rose-600">
                  <span>Merchant Discounts:</span>
                  <span className="font-mono">-₹{discountTotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-xs text-slate-650">
                  <span>Taxable Value:</span>
                  <span className="font-mono">₹{subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-xs text-slate-500">
                  <span>CGST (Central Tax):</span>
                  <span className="font-mono">₹{cgstTotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-xs text-slate-500">
                  <span>SGST (State Tax):</span>
                  <span className="font-mono">₹{sgstTotal.toFixed(2)}</span>
                </div>

                <div className="border-t border-dashed border-slate-300 my-2 pt-2 flex justify-between text-sm text-slate-800 font-bold">
                  <span>Total Amount Due:</span>
                  <span className="font-mono text-indigo-600 text-base">₹{totalAmount.toFixed(2)}</span>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-xs hover:shadow-md transition-all text-xs flex items-center justify-center gap-1.5 mt-4"
                >
                  <FileCheck size={16} /> Save & Generate Tax Invoice
                </button>
              </div>
            </div>

          </div>
        </form>
      ) : (
        /* Printable GST Tax Invoice Preview Card */
        <div className="space-y-4">
          <div className="flex items-center justify-between no-print bg-slate-50 border border-slate-100 p-4 rounded-xl">
            <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
              <CheckCircle size={15} className="text-emerald-500" />
              Invoice generated successfully! Ready to print or review.
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={resetForm}
                className="text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-55 p-2 px-3 rounded-lg flex items-center gap-1"
              >
                <RefreshCcw size={14} /> New Bill
              </button>
              <button 
                onClick={triggerPrint}
                className="text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 p-2 px-4 rounded-lg flex items-center gap-1 shadow-sm"
              >
                <Printer size={14} /> Print Bill
              </button>
            </div>
          </div>

          {/* Styled GST Invoice Sheet */}
          <div id="print-area" className="bg-white border-2 border-slate-200 rounded-xl p-8 max-w-4xl mx-auto shadow-sm text-sm text-slate-700 font-sans leading-relaxed">
            {/* Invoice Top Header */}
            <div className="flex flex-col md:flex-row justify-between border-b-2 border-slate-100 pb-6 mb-6">
              <div className="space-y-1 bg-gradient-to-r from-indigo-50/20 to-transparent p-2 rounded">
                <h2 className="text-xl font-extrabold text-slate-800 tracking-tight uppercase">{currentShopName}</h2>
                <p className="text-xs text-slate-505">{currentBusinessType}</p>
                <p className="text-[11px] text-slate-400 font-medium">B-12, Sector 5, Malviya Nagar, Jaipur, Rajasthan - 302017</p>
                <p className="text-[11px] text-slate-400 font-mono">GSTIN: 08AAPCS4228C1Z6 | GST Registered Merchant</p>
                <p className="text-[11px] text-slate-400">Mobile: +91 94140 XXXXX</p>
              </div>
              <div className="text-right mt-4 md:mt-0 space-y-1">
                <span className="font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded text-xs tracking-wider uppercase">Tax Invoice</span>
                <p className="text-xs font-bold text-slate-400 font-mono mt-2">Invoice No: <span className="text-slate-800 font-bold font-mono">{savedInvoice?.invoiceNumber}</span></p>
                <p className="text-xs text-slate-400">Date: <span className="text-slate-705 font-mono">{savedInvoice?.date}</span></p>
                <p className="text-xs text-slate-400">Place of Supply: <span className="text-slate-705 font-medium font-sans">08 - Rajasthan</span></p>
              </div>
            </div>

            {/* Bill To Info */}
            <div className="grid grid-cols-2 gap-4 border-b border-slate-150 pb-6 mb-6 bg-slate-50/50 p-4 rounded-xl">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Billed To (Grahak Detail):</h4>
                <p className="font-bold text-slate-800 text-sm">{savedInvoice?.customerName}</p>
                {savedInvoice?.customerPhone && (
                  <p className="text-xs text-slate-500 font-mono font-semibold class-phone">Phone: +91 {savedInvoice.customerPhone}</p>
                )}
                {savedInvoice?.customerGstin && (
                  <p className="text-xs text-indigo-700 font-mono font-bold mt-1">Recipient GSTIN: {savedInvoice.customerGstin}</p>
                )}
              </div>
              <div className="text-right">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Transaction Settle:</h4>
                <p className="text-xs font-medium text-slate-650">Payment Scheme: <strong className="text-slate-800">{savedInvoice?.paymentMethod}</strong></p>
                <p className="text-xs font-medium text-slate-650">Settled State: <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide border ${
                  savedInvoice?.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                  savedInvoice?.paymentStatus === 'Partially Paid' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                  'bg-rose-50 text-rose-700 border-rose-100'
                }`}>{savedInvoice?.paymentStatus}</span></p>
                <p className="text-xs font-medium text-slate-650">Capital Collected: <strong className="text-slate-800 font-mono">₹{savedInvoice?.amountPaid.toFixed(2)}</strong></p>
              </div>
            </div>

            {/* Items Listing Sheet */}
            <div className="mb-6">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="pb-2 text-left w-[5%]">#</th>
                    <th className="pb-2 text-left w-[40%]">Item Description</th>
                    <th className="pb-2 text-center w-[10%]">HSN</th>
                    <th className="pb-2 text-right w-[11%]">Rate (₹)</th>
                    <th className="pb-2 text-center w-[8%]">Qty</th>
                    <th className="pb-2 text-center w-[8%]">GST %</th>
                    <th className="pb-2 text-right w-[18%]">Amount (Tax Incl.)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {savedInvoice?.items.map((item, idx) => (
                    <tr key={item.id} className="py-2.5">
                      <td className="py-3 text-slate-400 text-center">{idx + 1}</td>
                      <td className="py-3">
                        <span className="font-bold text-slate-800">{item.name}</span>
                      </td>
                      <td className="py-3 text-center font-mono text-slate-400">{item.hsn || '-'}</td>
                      <td className="py-3 text-right font-mono text-slate-600">₹{item.rate.toFixed(2)}</td>
                      <td className="py-3 text-center font-mono font-semibold text-slate-800">{item.quantity}</td>
                      <td className="py-3 text-center text-slate-600 font-mono">{item.gstRate}%</td>
                      <td className="py-3 text-right font-mono font-bold text-indigo-755 text-slate-800">₹{item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Invoicing aggregates print */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-150">
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-lg text-xs leading-normal">
                  <p className="font-semibold text-slate-600">Declarations & Terms:</p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-400 mt-1.5">
                    <li>Certified that tax amounts matching this invoice represent actual transactions.</li>
                    <li>Interest @18% p.a. will accrue if accounts aren't settled as agreed.</li>
                    <li>Product returns subject to store policy and terms.</li>
                  </ul>
                  {savedInvoice?.notes && (
                    <p className="text-xs text-slate-500 italic mt-3 border-l-2 border-indigo-200 pl-2">
                       <strong>Merchant log:</strong> {savedInvoice.notes}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2 bg-indigo-50/20 p-4 rounded-xl border border-indigo-50">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Gross Value:</span>
                  <span className="font-mono">₹{((savedInvoice?.subtotal || 0) + (savedInvoice?.discountTotal || 0)).toFixed(2)}</span>
                </div>
                {savedInvoice?.discountTotal && savedInvoice?.discountTotal > 0 ? (
                  <div className="flex justify-between text-xs text-rose-600">
                    <span>Discount Allowed:</span>
                    <span className="font-mono">-₹{savedInvoice.discountTotal.toFixed(2)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Taxable Value (Rajasthan CGST split):</span>
                  <span className="font-mono">₹{savedInvoice?.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>CGST (Central GST):</span>
                  <span className="font-mono">₹{savedInvoice?.cgstTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>SGST (State GST):</span>
                  <span className="font-mono">₹{savedInvoice?.sgstTotal.toFixed(2)}</span>
                </div>
                <div className="border-t border-dashed border-indigo-150 my-2 pt-2 flex justify-between text-sm text-slate-800 font-extrabold uppercase">
                  <span>Grand Total amount:</span>
                  <span className="font-mono text-base text-indigo-700">₹{savedInvoice?.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Authorised signature signoff */}
            <div className="flex justify-between items-end mt-12 pt-6 border-t border-slate-100 text-xs text-slate-400 select-none">
              <div>
                <p>Receiver Signature</p>
                <div className="border-b border-dashed border-slate-300 w-32 h-8"></div>
              </div>
              <div className="text-right">
                <p>For {currentShopName}</p>
                <div className="h-8"></div>
                <p className="font-bold text-slate-600">Authorised Signatory</p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center p-4">
            <button 
              onClick={resetForm}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-6 rounded-lg shadow-xs"
            >
              Issue Another Invoice
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
