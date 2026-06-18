import { useState, useEffect } from 'react';
import { Search, MapPin, SlidersHorizontal, RefreshCcw, ChevronRight, Heart, LayoutGrid, Laptop, Book, Bike, Bed, PartyPopper, Wrench, Shirt, Dumbbell, Camera, Gamepad2, Music, MoreHorizontal, MessageCircle } from 'lucide-react';
import { useFeed } from '../context/FeedContext';
import { CATEGORIES } from '../lib/constants';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBookings } from '../context/BookingContext';
import { useChat } from '../context/ChatContext';
import { getStorageJson } from '../lib/supabase';
import banner1 from '../assets/banners/banner1.png';
import banner2 from '../assets/banners/banner2.png';
import banner3 from '../assets/banners/banner3.png';

export default function Home() {
  const [location, setLocation] = useState('Locating...');
  const [userCoords, setUserCoords] = useState<{lat: number, lng: number} | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const { session } = useAuth();
  const { requests } = useBookings();
  const { getOrCreateConversation } = useChat();
  const banners = [banner1, banner2, banner3];
  
  const categoryIcons: Record<string, React.ReactNode> = {
    'All': <LayoutGrid size={18} />,
    'Electronics': <Laptop size={18} />,
    'Textbooks': <Book size={18} />,
    'Mobility': <Bike size={18} />,
    'Dorm Essentials': <Bed size={18} />,
    'Party Supplies': <PartyPopper size={18} />,
    'Tools & Hardware': <Wrench size={18} />,
    'Clothing & Formalwear': <Shirt size={18} />,
    'Sports Gear': <Dumbbell size={18} />,
    'Photography': <Camera size={18} />,
    'Gaming': <Gamepad2 size={18} />,
    'Music Instruments': <Music size={18} />,
    'Others': <MoreHorizontal size={18} />
  };
  
  // Auto-scroll Carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [banners.length]);

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

  const { items, toggleLike } = useFeed();
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
    <div className="home-layout">
      {/* Desktop Sidebar Categories */}
      <div className="desktop-categories hide-scrollbar">
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', paddingLeft: '8px' }}>Categories</h3>
        {CATEGORIES.map(cat => (
          <button 
            key={`desktop-${cat}`}
            onClick={() => setActiveCategory(cat)}
            style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%', 
              padding: '12px 16px', 
              borderRadius: '16px', 
              fontSize: '15px',
              fontWeight: activeCategory === cat ? 700 : 500,
              boxShadow: 'none',
              background: activeCategory === cat ? 'var(--primary-glow)' : 'transparent',
              border: 'none',
              color: activeCategory === cat ? 'var(--primary)' : 'var(--text-main)',
              textAlign: 'left',
              transition: 'all 0.2s ease'
            }}
          >
            {categoryIcons[cat]}
            {cat}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="home-main-content">
      
      {/* Location Banner */}
      <div style={{ padding: '16px 20px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'var(--primary-glow)', padding: '10px', borderRadius: '14px', display: 'flex' }}>
            <MapPin size={20} color="var(--primary)" />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500, margin: 0 }}>Current Location</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', maxWidth: '100%' }}>
              <h2 style={{ fontSize: '16px', margin: 0, color: 'var(--text-main)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{location}</h2>
              {(location === 'Location Unavailable' || location === 'Location Denied') ? (
                <button 
                  onClick={() => {
                    if (location === 'Location Denied') {
                      alert('Please enable location permissions in your browser settings to continue.');
                    }
                    fetchLocation();
                  }} 
                  style={{ marginLeft: '6px', padding: '4px', background: 'transparent', border: 'none', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', boxShadow: 'none' }}
                >
                  <RefreshCcw size={14} /> Retry
                </button>
              ) : (
                <ChevronRight size={16} color="var(--text-muted)" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Search Bar */}
      <div style={{ padding: '8px 20px 16px', display: 'flex', gap: '12px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', top: '16px', left: '16px' }} />
          <input
            type="text"
            placeholder={placeholderText || "Search..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              paddingLeft: '44px', 
              borderRadius: '24px', 
              background: 'var(--surface)', 
              boxShadow: 'var(--card-shadow)',
              border: '1px solid var(--surface-border)'
            }}
          />
        </div>
        <button 
          onClick={() => setShowFilters(true)}
          style={{ 
            width: '50px', 
            height: '50px', 
            padding: 0, 
            borderRadius: '25px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            background: sortOrder !== 'newest' ? 'var(--primary-glow)' : 'var(--surface)',
            color: sortOrder !== 'newest' ? 'var(--primary)' : 'var(--text-main)',
            boxShadow: 'var(--card-shadow)',
            border: sortOrder !== 'newest' ? '1px solid var(--primary)' : 'none',
          }}
        >
          <SlidersHorizontal size={20} />
        </button>
      </div>

      {/* Carousel Banner */}
      <div style={{ width: '100%', padding: '0 0 16px 0', overflow: 'hidden', position: 'relative' }}>
        <div style={{ 
          display: 'flex', 
          transition: 'transform 0.5s ease-in-out', 
          transform: `translateX(-${carouselIndex * 100}%)`
        }}>
          {banners.map((src, i) => (
            <img 
              key={i} 
              src={src} 
              alt={`Banner ${i+1}`} 
              style={{ width: '100%', height: 'auto', flexShrink: 0, display: 'block' }} 
            />
          ))}
        </div>
        
        {/* Carousel Indicators */}
        <div style={{ position: 'absolute', bottom: '24px', left: '0', right: '0', display: 'flex', justifyContent: 'center', gap: '6px' }}>
          {banners.map((_, i) => (
            <div 
              key={i}
              onClick={() => setCarouselIndex(i)}
              style={{ 
                width: carouselIndex === i ? '20px' : '6px', 
                height: '6px', 
                borderRadius: '3px', 
                background: carouselIndex === i ? 'var(--primary)' : 'rgba(255,255,255,0.6)', 
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>
      </div>

      {/* Filter Modal */}
      {showFilters && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', animation: 'fadeIn 0.2s' }}>
          <div className="animate-slide-up" style={{ width: '100%', background: 'var(--bg)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px', paddingBottom: 'calc(24px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Filters</h2>
            </div>
            
            {/* Category Filter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)' }}>Category</label>
              <select value={activeCategory} onChange={e => setActiveCategory(e.target.value)} style={{ padding: '14px 16px', borderRadius: '16px', background: 'var(--surface)', border: '1px solid var(--surface-border)', color: 'var(--text-main)', fontSize: '16px', outline: 'none' }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
              </select>
            </div>
            

            {/* Sort Order */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)' }}>Sort By</label>
              <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} style={{ padding: '14px 16px', borderRadius: '16px', background: 'var(--surface)', border: '1px solid var(--surface-border)', color: 'var(--text-main)', fontSize: '16px', outline: 'none' }}>
                <option value="newest">Newest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>

            <button onClick={() => setShowFilters(false)} style={{ marginTop: '8px', padding: '16px', borderRadius: '24px', background: 'var(--primary)', color: 'var(--text-main)', border: 'none', fontWeight: 600, fontSize: '16px' }}>Apply Filters</button>
          </div>
        </div>
      )}

      {/* Horizontal Categories (Mobile Only) */}
      <div className="mobile-categories hide-scrollbar">
        {CATEGORIES.map(cat => (
          <button 
            key={`mobile-${cat}`}
            onClick={() => setActiveCategory(cat)}
            style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              width: 'auto', 
              padding: '8px 16px', 
              borderRadius: '20px', 
              fontSize: '14px',
              whiteSpace: 'nowrap',
              boxShadow: 'none',
              background: activeCategory === cat ? 'var(--primary)' : 'var(--surface)',
              border: activeCategory === cat ? '1px solid var(--primary)' : '1px solid var(--surface-border)',
              color: activeCategory === cat ? '#fff' : 'var(--text-main)'
            }}
          >
            {categoryIcons[cat]}
            {cat}
          </button>
        ))}
      </div>

      {/* Feed Content */}
      <div style={{ 
        padding: '0 20px 32px', 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
        gap: '20px' 
      }}>
        {filteredItems.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <p>No items found for this category or search.</p>
          </div>
        ) : (
          filteredItems.slice(0, displayCount).map((item, index) => (
            <div 
              key={item.id} 
              onClick={() => navigate(`/item/${item.id}`)}
              className="glass-panel animate-slide-in" 
              style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', animationDelay: `${index * 0.1}s`, cursor: 'pointer' }}
            >
              <div style={{ position: 'relative' }}>
                <img 
                  src={item.image} 
                  alt={item.title} 
                  style={{ width: '100%', height: '160px', borderRadius: '14px', objectFit: 'cover', opacity: item.status === 'booked' ? 0.7 : 1 }}
                />
                
                {(() => {
                  const userAcceptedReq = session ? requests.find(r => r.item_id === item.id && r.requester_id === session.user.id && r.status === 'accepted') : null;
                  
                  if (userAcceptedReq) {
                    return (
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(34, 197, 94, 0.2)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', zIndex: 10, borderRadius: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '16px', textAlign: 'center' }}>
                        <div style={{ background: 'var(--success)', padding: '8px 16px', borderRadius: '20px', color: 'white', fontWeight: 800, fontSize: '13px', letterSpacing: '0.5px', boxShadow: 'var(--card-shadow)', border: 'none' }}>
                          RENTED BY ME
                        </div>
                        <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            let ownerName = 'Owner';
                            try {
                              const profile = await getStorageJson(`profiles/${item.userId}.json`);
                              if (profile) ownerName = profile.name;
                            } catch (e) {}
                            const convId = getOrCreateConversation(item.id, item.title, item.image, item.userId || '', ownerName);
                            navigate(`/chat/${convId}`);
                          }}
                          style={{ padding: '8px 20px', background: 'var(--surface)', color: 'var(--text-main)', border: '1px solid var(--surface-border)', borderRadius: '16px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: 'var(--card-shadow)', width: 'auto' }}
                        >
                          <MessageCircle size={16} />
                          Message Owner
                        </button>
                      </div>
                    );
                  }
                  
                  const isBookedByOther = item.status === 'booked';
                  if (isBookedByOther) {
                    return (
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', zIndex: 10, borderRadius: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '16px', textAlign: 'center' }}>
                        <div style={{ background: 'var(--surface)', padding: '8px 16px', borderRadius: '20px', color: 'var(--text-main)', fontWeight: 800, fontSize: '13px', letterSpacing: '0.5px', boxShadow: 'var(--card-shadow)', border: '1px solid var(--surface-border)' }}>
                          ITEM NOT AVAILABLE
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            alert('Notify functionality coming soon!');
                          }}
                          style={{ padding: '8px 20px', background: 'var(--primary)', color: '#000', border: 'none', borderRadius: '16px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', boxShadow: 'var(--card-shadow)' }}
                        >
                          Notify Me
                        </button>
                      </div>
                    );
                  }
                  
                  return null;
                })()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h3 style={{ fontSize: '15px', margin: '0 0 4px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '20px' }}>{item.title}</h3>
                <p style={{ fontSize: '16px', color: 'var(--text-main)', fontWeight: 700, margin: '0 0 8px' }}>₹{item.price}/day</p>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--surface)', padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--surface-border)', maxWidth: '100%', minWidth: 0 }}>
                    <MapPin size={12} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '11px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {userCoords && item.location 
                        ? `${getDistance(userCoords.lat, userCoords.lng, item.location.lat, item.location.lng)?.toFixed(1)} km away` 
                        : (item.location?.address || 'General')}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Heart Button */}
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  if (!session) {
                    navigate('/login');
                  } else {
                    toggleLike(item.id); 
                  }
                }}
                style={{ 
                  position: 'absolute', 
                  top: '8px', 
                  right: '8px', 
                  width: '32px', 
                  height: '32px', 
                  padding: 0,
                  borderRadius: '16px',
                  background: 'var(--surface)',
                  border: '1px solid var(--surface-border)',
                  boxShadow: 'var(--card-shadow)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: item.liked ? 'var(--danger)' : 'var(--text-muted)'
                }}
              >
                <Heart size={16} fill={item.liked ? 'var(--danger)' : 'none'} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Load More Button */}
      {filteredItems.length > displayCount && (
        <div style={{ padding: '0 20px 40px', display: 'flex', justifyContent: 'center' }}>
          <button 
            onClick={() => setDisplayCount(prev => prev + 10)}
            style={{ padding: '14px 32px', background: 'var(--text-main)', color: 'var(--surface)', borderRadius: '24px', fontWeight: 600, fontSize: '15px', border: 'none', boxShadow: 'none', cursor: 'pointer' }}
          >
            Load More Items
          </button>
        </div>
      )}
      
      </div> {/* End Main Content Area */}

    </div>
  );
}
