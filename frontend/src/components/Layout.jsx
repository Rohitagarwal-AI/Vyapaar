import {
  Bot,
  Boxes,
  BrainCircuit,
  CreditCard,
  FileText,
  LayoutDashboard,
  Menu,
  Users,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { id: "dashboard", label: "Command Center", icon: LayoutDashboard },
  { id: "customers", label: "Customers", icon: Users },
  { id: "credits", label: "Credit Ledger", icon: CreditCard },
  { id: "inventory", label: "Inventory", icon: Boxes },
  { id: "automation", label: "Automation", icon: BrainCircuit },
  { id: "ai", label: "AI Assistant", icon: Bot },
  { id: "reports", label: "Reports", icon: FileText },
];

export default function Layout({ currentPage, setCurrentPage, children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">V</div>
          <div>
            <h1>Vyapaar</h1>
            <p>Smart retail OS</p>
          </div>
        </div>
        <nav className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className={currentPage === item.id ? "nav-item active" : "nav-item"}
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id);
                  setOpen(false);
                }}
                type="button"
                title={item.label}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <button
            className="icon-button mobile-only"
            onClick={() => setOpen((value) => !value)}
            type="button"
            title="Open menu"
          >
            <Menu size={20} />
          </button>
          <div>
            <p className="eyebrow">Free local retail automation workspace</p>
            <h2>{navItems.find((item) => item.id === currentPage)?.label}</h2>
          </div>
          <div className="topbar-status">
            <span>Local demo mode</span>
            <strong>No paid API required</strong>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
