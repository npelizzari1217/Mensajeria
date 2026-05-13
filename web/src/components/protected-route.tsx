import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/auth.context';

/**
 * Route guard — redirects to /login when the user is not authenticated.
 * Shows a loading indicator while session restoration is in progress.
 */
export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-screen">
        <p>Cargando...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
