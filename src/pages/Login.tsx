import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, KeyRound, Mail, AlertCircle, Check, UserCircle } from 'lucide-react';

export default function Login() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const { error: signInError } = await signIn(email, password);
        if (signInError) {
          setError('Credenciales inválidas. Por favor intenta de nuevo.');
        }
      } else {
        if (!fullName.trim()) {
          setError('Por favor ingresa tu nombre completo.');
          setIsLoading(false);
          return;
        }
        const { error: signUpError } = await signUp(email, password, fullName);
        if (signUpError) {
          setError(`Error al registrarse: ${signUpError}`);
        } else {
          setMessage('¡Registro exitoso! Por favor espera la aprobación del administrador.');
          setMode('login');
        }
      }
    } catch (err) {
      setError('Ocurrió un error inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-split-container">
      {/* Left Side: Branding & Visual */}
      <div className="login-visual-side" style={{ backgroundImage: `url('file:///C:/Users/usuario/.gemini/antigravity/brain/cfb7f35c-ad4b-4047-bd98-826b902a76b2/login_bg_premium_1778069310256.png')` }}>
        <div className="visual-overlay"></div>
        <div className="visual-content">
          <div className="visual-logo">
            <LogIn size={40} />
          </div>
          <h1 className="visual-title">BuildCare</h1>
          <p className="visual-description">
            Gestión Inteligente de Órdenes de Trabajo para el Mantenimiento del Mañana.
          </p>
          <div className="visual-stats">
            <div className="stat-item">
              <span className="stat-value">+10k</span>
              <span className="stat-label">Órdenes Gestionadas</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-value">24/7</span>
              <span className="stat-label">Soporte IA Activo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="login-form-side">
        <div className="form-container-inner">
          <div className="form-header">
            <h2 className="form-title">
              {mode === 'login' ? 'Bienvenido de nuevo' : 'Crear Cuenta'}
            </h2>
            <p className="form-subtitle">
              {mode === 'login' 
                ? 'Ingresa tus credenciales para acceder a tu panel de control.' 
                : 'Completa los datos para registrarte en la plataforma BuildCare.'}
            </p>
          </div>

          {error && (
            <div className="login-alert-premium error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="login-alert-premium success">
              <Check size={18} />
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="premium-form">
            {mode === 'register' && (
              <div className="premium-input-group">
                <label>Nombre Completo</label>
                <div className="input-with-icon">
                  <UserCircle className="field-icon" size={20} />
                  <input
                    type="text"
                    required
                    placeholder="Nombre y Apellido"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="premium-input-group">
              <label>Correo Electrónico</label>
              <div className="input-with-icon">
                <Mail className="field-icon" size={20} />
                <input
                  type="email"
                  required
                  placeholder="e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="premium-input-group">
              <label>Contraseña</label>
              <div className="input-with-icon">
                <KeyRound className="field-icon" size={20} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {mode === 'login' && (
              <div className="form-options">
                <label className="remember-me">
                  <input type="checkbox" />
                  <span>Recordarme</span>
                </label>
                <button type="button" className="forgot-password">¿Olvidaste tu contraseña?</button>
              </div>
            )}

            <button type="submit" disabled={isLoading} className="premium-submit-btn">
              {isLoading ? (
                <div className="loader-dots">
                  <span></span><span></span><span></span>
                </div>
              ) : (
                <>
                  {mode === 'login' ? 'Iniciar Sesión' : 'Registrar Usuario'}
                </>
              )}
            </button>
          </form>

          <div className="premium-footer">
            <p>
              {mode === 'login' ? (
                <>
                  ¿Aún no tienes cuenta?{' '}
                  <button onClick={() => { setMode('register'); setError(null); setMessage(null); }}>
                    Regístrate gratis
                  </button>
                </>
              ) : (
                <>
                  ¿Ya eres miembro?{' '}
                  <button onClick={() => { setMode('login'); setError(null); setMessage(null); }}>
                    Inicia sesión ahora
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .login-split-container {
          display: flex;
          min-height: 100vh;
          width: 100%;
          background: #fff;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        /* Visual Side */
        .login-visual-side {
          flex: 1.2;
          position: relative;
          background-size: cover;
          background-position: center;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4rem;
          color: white;
          overflow: hidden;
        }

        @media (max-width: 1024px) {
          .login-visual-side { display: none; }
        }

        .visual-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.8) 100%);
        }

        .visual-content {
          position: relative;
          z-index: 1;
          max-width: 500px;
        }

        .visual-logo {
          width: 64px;
          height: 64px;
          background: var(--amber-500);
          border-radius: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 2rem;
          box-shadow: 0 10px 30px rgba(245, 158, 11, 0.4);
        }

        .visual-title {
          font-size: 3.5rem;
          font-weight: 800;
          letter-spacing: -0.04em;
          margin-bottom: 1.5rem;
          line-height: 1;
        }

        .visual-description {
          font-size: 1.25rem;
          color: var(--slate-300);
          line-height: 1.6;
          margin-bottom: 3rem;
        }

        .visual-stats {
          display: flex;
          gap: 2rem;
          align-items: center;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
        }

        .stat-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: white;
        }

        .stat-label {
          font-size: 0.875rem;
          color: var(--slate-400);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .stat-divider {
          width: 1px;
          height: 40px;
          background: rgba(255, 255, 255, 0.1);
        }

        /* Form Side */
        .login-form-side {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          background: #fafafa;
        }

        .form-container-inner {
          width: 100%;
          max-width: 440px;
        }

        .form-header {
          margin-bottom: 2.5rem;
        }

        .form-title {
          font-size: 2.5rem;
          font-weight: 900;
          color: #000000;
          letter-spacing: -0.04em;
          margin-bottom: 0.75rem;
          line-height: 1.1;
        }

        .form-subtitle {
          color: var(--slate-500);
          font-size: 1.05rem;
          line-height: 1.5;
        }

        .login-alert-premium {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          border-radius: 1rem;
          margin-bottom: 2rem;
          font-size: 0.95rem;
          font-weight: 500;
          animation: shake 0.4s ease-in-out;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .login-alert-premium.error {
          background: #fef2f2;
          border: 1px solid #fee2e2;
          color: #b91c1c;
        }

        .login-alert-premium.success {
          background: #f0fdf4;
          border: 1px solid #dcfce7;
          color: #15803d;
        }

        .premium-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .premium-input-group label {
          display: block;
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--slate-700);
          margin-bottom: 0.6rem;
        }

        .input-with-icon {
          position: relative;
        }

        .field-icon {
          position: absolute;
          left: 1.25rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--slate-400);
          transition: color 0.3s;
        }

        .input-with-icon input {
          width: 100%;
          padding: 1.125rem 1.25rem 1.125rem 3.5rem;
          border-radius: 1rem;
          border: 1px solid var(--slate-300);
          background: white;
          color: #000000;
          font-size: 1rem;
          font-weight: 500;
          outline: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }

        .input-with-icon input:focus {
          border-color: var(--amber-500);
          box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.1), 0 10px 15px -3px rgba(0,0,0,0.05);
        }

        .input-with-icon input::placeholder {
          color: var(--slate-600);
          opacity: 1;
        }

        .input-with-icon input:focus + .field-icon {
          color: var(--amber-600);
        }

        .form-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: -0.5rem;
        }

        .remember-me {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          color: var(--slate-600);
          cursor: pointer;
        }

        .remember-me input {
          accent-color: var(--amber-600);
        }

        .forgot-password {
          background: none;
          border: none;
          color: var(--slate-500);
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.2s;
        }

        .forgot-password:hover {
          color: var(--amber-700);
        }

        .premium-submit-btn {
          margin-top: 1rem;
          width: 100%;
          padding: 1.125rem;
          border-radius: 1rem;
          background: var(--amber-600);
          color: white;
          font-weight: 700;
          font-size: 1.1rem;
          border: none;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          justify-content: center;
          align-items: center;
          box-shadow: 0 10px 20px -5px rgba(245, 158, 11, 0.4);
        }

        .premium-submit-btn:hover:not(:disabled) {
          background: var(--amber-700);
          transform: translateY(-2px);
          box-shadow: 0 15px 30px -5px rgba(245, 158, 11, 0.5);
        }

        .premium-submit-btn:active {
          transform: translateY(0);
        }

        .premium-submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .premium-footer {
          margin-top: 3rem;
          text-align: center;
          padding-top: 2rem;
          border-top: 1px solid var(--slate-200);
        }

        .premium-footer p {
          color: var(--slate-500);
          font-size: 1rem;
        }

        .premium-footer button {
          background: none;
          border: none;
          color: var(--amber-600);
          font-weight: 700;
          cursor: pointer;
          margin-left: 0.35rem;
          transition: all 0.2s;
        }

        .premium-footer button:hover {
          color: var(--amber-700);
          text-decoration: underline;
        }

        .loader-dots {
          display: flex;
          gap: 6px;
        }

        .loader-dots span {
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          animation: dotPulse 1.4s infinite ease-in-out both;
        }

        .loader-dots span:nth-child(1) { animation-delay: -0.32s; }
        .loader-dots span:nth-child(2) { animation-delay: -0.16s; }

        @keyframes dotPulse {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1.0); }
        }

        /* Dark Mode Support */
        html.dark .login-split-container { background: #0f172a; }
        html.dark .login-form-side { background: #0f172a; }
        html.dark .form-title { color: white; }
        html.dark .premium-input-group label { color: var(--slate-300); }
        html.dark .input-with-icon input {
          background: #1e293b;
          border-color: #334155;
          color: white;
        }
        html.dark .premium-footer { border-top-color: #334155; }
      `}</style>
    </div>
  );
}
