import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, PlusSquare, User, Bell, MessageCircle } from 'lucide-react';

export default function MobileLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const getTitle = () => {
    switch (location.pathname) {
      case '/': return 'vicinity';
      case '/post': return 'New Listing';
      case '/messages': return 'Messages';
      case '/profile': return 'My Profile';
      default: return 'vicinity';
    }
  };

  return (
    <div className="app-container">
      
      {/* Top Action Bar */}
      <header className="app-header">
        <h1 style={{ fontSize: '20px', margin: 0, fontWeight: 700, letterSpacing: '-0.5px' }}>
          {getTitle()}
        </h1>
        <button style={{ width: '40px', height: '40px', padding: 0, borderRadius: '20px', background: 'var(--surface-border)', border: 'none', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'none' }}>
          <Bell size={20} />
        </button>
      </header>

      {/* Bottom/Side Navigation */}
      <nav className="app-nav">
        {/* Added App Logo/Brand for Sidebar context (hidden on mobile via CSS optionally, but let's just show it or keep simple) */}
        
        <NavItem icon={<Home size={24} />} label="Explore" isActive={location.pathname === '/'} onClick={() => navigate('/')} />
        <NavItem icon={<MessageCircle size={24} />} label="Messages" isActive={location.pathname === '/messages'} onClick={() => navigate('/messages')} />
        <NavItem icon={<PlusSquare size={24} />} label="Post" isActive={location.pathname === '/post'} onClick={() => navigate('/post')} />
        <NavItem icon={<User size={24} />} label="Profile" isActive={location.pathname === '/profile'} onClick={() => navigate('/profile')} />
      </nav>

      {/* Scrollable Content Area */}
      <main className="app-main hide-scrollbar">
        <div className="animate-fade-in" style={{ minHeight: '100%' }}>
          <Outlet />
        </div>
      </main>

    </div>
  );
}

function NavItem({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`nav-item ${isActive ? 'active' : ''}`}
    >
      <div style={{ position: 'relative' }}>
        {icon}
        {isActive && (
          <div style={{ position: 'absolute', bottom: '-4px', left: '50%', transform: 'translateX(-50%)', width: '4px', height: '4px', borderRadius: '2px', background: 'var(--primary)' }} />
        )}
      </div>
      <span className="nav-item-label">{label}</span>
    </button>
  );
}
