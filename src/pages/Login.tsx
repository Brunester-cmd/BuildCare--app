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
    <div className="login-page-wrapper">
      <div className="login-card-premium">
        <div className="login-header">
          <div className="login-logo-container">
            <LogIn size={32} className="login-logo-icon" />
          </div>
          <h1 className="login-brand">BuildCare</h1>
          <p className="login-subtitle">
            {mode === 'login' ? 'Bienvenido/a de nuevo' : 'Únete a BuildCare'}
          </p>
        </div>

        {error && (
          <div className="login-alert login-alert-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="login-alert login-alert-success">
            <Check size={16} />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          {mode === 'register' && (
            <div className="input-group">
              <label htmlFor="fullName">Nombre completo</label>
              <div className="input-wrapper">
                <UserCircle size={18} className="input-icon" />
                <input
                  id="fullName"
                  type="text"
                  required
                  placeholder="Ej: Juan Pérez"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="input-group">
            <label htmlFor="email">Correo electrónico</label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                id="email"
                type="email"
                required
                placeholder="nombre@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <div className="input-wrapper">
              <KeyRound size={18} className="input-icon" />
              <input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="login-submit-btn">
            {isLoading ? (
               <div className="btn-spinner" />
            ) : (mode === 'login' ? "Entrar al Sistema" : "Crear Cuenta")}
          </button>
        </form>

        <div className="login-footer">
          <p>
            {mode === 'login' ? (
              <>
                ¿No tienes una cuenta?{' '}
                <button 
                  type="button" 
                  className="login-toggle-link"
                  onClick={() => { setMode('register'); setError(null); setMessage(null); }}
                >
                  Regístrate aquí
                </button>
              </>
            ) : (
              <>
                ¿Ya tienes una cuenta?{' '}
                <button 
                  type="button" 
                  className="login-toggle-link"
                  onClick={() => { setMode('login'); setError(null); setMessage(null); }}
                >
                  Inicia sesión
                </button>
              </>
            )}
          </p>
        </div>
      </div>

      <style>{`
        .login-page-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          width: 100%;
          background: radial-gradient(circle at top right, var(--slate-100), var(--slate-200));
          padding: 1.5rem;
        }

        .login-card-premium {
          background: white;
          padding: 2.5rem;
          border-radius: 1.5rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02);
          width: 100%;
          maxWidth: 420px;
          border: 1px solid var(--slate-200);
          animation: slideUp 0.5s ease-out;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .login-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .login-logo-container {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          border-radius: 1rem;
          background: linear-gradient(135deg, var(--amber-500), var(--amber-600));
          color: white;
          margin-bottom: 1.25rem;
          box-shadow: 0 10px 15px -3px rgba(245, 158, 11, 0.3);
        }

        .login-brand {
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--slate-900);
          letter-spacing: -0.025em;
          margin: 0;
        }

        .login-subtitle {
          color: var(--slate-500);
          margin-top: 0.5rem;
          font-size: 0.95rem;
          font-weight: 500;
        }

        .login-alert {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem 1rem;
          border-radius: 0.75rem;
          margin-bottom: 1.5rem;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .login-alert-error {
          background: #fef2f2;
          border: 1px solid #fee2e2;
          color: #dc2626;
        }

        .login-alert-success {
          background: #f0fdf4;
          border: 1px solid #dcfce7;
          color: #16a34a;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .input-group label {
          display: block;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--slate-700);
          margin-bottom: 0.5rem;
        }

        .input-wrapper {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--slate-400);
          pointer-events: none;
          transition: color 0.2s;
        }

        .input-wrapper input {
          width: 100%;
          padding: 0.875rem 1rem 0.875rem 2.75rem;
          border-radius: 0.75rem;
          border: 1px solid var(--slate-200);
          background: var(--slate-50);
          color: var(--slate-900);
          font-size: 0.95rem;
          outline: none;
          transition: all 0.2s;
        }

        .input-wrapper input:focus {
          border-color: var(--amber-500);
          background: white;
          box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.1);
        }

        .input-wrapper input:focus + .input-icon {
          color: var(--amber-500);
        }

        .login-submit-btn {
          margin-top: 1rem;
          width: 100%;
          padding: 1rem;
          border-radius: 0.75rem;
          background: var(--slate-900);
          color: white;
          font-weight: 600;
          font-size: 1rem;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          justify-content: center;
          align-items: center;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .login-submit-btn:hover:not(:disabled) {
          background: black;
          transform: translateY(-1px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        .login-submit-btn:active {
          transform: translateY(0);
        }

        .login-submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .login-footer {
          margin-top: 2rem;
          text-align: center;
          padding-top: 1.5rem;
          border-top: 1px solid var(--slate-100);
        }

        .login-footer p {
          color: var(--slate-500);
          font-size: 0.9rem;
          margin: 0;
        }

        .login-toggle-link {
          background: none;
          border: none;
          color: var(--amber-600);
          font-weight: 700;
          cursor: pointer;
          padding: 0;
          margin-left: 0.25rem;
          transition: color 0.2s;
        }

        .login-toggle-link:hover {
          color: var(--amber-700);
          text-decoration: underline;
        }

        .btn-spinner {
          height: 1.25rem;
          width: 1.25rem;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Dark mode compatibility */
        html.dark .login-page-wrapper {
          background: radial-gradient(circle at top right, #111827, #000000);
        }

        html.dark .login-card-premium {
          background: #1f2937;
          border-color: #374151;
        }

        html.dark .login-brand {
          color: white;
        }

        html.dark .input-group label {
          color: #d1d5db;
        }

        html.dark .input-wrapper input {
          background: #111827;
          border-color: #374151;
          color: white;
        }

        html.dark .login-footer {
          border-top-color: #374151;
        }
      `}</style>
    </div>
  );
}
