import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
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
import ParentDashboard from './pages/ParentDashboard';
import ParentChildren from './pages/ParentChildren';
import AddChild from './pages/AddChild';
import ParentLayout from './components/ParentLayout';
import SuperAdminLogin from './pages/SuperAdminLogin';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SaasLanding from './pages/SaasLanding';
import ParentSubscription from './pages/ParentSubscription';
import ParentNotifications from './pages/ParentNotifications';
import { PWAInstallPrompt, OfflineStatusIndicator, SyncStatusIndicator } from './components/PWAComponents';

function App() {
  console.log('App component rendering - starting...');
  
  const { isAuthenticated, userType } = useAuthStore();
  console.log('Auth state:', { isAuthenticated, userType });
  
  // Start with a simple state to bypass auth issues for now
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    console.log('App component mounted - setting ready state');
    // Simulate a short delay then show the landing page
    const timer = setTimeout(() => {
      console.log('App ready - showing landing page');
      setIsReady(true);
    }, 1000); // 1 second delay
    
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    console.log('Showing initial loading screen...');
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-blue-800 mb-2">VaccineTrack</h2>
          <p className="text-blue-600">Loading your pediatric vaccination management system...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      {/* PWA Components */}
      <PWAInstallPrompt />
      <OfflineStatusIndicator />
      
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<SaasLanding />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/clinic-login" element={<Login />} />
        <Route path="/super-admin/login" element={<SuperAdminLogin />} />
        
        {/* Parent routes */}
        <Route path="/parent/*" element={isAuthenticated && userType === 'parent' ? <ParentLayout /> : <Navigate to="/" replace />}>
          <Route index element={<Navigate to="/parent/dashboard" replace />} />
          <Route path="dashboard" element={<SyncStatusIndicator><ParentDashboard /></SyncStatusIndicator>} />
          <Route path="children" element={<SyncStatusIndicator><ParentChildren /></SyncStatusIndicator>} />
          <Route path="children/add" element={<SyncStatusIndicator><AddChild /></SyncStatusIndicator>} />
          <Route path="subscription" element={<ParentSubscription />} />
          <Route path="notifications" element={<ParentNotifications />} />
        </Route>
        
        {/* Clinic routes */}
        <Route path="/clinic/*" element={isAuthenticated && userType === 'clinic' ? <Layout /> : <Navigate to="/clinic-login" replace />}>
          <Route index element={<Navigate to="/clinic/dashboard" replace />} />
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

        {/* Super Admin routes */}
        <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
        
        {/* Legacy clinic routes (redirect to new structure) */}
        <Route path="/login" element={<Navigate to="/clinic-login" replace />} />
        <Route path="/dashboard" element={<Navigate to="/clinic/dashboard" replace />} />
        <Route path="/patients" element={<Navigate to="/clinic/patients" replace />} />
        <Route path="/patients/:id" element={<Navigate to="/clinic/patients/:id" replace />} />
        <Route path="/vaccinations/*" element={<Navigate to="/clinic/vaccinations/*" replace />} />
        <Route path="/appointments" element={<Navigate to="/clinic/appointments" replace />} />
        <Route path="/inventory" element={<Navigate to="/clinic/inventory" replace />} />
        <Route path="/reports" element={<Navigate to="/clinic/reports" replace />} />
        <Route path="/settings" element={<Navigate to="/clinic/settings" replace />} />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;