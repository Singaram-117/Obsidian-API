import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
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
import { SocketProvider } from './contexts/SocketContext';

function App() {
  return (
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
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/services" element={<Services />} />
                <Route path="/events" element={<Events />} />
                <Route path="/metrics" element={<Metrics />} />
                <Route path="/chaos" element={<ChaosEngineering />} />
                <Route path="/integrations" element={<Integrations />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/recommendations" element={<Recommendations />} />
                <Route path="/code-analyzer" element={<CodeAnalyzer />} />
                <Route path="/admin" element={<AdminDashboard />} />
              </Routes>
            </Layout>
          }
        />
        
        {/* Redirect old routes */}
        <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="/services" element={<Navigate to="/app/services" replace />} />
      </Routes>
    </SocketProvider>
  );
}

export default App;
