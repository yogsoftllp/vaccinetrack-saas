import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import VaccinationSchedule from './pages/VaccinationSchedule';
import VaccinationReminders from './pages/VaccinationReminders';
import Appointments from './pages/Appointments';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Layout from './components/Layout';

function App() {
  const { checkAuth, isLoading, isAuthenticated } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected routes */}
        <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" replace />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="patients" element={<ProtectedRoute><Patients /></ProtectedRoute>} />
          <Route path="patients/:id" element={<ProtectedRoute><PatientDetail /></ProtectedRoute>} />
          <Route path="vaccinations/schedule" element={<ProtectedRoute><VaccinationSchedule /></ProtectedRoute>} />
          <Route path="vaccinations/reminders" element={<ProtectedRoute><VaccinationReminders /></ProtectedRoute>} />
          <Route path="appointments" element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
          <Route path="inventory" element={<ProtectedRoute allowedRoles={['administrator', 'nurse']}><Inventory /></ProtectedRoute>} />
          <Route path="reports" element={<ProtectedRoute allowedRoles={['administrator', 'pediatrician']}><Reports /></ProtectedRoute>} />
          <Route path="settings" element={<ProtectedRoute allowedRoles={['administrator']}><Settings /></ProtectedRoute>} />
        </Route>
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;