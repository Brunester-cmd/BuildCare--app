import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Wrench, Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../hooks/useI18n';

export default function Login() {
    const { signIn } = useAuth();
    const { t } = useI18n();
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);
        const { error: err } = await signIn(email, password);
        setLoading(false);
        if (err) {
            setError(t.login_error);
        } else {
            navigate(from, { replace: true });
        }
    }

    return (
        <div className="auth-screen">
            <div className="auth-card">
                {/* Logo */}
                <div className="auth-logo">
                    <div className="logo-badge logo-badge--lg">
                        <Wrench size={28} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="auth-app-name">BuildCare</h1>
                        <p className="auth-app-sub">{t.app_subtitle}</p>
                    </div>
                </div>

                <h2 className="auth-title">{t.login_title}</h2>
                <p className="auth-subtitle">{t.login_subtitle}</p>

                <form onSubmit={handleSubmit} className="auth-form">
                    {error && <div className="auth-error">{error}</div>}

                    <div className="form-group">
                        <label className="form-label">{t.email_label}</label>
                        <div className="input-icon-wrap">
                            <Mail size={16} className="input-icon" />
                            <input
                                type="email"
                                className="form-input form-input--icon"
                                placeholder={t.email_placeholder}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <div className="form-label-row">
                            <label className="form-label">{t.password_label}</label>
                            <Link to="/forgot-password" className="auth-link auth-link--sm">
                                {t.forgot_password_link}
                            </Link>
                        </div>
                        <div className="input-icon-wrap">
                            <Lock size={16} className="input-icon" />
                            <input
                                type={showPass ? 'text' : 'password'}
                                className="form-input form-input--icon form-input--icon-right"
                                placeholder={t.password_placeholder}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                            />
                            <button type="button" className="input-icon-right" onClick={() => setShowPass(!showPass)}>
                                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                        {loading ? (
                            <span className="btn-spinner" />
                        ) : (
                            <><LogIn size={17} /> {t.login_button}</>
                        )}
                    </button>
                </form>

                <p className="auth-footer-text">
                    {t.no_account}{' '}
                    <Link to="/register" className="auth-link">{t.request_access}</Link>
                </p>
            </div>

            <p className="auth-copyright">{t.copyright}</p>
        </div>
    );
}
