import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { isAuthenticated, isAdmin } from './utils/auth';
import { AdminEditProvider } from './components/AdminEditToggle';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ShiftReport from './pages/ShiftReport';
import ShiftHistory from './pages/ShiftHistory';
import MonthlyReport from './pages/MonthlyReport';
import Delivery from './pages/Delivery';
import Credit from './pages/Credit';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <AdminEditProvider>
      <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/shift-report"
          element={
            <ProtectedRoute>
              <ShiftReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/shift-history"
          element={
            <ProtectedRoute>
              <ShiftHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/monthly-report"
          element={
            <ProtectedRoute>
              <MonthlyReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/delivery"
          element={
            <ProtectedRoute>
              <Delivery />
            </ProtectedRoute>
          }
        />
        <Route
          path="/credit"
          element={
            <ProtectedRoute>
              <Credit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/expenses"
          element={
            <ProtectedRoute>
              <Expenses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute requireAdmin>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </Router>
    </AdminEditProvider>
  );
}

export default App;
