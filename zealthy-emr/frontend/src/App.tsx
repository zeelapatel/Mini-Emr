import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, ProtectedRoute } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './components/Login';
import PatientPortal from './components/PatientPortal';
import PatientAppointments from './components/PatientAppointments';
import PatientPrescriptions from './components/PatientPrescriptions';
import Home from './components/Home';
import AdminDashboard from './components/AdminDashboard';
import PatientDetail from './components/PatientDetail';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <PatientPortal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/appointments"
              element={
                <ProtectedRoute>
                  <PatientAppointments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/prescriptions"
              element={
                <ProtectedRoute>
                  <PatientPrescriptions />
                </ProtectedRoute>
              }
            />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/patients/:id" element={<PatientDetail />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
