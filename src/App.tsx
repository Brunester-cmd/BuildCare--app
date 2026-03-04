import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import RecycleBin from './pages/RecycleBin';
import AdminPanel from './pages/AdminPanel';
import DayOrdersPage from './pages/DayOrdersPage';
import HistoryPanel from './components/HistoryPanel';
import { useWorkOrders } from './hooks/useWorkOrders';
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
  const { isSuperAdmin } = useAuth();
  const { loadHistory } = useWorkOrders();
  const [searchQuery, setSearchQuery] = useState('');
  const [showHistory, setShowHistory] = useState(false);

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
    </div>
  );
}
