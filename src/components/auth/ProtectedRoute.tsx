import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles?: string[];
  children?: React.ReactNode; // Support wrapping if needed, but Outlet is preferred
}

export const ProtectedRoute = ({ allowedRoles, children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  // 1. Wait for Supabase to confirm session
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // 2. No User -> Redirect to Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Role Check (Optional)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // 4. Render Content
  return children ? <>{children}</> : <Outlet />;
};