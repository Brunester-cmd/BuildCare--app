import { useAuth } from '../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

interface Props { children: React.ReactNode }

export default function ProtectedRoute({ children }: Props) {
    const { session, loading, profile, tenant, signOut } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner" />
                <p>Cargando BuildCare…</p>
            </div>
        );
    }

    if (!session) {
        return <Navigate to="/login" state={{ from: location }} replace />;
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
