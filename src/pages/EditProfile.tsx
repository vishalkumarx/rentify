import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, User, BookOpen, Save, AlignLeft } from 'lucide-react';
import { DEPARTMENTS } from '../lib/constants';
import toast from 'react-hot-toast';
import { getStorageJson, setStorageJson } from '../lib/supabase';

export default function EditProfile() {
  const navigate = useNavigate();
  const { profile, updateProfile, session } = useAuth();
  
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setDepartment(profile.department || '');
      setBio(profile.bio || '');
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    
    setSaving(true);
    try {
      await updateProfile({
        name,
        department,
        bio
      });
      
      // Update department in already posted needs and items
      if (session?.user?.id) {
        const userId = session.user.id;
        
        // Update Needs
        const requests = await getStorageJson('feed/requests.json') || [];
        let requestsChanged = false;
        const updatedRequests = requests.map((req: any) => {
          if (req.userId === userId) {
            requestsChanged = true;
            return { ...req, department };
          }
          return req;
        });
        if (requestsChanged) await setStorageJson('feed/requests.json', updatedRequests);

        // Update Items
        const items = await getStorageJson('feed/items.json') || [];
        let itemsChanged = false;
        const updatedItems = items.map((item: any) => {
          if (item.userId === userId) {
            itemsChanged = true;
            return { ...item, department };
          }
          return item;
        });
        if (itemsChanged) await setStorageJson('feed/items.json', updatedItems);
      }

      toast.success('Profile updated successfully!');
      navigate('/profile');
    } catch (error) {
      toast.error('Failed to update profile');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const avatarUrl = profile?.avatar_url || session?.user?.user_metadata?.avatar_url || session?.user?.user_metadata?.picture;

  return (
    <div className="animate-slide-in" style={{ paddingBottom: '100px', position: 'relative', background: 'var(--bg)', minHeight: '100vh' }}>
      <header style={{ height: '60px', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--surface-border)', background: 'var(--surface)', flexShrink: 0, position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate(-1)} style={{ width: '40px', height: '40px', padding: 0, borderRadius: '20px', background: 'var(--surface)', border: '1px solid var(--surface-border)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
            <ChevronLeft size={20} />
          </button>
          <h1 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Edit Profile</h1>
        </div>
      </header>

      <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--primary)' }} />
          ) : (
            <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid var(--primary)' }}>
              <User size={48} />
            </div>
          )}
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Profile picture syncs with Google</span>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={16} color="var(--primary)" /> Full Name
              </label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
                style={{ padding: '16px', borderRadius: '16px', border: '1px solid var(--surface-border)', background: 'var(--bg)', color: 'var(--text-main)', fontSize: '16px', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={16} color="var(--primary)" /> Department
              </label>
              <select 
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                style={{ padding: '16px', borderRadius: '16px', border: '1px solid var(--surface-border)', background: 'var(--bg)', color: department ? 'var(--text-main)' : 'var(--text-muted)', fontSize: '16px', outline: 'none', WebkitAppearance: 'none' }}
              >
                <option value="" disabled>Select your department</option>
                {DEPARTMENTS.map(dep => (
                  <option key={dep} value={dep} style={{ color: '#000' }}>
                    {dep}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlignLeft size={16} color="var(--primary)" /> Bio (Optional)
              </label>
              <textarea 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell others a bit about yourself..."
                rows={3}
                style={{ padding: '16px', borderRadius: '16px', border: '1px solid var(--surface-border)', background: 'var(--bg)', color: 'var(--text-main)', fontSize: '16px', outline: 'none', resize: 'vertical' }}
              />
            </div>

          </div>

          <button 
            type="submit" 
            disabled={saving}
            className="glow"
            style={{ padding: '18px', borderRadius: '20px', background: 'var(--primary)', color: '#000', border: 'none', fontWeight: 800, fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
          >
            <Save size={20} />
            {saving ? 'Saving Changes...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
