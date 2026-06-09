import { useState, useEffect } from 'react';
import { Search, MapPin, SlidersHorizontal, RefreshCcw, ChevronRight, Heart, MessageCircle, Building } from 'lucide-react';
import { useFeed } from '../context/FeedContext';
import { CATEGORIES, DEPARTMENTS } from '../lib/constants';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';

export default function Home() {
  const [location, setLocation] = useState('Locating...');
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [filterDept, setFilterDept] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest', 'price-asc', 'price-desc'

  const { items, toggleLike } = useFeed();
  const { getOrCreateConversation } = useChat();
  const navigate = useNavigate();
  
  const fetchLocation = () => {
    setLocation('Fetching Location...');
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
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

  // Filter items based on active category, search, and department
  const filteredItems = items
    .filter(item => {
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = filterDept === 'All' || item.department === filterDept;
      return matchesCategory && matchesSearch && matchesDept;
    })
    .sort((a, b) => {
      if (sortOrder === 'price-asc') return Number(a.price) - Number(b.price);
      if (sortOrder === 'price-desc') return Number(b.price) - Number(a.price);
      return b.id - a.id; // 'newest' (assuming higher ID is newer)
    });

  const handleMessageClick = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    const ownerId = item.userId || `user-${item.id}`; // Mock an owner ID
    const ownerName = `Owner of ${item.title}`;
    const convId = getOrCreateConversation(item.id, item.title, item.image, ownerId, ownerName);
    navigate(`/chat/${convId}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      
      {/* Location Banner */}
      <div style={{ padding: '16px 20px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'var(--primary-glow)', padding: '10px', borderRadius: '14px', display: 'flex' }}>
            <MapPin size={20} color="var(--primary)" />
          </div>
          <div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500, margin: 0 }}>Current Location</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <h2 style={{ fontSize: '16px', margin: 0, color: 'var(--text-main)', fontWeight: 600 }}>{location}</h2>
              {(location === 'Location Unavailable' || location === 'Location Denied') ? (
                <button 
                  onClick={fetchLocation} 
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
            placeholder="Search for anything..."
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
            background: (filterDept !== 'All' || sortOrder !== 'newest') ? 'var(--primary-glow)' : 'var(--surface)',
            color: (filterDept !== 'All' || sortOrder !== 'newest') ? 'var(--primary)' : 'var(--text-main)',
            boxShadow: 'var(--card-shadow)',
            border: (filterDept !== 'All' || sortOrder !== 'newest') ? '1px solid var(--primary)' : 'none',
          }}
        >
          <SlidersHorizontal size={20} />
        </button>
      </div>

      {/* Filter Modal */}
      {showFilters && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', animation: 'fadeIn 0.2s' }}>
          <div className="animate-slide-up" style={{ width: '100%', background: 'var(--bg)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px', paddingBottom: 'calc(24px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Filters</h2>
              <button onClick={() => setShowFilters(false)} style={{ background: 'var(--surface)', padding: '6px 12px', borderRadius: '16px', border: '1px solid var(--surface-border)', color: 'var(--text-main)', fontSize: '13px', fontWeight: 600 }}>Done</button>
            </div>
            
            {/* Department Filter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)' }}>Department</label>
              <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{ padding: '14px 16px', borderRadius: '16px', background: 'var(--surface)', border: '1px solid var(--surface-border)', color: 'var(--text-main)', fontSize: '16px', outline: 'none' }}>
                <option value="All">All Departments</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
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

      {/* Horizontal Categories */}
      <div className="hide-scrollbar" style={{ overflowX: 'auto', padding: '0 20px 16px', display: 'flex', gap: '8px' }}>
        {CATEGORIES.map(cat => (
          <button 
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{ 
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
          filteredItems.map((item, index) => (
            <div 
              key={item.id} 
              onClick={() => navigate(`/item/${item.id}`)}
              className="glass-panel animate-slide-in" 
              style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', animationDelay: `${index * 0.1}s`, cursor: 'pointer' }}
            >
              <img 
                src={item.image} 
                alt={item.title} 
                style={{ width: '100%', height: '160px', borderRadius: '14px', objectFit: 'cover' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h3 style={{ fontSize: '15px', margin: '0 0 4px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '20px' }}>{item.title}</h3>
                <p style={{ fontSize: '16px', color: 'var(--text-main)', fontWeight: 700, margin: '0 0 8px' }}>₹{item.price}/day</p>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', maxWidth: 'calc(100% - 36px)' }}>
                    <Building size={12} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '11px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.department || 'General'}</span>
                  </div>
                  
                  {/* Message Button (Icon Only for grid) */}
                  <button 
                    onClick={(e) => handleMessageClick(e, item)}
                    style={{ 
                      width: '30px',
                      height: '30px',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      padding: 0, 
                      borderRadius: '15px', 
                      background: 'var(--primary-glow)', 
                      color: 'var(--primary)',
                      border: 'none',
                      boxShadow: 'none',
                      flexShrink: 0
                    }}
                  >
                    <MessageCircle size={16} />
                  </button>
                </div>
              </div>
              
              {/* Heart Button */}
              <button 
                onClick={(e) => { e.stopPropagation(); toggleLike(item.id); }}
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
    </div>
  );
}
