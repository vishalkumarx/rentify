import { useState } from 'react';
import { supabase, setStorageJson } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function Signup() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Ensure phone starts with +
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
    
    const { error } = await supabase.auth.signInWithOtp({ phone: formattedPhone });
    if (error) {
      setError(error.message);
    } else {
      setOtpSent(true);
    }
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
    } else if (data.session || data.user) {
      if (data.user) {
        await setStorageJson(`profiles/${data.user.id}.json`, {
          name: fullName || 'User ' + data.user.id.substring(0, 5),
          department: department,
          rating: 5.0,
          memberSince: new Date().getFullYear().toString(),
          verifications: ['Phone Confirmed']
        });
      }
      navigate('/');
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
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '32px' }}>
          <Link to="/login" style={{ color: '#111827', fontWeight: 600, textDecoration: 'none', fontSize: '15px' }}>Sign In</Link>
        </div>
        
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
          <h1 style={{ fontSize: '32px', fontWeight: 800, margin: '0', color: 'var(--text-main)' }}>Register</h1>
        
        <form onSubmit={otpSent ? handleVerifyOtp : handleSendCode} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && <div style={{ color: 'var(--danger)', fontSize: '14px', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '16px' }}>{error}</div>}
          
          {!otpSent ? (
            <>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                background: 'var(--surface)', 
                border: '1px solid var(--surface-border)', 
                borderRadius: '16px',
                padding: '0 16px',
                transition: 'border-color 0.2s',
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
                    padding: '16px 0', 
                    background: 'transparent', 
                    color: 'var(--text-main)', 
                    fontSize: '15px', 
                    outline: 'none',
                    border: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
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
                  border: '1px solid var(--surface-border)', 
                  background: 'var(--surface)', 
                  color: 'var(--text-main)', 
                  fontSize: '15px', 
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  fontFamily: 'inherit'
                }}
              />
              <select 
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '16px', 
                  borderRadius: '16px', 
                  border: '1px solid var(--surface-border)', 
                  background: 'var(--surface)', 
                  color: 'var(--text-main)', 
                  fontSize: '15px', 
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  fontFamily: 'inherit',
                  appearance: 'none'
                }}
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Engineering">Engineering</option>
                <option value="Business">Business</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Biology">Biology</option>
                <option value="Economics">Economics</option>
                <option value="Psychology">Psychology</option>
                <option value="English & Literature">English & Literature</option>
                <option value="History">History</option>
                <option value="Political Science">Political Science</option>
                <option value="Philosophy">Philosophy</option>
                <option value="Sociology">Sociology</option>
                <option value="Medicine">Medicine</option>
                <option value="Law">Law</option>
                <option value="Architecture">Architecture</option>
                <option value="Design">Design</option>
                <option value="Education">Education</option>
                <option value="Arts">Arts</option>
                <option value="Other Sciences">Other Sciences</option>
                <option value="Other">Other</option>
              </select>
            </>
          ) : (
            <input
              type="text"
              placeholder="6-digit Code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              maxLength={6}
              style={{ 
                width: '100%', 
                padding: '16px', 
                borderRadius: '16px', 
                border: '1px solid var(--surface-border)', 
                background: 'var(--surface)', 
                color: 'var(--text-main)', 
                fontSize: '15px', 
                outline: 'none',
                transition: 'border-color 0.2s',
                fontFamily: 'inherit',
                letterSpacing: '4px',
                textAlign: 'center'
              }}
            />
          )}

          <button 
            type="submit" 
            disabled={loading}
            style={{
              width: '100%',
              padding: '18px',
              borderRadius: '24px',
              border: 'none',
              background: 'var(--primary-glow)',
              color: 'var(--primary)',
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
            {loading ? 'Processing...' : (otpSent ? 'Verify & Create Account' : 'Send SMS Code')}
            {!loading && <ArrowRight size={20} />}
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', margin: '8px 0', opacity: 0.5 }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--surface-border)' }}></div>
            <span style={{ padding: '0 12px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--surface-border)' }}></div>
          </div>
          
          <button 
            type="button" 
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '24px',
              border: '1px solid var(--surface-border)',
              background: 'var(--surface)',
              color: 'var(--text-main)',
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
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" style={{ width: '20px', height: '20px' }} />
            Continue with Google
          </button>
        </form>
        </div>
      </div>
    </div>
  );
}
