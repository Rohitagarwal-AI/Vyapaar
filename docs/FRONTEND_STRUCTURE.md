# Frontend Component Structure

## App Shell

- `src/App.jsx` controls current page state.
- `src/components/Layout.jsx` renders sidebar navigation and page header.
- `src/styles/index.css` contains responsive dashboard styling.

## Shared Components

- `Badge.jsx` - status tags for overdue, low stock, risk, and counts.
- `StatCard.jsx` - dashboard metric cards.
- `EmptyState.jsx` - loading and error state display.

## Pages

- `Dashboard.jsx` - business overview and suggested actions.
- `AutomationCenter.jsx` - automated follow-up queue, reorder queue, slow-stock actions, daily playbook, and smart rules.
- `Customers.jsx` - add, edit, search, and profile view.
- `CreditTracker.jsx` - customer-wise credit ledger with dated entries, dated payment history, status filters, totals, and reminder actions.
- `Inventory.jsx` - add products, low-stock alerts, dead-stock detection.
- `AITools.jsx` - reminder generator, risk analyzer, business assistant.
- `Reports.jsx` - daily, monthly, credit, and inventory reports.

## UI Layout

- Sidebar navigation for operational workflows.
- Topbar with current module name.
- Dashboard metric row for the most important numbers.
- Forms appear above tables for fast data entry.
- Tables are horizontally scrollable on small screens.
- AI tools are grouped into reminder, risk, and assistant panels.
