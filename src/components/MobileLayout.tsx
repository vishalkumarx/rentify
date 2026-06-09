import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, PlusSquare, User, Bell, MessageCircle } from 'lucide-react';

export default function MobileLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const getTitle = () => {
    switch (location.pathname) {
      case '/': return 'CampusRent';
      case '/post': return 'New Listing';
      case '/messages': return 'Messages';
      case '/profile': return 'My Profile';
      default: return 'CampusRent';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
      
      {/* Top Action Bar */}
      <header 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          zIndex: 50,
          background: 'var(--primary)',
          color: 'white',
          boxShadow: '0 4px 20px var(--primary-glow)'
        }}
      >
        <h1 style={{ fontSize: '20px', margin: 0, fontWeight: 700, letterSpacing: '-0.5px' }}>
          {getTitle()}
        </h1>
        <button style={{ width: '40px', height: '40px', padding: 0, borderRadius: '20px', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'none' }}>
          <Bell size={20} />
        </button>
      </header>

      {/* Scrollable Content Area */}
      <main className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingTop: '60px', paddingBottom: '80px', WebkitOverflowScrolling: 'touch' }}>
        <div className="animate-fade-in" style={{ height: '100%' }}>
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav 
        className="glass-nav"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '80px',
          paddingBottom: 'env(safe-area-inset-bottom)',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          zIndex: 50,
          borderTop: '1px solid var(--surface-border)',
          background: 'white'
        }}
      >
        <NavItem icon={<Home size={24} />} label="Explore" isActive={location.pathname === '/'} onClick={() => navigate('/')} />
        <NavItem icon={<MessageCircle size={24} />} label="Messages" isActive={location.pathname === '/messages'} onClick={() => navigate('/messages')} />
        <NavItem icon={<PlusSquare size={24} />} label="Post" isActive={location.pathname === '/post'} onClick={() => navigate('/post')} />
        <NavItem icon={<User size={24} />} label="Profile" isActive={location.pathname === '/profile'} onClick={() => navigate('/profile')} />
      </nav>
    </div>
  );
}

function NavItem({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        padding: '8px 16px',
        background: 'transparent',
        border: 'none',
        color: isActive ? 'var(--primary)' : 'var(--text-muted)',
        transform: isActive ? 'scale(1.05)' : 'scale(1)',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: 'none',
        cursor: 'pointer'
      }}
    >
      <div style={{ position: 'relative' }}>
        {icon}
        {isActive && (
          <div style={{ position: 'absolute', bottom: '-4px', left: '50%', transform: 'translateX(-50%)', width: '4px', height: '4px', borderRadius: '2px', background: 'var(--primary)' }} />
        )}
      </div>
      <span style={{ fontSize: '11px', fontWeight: isActive ? 600 : 500 }}>{label}</span>
    </button>
  );
}
