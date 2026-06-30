import { useState, useEffect, useRef } from 'react';
import { Search, SlidersHorizontal, Heart, LayoutGrid, Laptop, Book, Bike, Bed, PartyPopper, Wrench, Shirt, Dumbbell, Camera, Gamepad2, Music, MoreHorizontal, Flame, ArrowRight, Building2 } from 'lucide-react';
import { useFeed } from '../context/FeedContext';
import { CATEGORIES, DEPARTMENTS } from '../lib/constants';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBookings } from '../context/BookingContext';

const PROMOS = [
  { title: "Campus Commute", subtitle: "Rent e-scooters from $5/day", badge: "Mobility", url: "https://images.unsplash.com/photo-1778735790178-f2d243a914d9?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" },
  { title: "Zone out. Study in.", subtitle: "Premium noise-cancelling gear", badge: "Electronics", url: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" },
  { title: "Finals Week Deals", subtitle: "Up to 40% off study essentials", badge: "Hot", url: "https://images.unsplash.com/photo-1620287920810-3f5b9746380c?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" },
];

export default function Home() {
  const { session, profile, updateProfile } = useAuth();
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const { requests } = useBookings();
  const firstName = profile?.name?.split(" ")[0] || session?.user?.user_metadata?.full_name?.split(" ")[0] || "there";
  const userDepartment = profile?.department || "Choose your department";

  const categoryIcons: Record<string, React.ReactNode> = {
    'All': <LayoutGrid size={16} />,
    'Electronics': <Laptop size={16} />,
    'Textbooks': <Book size={16} />,
    'Mobility': <Bike size={16} />,
    'Dorm Essentials': <Bed size={16} />,
    'Party Supplies': <PartyPopper size={16} />,
    'Tools & Hardware': <Wrench size={16} />,
    'Clothing & Formalwear': <Shirt size={16} />,
    'Sports Gear': <Dumbbell size={16} />,
    'Photography': <Camera size={16} />,
    'Gaming': <Gamepad2 size={16} />,
    'Music Instruments': <Music size={16} />,
    'Others': <MoreHorizontal size={16} />
  };
  
  // Animated Placeholder
  const phrases = [
    "Search for Books...",
    "Search for Electronics...",
    "Search for Furniture...",
    "Search for Bicycles...",
    "Search for Notes..."
  ];
  const [placeholderText, setPlaceholderText] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const currentPhrase = phrases[phraseIndex];
    
    if (isDeleting) {
      if (placeholderText === "") {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % phrases.length);
      } else {
        timer = setTimeout(() => {
          setPlaceholderText(currentPhrase.substring(0, placeholderText.length - 1));
        }, 30);
      }
    } else {
      if (placeholderText === currentPhrase) {
        timer = setTimeout(() => setIsDeleting(true), 2000);
      } else {
        timer = setTimeout(() => {
          setPlaceholderText(currentPhrase.substring(0, placeholderText.length + 1));
        }, 80);
      }
    }
    return () => clearTimeout(timer);
  }, [placeholderText, isDeleting, phraseIndex]);
  
  // Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest', 'price-asc', 'price-desc'
  const [displayCount, setDisplayCount] = useState(12);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setDisplayCount(prev => prev + 12);
        }
      },
      { rootMargin: '200px' }
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, []);

  const { items, toggleLike, loading } = useFeed();
  const navigate = useNavigate();


  // Filter items based on active category, search
  const filteredItems = items
    .filter(item => {
      // Hide posts made by the logged-in user
      if (session?.user?.id && item.userId === session.user.id) {
        return false;
      }

      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (sortOrder === 'price-asc') return Number(a.price) - Number(b.price);
      if (sortOrder === 'price-desc') return Number(b.price) - Number(a.price);
      return b.id - a.id; // 'newest' (assuming higher ID is newer)
    });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* Department Chooser (Sticky) */}
      <div style={{ position: 'sticky', top: 0, zIndex: 40, background: 'var(--bg)', padding: '16px', display: 'flex' }}>
        <div onClick={() => setShowDepartmentModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', cursor: 'pointer', background: 'var(--surface)', padding: '8px 12px', borderRadius: '16px', border: '1px solid var(--surface-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <Building2 size={16} />
          <span style={{ fontSize: '14px', fontWeight: 700 }}>{userDepartment}</span>
        </div>
      </div>

      {/* Greeting & Search (Scrolls with page) */}
      <div style={{ padding: '8px 16px 16px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg)' }}>
        
        {/* Greeting */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 600, margin: 0 }}>Hey {firstName} 👋</p>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, letterSpacing: '-0.5px', color: 'var(--text-main)' }}>What do you need today?</h1>
        </div>

        {/* Search & Filter */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '16px', padding: '12px 16px', gap: '12px', transition: 'all 0.2s' }}>
            <Search size={20} color="var(--text-muted)" />
            <input
              type="text"
              placeholder={placeholderText || "Search..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: 0, border: 'none', background: 'transparent', boxShadow: 'none', width: '100%', outline: 'none', color: 'var(--text-main)' }}
            />
          </div>
          <button 
            onClick={() => setShowFilters(true)}
            style={{ width: '48px', height: '48px', padding: 0, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: sortOrder !== 'newest' ? 'var(--primary)' : 'var(--surface)', color: sortOrder !== 'newest' ? '#000' : 'var(--text-main)', border: sortOrder !== 'newest' ? 'none' : '1px solid var(--surface-border)' }}
          >
            <SlidersHorizontal size={20} />
          </button>
        </div>
      </div>

      {/* Content Layout */}
      <div className="home-layout">
        
        {/* Desktop Sidebar */}
        <div className="desktop-categories">
          <h3 style={{ padding: '0 8px 12px', margin: 0, fontSize: '18px', fontWeight: 800 }}>Categories</h3>
          {CATEGORIES.map(cat => {
            const active = activeCategory === cat;
            return (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '16px', fontSize: '15px', fontWeight: 600, width: '100%',
                  background: active ? '#000000' : 'transparent',
                  color: active ? '#ffffff' : '#000000',
                  border: 'none',
                  justifyContent: 'flex-start'
                }}
              >
                {categoryIcons[cat]}
                {cat === 'All' ? 'All Categories' : cat}
              </button>
            );
          })}
        </div>

        {/* Main Scroll Content */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        
        {/* Promo Carousel */}
        <div style={{ width: '100%', overflow: 'hidden', marginTop: '16px' }}>
          <div className="hide-scrollbar" style={{ display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', padding: '0 16px 8px', gap: '16px' }}>
            {PROMOS.map((p, i) => (
              <div key={i} className="promo-card" style={{ height: '180px', borderRadius: '24px', position: 'relative', overflow: 'hidden', scrollSnapAlign: 'center', flexShrink: 0, border: '1px solid var(--surface-border)', display: 'flex', alignItems: 'flex-end', padding: '20px' }}>
                <img src={p.url} alt={p.title} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.4), transparent)' }} />
                <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', color: '#fff' }}>
                  <span style={{ alignSelf: 'flex-start', padding: '4px 10px', background: 'var(--primary)', color: '#000', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', borderRadius: '20px', letterSpacing: '1px' }}>{p.badge}</span>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: '20px', lineHeight: 1.1 }}>{p.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>{p.subtitle}</p>
                    <ArrowRight size={20} className="text-volt" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Categories Pill Scroll */}
        <div className="mobile-categories hide-scrollbar" style={{ padding: '12px 16px', gap: '10px', alignItems: 'center' }}>
          {CATEGORIES.map(cat => {
            const active = activeCategory === cat;
            return (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '16px', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap', width: 'auto', height: 'auto',
                  background: active ? 'var(--primary-glow)' : 'var(--surface)',
                  border: active ? '1px solid var(--primary)' : '1px solid var(--surface-border)',
                  color: active ? 'var(--primary)' : 'var(--text-muted)'
                }}
              >
                {categoryIcons[cat]}
                {cat === 'All' ? 'All Categories' : cat}
              </button>
            );
          })}
        </div>

        {/* Feed Header */}
        <div style={{ padding: '8px 16px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.5px' }}>
            <Flame size={20} className="text-volt" /> Featured
          </h2>
          <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>{Math.min(filteredItems.length, displayCount)} items</span>
        </div>

        {/* Feed Grid */}
        <div className="responsive-grid" style={{ padding: '0 16px 32px' }}>
          {loading ? (
            <>
              <div className="skeleton" style={{ gridColumn: 'span 2', height: '240px', borderRadius: '24px' }}></div>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ aspectRatio: '4/3', borderRadius: '24px' }}></div>
              ))}
            </>
          ) : filteredItems.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text-muted)' }}>Nothing here yet</p>
              <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>Try a different category or search</p>
            </div>
          ) : (
            filteredItems.slice(0, displayCount).map((item, index) => {
              const isFeatured = index < (window.innerWidth < 768 ? 1 : 3);
              return (
                <div 
                  key={item.id} 
                  onClick={() => navigate(`/item/${item.id}`)}
                  className="animate-slide-in" 
                  style={{ 
                    gridColumn: 'span 1',
                    background: 'var(--surface)', 
                    borderRadius: '24px', 
                    border: isFeatured ? '2px solid var(--primary)' : '1px solid var(--surface-border)', 
                    overflow: 'hidden', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    position: 'relative',
                    animationDelay: `${index * 0.05}s`, 
                    cursor: 'pointer',
                    boxShadow: isFeatured ? '0 8px 30px rgba(255, 204, 0, 0.15)' : 'none'
                  }}
                >
                  <div style={{ position: 'relative', height: '240px' }}>
                    {isFeatured && (
                      <div style={{ position: 'absolute', top: '-1px', right: '16px', background: 'var(--primary)', color: '#000', padding: '6px 12px', borderRadius: '0 0 12px 12px', fontSize: '11px', fontWeight: 800, letterSpacing: '1px', zIndex: 10, boxShadow: '0 4px 12px rgba(255, 204, 0, 0.3)' }}>
                        FEATURED
                      </div>
                    )}
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: item.status === 'booked' ? 0.5 : 1 }}
                    />
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 60%)' }} />
                    
                    {/* Status Overlays */}
                    {(() => {
                      const userAcceptedReq = session ? requests.find(r => r.item_id === item.id && r.requester_id === session.user.id && r.status === 'accepted') : null;
                      if (userAcceptedReq) {
                        return (
                          <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'var(--success)', color: '#fff', padding: '4px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: 800, letterSpacing: '0.5px' }}>
                            RENTED BY YOU
                          </div>
                        );
                      }
                      if (item.status === 'booked') {
                        return (
                          <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)', color: 'var(--text-main)', padding: '4px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: 800, border: '1px solid var(--surface-border)' }}>
                            UNAVAILABLE
                          </div>
                        );
                      }
                      return null;
                    })()}

                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        if (!session) navigate('/login'); else toggleLike(item.id); 
                      }}
                      style={{ position: 'absolute', top: '12px', right: '12px', width: '32px', height: '32px', padding: 0, borderRadius: '16px', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(4px)', border: '1px solid rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.liked ? 'var(--danger)' : 'var(--text-muted)' }}
                    >
                      <Heart size={16} fill={item.liked ? 'var(--danger)' : 'none'} />
                    </button>

                    <div style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <div style={{ flex: 1, minWidth: 0, paddingRight: '8px', color: '#fff' }}>
                        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</h3>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Building2 size={12} />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.department}
                          </span>
                        </p>
                      </div>
                      <div style={{ background: 'var(--primary)', color: '#000', padding: '6px 12px', borderRadius: '12px', fontWeight: 800, fontSize: '14px' }}>
                        ₹{item.price}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Load More Trigger */}
        {filteredItems.length > displayCount && (
          <div ref={loadMoreRef} style={{ height: '40px', width: '100%' }} />
        )}
      </div>

      {/* Filter Modal */}
      {showFilters && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', animation: 'fadeIn 0.2s' }}>
          <div className="animate-slide-up" style={{ width: '100%', maxWidth: '360px', background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '32px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Filters</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, color: 'var(--text-muted)' }}>Category</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {CATEGORIES.map(c => (
                  <button 
                    key={c} 
                    onClick={() => setActiveCategory(c)} 
                    style={{ padding: '8px 16px', borderRadius: '16px', fontSize: '14px', background: activeCategory === c ? 'var(--primary)' : 'rgba(0,0,0,0.05)', color: activeCategory === c ? '#000' : 'var(--text-main)', border: activeCategory === c ? 'none' : '1px solid var(--surface-border)' }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, color: 'var(--text-muted)' }}>Sort By</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { id: 'newest', label: 'Newest First' },
                  { id: 'price-asc', label: 'Price: Low to High' },
                  { id: 'price-desc', label: 'Price: High to Low' }
                ].map(s => (
                  <button 
                    key={s.id} 
                    onClick={() => setSortOrder(s.id)} 
                    style={{ width: '100%', textAlign: 'left', padding: '12px 16px', borderRadius: '16px', fontSize: '14px', background: sortOrder === s.id ? 'var(--primary)' : 'rgba(0,0,0,0.05)', color: sortOrder === s.id ? '#000' : 'var(--text-main)', border: sortOrder === s.id ? 'none' : '1px solid var(--surface-border)' }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => setShowFilters(false)} className="glow" style={{ marginTop: '8px', padding: '16px', borderRadius: '20px', background: 'var(--primary)', color: '#000', fontWeight: 800, fontSize: '16px' }}>
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Department Picker Modal */}
      {showDepartmentModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', animation: 'fadeIn 0.2s' }}>
          <div className="animate-slide-up" style={{ width: '100%', maxWidth: '360px', background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '32px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Choose Department</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
              {DEPARTMENTS.map(dept => (
                <button
                  key={dept}
                  onClick={() => {
                    updateProfile({ department: dept });
                    setShowDepartmentModal(false);
                  }}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '16px',
                    textAlign: 'left',
                    background: userDepartment === dept ? 'var(--primary)' : 'var(--surface)',
                    color: userDepartment === dept ? '#000' : 'var(--text-main)',
                    border: userDepartment === dept ? '1px solid var(--primary)' : '1px solid var(--surface-border)',
                    fontWeight: userDepartment === dept ? 700 : 500,
                    fontSize: '15px'
                  }}
                >
                  {dept}
                </button>
              ))}
            </div>
            <button onClick={() => setShowDepartmentModal(false)} style={{ padding: '14px', borderRadius: '20px', background: 'var(--surface-border)', color: 'var(--text-main)', fontWeight: 700, fontSize: '15px', border: 'none' }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
