import * as ReactRouter from 'react-router';

import { useAuth } from '../contexts/auth-context';

const Navigate = ReactRouter.Navigate || ReactRouter.default?.Navigate;
const Outlet = ReactRouter.Outlet || ReactRouter.default?.Outlet;
export function AuthGuard({ allowedRoles, redirectTo }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  if (!isAuthenticated || !user) {
    const target = redirectTo || '/auth/internal-login';
    return <Navigate to={target} replace />;
  }
  if (!allowedRoles.includes(user.role)) {
    // Redirect to the correct portal based on role
    if (user.role === 'vendor') {
      return <Navigate to="/vendor-portal/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}
// Redirect authenticated users away from login pages
export function GuestGuard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  if (isAuthenticated && user) {
    if (user.role === 'vendor') {
      return <Navigate to="/vendor-portal/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}
