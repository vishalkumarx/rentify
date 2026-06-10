import { useState } from 'react';
import { useFeed } from '../context/FeedContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Settings, LogOut, Package, Heart, CreditCard, ChevronRight, ShieldCheck, CheckCircle2, Star, BadgeCheck, Upload, Clock } from 'lucide-react';

export default function Profile() {
  const { items, toggleBookingStatus, deletePost } = useFeed();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Listings');

  const tabs = ['Listings', 'Saved', 'Reviews'];

  // Filter items owned by the current user
  const myItems = items.filter(item => item.userId === session?.user?.id);

  const handleSignOut = () => {
    supabase.auth.signOut();
  };

  const isVerified = session?.user?.user_metadata?.is_verified;
  const isVerificationPending = session?.user?.user_metadata?.verification_pending;

  const handleIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session?.user?.id) return;
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}-${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('item-images')
        .upload(`verifications/${fileName}`, file);
        
      if (uploadError) throw uploadError;
      
      // Update user metadata to mark as pending
      const { error: updateError } = await supabase.auth.updateUser({
        data: { verification_pending: true }
      });
      
      if (updateError) throw updateError;
      
      alert('ID uploaded successfully! It is now pending admin review.');
    } catch (err: any) {
      console.error(err);
      alert('Failed to upload ID: ' + err.message);
    }
  };

  return (
    <div className="profile-grid animate-slide-in" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      
      {/* Sidebar: Profile Info & Settings */}
      <div className="profile-sidebar">
        {/* Profile Header */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '36px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000000', flexShrink: 0, fontSize: '32px', fontWeight: 700 }}>
              {session?.user?.email?.[0].toUpperCase() || 'U'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '22px', margin: '0', fontWeight: 700, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {session?.user?.email?.split('@')[0] || 'User'}
                </h2>
                {isVerified ? (
                  <BadgeCheck size={24} fill="#1877F2" color="white" />
                ) : (
                  <ShieldCheck size={20} color="var(--success)" />
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <Star size={16} fill="var(--warning)" color="var(--warning)" />
                <span style={{ fontSize: '15px', fontWeight: 700 }}>New</span>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>(0 reviews)</span>
              </div>
            </div>
          </div>
          
          <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h4 style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Verifications</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', fontSize: '14px', fontWeight: 500 }}>
              <CheckCircle2 size={16} /> Email Registered
            </div>

            {!isVerified && !isVerificationPending && (
              <div style={{ marginTop: '4px', padding: '12px', background: 'rgba(24, 119, 242, 0.05)', borderRadius: '12px', border: '1px dashed rgba(24, 119, 242, 0.3)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-main)', lineHeight: 1.4 }}>
                  <strong>Upload University ID</strong> to get the verified badge on your profile.
                </p>
                <label style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#1877F2', color: 'white', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, width: 'max-content' }}>
                  <Upload size={14} />
                  Upload ID
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleIdUpload} />
                </label>
              </div>
            )}

            {!isVerified && isVerificationPending && (
              <div style={{ marginTop: '4px', padding: '10px 12px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} color="#F59E0B" />
                <span style={{ fontSize: '13px', color: '#F59E0B', fontWeight: 600 }}>ID Verification Pending</span>
              </div>
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

        {/* Tab Content Mock */}
        {activeTab === 'Listings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', padding: '12px 0', color: 'var(--text-muted)' }}>
            {myItems.length > 0 ? (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '16px', color: 'var(--text-main)' }}>Your Active Listings ({myItems.length})</h3>
                {myItems.map(item => (
                  <div key={item.id} onClick={() => navigate(`/item/${item.id}`)} className="glass-panel" style={{ padding: '12px', display: 'flex', gap: '16px', cursor: 'pointer' }}>
                    <img src={item.image} alt={item.title} style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
                      <h4 style={{ margin: '0 0 4px', fontSize: '15px', color: 'var(--text-main)' }}>{item.title}</h4>
                      <p style={{ margin: 0, color: 'var(--text-main)', fontWeight: 600 }}>₹{item.price}/day</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookingStatus(item.id);
                        }}
                        style={{ 
                          padding: '6px 12px', 
                          borderRadius: '8px', 
                          fontSize: '12px', 
                          fontWeight: 600,
                          border: 'none',
                          background: item.status === 'booked' ? 'var(--surface-border)' : '#000000',
                          color: item.status === 'booked' ? 'var(--text-muted)' : '#ffffff',
                          cursor: 'pointer'
                        }}
                      >
                        {item.status === 'booked' ? 'Mark Available' : 'Mark Booked'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/edit/${item.id}`);
                        }}
                        style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, border: '1px solid var(--surface-border)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (window.confirm('Are you sure you want to delete this listing?')) {
                            await deletePost(item.id);
                          }
                        }}
                        style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, border: 'none', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <Package size={48} opacity={0.5} />
                <p style={{ margin: 0 }}>You don't have any listings yet.</p>
              </>
            )}
          </div>
        )}

        {/* Settings Menu */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', marginTop: '24px' }}>
          <h3 style={{ padding: '20px 20px 8px', margin: 0, fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Account Settings</h3>
          
          <button style={{ background: 'transparent', color: 'var(--text-main)', textAlign: 'left', padding: '16px 20px', borderRadius: 0, borderBottom: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><CreditCard size={20} color="var(--primary)" /> <span style={{ fontWeight: 500 }}>Payment Methods</span></div>
            <ChevronRight size={20} color="var(--text-muted)" />
          </button>
          <button style={{ background: 'transparent', color: 'var(--text-main)', textAlign: 'left', padding: '16px 20px', borderRadius: 0, borderBottom: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Heart size={20} color="var(--danger)" /> <span style={{ fontWeight: 500 }}>Saved Items</span></div>
            <ChevronRight size={20} color="var(--text-muted)" />
          </button>
          <button style={{ background: 'transparent', color: 'var(--text-main)', textAlign: 'left', padding: '16px 20px', borderRadius: 0, borderBottom: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Settings size={20} color="var(--text-muted)" /> <span style={{ fontWeight: 500 }}>Preferences</span></div>
            <ChevronRight size={20} color="var(--text-muted)" />
          </button>
          <button 
            onClick={handleSignOut}
            style={{ background: 'transparent', color: 'var(--danger)', textAlign: 'left', padding: '16px 20px', borderRadius: 0, display: 'flex', alignItems: 'center', gap: '12px', boxShadow: 'none' }}
          >
            <LogOut size={20} />
            <span style={{ fontWeight: 500 }}>Log Out</span>
          </button>
        </div>
      </div>

    </div>
  );
}
