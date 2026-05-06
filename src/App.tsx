import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import RecycleBin from './pages/RecycleBin';
import AdminPanel from './pages/AdminPanel';
import DayOrdersPage from './pages/DayOrdersPage';
import Login from './pages/Login';
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
  const { session, profile, isSuperAdmin, isActive, loading, signOut } = useAuth();
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
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Handle users that are not yet approved
  if (!isActive && !isSuperAdmin) {
    return (
      <div className="app-shell" style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        textAlign: 'center',
        padding: '2rem',
        backgroundColor: 'var(--surface)'
      }}>
        <div style={{ 
            backgroundColor: 'var(--surface-sunken)', 
            padding: '3rem', 
            borderRadius: '1.5rem', 
            maxWidth: '500px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            border: '1px solid var(--border)'
        }}>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>⏳</div>
            <h1 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Cuenta en espera de aprobación</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6' }}>
                ¡Hola, <strong>{profile?.full_name || 'usuario'}</strong>! Tu cuenta ha sido registrada con éxito.
                <br /><br />
                Por razones de seguridad, un administrador debe revisar y aprobar tu acceso antes de que puedas utilizar el sistema. Te avisaremos cuando tu cuenta esté lista.
            </p>
            <button className="btn btn-ghost" onClick={() => signOut()}>
                Cerrar Sesión
            </button>
        </div>
      </div>
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
