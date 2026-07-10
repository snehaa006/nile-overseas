import { Routes, Route, Navigate } from "react-router-dom";
import { WebsiteLayout } from "@/website/WebsiteLayout";
import { HomePage } from "@/website/pages/HomePage";
import { AboutPage } from "@/website/pages/AboutPage";
import { ProductsPage } from "@/website/pages/ProductsPage";
import { BlanketDetailPage } from "@/website/pages/BlanketDetailPage";
import { ContactPage } from "@/website/pages/ContactPage";

import { LoginPage } from "@/admin/pages/LoginPage";
import { ProtectedRoute } from "@/admin/ProtectedRoute";
import { AdminLayout } from "@/admin/AdminLayout";
import { DashboardPage } from "@/admin/pages/DashboardPage";
import { ProductsAdminPage } from "@/admin/pages/ProductsAdminPage";
import { BlanketEditorPage } from "@/admin/pages/BlanketEditorPage";
import { StockPage } from "@/admin/pages/StockPage";
import { ProcessPage } from "@/admin/pages/ProcessPage";
import { ProductionPage } from "@/admin/pages/ProductionPage";
import { WebsiteSettingsPage } from "@/admin/pages/WebsiteSettingsPage";
import { ReportsPage } from "@/admin/pages/ReportsPage";

export function App() {
  return (
    <Routes>
      {/* Public website */}
      <Route element={<WebsiteLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:sku" element={<BlanketDetailPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Route>

      {/* Admin */}
      <Route path="/admin/login" element={<LoginPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="products" element={<ProductsAdminPage />} />
        <Route path="products/new" element={<BlanketEditorPage />} />
        <Route path="products/:id" element={<BlanketEditorPage />} />
        <Route path="stock" element={<StockPage />} />
        <Route path="process" element={<ProcessPage />} />
        <Route path="production" element={<ProductionPage />} />
        <Route path="settings" element={<WebsiteSettingsPage />} />
        <Route path="reports" element={<ReportsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
