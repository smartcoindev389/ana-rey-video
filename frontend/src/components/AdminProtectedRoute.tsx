import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  console.log('AdminProtectedRoute - user:', user, 'isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  if (!user?.is_admin) {
    console.log('User is not admin, user:', user);
    return <Navigate to="/admin" replace />;
  }

  console.log('Admin access granted, rendering children');
  return <>{children}</>;
};

export default AdminProtectedRoute;
