import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { Ban, Search, ShieldCheck, AlertTriangle, Users as UsersIcon, CheckCircle, XCircle, Star, MessageSquare, Megaphone } from 'lucide-react';
import { LoadingDialog } from '../components/LoadingDialog';
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
  const [activeTab, setActiveTab] = useState<'verifications' | 'reports' | 'users' | 'testimonials' | 'needs' | 'settings' | 'promos'>('verifications');
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [needs, setNeeds] = useState<any[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState<any>({ showMonsoonBanner: true, showPromoCarousel: true });
  
  // Needs Filters
  const [needsFilterName, setNeedsFilterName] = useState('');
  const [needsFilterEmail, setNeedsFilterEmail] = useState('');
  const [needsFilterDate, setNeedsFilterDate] = useState('');
  const [needsFilterDept, setNeedsFilterDept] = useState('');
  
  // Modal State
  const [selectedImage, setSelectedImage] = useState<{ url: string, url2?: string, userId: string, status: string } | null>(null);
  
  // Rejection Modal State
  const [rejectingUserId, setRejectingUserId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{ message: string, onConfirm: () => void } | null>(null);

  // Block Modal State
  const [showBlockModal, setShowBlockModal] = useState<string | null>(null);
  const [blockDuration, setBlockDuration] = useState<number | null>(null);

  useEffect(() => {
    if (!session) {
      navigate('/login');
      return;
    }

    const fetchAdminData = async () => {
      // 1. Fetch Site Settings
      const settings = await getStorageJson('admin/site_settings.json') || { showMonsoonBanner: true, showPromoCarousel: true };
      setSiteSettings(settings);

      // 2. Fetch verifications from JSON
      const verificationsData = await getStorageJson('admin/verifications.json') || {};
      const parsedUsers = await Promise.all(Object.keys(verificationsData).map(async userId => {
        const v = verificationsData[userId];
        let profileName = '';
        let profileDept = '';
        try {
          const profile = await getStorageJson(`profiles/${userId}.json`);
          if (profile) {
            profileName = profile.name;
            profileDept = profile.department;
          }
        } catch (e) {}
        
        return {
          id: userId,
          email: v.email || '',
          name: v.name || profileName || 'User ' + userId.substring(0, 5),
          department: v.department || profileDept || '',
          submittedAt: v.submittedAt || new Date().toISOString(),
          idImageUrl: v.collegeIdUrl, // College ID
          aadharUrl: v.aadharUrl, // Aadhar Card
          status: v.status || 'pending',
          rejectionReason: v.rejectionReason || ''
        };
      }));
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

      const nData = await getStorageJson('feed/item_requests.json') || [];
      setNeeds(nData.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

      const pData = await getStorageJson('admin/promos.json');
      if (pData) {
        setPromos(pData);
      } else {
        const defaultPromos = [
          { id: '1', title: "Campus Commute", subtitle: "Rent e-scooters from ₹50/day", badge: "Mobility", url: "https://images.unsplash.com/photo-1778735790178-f2d243a914d9?crop=entropy&cs=srgb&fm=jpg&q=85&w=800", isVisible: true, position: 'top', link: '/category/Mobility' },
          { id: '2', title: "Zone out. Study in.", subtitle: "Premium noise-cancelling gear", badge: "Electronics", url: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?crop=entropy&cs=srgb&fm=jpg&q=85&w=800", isVisible: true, position: 'top', link: '/category/Electronics' },
          { id: '3', title: "Finals Week Deals", subtitle: "Up to 40% off study essentials", badge: "Hot", url: "https://images.unsplash.com/photo-1620287920810-3f5b9746380c?crop=entropy&cs=srgb&fm=jpg&q=85&w=800", isVisible: true, position: 'top', link: '/category/Books%20and%20Stationary' },
          { id: '4', title: "Weekend Trip?", subtitle: "Tents & outdoor gear for rent", badge: "Sports", url: "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?crop=entropy&cs=srgb&fm=jpg&q=85&w=800", isVisible: true, position: 'top', link: '/category/Sports%20and%20Fitness' },
        ];
        setPromos(defaultPromos);
        await setStorageJson('admin/promos.json', defaultPromos);
      }

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

  const handleTerminate = (userId: string) => {
    setConfirmDialog({
      message: 'Are you sure you want to terminate this account? This action is permanent and will block their login instantly.',
      onConfirm: async () => {
        const blocked = await getStorageJson('admin/blocked_users.json') || [];
        if (!blocked.includes(userId)) {
          await setStorageJson('admin/blocked_users.json', [...blocked, userId]);
        }
        setAllUsers(allUsers.map(u => u.id === userId ? { ...u, isBlocked: true } : u));
        toast.error(`Account ${userId} has been terminated.`);
      }
    });
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

  const handleToggleBlock = (userId: string, currentlyBlocked: boolean) => {
    if (!currentlyBlocked) {
      setShowBlockModal(userId);
    } else {
      setConfirmDialog({
        message: 'Are you sure you want to unblock this account?',
        onConfirm: async () => {
          let blocked = await getStorageJson('admin/blocked_users.json') || [];
          blocked = blocked.filter((u: any) => typeof u === 'string' ? u !== userId : u.userId !== userId);
          await setStorageJson('admin/blocked_users.json', blocked);
          toast.success(`Account unblocked.`);
          setAllUsers(allUsers.map(u => u.id === userId ? { ...u, isBlocked: false } : u));
        }
      });
    }
  };

  const handleUpdateTestimonial = async (id: string, status: 'approved' | 'rejected') => {
    const updated = testimonials.map(t => t.id === id ? { ...t, status } : t);
    setTestimonials(updated);
    await setStorageJson('admin/testimonials.json', updated);
    toast.success(`Testimonial ${status}!`);
  };

  const handleDeleteTestimonial = (id: string) => {
    setConfirmDialog({
      message: 'Are you sure you want to delete this testimonial?',
      onConfirm: async () => {
        const updated = testimonials.filter(t => t.id !== id);
        setTestimonials(updated);
        await setStorageJson('admin/testimonials.json', updated);
        toast.success('Testimonial deleted.');
      }
    });
  };

  const handleToggleNeedSuspend = async (id: string, currentlySuspended: boolean) => {
    const updated = needs.map(n => n.id === id ? { ...n, suspended: !currentlySuspended } : n);
    setNeeds(updated);
    await setStorageJson('feed/item_requests.json', updated);
    toast.success(currentlySuspended ? 'Need unsuspended.' : 'Need suspended due to policy violations.');
  };

  const handleDeleteNeed = (id: string) => {
    setConfirmDialog({
      message: 'Are you sure you want to permanently delete this need? This action cannot be undone.',
      onConfirm: async () => {
        const updated = needs.filter(n => n.id !== id);
        setNeeds(updated);
        await setStorageJson('feed/item_requests.json', updated);
        toast.success('Need deleted successfully.');
      }
    });
  };


  const filteredUsers = users.filter(u => u.id.toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return <LoadingDialog message="Loading Admin Panel..." />;
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
              onClick={() => setActiveTab('needs')}
              style={{ padding: '16px', borderRadius: '16px', border: 'none', background: activeTab === 'needs' ? 'var(--text-main)' : 'transparent', color: activeTab === 'needs' ? 'var(--surface)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 600, fontSize: '16px', cursor: 'pointer', textAlign: 'left' }}
            >
              <MessageSquare size={20} /> Needs ({needs.length})
            </button>
            <button 
              onClick={() => setActiveTab('testimonials')}
              style={{ padding: '16px', borderRadius: '16px', border: 'none', background: activeTab === 'testimonials' ? 'var(--text-main)' : 'transparent', color: activeTab === 'testimonials' ? 'var(--surface)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 600, fontSize: '16px', cursor: 'pointer', textAlign: 'left' }}
            >
              <Star size={20} /> Testimonials ({testimonials.filter(t => t.status === 'pending').length})
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              style={{ padding: '16px', borderRadius: '16px', border: 'none', background: activeTab === 'settings' ? 'var(--text-main)' : 'transparent', color: activeTab === 'settings' ? 'var(--surface)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 600, fontSize: '16px', cursor: 'pointer', textAlign: 'left' }}
            >
              <Megaphone size={20} /> Site Settings
            </button>
            <button 
              onClick={() => setActiveTab('promos')}
              style={{ padding: '16px', borderRadius: '16px', border: 'none', background: activeTab === 'promos' ? 'var(--text-main)' : 'transparent', color: activeTab === 'promos' ? 'var(--surface)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 600, fontSize: '16px', cursor: 'pointer', textAlign: 'left' }}
            >
              <Megaphone size={20} /> Promo Carousels
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

            {activeTab === 'needs' && (
              <div>
                <h2 style={{ fontSize: '20px', margin: '0 0 20px 0', fontWeight: 700 }}>Community Needs Moderation</h2>
                
                {/* Filters */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                  <input type="text" placeholder="Filter by Name..." value={needsFilterName} onChange={e => setNeedsFilterName(e.target.value)} style={{ padding: '12px', borderRadius: '12px', border: '1px solid var(--surface-border)', background: 'var(--surface)', color: 'var(--text-main)', fontSize: '14px', outline: 'none' }} />
                  <input type="text" placeholder="Filter by Email..." value={needsFilterEmail} onChange={e => setNeedsFilterEmail(e.target.value)} style={{ padding: '12px', borderRadius: '12px', border: '1px solid var(--surface-border)', background: 'var(--surface)', color: 'var(--text-main)', fontSize: '14px', outline: 'none' }} />
                  <input type="text" placeholder="Filter by Department..." value={needsFilterDept} onChange={e => setNeedsFilterDept(e.target.value)} style={{ padding: '12px', borderRadius: '12px', border: '1px solid var(--surface-border)', background: 'var(--surface)', color: 'var(--text-main)', fontSize: '14px', outline: 'none' }} />
                  <input type="date" value={needsFilterDate} onChange={e => setNeedsFilterDate(e.target.value)} style={{ padding: '12px', borderRadius: '12px', border: '1px solid var(--surface-border)', background: 'var(--surface)', color: 'var(--text-main)', fontSize: '14px', outline: 'none' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(() => {
                    const filteredNeeds = needs.filter((need: any) => {
                      const user = allUsers.find(u => u.id === need.userId);
                      const userEmail = user?.email || '';
                      const matchName = need.name?.toLowerCase().includes(needsFilterName.toLowerCase());
                      const matchEmail = userEmail.toLowerCase().includes(needsFilterEmail.toLowerCase());
                      const matchDept = need.department?.toLowerCase().includes(needsFilterDept.toLowerCase());
                      const matchDate = needsFilterDate ? need.createdAt?.startsWith(needsFilterDate) : true;
                      return matchName && matchEmail && matchDept && matchDate;
                    });

                    if (filteredNeeds.length === 0) {
                      return (
                        <div style={{ textAlign: 'center', padding: '64px 20px', background: 'var(--surface)', borderRadius: '24px', border: '1px solid var(--surface-border)' }}>
                          <p style={{ color: 'var(--text-muted)', margin: 0 }}>No community needs found matching your filters.</p>
                        </div>
                      );
                    }

                    return filteredNeeds.map((need: any) => {
                      const user = allUsers.find(u => u.id === need.userId);
                      return (
                      <div key={need.id} className="glass-panel" style={{ padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: need.suspended ? '4px solid var(--danger)' : '4px solid transparent' }}>
                        {need.imageUrl ? (
                          <img src={need.imageUrl} alt={need.title} style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--surface-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--text-muted)' }}>
                            <Megaphone size={20} />
                          </div>
                        )}
                        
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{need.title}</h3>
                            {need.suspended && (
                              <span style={{ padding: '2px 8px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '8px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', flexShrink: 0 }}>Suspended</span>
                            )}
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 600 }}>{need.name}</span>
                            <span>•</span>
                            <span>{user?.email || 'No email'}</span>
                            <span>•</span>
                            <span>{need.department}</span>
                            <span>•</span>
                            <span>{new Date(need.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={() => handleToggleNeedSuspend(need.id, need.suspended)}
                            style={{ padding: '8px 12px', background: need.suspended ? 'var(--surface-border)' : 'var(--danger)', color: need.suspended ? 'var(--text-main)' : 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                          >
                            <Ban size={14} /> <span className="desktop-only">{need.suspended ? 'Unsuspend' : 'Suspend'}</span>
                          </button>
                          <button 
                            onClick={() => handleDeleteNeed(need.id)}
                            style={{ padding: '8px 12px', background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      )
                    })
                  })()}
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
                          {t.status !== 'pending' && (
                            <>
                              {t.status === 'approved' && (
                                <button onClick={() => handleUpdateTestimonial(t.id, 'rejected')} style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--surface-border)', color: 'var(--text-main)', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Revoke Approval</button>
                              )}
                              <button onClick={() => handleDeleteTestimonial(t.id)} style={{ padding: '8px 16px', borderRadius: '8px', background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)', fontWeight: 600, cursor: 'pointer', marginLeft: 'auto' }}>Delete</button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div>
                <h2 style={{ fontSize: '20px', margin: '0 0 20px 0', fontWeight: 700 }}>Site Settings</h2>
                
                <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: '24px', border: '1px solid var(--surface-border)', boxShadow: 'var(--card-shadow)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700 }}>Monsoon Banner</h3>
                      <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>Toggle the visibility of the Monsoon Essentials banner on the homepage.</p>
                    </div>
                    <button 
                      onClick={async () => {
                        const newSettings = { ...siteSettings, showMonsoonBanner: !siteSettings.showMonsoonBanner };
                        setSiteSettings(newSettings);
                        await setStorageJson('admin/site_settings.json', newSettings);
                        toast.success('Site settings updated');
                      }}
                      style={{ 
                        padding: '8px 16px', 
                        borderRadius: '10px', 
                        border: 'none', 
                        background: siteSettings?.showMonsoonBanner ? 'var(--success)' : 'var(--surface-border)', 
                        color: siteSettings?.showMonsoonBanner ? '#fff' : 'var(--text-main)', 
                        fontWeight: 700,
                        fontSize: '14px', 
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap',
                        width: 'fit-content'
                      }}
                    >
                      {siteSettings?.showMonsoonBanner ? 'Visible' : 'Hidden'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--surface-border)' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700 }}>Promo Carousel</h3>
                      <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>Toggle the visibility of the four promo banners below the Monsoon banner.</p>
                    </div>
                    <button 
                      onClick={async () => {
                        const newSettings = { ...siteSettings, showPromoCarousel: siteSettings.showPromoCarousel === false ? true : false };
                        setSiteSettings(newSettings);
                        await setStorageJson('admin/site_settings.json', newSettings);
                        toast.success('Site settings updated');
                      }}
                      style={{ 
                        padding: '8px 16px', 
                        borderRadius: '10px', 
                        border: 'none', 
                        background: siteSettings?.showPromoCarousel !== false ? 'var(--success)' : 'var(--surface-border)', 
                        color: siteSettings?.showPromoCarousel !== false ? '#fff' : 'var(--text-main)', 
                        fontWeight: 700,
                        fontSize: '14px', 
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap',
                        width: 'fit-content'
                      }}
                    >
                      {siteSettings?.showPromoCarousel !== false ? 'Visible' : 'Hidden'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'promos' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '20px', margin: 0, fontWeight: 700 }}>Promo Carousels</h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {promos.map((promo, idx) => (
                    <div key={promo.id} style={{ background: 'var(--surface)', padding: '16px', borderRadius: '16px', border: '1px solid var(--surface-border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 800, background: 'var(--surface-border)', padding: '4px 8px', borderRadius: '4px', color: 'var(--text-main)', alignSelf: 'flex-start' }}>
                          {promo.position === 'top' ? 'Top Carousel' : `Inline (After ${promo.inlineIndex} items)`}
                        </span>
                        <button
                          onClick={async () => {
                            const updated = [...promos];
                            updated[idx].isVisible = !updated[idx].isVisible;
                            setPromos(updated);
                            await setStorageJson('admin/promos.json', updated);
                            toast.success(`Promo ${updated[idx].isVisible ? 'enabled' : 'disabled'}`);
                          }}
                          style={{
                            width: '100%',
                            padding: '8px',
                            borderRadius: '6px',
                            border: 'none',
                            background: promo.isVisible ? 'var(--success)' : 'var(--danger)',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          {promo.isVisible ? 'Visible' : 'Hidden'}
                        </button>
                      </div>
                      
                      <div style={{ position: 'relative', height: '120px', borderRadius: '8px', overflow: 'hidden' }}>
                        <img src={promo.url} alt={promo.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }} />
                        <div style={{ position: 'absolute', bottom: '8px', left: '8px', color: '#fff' }}>
                          <div style={{ fontSize: '10px', background: 'var(--primary)', color: '#000', padding: '2px 6px', borderRadius: '10px', display: 'inline-block', marginBottom: '4px', fontWeight: 800 }}>{promo.badge}</div>
                          <div style={{ fontWeight: 800, fontSize: '14px' }}>{promo.title}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <input
                          type="text"
                          value={promo.title}
                          onChange={(e) => {
                            const updated = [...promos];
                            updated[idx].title = e.target.value;
                            setPromos(updated);
                          }}
                          onBlur={() => setStorageJson('admin/promos.json', promos)}
                          placeholder="Title"
                          style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--surface-border)', background: 'var(--bg-color)', color: 'var(--text-main)' }}
                        />
                        <input
                          type="text"
                          value={promo.link}
                          onChange={(e) => {
                            const updated = [...promos];
                            updated[idx].link = e.target.value;
                            setPromos(updated);
                          }}
                          onBlur={() => setStorageJson('admin/promos.json', promos)}
                          placeholder="Link URL (e.g. /category/Electronics)"
                          style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--surface-border)', background: 'var(--bg-color)', color: 'var(--text-main)' }}
                        />
                        <input
                          type="text"
                          value={promo.itemIds?.join(', ') || ''}
                          onChange={(e) => {
                            const updated = [...promos];
                            updated[idx].itemIds = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                            setPromos(updated);
                          }}
                          onBlur={() => setStorageJson('admin/promos.json', promos)}
                          placeholder="Specific Item IDs (comma separated)"
                          style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--surface-border)', background: 'var(--bg-color)', color: 'var(--text-main)' }}
                        />
                        {promo.position === 'inline' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Show after item #</span>
                            <input
                              type="number"
                              value={promo.inlineIndex}
                              onChange={(e) => {
                                const updated = [...promos];
                                updated[idx].inlineIndex = parseInt(e.target.value) || 0;
                                setPromos(updated);
                              }}
                              onBlur={() => setStorageJson('admin/promos.json', promos)}
                              style={{ padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--surface-border)', background: 'var(--bg-color)', color: 'var(--text-main)', width: '60px' }}
                            />
                            <button
                              onClick={async () => {
                                const updated = promos.filter(p => p.id !== promo.id);
                                setPromos(updated);
                                await setStorageJson('admin/promos.json', updated);
                                toast.success('Promo deleted');
                              }}
                              style={{ marginLeft: 'auto', background: 'var(--danger)', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const toastId = toast.loading('Uploading image...');
                            try {
                              const ext = file.name.split('.').pop();
                              const fileName = `promo-${Date.now()}.${ext}`;
                              const filePath = `promos/${fileName}`;
                              const { error: uploadError } = await supabase.storage.from('item-images').upload(filePath, file);
                              if (uploadError) throw uploadError;
                              const { data: { publicUrl } } = supabase.storage.from('item-images').getPublicUrl(filePath);
                              const updated = [...promos];
                              updated[idx].url = publicUrl;
                              setPromos(updated);
                              await setStorageJson('admin/promos.json', updated);
                              toast.success('Image uploaded', { id: toastId });
                            } catch (err) {
                              toast.error('Upload failed', { id: toastId });
                            }
                          }}
                          style={{ padding: '8px', borderRadius: '8px', border: '1px dashed var(--surface-border)', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '12px', marginTop: '8px' }}
                        />
                      </div>
                    </div>
                  ))}
                  
                  {/* Add Promo Button at Bottom */}
                  <div style={{ background: 'var(--surface)', padding: '16px', borderRadius: '16px', border: '2px dashed var(--surface-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
                    <button 
                      onClick={() => {
                        const newPromo = {
                          id: Date.now().toString(),
                          title: 'New Promo',
                          subtitle: 'Promo Subtitle',
                          badge: 'NEW',
                          url: 'https://images.unsplash.com/photo-1555529771-835f59bfc50c?crop=entropy&cs=srgb&fm=jpg&q=85&w=800',
                          link: '/category/All',
                          isVisible: true,
                          position: 'inline',
                          inlineIndex: 6,
                          itemIds: []
                        };
                        const updated = [...promos, newPromo];
                        setPromos(updated);
                        setStorageJson('admin/promos.json', updated);
                        toast.success('Added new inline promo!');
                      }}
                      style={{ background: 'var(--primary)', color: '#000', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', fontSize: '16px' }}
                    >
                      + Add Inline Promo
                    </button>
                  </div>
                </div>
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

      {confirmDialog && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '24px', borderRadius: '24px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 800 }}>Confirm Action</h3>
            <p style={{ margin: '0 0 24px 0', color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.5 }}>{confirmDialog.message}</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setConfirmDialog(null)} style={{ flex: 1, padding: '14px', borderRadius: '16px', border: 'none', background: 'var(--surface-border)', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }} style={{ flex: 1, padding: '14px', borderRadius: '16px', border: 'none', background: 'var(--danger)', color: 'white', fontWeight: 600, cursor: 'pointer' }}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
