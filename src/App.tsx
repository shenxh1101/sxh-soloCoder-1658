import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Dashboard from "@/pages/Dashboard";
import VehicleList from "@/pages/VehicleList";
import VehicleDetail from "@/pages/VehicleDetail";
import FuelPage from "@/pages/FuelPage";
import MaintenancePage from "@/pages/MaintenancePage";
import ReportsPage from "@/pages/ReportsPage";
import RemindersPage from "@/pages/RemindersPage";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/vehicles" element={<VehicleList />} />
          <Route path="/vehicles/new" element={<VehicleList />} />
          <Route path="/vehicles/:id" element={<VehicleDetail />} />
          <Route path="/fuel" element={<FuelPage />} />
          <Route path="/fuel/new" element={<FuelPage />} />
          <Route path="/maintenance" element={<MaintenancePage />} />
          <Route path="/maintenance/new" element={<MaintenancePage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/reminders" element={<RemindersPage />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </Layout>
    </Router>
  );
}
