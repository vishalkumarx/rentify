import { HashRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FeedProvider } from './context/FeedContext';
import { ChatProvider } from './context/ChatContext';
import MobileLayout from './components/MobileLayout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Post from './pages/Post';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import Chat from './pages/Chat';
import ItemDetail from './pages/ItemDetail';

const ProtectedRoute = ({ children, message }: { children: React.ReactNode, message?: string }) => {
  const { session, loading } = useAuth();
  
  if (loading) return <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!session) {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', minHeight: '60vh', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '32px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
          <span style={{ fontSize: '32px' }}>🔒</span>
        </div>
        <h2 style={{ fontSize: '24px', marginBottom: '12px', fontWeight: 800 }}>Authentication Required</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '16px', lineHeight: 1.5 }}>
          {message || 'Please log in or create an account to access this feature.'}
        </p>
        <Link to="/login" style={{ display: 'inline-block', background: 'var(--text-main)', color: 'var(--bg)', padding: '16px 32px', borderRadius: '24px', fontSize: '16px', fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          Login / Sign Up
        </Link>
      </div>
    );
  }
  
  return <>{children}</>;
};

const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  
  if (loading) return null;
  if (session) return <Navigate to="/" replace />;
  
  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
      <Route path="/signup" element={<AuthRoute><Signup /></AuthRoute>} />
      
      {/* Mobile Layout Routes */}
      <Route element={<MobileLayout />}>
        {/* Public Feed */}
        <Route path="/" element={<Home />} />
        
        {/* Protected Navigation Tabs */}
        <Route path="/post" element={<ProtectedRoute message="Login to post a new rental listing."><Post /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute message="Login to view your messages and chat with owners."><Messages /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute message="Login to view your profile and manage your active listings."><Profile /></ProtectedRoute>} />
      </Route>
      
      {/* Full Screen Modals/Pages */}
      <Route path="/item/:id" element={<ItemDetail />} />
      <Route path="/chat/:id" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <FeedProvider>
        <ChatProvider>
          <Router>
            <AppRoutes />
          </Router>
        </ChatProvider>
      </FeedProvider>
    </AuthProvider>
  );
}
