/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  BookOpen, 
  UserMinus, 
  UserCheck, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  User, 
  FileText, 
  AlertCircle,
  HelpCircle,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  X,
  MessageSquare,
  ClipboardCopy,
  UserCheck as CollectorIcon,
  BadgeAlert,
  Send,
  Sparkles,
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import { LedgerEntry, CashTransaction, CustomerDetail } from '../types';

interface LedgerCashbookProps {
  ledger: LedgerEntry[];
  cashBook: CashTransaction[];
  onAddLedger: (entry: LedgerEntry) => void;
  onAddCashTransaction: (tx: CashTransaction) => void;
}

interface OverridesData {
  riskLevel: 'Low' | 'Medium' | 'High';
  notes: string;
  reminderCount: number;
  dueDate: string;
}

export default function LedgerCashbook({
  ledger,
  cashBook,
  onAddLedger,
  onAddCashTransaction
}: LedgerCashbookProps) {
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

  const [activeTab, setActiveTab] = useState<'udhaar' | 'cashbook'>('udhaar');

  // Udhaar UI States
  const [udhaarSearch, setUdhaarSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<'All' | 'High' | 'Medium' | 'Low' | 'Overdue'>('All');
  const [selectedCustomerName, setSelectedCustomerName] = useState<string | null>(null);

  // Inflow / Outflow forms
  const [showCashForm, setShowCashForm] = useState(false);
  const [cashType, setCashType] = useState<'In' | 'Out'>('In');
  const [cashCategory, setCashCategory] = useState<'Sales' | 'Purchase' | 'Expenses' | 'Udhaar Payment' | 'Other'>('Other');
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [cashDesc, setCashDesc] = useState('');

  // Quick Ledger Action form inside Profile view
  const [profileActionType, setProfileActionType] = useState<'Payment' | 'Credit'>('Payment');
  const [profileActionAmount, setProfileActionAmount] = useState<number>(0);
  const [profileActionNote, setProfileActionNote] = useState('');

  // Customer detailed overrides state stored locally to allow editability of risk level, notes, dueDates, etc.
  const [customerOverrides, setCustomerOverrides] = useState<Record<string, OverridesData>>(() => {
    const local = localStorage.getItem('vyapaar_customer_overrides_v2');
    return local ? JSON.parse(local) : {
      'Ramesh Sharma': { riskLevel: 'Medium', notes: 'Agreed to pay on month-end', reminderCount: 2, dueDate: '2026-05-30' },
      'Suneeta Devi': { riskLevel: 'High', notes: 'Regular customer but credit has delayed cycle', reminderCount: 3, dueDate: '2026-05-18' },
      'Rajeev Verma': { riskLevel: 'Low', notes: 'Bulk purchaser, trustworthy vendor', reminderCount: 0, dueDate: '2026-06-15' }
    };
  });

  // Sync Overrides to store
  useEffect(() => {
    localStorage.setItem('vyapaar_customer_overrides_v2', JSON.stringify(customerOverrides));
  }, [customerOverrides]);

  // Handle saving customer attributes from details screen
  const handleUpdateCustomerOverride = (custName: string, field: keyof OverridesData, value: any) => {
    setCustomerOverrides(prev => {
      const current = prev[custName] || { riskLevel: 'Low', notes: '', reminderCount: 0, dueDate: '' };
      return {
        ...prev,
        [custName]: {
          ...current,
          [field]: value
        }
      };
    });
  };

  // Compile detailed customer records on-the-fly dynamically
  const customerDetails: CustomerDetail[] = useMemo(() => {
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
        id: `cust-${name.replace(/\s+/g, '-').toLowerCase()}`,
        name,
        phone: data.phone,
        netUdhaar: Math.round(data.netUdhaar * 100) / 100,
        lastTransactionDate: data.lastDate,
        riskLevel: overrides.riskLevel,
        notes: overrides.notes,
        reminderCount: overrides.reminderCount,
        dueDate: overrides.dueDate
      };
    });
  }, [ledger, customerOverrides]);

  // Aggregate Stats
  const totalUdhaarDue = useMemo(() => {
    return customerDetails.reduce((sum, c) => c.netUdhaar > 0 ? sum + c.netUdhaar : sum, 0);
  }, [customerDetails]);

  const activeDebtorsCount = useMemo(() => {
    return customerDetails.filter(c => c.netUdhaar > 0).length;
  }, [customerDetails]);

  const currentCashInGalla = useMemo(() => {
    return cashBook.reduce((sum, tx) => {
      return tx.type === 'In' ? sum + tx.amount : sum - tx.amount;
    }, 0);
  }, [cashBook]);

  // Filter Debtors list based on search and status tabs
  const filteredCustomers = useMemo(() => {
    return customerDetails.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(udhaarSearch.toLowerCase()) || 
                            (c.phone && c.phone.includes(udhaarSearch));
      
      let matchesFilter = true;
      if (riskFilter === 'High' && c.riskLevel !== 'High') matchesFilter = false;
      if (riskFilter === 'Medium' && c.riskLevel !== 'Medium') matchesFilter = false;
      if (riskFilter === 'Low' && c.riskLevel !== 'Low') matchesFilter = false;
      if (riskFilter === 'Overdue') {
        const isOverdue = c.dueDate ? new Date(c.dueDate) < new Date() : false;
        if (!isOverdue) matchesFilter = false;
      }

      // Hide profiles that are fully cleared unless searched
      const isOwed = c.netUdhaar > 0.05;

      return matchesSearch && matchesFilter && isOwed;
    });
  }, [customerDetails, udhaarSearch, riskFilter]);

  // Fetch selected client profile detail
  const activeCustomerProfile = useMemo(() => {
    if (!selectedCustomerName) return null;
    return customerDetails.find(c => c.name === selectedCustomerName) || null;
  }, [customerDetails, selectedCustomerName]);

  // Fetch transactions of active customer profile
  const activeCustomerHistory = useMemo(() => {
    if (!selectedCustomerName) return [];
    return ledger.filter(entry => entry.customerName.trim() === selectedCustomerName)
                 .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [ledger, selectedCustomerName]);

  // Settle credit transaction directly from detail panel side drawer
  const handleProfileDirectActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomerProfile || profileActionAmount <= 0) return;

    const actionDate = new Date().toISOString().substring(0, 10);
    const notesText = profileActionNote.trim() || `${profileActionType} logged via direct CRM profile console`;

    // 1. Save entry to baki khata ledger
    const newEntry: LedgerEntry = {
      id: `led-cr-${Date.now()}`,
      date: actionDate,
      customerName: activeCustomerProfile.name,
      customerPhone: activeCustomerProfile.phone,
      type: profileActionType,
      amount: profileActionAmount,
      notes: notesText
    };
    onAddLedger(newEntry);

    // 2. Settle galla cash transaction if payment was received
    if (profileActionType === 'Payment') {
      const newCashTx: CashTransaction = {
        id: `cash-${Date.now()}`,
        date: actionDate,
        type: 'In',
        category: 'Udhaar Payment',
        amount: profileActionAmount,
        description: `Ledger recovery from ${activeCustomerProfile.name}. Notes: ${notesText}`
      };
      onAddCashTransaction(newCashTx);
    }

    // Reset Form fields
    setProfileActionAmount(0);
    setProfileActionNote('');
    alert(`Success: recorded direct ${profileActionType} entry of ₹${profileActionAmount}!`);
  };

  // Submit global Cashbook Galla inflow or outflow
  const handleCashTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cashAmount <= 0 || !cashDesc.trim()) return;

    const newTx: CashTransaction = {
      id: `cash-${Date.now()}`,
      date: new Date().toISOString().substring(0, 10),
      type: cashType,
      category: cashCategory,
      amount: cashAmount,
      description: cashDesc.trim()
    };

    onAddCashTransaction(newTx);
    setShowCashForm(false);
    setCashAmount(0);
    setCashDesc('');
  };

  const getWhatsAppURL = (phone: string, text: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="space-y-6">
      {/* Tab select header & active metrics */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="bg-slate-100 p-1.5 rounded-2xl flex self-start">
          <button
            onClick={() => {
              setActiveTab('udhaar');
              setSelectedCustomerName(null);
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'udhaar' 
                ? 'bg-white text-slate-800 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen size={15} /> Udhaar Ledger Khata
          </button>
          <button
            onClick={() => setActiveTab('cashbook')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'cashbook' 
                ? 'bg-white text-slate-800 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Wallet size={15} /> Cashbook Galla (Cash Register)
          </button>
        </div>

        {/* Aggregated indicators */}
        <div className="flex items-center gap-4 text-xs">
          {activeTab === 'udhaar' ? (
            <div className="bg-rose-50 text-rose-850 border border-rose-100 py-2 px-4 rounded-xl font-bold flex items-center gap-1.5">
              <UserMinus size={14} className="text-rose-600" /> Total Outstanding Udhaar: ₹{totalUdhaarDue.toLocaleString('en-IN')}
            </div>
          ) : (
            <div className="bg-indigo-50 text-indigo-805 border border-indigo-100 py-2 px-4 rounded-xl font-bold flex items-center gap-1.5">
              <Wallet size={14} className="text-indigo-600" /> Galla Cash Balance: ₹{currentCashInGalla.toLocaleString('en-IN')}
            </div>
          )}
        </div>
      </div>

      {/* --- TAB 1: UDHAAR ACTIVE MANAGER --- */}
      {activeTab === 'udhaar' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: Debtors List & Filter options */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-2xs space-y-4">
              <div className="space-y-1">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Search & Filters</h3>
              </div>

              {/* Searching panel */}
              <div className="relative">
                <span className="absolute left-3 top-3 text-slate-400">
                  <Search size={14} />
                </span>
                <input 
                  type="text" 
                  placeholder="Filter Grahak phone/name..."
                  value={udhaarSearch}
                  onChange={(e) => setUdhaarSearch(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg py-2.5 pl-9 pr-3 focus:outline-hidden focus:border-indigo-500 font-medium text-slate-700 bg-white"
                />
              </div>

              {/* Status categories */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Assess Risk Filters:</span>
                <div className="flex flex-wrap gap-1">
                  {[
                    { id: 'All', label: 'All Dues' },
                    { id: 'High', label: '🔴 High Risk' },
                    { id: 'Medium', label: '🟡 Med Risk' },
                    { id: 'Low', label: '🟢 Low Risk' },
                    { id: 'Overdue', label: '⏳ Overdue' }
                  ].map(btn => (
                    <button
                      key={btn.id}
                      onClick={() => setRiskFilter(btn.id as any)}
                      className={`text-[10px] font-bold px-2 py-1.5 rounded-lg border transition-all ${
                        riskFilter === btn.id 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-2xs' 
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* List Debtors block */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredCustomers.map((cust) => {
                const isOverdue = cust.dueDate ? new Date(cust.dueDate) < new Date() : false;
                const isSelected = selectedCustomerName === cust.name;

                return (
                  <div 
                    key={cust.name}
                    onClick={() => setSelectedCustomerName(cust.name)}
                    className={`border rounded-xl p-4 cursor-pointer transition-all flex items-center justify-between shadow-2xs ${
                      isSelected 
                        ? 'bg-indigo-50/50 border-indigo-400 ring-2 ring-indigo-50/30' 
                        : 'bg-white border-slate-150 hover:border-slate-350'
                    }`}
                  >
                    <div className="space-y-1.5 max-w-[65%]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-slate-800 text-xs truncate max-w-xs">{cust.name}</span>
                        {cust.riskLevel === 'High' && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>}
                      </div>

                      {cust.phone ? (
                        <p className="text-[10px] text-slate-420 font-mono font-medium">{cust.phone}</p>
                      ) : (
                        <p className="text-[10px] text-slate-350 italic">No phone record</p>
                      )}

                      <div className="flex items-center gap-2">
                        {/* Risk status label */}
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          cust.riskLevel === 'High' ? 'bg-rose-50 text-rose-700' :
                          cust.riskLevel === 'Medium' ? 'bg-amber-50 text-amber-700' :
                          'bg-emerald-50 text-emerald-700'
                        }`}>
                          {cust.riskLevel} Risk
                        </span>

                        {isOverdue && (
                          <span className="text-[8px] bg-rose-100 text-rose-800 font-extrabold uppercase px-1 rounded flex items-center gap-0.5">
                            Overdue
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <p className="text-rose-600 font-mono font-black text-xs">
                        ₹{cust.netUdhaar.toLocaleString()}
                      </p>
                      <p className="text-[9px] text-slate-400 font-mono">Term: {cust.dueDate || '15 Days'}</p>
                    </div>
                  </div>
                );
              })}
              {filteredCustomers.length === 0 && (
                <div className="py-12 bg-white border border-dashed text-center text-slate-400 text-xs rounded-xl shadow-2xs">
                  ✨ No debtors match the search criteria. All clean!
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Dynamic Customer Details CRM Screen */}
          <div className="lg:col-span-8">
            {activeCustomerProfile ? (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6 animate-in fade-in duration-205">
                
                {/* Client detail header */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-5 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg border border-indigo-100/50">
                      {activeCustomerProfile.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-base">{activeCustomerProfile.name}</h4>
                      <p className="text-xs text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                        <span>📲 +91 {activeCustomerProfile.phone || 'N/A'}</span>
                        <span>•</span>
                        <span>Joined Jaipur Store Registry</span>
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setSelectedCustomerName(null)}
                    className="text-slate-350 hover:text-slate-600 p-1.5 rounded-lg border self-start sm:self-auto"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Submetrics row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Udhaar Balance</span>
                    <strong className="text-rose-600 font-mono text-base font-black">₹{activeCustomerProfile.netUdhaar}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Commitment Term</span>
                    <div className="flex items-center gap-1 text-slate-650 text-xs font-semibold mt-1">
                      <Calendar size={13} className="text-slate-400" />
                      <input 
                        type="date" 
                        value={activeCustomerProfile.dueDate || '2026-05-30'}
                        onChange={(e) => handleUpdateCustomerOverride(activeCustomerProfile.name, 'dueDate', e.target.value)}
                        className="bg-transparent text-slate-705 border-b border-dashed border-slate-300 font-mono focus:outline-hidden text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Assessed Risk</span>
                    <select
                      value={activeCustomerProfile.riskLevel}
                      onChange={(e) => handleUpdateCustomerOverride(activeCustomerProfile.name, 'riskLevel', e.target.value)}
                      className={`text-xs font-bold bg-white text-slate-800 border p-1 rounded-lg mt-1 focus:outline-hidden ${
                        activeCustomerProfile.riskLevel === 'High' ? 'border-rose-300 text-rose-700' :
                        activeCustomerProfile.riskLevel === 'Medium' ? 'border-amber-300 text-amber-750' :
                        'border-emerald-300 text-emerald-700'
                      }`}
                    >
                      <option value="Low">🟢 Low Risk</option>
                      <option value="Medium">🟡 Medium</option>
                      <option value="High">🔴 High Risk</option>
                    </select>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Reminders count</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <strong className="text-slate-800 font-mono text-xs">{activeCustomerProfile.reminderCount} sent</strong>
                      <button 
                        onClick={() => handleUpdateCustomerOverride(activeCustomerProfile.name, 'reminderCount', activeCustomerProfile.reminderCount + 1)}
                        className="text-[10px] text-indigo-705 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded font-bold transition-all border border-indigo-100"
                      >
                        +1 Ping
                      </button>
                    </div>
                  </div>
                </div>

                {/* Direct quick action ledgers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Ledger quick input form */}
                  <div className="p-4 bg-white border border-slate-150 rounded-xl space-y-3">
                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Quick direct ledger posting</h4>
                    
                    <form onSubmit={handleProfileDirectActionSubmit} className="space-y-3.5">
                      <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-lg text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => setProfileActionType('Payment')}
                          className={`py-1.5 rounded-md transition-all ${profileActionType === 'Payment' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}
                        >
                          💵 Repayment
                        </button>
                        <button
                          type="button"
                          onClick={() => setProfileActionType('Credit')}
                          className={`py-1.5 rounded-md transition-all ${profileActionType === 'Credit' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500'}`}
                        >
                          ⏳ issue Credit
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[9px] text-slate-420 font-bold uppercase">Value (₹) *</label>
                          <input 
                            type="number" 
                            step="0.01"
                            required
                            min="0.1"
                            value={profileActionAmount || ''}
                            onChange={(e) => setProfileActionAmount(parseFloat(e.target.value) || 0)}
                            placeholder="e.g. 500"
                            className="w-full text-xs font-mono font-bold text-slate-800 border border-slate-200 rounded-lg p-2 focus:outline-hidden focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-slate-420 font-bold uppercase">Context / Reference</label>
                          <input 
                            type="text" 
                            value={profileActionNote}
                            onChange={(e) => setProfileActionNote(e.target.value)}
                            placeholder="Cleared old rice bill"
                            className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-hidden"
                          />
                        </div>
                      </div>

                      <button 
                        type="submit"
                        className="w-full text-xs font-bold py-2 px-4 rounded-lg text-white bg-slate-900 hover:bg-slate-800 transition-colors"
                      >
                        File direct {profileActionType} entry
                      </button>
                    </form>
                  </div>

                  {/* Comments Notebook block */}
                  <div className="p-4 bg-indigo-50/20 border border-indigo-50 rounded-xl space-y-3.5">
                    <h4 className="text-xs font-black uppercase text-indigo-400 tracking-wider">Internal Bookkeeping Comments</h4>
                    
                    <textarea
                      value={activeCustomerProfile.notes || ''}
                      onChange={(e) => handleUpdateCustomerOverride(activeCustomerProfile.name, 'notes', e.target.value)}
                      placeholder="e.g. regular patron, bought grain inventory bags, committed to clear off dues of 1500 before Sunday."
                      rows={4}
                      className="w-full text-xs border border-indigo-100/40 rounded-xl p-2.5 bg-white focus:outline-hidden focus:border-indigo-400 text-slate-700"
                    />
                    <span className="text-[9px] text-indigo-400 font-mono block text-right mt-1.5">Note values persist in offline cache logs.</span>
                  </div>
                </div>

                {/* WhatsApp reminder block */}
                {activeCustomerProfile.phone && (
                  <div className="p-4 bg-emerald-50/30 border border-emerald-100 rounded-xl space-y-3">
                    <h4 className="text-xs font-black uppercase text-emerald-800 tracking-wider flex items-center gap-1">
                      <MessageSquare size={13} className="text-emerald-500" />
                      Overdue collection Draft (WhatsApp/SMS)
                    </h4>
                    
                    <div className="bg-white border rounded-xl p-3 text-xs font-mono text-slate-650 max-h-24 overflow-y-auto relative p-3">
                      Darshak, Namaste! Vyapaar baki-khata se nivedan: Aapke {activeCustomerProfile.name} ke account me ₹{activeCustomerProfile.netUdhaar} ka pending outstanding baki hai. Kripya UPI scan ya cash se {currentShopName} me bhugtan karein. Dhanyawad!
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          const txt = `Dear ${activeCustomerProfile.name}, Namaste! Friendly bookkeeping reminder from ${currentShopName}: Your outstanding net credit balance is ₹${activeCustomerProfile.netUdhaar}. Kripya GPay/PhonePe UPI or cash se jaldi settle karein. Thank you!`;
                          navigator.clipboard.writeText(txt);
                          alert("WhatsApp draft template text successfully copied to clipboard!");
                        }}
                        className="bg-white border hover:bg-slate-50 text-[10px] text-slate-650 font-bold py-1.5 px-3 rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <ClipboardCopy size={13} /> Draft SMS copy
                      </button>
                      <a 
                        href={getWhatsAppURL(activeCustomerProfile.phone, `Dear ${activeCustomerProfile.name}, Namaste! Friendly bookkeeping reminder from ${currentShopName}: Your outstanding net credit balance is ₹${activeCustomerProfile.netUdhaar}. Kripya GPay/PhonePe UPI or cash se jaldi settle karein. Thank you!`)}
                        target="_blank"
                        rel="referrer"
                        className="bg-emerald-600 hover:bg-emerald-700 text-[10px] text-white font-extrabold py-1.5 px-4 rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <Send size={12} /> Send via WhatsApp Web
                      </a>
                    </div>
                  </div>
                )}

                {/* Dated historical transactions logs list */}
                <div className="space-y-3 pb-2 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Dated Credit Ledger Stream</h4>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          <th className="pb-2">Date posted</th>
                          <th className="pb-2">Type</th>
                          <th className="pb-2 text-right">Debit (Owed)</th>
                          <th className="pb-2 text-right">Credit (Received)</th>
                          <th className="pb-2">Reference narrative notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-slate-600">
                        {activeCustomerHistory.map(th => {
                          return (
                            <tr key={th.id} className="hover:bg-slate-55">
                              <td className="py-2.5 font-mono">{th.date}</td>
                              <td className="py-2.5">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border ${
                                  th.type === 'Credit' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                }`}>
                                  {th.type}
                                </span>
                              </td>
                              <td className="py-2.5 text-right font-mono text-rose-600 font-semibold">{th.type === 'Credit' ? `₹${th.amount}` : '-'}</td>
                              <td className="py-2.5 text-right font-mono text-emerald-650 font-bold">{th.type === 'Payment' ? `₹${th.amount}` : '-'}</td>
                              <td className="py-2.5 text-slate-500 max-w-[150px] truncate" title={th.notes}>{th.notes || 'Routine entry'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed text-slate-400 text-center py-20 rounded-2xl p-6 shadow-3xs hover:bg-slate-100/40 transition-colors flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-420">
                  <User size={30} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-600 font-sans text-xs">No Customer Profile Selected</h4>
                  <p className="text-[11px] leading-relaxed max-w-[280px]">
                    Click any outstanding Grahak card on the left panel grid list to fetch their CRM accounts, risk logs, and write instant SMS followup alerts.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* --- TAB 2: GENERAL CASHBOOK GALLA --- */}
      {activeTab === 'cashbook' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-850">Cashflow Register (Galla Galla Cashbook)</h3>
              <p className="text-xs text-slate-400">Review manual expense items and cash register balances</p>
            </div>
            
            <button 
              onClick={() => setShowCashForm(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-4 rounded-lg flex items-center gap-1 shadow-sm transition-colors"
            >
              <Plus size={14} /> Log Cash Entry
            </button>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <th className="p-4">Transaction Date</th>
                    <th className="p-4">Flow Type</th>
                    <th className="p-4">Category Category</th>
                    <th className="p-4">Reference Context / description</th>
                    <th className="p-4 text-right">Debit (Expense)</th>
                    <th className="p-4 text-right">Credit (Inflow)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-650">
                  {[...cashBook].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-55">
                      <td className="p-4 font-mono font-medium">{tx.date}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 font-bold rounded text-[9px] uppercase border ${
                          tx.type === 'In' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                        }`}>
                          {tx.type === 'In' ? <ArrowDownLeft size={10} /> : <ArrowUpRight size={10} />}
                          Cash {tx.type === 'In' ? 'In' : 'Out'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 font-semibold">{tx.category}</td>
                      <td className="p-4 font-medium text-slate-700">{tx.description}</td>
                      <td className="p-4 text-right font-mono text-rose-600 font-semibold">
                        {tx.type === 'Out' ? `₹${tx.amount.toFixed(2)}` : '-'}
                      </td>
                      <td className="p-4 text-right font-mono text-emerald-650 font-bold">
                        {tx.type === 'In' ? `₹${tx.amount.toFixed(2)}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Cash Actions Modal overlay */}
      {showCashForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border text-left border-slate-150 rounded-2xl w-full max-w-sm shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4 pb-2 border-b">
              <h3 className="font-extrabold text-slate-800 text-sm">Log Cashflow Entry</h3>
              <button onClick={() => setShowCashForm(false)} className="text-slate-400">
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCashTxSubmit} className="space-y-4">
              {/* Type toggle */}
              <div className="grid grid-cols-2 gap-2 bg-slate-105 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setCashType('In');
                    setCashCategory('Sales');
                  }}
                  className={`py-2 rounded-md text-xs font-bold transition-all ${
                    cashType === 'In' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  💵 Cash In (Receipt)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCashType('Out');
                    setCashCategory('Expenses');
                  }}
                  className={`py-2 rounded-md text-xs font-bold transition-all ${
                    cashType === 'Out' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  💸 Cash Out (Spend)
                </button>
              </div>

              {/* Category selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Accounting Category</label>
                <select
                  value={cashCategory}
                  onChange={(e) => setCashCategory(e.target.value as any)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-705"
                >
                  {cashType === 'In' ? (
                    <>
                      <option value="Sales">Sales Collection</option>
                      <option value="Udhaar Payment">Ledger recovery (Udhaar)</option>
                      <option value="Other">Other capital input</option>
                    </>
                  ) : (
                    <>
                      <option value="Expenses">Store Expenses (Rent, power, tea)</option>
                      <option value="Purchase">Stock procurement wholesale</option>
                      <option value="Other">Other withdrawals</option>
                    </>
                  )}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Transaction Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  value={cashAmount || ''}
                  onChange={(e) => setCashAmount(parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 1500"
                  className="w-full text-xs font-mono font-bold text-slate-800 border border-slate-200 rounded-lg p-2.5 focus:outline-hidden"
                />
              </div>

              {/* Desc */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Narrative Description reference *</label>
                <input
                  type="text"
                  required
                  value={cashDesc}
                  onChange={(e) => setCashDesc(e.target.value)}
                  placeholder="e.g. rent paid for kirana shop"
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-hidden"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100 mt-4">
                <button
                  type="button"
                  onClick={() => setShowCashForm(false)}
                  className="text-xs bg-slate-50 border p-2 px-4 rounded-lg text-slate-505"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="text-xs font-bold bg-indigo-650 hover:bg-indigo-700 text-white p-2 px-5 rounded-lg shadow-sm"
                >
                  Save cashflow Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
