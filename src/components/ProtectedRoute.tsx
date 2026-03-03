import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Props { children: React.ReactNode }

export default function ProtectedRoute({ children }: Props) {
    const { session, loading, profile, tenant, signOut, signIn } = useAuth();
    const [debugError, setDebugError] = useState<string | null>(null);

    useEffect(() => {
        if (!session && !loading && !debugError) {
            // Smoothly auto-login in the background
            signIn('bruno@buildcare.app', '37155261Weed!').then(res => {
                if (res?.error) {
                    setDebugError(res.error);
                }
            }).catch(err => {
                setDebugError(String(err));
            });
        }
    }, [session, loading, signIn, debugError]);

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner" />
                <p>Cargando BuildCare…</p>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="loading-screen" style={{ padding: '2rem', textAlign: 'center' }}>
                <div className="loading-spinner" style={debugError ? { display: 'none' } : {}} />
                <h2 style={{ marginTop: '1rem' }}>Sincronizando...</h2>
                <p>Ingresando al panel de control.</p>
                {debugError && (
                    <div style={{ background: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: '8px', marginTop: '1rem', maxWidth: '400px', margin: '1rem auto 0' }}>
                        Error de inicio: {debugError}
                    </div>
                )}
            </div>
        );
    }

    // Pending users see a waiting screen
    if (profile && profile.status === 'pending') {
        return (
            <div className="loading-screen">
                <div className="pending-icon">⏳</div>
                <h2>Solicitud pendiente</h2>
                <p>Tu cuenta está siendo revisada por el administrador.<br />Recibirás un email cuando sea aprobada.</p>
                <div style={{ marginTop: '2rem' }}>
                    <button className="btn btn-secondary" onClick={signOut}>Cerrar Sesión</button>
                </div>
            </div>
        );
    }

    // Suspended users
    if (profile && profile.status === 'suspended') {
        return (
            <div className="loading-screen">
                <div className="pending-icon">🚫</div>
                <h2>Cuenta suspendida</h2>
                <p>Tu cuenta ha sido desactivada. Contactá al administrador para más información.</p>
                <div style={{ marginTop: '2rem' }}>
                    <button className="btn btn-secondary" onClick={signOut}>Cerrar Sesión</button>
                </div>
            </div>
        );
    }

    // Inactive or missing tenant (for non super_admins)
    if ((!tenant || !tenant.active) && profile?.role !== 'super_admin') {
        return (
            <div className="loading-screen">
                <div className="pending-icon">🏢</div>
                <h2>Empresa inactiva o no encontrada</h2>
                <p>La empresa a la que perteneces ha sido desactivada o eliminada. Contactá al administrador para más información.</p>
                <div style={{ marginTop: '2rem' }}>
                    <button className="btn btn-secondary" onClick={signOut}>Cerrar Sesión</button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
