import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background p-8">
        <div className="mx-auto w-full max-w-5xl space-y-8">
          <div className="h-10 w-48 animate-pulse rounded-md bg-muted"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-32 animate-pulse rounded-xl bg-muted/50 border border-muted"></div>
            <div className="h-32 animate-pulse rounded-xl bg-muted/50 border border-muted"></div>
            <div className="h-32 animate-pulse rounded-xl bg-muted/50 border border-muted"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div className="h-[132px] animate-pulse rounded-xl bg-muted/50 border border-muted"></div>
            <div className="h-[132px] animate-pulse rounded-xl bg-muted/50 border border-muted"></div>
            <div className="h-[132px] animate-pulse rounded-xl bg-muted/50 border border-muted"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
