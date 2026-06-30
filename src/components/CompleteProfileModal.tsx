import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DEPARTMENTS } from '../lib/constants';

export default function CompleteProfileModal() {
  const { profile, updateProfile } = useAuth();
  
  // Only show if logged in and profile is loaded but missing name or department
  const needsName = profile && (!profile.name || profile.name.trim() === '');
  const needsDepartment = profile && (!profile.department || profile.department.trim() === '');
  
  const [name, setName] = useState(profile?.name || '');
  const [department, setDepartment] = useState(profile?.department || '');
  const [saving, setSaving] = useState(false);

  if (!profile || (!needsName && !needsDepartment)) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (needsName && !name.trim()) return;
    if (needsDepartment && !department) return;
    
    setSaving(true);
    await updateProfile({
      name: needsName ? name : profile.name,
      department: needsDepartment ? department : profile.department,
    });
    setSaving(false);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div className="glass-panel animate-slide-up" style={{
        width: '100%',
        maxWidth: '400px',
        padding: '32px',
        background: 'var(--surface)',
        borderRadius: '24px',
        boxShadow: 'var(--card-shadow)'
      }}>
        <h2 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: 800 }}>Complete Profile</h2>
        <p style={{ margin: '0 0 24px', color: 'var(--text-muted)', fontSize: '14px' }}>
          Please complete your profile to continue using the app.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {needsName && (
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
                Full Name
              </label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          {needsDepartment && (
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '16px',
                  border: '1px solid var(--surface-border)',
                  background: 'rgba(0, 0, 0, 0.05)',
                  color: department ? 'var(--text-main)' : 'var(--text-muted)',
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '16px',
                  outline: 'none',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                }}
              >
                <option value="" disabled>Select your department</option>
                {DEPARTMENTS.map(dep => (
                  <option key={dep} value={dep} style={{ color: '#000' }}>
                    {dep}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button 
            type="submit" 
            disabled={saving || (needsName && !name) || (needsDepartment && !department)}
            className="glow"
            style={{
              marginTop: '16px',
              opacity: saving ? 0.7 : 1,
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
