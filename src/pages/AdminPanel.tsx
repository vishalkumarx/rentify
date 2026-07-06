import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { Ban, Search, ShieldCheck, AlertTriangle, Users as UsersIcon, CheckCircle, XCircle, Star, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase, getStorageJson, setStorageJson } from '../lib/supabase';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

export default function AdminPanel() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'verifications' | 'reports' | 'users' | 'testimonials'>('verifications');
  const [testimonials, setTestimonials] = useState<any[]>([]);
  
  // Modal State
  const [selectedImage, setSelectedImage] = useState<{ url: string, url2?: string, userId: string, status: string } | null>(null);
  
  // Rejection Modal State
  const [rejectingUserId, setRejectingUserId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Block Modal State
  const [showBlockModal, setShowBlockModal] = useState<string | null>(null);
  const [blockDuration, setBlockDuration] = useState<number | null>(null);

  useEffect(() => {
    if (!session) {
      navigate('/login');
      return;
    }

    const fetchAdminData = async () => {
      // 2. Fetch verifications from JSON
      const verificationsData = await getStorageJson('admin/verifications.json') || {};
      const parsedUsers = Object.keys(verificationsData).map(userId => {
        const v = verificationsData[userId];
        return {
          id: userId,
          email: v.email || '',
          name: 'User ' + userId.substring(0, 5),
          department: v.department || '',
          submittedAt: v.submittedAt || new Date().toISOString(),
          idImageUrl: v.collegeIdUrl, // College ID
          aadharUrl: v.aadharUrl, // Aadhar Card
          status: v.status || 'pending',
          rejectionReason: v.rejectionReason || ''
        };
      });
      setUsers(parsedUsers);

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
      
      // 4. Fetch All Users
      const { data: profileFiles } = await supabase.storage.from('item-images').list('profiles');
      if (profileFiles) {
        const blockedUsers = await getStorageJson('admin/blocked_users.json') || [];
        const loadedUsers = await Promise.all(
          profileFiles
            .filter(f => f.name.endsWith('.json'))
            .map(async f => {
              const uData = await getStorageJson(`profiles/${f.name}`);
              const userId = f.name.replace('.json', '');
              const isBlocked = blockedUsers.some((u: any) => {
                if (typeof u === 'string') return u === userId;
                if (u && u.userId === userId) {
                  if (u.suspendedUntil) return new Date().getTime() < u.suspendedUntil;
                  return true;
                }
                return false;
              });
              return { id: userId, isBlocked, ...uData };
            })
        );
        setAllUsers(loadedUsers);
      }
      
      const tData = await getStorageJson('admin/testimonials.json') || [];
      setTestimonials(tData);

      setLoading(false);
    };

    fetchAdminData();
  }, [session, navigate]);

  const handleApprove = async (userId: string) => {
    const verificationsData = await getStorageJson('admin/verifications.json') || {};
    if (verificationsData[userId]) {
      verificationsData[userId].status = 'approved';
      await setStorageJson('admin/verifications.json', verificationsData);
    }
    setUsers(users.map(u => u.id === userId ? { ...u, status: 'approved' } : u));
    if (selectedImage) setSelectedImage({ ...selectedImage, status: 'approved' });
    toast.success(`User approved successfully!`);
  };

  const confirmReject = async () => {
    if (!rejectingUserId) return;
    const verificationsData = await getStorageJson('admin/verifications.json') || {};
    if (verificationsData[rejectingUserId]) {
      verificationsData[rejectingUserId].status = 'rejected';
      verificationsData[rejectingUserId].rejectionReason = rejectionReason;
      await setStorageJson('admin/verifications.json', verificationsData);
    }
    setUsers(users.map(u => u.id === rejectingUserId ? { ...u, status: 'rejected', rejectionReason } : u));
    if (selectedImage && selectedImage.userId === rejectingUserId) {
      setSelectedImage({ ...selectedImage, status: 'rejected' });
    }
    setRejectingUserId(null);
    setRejectionReason('');
    toast.error('Verification rejected.');
  };

  const handleTerminate = async (userId: string) => {
    if (!confirm('Are you sure you want to terminate this account? This action is permanent and will block their login instantly.')) return;
    const blocked = await getStorageJson('admin/blocked_users.json') || [];
    if (!blocked.includes(userId)) {
      await setStorageJson('admin/blocked_users.json', [...blocked, userId]);
    }
    setAllUsers(allUsers.map(u => u.id === userId ? { ...u, isBlocked: true } : u));
    toast.error(`Account ${userId} has been terminated.`);
  };

  const submitBlock = async () => {
    if (!showBlockModal) return;
    
    let blocked = await getStorageJson('admin/blocked_users.json') || [];
    blocked = blocked.filter((u: any) => typeof u === 'string' ? u !== showBlockModal : u.userId !== showBlockModal);
    
    const suspendedUntil = blockDuration ? new Date().getTime() + blockDuration * 60 * 60 * 1000 : null;
    blocked.push({ userId: showBlockModal, suspendedUntil });
    
    await setStorageJson('admin/blocked_users.json', blocked);
    setAllUsers(allUsers.map(u => u.id === showBlockModal ? { ...u, isBlocked: true } : u));
    
    toast.error(blockDuration ? `Account suspended for ${blockDuration} hours.` : `Account permanently blocked.`);
    setShowBlockModal(null);
    setBlockDuration(null);
  };

  const handleToggleBlock = async (userId: string, currentlyBlocked: boolean) => {
    if (!currentlyBlocked) {
      setShowBlockModal(userId);
    } else {
      if (!confirm(`Are you sure you want to unblock this account?`)) return;
      let blocked = await getStorageJson('admin/blocked_users.json') || [];
      blocked = blocked.filter((u: any) => typeof u === 'string' ? u !== userId : u.userId !== userId);
      await setStorageJson('admin/blocked_users.json', blocked);
      toast.success(`Account unblocked.`);
      setAllUsers(allUsers.map(u => u.id === userId ? { ...u, isBlocked: false } : u));
    }
  };

  const handleUpdateTestimonial = async (id: string, status: 'approved' | 'rejected') => {
    const updated = testimonials.map(t => t.id === id ? { ...t, status } : t);
    setTestimonials(updated);
    await setStorageJson('admin/testimonials.json', updated);
    toast.success(`Testimonial ${status}!`);
  };

  const handleDeleteTestimonial = async (id: string) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return;
    const updated = testimonials.filter(t => t.id !== id);
    setTestimonials(updated);
    await setStorageJson('admin/testimonials.json', updated);
    toast.success('Testimonial deleted.');
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
            <button 
              onClick={() => setActiveTab('users')}
              style={{ padding: '16px', borderRadius: '16px', border: 'none', background: activeTab === 'users' ? 'var(--text-main)' : 'transparent', color: activeTab === 'users' ? 'var(--surface)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 600, fontSize: '16px', cursor: 'pointer', textAlign: 'left' }}
            >
              <UsersIcon size={20} /> Users ({allUsers.length})
            </button>
            <button 
              onClick={() => setActiveTab('testimonials')}
              style={{ padding: '16px', borderRadius: '16px', border: 'none', background: activeTab === 'testimonials' ? 'var(--text-main)' : 'transparent', color: activeTab === 'testimonials' ? 'var(--surface)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 600, fontSize: '16px', cursor: 'pointer', textAlign: 'left' }}
            >
              <MessageSquare size={20} /> Testimonials ({testimonials.filter(t => t.status === 'pending').length})
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
                        
                        {/* ID Images (Click to Expand) */}
                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                          <div 
                            onClick={() => setSelectedImage({ url: user.idImageUrl, url2: user.aadharUrl, userId: user.id, status: user.status })}
                            style={{ width: '120px', height: '100px', borderRadius: '12px', overflow: 'hidden', background: '#000', border: '1px solid var(--surface-border)', cursor: 'zoom-in', position: 'relative' }}
                          >
                            <img src={user.idImageUrl} alt="College ID" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: user.status === 'approved' ? 0.6 : 1 }} />
                            <div style={{ position: 'absolute', bottom: '4px', left: '4px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>College ID</div>
                          </div>
                          
                          {user.aadharUrl && (
                            <div 
                              onClick={() => setSelectedImage({ url: user.aadharUrl, url2: user.idImageUrl, userId: user.id, status: user.status })}
                              style={{ width: '120px', height: '100px', borderRadius: '12px', overflow: 'hidden', background: '#000', border: '1px solid var(--surface-border)', cursor: 'zoom-in', position: 'relative' }}
                            >
                              <img src={user.aadharUrl} alt="Aadhar Card" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: user.status === 'approved' ? 0.6 : 1 }} />
                              <div style={{ position: 'absolute', bottom: '4px', left: '4px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>Aadhar</div>
                            </div>
                          )}
                        </div>

                        {/* User Details */}
                        <div style={{ flex: 1, minWidth: '250px' }}>
                          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700 }}>{user.name}</h3>
                          <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: 'var(--text-muted)' }}><strong>User ID:</strong> {user.id}</p>
                          {user.email && <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: 'var(--text-muted)' }}><strong>Email:</strong> {user.email}</p>}
                          {user.department && <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: 'var(--text-muted)' }}><strong>Department:</strong> {user.department}</p>}
                          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}><strong>Uploaded:</strong> {new Date(user.submittedAt).toLocaleString()}</p>
                        </div>
                        
                        {/* Action Buttons (Desktop Inline) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '160px' }}>
                           {user.status === 'approved' ? (
                             <button onClick={() => setRejectingUserId(user.id)} style={{ padding: '12px', background: 'var(--surface-border)', color: 'var(--text-main)', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }}>
                               Revoke Approval
                             </button>
                           ) : user.status === 'rejected' ? (
                             <button onClick={() => handleApprove(user.id)} style={{ padding: '12px', background: '#1877F2', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                               <CheckCircle size={16} /> Re-Approve
                             </button>
                           ) : (
                             <>
                              <button onClick={() => handleApprove(user.id)} style={{ padding: '12px', background: '#1877F2', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                <CheckCircle size={16} /> Approve
                              </button>
                              <button onClick={() => setRejectingUserId(user.id)} style={{ padding: '12px', background: 'var(--surface-border)', color: 'var(--danger)', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }}>
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

            {activeTab === 'users' && (
              <div>
                <h2 style={{ fontSize: '20px', margin: '0 0 20px 0', fontWeight: 700 }}>User Management</h2>
                <div style={{ display: 'grid', gap: '16px' }}>
                  {allUsers.filter(u => u.id.toLowerCase().includes(search.toLowerCase()) || (u.name && u.name.toLowerCase().includes(search.toLowerCase()))).map(user => (
                    <div key={user.id} className="glass-panel" style={{ padding: '20px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                      <div style={{ width: '60px', height: '60px', borderRadius: '30px', overflow: 'hidden', background: 'var(--surface-border)', flexShrink: 0 }}>
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 700, color: 'var(--text-muted)' }}>
                            {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                          </div>
                        )}
                      </div>
                      
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {user.name || 'Unknown User'}
                          {user.isBlocked && <span style={{ padding: '2px 8px', borderRadius: '12px', background: 'var(--danger)', color: 'white', fontSize: '10px', textTransform: 'uppercase' }}>Blocked</span>}
                        </h3>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>ID: {user.id}</p>
                      </div>

                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button 
                          onClick={() => navigate(`/user/${user.id}`)}
                          style={{ padding: '12px 20px', background: 'var(--surface-border)', color: 'var(--text-main)', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          View Profile
                        </button>
                        <button 
                          onClick={() => handleToggleBlock(user.id, user.isBlocked)}
                          style={{ padding: '12px 20px', background: user.isBlocked ? 'var(--surface-border)' : 'var(--danger)', color: user.isBlocked ? 'var(--text-main)' : 'white', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                          <Ban size={16} /> {user.isBlocked ? 'Unblock' : 'Block'}
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {allUsers.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '64px 20px', background: 'var(--surface)', borderRadius: '24px', border: '1px solid var(--surface-border)' }}>
                      <p style={{ color: 'var(--text-muted)', margin: 0 }}>No users found.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'testimonials' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '20px', margin: 0, fontWeight: 700 }}>Testimonials Moderation</h2>
                </div>
                {testimonials.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--surface)', borderRadius: '24px' }}>
                    No testimonials submitted yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {testimonials.map(t => (
                      <div key={t.id} className="glass-panel" style={{ padding: '24px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: t.status === 'pending' ? '4px solid var(--warning)' : t.status === 'approved' ? '4px solid var(--success)' : '4px solid var(--danger)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>{t.name}</h3>
                              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t.department}, {t.year}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                              {Array.from({ length: 5 }).map((_, idx) => (
                                <Star key={idx} size={16} fill={idx < t.rating ? "var(--warning)" : "transparent"} color={idx < t.rating ? "var(--warning)" : "var(--surface-border)"} />
                              ))}
                            </div>
                            <p style={{ margin: 0, fontSize: '15px', color: 'var(--text-main)', fontStyle: 'italic', lineHeight: 1.5 }}>
                              "{t.review}"
                            </p>
                          </div>
                          <span style={{ padding: '6px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', background: t.status === 'pending' ? 'rgba(245,158,11,0.1)' : t.status === 'approved' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: t.status === 'pending' ? 'var(--warning)' : t.status === 'approved' ? 'var(--success)' : 'var(--danger)' }}>
                            {t.status}
                          </span>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                          {t.status === 'pending' && (
                            <>
                              <button onClick={() => handleUpdateTestimonial(t.id, 'approved')} style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--success)', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Approve</button>
                              <button onClick={() => handleUpdateTestimonial(t.id, 'rejected')} style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--danger)', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Reject</button>
                            </>
                          )}
                          {t.status === 'approved' && (
                            <button onClick={() => handleUpdateTestimonial(t.id, 'rejected')} style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--surface-border)', color: 'var(--text-main)', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Revoke Approval</button>
                          )}
                          <button onClick={() => handleDeleteTestimonial(t.id)} style={{ padding: '8px 16px', borderRadius: '8px', background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)', fontWeight: 600, cursor: 'pointer', marginLeft: 'auto' }}>Delete</button>
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
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '40px', padding: '20px', overflowX: 'auto', overflowY: 'hidden' }}>
            <div style={{ height: '100%', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ color: 'white', marginBottom: '8px', fontWeight: 600 }}>College ID</span>
              <div style={{ flex: 1, overflow: 'hidden', background: '#000', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TransformWrapper initialScale={1} minScale={0.5} maxScale={4} centerOnInit>
                  <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }} contentStyle={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={selectedImage.url} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} alt="College ID" />
                  </TransformComponent>
                </TransformWrapper>
              </div>
            </div>
            {selectedImage.url2 && (
              <div style={{ height: '100%', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ color: 'white', marginBottom: '8px', fontWeight: 600 }}>Aadhar Card</span>
                <div style={{ flex: 1, overflow: 'hidden', background: '#000', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TransformWrapper initialScale={1} minScale={0.5} maxScale={4} centerOnInit>
                    <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }} contentStyle={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={selectedImage.url2} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} alt="Aadhar Card" />
                    </TransformComponent>
                  </TransformWrapper>
                </div>
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div style={{ padding: '24px', background: '#111', display: 'flex', justifyContent: 'center', gap: '16px' }}>
            {selectedImage.status === 'approved' ? (
              <button 
                onClick={() => { setRejectingUserId(selectedImage.userId); setSelectedImage(null); }}
                style={{ padding: '16px 32px', background: '#333', color: 'white', border: 'none', borderRadius: '16px', fontSize: '16px', fontWeight: 700, cursor: 'pointer' }}
              >
                Revoke Approval
              </button>
            ) : selectedImage.status === 'rejected' ? (
              <button 
                onClick={() => { handleApprove(selectedImage.userId); setSelectedImage(null); }}
                style={{ padding: '16px 32px', background: '#1877F2', color: 'white', border: 'none', borderRadius: '16px', fontSize: '16px', fontWeight: 700, cursor: 'pointer' }}
              >
                Re-Approve
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
                  onClick={() => { setRejectingUserId(selectedImage.userId); setSelectedImage(null); }}
                  style={{ padding: '16px 32px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '16px', fontSize: '16px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Reject Verification
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingUserId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '24px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Reject Verification</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '15px' }}>
              Please provide a reason for rejecting this ID verification. This will be shown to the user.
            </p>
            
            <textarea
              placeholder="e.g. Aadhar card is too blurry, please upload a clearer picture."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              style={{ width: '100%', minHeight: '100px', padding: '16px', borderRadius: '12px', border: '1px solid var(--surface-border)', background: 'var(--surface)', color: 'var(--text-main)', resize: 'vertical', outline: 'none', fontFamily: 'inherit' }}
            />
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button 
                onClick={() => { setRejectingUserId(null); setRejectionReason(''); }} 
                style={{ flex: 1, padding: '14px', borderRadius: '16px', border: 'none', background: 'var(--surface-border)', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmReject} 
                disabled={!rejectionReason.trim()}
                style={{ flex: 1, padding: '14px', borderRadius: '16px', border: 'none', background: 'var(--danger)', color: 'white', fontWeight: 600, cursor: 'pointer', opacity: rejectionReason.trim() ? 1 : 0.5 }}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block User Modal */}
      {showBlockModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="glass-panel animate-slide-in" style={{ width: '100%', maxWidth: '400px', padding: '24px', borderRadius: '24px', position: 'relative', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)' }}>
              <Ban size={24} /> Block User
            </h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>Select the duration of the suspension. The user will be unable to log in during this time.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Permanent Block', value: null },
                { label: 'Suspend for 24 Hours', value: 24 },
                { label: 'Suspend for 36 Hours', value: 36 },
                { label: 'Suspend for 7 Days', value: 168 }
              ].map(option => (
                <button
                  key={option.label}
                  onClick={() => setBlockDuration(option.value)}
                  style={{
                    padding: '16px', borderRadius: '12px', border: blockDuration === option.value ? '2px solid var(--danger)' : '1px solid var(--surface-border)',
                    background: blockDuration === option.value ? 'rgba(239, 68, 68, 0.1)' : 'var(--surface)',
                    color: 'var(--text-main)', fontWeight: 600, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}
                >
                  {option.label}
                  {blockDuration === option.value && <CheckCircle size={18} color="var(--danger)" />}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <button onClick={() => { setShowBlockModal(null); setBlockDuration(null); }} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: 'var(--surface-border)', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={submitBlock} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: 'var(--danger)', color: 'white', fontWeight: 600, cursor: 'pointer' }}>Confirm Block</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
