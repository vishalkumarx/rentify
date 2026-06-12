import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { Home, PlusSquare, User, MessageCircle, Package } from 'lucide-react';
import { useChat } from '../context/ChatContext';

export default function MobileLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { conversations } = useChat();
  
  const totalUnread = conversations.reduce((acc, curr) => acc + (curr.unreadCount || 0), 0);
  
  const [showBanner, setShowBanner] = useState(false);
  const [bannerText, setBannerText] = useState('');
  const prevUnread = useRef(totalUnread);

  useEffect(() => {
    if (totalUnread > prevUnread.current) {
      const latestConv = conversations.find(c => c.unreadCount > 0);
      if (latestConv && location.pathname !== `/chat/${latestConv.id}`) {
        setBannerText(`New message from ${latestConv.otherUserName}`);
        setShowBanner(true);
        setTimeout(() => setShowBanner(false), 3000);
      }
    }
    prevUnread.current = totalUnread;
  }, [totalUnread, conversations, location.pathname]);

  const [showHeader, setShowHeader] = useState(true);
  const lastScrollY = useRef(0);

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const currentScrollY = e.currentTarget.scrollTop;
    if (currentScrollY > 60 && currentScrollY > lastScrollY.current + 10) {
      setShowHeader(false); // scrolling down
    } else if (currentScrollY < lastScrollY.current - 10 || currentScrollY <= 60) {
      setShowHeader(true); // scrolling up or at top
    }
    lastScrollY.current = currentScrollY;
  };

  return (
    <div className="app-container">
      
      {/* Top Action Bar */}
      <header className="app-header" style={{ transform: showHeader ? 'translateY(0)' : 'translateY(-100%)', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <h1 style={{ textAlign: 'center', fontSize: '32px', margin: 0, fontWeight: 400, letterSpacing: '1px', color: 'var(--text-main)', fontFamily: '"Holiday", "Pacifico", cursive', textTransform: 'lowercase' }}>
          vicinity
        </h1>
      </header>

      {/* Message Banner */}
      <div 
        onClick={() => { setShowBanner(false); navigate('/messages'); }}
        style={{
        position: 'fixed',
        top: showBanner ? '70px' : '-100px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--primary)',
        color: '#111827',
        padding: '12px 24px',
        borderRadius: '24px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 9999,
        transition: 'top 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer'
      }}>
        <MessageCircle size={20} />
        {bannerText}
      </div>

      {/* Bottom/Side Navigation */}
      <nav className={`app-nav ${showHeader ? '' : 'nav-hidden'}`}>
        {/* Added App Logo/Brand for Sidebar context (hidden on mobile via CSS optionally, but let's just show it or keep simple) */}
        
        <NavItem icon={<Home size={24} />} label="Explore" isActive={location.pathname === '/'} onClick={() => navigate('/')} />
        <NavItem icon={<MessageCircle size={24} />} label="Messages" isActive={location.pathname === '/messages'} badgeCount={totalUnread} onClick={() => navigate('/messages')} />
        <NavItem icon={<PlusSquare size={24} />} label="Post" isActive={location.pathname === '/post'} onClick={() => navigate('/post')} />
        <NavItem icon={<Package size={24} />} label="My Listings" isActive={location.pathname === '/my-listings'} onClick={() => navigate('/my-listings')} />
        <NavItem icon={<User size={24} />} label="Profile" isActive={location.pathname === '/profile'} onClick={() => navigate('/profile')} />
      </nav>

      {/* Scrollable Content Area */}
      <main className="app-main hide-scrollbar" onScroll={handleScroll} style={{ top: showHeader ? '60px' : '0px', transition: 'top 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
        <div className="animate-fade-in" style={{ minHeight: '100%' }}>
          <Outlet />
        </div>
      </main>

    </div>
  );
}

function NavItem({ icon, label, isActive, badgeCount, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, badgeCount?: number, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`nav-item ${isActive ? 'active' : ''}`}
    >
      <div style={{ position: 'relative' }}>
        {icon}
        {badgeCount !== undefined && badgeCount > 0 && (
          <span style={{ position: 'absolute', top: '-4px', right: '-6px', background: 'var(--danger)', color: 'white', fontSize: '10px', fontWeight: 800, padding: '2px 4px', borderRadius: '10px', minWidth: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {badgeCount}
          </span>
        )}
        {isActive && (
          <span style={{ position: 'absolute', bottom: '-8px', left: '50%', transform: 'translateX(-50%)', width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-main)' }} />
        )}
      </div>
      <span className="nav-item-label">{label}</span>
    </button>
  );
}
