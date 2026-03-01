import { Link, useLocation } from 'react-router-dom';
import { Wrench, User, Trash2, LayoutDashboard, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
    const location = useLocation();
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    return (
        <header className="header">
            <div className="header-left">
                <div className="logo-badge">
                    <Wrench size={20} strokeWidth={2.5} />
                </div>
                <div className="header-brand">
                    <span className="brand-name">S'GO</span>
                    <span className="brand-subtitle">Sistema de Órdenes de Trabajo</span>
                </div>
            </div>

            <nav className="header-nav">
                <Link
                    to="/"
                    className={`nav-link ${location.pathname === '/' ? 'nav-link--active' : ''}`}
                >
                    <LayoutDashboard size={16} />
                    Dashboard
                </Link>
                <Link
                    to="/papelera"
                    className={`nav-link ${location.pathname === '/papelera' ? 'nav-link--active' : ''}`}
                >
                    <Trash2 size={16} />
                    Papelera
                </Link>
            </nav>

            <div className="header-right">
                <div className="user-menu" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                    <div className="user-avatar">
                        <User size={18} />
                    </div>
                    <span className="user-name">Usuario</span>
                    <ChevronDown size={14} className={`user-chevron ${userMenuOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>
        </header>
    );
}
