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
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflowY: 'auto', background: 'var(--primary)', position: 'relative' }}>
      
      {/* Top Yellow Section */}
      <div style={{ padding: 'calc(24px + env(safe-area-inset-top)) 24px 48px', display: 'flex', flexDirection: 'column', maxWidth: '480px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '32px' }}>
          <Link to="/signup" style={{ color: '#111827', fontWeight: 600, textDecoration: 'none', fontSize: '15px' }}>Register</Link>
        </div>
        
        <div style={{ marginTop: '20px' }}>
          <h1 style={{ fontSize: '42px', fontWeight: 800, margin: '0 0 12px', color: '#111827' }}>Sign In</h1>
          <p style={{ color: 'rgba(17, 24, 39, 0.85)', fontSize: '16px', lineHeight: 1.5, margin: 0, maxWidth: '280px', fontWeight: 500 }}>
            everything you need, in your vicinity.
          </p>
        </div>
      </div>

      {/* Bottom White Sheet */}
      <div style={{ 
        flexGrow: 1,
        background: 'var(--surface)', 
        borderRadius: '32px 32px 0 0', 
        padding: '32px 24px calc(48px + env(safe-area-inset-bottom))',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && <div style={{ color: 'var(--danger)', fontSize: '14px', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '16px' }}>{error}</div>}
          
          <input
            type="email"
            placeholder="Username or Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              background: 'var(--surface-border)',
              border: 'none',
              borderRadius: '24px',
              padding: '18px 24px',
              fontSize: '15px',
              fontWeight: 500,
              color: 'var(--text-main)'
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              background: 'var(--surface-border)',
              border: 'none',
              borderRadius: '24px',
              padding: '18px 24px',
              fontSize: '15px',
              fontWeight: 500,
              color: 'var(--text-main)'
            }}
          />
          
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, cursor: 'pointer' }}>Forgot Password?</span>
          </div>
          
          <button type="submit" disabled={loading} style={{ 
            background: 'var(--text-main)', 
            color: 'var(--surface)', 
            borderRadius: '24px', 
            padding: '18px', 
            fontSize: '16px', 
            fontWeight: 700,
            marginTop: '8px',
            boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
          }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
          <button onClick={handleGoogleSignIn} disabled={loading} style={{ 
            background: 'var(--surface)', 
            border: '1px solid var(--surface-border)', 
            borderRadius: '24px', 
            padding: '16px 24px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            color: 'var(--text-main)',
            fontWeight: 600,
            fontSize: '15px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="G" style={{ width: '20px', height: '20px' }} />
              Continue with Google
            </div>
            <ArrowRight size={18} color="var(--text-muted)" />
          </button>
          
          <button style={{ 
            background: 'var(--surface)', 
            border: '1px solid var(--surface-border)', 
            borderRadius: '24px', 
            padding: '16px 24px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            color: 'var(--text-main)',
            fontWeight: 600,
            fontSize: '15px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" alt="F" style={{ width: '20px', height: '20px' }} />
              Continue with Facebook
            </div>
            <ArrowRight size={18} color="var(--text-muted)" />
          </button>
        </div>

        </div>
      </div>
    </div>
  );
}
