import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import RecycleBin from './pages/RecycleBin';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { useTheme } from './hooks/useTheme';
import './App.css';

export default function App() {
  useTheme(); // Initialize theme on load

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

function AppContent() {
  const { isSuperAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  return (
    <Routes>
      {/* Public auth routes (no header) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected app routes */}
      <Route path="/*" element={
        <ProtectedRoute>
          <div className="app-shell">
            <Header
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onHistoryToggle={() => setShowHistory((v) => !v)}
              historyOpen={showHistory}
            />
            <Routes>
              <Route path="/" element={
                <Dashboard
                  searchQuery={searchQuery}
                  showHistory={showHistory}
                  onCloseHistory={() => setShowHistory(false)}
                />
              } />
              <Route path="/papelera" element={<RecycleBin />} />
              <Route
                path="/admin"
                element={isSuperAdmin ? <AdminPanel /> : <Navigate to="/" replace />}
              />
            </Routes>
            <footer className="app-footer">
              © 2025 BuildCare – Sistema de Gestión Edilicia
            </footer>
          </div>
        </ProtectedRoute>
      } />
    </Routes>
  );
}


