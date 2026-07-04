import { useState, useEffect } from 'react';
import { supabase, getStorageJson, setStorageJson } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Settings, LogOut, Heart, CreditCard, ChevronRight,Star, BadgeCheck, ShieldCheck, Upload, X, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Profile() {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState('Saved');

  const tabs = ['Saved', 'Reviews'];



  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleSignOut = () => {
    setShowLogoutConfirm(false);
    supabase.auth.signOut();
  };

  const [profile, setProfile] = useState<any>(null);
  
  useEffect(() => {
    if (session?.user?.id) {
      getStorageJson(`profiles/${session.user.id}.json`).then(data => {
        if (data) setProfile(data);
      });
      fetchVerificationStatus();
    }
  }, [session?.user?.id]);

  const [verificationInfo, setVerificationInfo] = useState<any>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
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
        submittedAt: new Date().toISOString()
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
              <div title={session?.user?.email} style={{ marginTop: '4px', color: 'var(--text-muted)', fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {session?.user?.email}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                <Star size={16} fill="var(--warning)" color="var(--warning)" />
                <span style={{ fontSize: '15px', fontWeight: 700 }}>New</span>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>(0 reviews)</span>
              </div>
            </div>
          </div>
          
          <div style={{ width: '100%', height: '1px', background: 'var(--surface-border)', margin: '4px 0' }}></div>

          {/* Verification Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Trust & Verification</h3>
            
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
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--primary)', color: 'white', border: 'none', padding: '14px', borderRadius: '16px', fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--primary-glow)' }}>
                <ShieldCheck size={20} />
                Get Verified Badge
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
                background: activeTab === tab ? 'var(--text-main)' : 'transparent',
                color: activeTab === tab ? 'var(--surface)' : 'var(--text-muted)',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 600,
                boxShadow: activeTab === tab ? 'var(--card-shadow)' : 'none'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Saved' && (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Heart size={48} opacity={0.5} style={{ marginBottom: '16px' }} />
            <p>You have no saved items yet.</p>
          </div>
        )}
        
        {activeTab === 'Reviews' && (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Star size={48} opacity={0.5} style={{ marginBottom: '16px' }} />
            <p>No reviews yet.</p>
          </div>
        )}

        {/* Settings Menu */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', marginTop: '24px' }}>
          <h3 style={{ padding: '20px 20px 8px', margin: 0, fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Account Settings</h3>
          
          <button style={{ background: 'transparent', color: 'var(--text-main)', textAlign: 'left', padding: '16px 20px', borderRadius: 0, borderBottom: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><CreditCard size={20} color="var(--text-muted)" /> <span style={{ fontWeight: 500 }}>Payment Methods</span></div>
            <ChevronRight size={20} color="var(--text-muted)" />
          </button>
          <button style={{ background: 'transparent', color: 'var(--text-main)', textAlign: 'left', padding: '16px 20px', borderRadius: 0, borderBottom: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'none' }}>
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
      {showLogoutConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '24px', borderRadius: '24px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 800 }}>Sign Out</h3>
            <p style={{ margin: '0 0 24px 0', color: 'var(--text-muted)', fontSize: '15px' }}>Are you sure you want to log out of your account?</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowLogoutConfirm(false)} style={{ flex: 1, padding: '14px', borderRadius: '16px', border: 'none', background: 'var(--surface-border)', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSignOut} style={{ flex: 1, padding: '14px', borderRadius: '16px', border: 'none', background: 'var(--danger)', color: 'white', fontWeight: 600, cursor: 'pointer' }}>Sign Out</button>
            </div>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {showVerificationModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <form onSubmit={handleVerificationSubmit} className="glass-panel animate-slide-in" style={{ width: '100%', maxWidth: '500px', padding: '24px', borderRadius: '24px', position: 'relative', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <button 
              type="button"
              onClick={() => setShowVerificationModal(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'var(--surface-border)', border: 'none', width: '32px', height: '32px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>

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
        </div>
      )}

    </div>
  );
}
