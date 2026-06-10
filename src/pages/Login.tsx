import { useState } from 'react';
import { supabase, getStorageJson } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
    const { error } = await supabase.auth.signInWithOtp({ phone: formattedPhone });
    if (error) setError(error.message);
    else setOtpSent(true);
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
    const { data, error } = await supabase.auth.verifyOtp({ phone: formattedPhone, token: otp, type: 'sms' });
    if (error) {
      setError(error.message);
    } else {
      if (data.user) {
        const profile = await getStorageJson(`profiles/${data.user.id}.json`);
        if (profile) {
          navigate('/');
        } else {
          navigate('/signup');
        }
      } else {
        navigate('/');
      }
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({ 
      provider: 'google',
      options: {
        redirectTo: window.location.origin + window.location.pathname
      }
    });
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflowY: 'auto', background: 'var(--primary)', position: 'relative' }}>
      
      {/* Top Yellow Section */}
      <div style={{ padding: 'calc(24px + env(safe-area-inset-top)) 24px 48px', display: 'flex', flexDirection: 'column', maxWidth: '480px', margin: '0 auto', width: '100%' }}>
        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <div style={{ fontFamily: 'Holiday, sans-serif', fontSize: '72px', color: '#111827', marginBottom: '16px', lineHeight: 0.9 }}>vicinity</div>
          <p style={{ color: 'rgba(17, 24, 39, 0.85)', fontSize: '16px', lineHeight: 1.5, margin: 0, maxWidth: '280px', fontWeight: 500 }}>
            everything you need,<br />in your vicinity.
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
          <h1 style={{ fontSize: '32px', fontWeight: 800, margin: '0', color: 'var(--text-main)' }}>Sign In</h1>
        
        <form onSubmit={otpSent ? handleVerifyOtp : handleSendCode} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && <div style={{ color: 'var(--danger)', fontSize: '14px', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '16px' }}>{error}</div>}
          
          {!otpSent ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              background: 'var(--surface-border)', 
              borderRadius: '24px',
              padding: '0 24px',
            }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '15px', fontWeight: 600, marginRight: '8px' }}>+91</span>
              <input
                type="tel"
                placeholder="Phone Number (e.g. 9876543210)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  padding: '18px 0',
                  fontSize: '15px',
                  fontWeight: 500,
                  color: 'var(--text-main)',
                  outline: 'none',
                  width: '100%'
                }}
              />
            </div>
          ) : (
            <input
              type="text"
              placeholder="6-digit Code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              maxLength={6}
              style={{
                background: 'var(--surface-border)',
                border: 'none',
                borderRadius: '24px',
                padding: '18px 24px',
                fontSize: '15px',
                fontWeight: 500,
                color: 'var(--text-main)',
                letterSpacing: '4px',
                textAlign: 'center',
                outline: 'none'
              }}
            />
          )}
          
          <button type="submit" disabled={loading} style={{ 
            background: 'var(--text-main)', 
            color: 'var(--surface)', 
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
            {loading ? 'Processing...' : (otpSent ? 'Verify & Sign In' : 'Get Code')}
            {!loading && <ArrowRight size={20} />}
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
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="G" style={{ width: '20px', height: '20px' }} />
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
