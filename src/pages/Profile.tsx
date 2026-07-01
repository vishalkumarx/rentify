import { useState, useEffect } from 'react';
import { supabase, getStorageJson } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Settings, LogOut, Heart, CreditCard, ChevronRight,Star, BadgeCheck,} from 'lucide-react';

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
    }
  }, [session?.user?.id]);



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
                <BadgeCheck size={24} fill="#1877F2" color="white" />
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


      {/* Logout Confirm Modal */}
      {showLogoutConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s' }}>
          <div className="animate-slide-up" style={{ width: '100%', maxWidth: '320px', background: 'var(--surface)', borderRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px', border: '1px solid var(--surface-border)', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '24px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
              <LogOut size={24} />
            </div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>Log Out?</h3>
            <p style={{ margin: 0, fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Are you sure you want to log out of your account? You will need to sign in again to access your rentals.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', marginTop: '8px' }}>
              <button 
                onClick={handleSignOut}
                style={{ width: '100%', padding: '14px', borderRadius: '16px', background: 'var(--danger)', color: 'white', border: 'none', fontSize: '16px', fontWeight: 700, cursor: 'pointer' }}
              >
                Yes, Log Out
              </button>
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                style={{ width: '100%', padding: '14px', borderRadius: '16px', background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--surface-border)', fontSize: '16px', fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
