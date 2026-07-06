import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Home, User, MessageCircle, CalendarCheck, Menu, X, Info, HelpCircle, ShieldCheck, Megaphone, Plus, Coffee } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { useBookings } from '../context/BookingContext';
import CompleteProfileModal from './CompleteProfileModal';
import logoImg from '../assets/logo campus rent.png';

export default function MobileLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { conversations } = useChat();
  const { session, profile } = useAuth();
  const { requests } = useBookings();

  const avatarUrl = profile?.avatar_url || session?.user?.user_metadata?.avatar_url || session?.user?.user_metadata?.picture;
  
  const totalUnread = conversations.reduce((acc, curr) => acc + (curr.unreadCount || 0), 0);
  const myIncomingRequests = requests.filter(r => r.owner_id === session?.user?.id && r.status === 'pending');
  
  const [showBanner, setShowBanner] = useState(false);
  const [bannerText, setBannerText] = useState('');
  const prevUnread = useRef(totalUnread);

  const [showBookingBanner, setShowBookingBanner] = useState(false);
  const prevRequests = useRef(myIncomingRequests.length);

  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const lastScrollY = useRef(0);

  const scrollPositions = useRef<Record<string, number>>({});
  const mainRef = useRef<HTMLElement>(null);
  
  const [showTopMenu, setShowTopMenu] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const currentScrollY = (e.target as HTMLElement).scrollTop;
    scrollPositions.current[location.pathname] = currentScrollY;
    
    if (currentScrollY > lastScrollY.current + 10) {
      setIsScrollingDown(true);
    } else if (currentScrollY < lastScrollY.current - 10) {
      setIsScrollingDown(false);
    }
    lastScrollY.current = currentScrollY;
  };

  useLayoutEffect(() => {
    if (mainRef.current) {
      const savedPosition = scrollPositions.current[location.pathname] || 0;
      // Slight delay to allow new page DOM (especially dynamically loaded feeds) to expand before restoring scroll
      setTimeout(() => {
        if (mainRef.current) {
          mainRef.current.scrollTo(0, savedPosition);
        }
      }, 50);
    }
  }, [location.pathname]);

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

  useEffect(() => {
    if (myIncomingRequests.length > prevRequests.current) {
      if (location.pathname !== `/requests`) {
        setShowBookingBanner(true);
        setTimeout(() => setShowBookingBanner(false), 3000);
      }
    }
    prevRequests.current = myIncomingRequests.length;
  }, [myIncomingRequests.length, location.pathname]);



  return (
    <div className="app-container">
      <CompleteProfileModal />
      
      {/* Yellow Top Bar */}
      <div className={`app-top-bar ${isScrollingDown ? 'hide' : ''}`} style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, height: '60px',
        background: 'var(--primary)',
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        borderBottom: '1px solid rgba(0,0,0,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src={logoImg} alt="CampusRent Logo" style={{ height: '32px', width: 'auto' }} />
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#000', letterSpacing: '-0.5px', lineHeight: '1.1' }}>campusrent</h1>
            <span style={{ fontSize: '10px', fontWeight: 300, color: '#000', letterSpacing: '0px' }}>
              Made with <span style={{ color: '#e25555' }}>♥</span> for GNDU
            </span>
          </div>
        </div>

        {/* Hamburger Menu */}
        <div className="mobile-only" style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowTopMenu(!showTopMenu)}
            style={{ width: '40px', height: '40px', padding: 0, background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', cursor: 'pointer' }}
          >
            {showTopMenu ? <X size={28} /> : <Menu size={28} />}
          </button>
          
          {showTopMenu && (
            <div className="animate-fade-in" style={{ position: 'absolute', top: '50px', right: '-10px', width: '220px', background: 'var(--surface)', borderRadius: '20px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', border: '1px solid var(--surface-border)', overflow: 'hidden', display: 'flex', flexDirection: 'column', zIndex: 100 }}>
              <div onClick={() => { setShowTopMenu(false); navigate('/profile'); }} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--surface-border)', cursor: 'pointer' }}>
                <User size={18} className="text-volt" />
                <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)' }}>My Profile</span>
              </div>
              <div onClick={() => { setShowTopMenu(false); navigate('/coming-soon'); }} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--surface-border)', cursor: 'pointer' }}>
                <Info size={18} className="text-volt" />
                <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)' }}>About the App</span>
              </div>
              <div onClick={() => { setShowTopMenu(false); navigate('/how-it-works'); }} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--surface-border)', cursor: 'pointer' }}>
                <HelpCircle size={18} className="text-volt" />
                <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)' }}>How it Works</span>
              </div>
              <div onClick={() => { setShowTopMenu(false); navigate('/safety-guidelines'); }} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--surface-border)', cursor: 'pointer' }}>
                <ShieldCheck size={18} className="text-volt" />
                <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)' }}>Safety Guidelines</span>
              </div>
              <div onClick={() => { setShowTopMenu(false); window.open('https://www.buymeacoffee.com/', '_blank'); }} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', background: '#FFDD00' }}>
                <Coffee size={18} color="#000" />
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#000' }}>Buy Me a Coffee</span>
              </div>
            </div>
          )}
        </div>
      </div>
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

      {/* Booking Banner */}
      <div 
        onClick={() => { setShowBookingBanner(false); navigate('/requests'); }}
        style={{
        position: 'fixed',
        top: showBookingBanner ? '70px' : '-100px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--success)',
        color: '#fff',
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
        <CalendarCheck size={20} />
        New booking request!
      </div>

      {/* Bottom/Side Navigation */}
      <nav className="app-nav">
        {/* Added App Logo/Brand for Sidebar context (hidden on mobile via CSS optionally, but let's just show it or keep simple) */}
        <NavItem icon={<Home size={24} />} label="Explore" isActive={location.pathname === '/'} onClick={() => navigate('/')} />
        <NavItem icon={<Megaphone size={24} />} label="Community" isActive={location.pathname === '/item-requests'} onClick={() => navigate('/item-requests')} />
        <NavItem icon={<MessageCircle size={24} />} label="Messages" isActive={location.pathname === '/messages'} badgeCount={totalUnread} onClick={() => navigate('/messages')} />
        <NavItem icon={<CalendarCheck size={24} />} label="Requests" isActive={location.pathname === '/requests'} badgeCount={myIncomingRequests.length} onClick={() => navigate('/requests')} />
        <NavItem 
          className="desktop-only"
          icon={avatarUrl ? <img src={avatarUrl} alt="Profile" style={{ width: '24px', height: '24px', borderRadius: '12px', objectFit: 'cover', border: location.pathname === '/profile' ? '2px solid var(--text-main)' : '1px solid var(--surface-border)' }} /> : <User size={24} />} 
          label="Profile" 
          isActive={location.pathname === '/profile'} 
          onClick={() => navigate('/profile')} 
        />
      </nav>

      {/* Scrollable Content Area */}
      <main ref={mainRef} className="app-main hide-scrollbar" onScroll={handleScroll} style={{ transition: 'top 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
        <div className="animate-fade-in" style={{ minHeight: '100%' }}>
          <Outlet />
        </div>
      </main>

      {/* Floating Action Button for Posting */}
      <button 
        onClick={() => navigate('/post')}
        className="animate-slide-up"
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '20px',
          height: '56px',
          padding: '0 24px',
          borderRadius: '28px',
          background: 'var(--primary)',
          color: '#000',
          border: 'none',
          boxShadow: 'var(--primary-glow)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          cursor: 'pointer',
          zIndex: 90,
          fontWeight: 800,
          fontSize: '16px'
        }}
      >
        <Plus size={24} />
        List an item
      </button>

    </div>
  );
}

function NavItem({ icon, label, isActive, badgeCount, onClick, className }: { icon: React.ReactNode, label: string, isActive: boolean, badgeCount?: number, onClick: () => void, className?: string }) {
  return (
    <button 
      onClick={onClick}
      className={`nav-item ${isActive ? 'active' : ''} ${className || ''}`}
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
