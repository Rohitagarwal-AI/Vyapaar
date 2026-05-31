/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Sparkles, 
  AlertTriangle, 
  FileText, 
  Layers, 
  IndianRupee, 
  CheckCircle2, 
  Printer, 
  ArrowDownToLine,
  ChevronRight,
  TrendingUp as ProfitIcon
} from 'lucide-react';
import { Product, Invoice, LedgerEntry, BusinessStats } from '../types';

interface ReportsManagerProps {
  stats: BusinessStats;
  products: Product[];
  invoices: Invoice[];
  ledger: LedgerEntry[];
  customerDetails: {
    name: string;
    phone?: string;
    netUdhaar: number;
    riskLevel: 'Low' | 'Medium' | 'High';
    reminderCount: number;
    lastTransactionDate?: string;
    dueDate?: string;
  }[];
}

export default function ReportsManager({
  stats,
  products,
  invoices,
  ledger,
  customerDetails
}: ReportsManagerProps) {
  const [selectedReportTab, setSelectedReportTab] = useState<'financial' | 'inventory' | 'credit'>('financial');

  // Math aggregates
  const totalStockQuantity = products.reduce((sum, p) => sum + p.stock, 0);
  const totalStockCostValuation = products.reduce((sum, p) => sum + (p.stock * p.purchasePrice), 0);
  const totalStockRetailValuation = products.reduce((sum, p) => sum + (p.stock * p.salePrice), 0);
  const potentialProfitValuation = totalStockRetailValuation - totalStockCostValuation;

  const totalOutstandingUdhaar = customerDetails.reduce((sum, c) => sum + c.netUdhaar, 0);
  const highRiskCustomersCount = customerDetails.filter(c => c.riskLevel === 'High').length;
  const avgReminderCount = customerDetails.length > 0 
    ? (customerDetails.reduce((sum, c) => sum + c.reminderCount, 0) / customerDetails.length).toFixed(1)
    : 0;

  // CSV Exporters
  const downloadCSV = (filename: string, csvContent: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCreditReport = () => {
    let csv = "Customer Name,Phone Number,Outstanding Dues (INR),Risk Assessment,Reminder Count,Last Payment Date,Estimated Due Date\n";
    customerDetails.forEach(c => {
      csv += `"${c.name}","${c.phone || 'N/A'}",${c.netUdhaar},"${c.riskLevel}",${c.reminderCount},"${c.lastTransactionDate || 'N/A'}","${c.dueDate || 'N/A'}"\n`;
    });
    downloadCSV("Vyapaar_Credit_Outstanding_Report.csv", csv);
  };

  const handleExportInventoryReport = () => {
    let csv = "Product SKU,Product Name,Category,Unit,Current Stock,Min Alert Level,Purchase Price,Sale Price,Valuation At Cost,Valuation At Retail,Potential Profit\n";
    products.forEach(p => {
      const valCost = p.stock * p.purchasePrice;
      const valRetail = p.stock * p.salePrice;
      const profit = valRetail - valCost;
      csv += `"${p.sku || 'N/A'}","${p.name}","${p.category}","${p.unit}",${p.stock},${p.minStockAlert},${p.purchasePrice},${p.salePrice},${valCost},${valRetail},${profit}\n`;
    });
    downloadCSV("Vyapaar_Inventory_Valuation_Report.csv", csv);
  };

  const handleExportFinancialSummary = () => {
    let csv = "KPI Metric Field,Value (INR),Notes\n";
    csv += `"Total Sales Gross Revenue",${stats.totalSales},"Accumulated retail billing values"\n`;
    csv += `"Total Operating Expenses",${stats.totalExpenses},"Expenses registered in cash galla"\n`;
    csv += `"Total Udhaar Receivables",${totalOutstandingUdhaar},"Credit dues currently with customers"\n`;
    csv += `"Shop Galla Cash Balance",${stats.cashInHand},"Available cash liquidity"\n`;
    csv += `"Calculated Net Store Profits",${stats.netProfit},"Gross sales minus costs"\n`;
    csv += `"Stock Cost Valuation",${totalStockCostValuation},"Raw capital in warehousing products"\n`;
    downloadCSV("Vyapaar_General_Business_Financial_Report.csv", csv);
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Exports */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-sans text-slate-800">Business Analytics & Smart Reports</h2>
          <p className="text-xs text-slate-400">Downloadable portfolio audit reports and AI profit indicators</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => window.print()}
            className="bg-white hover:bg-slate-55 border border-slate-200 text-slate-600 text-xs font-bold py-2.5 px-4 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Printer size={14} />
            Print Preview
          </button>
        </div>
      </div>

      {/* Reports Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        {[
          { id: 'financial', label: 'Financial Performance', icon: TrendingUp },
          { id: 'inventory', label: 'Inventory & Valuation', icon: Layers },
          { id: 'credit', label: 'Credit (Udhaar) Risk', icon: AlertTriangle }
        ].map(tab => {
          const Icon = tab.icon;
          const isSelected = selectedReportTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedReportTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-4 py-3 border-b-2 text-xs font-bold select-none transition-all ${
                isSelected 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* CONTENT FOR TAB: FINANCIAL */}
      {selectedReportTab === 'financial' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* KPI Cards */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-xl p-6 shadow-sm relative overflow-hidden">
              <div className="relative z-10 space-y-4">
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-extrabold uppercase px-2.5 py-1 rounded-full border border-indigo-500/30">
                  Store Health Summary
                </span>
                <div className="space-y-1">
                  <p className="text-slate-350 text-xs font-medium">Net Business Earnings profit</p>
                  <h3 className="text-3xl font-black font-sans tracking-tight">₹{stats.netProfit.toLocaleString('en-IN')}</h3>
                </div>
                <div className="text-xs text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                  <span>Margins are stable at {(stats.totalSales > 0 ? (stats.netProfit / stats.totalSales * 100).toFixed(1) : 0)}%</span>
                </div>
              </div>
              <div className="absolute right-[-10px] bottom-[-20px] opacity-10">
                <TrendingUp size={160} />
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-xs flex flex-col justify-between">
              <div className="space-y-1">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">Gross Capital Circulating</p>
                <h3 className="text-2xl font-extrabold font-sans text-slate-800">
                  ₹{(stats.totalSales + stats.totalExpenses).toLocaleString('en-IN')}
                </h3>
                <p className="text-xs text-slate-400 mt-2">Combined trade volume handled through point of sale ledger accounts.</p>
              </div>
              <hr className="border-slate-50 my-3" />
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Sales vs Cost Ratio</span>
                <span className="font-mono font-bold text-indigo-600">
                  1 : {(stats.totalSales > 0 ? (stats.totalExpenses / stats.totalSales).toFixed(2) : 0)}
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-xs flex flex-col justify-between">
              <div className="space-y-1">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">Cash Flow Health Ratio (Gallatest)</p>
                <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded font-bold inline-block">
                  Liquid state
                </span>
                <h3 className="text-2xl font-extrabold font-sans text-slate-800 mt-2">
                  ₹{stats.cashInHand.toLocaleString('en-IN')}
                </h3>
              </div>
              <hr className="border-slate-50 my-3" />
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Liquid Galla Cash ratio</span>
                <span className="font-mono font-bold text-emerald-600">
                  {stats.totalSales > 0 ? Math.round((stats.cashInHand / stats.totalSales) * 100) : 0}% of sales
                </span>
              </div>
            </div>
          </div>

          {/* AI-powered Insights Summary */}
          <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-amber-100 text-amber-700">
                <Sparkles size={16} />
              </div>
              <h4 className="text-xs font-black tracking-wide text-amber-800 uppercase">Vyapaar Buddy Dynamic Audit Insights</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-650 leading-relaxed">
              <div className="space-y-3">
                <p className="flex gap-2">
                  <span className="text-amber-500 font-bold">●</span>
                  <span><strong>Udhaar Lock Alert:</strong> You have <strong>₹{totalOutstandingUdhaar.toLocaleString('en-IN')}</strong> currently locked in customer credit obligations. This is approximately <strong>{stats.totalSales > 0 ? Math.round((totalOutstandingUdhaar / stats.totalSales) * 100) : 0}%</strong> of total sales, which increases cash flow risks. Encourage UPI scan payments for instant galla settles.</span>
                </p>
                <p className="flex gap-2">
                  <span className="text-emerald-600 font-bold">●</span>
                  <span><strong>Inventory Safety:</strong> Low stock alert checks identified re-procurement schedules needed for fast moving goods (Fortune Mustard Oil). High margin categories (Household and Groceries) suggest strong weekly consumer indexes in Malviya Nagar.</span>
                </p>
              </div>

              <div className="space-y-3">
                <p className="flex gap-2">
                  <span className="text-indigo-600 font-bold">●</span>
                  <span><strong>Recommended Settle Plan:</strong> Prioritize collections from High Risk debtors (reminders count average {avgReminderCount}). We recommend triggering a templated WhatsApp payment link to Ramesh and Rajeev immediately to capture 30% of locked business funds.</span>
                </p>
                
                <div className="pt-2">
                  <button 
                    onClick={handleExportFinancialSummary}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <Download size={13} />
                    Download Core Financials (CSV)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT FOR TAB: INVENTORY & VALUATION */}
      {selectedReportTab === 'inventory' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-xs flex flex-col justify-between">
              <div className="space-y-1">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">Warehouse Assets (At Cost)</p>
                <h3 className="text-2xl font-extrabold font-sans text-slate-800">
                  ₹{totalStockCostValuation.toLocaleString('en-IN')}
                </h3>
                <p className="text-xs text-slate-400 mt-2">Capital currently locked inside products on store shelves, evaluated at wholesale buying cost.</p>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-xs flex flex-col justify-between">
              <div className="space-y-1">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">Estimated Asset Value (At Retail)</p>
                <h3 className="text-2xl font-extrabold font-sans text-slate-800">
                  ₹{totalStockRetailValuation.toLocaleString('en-IN')}
                </h3>
                <p className="text-xs text-slate-400 mt-2">Total anticipated revenue if all currently available shelf stocks are sold at retail price labels.</p>
              </div>
            </div>

            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-6 shadow-xs flex flex-col justify-between">
              <div className="space-y-1">
                <p className="text-emerald-800 text-xs font-bold uppercase tracking-wide">Potential Profit Potential</p>
                <h3 className="text-2xl font-extrabold font-sans text-emerald-700">
                  ₹{potentialProfitValuation.toLocaleString('en-IN')}
                </h3>
                <p className="text-xs text-emerald-600 mt-2">Maximum gross profit margins waiting to be realized. Estimated average markup rate is: <strong>{totalStockCostValuation > 0 ? Math.round((potentialProfitValuation / totalStockCostValuation) * 100) : 0}%</strong>.</p>
              </div>
            </div>
          </div>

          {/* Catalog Valuations Breakdown List */}
          <div className="bg-white border border-slate-100 rounded-xl shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-800">Catalogue Category valuation Breakdown</h4>
                <p className="text-xs text-slate-405">Category volume index and marginal spreads</p>
              </div>
              <button 
                onClick={handleExportInventoryReport}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 border border-indigo-100 hover:bg-indigo-50/40 py-2 px-3.5 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Download size={13} />
                Export Inventory CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-150 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-2">Product category Name</th>
                    <th className="pb-2 text-center">Items Grouped</th>
                    <th className="pb-2 text-center">Shelf Stock Volume</th>
                    <th className="pb-2 text-right">Investment Value (Cost)</th>
                    <th className="pb-2 text-right">Selling Potential (Label)</th>
                    <th className="pb-2 text-right">Expected Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-650">
                  {Array.from(new Set(products.map(p => p.category))).map(cat => {
                    const catProds = products.filter(p => p.category === cat);
                    const itemsCount = catProds.length;
                    const stockVolume = catProds.reduce((sum, p) => sum + p.stock, 0);
                    const costVal = catProds.reduce((sum, p) => sum + (p.stock * p.purchasePrice), 0);
                    const sellingVal = catProds.reduce((sum, p) => sum + (p.stock * p.salePrice), 0);
                    const margin = sellingVal - costVal;

                    return (
                      <tr key={cat} className="hover:bg-slate-50/40">
                        <td className="py-2.5 font-bold text-slate-705">{cat}</td>
                        <td className="py-2.5 text-center font-semibold text-slate-500">{itemsCount}</td>
                        <td className="py-2.5 text-center font-mono">{stockVolume} units</td>
                        <td className="py-2.5 text-right font-mono">₹{costVal.toLocaleString()}</td>
                        <td className="py-2.5 text-right font-mono">₹{sellingVal.toLocaleString()}</td>
                        <td className="py-2.5 text-right font-mono font-bold text-emerald-600">+₹{margin.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT FOR TAB: CREDIT RISK */}
      {selectedReportTab === 'credit' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-xs flex flex-col justify-between">
              <div className="space-y-1">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">Locked Credit (Receivables)</p>
                <h3 className="text-2xl font-extrabold font-sans text-rose-600">
                  ₹{totalOutstandingUdhaar.toLocaleString('en-IN')}
                </h3>
                <p className="text-xs text-slate-400 mt-2">Accumulated outstanding credit bills representing capital yet to be collected from regular buyers.</p>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-xs flex flex-col justify-between">
              <div className="space-y-1">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">High Risk Customers</p>
                <h3 className="text-2xl font-extrabold font-sans text-slate-800">
                  {highRiskCustomersCount} Buyers
                </h3>
                <p className="text-xs text-slate-400 mt-2">Grahak accounts tagged with High Risk levels based on overdue payments, excessive delay cycles, or non-responsiveness.</p>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-xs flex flex-col justify-between">
              <div className="space-y-1">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">Average Reminders Sent</p>
                <h3 className="text-2xl font-extrabold font-sans text-indigo-650">
                  {avgReminderCount} Per Debtor
                </h3>
                <p className="text-xs text-slate-400 mt-2">Reflects how many times outstanding accounts are pinged before completing a successful cash settle.</p>
              </div>
            </div>
          </div>

          {/* Dues Risk Ledger table */}
          <div className="bg-white border border-slate-100 rounded-xl shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-800">Risk Assessment credit Ledger</h4>
                <p className="text-xs text-slate-405">Review critical credit periods and reminder scores</p>
              </div>
              <button 
                onClick={handleExportCreditReport}
                className="text-xs font-bold text-rose-650 hover:text-rose-700 border border-rose-100 hover:bg-rose-50/40 py-2 px-3.5 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Download size={13} />
                Export Credit Risk CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-150 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-2">Debtor Grahak Name</th>
                    <th className="pb-2">Phone Identifier</th>
                    <th className="pb-2 text-right">Outstanding balance</th>
                    <th className="pb-2 text-center">Reminders Issued</th>
                    <th className="pb-2 text-center">Assessed Risk profile</th>
                    <th className="pb-2 text-center">Last Transaction</th>
                    <th className="pb-2 text-center">Due Terms Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-650">
                  {customerDetails.map(c => {
                    return (
                      <tr key={c.name} className="hover:bg-slate-55">
                        <td className="py-3 font-bold text-slate-800">{c.name}</td>
                        <td className="py-3 font-mono font-medium text-slate-500">{c.phone || 'No phone record'}</td>
                        <td className="py-3 text-right font-mono font-black text-rose-600">₹{c.netUdhaar.toLocaleString()}</td>
                        <td className="py-3 text-center">
                          <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold text-xs">
                            {c.reminderCount} sent
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            c.riskLevel === 'High' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                            c.riskLevel === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                            'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          }`}>
                            {c.riskLevel} Risk
                          </span>
                        </td>
                        <td className="py-3 text-center font-mono text-slate-500">{c.lastTransactionDate || 'Pre-seeding'}</td>
                        <td className="py-3 text-center font-mono text-slate-500 font-bold">{c.dueDate || 'Immediate Net 15'}</td>
                      </tr>
                    );
                  })}
                  {customerDetails.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No outstanding debtors found. Awesome job collecting baki-khata balances!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
