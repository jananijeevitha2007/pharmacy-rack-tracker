import {useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Pill, Layers, BellRing, LogOut, Cross, Receipt } from 'lucide-react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Medications from './pages/Medications';
import Racks from './pages/Racks';
import Alerts from './pages/Alerts';
import Billing from './pages/Billing';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const links = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/medications', label: 'Medications', icon: Pill },
    { to: '/racks', label: 'Racks', icon: Layers },
    { to: '/billing', label: 'Billing', icon: Receipt },
    { to: '/alerts', label: 'Alerts', icon: BellRing },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="brand-row">
          <span className="brand-icon"><Cross size={22} /></span>
          <div>
            <h2>Pharmacy Tracker</h2>
            <p>Rack Management System</p>
          </div>
        </div>
      </div>
      <nav className="sidebar-nav">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={location.pathname === link.to ? 'active' : ''}
            >
              <Icon size={18} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <button onClick={handleLogout}>
          <LogOut size={16} />
          <span style={{ marginLeft: 8 }}>Logout</span>
        </button>
      </div>
    </div>
  );
}

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">{children}</div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout><Dashboard /></AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/medications"
          element={
            <ProtectedRoute>
              <AppLayout><Medications /></AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/racks"
          element={
            <ProtectedRoute>
              <AppLayout><Racks /></AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing"
          element={
            <ProtectedRoute>
              <AppLayout><Billing /></AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/alerts"
          element={
            <ProtectedRoute>
              <AppLayout><Alerts /></AppLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
