import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useI18n } from '../hooks/useI18n';

export default function ForgotPassword() {
    const { t } = useI18n();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        setLoading(false);
        if (err) {
            setError(t.reset_error_generic);
        } else {
            setSent(true);
        }
    }

    return (
        <div className="auth-screen">
            <div className="auth-card">
                <div className="auth-logo">
                    <div className="logo-badge logo-badge--lg">
                        <Wrench size={28} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="auth-app-name">BuildCare</h1>
                        <p className="auth-app-sub">{t.app_subtitle}</p>
                    </div>
                </div>

                {sent ? (
                    <div className="auth-success">
                        <CheckCircle size={48} className="auth-success-icon" />
                        <h2 className="auth-title">{t.reset_email_sent_title}</h2>
                        <div className="auth-subtitle">
                            {t.reset_email_sent_subtitle.split('{email}')[0]}
                            <strong>{email}</strong>
                            {t.reset_email_sent_subtitle.split('{email}')[1]}
                        </div>

                        <Link to="/login" className="btn btn-primary btn-full" style={{ marginTop: '1.5rem' }}>
                            <ArrowLeft size={16} /> {t.back_to_login}
                        </Link>
                    </div>
                ) : (
                    <>
                        <h2 className="auth-title">{t.forgot_title}</h2>
                        <p className="auth-subtitle">{t.forgot_subtitle}</p>

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
                                    />
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                                {loading ? <span className="btn-spinner" /> : t.reset_button}
                            </button>

                            <div className="auth-footer">
                                <Link to="/login" className="auth-link">
                                    <ArrowLeft size={14} /> {t.back_to_login}
                                </Link>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
