import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import '@/pages/auth/AuthPage.css';

export function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="auth-loading">Loading&hellip;</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
