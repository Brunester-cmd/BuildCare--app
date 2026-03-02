import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Wrench, Trash2, Search, Settings, LogOut, ChevronDown, ChevronRight,
    UserCircle, Bell, Shield, LogIn, Lock, Clock, Camera, Globe,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useI18n } from '../hooks/useI18n';

interface HeaderProps {
    searchQuery: string;
    onSearchChange: (q: string) => void;
    onHistoryToggle?: () => void;
    historyOpen?: boolean;
}

export default function Header({ searchQuery, onSearchChange, onHistoryToggle, historyOpen }: HeaderProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const { session, profile, tenant, isSuperAdmin, signOut, refreshProfile, updateLanguage } = useAuth();
    const { pushEnabled, loading: pushLoading, toggle: togglePush } = usePushNotifications(session?.user.id);
    const { t } = useI18n();

    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const isOnPapelera = location.pathname === '/papelera';
    const isOnAdmin = location.pathname === '/admin';

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setUserMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file || !session) return;
        setUploadingAvatar(true);

        const ext = file.name.split('.').pop();
        const path = `${session.user.id}/avatar.${ext}`;
        const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
        if (!error) {
            const { data } = supabase.storage.from('avatars').getPublicUrl(path);
            await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', session.user.id);
            await refreshProfile();
        }
        setUploadingAvatar(false);
        setUserMenuOpen(false);
    }

    async function handleSignOut() {
        setUserMenuOpen(false);
        await signOut();
        navigate('/login');
    }

    const displayName = profile?.full_name || session?.user?.email?.split('@')[0] || 'Usuario';
    const companyName = tenant?.name ?? profile?.company_name ?? '';

    return (
        <header className="header">
            {/* Left — Logo */}
            <Link to="/" className="header-logo-link">
                <div className="logo-badge">
                    <Wrench size={20} strokeWidth={2.5} />
                </div>
                <div className="header-brand">
                    <span className="brand-name">BuildCare</span>
                    <span className="brand-subtitle">{t.app_subtitle}</span>
                </div>
            </Link>

            {/* Center — User dropdown */}
            <div className="header-center" ref={menuRef}>
                {session ? (
                    <>
                        <button
                            className="user-menu-btn"
                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                            aria-expanded={userMenuOpen}
                        >
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="Avatar" className="user-avatar-img" />
                            ) : (
                                <div className="user-avatar"><UserCircle size={16} /></div>
                            )}
                            <div className="user-name-stack">
                                <span className="user-name">{displayName}</span>
                                {companyName && <span className="user-company">{companyName}</span>}
                            </div>
                            <ChevronDown size={14} className={`user-chevron ${userMenuOpen ? 'rotate' : ''}`} />
                        </button>

                        {userMenuOpen && (
                            <div className="user-dropdown">
                                {/* Profile header — click avatar to change photo */}
                                <div className="user-dropdown-profile">
                                    <button
                                        className="user-dropdown-avatar-btn"
                                        onClick={() => fileRef.current?.click()}
                                        disabled={uploadingAvatar}
                                        title={uploadingAvatar ? 'Subiendo…' : 'Cambiar foto de perfil'}
                                    >
                                        {profile?.avatar_url ? (
                                            <img src={profile.avatar_url} alt="Avatar" className="user-dropdown-avatar-img" />
                                        ) : (
                                            <UserCircle size={38} strokeWidth={1.4} />
                                        )}
                                        <span className="user-dropdown-avatar-overlay">
                                            {uploadingAvatar ? <span className="btn-spinner" /> : <Camera size={14} />}
                                        </span>
                                    </button>
                                    <input
                                        ref={fileRef}
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={handleAvatarUpload}
                                    />
                                    <div>
                                        <p className="user-dropdown-name">{displayName}</p>
                                        <p className="user-dropdown-email">{session.user.email}</p>
                                        {companyName && <p className="user-dropdown-company">{companyName}</p>}
                                    </div>
                                </div>
                                <div className="dropdown-divider" />

                                {isSuperAdmin && (
                                    <>
                                        <button className="dropdown-item dropdown-item--admin" onClick={() => { navigate('/admin'); setUserMenuOpen(false); }}>
                                            <Shield size={15} />
                                            {t.admin_panel}
                                        </button>
                                        <div className="dropdown-divider" />
                                    </>
                                )}



                                {/* Configuración section */}
                                <button
                                    className={`dropdown-item ${showSettings ? 'dropdown-item--active' : ''}`}
                                    onClick={() => setShowSettings(!showSettings)}
                                >
                                    <Settings size={15} />
                                    {t.configuracion}
                                    <span style={{ marginLeft: 'auto' }}>
                                        {showSettings ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </span>
                                </button>

                                {showSettings && (
                                    <div className="dropdown-submenu">
                                        {/* Cambiar contraseña */}
                                        <button className="dropdown-item dropdown-item--sub" onClick={async () => {
                                            if (session?.user?.email) {
                                                await supabase.auth.resetPasswordForEmail(session.user.email, {
                                                    redirectTo: `${window.location.origin}/reset-password`,
                                                });
                                                alert(t.change_password_alert || 'Te enviamos un email para cambiar tu contraseña.');
                                            }
                                            setUserMenuOpen(false);
                                        }}>
                                            <Lock size={14} />
                                            {t.change_password}
                                        </button>

                                        {/* Notificaciones Push */}
                                        <button
                                            className="dropdown-item dropdown-item--sub"
                                            onClick={async () => { await togglePush(); }}
                                            disabled={pushLoading}
                                        >
                                            <Bell size={14} />
                                            {t.push_notifications}
                                            <span className={`toggle-pill ${pushEnabled ? 'toggle-pill--active' : ''}`} />
                                        </button>

                                        {/* Idioma */}
                                        <div className="dropdown-item dropdown-item--sub no-hover">
                                            <Globe size={14} />
                                            {t.language}
                                            <select
                                                className="language-select"
                                                value={profile?.language || 'es'}
                                                onChange={(e) => updateLanguage(e.target.value)}
                                            >
                                                <option value="es">Español</option>
                                                <option value="en">English</option>
                                                <option value="pt">Português</option>
                                            </select>
                                        </div>
                                    </div>
                                )}



                                <div className="dropdown-divider" />
                                <button className="dropdown-item dropdown-item--danger" onClick={handleSignOut}>
                                    <LogOut size={15} />
                                    {t.logout}
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <Link to="/login" className="btn btn-primary btn-sm header-login-btn">
                        <LogIn size={15} />
                        {t.login}
                    </Link>
                )}
            </div>

            {/* Right — Search + nav icons (only when logged in) */}
            {session && (
                <div className="header-right">
                    <div className="search-box">
                        <Search size={15} className="search-icon" />
                        <input
                            type="text"
                            className="search-input"
                            placeholder={t.search_placeholder}
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                        {searchQuery && (
                            <button className="search-clear" onClick={() => onSearchChange('')}>✕</button>
                        )}
                    </div>

                    <button
                        className={`header-icon-btn ${isOnPapelera ? 'header-icon-btn--active' : ''}`}
                        onClick={() => navigate(isOnPapelera ? '/' : '/papelera')}
                        title={t.trash}
                    >
                        <Trash2 size={18} />
                    </button>

                    {isSuperAdmin && (
                        <button
                            className={`header-icon-btn ${isOnAdmin ? 'header-icon-btn--active' : ''}`}
                            onClick={() => navigate(isOnAdmin ? '/' : '/admin')}
                            title={t.admin_panel}
                        >
                            <Shield size={18} />
                        </button>
                    )}

                    {onHistoryToggle && (
                        <button
                            className={`header-history-btn ${historyOpen ? 'header-history-btn--active' : ''}`}
                            onClick={onHistoryToggle}
                            title={t.historial}
                        >
                            <Clock size={15} />
                            {t.historial}
                        </button>
                    )}
                </div>
            )}
        </header>
    );
}
