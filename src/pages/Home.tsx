import { useState, useEffect, useRef } from 'react';
import { Search, SlidersHorizontal, Heart, Flame, ArrowRight, Building2 } from 'lucide-react';
import { useFeed } from '../context/FeedContext';
import { CATEGORIES, DEPARTMENTS } from '../lib/constants';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBookings } from '../context/BookingContext';

// @ts-ignore
import imgBooks from '../assets/books and stationary.PNG';
// @ts-ignore
import imgClothing from '../assets/clothings and lab wears.PNG';
// @ts-ignore
import imgElectronics from '../assets/electronics.PNG';
// @ts-ignore
import imgMobility from '../assets/mobility.PNG';
// @ts-ignore
import imgSports from '../assets/sports.PNG';
// @ts-ignore
import imgTools from '../assets/tools and hardware.PNG';

const visualCategories = [
  { id: 'Books and Stationary', title: 'Books & Stationary', img: imgBooks },
  { id: 'Clothing & Formalwear', title: 'Clothing & Formalwear', img: imgClothing },
  { id: 'Electronics', title: 'Electronics', img: imgElectronics },
  { id: 'Mobility', title: 'Mobility', img: imgMobility },
  { id: 'Sports Gear', title: 'Sports Gear', img: imgSports },
  { id: 'Tools & Hardware', title: 'Tools & Hardware', img: imgTools }
];

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

  const renderItemCard = (item: any, index: number, isFeatured: boolean) => (
    <div 
      key={item.id} 
      onClick={() => navigate(`/item/${item.id}`)}
      className="animate-slide-in" 
      style={{ 
        gridColumn: 'span 1',
        background: 'var(--surface)', 
        borderRadius: '0', 
        border: isFeatured ? '2px solid var(--success)' : '1px solid var(--surface-border)', 
        overflow: 'hidden', 
        display: 'flex', 
        flexDirection: 'column', 
        position: 'relative',
        animationDelay: `${index * 0.05}s`, 
        cursor: 'pointer',
        boxShadow: isFeatured ? '0 8px 30px rgba(34, 197, 94, 0.15)' : 'none'
      }}
    >
      <div style={{ position: 'relative', height: '200px' }}>
        {isFeatured && (
          <div style={{ position: 'absolute', top: '-1px', right: '16px', background: 'var(--success)', color: '#fff', padding: '6px 12px', borderRadius: '0 0 12px 12px', fontSize: '11px', fontWeight: 800, letterSpacing: '1px', zIndex: 10, boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)' }}>
            FEATURED
          </div>
        )}
        <img 
          src={item.image} 
          alt={item.title} 
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', opacity: item.status === 'booked' ? 0.5 : 1 }}
        />
        
        {/* Status Overlays */}
        {(() => {
          const userAcceptedReq = session ? requests.find(r => r.item_id === item.id && r.requester_id === session.user.id && r.status === 'accepted') : null;
          if (userAcceptedReq) {
            return (
              <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'var(--success)', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: 800, letterSpacing: '0.5px' }}>
                RENTED BY YOU
              </div>
            );
          }
          if (item.status === 'booked') {
            return (
              <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(255,255,255,0.9)', color: 'var(--text-main)', padding: '4px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: 800, border: '1px solid var(--surface-border)' }}>
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
      </div>

      {/* Text Container Below Image */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
          <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', background: 'var(--surface-border)', color: 'var(--text-muted)', padding: '2px 6px', borderRadius: '4px', marginBottom: '2px' }}>
            {item.category}
          </span>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', width: '100%' }}>{item.title}</h3>
          <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--success)' }}>
            ₹{item.price}
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500, minWidth: 0, flex: 1 }}>
            <Building2 size={14} style={{ flexShrink: 0 }} />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {item.department?.startsWith('lat:') ? DEPARTMENTS[(item.id % (DEPARTMENTS.length - 1)) + 1] : item.department}
            </span>
          </p>
          
          {item.itemRating != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--warning)', fontWeight: 700, flexShrink: 0 }}>
              ⭐ {item.itemRating} ({item.itemReviewCount || 0})
            </div>
          )}
        </div>
        
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.3 }}>
          {item.description || 'No description available for this item. Contact the seller for more details.'}
        </p>
      </div>
    </div>
  );

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
        
        {/* Desktop Sidebar (Removed to favor visual grid) */}
        <div className="desktop-categories" style={{ display: 'none' }}></div>

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

        {/* Visual Categories Grid */}
        <div style={{ padding: '16px' }}>
          <div className="categories-grid">
            {visualCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(activeCategory === cat.id ? 'All' : cat.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer'
                }}
              >
                <div style={{ 
                  width: '100%', 
                  aspectRatio: '1', 
                  borderRadius: '16px', 
                  overflow: 'hidden',
                  border: activeCategory === cat.id ? '2px solid var(--primary)' : '1px solid var(--surface-border)',
                  boxShadow: activeCategory === cat.id ? '0 4px 12px rgba(255, 204, 0, 0.3)' : '0 2px 8px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s ease'
                }}>
                  <img src={cat.img} alt={cat.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <span className="cat-text" style={{ fontWeight: 700, color: activeCategory === cat.id ? 'var(--primary)' : 'var(--text-main)', textAlign: 'center', lineHeight: 1.2 }}>
                  {cat.title}
                </span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="responsive-grid" style={{ padding: '0 16px 32px' }}>
            <div className="skeleton" style={{ gridColumn: 'span 2', height: '240px', borderRadius: '24px' }}></div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ aspectRatio: '4/3', borderRadius: '24px' }}></div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <p style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text-muted)' }}>Nothing here yet</p>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>Try a different category or search</p>
          </div>
        ) : (
          (() => {
            const featuredCount = window.innerWidth < 768 ? 1 : 3;
            const featuredItems = filteredItems.slice(0, featuredCount);
            const normalItems = filteredItems.slice(featuredCount, displayCount);
            
            return (
              <>
                {featuredItems.length > 0 && (
                  <>
                    <div style={{ padding: '8px 16px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.5px' }}>
                        <Flame size={20} className="text-volt" /> Featured
                      </h2>
                    </div>
                    <div className="responsive-grid" style={{ padding: '0 16px 32px' }}>
                      {featuredItems.map((item, index) => renderItemCard(item, index, true))}
                    </div>
                  </>
                )}

                {normalItems.length > 0 && (
                  <>
                    <div style={{ padding: '8px 16px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.5px' }}>
                        Recently Added
                      </h2>
                      <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>
                        {Math.min(filteredItems.length - featuredCount, displayCount - featuredCount)} items
                      </span>
                    </div>
                    <div className="responsive-grid" style={{ padding: '0 16px 32px' }}>
                      {normalItems.map((item, index) => renderItemCard(item, index, false))}
                    </div>
                  </>
                )}
              </>
            );
          })()
        )}

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
