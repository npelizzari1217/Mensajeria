import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/auth.context';

interface ProtectedRouteProps {
  /** If provided, the user's role must be in this list to access the route. */
  requiredRoles?: string[];
}

/**
 * Route guard — redirects to /login when the user is not authenticated,
 * or to /inbox when the user's role is not in the requiredRoles list.
 * Shows a loading indicator while session restoration is in progress.
 */
export default function ProtectedRoute({ requiredRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

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

  if (requiredRoles && requiredRoles.length > 0) {
    const userRole = user?.role;
    if (!userRole || !requiredRoles.includes(userRole)) {
      return <Navigate to="/inbox" replace />;
    }
  }

  return <Outlet />;
}
