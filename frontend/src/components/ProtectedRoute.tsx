import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSubscription?: 'freemium' | 'basic' | 'premium';
}

const ProtectedRoute = ({ children, requireSubscription }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Check subscription level if required
  if (requireSubscription && user) {
    const subscriptionLevels = ['freemium', 'basic', 'premium'];
    const requiredLevel = subscriptionLevels.indexOf(requireSubscription);
    const userLevel = subscriptionLevels.indexOf(user.subscription_type);

    if (userLevel < requiredLevel) {
      return <Navigate to="/subscription" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;

