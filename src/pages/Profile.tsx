import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useFeed } from '../context/FeedContext';
import { User as UserIcon, Settings, LogOut, Package, Heart, CreditCard, Shield, ChevronRight } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const { items } = useFeed();
  const [activeTab, setActiveTab] = useState('Listings');

  const tabs = ['Listings', 'Saved', 'Reviews'];

  // Mock user's own items (say they own the new ones)
  const myItems = items.filter(item => item.id > 3);

  const handleSignOut = () => {
    supabase.auth.signOut();
  };

  return (
    <div className="profile-grid animate-slide-in" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      
      {/* Sidebar: Profile Info & Settings */}
      <div className="profile-sidebar">
        {/* Profile Header */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '36px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
            <UserIcon size={36} />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <h2 style={{ fontSize: '22px', margin: '0 0 4px', fontWeight: 700, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>Campus User</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', margin: 0, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user?.email || 'guest@campusrent.com'}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', color: 'var(--secondary)' }}>
              <Shield size={14} />
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Verified Student</span>
            </div>
          </div>
        </div>

        {/* Settings Menu */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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

      {/* Main Content: Tabs & Listings */}
      <div className="profile-content">
        {/* Sub Tabs */}
        <div style={{ display: 'flex', background: 'var(--surface)', padding: '4px', borderRadius: '16px', border: '1px solid var(--surface-border)' }}>
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '10px 0',
                background: activeTab === tab ? 'var(--primary)' : 'transparent',
                color: activeTab === tab ? '#fff' : 'var(--text-muted)',
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
                  <div key={item.id} className="glass-panel" style={{ padding: '12px', display: 'flex', gap: '16px' }}>
                    <img src={item.image} alt={item.title} style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <h4 style={{ margin: '0 0 4px', fontSize: '15px', color: 'var(--text-main)' }}>{item.title}</h4>
                      <p style={{ margin: 0, color: 'var(--primary)', fontWeight: 600 }}>₹{item.price}/day</p>
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
      </div>

    </div>
  );
}
