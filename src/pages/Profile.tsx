import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase, getStorageJson, setStorageJson } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Settings, LogOut, Heart, CreditCard, ChevronRight,Star, BadgeCheck, ShieldCheck, Upload, X, AlertCircle, Package, Edit2, Trash2, MoreVertical, MapPin, IndianRupee, Calendar, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useFeed } from '../context/FeedContext';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState('My Listings');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [openNeedMenuId, setOpenNeedMenuId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ message: string, onConfirm: () => void } | null>(null);
  const navigate = useNavigate();
  const { items, deletePost } = useFeed();
  const favouriteItems = items.filter(item => item.liked);
  const myItems = items.filter(item => item.userId === session?.user?.id);

  const tabs = ['My Listings', 'Favourites', 'My Needs'];



  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuId(null);
      setOpenNeedMenuId(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    setShowLogoutConfirm(false);
    supabase.auth.signOut();
  };

  const [profile, setProfile] = useState<any>(null);
  const [myRequests, setMyRequests] = useState<any[]>([]);

  const deleteMyRequest = (id: string) => {
    setConfirmDialog({
      message: 'Are you sure you want to delete this need?',
      onConfirm: async () => {
        const currentRequests = await getStorageJson('feed/item_requests.json') || [];
        const updated = currentRequests.filter((r: any) => r.id !== id);
        await setStorageJson('feed/item_requests.json', updated);
        setMyRequests(myRequests.filter((r: any) => r.id !== id));
        toast.success('Need deleted successfully');
      }
    });
  };
  
  useEffect(() => {
    if (session?.user?.id) {
      getStorageJson(`profiles/${session.user.id}.json`).then(data => {
        if (data) setProfile(data);
      });
      fetchVerificationStatus();
      fetchMyRequests();
    }
  }, [session?.user?.id]);

  const fetchMyRequests = async () => {
    if (!session?.user?.id) return;
    const data = await getStorageJson('feed/item_requests.json') || [];
    const userReqs = data.filter((req: any) => req.userId === session.user.id);
    setMyRequests(userReqs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  const [verificationInfo, setVerificationInfo] = useState<any>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [collegeIdFile, setCollegeIdFile] = useState<File | null>(null);
  const [aadharFile, setAadharFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchVerificationStatus = async () => {
    if (!session?.user?.id) return;
    const data = await getStorageJson('admin/verifications.json');
    if (data && data[session.user.id]) {
      setVerificationInfo(data[session.user.id]);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collegeIdFile || !aadharFile || !session?.user?.id) return;

    setUploading(true);
    try {
      // Upload College ID
      const colExt = collegeIdFile.name.split('.').pop();
      const colPath = `verifications/${session.user.id}-college-${Date.now()}.${colExt}`;
      const { error: colErr } = await supabase.storage.from('item-images').upload(colPath, collegeIdFile);
      if (colErr) throw colErr;
      const { data: colData } = supabase.storage.from('item-images').getPublicUrl(colPath);

      // Upload Aadhar
      const aadExt = aadharFile.name.split('.').pop();
      const aadPath = `verifications/${session.user.id}-aadhar-${Date.now()}.${aadExt}`;
      const { error: aadErr } = await supabase.storage.from('item-images').upload(aadPath, aadharFile);
      if (aadErr) throw aadErr;
      const { data: aadData } = supabase.storage.from('item-images').getPublicUrl(aadPath);

      const verifications = await getStorageJson('admin/verifications.json') || {};
      const newSubmission = {
        status: 'pending',
        collegeIdUrl: colData.publicUrl,
        aadharUrl: aadData.publicUrl,
        submittedAt: new Date().toISOString(),
        email: session?.user?.email || '',
        name: profile?.name || session?.user?.user_metadata?.full_name || '',
        department: profile?.department || session?.user?.user_metadata?.department || ''
      };
      
      verifications[session.user.id] = newSubmission;
      await setStorageJson('admin/verifications.json', verifications);
      
      setVerificationInfo(newSubmission);
      setShowVerificationModal(false);
      toast.success('Verification request submitted successfully!');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to submit verification: ' + err.message);
    } finally {
      setUploading(false);
    }
  };



  return (
    <div className="profile-grid animate-slide-in" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      
      {/* Sidebar: Profile Info & Settings */}
      <div className="profile-sidebar">
        {/* Profile Header */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {(() => {
              const avatarUrl = profile?.avatar_url || session?.user?.user_metadata?.avatar_url || session?.user?.user_metadata?.picture;
              if (avatarUrl) {
                return <img src={avatarUrl} alt="Profile" style={{ width: '72px', height: '72px', borderRadius: '36px', objectFit: 'cover', flexShrink: 0 }} />;
              }
              return (
                <div style={{ width: '72px', height: '72px', borderRadius: '36px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000000', flexShrink: 0, fontSize: '32px', fontWeight: 700 }}>
                  {(profile?.name?.[0] || session?.user?.user_metadata?.full_name?.[0] || session?.user?.email?.[0] || 'U').toUpperCase()}
                </div>
              );
            })()}
            <div style={{ overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '22px', margin: '0', fontWeight: 700, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {profile?.name || session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'User'}
                </h2>
                {verificationInfo?.status === 'approved' && (
                  <BadgeCheck size={24} fill="#1877F2" color="white" />
                )}
              </div>
              <div title={profile?.department} style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>
                <Building2 size={16} color="var(--text-muted)" />
                {profile?.department || 'Department not set'}
              </div>
              <div title={session?.user?.email} style={{ marginTop: '4px', color: 'var(--text-muted)', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {session?.user?.email}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                <Star size={16} fill="var(--warning)" color="var(--warning)" />
                <span style={{ fontSize: '15px', fontWeight: 700 }}>New</span>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>(0 reviews)</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => navigate('/edit-profile')}
            style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--bg)', color: 'var(--text-main)', border: '1px solid var(--surface-border)', fontWeight: 600, fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
          >
            <Edit2 size={16} /> Edit Profile
          </button>
          
          <div style={{ width: '100%', height: '1px', background: 'var(--surface-border)', margin: '4px 0' }}></div>

          {/* Verification Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', maxWidth: '320px', margin: '0' }}>
            
            {verificationInfo?.status === 'approved' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '16px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                <ShieldCheck size={24} color="var(--success)" />
                <div>
                  <span style={{ display: 'block', fontWeight: 700, color: 'var(--success)' }}>Verified Student</span>
                  <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Your ID has been verified.</span>
                </div>
              </div>
            ) : verificationInfo?.status === 'pending' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '16px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <ShieldCheck size={24} color="var(--warning)" />
                <div>
                  <span style={{ display: 'block', fontWeight: 700, color: 'var(--warning)' }}>Verification Pending</span>
                  <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>We are reviewing your documents.</span>
                </div>
              </div>
            ) : verificationInfo?.status === 'rejected' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <AlertCircle size={24} color="var(--danger)" />
                  <div>
                    <span style={{ display: 'block', fontWeight: 700, color: 'var(--danger)' }}>Verification Declined</span>
                    <span style={{ display: 'block', fontSize: '13px', color: 'var(--danger)', marginTop: '4px', lineHeight: 1.4 }}>
                      {verificationInfo.rejectionReason || 'Please ensure your uploaded documents are clear and valid.'}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowVerificationModal(true)}
                  style={{ background: 'var(--danger)', color: 'white', border: 'none', padding: '10px', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start' }}>
                  Try Again
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowVerificationModal(true)}
                style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                  background: 'linear-gradient(135deg, #1877F2 0%, #000000 100%)', 
                  color: 'white', border: 'none', padding: '12px 16px', borderRadius: '16px', 
                  cursor: 'pointer', boxShadow: '0 8px 20px rgba(24, 119, 242, 0.25)',
                  width: '100%', marginTop: '4px'
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <BadgeCheck size={28} fill="#1877F2" color="white" />
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '0.3px' }}>Get Verified Badge</span>
                    <span style={{ fontSize: '13px', opacity: 0.8, fontWeight: 500 }}>Build trust in the community</span>
                  </div>
                </div>
                <ChevronRight size={20} opacity={0.8} />
              </button>
            )}
          </div>
        </div>

        {/* Settings Menu moved to bottom */}
      </div>

      {/* Main Content: Tabs & Listings */}
      <div className="profile-content">
        {/* Sub Tabs */}
        <div style={{ display: 'flex', background: 'var(--surface)', padding: '4px', borderRadius: '16px', border: '1px solid var(--surface-border)', marginBottom: '16px' }}>
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '10px 0',
                background: activeTab === tab ? '#FEF3C7' : 'transparent',
                color: activeTab === tab ? '#000000' : 'var(--text-muted)',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 600,
                boxShadow: activeTab === tab ? 'var(--card-shadow)' : 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Favourites' && (
          <div style={{ padding: '24px 0' }}>
            {favouriteItems.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <Heart size={48} opacity={0.5} style={{ marginBottom: '16px' }} />
                <p>You have no favourite items yet.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
                {favouriteItems.map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => navigate(`/item/${item.id}`)}
                    style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--surface-border)', overflow: 'hidden', cursor: 'pointer' }}
                  >
                    <div style={{ width: '100%', aspectRatio: '1', position: 'relative' }}>
                      <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(255,255,255,0.8)', padding: '4px', borderRadius: '50%', color: 'var(--danger)' }}>
                        <Heart size={16} fill="var(--danger)" />
                      </div>
                    </div>
                    <div style={{ padding: '12px' }}>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.title}</h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>₹{item.price}/day</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'My Listings' && (
          <div style={{ padding: '24px 0' }}>
            {myItems.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {myItems.map(item => (
                  <div key={item.id} onClick={() => navigate(`/item/${item.id}`)} className="glass-panel" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', cursor: 'pointer', borderRadius: '16px', border: '1px solid var(--surface-border)' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <img src={item.image} alt={item.title} style={{ width: '72px', height: '72px', borderRadius: '12px', objectFit: 'cover', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.title}</h3>
                        <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary)' }}>₹{item.price}<span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/day</span></span>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Posted on {new Date(item.createdAt || Date.now()).toLocaleDateString()}</div>
                      </div>
                      <div style={{ position: 'relative' }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === item.id ? null : item.id); }}
                          style={{ background: 'transparent', border: 'none', padding: '8px', cursor: 'pointer', display: 'flex', color: 'var(--text-main)' }}
                        >
                          <MoreVertical size={20} />
                        </button>
                        {openMenuId === item.id && (
                          <div style={{ position: 'absolute', top: '100%', right: '0', background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 10, minWidth: '120px', overflow: 'hidden' }}>
                            <button onClick={(e) => { e.stopPropagation(); navigate(`/edit/${item.id}`); }} style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--surface-border)', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', borderRadius: 0, fontWeight: 600 }}>
                              <Edit2 size={16} /> Edit
                            </button>
                            <button onClick={async (e) => { e.stopPropagation(); if (window.confirm('Are you sure you want to delete this listing?')) { await deletePost(item.id); } }} style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--danger)', borderRadius: 0, fontWeight: 600 }}>
                              <Trash2 size={16} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', color: 'var(--text-muted)', textAlign: 'center' }}>
                <Package size={64} opacity={0.5} style={{ marginBottom: '16px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 8px', color: 'var(--text-main)' }}>No listings yet</h3>
                <p style={{ margin: 0 }}>You haven't posted any items for rent.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'My Needs' && (
          <div style={{ padding: '24px 0', maxWidth: '800px', margin: '0 auto' }}>
            {myRequests.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <p>You haven't posted any item requests yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {myRequests.map((req: any) => (
                  <div key={req.id} className="glass-panel" style={{ background: 'var(--surface)', padding: '24px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid var(--surface-border)', position: 'relative', overflow: 'hidden', opacity: req.suspended ? 0.7 : 1 }}>
                    
                    {req.suspended && (
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(4px)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ background: 'var(--danger)', color: 'white', padding: '12px 24px', borderRadius: '24px', fontWeight: 800, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}>
                          Unavailable due to policy violations
                        </div>
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 800, lineHeight: 1.2 }}>{req.title}</h4>
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {new Date(req.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ position: 'relative', marginTop: '-4px', marginRight: '-8px' }}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setOpenNeedMenuId(openNeedMenuId === req.id ? null : req.id); }}
                            style={{ background: 'transparent', border: 'none', padding: '4px', cursor: 'pointer', color: 'var(--text-muted)' }}
                          >
                            <MoreVertical size={20} />
                          </button>
                          {openNeedMenuId === req.id && (
                            <div style={{ position: 'absolute', top: '100%', right: '0', background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 10, minWidth: '120px', overflow: 'hidden' }}>
                              <button onClick={(e) => { e.stopPropagation(); deleteMyRequest(req.id); setOpenNeedMenuId(null); }} style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--danger)', borderRadius: 0, fontWeight: 600 }}>
                                <Trash2 size={16} /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {req.imageUrl && (
                      <img src={req.imageUrl} alt={req.title} style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '16px', marginBottom: '4px', border: '1px solid var(--surface-border)' }} />
                    )}
                    <p style={{ margin: 0, fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      {req.description}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '4px' }}>
                      {req.budget && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--text-main)', background: 'var(--surface)', padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                          <IndianRupee size={14} color="var(--primary)" /> {req.budget}
                        </div>
                      )}
                      {req.location && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--text-main)', background: 'var(--surface)', padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                          <MapPin size={14} color="var(--primary)" /> {req.location}
                        </div>
                      )}
                      {req.dateRequired && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--text-main)', background: 'var(--surface)', padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                          <Calendar size={14} color="var(--primary)" /> Need by: {req.dateRequired}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings Menu */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', marginTop: '24px' }}>
          <h3 style={{ padding: '20px 20px 8px', margin: 0, fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Account Settings</h3>
          
          <button onClick={() => setShowComingSoon(true)} style={{ background: 'transparent', color: 'var(--text-main)', textAlign: 'left', padding: '16px 20px', borderRadius: 0, borderBottom: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'none', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><CreditCard size={20} color="var(--text-muted)" /> <span style={{ fontWeight: 500 }}>Payment Methods</span></div>
            <ChevronRight size={20} color="var(--text-muted)" />
          </button>
          <button onClick={() => setShowComingSoon(true)} style={{ background: 'transparent', color: 'var(--text-main)', textAlign: 'left', padding: '16px 20px', borderRadius: 0, borderBottom: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'none', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Settings size={20} color="var(--text-muted)" /> <span style={{ fontWeight: 500 }}>Preferences</span></div>
            <ChevronRight size={20} color="var(--text-muted)" />
          </button>
          <button 
            onClick={() => setShowLogoutConfirm(true)}
            style={{ background: 'transparent', color: 'var(--danger)', textAlign: 'left', padding: '16px 20px', borderRadius: 0, display: 'flex', alignItems: 'center', gap: '12px', boxShadow: 'none' }}
          >
            <LogOut size={20} />
            <span style={{ fontWeight: 500 }}>Log Out</span>
          </button>
        </div>
      </div>


      {/* Logout Confirmation */}
      {showLogoutConfirm && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '24px', borderRadius: '24px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 800 }}>Sign Out</h3>
            <p style={{ margin: '0 0 24px 0', color: 'var(--text-muted)', fontSize: '15px' }}>Are you sure you want to log out of your account?</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowLogoutConfirm(false)} style={{ flex: 1, padding: '14px', borderRadius: '16px', border: 'none', background: 'var(--surface-border)', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSignOut} style={{ flex: 1, padding: '14px', borderRadius: '16px', border: 'none', background: 'var(--danger)', color: 'white', fontWeight: 600, cursor: 'pointer' }}>Sign Out</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Verification Modal */}
      {showVerificationModal && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          
          <button 
            type="button"
            onClick={() => setShowVerificationModal(false)}
            style={{ position: 'absolute', top: '24px', right: '24px', background: 'rgba(255,255,255,0.2)', border: 'none', width: '48px', height: '48px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', zIndex: 101, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
          >
            <X size={28} />
          </button>

          <form onSubmit={handleVerificationSubmit} className="glass-panel animate-slide-in" style={{ width: '100%', maxWidth: '500px', padding: '24px', borderRadius: '24px', position: 'relative', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '22px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={24} color="var(--primary)" /> Get Verified
              </h3>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.5 }}>
                To earn your verified badge and build trust in the community, please upload clear pictures of your College ID and Aadhar Card.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 700 }}>College ID Picture</label>
              <div style={{ padding: '16px', border: '2px dashed var(--surface-border)', borderRadius: '16px', textAlign: 'center', background: 'var(--surface)', cursor: 'pointer' }}>
                <input 
                  type="file" 
                  accept="image/*" 
                  required
                  onChange={(e) => setCollegeIdFile(e.target.files?.[0] || null)}
                  style={{ display: 'none' }}
                  id="college-id-upload"
                />
                <label htmlFor="college-id-upload" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <Upload size={24} color="var(--primary)" />
                  <span style={{ fontSize: '14px', color: collegeIdFile ? 'var(--text-main)' : 'var(--text-muted)' }}>
                    {collegeIdFile ? collegeIdFile.name : 'Click to select College ID'}
                  </span>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 700 }}>Aadhar Card Picture</label>
              <div style={{ padding: '16px', border: '2px dashed var(--surface-border)', borderRadius: '16px', textAlign: 'center', background: 'var(--surface)', cursor: 'pointer' }}>
                <input 
                  type="file" 
                  accept="image/*" 
                  required
                  onChange={(e) => setAadharFile(e.target.files?.[0] || null)}
                  style={{ display: 'none' }}
                  id="aadhar-upload"
                />
                <label htmlFor="aadhar-upload" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <Upload size={24} color="var(--primary)" />
                  <span style={{ fontSize: '14px', color: aadharFile ? 'var(--text-main)' : 'var(--text-muted)' }}>
                    {aadharFile ? aadharFile.name : 'Click to select Aadhar Card'}
                  </span>
                </label>
              </div>
            </div>
            
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
              Your documents are securely encrypted and only used for identity verification by our admin team.
            </p>
            <button 
              type="submit" 
              disabled={uploading}
              style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 700, fontSize: '16px', cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.7 : 1 }}
            >
              {uploading ? 'Uploading securely...' : 'Submit Verification'}
            </button>
          </form>
        </div>,
        document.body
      )}

      {/* Custom Confirm Dialog */}
      {confirmDialog && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '24px', borderRadius: '24px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 800 }}>Confirm Action</h3>
            <p style={{ margin: '0 0 24px 0', color: 'var(--text-muted)', fontSize: '15px' }}>{confirmDialog.message}</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setConfirmDialog(null)} style={{ flex: 1, padding: '14px', borderRadius: '16px', border: 'none', background: 'var(--surface-border)', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }} style={{ flex: 1, padding: '14px', borderRadius: '16px', border: 'none', background: 'var(--danger)', color: 'white', fontWeight: 600, cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Coming Soon Dialog */}
      {showComingSoon && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setShowComingSoon(false)}>
          <div onClick={e => e.stopPropagation()} className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '360px', padding: '32px 24px', borderRadius: '32px', textAlign: 'center', background: 'var(--surface)', border: '1px solid var(--surface-border)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '32px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <span style={{ fontSize: '32px' }}>🚀</span>
            </div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '22px', fontWeight: 900 }}>Coming Soon!</h3>
            <p style={{ margin: '0 0 24px 0', color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.5 }}>We're working hard to bring you this feature in a future update. Stay tuned!</p>
            <button 
              onClick={() => setShowComingSoon(false)} 
              style={{ width: '100%', padding: '16px', borderRadius: '20px', border: 'none', background: 'var(--primary)', color: '#000', fontWeight: 800, cursor: 'pointer', fontSize: '16px' }}
            >
              Got it
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
