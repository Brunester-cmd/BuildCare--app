import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, KeyRound, Mail, AlertCircle } from 'lucide-react';

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
    <div className="login-container" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh', 
      width: '100%',
      backgroundColor: 'var(--surface)',
      color: 'var(--text-primary)'
    }}>
      <div className="login-card" style={{
        padding: '2.5rem',
        backgroundColor: 'var(--surface-sunken)',
        borderRadius: '1rem',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px',
        border: '1px solid var(--border)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            width: '64px', 
            height: '64px', 
            borderRadius: '50%', 
            backgroundColor: 'var(--primary)',
            color: 'white',
            marginBottom: '1rem'
          }}>
            <LogIn size={32} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>BuildCare</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.875rem' }}>
            {mode === 'login' ? 'Inicia sesión para continuar' : 'Crea tu cuenta para comenzar'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', backgroundColor: 'var(--surface)', padding: '0.25rem', borderRadius: '0.5rem' }}>
          <button 
            onClick={() => { setMode('login'); setError(null); setMessage(null); }}
            style={{ 
              flex: 1, padding: '0.5rem', borderRadius: '0.4rem', border: 'none', cursor: 'pointer',
              backgroundColor: mode === 'login' ? 'var(--surface-sunken)' : 'transparent',
              color: mode === 'login' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: mode === 'login' ? 600 : 400
            }}
          >
            Ingresar
          </button>
          <button 
            onClick={() => { setMode('register'); setError(null); setMessage(null); }}
            style={{ 
              flex: 1, padding: '0.5rem', borderRadius: '0.4rem', border: 'none', cursor: 'pointer',
              backgroundColor: mode === 'register' ? 'var(--surface-sunken)' : 'transparent',
              color: mode === 'register' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: mode === 'register' ? 600 : 400
            }}
          >
            Registrarse
          </button>
        </div>

        {error && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            padding: '0.75rem', 
            backgroundColor: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '0.5rem', 
            color: '#ef4444', 
            marginBottom: '1.5rem',
            fontSize: '0.875rem'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            padding: '0.75rem', 
            backgroundColor: 'rgba(34, 197, 94, 0.1)', 
            border: '1px solid rgba(34, 197, 94, 0.2)',
            borderRadius: '0.5rem', 
            color: '#22c55e', 
            marginBottom: '1.5rem',
            fontSize: '0.875rem'
          }}>
            <Check size={16} />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {mode === 'register' && (
            <div>
              <label htmlFor="fullName" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                Nombre completo
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', inset: '0 0 0 0.75rem', display: 'flex', alignItems: 'center', pointerEvents: 'none', color: 'var(--text-secondary)' }}>
                  <UserCircle size={18} />
                </div>
                <input
                  id="fullName"
                  type="text"
                  required
                  placeholder="Juan Pérez"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  className="focus-ring"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="email" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
              Correo electrónico
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', inset: '0 0 0 0.75rem', display: 'flex', alignItems: 'center', pointerEvents: 'none', color: 'var(--text-secondary)' }}>
                <Mail size={18} />
              </div>
              <input
                id="email"
                type="email"
                required
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                className="focus-ring"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', inset: '0 0 0 0.75rem', display: 'flex', alignItems: 'center', pointerEvents: 'none', color: 'var(--text-secondary)' }}>
                <KeyRound size={18} />
              </div>
              <input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                className="focus-ring"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: '0.5rem',
              width: '100%',
              padding: '0.875rem',
              borderRadius: '0.5rem',
              backgroundColor: 'var(--primary)',
              color: 'white',
              fontWeight: 500,
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              transition: 'all 0.2s',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            {isLoading ? (
               <div style={{ 
                 height: '1.25rem', 
                 width: '1.25rem', 
                 border: '2px solid rgba(255,255,255,0.3)', 
                 borderTopColor: 'white', 
                 borderRadius: '50%',
                 animation: 'spin 1s linear infinite'
               }} />
            ) : (mode === 'login' ? "Ingresar" : "Registrarse")}
          </button>
        </form>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .focus-ring:focus {
          border-color: var(--primary) !important;
          box-shadow: 0 0 0 3px rgba(var(--primary-rgb, 59, 130, 246), 0.2) !important;
        }
      `}</style>
    </div>
  );
}
