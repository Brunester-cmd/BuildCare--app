import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import RecycleBin from './pages/RecycleBin';
import AdminPanel from './pages/AdminPanel';
import DayOrdersPage from './pages/DayOrdersPage';
import HistoryPanel from './components/HistoryPanel';
import { useWorkOrders } from './hooks/useWorkOrders';
import { Download } from 'lucide-react';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

function AppContent() {
  const { session, isSuperAdmin, loading } = useAuth();
  const { loadHistory } = useWorkOrders();
  const [searchQuery, setSearchQuery] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  if (loading) {
    return (
      <div className="app-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!session) {
    return (
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <div className="app-shell">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onHistoryToggle={() => setShowHistory((v) => !v)}
        historyOpen={showHistory}
      />
      <Routes>
        <Route path="/" element={<Dashboard searchQuery={searchQuery} />} />
        <Route path="/papelera" element={<RecycleBin />} />
        <Route path="/dia" element={<DayOrdersPage />} />
        <Route
          path="/admin"
          element={isSuperAdmin ? <AdminPanel /> : <Navigate to="/" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <footer className="app-footer">
        © 2025 BuildCare – Sistema de Gestión Edilicia
      </footer>

      {showHistory && (
        <HistoryPanel
          onClose={() => setShowHistory(false)}
          loadHistory={loadHistory}
        />
      )}

      {deferredPrompt && (
        <button
          onClick={handleInstallClick}
          className="floating-install-btn btn btn-primary"
          title="Instalar Aplicación"
        >
          <Download size={20} />
        </button>
      )}
    </div>
  );
}
