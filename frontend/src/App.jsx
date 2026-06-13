import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy loaded routes
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const GroupDetails = lazy(() => import('./pages/GroupDetails'));
const ExpenseDetails = lazy(() => import('./pages/ExpenseDetails'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (garbage collection time)
    },
  },
});

// App shell skeleton fallback for chunk loading
const PageFallback = () => (
  <div className="flex min-h-screen flex-col bg-background p-8">
    <div className="mx-auto w-full max-w-5xl space-y-8 animate-pulse">
      <div className="flex justify-between items-center mb-8">
        <div className="h-10 w-1/3 bg-muted rounded-md"></div>
        <div className="h-10 w-24 bg-muted rounded-md"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-32 bg-muted/50 rounded-md"></div>
        <div className="h-32 bg-muted/50 rounded-md"></div>
        <div className="h-32 bg-muted/50 rounded-md"></div>
      </div>
      <div className="h-64 w-full bg-muted/30 rounded-md"></div>
    </div>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/groups/:groupId" 
                element={
                  <ProtectedRoute>
                    <GroupDetails />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/groups/:groupId/expenses/:expenseId" 
                element={
                  <ProtectedRoute>
                    <ExpenseDetails />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
