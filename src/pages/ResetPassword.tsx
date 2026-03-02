import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useI18n } from '../hooks/useI18n';

export default function ResetPassword() {
    const { t } = useI18n();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [done, setDone] = useState(false);
    const [hasSession, setHasSession] = useState(false);

    useEffect(() => {
        // Supabase sets the session from the URL hash on this page
        supabase.auth.getSession().then(({ data }) => {
            setHasSession(!!data.session);
        });
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (password.length < 8) {
            setError(t.min_characters.replace('{count}', '8'));
            return;
        }
        if (password !== confirm) {
            setError(t.passwords_dont_match);
            return;
        }
        setError('');
        setLoading(true);

        const { error: err } = await supabase.auth.updateUser({ password });
        setLoading(false);

        if (err) {
            setError(t.reset_error_link);
        } else {
            setDone(true);
            setTimeout(() => navigate('/'), 3000);
        }
    }

    if (!hasSession) {
        return (
            <div className="auth-screen">
                <div className="auth-card">
                    <h2 className="auth-title">{t.invalid_link}</h2>
                    <p className="auth-subtitle">{t.link_expired}</p>
                    <button className="btn btn-primary btn-full" onClick={() => navigate('/forgot-password')}>
                        {t.request_new_link}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-screen">
            <div className="auth-card">
                <div className="auth-logo">
                    <div className="logo-badge logo-badge--lg"><Wrench size={28} strokeWidth={2.5} /></div>
                    <div>
                        <h1 className="auth-app-name">BuildCare</h1>
                        <p className="auth-app-sub">{t.app_subtitle}</p>
                    </div>
                </div>

                {done ? (
                    <div className="auth-success">
                        <CheckCircle size={48} className="auth-success-icon" />
                        <h2 className="auth-title">{t.reset_success_title}</h2>
                        <p className="auth-subtitle">{t.redirecting_dashboard}</p>
                    </div>
                ) : (
                    <>
                        <h2 className="auth-title">{t.create_password_title}</h2>
                        <p className="auth-subtitle">{t.create_password_subtitle}</p>
                        <form onSubmit={handleSubmit} className="auth-form">
                            {error && <div className="auth-error">{error}</div>}
                            <div className="form-group">
                                <label className="form-label">{t.new_password}</label>
                                <div className="input-icon-wrap">
                                    <Lock size={16} className="input-icon" />
                                    <input
                                        type={showPass ? 'text' : 'password'}
                                        className="form-input form-input--icon form-input--icon-right"
                                        placeholder={t.min_characters.replace('{count}', '8')}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button type="button" className="input-icon-right" onClick={() => setShowPass(!showPass)}>
                                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t.confirm_password}</label>
                                <div className="input-icon-wrap">
                                    <Lock size={16} className="input-icon" />
                                    <input
                                        type={showPass ? 'text' : 'password'}
                                        className="form-input form-input--icon"
                                        placeholder={t.password_placeholder}
                                        value={confirm}
                                        onChange={(e) => setConfirm(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                                {loading ? <span className="btn-spinner" /> : t.activate_account_btn}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
