/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  LayoutDashboard, 
  Receipt, 
  Package, 
  FileSpreadsheet, 
  Bot, 
  Sparkles, 
  TrendingUp, 
  Menu, 
  X,
  CreditCard,
  User,
  LogOut,
  HelpCircle,
  Clock,
  BarChart3
} from 'lucide-react';

import { Product, Invoice, LedgerEntry, CashTransaction, BusinessStats, UserProfile } from './types';
import { initialProducts, initialInvoices, initialLedger, initialCashBook } from './data/seedData';

import Dashboard from './components/Dashboard';
import InvoiceGenerator from './components/InvoiceGenerator';
import InventoryManager from './components/InventoryManager';
import LedgerCashbook from './components/LedgerCashbook';
import GeminiAssistant from './components/GeminiAssistant';
import ReportsManager from './components/ReportsManager';
import AuthLayout from './components/AuthLayout';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [triggerDefaultAddProduct, setTriggerDefaultAddProduct] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);

  // Authentication Session State with persistence
  const [sessionUser, setSessionUser] = useState<UserProfile | null>(() => {
    const local = localStorage.getItem('vyapaar_session_user');
    return local ? JSON.parse(local) : null;
  });

  // Core synchronized databases state
  const [products, setProducts] = useState<Product[]>(() => {
    const local = localStorage.getItem('vyapaar_products');
    return local ? JSON.parse(local) : initialProducts;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const local = localStorage.getItem('vyapaar_invoices');
    return local ? JSON.parse(local) : initialInvoices;
  });

  const [ledger, setLedger] = useState<LedgerEntry[]>(() => {
    const local = localStorage.getItem('vyapaar_ledger');
    return local ? JSON.parse(local) : initialLedger;
  });

  const [cashBook, setCashBook] = useState<CashTransaction[]>(() => {
    const local = localStorage.getItem('vyapaar_cashbook');
    return local ? JSON.parse(local) : initialCashBook;
  });

  // Overrides cache for customer details risk analysis
  const [customerOverrides] = useState(() => {
    const local = localStorage.getItem('vyapaar_customer_overrides_v2');
    return local ? JSON.parse(local) : {
      'Ramesh Sharma': { riskLevel: 'Medium', reminderCount: 2, dueDate: '2026-05-30' },
      'Suneeta Devi': { riskLevel: 'High', reminderCount: 3, dueDate: '2026-05-18' },
      'Rajeev Verma': { riskLevel: 'Low', reminderCount: 0, dueDate: '2026-06-15' }
    };
  });

  // Sync state to localstorage
  useEffect(() => {
    localStorage.setItem('vyapaar_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('vyapaar_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('vyapaar_ledger', JSON.stringify(ledger));
  }, [ledger]);

  useEffect(() => {
    localStorage.setItem('vyapaar_cashbook', JSON.stringify(cashBook));
  }, [cashBook]);

  // Aggregate shop statistics
  const [stats, setStats] = useState<BusinessStats>({
    totalSales: 0,
    totalExpenses: 0,
    totalUdhaarOutstanding: 0,
    netProfit: 0,
    cashInHand: 0
  });

  useEffect(() => {
    // 1. Dues outstanding (Outstanding receivables loops)
    const balances: Record<string, number> = {};
    ledger.forEach((entry) => {
      const key = entry.customerName.trim();
      if (!balances[key]) balances[key] = 0;
      if (entry.type === 'Credit') {
        balances[key] += entry.amount;
      } else if (entry.type === 'Payment' || entry.type === 'Debit') {
        balances[key] -= entry.amount;
      }
    });
    // Sum only positive balances (receivable outstanding)
    const totalUdhaarOutstanding = Object.values(balances).reduce((sum, b) => b > 0 ? sum + b : sum, 0);

    // 2. Sales is sum of all billing invoice values
    const totalSales = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

    // 3. Expenses is sum of general outflows
    const totalExpenses = cashBook
      .filter((tx) => tx.type === 'Out')
      .reduce((sum, tx) => sum + tx.amount, 0);

    // 4. Net Profit margin
    const netProfit = totalSales - totalExpenses;

    // 5. Cash Book final Liquidity
    const cashInHand = cashBook.reduce((sum, tx) => {
      return tx.type === 'In' ? sum + tx.amount : sum - tx.amount;
    }, 0);

    setStats({
      totalSales,
      totalExpenses,
      totalUdhaarOutstanding,
      netProfit,
      cashInHand
    });
  }, [invoices, ledger, cashBook]);

  // Compile detailed customer records dynamically for Reports
  const memoizedCustomerDetails = useMemo(() => {
    const records: Record<string, { phone?: string; netUdhaar: number; lastDate?: string }> = {};

    ledger.forEach((entry) => {
      const key = entry.customerName.trim();
      if (!records[key]) {
        records[key] = { phone: entry.customerPhone, netUdhaar: 0, lastDate: entry.date };
      }
      if (entry.type === 'Credit') {
        records[key].netUdhaar += entry.amount;
      } else if (entry.type === 'Payment' || entry.type === 'Debit') {
        records[key].netUdhaar -= entry.amount;
      }
      if (!records[key].lastDate || new Date(entry.date) > new Date(records[key].lastDate)) {
        records[key].lastDate = entry.date;
      }
    });

    return Object.entries(records).map(([name, data]) => {
      const overrides = customerOverrides[name] || { riskLevel: 'Low', notes: '', reminderCount: 0, dueDate: '2026-06-10' };
      return {
        name,
        phone: data.phone,
        netUdhaar: Math.round(data.netUdhaar * 100) / 100,
        lastTransactionDate: data.lastDate,
        riskLevel: overrides.riskLevel as 'Low' | 'Medium' | 'High',
        reminderCount: overrides.reminderCount,
        dueDate: overrides.dueDate
      };
    }).filter(c => c.netUdhaar > 0);
  }, [ledger, customerOverrides]);

  // State Handler modifiers passed down to children safely
  const handleAddProduct = (prod: Product) => {
    setProducts((prev) => [prod, ...prev]);
  };

  const handleUpdateProduct = (updatedProd: Product) => {
    setProducts((prev) => prev.map((p) => p.id === updatedProd.id ? updatedProd : p));
  };

  const handleDeleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAddLedgerEntry = (entry: LedgerEntry) => {
    setLedger((prev) => [entry, ...prev]);
  };

  const handleAddCashTransaction = (tx: CashTransaction) => {
    setCashBook((prev) => [tx, ...prev]);
  };

  // Automated Checkout Settle Handler
  const handleSaveInvoice = (newInvoice: Invoice) => {
    // 1. Add invoice
    setInvoices((prev) => [newInvoice, ...prev]);

    // 2. Subtract inventory stock quantities
    setProducts((prevProducts) => {
      return prevProducts.map((p) => {
        const matchingBillingRow = newInvoice.items.find((item) => item.id === p.id);
        if (matchingBillingRow) {
          return {
            ...p,
            stock: Math.max(0, p.stock - matchingBillingRow.quantity)
          };
        }
        return p;
      });
    });

    // 3. Settle partial/full cash transaction
    if (newInvoice.amountPaid > 0) {
      const newCashTx: CashTransaction = {
        id: `cash-in-${Date.now()}`,
        date: newInvoice.date,
        type: 'In',
        category: 'Sales',
        amount: newInvoice.amountPaid,
        description: `Billed collections for Invoice ${newInvoice.invoiceNumber}. Customer Name: ${newInvoice.customerName}`
      };
      setCashBook((prev) => [newCashTx, ...prev]);
    }

    // 4. File credit outstanding ledger record if rest of amount is pending
    const remainderUdhaar = newInvoice.totalAmount - newInvoice.amountPaid;
    if (remainderUdhaar > 0.05) {
      const newCreditLog: LedgerEntry = {
        id: `led-cr-${Date.now()}`,
        date: newInvoice.date,
        customerName: newInvoice.customerName,
        customerPhone: newInvoice.customerPhone,
        type: 'Credit',
        amount: remainderUdhaar,
        relatedInvoiceId: newInvoice.id,
        notes: `Outstanding credit balance for bill ${newInvoice.invoiceNumber}`
      };
      setLedger((prev) => [newCreditLog, ...prev]);
    }
  };

  const openAddProductFromDashboard = () => {
    setActiveTab('inventory');
    setTriggerDefaultAddProduct(true);
  };

  // --- RENDERING ROUTE: UNAUTHENTICATED SIGNUP FIRST ---
  if (!sessionUser) {
    return (
      <AuthLayout 
        onAuthenticate={(user) => {
          setSessionUser(user);
          localStorage.setItem('vyapaar_session_user', JSON.stringify(user));
          if (user.isFresh) {
            // Force start everything from 0! Discard seed data arrays
            setProducts([]);
            setInvoices([]);
            setLedger([]);
            setCashBook([]);
            localStorage.setItem('vyapaar_products', JSON.stringify([]));
            localStorage.setItem('vyapaar_invoices', JSON.stringify([]));
            localStorage.setItem('vyapaar_ledger', JSON.stringify([]));
            localStorage.setItem('vyapaar_cashbook', JSON.stringify([]));
          }
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col justify-between text-slate-850 font-sans tracking-tight leading-normal font-sans">
      
      {/* Primary Top Header Navigation & Store Info */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-40 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Store branding visual with User custom registration info */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-505 from-indigo-600 to-indigo-700 flex items-center justify-center text-white shadow-inner transform rotate-3">
                <Building2 size={20} />
              </div>
              <div>
                <h1 className="text-xs font-black tracking-widest uppercase font-mono">{sessionUser.shopName}</h1>
                <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
                  Owner: {sessionUser.fullName} <span className="text-emerald-500">•</span> {sessionUser.businessType}
                </p>
              </div>
            </div>

            {/* Desktop Tab switches */}
            <nav className="hidden md:flex space-x-1">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                { id: 'billing', label: 'POS Terminal', icon: Receipt },
                { id: 'inventory', label: 'Stock Catalog', icon: Package },
                { id: 'ledger', label: 'Baki Khata (ledger)', icon: FileSpreadsheet },
                { id: 'reports', label: 'Smart Reports', icon: BarChart3 }
              ].map((tab) => {
                const IconComp = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                      isSelected 
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <IconComp size={14} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            {/* Sign Out utilities */}
            <div className="hidden md:flex items-center gap-2">
              <button 
                onClick={() => {
                  setSessionUser(null);
                  localStorage.removeItem('vyapaar_session_user');
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-slate-300 hover:text-white transition-colors hover:bg-slate-800 cursor-pointer"
                title="Sign Out Account"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>

            {/* Mobile menu trigger */}
            <div className="md:hidden">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-slate-300 hover:text-white p-2"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile menu panel */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 px-2 pt-2 pb-3 space-y-1 bg-slate-900 animate-in fade-in">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'billing', label: 'POS Terminal', icon: Receipt },
              { id: 'inventory', label: 'Stock Catalog', icon: Package },
              { id: 'ledger', label: 'Baki Khata (ledger)', icon: FileSpreadsheet },
              { id: 'reports', label: 'Smart Reports', icon: BarChart3 }
            ].map((tab) => {
              const IconComp = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-extrabold transition-all text-left ${
                    isSelected 
                      ? 'bg-indigo-600 text-white' 
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <IconComp size={15} />
                  {tab.label}
                </button>
              );
            })}
            
            {/* Mobile Log Out option */}
            <button
              onClick={() => {
                setSessionUser(null);
                localStorage.removeItem('vyapaar_session_user');
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-extrabold text-rose-400 hover:bg-slate-800 transition-all text-left border-t border-slate-800 mt-2 cursor-pointer"
            >
              <LogOut size={15} />
              Quit Session (Sign Out)
            </button>
          </div>
        )}
      </header>

      {/* Primary content area panel */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 shrink-0">
        <div className="animate-in fade-in duration-300">
          
          {/* Active section router rendering */}
          {activeTab === 'dashboard' && (
            <Dashboard 
              stats={stats}
              products={products}
              invoices={invoices}
              ledger={ledger}
              cashBook={cashBook}
              onNavigate={setActiveTab}
              onAddLedger={handleAddLedgerEntry}
              onAddCashTransaction={handleAddCashTransaction}
              onAddProduct={handleAddProduct}
              onOpenAssistantChat={() => setIsAIAssistantOpen(true)}
              sessionUser={sessionUser}
            />
          )}

          {activeTab === 'billing' && (
            <InvoiceGenerator 
              products={products}
              invoices={invoices}
              onSaveInvoice={handleSaveInvoice}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryManager 
              products={products}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              showAddFormByDefault={triggerDefaultAddProduct}
              onFormCloseDefault={() => setTriggerDefaultAddProduct(false)}
            />
          )}

          {activeTab === 'ledger' && (
            <LedgerCashbook 
              ledger={ledger}
              cashBook={cashBook}
              onAddLedger={handleAddLedgerEntry}
              onAddCashTransaction={handleAddCashTransaction}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsManager 
              stats={stats}
              products={products}
              invoices={invoices}
              ledger={ledger}
              customerDetails={memoizedCustomerDetails}
            />
          )}

        </div>
      </main>

      {/* Floating Circular AI Assistant Drawer */}
      <div className="fixed bottom-6 right-6 z-50 no-print flex flex-col items-end gap-3 font-sans">
        {isAIAssistantOpen && (
          <div className="w-[360px] sm:w-[400px] h-[520px] bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col justify-between animate-in slide-in-from-bottom-5 duration-200">
            <GeminiAssistant 
              businessStats={stats}
              products={products}
              invoices={invoices}
              onClose={() => setIsAIAssistantOpen(false)}
            />
          </div>
        )}
        
        <button
          onClick={() => setIsAIAssistantOpen(!isAIAssistantOpen)}
          className="w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl hover:shadow-2xl flex items-center justify-center transition-all cursor-pointer transform hover:scale-110 active:scale-95 border-2 border-white ring-4 ring-indigo-50"
          title="Open Vyapaar Buddy AI"
        >
          {isAIAssistantOpen ? <X size={22} /> : <Bot size={22} className="animate-bounce" />}
        </button>
      </div>

      {/* Humble Footer section */}
      <footer className="border-t border-slate-100 py-6 mt-8 text-center text-xs text-slate-400 no-print select-none bg-white">
        <p className="font-medium">💼 {sessionUser.shopName} Digital Suite — SaaS Baki-khata Baki Engine.</p>
        <p className="text-[10px] text-slate-350 font-mono mt-1">Licensed under Apache-2.0. Clean Offline-First Settle Logic & GST Calculator.</p>
      </footer>

    </div>
  );
}
