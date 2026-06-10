import { useState, useEffect } from 'react';
import { supabase, setStorageJson } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function Signup() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        // If they reach this page without being logged in, redirect them to login
        navigate('/login');
      }
    });
  }, [navigate]);

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    
    setLoading(true);
    setError('');
    
    try {
      await setStorageJson(`profiles/${userId}.json`, {
        name: fullName,
        email: email,
        department: department,
        rating: 5.0,
        memberSince: new Date().getFullYear().toString(),
        verifications: ['Phone Confirmed']
      });
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    }
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
          <h1 style={{ fontSize: '32px', fontWeight: 800, margin: '0', color: 'var(--text-main)' }}>Complete Profile</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '15px' }}>Almost there! Please tell us a bit about yourself.</p>
        
        <form onSubmit={handleCompleteProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && <div style={{ color: 'var(--danger)', fontSize: '14px', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '16px' }}>{error}</div>}
          
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

          <input 
            type="email" 
            placeholder="Email Address (Optional)" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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

          <button 
            type="submit" 
            disabled={loading || !userId}
            style={{
              width: '100%',
              padding: '18px',
              borderRadius: '24px',
              border: 'none',
              background: 'var(--primary-glow)',
              color: 'var(--primary)',
              fontSize: '16px',
              fontWeight: 700,
              cursor: (loading || !userId) ? 'not-allowed' : 'pointer',
              opacity: (loading || !userId) ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '8px',
              transition: 'all 0.2s'
            }}
          >
            {loading ? 'Processing...' : 'Complete Profile'}
          </button>
        </form>
        </div>
      </div>
    </div>
  );
}
