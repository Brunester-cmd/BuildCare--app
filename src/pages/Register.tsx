import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Mail, User, Building2, ArrowLeft, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useI18n } from '../hooks/useI18n';

export default function Register() {
    const { t } = useI18n();
    const [form, setForm] = useState({
        fullName: '',
        email: '',
        password: '',
        companyName: '',
    });
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    function set(field: keyof typeof form, value: string) {
        setForm((p) => ({ ...p, [field]: value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Use the password provided by the user
        const { error: err } = await supabase.auth.signUp({
            email: form.email,
            password: form.password,
            options: {
                data: {
                    full_name: form.fullName,
                    company_name: form.companyName,
                    role: 'user',
                    status: 'active',
                },
                emailRedirectTo: `${window.location.origin}/reset-password`,
            },
        });

        if (err) {
            if (err.message.includes('already registered')) {
                // If the user was soft-deleted, their auth record exists but profile is gone.
                // Try to recreate the profile request.
                const { data: restored } = await supabase.rpc('re_register_user', {
                    p_email: form.email,
                    p_full_name: form.fullName,
                    p_company_name: form.companyName
                });

                if (restored) {
                    setSubmitted(true);
                } else {
                    setError(t.registration_error_exists);
                }
            } else {
                setError(`Error de Supabase: ${err.message}`);
            }
        } else {
            // signUp succeeded (or fake success due to email enumeration protection).
            // Try restoring profile just in case it was a missing profile.
            await supabase.rpc('re_register_user', {
                p_email: form.email,
                p_full_name: form.fullName,
                p_company_name: form.companyName
            });
            setSubmitted(true);
        }
        setLoading(false);
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

                {submitted ? (
                    <div className="auth-success">
                        <CheckCircle size={48} className="auth-success-icon" />
                        <h2 className="auth-title">{t.registration_success_title}</h2>
                        <p className="auth-subtitle">
                            {t.registration_success_subtitle.replace('{email}', form.email)}
                        </p>
                        <Link to="/login" className="btn btn-primary btn-full" style={{ marginTop: '1.5rem' }}>
                            <ArrowLeft size={16} /> {t.back_to_login}
                        </Link>
                    </div>
                ) : (
                    <>
                        <h2 className="auth-title">{t.register_title}</h2>
                        <p className="auth-subtitle">{t.register_subtitle}</p>

                        <form onSubmit={handleSubmit} className="auth-form">
                            {error && <div className="auth-error">{error}</div>}

                            <div className="form-group">
                                <label className="form-label">{t.full_name}</label>
                                <div className="input-icon-wrap">
                                    <User size={16} className="input-icon" />
                                    <input
                                        type="text"
                                        className="form-input form-input--icon"
                                        placeholder="Juan García"
                                        value={form.fullName}
                                        onChange={(e) => set('fullName', e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t.email_label}</label>
                                <div className="input-icon-wrap">
                                    <Mail size={16} className="input-icon" />
                                    <input
                                        type="email"
                                        className="form-input form-input--icon"
                                        placeholder={t.email_placeholder}
                                        value={form.email}
                                        onChange={(e) => set('email', e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Contraseña</label>
                                <div className="input-icon-wrap">
                                    <Wrench size={16} className="input-icon" />
                                    <input
                                        type="password"
                                        className="form-input form-input--icon"
                                        placeholder="Tu contraseña secreta"
                                        value={form.password}
                                        onChange={(e) => set('password', e.target.value)}
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t.company_name}</label>
                                <div className="input-icon-wrap">
                                    <Building2 size={16} className="input-icon" />
                                    <input
                                        type="text"
                                        className="form-input form-input--icon"
                                        placeholder="Mi Empresa S.A."
                                        value={form.companyName}
                                        onChange={(e) => set('companyName', e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                                {loading ? <span className="btn-spinner" /> : t.register_button}
                            </button>
                        </form>

                        <p className="auth-footer-text">
                            {t.has_account}{' '}
                            <Link to="/login" className="auth-link">{t.login_title}</Link>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
