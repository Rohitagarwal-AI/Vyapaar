import type { ReactNode } from 'react';
import {
  BarChart3,
  Bell,
  Boxes,
  Building2,
  ChevronDown,
  ClipboardList,
  CreditCard,
  FileBarChart,
  LayoutDashboard,
  Menu,
  PackageCheck,
  Search,
  Settings,
  Truck,
  Users,
  UsersRound,
  WalletCards,
  X,
} from 'lucide-react';
import type { PageId, ShopSettings } from '../types';
import { cx } from './ui';

const navigation: Array<{ id: PageId; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'inventory', label: 'Inventory', icon: Boxes },
  { id: 'customers', label: 'Customers', icon: UsersRound },
  { id: 'orders', label: 'Orders & Sales', icon: ClipboardList },
  { id: 'payments', label: 'Payments', icon: WalletCards },
  { id: 'suppliers', label: 'Suppliers', icon: PackageCheck },
  { id: 'delivery', label: 'Delivery', icon: Truck },
  { id: 'staff', label: 'Staff', icon: Users },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'reports', label: 'Reports', icon: FileBarChart },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const pageMeta: Record<PageId, { title: string; subtitle: string }> = {
  dashboard: { title: 'Business overview', subtitle: 'A clear snapshot of your shop performance today.' },
  inventory: { title: 'Inventory', subtitle: 'Track stock, pricing and reorder alerts from one place.' },
  customers: { title: 'Customers', subtitle: 'Manage buyers, credit limits and udhaari follow-ups.' },
  orders: { title: 'Orders & sales', subtitle: 'Create GST-ready bills and keep every sale organized.' },
  payments: { title: 'Payments', subtitle: 'Monitor collections, pending balances and due dates.' },
  suppliers: { title: 'Suppliers', subtitle: 'Track purchases, vendor contacts and payable amounts.' },
  delivery: { title: 'Delivery', subtitle: 'Plan dispatches across the city and nearby villages.' },
  staff: { title: 'Staff', subtitle: 'Keep attendance, responsibilities and access permissions clear.' },
  analytics: { title: 'Analytics', subtitle: 'Understand revenue, margins and growth opportunities.' },
  reports: { title: 'Reports', subtitle: 'Download clean business records for better decisions.' },
  settings: { title: 'Settings', subtitle: 'Manage your store profile and notification preferences.' },
};

export default function Layout({
  activePage,
  onNavigate,
  shop,
  mobileOpen,
  setMobileOpen,
  children,
}: {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  shop: ShopSettings;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  children: ReactNode;
}) {
  const meta = pageMeta[activePage];

  return (
    <div className="app-shell">
      <aside className={cx('sidebar', mobileOpen && 'sidebar-open')}>
        <div className="brand-row">
          <div className="brand-mark"><Building2 size={20} /></div>
          <div><strong>Vyapaar</strong><span>Business Suite</span></div>
          <button className="mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={18} /></button>
        </div>
        <div className="shop-chip">
          <div className="shop-avatar">{shop.shopName.slice(0, 2).toUpperCase()}</div>
          <div><strong>{shop.shopName}</strong><span>Owner workspace</span></div>
          <ChevronDown size={15} />
        </div>
        <nav className="side-navigation">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setMobileOpen(false);
                }}
                className={cx(activePage === item.id && 'active')}
              >
                <Icon size={17} /><span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="sidebar-help">
          <CreditCard size={17} />
          <strong>Need help?</strong>
          <span>Ask Vyapaar AI for a quick business summary.</span>
        </div>
      </aside>
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

      <div className="workspace">
        <header className="topbar">
          <button className="menu-button" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={21} /></button>
          <div className="top-search">
            <Search size={17} />
            <input placeholder="Search products, customers or invoice no." />
            <kbd>⌘ K</kbd>
          </div>
          <div className="top-actions">
            <button className="icon-button notification-button" aria-label="Notifications"><Bell size={18} /><i /></button>
            <div className="profile-chip">
              <div>MA</div>
              <span><strong>{shop.ownerName}</strong><small>Administrator</small></span>
              <ChevronDown size={14} />
            </div>
          </div>
        </header>

        <main className="main-content">
          <div className="page-heading">
            <div><p>Sunday, 31 May 2026</p><h1>{meta.title}</h1><span>{meta.subtitle}</span></div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
