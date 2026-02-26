import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Admin from './pages/Admin';
import Kiosks from './pages/Kiosks';
import ProblemTypes from './pages/admin/ProblemTypes';
import VisitTypes from './pages/admin/VisitTypes';
import VisitReport from './pages/admin/VisitReport';
import VisitForm from './pages/VisitForm';
import KioskMap from './pages/KioskMap';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import './i18n';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <Layout>
                  <Admin />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/kiosks"
            element={
              <ProtectedRoute requiredRole="admin">
                <Layout>
                  <Kiosks />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/problem-types"
            element={
              <ProtectedRoute requiredRole="admin">
                <Layout>
                  <ProblemTypes />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/visit-types"
            element={
              <ProtectedRoute requiredRole="admin">
                <Layout>
                  <VisitTypes />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute>
                <Layout>
                  <VisitReport />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/visit-form"
            element={
              <ProtectedRoute>
                <Layout>
                  <VisitForm />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/map"
            element={
              <ProtectedRoute>
                <Layout>
                  <KioskMap />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
