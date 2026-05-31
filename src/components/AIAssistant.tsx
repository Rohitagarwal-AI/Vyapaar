import { useMemo, useState } from 'react';
import { Bot, Send, Sparkles, X } from 'lucide-react';
import type { BusinessStore } from '../types';
import { currency } from '../lib/utils';

interface Message { id: string; from: 'assistant' | 'user'; body: string; }

export default function AIAssistant({ store }: { store: BusinessStore }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', from: 'assistant', body: 'Namaste Mohit. I can explain today’s sales, stock alerts, pending payments, and delivery tasks. What would you like to check?' },
  ]);
  const lowStock = useMemo(() => store.products.filter((product) => product.stock <= product.minStock), [store.products]);
  const pending = useMemo(() => store.customers.reduce((sum, customer) => sum + customer.balance, 0), [store.customers]);

  const reply = (query: string) => {
    const prompt = query.toLowerCase();
    if (prompt.includes('stock') || prompt.includes('inventory')) {
      return `${lowStock.length} items need reorder attention. Start with ${lowStock.slice(0, 3).map((product) => `${product.name} (${product.stock} ${product.unit})`).join(', ')}.`;
    }
    if (prompt.includes('payment') || prompt.includes('due') || prompt.includes('udhaar')) {
      const topDue = [...store.customers].sort((a, b) => b.balance - a.balance)[0];
      return `Customer dues are ${currency(pending)}. Prioritize ${topDue.name}, with ${currency(topDue.balance)} pending. Send a polite reminder and confirm the next payment date.`;
    }
    if (prompt.includes('delivery') || prompt.includes('task')) {
      const openDeliveries = store.deliveries.filter((delivery) => delivery.status !== 'Delivered');
      return `${openDeliveries.length} deliveries are open. ${openDeliveries.filter((delivery) => delivery.village).length} are nearby-village routes. Group them before dispatch to save time.`;
    }
    const sales = store.orders.reduce((sum, order) => sum + order.total, 0);
    return `Your recorded sales are ${currency(sales)} with ${currency(pending)} still pending. Review low-stock hardware items and collect the oldest customer dues first.`;
  };

  const send = (value = input) => {
    if (!value.trim()) return;
    const userMessage = { id: `user-${Date.now()}`, from: 'user' as const, body: value.trim() };
    const assistantMessage = { id: `assistant-${Date.now()}`, from: 'assistant' as const, body: reply(value) };
    setMessages((current) => [...current, userMessage, assistantMessage]);
    setInput('');
  };

  return (
    <div className="assistant-root">
      {open && (
        <div className="assistant-panel">
          <div className="assistant-header">
            <div className="assistant-avatar"><Sparkles size={17} /></div>
            <div><strong>Vyapaar AI</strong><span>Business assistant · Online</span></div>
            <button onClick={() => setOpen(false)} aria-label="Close AI assistant"><X size={18} /></button>
          </div>
          <div className="assistant-messages">
            {messages.map((message) => <p key={message.id} className={message.from}>{message.body}</p>)}
          </div>
          <div className="assistant-suggestions">
            {['Stock alerts', 'Pending payments', 'Delivery tasks'].map((suggestion) => <button key={suggestion} onClick={() => send(suggestion)}>{suggestion}</button>)}
          </div>
          <form className="assistant-input" onSubmit={(event) => { event.preventDefault(); send(); }}>
            <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about your business..." />
            <button aria-label="Send message"><Send size={16} /></button>
          </form>
        </div>
      )}
      <button className="assistant-trigger" onClick={() => setOpen(!open)} aria-label="Open AI assistant">
        {open ? <X size={21} /> : <Bot size={22} />}
      </button>
    </div>
  );
}
