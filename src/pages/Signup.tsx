import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
    } else if (data.session) {
      navigate('/');
    } else {
      setError('Success! Please check your email to verify your account before logging in.');
      // Optional: Clear the password field so they can type it later on login
      setPassword('');
    }
    setLoading(false);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflowY: 'auto', background: 'var(--primary)', position: 'relative' }}>
      
      {/* Top Yellow Section */}
      <div style={{ padding: 'calc(24px + env(safe-area-inset-top)) 24px 48px', display: 'flex', flexDirection: 'column', maxWidth: '480px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '32px' }}>
          <Link to="/login" style={{ color: '#111827', fontWeight: 600, textDecoration: 'none', fontSize: '15px' }}>Sign In</Link>
        </div>
        
        <div style={{ marginTop: '20px' }}>
          <h1 style={{ fontSize: '42px', fontWeight: 800, margin: '0 0 12px', color: '#111827' }}>Register</h1>
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
        
        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
            placeholder="Password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
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
          
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', textAlign: 'left', cursor: 'pointer', background: 'var(--surface-border)', padding: '16px', borderRadius: '24px' }}>
            <input 
              type="checkbox" 
              required 
              style={{ width: '20px', height: '20px', flexShrink: 0, marginTop: '2px', accentColor: 'var(--primary)', cursor: 'pointer', border: 'none' }}
            />
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, fontWeight: 500 }}>
              I agree to the <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>Privacy Policy</span> and confirm I will not post objectionable content. I understand I am solely responsible for any legal action taken against me.
            </span>
          </label>
          
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
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
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
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="G" style={{ width: '20px', height: '20px' }} />
              Continue with Google
            </div>
            <ArrowRight size={18} color="var(--text-muted)" />
          </button>
        </div>

        </div>
      </div>
    </div>
  );
}
