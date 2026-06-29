import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { Search, MapPin, SlidersHorizontal, RefreshCcw, ChevronRight, Heart, LayoutGrid, Laptop, Book, Bike, Bed, PartyPopper, Wrench, Shirt, Dumbbell, Camera, Gamepad2, Music, MoreHorizontal, Flame, ArrowRight } from 'lucide-react';
import { useFeed } from '../context/FeedContext';
import { CATEGORIES } from '../lib/constants';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBookings } from '../context/BookingContext';

const PROMOS = [
  { title: "Campus Commute", subtitle: "Rent e-scooters from $5/day", badge: "Mobility", url: "https://images.unsplash.com/photo-1778735790178-f2d243a914d9?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" },
  { title: "Zone out. Study in.", subtitle: "Premium noise-cancelling gear", badge: "Electronics", url: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" },
  { title: "Finals Week Deals", subtitle: "Up to 40% off study essentials", badge: "Hot", url: "https://images.unsplash.com/photo-1620287920810-3f5b9746380c?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" },
];

export default function Home() {
  const [location, setLocation] = useState('Locating...');
  const [userCoords, setUserCoords] = useState<{lat: number, lng: number} | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const { session } = useAuth();
  const { requests } = useBookings();
  const firstName = session?.user?.user_metadata?.full_name?.split(" ")[0] || "there";

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
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest', 'price-asc', 'price-desc', 'distance'
  const [displayCount, setDisplayCount] = useState(10);

  const { items, toggleLike, loading } = useFeed();
  const navigate = useNavigate();
  
  const fetchLocation = () => {
    setLocation('Fetching Location...');
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            setUserCoords({ lat: latitude, lng: longitude });
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
            const data = await res.json();
            
            // Try to extract a sensible city/town name
            const city = data.address.city || data.address.town || data.address.village || data.address.county || 'Unknown Area';
            const state = data.address.state || '';
            setLocation(`${city}${state ? `, ${state}` : ''}`);
          } catch (error) {
            console.error('Reverse geocoding failed', error);
            setLocation('Location Unavailable');
          }
        },
        (error) => {
          console.error('Geolocation error', error);
          setLocation('Location Denied');
        }
      );
    } else {
      setLocation('Geolocation Unsupported');
    }
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  // Haversine formula
  const getDistance = (lat1?: number, lon1?: number, lat2?: number, lon2?: number) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;  
    const dLon = (lon2 - lon1) * Math.PI / 180; 
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; // Distance in km
  }

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
      if (sortOrder === 'distance' && userCoords) {
        const distA = getDistance(userCoords.lat, userCoords.lng, a.location?.lat, a.location?.lng) ?? Infinity;
        const distB = getDistance(userCoords.lat, userCoords.lng, b.location?.lat, b.location?.lng) ?? Infinity;
        return distA - distB;
      }
      if (sortOrder === 'price-asc') return Number(a.price) - Number(b.price);
      if (sortOrder === 'price-desc') return Number(b.price) - Number(a.price);
      return b.id - a.id; // 'newest' (assuming higher ID is newer)
    });

  return (
    <div className="home-layout" style={{ display: 'flex', flexDirection: 'column', gap: 0, padding: 0 }}>
      {/* Top Floating Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, padding: '24px 16px 16px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(5, 5, 5, 0.8)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--surface-border)' }}>
        
        {/* Location & Notification */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
            <MapPin size={16} className="text-volt" />
            <span style={{ fontSize: '14px', fontWeight: 500, maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{location}</span>
            {(location === 'Location Unavailable' || location === 'Location Denied') && (
              <button 
                onClick={() => fetchLocation()} 
                style={{ padding: '4px', background: 'transparent', color: 'var(--text-muted)', width: 'auto', border: 'none' }}
              >
                <RefreshCcw size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Greeting */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500, margin: 0 }}>Hey {firstName} 👋</p>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>What do you need today?</h1>
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
              style={{ padding: 0, border: 'none', background: 'transparent', boxShadow: 'none', width: '100%', outline: 'none' }}
            />
          </div>
          <button 
            onClick={() => setShowFilters(true)}
            style={{ width: '48px', height: '48px', padding: 0, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: sortOrder !== 'newest' ? 'var(--primary-glow)' : 'var(--surface)', color: sortOrder !== 'newest' ? 'var(--primary)' : 'var(--text-main)', border: sortOrder !== 'newest' ? '1px solid var(--primary)' : '1px solid var(--surface-border)' }}
          >
            <SlidersHorizontal size={20} />
          </button>
        </div>
      </div>

      {/* Main Scroll Content */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        
        {/* Promo Carousel */}
        <div style={{ width: '100%', overflow: 'hidden', marginTop: '16px' }}>
          <div className="hide-scrollbar" style={{ display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', padding: '0 16px 8px', gap: '16px' }}>
            {PROMOS.map((p, i) => (
              <div key={i} style={{ minWidth: '85%', height: '180px', borderRadius: '24px', position: 'relative', overflow: 'hidden', scrollSnapAlign: 'center', flexShrink: 0, border: '1px solid var(--surface-border)', display: 'flex', alignItems: 'flex-end', padding: '20px' }}>
                <img src={p.url} alt={p.title} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to top, rgba(5,5,5,1), rgba(5,5,5,0.4), transparent)' }} />
                <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                  <span style={{ alignSelf: 'flex-start', padding: '4px 10px', background: 'var(--primary)', color: '#000', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', borderRadius: '20px', letterSpacing: '1px' }}>{p.badge}</span>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: '20px', lineHeight: 1.1 }}>{p.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>{p.subtitle}</p>
                    <ArrowRight size={20} className="text-volt" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Categories Pill Scroll */}
        <div className="hide-scrollbar" style={{ padding: '12px 16px', display: 'flex', gap: '10px', overflowX: 'auto', alignItems: 'center' }}>
          {CATEGORIES.map(cat => {
            const active = activeCategory === cat;
            return (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '16px', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap', width: 'auto', height: 'auto',
                  background: active ? 'rgba(204, 255, 0, 0.1)' : 'var(--surface)',
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
            <Flame size={20} className="text-volt" /> Near you
          </h2>
          <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>{filteredItems.length} items</span>
        </div>

        {/* Feed Grid */}
        <div style={{ 
          padding: '0 16px 32px', 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '14px' 
        }}>
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
              const isFeatured = index === 0;
              return (
                <div 
                  key={item.id} 
                  onClick={() => navigate(`/item/${item.id}`)}
                  className="animate-slide-in" 
                  style={{ 
                    gridColumn: isFeatured ? 'span 2' : 'span 1',
                    background: 'var(--surface)', 
                    borderRadius: '24px', 
                    border: '1px solid var(--surface-border)', 
                    overflow: 'hidden', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    position: 'relative',
                    animationDelay: `${index * 0.05}s`, 
                    cursor: 'pointer' 
                  }}
                >
                  <div style={{ position: 'relative', height: isFeatured ? '240px' : '160px' }}>
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: item.status === 'booked' ? 0.5 : 1 }}
                    />
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to top, rgba(18,18,18,1), rgba(18,18,18,0) 60%)' }} />
                    
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
                      style={{ position: 'absolute', top: '12px', right: '12px', width: '32px', height: '32px', padding: 0, borderRadius: '16px', background: 'rgba(18,18,18,0.6)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.liked ? 'var(--danger)' : 'var(--text-muted)' }}
                    >
                      <Heart size={16} fill={item.liked ? 'var(--danger)' : 'none'} />
                    </button>

                    <div style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</h3>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {userCoords && item.location 
                              ? `${getDistance(userCoords.lat, userCoords.lng, item.location.lat, item.location.lng)?.toFixed(1)} km` 
                              : (item.location?.address || 'General')}
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

        {/* Load More */}
        {filteredItems.length > displayCount && (
          <div style={{ padding: '0 20px 40px', display: 'flex', justifyContent: 'center' }}>
            <button 
              onClick={() => setDisplayCount(prev => prev + 10)}
              style={{ width: 'auto', padding: '12px 32px', background: 'transparent', border: '1px solid var(--surface-border)', color: 'var(--text-main)', borderRadius: '24px', fontWeight: 600, fontSize: '14px' }}
            >
              Load More
            </button>
          </div>
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
                    style={{ width: 'auto', padding: '8px 16px', borderRadius: '24px', fontSize: '14px', background: activeCategory === c ? 'var(--primary)' : 'rgba(255,255,255,0.05)', color: activeCategory === c ? '#000' : 'var(--text-main)', border: activeCategory === c ? 'none' : '1px solid var(--surface-border)' }}
                  >
                    {c === 'All' ? 'All Categories' : c}
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
                  { id: 'price-desc', label: 'Price: High to Low' },
                  { id: 'distance', label: 'Distance: Nearest' }
                ].map(s => (
                  <button 
                    key={s.id} 
                    onClick={() => setSortOrder(s.id)} 
                    style={{ width: '100%', textAlign: 'left', padding: '12px 16px', borderRadius: '16px', fontSize: '14px', background: sortOrder === s.id ? 'var(--primary)' : 'rgba(255,255,255,0.05)', color: sortOrder === s.id ? '#000' : 'var(--text-main)', border: sortOrder === s.id ? 'none' : '1px solid var(--surface-border)' }}
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

    </div>
  );
}
