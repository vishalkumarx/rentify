import { useState, useEffect } from 'react';
import { ShieldCheck, XCircle, CheckCircle, Search, AlertTriangle, Ban } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase, getStorageJson, setStorageJson } from '../lib/supabase';

export default function AdminPanel() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<string[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'verifications' | 'reports'>('verifications');
  
  // Modal State
  const [selectedImage, setSelectedImage] = useState<{ url: string, userId: string, status: string } | null>(null);

  useEffect(() => {
    if (!session) {
      navigate('/login');
      return;
    }

    const fetchAdminData = async () => {
      // 1. Fetch approvals
      const apps = await getStorageJson('admin/approvals.json') || [];
      setApprovals(apps);
      
      // 2. Fetch verifications from storage bucket
      const { data: verifFiles } = await supabase.storage.from('item-images').list('verifications');
      if (verifFiles) {
        const parsedUsers = verifFiles
          .filter(f => f.name !== '.emptyFolderPlaceholder' && f.name.includes('-'))
          .map(f => {
            const userId = f.name.split('-')[0];
            const { data } = supabase.storage.from('item-images').getPublicUrl(`verifications/${f.name}`);
            return {
              id: userId,
              email: 'ID: ' + userId,
              name: 'User ' + userId.substring(0, 5),
              submittedAt: f.created_at || new Date().toISOString(),
              idImageUrl: data.publicUrl,
              status: apps.includes(userId) ? 'approved' : 'pending'
            };
          });
        // Group by user, keeping the latest upload if there are duplicates
        const uniqueUsersMap = new Map();
        for (const u of parsedUsers) {
          uniqueUsersMap.set(u.id, u);
        }
        setUsers(Array.from(uniqueUsersMap.values()));
      }

      // 3. Fetch Reports
      const { data: reportFiles } = await supabase.storage.from('item-images').list('reports');
      if (reportFiles) {
        const loadedReports = await Promise.all(
          reportFiles
            .filter(f => f.name.endsWith('.json'))
            .map(async f => {
              const rData = await getStorageJson(`reports/${f.name}`);
              return { ...rData, fileId: f.name };
            })
        );
        setReports(loadedReports.filter(Boolean));
      }
      
      setLoading(false);
    };

    fetchAdminData();
  }, [session, navigate]);

  const handleApprove = async (userId: string) => {
    if (!approvals.includes(userId)) {
      const newApps = [...approvals, userId];
      await setStorageJson('admin/approvals.json', newApps);
      setApprovals(newApps);
    }
    setUsers(users.map(u => u.id === userId ? { ...u, status: 'approved' } : u));
    if (selectedImage) setSelectedImage({ ...selectedImage, status: 'approved' });
    alert(`User approved successfully!`);
  };

  const handleReject = async (userId: string) => {
    const newApps = approvals.filter(id => id !== userId);
    await setStorageJson('admin/approvals.json', newApps);
    setApprovals(newApps);
    setUsers(users.map(u => u.id === userId ? { ...u, status: 'rejected' } : u));
    if (selectedImage) setSelectedImage({ ...selectedImage, status: 'rejected' });
    alert(approvals.includes(userId) ? 'Approval revoked.' : 'Verification rejected.');
  };

  const handleTerminate = async (userId: string) => {
    if (!confirm('Are you sure you want to terminate this account? This action is permanent and will block their login instantly.')) return;
    const blocked = await getStorageJson('admin/blocked_users.json') || [];
    if (!blocked.includes(userId)) {
      await setStorageJson('admin/blocked_users.json', [...blocked, userId]);
    }
    alert(`Account ${userId} has been terminated.`);
  };

  const filteredUsers = users.filter(u => u.id.toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Real Data...</div>;
  }

  return (
    <div style={{ height: '100vh', overflowY: 'auto' }}>
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' }} className="animate-slide-in">
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', background: 'var(--surface)', padding: '24px', borderRadius: '24px', border: '1px solid var(--surface-border)', boxShadow: 'var(--card-shadow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(24, 119, 242, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={28} color="#1877F2" />
            </div>
            <div>
              <h1 style={{ fontSize: '24px', margin: '0 0 4px 0', fontWeight: 800 }}>Admin Workspace</h1>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '15px' }}>Manage Verifications and User Reports.</p>
            </div>
          </div>
          
          <button onClick={() => navigate('/profile')} style={{ background: 'var(--surface-border)', color: 'var(--text-main)', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }}>
            Back to App
          </button>
        </div>

        {/* Layout Wrapper */}
        <div style={{ display: 'flex', gap: '32px', flexDirection: window.innerWidth < 768 ? 'column' : 'row' }}>
          
          {/* Sidebar Navigation */}
          <div style={{ width: window.innerWidth < 768 ? '100%' : '250px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button 
              onClick={() => setActiveTab('verifications')}
              style={{ padding: '16px', borderRadius: '16px', border: 'none', background: activeTab === 'verifications' ? 'var(--text-main)' : 'transparent', color: activeTab === 'verifications' ? 'var(--surface)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 600, fontSize: '16px', cursor: 'pointer', textAlign: 'left' }}
            >
              <ShieldCheck size={20} /> Verifications
            </button>
            <button 
              onClick={() => setActiveTab('reports')}
              style={{ padding: '16px', borderRadius: '16px', border: 'none', background: activeTab === 'reports' ? 'var(--text-main)' : 'transparent', color: activeTab === 'reports' ? 'var(--surface)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 600, fontSize: '16px', cursor: 'pointer', textAlign: 'left' }}
            >
              <AlertTriangle size={20} /> Reports ({reports.length})
            </button>
          </div>

          {/* Main Content Area */}
          <div style={{ flex: 1, minWidth: 0 }}>
            
            {activeTab === 'verifications' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
                  <h2 style={{ fontSize: '20px', margin: 0, fontWeight: 700 }}>ID Verifications</h2>
                  
                  <div style={{ position: 'relative', width: '300px', maxWidth: '100%' }}>
                    <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', top: '12px', left: '16px' }} />
                    <input 
                      type="text" 
                      placeholder="Search by ID..." 
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
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>There are no uploaded verifications yet.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '20px' }}>
                    {filteredUsers.map(user => (
                      <div key={user.id} className="glass-panel" style={{ padding: '20px', borderRadius: '20px', display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
                        
                        {/* ID Image (Click to Expand) */}
                        <div 
                          onClick={() => setSelectedImage({ url: user.idImageUrl, userId: user.id, status: user.status })}
                          style={{ width: '200px', height: '140px', borderRadius: '12px', overflow: 'hidden', background: '#000', flexShrink: 0, border: '1px solid var(--surface-border)', cursor: 'zoom-in', position: 'relative' }}
                        >
                          <img src={user.idImageUrl} alt="University ID" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: user.status === 'approved' ? 0.6 : 1 }} />
                          {user.status === 'approved' && (
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'var(--success)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
                              APPROVED
                            </div>
                          )}
                          {user.status === 'rejected' && (
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'var(--danger)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
                              REJECTED
                            </div>
                          )}
                        </div>

                        {/* User Details */}
                        <div style={{ flex: 1, minWidth: '250px' }}>
                          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700 }}>{user.name}</h3>
                          <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: 'var(--text-muted)' }}><strong>User ID:</strong> {user.id}</p>
                          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}><strong>Uploaded:</strong> {new Date(user.submittedAt).toLocaleString()}</p>
                        </div>
                        
                        {/* Action Buttons (Desktop Inline) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '160px' }}>
                           {user.status === 'approved' ? (
                             <button onClick={() => handleReject(user.id)} style={{ padding: '12px', background: 'var(--surface-border)', color: 'var(--text-main)', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }}>
                               Revoke Approval
                             </button>
                           ) : (
                             <>
                              <button onClick={() => handleApprove(user.id)} style={{ padding: '12px', background: '#1877F2', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                <CheckCircle size={16} /> Approve
                              </button>
                              <button onClick={() => handleReject(user.id)} style={{ padding: '12px', background: 'var(--surface-border)', color: 'var(--danger)', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }}>
                                Reject
                              </button>
                             </>
                           )}
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reports' && (
              <div>
                <h2 style={{ fontSize: '20px', margin: '0 0 20px 0', fontWeight: 700 }}>User Reports</h2>
                {reports.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '64px 20px', background: 'var(--surface)', borderRadius: '24px', border: '1px solid var(--surface-border)' }}>
                    <CheckCircle size={48} color="var(--success)" style={{ marginBottom: '16px', opacity: 0.5 }} />
                    <h3 style={{ fontSize: '18px', margin: '0 0 8px 0' }}>Clean Platform!</h3>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>No reports have been submitted yet.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '16px' }}>
                    {reports.map((report, idx) => (
                      <div key={idx} className="glass-panel" style={{ padding: '24px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', fontWeight: 700, marginBottom: '8px' }}>
                            <AlertTriangle size={18} /> {report.reason || 'Policy Violation'}
                          </div>
                          <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.5 }}>"{report.description}"</p>
                        </div>
                        <div style={{ background: 'var(--surface)', padding: '12px', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}><strong>Reported User ID:</strong> {report.reportedUserId}</p>
                          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}><strong>Reported By:</strong> {report.reporterId}</p>
                          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}><strong>Date:</strong> {new Date(report.timestamp).toLocaleString()}</p>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button 
                            onClick={() => handleTerminate(report.reportedUserId)}
                            style={{ background: 'var(--danger)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                          >
                            <Ban size={16} /> Terminate Account
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Large Image Modal */}
      {selectedImage && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', flexDirection: 'column' }}
        >
          {/* Top Bar */}
          <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ color: 'white', margin: 0, fontSize: '18px' }}>ID Verification Review</h3>
            <button onClick={() => setSelectedImage(null)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
              <XCircle size={32} />
            </button>
          </div>
          
          {/* Image */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', overflow: 'hidden' }}>
            <img src={selectedImage.url} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} alt="Large Verification" />
          </div>

          {/* Action Bar */}
          <div style={{ padding: '24px', background: '#111', display: 'flex', justifyContent: 'center', gap: '16px' }}>
            {selectedImage.status === 'approved' ? (
              <button 
                onClick={() => { handleReject(selectedImage.userId); setSelectedImage(null); }}
                style={{ padding: '16px 32px', background: '#333', color: 'white', border: 'none', borderRadius: '16px', fontSize: '16px', fontWeight: 700, cursor: 'pointer' }}
              >
                Revoke Approval
              </button>
            ) : (
              <>
                <button 
                  onClick={() => { handleApprove(selectedImage.userId); setSelectedImage(null); }}
                  style={{ padding: '16px 32px', background: '#1877F2', color: 'white', border: 'none', borderRadius: '16px', fontSize: '16px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <CheckCircle size={20} /> Approve & Verify
                </button>
                <button 
                  onClick={() => { handleReject(selectedImage.userId); setSelectedImage(null); }}
                  style={{ padding: '16px 32px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '16px', fontSize: '16px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Reject Verification
                </button>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
