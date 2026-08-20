import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { AppLayout } from '../components/layout/AppLayout';

// Pages
import { LoginPage } from '../pages/auth/LoginPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { DataCollectionPage } from '../pages/data/DataCollectionPage';
import { ElectricityDataPage } from '../pages/data/ElectricityDataPage';
import { AnalyticsPage } from '../pages/analytics/AnalyticsPage';
import { DepartmentsPage } from '../pages/departments/DepartmentsPage';
import { EmissionFactorsPage } from '../pages/emission-factors/EmissionFactorsPage';
import { PredictionsPage } from '../pages/predictions/PredictionsPage';
import { RecommendationsPage } from '../pages/recommendations/RecommendationsPage';
import { SimulationPage } from '../pages/simulation/SimulationPage';
import { ReportsPage } from '../pages/reports/ReportsPage';
import { SettingsPage } from '../pages/settings/SettingsPage';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Application Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        
        {/* Data Collection */}
        <Route path="data" element={<DataCollectionPage />} />
        <Route path="data/electricity" element={<ElectricityDataPage />} />

        {/* Governance */}
        <Route path="departments" element={<DepartmentsPage />} />
        <Route path="emission-factors" element={<EmissionFactorsPage />} />

        {/* AI & Sustainability Intelligence */}
        <Route path="predictions" element={<PredictionsPage />} />
        <Route path="recommendations" element={<RecommendationsPage />} />
        <Route path="simulation" element={<SimulationPage />} />
        <Route path="reports" element={<ReportsPage />} />

        {/* Settings & System Diagnostics */}
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Catch-all redirect to Dashboard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
