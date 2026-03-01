import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import RecycleBin from './pages/RecycleBin';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Header />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/papelera" element={<RecycleBin />} />
        </Routes>
        <footer className="app-footer">
          © 2025 S'GO – Sistema de Gestión Edilicia
        </footer>
      </div>
    </BrowserRouter>
  );
}
