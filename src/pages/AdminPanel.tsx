import { useState, useEffect } from 'react';
import { ShieldCheck, XCircle, CheckCircle, Search, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Mock data for the sample admin panel
const MOCK_PENDING_USERS = [
  {
    id: 'user-123',
    email: 'john.doe@university.edu',
    name: 'John Doe',
    submittedAt: '2026-06-10T10:00:00Z',
    idImageUrl: 'https://images.unsplash.com/photo-1633409361618-c73427e4e206?auto=format&fit=crop&q=80&w=400',
    status: 'pending'
  },
  {
    id: 'user-456',
    email: 'sarah.j@university.edu',
    name: 'Sarah Jenkins',
    submittedAt: '2026-06-09T15:30:00Z',
    idImageUrl: 'https://images.unsplash.com/photo-1621839673705-6617adf9e890?auto=format&fit=crop&q=80&w=400',
    status: 'pending'
  }
];

export default function AdminPanel() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState(MOCK_PENDING_USERS);
  const [search, setSearch] = useState('');

  // In a real app, you'd want to restrict this route to admins only.
  // For this sample, we just ensure they are logged in.
  useEffect(() => {
    if (!session) {
      navigate('/login');
    }
  }, [session, navigate]);

  const handleApprove = (userId: string) => {
    // In a real app, you would call a Supabase Edge Function here 
    // to update the user's auth metadata: { is_verified: true, verification_pending: false }
    setUsers(users.filter(u => u.id !== userId));
    alert(`User ${userId} has been approved and verified!`);
  };

  const handleReject = (userId: string) => {
    // In a real app, you would delete their uploaded ID and reset verification_pending to false
    setUsers(users.filter(u => u.id !== userId));
    alert(`User ${userId} verification rejected.`);
  };

  const filteredUsers = users.filter(u => u.email.toLowerCase().includes(search.toLowerCase()) || u.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' }} className="animate-slide-in">
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', background: 'var(--surface)', padding: '24px', borderRadius: '24px', border: '1px solid var(--surface-border)', boxShadow: 'var(--card-shadow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(24, 119, 242, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={28} color="#1877F2" />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', margin: '0 0 4px 0', fontWeight: 800 }}>Admin Panel</h1>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '15px' }}>Verify University IDs and manage platform trust.</p>
          </div>
        </div>
        
        <button onClick={() => navigate('/profile')} style={{ background: 'var(--surface-border)', color: 'var(--text-main)', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }}>
          Back to App
        </button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', margin: 0, fontWeight: 700 }}>Pending Verifications ({users.length})</h2>
          
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', top: '12px', left: '16px' }} />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '10px 16px 10px 44px', borderRadius: '12px', border: '1px solid var(--surface-border)', background: 'var(--surface)', outline: 'none' }}
            />
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 20px', background: 'var(--surface)', borderRadius: '24px', border: '1px solid var(--surface-border)' }}>
            <ShieldCheck size={48} color="var(--success)" style={{ marginBottom: '16px', opacity: 0.5 }} />
            <h3 style={{ fontSize: '18px', margin: '0 0 8px 0' }}>All Caught Up!</h3>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>There are no pending verification requests.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {filteredUsers.map(user => (
              <div key={user.id} className="glass-panel" style={{ padding: '20px', borderRadius: '20px', display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                
                {/* ID Image */}
                <div style={{ width: '300px', height: '200px', borderRadius: '12px', overflow: 'hidden', background: '#000', flexShrink: 0, border: '1px solid var(--surface-border)' }}>
                  <img src={user.idImageUrl} alt="University ID" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>

                {/* User Details & Actions */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '24px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', fontWeight: 700, fontSize: '18px' }}>
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 700 }}>{user.name}</h3>
                      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <UserIcon size={14} /> {user.email}
                      </p>
                    </div>
                  </div>

                  <div style={{ background: 'var(--surface)', padding: '12px', borderRadius: '12px', border: '1px solid var(--surface-border)', marginBottom: 'auto' }}>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                      <strong>User ID:</strong> {user.id}
                    </p>
                    <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                      <strong>Submitted:</strong> {new Date(user.submittedAt).toLocaleString()}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <button 
                      onClick={() => handleApprove(user.id)}
                      style={{ flex: 1, background: '#1877F2', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
                    >
                      <CheckCircle size={18} />
                      Approve & Verify
                    </button>
                    <button 
                      onClick={() => handleReject(user.id)}
                      style={{ flex: 1, background: 'var(--surface-border)', color: 'var(--danger)', border: 'none', padding: '14px', borderRadius: '12px', fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
                    >
                      <XCircle size={18} />
                      Reject ID
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
