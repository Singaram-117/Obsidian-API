import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Services from './pages/Services';
import Events from './pages/Events';
import Metrics from './pages/Metrics';
import ChaosEngineering from './pages/ChaosEngineering';
import Integrations from './pages/Integrations';
import Alerts from './pages/Alerts';
import Recommendations from './pages/Recommendations';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import CodeAnalyzer from './pages/CodeAnalyzer';
import ServiceManagement from './pages/ServiceManagement';
import { SocketProvider } from './contexts/SocketContext';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            {/* Landing Page */}
            <Route path="/" element={<Landing />} />
            
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected routes */}
            <Route
              path="/app/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/services" element={<Services />} />
                      <Route path="/manage" element={<ServiceManagement />} />
                      <Route path="/events" element={<Events />} />
                      <Route path="/metrics" element={<Metrics />} />
                      <Route path="/chaos" element={<ChaosEngineering />} />
                      <Route path="/integrations" element={<Integrations />} />
                      <Route path="/alerts" element={<Alerts />} />
                      <Route path="/recommendations" element={<Recommendations />} />
                      <Route path="/code-analyzer" element={<CodeAnalyzer />} />
                      <Route path="/admin" element={
                        <ProtectedRoute requireAdmin={true}>
                          <AdminDashboard />
                        </ProtectedRoute>
                      } />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Redirect old routes */}
            <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
            <Route path="/services" element={<Navigate to="/app/services" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
