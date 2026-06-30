import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else navigate('/');
    
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({ 
      provider: 'google',
      options: {
        redirectTo: window.location.origin + window.location.pathname,
        queryParams: {
          prompt: 'select_account'
        }
      }
    });
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div className="login-container animate-fade-in">
      {/* Top Header */}
      <div className="login-header">
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Link to="/signup" style={{ color: '#fff', fontWeight: 600, textDecoration: 'none', fontSize: '15px', background: 'rgba(0,0,0,0.5)', padding: '6px 12px', borderRadius: '12px' }}>Register</Link>
        </div>
      </div>

      {/* Bottom Form Area */}
      <div className="login-form-area">
        <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 800, margin: '0', color: '#000000' }}>Sign In</h1>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && <div style={{ color: 'var(--danger)', fontSize: '14px', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '16px' }}>{error}</div>}
          
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ 
              width: '100%', 
              padding: '16px', 
              borderRadius: '16px', 
              border: '1px solid #e5e7eb', 
              background: '#f9fafb', 
              color: '#000000', 
              fontSize: '15px', 
              outline: 'none',
              transition: 'border-color 0.2s',
              fontFamily: 'inherit'
            }}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ 
              width: '100%', 
              padding: '16px', 
              borderRadius: '16px', 
              border: '1px solid #e5e7eb', 
              background: '#f9fafb', 
              color: '#000000', 
              fontSize: '15px', 
              outline: 'none',
              transition: 'border-color 0.2s',
              fontFamily: 'inherit'
            }}
          />

          <button type="submit" disabled={loading} style={{ 
            background: 'var(--primary)', 
            color: '#000000', 
            borderRadius: '24px', 
            padding: '18px', 
            fontSize: '16px', 
            fontWeight: 700,
            marginTop: '8px',
            boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            {loading ? 'Processing...' : 'Sign In'}
            {!loading && <ArrowRight size={20} />}
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', margin: '8px 0', opacity: 0.5 }}>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
            <span style={{ padding: '0 12px', fontSize: '13px', fontWeight: 600, color: '#000000' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
          </div>
          
          <button 
            type="button" 
            className="google-auth-btn"
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '24px',
              border: '1px solid #e5e7eb',
              background: '#ffffff',
              color: '#000000',
              fontSize: '15px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.7 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            Continue with Google
          </button>
        </form>
        </div>
      </div>
    </div>
  );
}
