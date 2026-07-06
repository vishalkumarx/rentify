import { useState } from 'react';
import { supabase, setStorageJson } from '../lib/supabase';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.returnTo || '/';

  const [showConsentModal, setShowConsentModal] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [pendingAction, setPendingAction] = useState<'email' | 'google' | null>(null);

  const initiateSignup = (e?: React.FormEvent, type: 'email' | 'google' = 'email') => {
    if (e) e.preventDefault();
    if (type === 'email' && (!email || !password || !fullName)) {
      setError('Please fill in all fields');
      return;
    }
    setPendingAction(type);
    setShowConsentModal(true);
  };

  const executeSignup = async () => {
    if (!agreedToTerms || !agreedToPrivacy) {
      toast.error('You must agree to all terms before continuing.');
      return;
    }
    
    setShowConsentModal(false);
    setLoading(true);
    setError('');
    
    if (pendingAction === 'email') {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: { data: { full_name: fullName } }
      });
      
      if (error) {
        setError(error.message);
      } else if (data.session) {
        if (data.user) {
          await setStorageJson(`profiles/${data.user.id}.json`, {
            name: fullName || 'User ' + data.user.id.substring(0, 5),
            memberSince: new Date().getFullYear().toString(),
            verifications: ['Email Confirmed']
          });
        }
        navigate(returnTo, { state: location.state });
      } else {
        navigate('/login', { state: location.state });
      }
    } else if (pendingAction === 'google') {
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider: 'google',
        options: {
          redirectTo: window.location.origin + window.location.pathname + (returnTo !== '/' ? `?returnTo=${encodeURIComponent(returnTo)}` : ''),
          queryParams: {
            prompt: 'select_account'
          }
        }
      });
      if (error) setError(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="login-container animate-fade-in">
      
      {/* Top Header */}
      <div className="login-header">
      </div>

      {/* Bottom Form Area */}
      <div className="login-form-area">
        <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 800, margin: '0', color: '#000000' }}>Register</h1>
        
        <form onSubmit={(e) => initiateSignup(e, 'email')} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

          <input 
            type="text" 
            placeholder="Full Name" 
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
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
          <button 
            type="submit" 
            disabled={loading}
            style={{
              width: '100%',
              padding: '18px',
              borderRadius: '24px',
              border: 'none',
              background: 'var(--primary)',
              color: '#000000',
              boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
              fontSize: '16px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '8px',
              transition: 'all 0.2s'
            }}
          >
            {loading ? 'Processing...' : 'Create Account'}
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
            onClick={() => initiateSignup(undefined, 'google')}
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
        
        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '15px', color: '#6b7280' }}>
          Already have an account? <Link to="/login" style={{ color: '#000000', fontWeight: 700, textDecoration: 'none' }}>Sign In</Link>
        </p>
        </div>
      </div>

      {/* Consent Modal */}
      {showConsentModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '24px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Terms & Conditions</h3>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>
              Before creating your account, please review and accept our policies.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={agreedToTerms} 
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  style={{ marginTop: '4px', width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                />
                <span style={{ fontSize: '14px', lineHeight: 1.5, color: 'var(--text-main)' }}>
                  I agree to the <Link to="/safety-guidelines" target="_blank" style={{ color: '#1877F2', fontWeight: 600 }}>Security Guidelines & Terms</Link> and understand that CampusRent is not responsible for any disputes, damages, or losses.
                </span>
              </label>
              
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={agreedToPrivacy} 
                  onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                  style={{ marginTop: '4px', width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                />
                <span style={{ fontSize: '14px', lineHeight: 1.5, color: 'var(--text-main)' }}>
                  I have read and agree to the <Link to="/privacy-policy" target="_blank" style={{ color: '#1877F2', fontWeight: 600 }}>Privacy Policy</Link>.
                </span>
              </label>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button 
                onClick={() => setShowConsentModal(false)}
                style={{ flex: 1, padding: '14px', borderRadius: '16px', border: '1px solid var(--surface-border)', background: 'transparent', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={executeSignup}
                disabled={!agreedToTerms || !agreedToPrivacy}
                style={{ flex: 1, padding: '14px', borderRadius: '16px', border: 'none', background: 'var(--primary)', color: '#000', fontWeight: 700, cursor: (!agreedToTerms || !agreedToPrivacy) ? 'not-allowed' : 'pointer', opacity: (!agreedToTerms || !agreedToPrivacy) ? 0.5 : 1 }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
