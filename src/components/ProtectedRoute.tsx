import { useAuth } from '../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

interface Props { children: React.ReactNode }

export default function ProtectedRoute({ children }: Props) {
    // 100% Public Access - No more auth checks
    return <>{children}</>;
}
