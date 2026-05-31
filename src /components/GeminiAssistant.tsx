/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  MessageSquare, 
  User, 
  Trash2, 
  Volume2, 
  ClipboardCheck,
  Check,
  Zap,
  TrendingUp,
  Mail,
  X
} from 'lucide-react';
import { AIMessage, BusinessStats, Product, Invoice } from '../types';

interface GeminiAssistantProps {
  businessStats: BusinessStats;
  products: Product[];
  invoices: Invoice[];
  onClose?: () => void;
}

export default function GeminiAssistant({
  businessStats,
  products,
  invoices,
  onClose
}: GeminiAssistantProps) {
  const [messages, setMessages] = useState<AIMessage[]>(() => {
    let shop = "Saraswati Kirana & General Store";
    try {
      const local = localStorage.getItem('vyapaar_session_user');
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed?.shopName) shop = parsed.shopName;
      }
    } catch (e) {}

    return [
      {
        id: 'welcome-1',
        role: 'assistant',
        content: `👋 **Namaste! Main aapka Vyapaar Buddy assistant hoon!**\n\nMain aapke *${shop}* ke saare records dekh sakta hoon. Main kya madad karu?\n\n*   📊 **Sales Analysis**: *"Mera saptahik dhandha kaisa raha?"*\n*   ⏳ **Dues Settle (Udhaar)**: *"Ramesh Sharma ke liye WhatsApp alert likhein."*\n*   📦 **Inventory Planning**: *"Surplus items ke liye combo offer suggest karein."*\n\nAap mujhe Hinglish ya English kisi me bhi puch sakte hain!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: AIMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      // Find low stock items
      const lowStockProducts = products.filter(p => p.stock <= p.minStockAlert);
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          businessStats,
          lowStockProducts,
          recentInvoices: invoices
        })
      });

      if (!response.ok) {
        throw new Error('Failed to reach full-stack partner proxy.');
      }

      const data = await response.json();
      
      const buddyResponse: AIMessage = {
        id: `buddy-${Date.now()}`,
        role: 'assistant',
        content: data.content || 'Mujhe khed hai, main abhi process nahi kar pa raha hoon. Kripya bad me prayas karein.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, buddyResponse]);
    } catch (err: any) {
      console.error(err);
      const errorMsg: AIMessage = {
        id: `buddy-err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **System Error:** Connection timeout. Please make sure the backend dev server is active, and confirm you have entered your **GEMINI_API_KEY** in **Settings > Secrets** so you can leverage Gemini's analytical power.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    if (confirm('Clear assistant convo history?')) {
      setMessages([
        {
          id: 'welcome-2',
          role: 'assistant',
          content: 'Chat cleared. Ask me any accounting, GST, ledger, stock combo bundles or billing advice questions!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden h-full flex flex-col justify-between">
      {/* Top Title bar */}
      <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Bot size={18} className="animate-bounce" />
          </div>
          <div>
            <span className="font-extrabold text-slate-800 text-xs block">Vyapaar Buddy AI Coach</span>
            <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
              <Sparkles size={10} className="text-amber-500" /> Powered by Gemini 3.5 Flash
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5">
          <button 
            onClick={clearChat}
            className="text-slate-350 hover:text-slate-500 p-1.5 rounded-lg transition-colors"
            title="Clear Chat history"
          >
            <Trash2 size={15} />
          </button>
          
          {onClose && (
            <button 
              onClick={onClose}
              className="text-slate-350 hover:text-slate-500 p-1.5 rounded-lg transition-colors border border-slate-150 bg-white shadow-2xs"
              title="Close Assistant Drawer"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Messages layout frame */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((msg) => (
          <div 
            key={msg.id}
            className={`flex gap-3 max-w-[85%] ${
              msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
            } animate-in fade-in slide-in-from-bottom-2 duration-150`}
          >
            {/* Persona Bubble */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-indigo-50 text-indigo-700'
            }`}>
              {msg.role === 'user' ? <User size={13} /> : <Bot size={13} />}
            </div>

            {/* Content text */}
            <div className="space-y-1">
              <div className={`rounded-2xl p-3.5 text-xs select-text ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-white border border-slate-105 text-slate-700 rounded-tl-none shadow-2xs'
              }`}>
                {/* Simulated lightweight markdown parser */}
                <div className="space-y-2 whitespace-pre-wrap leading-relaxed">
                  {msg.content.split('\n\n').map((para, pIdx) => {
                    // Render simple headlines, bullet points, and formatting on-fly safely without third party parser errors
                    if (para.startsWith('👋') || para.startsWith('📊') || para.startsWith('⏳') || para.startsWith('📦')) {
                      return <p key={pIdx} className="font-bold text-xs">{para}</p>;
                    }
                    if (para.startsWith('* ') || para.startsWith('- ')) {
                      return (
                        <ul key={pIdx} className="list-disc pl-4 space-y-1 my-1">
                          {para.split('\n').map((li, lIdx) => (
                            <li key={lIdx} className="text-xs">
                              {li.replace(/^[\s*-]+/, '')}
                            </li>
                          ))}
                        </ul>
                      );
                    }
                    if (para.includes('**')) {
                      const pieces = para.split('**');
                      return (
                        <p key={pIdx} className="text-xs">
                          {pieces.map((piece, pieceIdx) => pieceIdx % 2 === 1 ? <strong key={pieceIdx} className="font-extrabold text-slate-900">{piece}</strong> : piece)}
                        </p>
                      );
                    }
                    return <p key={pIdx} className="text-xs leading-relaxed">{para}</p>;
                  })}
                </div>

                {/* Option to quick copy payment text drafts if present */}
                {msg.role === 'assistant' && (msg.content.includes('[Customer Name]') || msg.content.includes('Udhaar') || msg.content.includes('₹')) && (
                  <button 
                    onClick={() => handleCopy(msg.id, msg.content)}
                    className="mt-3 w-full border border-slate-100 hover:bg-slate-50 text-indigo-600 font-bold py-1 px-2.5 rounded-lg text-[10px] flex items-center justify-center gap-1"
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check size={12} className="text-emerald-505" /> Copied Draft Details
                      </>
                    ) : (
                      <>
                        <ClipboardCheck size={12} /> Copy Draft Reminder
                      </>
                    )}
                  </button>
                )}
              </div>
              <span className="text-[10px] text-slate-400 font-mono block px-1 text-right">
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {/* Loading Bubble */}
        {loading && (
          <div className="flex gap-3 max-w-[85%] mr-auto animate-pulse">
            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
              <Bot size={13} />
            </div>
            <div className="space-y-1">
              <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none p-4 shadow-3xs flex items-center gap-2 text-xs text-slate-400">
                <div className="flex space-x-1">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-75"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-150"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-300"></span>
                </div>
                <span>Vyapaar Buddy is analyzing baki khata books...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom inputs and quick-picks */}
      <div className="p-3 bg-white border-t border-slate-100 shrink-0">
        
        {/* Quick Suggestion Chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 no-scrollbar mb-1 shrink-0">
          <button 
            type="button"
            disabled={loading}
            onClick={() => handleSendMessage('Suggest combo products for my slow items & low stock warning list.')}
            className="text-[10px] bg-slate-50 hover:bg-slate-100/80 border border-slate-205/60 text-slate-600 font-semibold py-1 px-2.5 rounded-full whitespace-nowrap shrink-0 transition-colors"
          >
            📦 Pack Combos advice
          </button>
          <button 
            type="button"
            disabled={loading}
            onClick={() => handleSendMessage('Explain how my shop sales can reduce outstanding Credit loops.')}
            className="text-[10px] bg-slate-50 hover:bg-slate-100/80 border border-slate-205/60 text-slate-600 font-semibold py-1 px-2.5 rounded-full whitespace-nowrap shrink-0 transition-colors"
          >
            📉 Reduce Credit Loop
          </button>
          <button 
            type="button"
            disabled={loading}
            onClick={() => handleSendMessage('Write a polite WhatsApp follow up reminder for Suneeta Devi pending bills.')}
            className="text-[10px] bg-slate-50 hover:bg-slate-100/80 border border-slate-205/60 text-slate-600 font-semibold py-1 px-2.5 rounded-full whitespace-nowrap shrink-0 transition-colors"
          >
            📲 WhatsApp Suneeta Dues
          </button>
        </div>

        {/* Form panel */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputMessage);
          }}
          className="flex gap-2"
        >
          <input 
            type="text" 
            disabled={loading}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Puchhein: 'How is my business profit summary?'..."
            className="flex-1 text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-hidden focus:border-indigo-500 font-medium text-slate-700"
          />
          <button 
            type="submit"
            disabled={loading || !inputMessage.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 rounded-lg flex items-center justify-center transition-colors shadow-xs shrink-0 disabled:opacity-50 disabled:hover:bg-indigo-600"
          >
            <Send size={15} />
          </button>
        </form>
      </div>

    </div>
  );
}
