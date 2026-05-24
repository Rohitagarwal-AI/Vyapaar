import { useState } from "react";
import Layout from "./components/Layout.jsx";
import AITools from "./pages/AITools.jsx";
import AutomationCenter from "./pages/AutomationCenter.jsx";
import CreditTracker from "./pages/CreditTracker.jsx";
import Customers from "./pages/Customers.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Inventory from "./pages/Inventory.jsx";
import Reports from "./pages/Reports.jsx";

const pages = {
  dashboard: Dashboard,
  customers: Customers,
  credits: CreditTracker,
  inventory: Inventory,
  automation: AutomationCenter,
  ai: AITools,
  reports: Reports,
};

export default function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const Page = pages[currentPage];

  return (
    <Layout currentPage={currentPage} setCurrentPage={setCurrentPage}>
      <Page />
    </Layout>
  );
}
