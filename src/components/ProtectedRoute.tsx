import { useAuth } from '../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

interface Props { children: React.ReactNode }

export default function ProtectedRoute({ children }: Props) {
    const { session, loading, profile } = useAuth();
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
            </div>
        );
    }

    return <>{children}</>;
}
