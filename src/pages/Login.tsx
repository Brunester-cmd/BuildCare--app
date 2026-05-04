import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, KeyRound, Mail, AlertCircle } from 'lucide-react';

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        setError('Credenciales inválidas. Por favor intenta de nuevo.');
      }
    } catch (err) {
      setError('Ocurrió un error inesperado al iniciar sesión.');
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
            Inicia sesión para continuar
          </p>
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
            ) : "Ingresar"}
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
