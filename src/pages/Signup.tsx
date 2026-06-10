import { useState } from 'react';
import { supabase, setStorageJson } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('Computer Science');
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
    } else if (data.user) {
      await setStorageJson(`profiles/${data.user.id}.json`, {
        name: fullName || 'User ' + data.user.id.substring(0, 5),
        department: department,
        rating: 5.0,
        memberSince: new Date().getFullYear().toString(),
        verifications: ['Email Confirmed']
      });
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
        
        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
              border: '1px solid var(--surface-border)', 
              background: 'var(--surface)', 
              color: 'var(--text-main)', 
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
              border: '1px solid var(--surface-border)', 
              background: 'var(--surface)', 
              color: 'var(--text-main)', 
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
            <option value="Agriculture">Agriculture</option>
            <option value="Apparel and Textile Technology">Apparel and Textile Technology</option>
            <option value="Architecture">Architecture</option>
            <option value="Biotechnology">Biotechnology</option>
            <option value="Botanical and Environmental Sciences">Botanical and Environmental Sciences</option>
            <option value="Chemistry">Chemistry</option>
            <option value="Computational Statistics and Data Analytics">Computational Statistics and Data Analytics</option>
            <option value="Computer Engineering and Technology">Computer Engineering and Technology</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Economics">Economics</option>
            <option value="Education">Education</option>
            <option value="Electronics Technology">Electronics Technology</option>
            <option value="English">English</option>
            <option value="Food Science and Technology">Food Science and Technology</option>
            <option value="Foreign Languages">Foreign Languages</option>
            <option value="Guru Nanak Studies">Guru Nanak Studies</option>
            <option value="Hindi">Hindi</option>
            <option value="History">History</option>
            <option value="Hotel Management and Tourism">Hotel Management and Tourism</option>
            <option value="Human Genetics">Human Genetics</option>
            <option value="Laws">Laws</option>
            <option value="Library and Information Science">Library and Information Science</option>
            <option value="Mass Communication">Mass Communication</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Microbiology">Microbiology</option>
            <option value="Molecular Biology and Biochemistry">Molecular Biology and Biochemistry</option>
            <option value="MYAS GNDU Sports Sciences and Medicine">MYAS GNDU Sports Sciences and Medicine</option>
            <option value="Physical Education">Physical Education</option>
            <option value="Physics">Physics</option>
            <option value="Physiotherapy">Physiotherapy</option>
            <option value="Planning">Planning</option>
            <option value="Political Science">Political Science</option>
            <option value="Psychology">Psychology</option>
            <option value="Punjabi">Punjabi</option>
            <option value="Sanskrit, Pali and Prakrit">Sanskrit, Pali and Prakrit</option>
            <option value="School of Social Sciences">School of Social Sciences</option>
            <option value="Sociology">Sociology</option>
            <option value="Surjit Patar Centre for Ethical AI">Surjit Patar Centre for Ethical AI</option>
            <option value="University Business School">University Business School</option>
            <option value="Urdu and Persian">Urdu and Persian</option>
            <option value="Zoology">Zoology</option>
            <option value="Other">Other</option>
          </select>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              width: '100%',
              padding: '18px',
              borderRadius: '24px',
              border: 'none',
              background: 'var(--text-main)',
              color: 'var(--surface)',
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
            <div style={{ flex: 1, height: '1px', background: 'var(--surface-border)' }}></div>
            <span style={{ padding: '0 12px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--surface-border)' }}></div>
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
