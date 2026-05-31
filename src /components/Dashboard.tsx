/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  IndianRupee, 
  AlertTriangle, 
  Plus, 
  ArrowUpRight, 
  FileText, 
  Clock, 
  UserPlus, 
  UserMinus,
  CheckSquare, 
  Square, 
  Bot, 
  BookOpen, 
  CheckCircle2, 
  Phone,
  Percent,
  Sparkles,
  RefreshCcw,
  BadgeAlert,
  ChevronRight,
  X
} from 'lucide-react';
import { Product, Invoice, LedgerEntry, CashTransaction, BusinessStats, ActionItem, UserProfile } from '../types';

interface DashboardProps {
  stats: BusinessStats;
  products: Product[];
  invoices: Invoice[];
  ledger: LedgerEntry[];
  cashBook: CashTransaction[];
  onNavigate: (tab: string) => void;
  onAddLedger: (entry: LedgerEntry) => void;
  onAddCashTransaction: (tx: CashTransaction) => void;
  onAddProduct: (product: Product) => void;
  onOpenAssistantChat: () => void;
  sessionUser?: UserProfile | null;
}

export default function Dashboard({
  stats,
  products,
  invoices,
  ledger,
  cashBook,
  onNavigate,
  onAddLedger,
  onAddCashTransaction,
  onAddProduct,
  onOpenAssistantChat,
  sessionUser
}: DashboardProps) {
  // Quick Action Modal states
  const [activeModal, setActiveModal] = useState<'add_customer' | 'credit' | 'payment' | 'add_product' | null>(null);

  // Quick Action Form-fields states
  const [qCustName, setQCustName] = useState('');
  const [qCustPhone, setQCustPhone] = useState('');
  const [qAmount, setQAmount] = useState<number>(0);
  const [qNote, setQNote] = useState('');
  
  const [qProductName, setQProdName] = useState('');
  const [qProductStock, setQProdStock] = useState<number>(10);
  const [qProductPurchase, setQProdPurchase] = useState<number>(0);
  const [qProductSale, setQProdSale] = useState<number>(0);
  const [qProductCategory, setQProdCategory] = useState('Groceries');

  // Compute Outstanding & Customer details on dashboard to support risk stats
  const customerSummary = useMemo(() => {
    const balances: Record<string, { phone?: string; netUdhaar: number; lastDate?: string }> = {};
    
    ledger.forEach((entry) => {
      const key = entry.customerName.trim();
      if (!balances[key]) {
        balances[key] = { phone: entry.customerPhone, netUdhaar: 0, lastDate: entry.date };
      }
      if (entry.type === 'Credit') {
        balances[key].netUdhaar += entry.amount;
      } else if (entry.type === 'Payment' || entry.type === 'Debit') {
        balances[key].netUdhaar -= entry.amount;
      }
    });

    return Object.entries(balances).map(([name, data]) => ({
      name,
      phone: data.phone,
      netUdhaar: Math.round(data.netUdhaar * 100) / 100,
      isOverdue: data.lastDate ? new Date(data.lastDate) < new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) : false
    })).filter(c => c.netUdhaar > 0);
  }, [ledger]);

  const totalOutstanding = useMemo(() => {
    return customerSummary.reduce((sum, c) => sum + c.netUdhaar, 0);
  }, [customerSummary]);

  const overdueCustomers = useMemo(() => {
    return customerSummary.filter(c => c.isOverdue || c.netUdhaar > 1000);
  }, [customerSummary]);

  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.stock <= p.minStockAlert);
  }, [products]);

  // TODAY'S DYNAMIC INTERACTIVE ACTION PLANNER STATE
  const [plannerItems, setPlannerItems] = useState<ActionItem[]>([
    { id: 'act-lowstock', title: `Procure fast-moving Fortune Mustard Oil stocks`, category: 'Low Stock', done: false, refId: 'prod-2' },
    { id: 'act-overdue', title: 'Follow up payment from Suneeta Devi (🔴 High Risk & Overdue)', category: 'Overdue', done: false, refId: 'Suneeta Devi' },
    { id: 'act-audit', title: 'Audit cash ledger book registry matching with Galla Cash', category: 'General', done: false },
    { id: 'act-invoice', title: 'Register weekly customer tax analytical report summaries', category: 'General', done: false }
  ]);

  // Completion stats count
  const completedActionsCount = plannerItems.filter(i => i.done).length;
  const totalActionsCount = plannerItems.length;

  // Handle action item clicking (Done state + DB side-effects!)
  const handleToggleActionItem = (item: ActionItem) => {
    setPlannerItems(prev => prev.map(i => {
      if (i.id === item.id) {
        const nextDone = !i.done;
        
        // Side effects of checking a checklist item:
        if (nextDone) {
          if (i.id === 'act-lowstock') {
            // Automatically add stock and show toast message
            alert("SaaS Automation Triggered: Added +25 units of stock to low products directly! Low stock alerts cleared.");
            const targetProd = products.find(p => p.id === i.refId || p.sku === 'OIL-FOR-01');
            if (targetProd) {
              targetProd.stock += 25;
            }
          } else if (i.id === 'act-overdue') {
            alert("SaaS Automation Triggered: Automated copyable WhatsApp follow-up link generated! Redirecting review to Settle ledger.");
            onNavigate('ledger');
          } else {
            alert(`SaaS Action Marked resolved: "${i.title}"!`);
          }
        }
        return { ...i, done: nextDone };
      }
      return i;
    }));
  };

  // Quick form submissions handlers
  const handleAddCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qCustName.trim()) return;

    // Simulate direct Ledger entry
    const newEntry: LedgerEntry = {
      id: `led-${Date.now()}`,
      date: new Date().toISOString().substring(0, 10),
      customerName: qCustName.trim(),
      customerPhone: qCustPhone.trim() || undefined,
      type: 'Credit',
      amount: qAmount,
      notes: qNote || "New Ledger customer base added directly from quick form"
    };

    onAddLedger(newEntry);
    setActiveModal(null);
    setQCustName('');
    setQCustPhone('');
    setQAmount(0);
    setQNote('');
    alert(`Grahak "${qCustName}" recorded! Initial credit logged.`);
  };

  const handleQuickCreditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qCustName.trim() || qAmount <= 0) return;

    const newEntry: LedgerEntry = {
      id: `led-${Date.now()}`,
      date: new Date().toISOString().substring(0, 10),
      customerName: qCustName.trim(),
      customerPhone: qCustPhone.trim() || undefined,
      type: 'Credit',
      amount: qAmount,
      notes: qNote || "Credit balance filed from dashboard quick form"
    };

    onAddLedger(newEntry);
    setActiveModal(null);
    setQCustName('');
    setQAmount(0);
    setQNote('');
    alert(`Success: Posted direct CREDIT of ₹${qAmount} under ${qCustName}'s baki khata book.`);
  };

  const handleQuickPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qCustName.trim() || qAmount <= 0) return;

    const actionDate = new Date().toISOString().substring(0, 10);

    const newLedger: LedgerEntry = {
      id: `led-${Date.now()}`,
      date: actionDate,
      customerName: qCustName.trim(),
      customerPhone: qCustPhone.trim() || undefined,
      type: 'Payment',
      amount: qAmount,
      notes: qNote || "Cash recovery from dashboard quick action"
    };
    onAddLedger(newLedger);

    const newCash: CashTransaction = {
      id: `cash-${Date.now()}`,
      date: actionDate,
      type: 'In',
      category: 'Udhaar Payment',
      amount: qAmount,
      description: `repayment from ${qCustName} recorded from quick ledger pane`
    };
    onAddCashTransaction(newCash);

    setActiveModal(null);
    setQCustName('');
    setQAmount(0);
    setQNote('');
    alert(`Success: Collected payment returned of ₹${qAmount} from ${qCustName}. Cash book sync complete!`);
  };

  const handleQuickAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qProductName.trim()) return;

    const newProd: Product = {
      id: `prod-quick-${Date.now()}`,
      name: qProductName.trim(),
      stock: qProductStock,
      minStockAlert: 5,
      unit: 'pcs',
      purchasePrice: qProductPurchase,
      salePrice: qProductSale,
      gstRate: 18,
      category: qProductCategory
    };

    onAddProduct(newProd);
    setActiveModal(null);
    setQProdName('');
    setQProdStock(10);
    setQProdPurchase(0);
    setQProdSale(0);
    alert(`SaaS Catalog: added ${qProductName} to stock reserves successfully!`);
  };

  return (
    <div id="dashboard-saas" className="space-y-6">
      
      {/* Premium Business Details Welcome Banner */}
      {sessionUser && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-lg border border-slate-800 relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none text-slate-800"></div>
          <div className="absolute left-1/3 bottom-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none text-slate-800"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 text-slate-100">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-indigo-500 text-indigo-50 font-mono">
                  ACTIVE BUSINESS CONSOLE
                </span>
                {products.length === 0 && invoices.length === 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-white font-mono">
                    FRESH ZERO-BALANCE SYSTEM
                  </span>
                )}
              </div>
              
              <h2 className="text-2xl font-black font-sans tracking-tight text-white flex items-center gap-2">
                🏢 {sessionUser.shopName}
              </h2>
              <div className="text-slate-400 text-xs font-semibold flex flex-wrap items-center gap-y-1 gap-x-2.5 mt-1">
                <span>👤 Owner: <strong className="text-slate-100">{sessionUser.fullName}</strong></span>
                <span className="text-indigo-400">•</span>
                <span>🏷️ Business Category: <strong className="text-slate-100">{sessionUser.businessType}</strong></span>
                <span className="text-indigo-400">•</span>
                <span>📱 Contact Identifier: <strong className="font-mono text-[11px] text-slate-100">{sessionUser.emailOrMobile}</strong></span>
              </div>
            </div>
            
            {products.length === 0 && invoices.length === 0 ? (
              <div className="bg-slate-800/85 p-4 rounded-2xl border border-slate-700/50 backdrop-blur-xs max-w-sm shrink-0">
                <p className="text-[11px] leading-relaxed text-slate-300">
                  🌱 Welcome! Your ledger database has booted with <strong className="text-white hover:underline">absolute 0 values</strong>. Go to the <strong>POS Terminal</strong> or <strong>Stock Catalog</strong> to add items, and all graphs/calculations will update automatically!
                </p>
              </div>
            ) : (
              <div className="bg-indigo-600/20 px-4 py-3 rounded-2xl border border-indigo-500/30 backdrop-blur-xs text-right max-w-xs shrink-0 hidden sm:block">
                <div className="text-[10px] text-indigo-300 font-extrabold uppercase tracking-widest font-mono">Automated Settle Engine</div>
                <div className="text-xl font-bold tracking-tight text-emerald-400 mt-1">₹{stats.totalSales.toFixed(2)}</div>
                <div className="text-[9px] text-slate-405 mt-0.5 font-medium">Billed revenue across {invoices.length} transactions</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* High impact metric cards row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Outstanding receivables */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Outstanding Credit</p>
            <h3 className="text-2xl font-black font-sans text-rose-600">
              ₹{totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 1 })}
            </h3>
            <div className="flex items-center gap-1 text-slate-420 text-[10px] font-bold">
              <Clock size={12} className="text-rose-500 animate-pulse" />
              <span>{customerSummary.length} Grahak accounts have balances</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100/50">
            <UserMinus size={22} />
          </div>
        </div>

        {/* Total Active customers */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Active Customers Index</p>
            <h3 className="text-2xl font-black font-sans text-slate-800">
              {customerSummary.length} Buyers
            </h3>
            <div className="text-slate-405 text-[10px] font-medium">Recorded in JaipurStore registry</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/50">
            <UserPlus size={22} />
          </div>
        </div>

        {/* Overdue Limit Debtors */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Overdue credit Accounts</p>
            <h3 className="text-2xl font-black font-sans text-amber-600">
              {overdueCustomers.length} Grahak
            </h3>
            <div className="flex items-center gap-1 text-amber-600 text-[10px] font-bold">
              <AlertTriangle size={12} />
              <span>Requires immediate follow up</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100/50">
            <Clock size={22} />
          </div>
        </div>

        {/* Low Stock alerting items */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Low Stock Warnings</p>
            <h3 className="text-2xl font-black font-sans text-emerald-700">
              {lowStockProducts.length} Products
            </h3>
            <div className="text-[10px] text-emerald-600 font-bold">Needs restock triggers</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100/50">
            <AlertTriangle size={22} className="text-emerald-600" />
          </div>
        </div>

      </div>

      {/* Quick Action SaaS Panel */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-md border border-slate-800">
        <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-indigo-300">Quick SaaS Execution panel</h4>
        <p className="text-xs text-slate-400 mt-1">Settle ledgers, issue credits or log inventory entries on-the-fly directly inside dashboard</p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-5 mt-2">
          {[
            { id: 'add_customer', label: "Add Customer", icon: UserPlus, color: "bg-indigo-600/30 text-indigo-300 border-indigo-500/20 hover:bg-indigo-600/50" },
            { id: 'credit', label: "Credit Entry (Udhaar)", icon: Clock, color: "bg-rose-500/10 text-rose-300 border-rose-500/20 hover:bg-rose-500/20" },
            { id: 'payment', label: "Payment Settle", icon: CheckCircle2, color: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20" },
            { id: 'add_product', label: "Add Product Catalog", icon: Plus, color: "bg-amber-500/10 text-amber-300 border-amber-500/20 hover:bg-amber-500/20" },
            { id: 'reports', label: "Generate Report", icon: FileText, color: "bg-teal-500/10 text-teal-300 border-teal-500/20 hover:bg-teal-500/20", navigate: 'reports' },
            { id: 'chat_ai', label: "Vyapaar buddy AI", icon: Bot, color: "bg-purple-500/10 text-purple-300 border-purple-500/20 hover:bg-purple-500/20", chat: true }
          ].map(act => {
            const Icon = act.icon;
            return (
              <button
                key={act.id}
                onClick={() => {
                  if (act.navigate) onNavigate(act.navigate);
                  else if (act.chat) onOpenAssistantChat();
                  else setActiveModal(act.id as any);
                }}
                className={`flex flex-col items-center justify-center p-3 text-center border rounded-2xl cursor-pointer select-none transition-all ${act.color}`}
              >
                <Icon size={20} className="mb-2" />
                <span className="text-[11px] font-extrabold tracking-wide">{act.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main split sections: Action Planner and Analytics indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT PANEL: TODAY'S DYNAMIC ACTION PLANNER */}
        <div className="lg:col-span-5 bg-white border border-slate-100 rounded-3xl p-6 shadow-2xs space-y-4">
          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl">
            <div className="space-y-0.5">
              <h4 className="font-bold text-slate-850 text-xs">Today's Store Action Planner</h4>
              <p className="text-[9px] text-slate-400 font-medium">Check off items to trigger SaaS database automations</p>
            </div>
            
            {/* Completion Indicator ring layout */}
            <div className="flex items-center gap-1.5 text-xs text-indigo-755 font-mono font-extrabold">
              <span className="bg-indigo-50 border border-indigo-100 px-2 py-1 rounded bg-indigo-50 text-indigo-700">
                {completedActionsCount} / {totalActionsCount} Done
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            {plannerItems.map(item => {
              return (
                <div 
                  key={item.id}
                  onClick={() => handleToggleActionItem(item)}
                  className={`flex items-start gap-3 p-3.5 border rounded-xl cursor-pointer select-none transition-all ${
                    item.done 
                      ? 'bg-slate-50/50 border-slate-100 opacity-60 text-slate-400 line-through' 
                      : 'bg-white border-slate-150 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <span className="shrink-0 text-slate-400 mt-0.5">
                    {item.done ? (
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    ) : (
                      <div className="w-4 h-4 rounded border border-slate-350 hover:border-indigo-500 bg-white"></div>
                    )}
                  </span>
                  
                  <div className="space-y-1">
                    <span className="text-xs font-bold font-sans tracking-tight">{item.title}</span>
                    <span className={`block text-[9px] w-max font-bold font-mono uppercase px-1 rounded ${
                      item.category === 'Overdue' ? 'bg-rose-50 text-rose-700' :
                      item.category === 'Low Stock' ? 'bg-amber-50 text-amber-700' :
                      'bg-slate-100 text-slate-505'
                    }`}>
                      {item.category}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANEL: CORE SALES REVENUE PERFORMANCE */}
        <div className="lg:col-span-7 bg-white border border-slate-100 rounded-3xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-50">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Financial Revenue Wave (Weekly Trends)</h4>
              <p className="text-xs text-slate-400">Total cash inflows vs expenditure logs</p>
            </div>
            
            <div className="flex gap-2 text-[10px] font-bold">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-650 inline-block"></span>
                <span className="text-slate-500">Sales</span>
              </span>
              <span className="flex items-center gap-11">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                <span className="text-slate-500">Expenses</span>
              </span>
            </div>
          </div>

          <div className="h-40 w-full relative">
            <svg className="w-full h-full" viewBox="0 0 500 100" preserveAspectRatio="none">
              <line x1="0" y1="20" x2="500" y2="20" stroke="#f8fafc" strokeWidth="1" />
              <line x1="0" y1="50" x2="500" y2="50" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="80" x2="500" y2="80" stroke="#f1f5f9" strokeWidth="1" />

              {/* Inflow trend */}
              <path 
                d="M 0,80 Q 80,45 160,55 T 320,30 T 420,20 T 500,10" 
                fill="none" 
                stroke="#4f46e5" 
                strokeWidth="3.5" 
                strokeLinecap="round"
              />
              
              {/* outflow expense trend */}
              <path 
                d="M 0,90 Q 70,80 150,70 T 320,60 T 420,50 T 500,55" 
                fill="none" 
                stroke="#f43f5e" 
                strokeWidth="2" 
                strokeDasharray="4 3"
              />
            </svg>
          </div>

          <div className="grid grid-cols-2 gap-4 items-center pt-2 border-t border-slate-100">
            <div className="p-4 bg-slate-50 rounded-2xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Galla Liquidity</span>
              <strong className="text-slate-700 text-lg font-mono">₹{stats.cashInHand.toLocaleString()}</strong>
            </div>

            <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider block text-emerald-600">Net Profits</span>
              <strong className="text-emerald-700 text-lg font-mono">₹{stats.netProfit.toLocaleString()}</strong>
            </div>
          </div>
        </div>

      </div>

      {/* ================= MODALS OVERLAYS (QUICK FORMS) ================= */}
      {activeModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border text-left border-slate-200 rounded-2xl w-full max-w-sm shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4 border-b pb-2">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                {activeModal === 'add_customer' && 'Add Store Customer'}
                {activeModal === 'credit' && 'Record direct credit Udhaar'}
                {activeModal === 'payment' && 'Record Customer repayment settle'}
                {activeModal === 'add_product' && 'Add product manual stock'}
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400">
                <X size={16} />
              </button>
            </div>

            {/* FORM 1: ADD CUSTOMER */}
            {activeModal === 'add_customer' && (
              <form onSubmit={handleAddCustomerSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[10px] text-slate-405 font-bold uppercase">Customer Name *</label>
                  <input 
                    type="text" 
                    required
                    value={qCustName}
                    onChange={(e) => setQCustName(e.target.value)}
                    placeholder="e.g. Ramesh Sharma" 
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-405 font-bold uppercase">Phone identifier</label>
                  <input 
                    type="text" 
                    maxLength={10}
                    value={qCustPhone}
                    onChange={(e) => setQCustPhone(e.target.value)}
                    placeholder="Mobile 10 digits" 
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-405 font-bold uppercase">Initial outstanding credit balance (₹)</label>
                  <input 
                    type="number" 
                    value={qAmount}
                    onChange={(e) => setQAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0" 
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-hidden"
                  />
                </div>
                <button type="submit" className="w-full text-xs font-bold py-2.5 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700">
                  Register Grahak Profile
                </button>
              </form>
            )}

            {/* FORM 2: CREDIT LOGGING ENTRY */}
            {activeModal === 'credit' && (
              <form onSubmit={handleQuickCreditSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[10px] text-slate-405 font-bold uppercase">Grahak (Customer Name) *</label>
                  <input 
                    type="text" 
                    required
                    value={qCustName}
                    onChange={(e) => setQCustName(e.target.value)}
                    placeholder="Choose customer or write name" 
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-hidden text-slate-750 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-405 font-bold uppercase">Credit Value Issued (₹) *</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    value={qAmount || ''}
                    onChange={(e) => setQAmount(parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 1500" 
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-hidden font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-405 font-bold uppercase">Transaction Notes</label>
                  <input 
                    type="text" 
                    value={qNote}
                    onChange={(e) => setQNote(e.target.value)}
                    placeholder="Bought monthly provision logs" 
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-hidden"
                  />
                </div>
                <button type="submit" className="w-full text-xs font-black py-2.5 rounded-lg text-white bg-rose-650 bg-rose-600 hover:bg-rose-700">
                  File direct Udhaar Credit log
                </button>
              </form>
            )}

            {/* FORM 3: REPAYMENT ENTRY */}
            {activeModal === 'payment' && (
              <form onSubmit={handleQuickPaymentSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[10px] text-slate-405 font-bold uppercase">Customer Name *</label>
                  <input 
                    type="text" 
                    required
                    value={qCustName}
                    onChange={(e) => setQCustName(e.target.value)}
                    placeholder="Select or enter payer name" 
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-hidden text-slate-750 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-405 font-bold uppercase">Repayment Sum Returned (₹) *</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    value={qAmount || ''}
                    onChange={(e) => setQAmount(parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 500" 
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-hidden font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-405 font-bold uppercase">Reference Note</label>
                  <input 
                    type="text" 
                    value={qNote}
                    onChange={(e) => setQNote(e.target.value)}
                    placeholder="UPI PhonePe transfer receive" 
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-hidden"
                  />
                </div>
                <button type="submit" className="w-full text-xs font-black py-2.5 rounded-lg text-white bg-emerald-600 hover:bg-emerald-700">
                  Settle Payment Cash Book Inflow
                </button>
              </form>
            )}

            {/* FORM 4: PRODUCT CATALOG */}
            {activeModal === 'add_product' && (
              <form onSubmit={handleQuickAddProductSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[10px] text-slate-405 font-bold uppercase">Product Name *</label>
                  <input 
                    type="text" 
                    required
                    value={qProductName}
                    onChange={(e) => setQProdName(e.target.value)}
                    placeholder="e.g. Aashirvaad Shudh Atta 5kg" 
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-hidden"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-405 font-bold uppercase">Initial Stock qty *</label>
                    <input 
                      type="number" 
                      required
                      value={qProductStock}
                      onChange={(e) => setQProdStock(parseInt(e.target.value) || 1)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-hidden font-mono text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-405 font-bold uppercase">Category *</label>
                    <select
                      value={qProductCategory}
                      onChange={(e) => setQProdCategory(e.target.value)}
                      className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-white"
                    >
                      <option value="Groceries">Groceries</option>
                      <option value="Oil & Ghee">Oil & Ghee</option>
                      <option value="Household">Household</option>
                      <option value="Dairy & Bakery">Fresh Dairy</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-405 font-bold uppercase">Cost Price *</label>
                    <input 
                      type="number" 
                      required
                      value={qProductPurchase || ''}
                      onChange={(e) => setQProdPurchase(parseFloat(e.target.value) || 0)}
                      placeholder="₹ PP"
                      className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-hidden font-mono text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-405 font-bold uppercase">Retail Price *</label>
                    <input 
                      type="number" 
                      required
                      value={qProductSale || ''}
                      onChange={(e) => setQProdSale(parseFloat(e.target.value) || 0)}
                      placeholder="₹ SP"
                      className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-hidden font-mono text-slate-800"
                    />
                  </div>
                </div>
                <button type="submit" className="w-full text-xs font-black py-2.5 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700">
                  Register in inventory Database
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
