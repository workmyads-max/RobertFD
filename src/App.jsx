import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { CustomAuthProvider, useCustomAuth } from '@/lib/CustomAuthContext';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Checkout from './pages/Checkout';
import ChallengeSelect from './pages/ChallengeSelect';
import Register from './pages/Register';
import LoginPage from './components/auth/LoginPage';
// Add page imports here

const LoginRoute = () => {
  const { user, login } = useCustomAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return <LoginPage onLoginSuccess={login} />;
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useCustomAuth();
  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
      <Route path="/challenges" element={<ChallengeSelect />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <CustomAuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AppRoutes />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </CustomAuthProvider>
  );
}

export default App;