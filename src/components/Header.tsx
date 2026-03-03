import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Trash2, Search, Settings, LogOut, ChevronDown, ChevronRight,
    UserCircle, Bell, Shield, LogIn, Lock, Clock, Camera, Globe, Download,
    Palette, Check
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useI18n } from '../hooks/useI18n';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

interface HeaderProps {
    searchQuery: string;
    onSearchChange: (q: string) => void;
    onHistoryToggle?: () => void;
    historyOpen?: boolean;
}

export default function Header({ searchQuery, onSearchChange, onHistoryToggle, historyOpen }: HeaderProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const { session, profile, tenant, isSuperAdmin, signOut, refreshProfile, updateLanguage, theme, setTheme } = useAuth();
    const { pushEnabled, loading: pushLoading, toggle: togglePush } = usePushNotifications(session?.user.id);
    const { canInstall, promptInstall } = useInstallPrompt();
    const { t, lang } = useI18n();

    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showThemes, setShowThemes] = useState(false);

    // Reset sub-menus when the main menu closes
    useEffect(() => {
        if (!userMenuOpen) {
            setShowSettings(false);
            setShowThemes(false);
        }
    }, [userMenuOpen]);

    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [now, setNow] = useState(new Date());
    const menuRef = useRef<HTMLDivElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const isOnPapelera = location.pathname === '/papelera';

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setUserMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
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

    const locale = lang === 'en' ? 'en-US' : lang === 'pt' ? 'pt-BR' : 'es-AR';
    const monthStr = now.toLocaleDateString(locale, { month: 'short' });
    const capitalizedMonth = monthStr.charAt(0).toUpperCase() + monthStr.slice(1);
    const day = String(now.getDate()).padStart(2, '0');
    const monthNum = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const dateFormatted = `${capitalizedMonth} ${day}.${monthNum}.${year}`;

    const timeFormatted = now.toLocaleTimeString(locale, {
        hour: '2-digit', minute: '2-digit', hour12: false
    });

    return (
        <header className="header">
            {/* Left — User dropdown (replaces logo) + Search Box */}
            <div className="header-left">
                <div ref={menuRef}>
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

                                            {/* Temas */}
                                            <button
                                                className={`dropdown-item dropdown-item--sub ${showThemes ? 'active-submenu-item' : ''}`}
                                                onClick={() => setShowThemes(!showThemes)}
                                                style={{ display: 'flex', alignItems: 'center', width: '100%', borderBottom: showThemes ? 'none' : undefined }}
                                            >
                                                <Palette size={14} />
                                                {(t as any).themes || 'Temas'}
                                                <span style={{ marginLeft: 'auto' }}>
                                                    {showThemes ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                </span>
                                            </button>

                                            {showThemes && (
                                                <div className="themes-grid-container">
                                                    <div className="themes-grid">
                                                        <button className={`theme-card ${theme === 'azurite' ? 'active' : ''}`} onClick={() => setTheme('azurite')}>
                                                            <div className="theme-preview theme-preview-azurite">
                                                                <div className="preview-header"></div>
                                                                <div className="preview-body">
                                                                    <div className="preview-sidebar"></div>
                                                                    <div className="preview-content"></div>
                                                                </div>
                                                            </div>
                                                            <span className="theme-card-name">Ejecutivo {theme === 'azurite' && <Check size={12} />}</span>
                                                        </button>

                                                        <button className={`theme-card ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')}>
                                                            <div className="theme-preview theme-preview-light">
                                                                <div className="preview-header"></div>
                                                                <div className="preview-body">
                                                                    <div className="preview-sidebar"></div>
                                                                    <div className="preview-content"></div>
                                                                </div>
                                                            </div>
                                                            <span className="theme-card-name">Claro {theme === 'light' && <Check size={12} />}</span>
                                                        </button>

                                                        <button className={`theme-card ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')}>
                                                            <div className="theme-preview theme-preview-dark">
                                                                <div className="preview-header"></div>
                                                                <div className="preview-body">
                                                                    <div className="preview-sidebar"></div>
                                                                    <div className="preview-content"></div>
                                                                </div>
                                                            </div>
                                                            <span className="theme-card-name">Oscuro {theme === 'dark' && <Check size={12} />}</span>
                                                        </button>

                                                        <button className={`theme-card ${theme === 'earth' ? 'active' : ''}`} onClick={() => setTheme('earth')}>
                                                            <div className="theme-preview theme-preview-earth">
                                                                <div className="preview-header"></div>
                                                                <div className="preview-body">
                                                                    <div className="preview-sidebar"></div>
                                                                    <div className="preview-content"></div>
                                                                </div>
                                                            </div>
                                                            <span className="theme-card-name">Tierra {theme === 'earth' && <Check size={12} />}</span>
                                                        </button>

                                                        <button className={`theme-card ${theme === 'cherry' ? 'active' : ''}`} onClick={() => setTheme('cherry')}>
                                                            <div className="theme-preview theme-preview-cherry">
                                                                <div className="preview-header"></div>
                                                                <div className="preview-body">
                                                                    <div className="preview-sidebar"></div>
                                                                    <div className="preview-content"></div>
                                                                </div>
                                                            </div>
                                                            <span className="theme-card-name">Cálido {theme === 'cherry' && <Check size={12} />}</span>
                                                        </button>

                                                        <button className={`theme-card ${theme === 'oceanic' ? 'active' : ''}`} onClick={() => setTheme('oceanic')}>
                                                            <div className="theme-preview theme-preview-oceanic">
                                                                <div className="preview-header"></div>
                                                                <div className="preview-body">
                                                                    <div className="preview-sidebar"></div>
                                                                    <div className="preview-content"></div>
                                                                </div>
                                                            </div>
                                                            <span className="theme-card-name">Océano {theme === 'oceanic' && <Check size={12} />}</span>
                                                        </button>

                                                        <button className={`theme-card ${theme === 'mineral' ? 'active' : ''}`} onClick={() => setTheme('mineral')}>
                                                            <div className="theme-preview theme-preview-mineral">
                                                                <div className="preview-header"></div>
                                                                <div className="preview-body">
                                                                    <div className="preview-sidebar"></div>
                                                                    <div className="preview-content"></div>
                                                                </div>
                                                            </div>
                                                            <span className="theme-card-name">Mineral {theme === 'mineral' && <Check size={12} />}</span>
                                                        </button>

                                                        <button className={`theme-card ${theme === 'autumn' ? 'active' : ''}`} onClick={() => setTheme('autumn')}>
                                                            <div className="theme-preview theme-preview-autumn">
                                                                <div className="preview-header"></div>
                                                                <div className="preview-body">
                                                                    <div className="preview-sidebar"></div>
                                                                    <div className="preview-content"></div>
                                                                </div>
                                                            </div>
                                                            <span className="theme-card-name">Otoño {theme === 'autumn' && <Check size={12} />}</span>
                                                        </button>

                                                        <button className={`theme-card ${theme === 'industrial' ? 'active' : ''}`} onClick={() => setTheme('industrial')}>
                                                            <div className="theme-preview theme-preview-industrial">
                                                                <div className="preview-header"></div>
                                                                <div className="preview-body">
                                                                    <div className="preview-sidebar"></div>
                                                                    <div className="preview-content"></div>
                                                                </div>
                                                            </div>
                                                            <span className="theme-card-name">Industrial {theme === 'industrial' && <Check size={12} />}</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

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

                                    {canInstall && (
                                        <button
                                            className="dropdown-item"
                                            onClick={() => { void promptInstall(); setUserMenuOpen(false); }}
                                        >
                                            <Download size={15} />
                                            {(t as any).install_app || 'Instalar app'}
                                        </button>
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

                {/* Search Box - Now part of header-left */}
                {session && (
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
                )}
            </div>

            {session && isSuperAdmin && (
                <div className="header-center" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
                    <Link to="/admin" className="header-admin-link">
                        Panel de administrador
                    </Link>
                </div>
            )}

            {/* Right — Date/Time + nav icons (only when logged in) */}
            {session && (
                <div className="header-right">
                    <div className="header-datetime-box" style={{ display: 'flex', gap: '2rem', marginRight: '1rem', color: 'var(--slate-500)', fontSize: '0.9rem', fontWeight: 600, alignItems: 'center' }}>
                        <span>{dateFormatted}</span>
                        <span>{timeFormatted} hs</span>
                    </div>

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

                    <button
                        className={`header-icon-btn ${isOnPapelera ? 'header-icon-btn--active' : ''}`}
                        onClick={() => navigate(isOnPapelera ? '/' : '/papelera')}
                        title={t.trash}
                    >
                        <Trash2 size={18} />
                    </button>

                </div>
            )}
        </header>
    );
}
