import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Building2, Heart, Search, X, Star } from 'lucide-react';
import { useFeed } from '../context/FeedContext';
import { useAuth } from '../context/AuthContext';
import { useBookings } from '../context/BookingContext';
import { useSEO } from '../hooks/useSEO';
import { DEPARTMENTS } from '../lib/constants';

export default function CategoryItems() {
  const { categoryId } = useParams();
  useSEO(categoryId ? `Category: ${categoryId}` : 'Category Items', `Browse the best items in ${categoryId} on CampusRent`);
  const navigate = useNavigate();
  const { items, toggleLike } = useFeed();
  const { session } = useAuth();
  const { requests } = useBookings();
  
  const decodedCategory = decodeURIComponent(categoryId || '');

  const [searchQuery, setSearchQuery] = useState('');

  // Filter items by category and search query
  const categoryItems = items.filter(item => {
    const itemCat = item.category?.toLowerCase() || '';
    const paramCat = decodedCategory.toLowerCase();
    
    let matchesCategory = false;
    if (paramCat.includes('books') && itemCat.includes('books')) matchesCategory = true;
    else if (paramCat.includes('cloth') && itemCat.includes('cloth')) matchesCategory = true;
    else if (paramCat.includes('tool') && itemCat.includes('tool')) matchesCategory = true;
    else matchesCategory = itemCat === paramCat;

    if (!matchesCategory) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!item.title?.toLowerCase().includes(q) && !item.description?.toLowerCase().includes(q)) {
        return false;
      }
    }
    
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      <header style={{ height: '60px', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--surface-border)', background: 'var(--surface)', flexShrink: 0, zIndex: 10 }}>
        <button onClick={() => navigate(-1)} style={{ width: '40px', height: '40px', padding: 0, borderRadius: '20px', background: 'var(--surface)', border: '1px solid var(--surface-border)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
          <ChevronLeft size={20} />
        </button>
        <h1 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>{decodedCategory}</h1>
      </header>

      <div style={{ padding: '24px 16px 100px 16px', flex: 1, overflowY: 'auto' }}>
        <div style={{ position: 'relative', width: '50%', minWidth: '280px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '16px', padding: '12px 16px', gap: '12px', transition: 'all 0.2s' }}>
              <Search size={20} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              <input 
                type="text" 
                placeholder={`Search in ${decodedCategory}...`} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: 0, border: 'none', background: 'transparent', boxShadow: 'none', width: '100%', outline: 'none', color: 'var(--text-main)', fontSize: '16px' }}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  style={{ padding: 0, background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', width: 'auto', flexShrink: 0 }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {categoryItems.length === 0 ? (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center', minHeight: '50vh' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '40px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '40px' }}>🌱</span>
            </div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>Our community is growing!</h3>
            <p style={{ margin: 0, fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Be the first to list an item in <strong>{decodedCategory}</strong> and help out your fellow students.
            </p>
            <button 
              onClick={() => navigate('/post')}
              style={{ marginTop: '32px', background: 'var(--text-main)', color: 'white', padding: '10px 20px', width: 'fit-content', borderRadius: '20px', fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
            >
              List an Item
            </button>
          </div>
        ) : (
          <div className="responsive-grid">
            {categoryItems.map((item, index) => {
              const isFeatured = item.itemRating && item.itemRating >= 4.8;
              
              return (
                <div 
                  key={item.id} 
                  onClick={() => navigate(`/item/${item.id}`)}
                  className="glass-panel animate-slide-up hover-scale"
                  style={{ 
                    borderRadius: '0', 
                    overflow: 'hidden', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    position: 'relative',
                    animationDelay: `${index * 0.05}s`, 
                    cursor: 'pointer',
                    boxShadow: isFeatured ? '0 8px 30px rgba(34, 197, 94, 0.15)' : 'none'
                  }}
                >
                  <div className="tile-image-container">
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
                      const acceptedReq = requests.find(r => r.item_id === item.id && r.status === 'accepted');
                      
                      return (
                        <>
                          {item.status === 'booked' && (
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
                              <div style={{ background: 'rgba(255,255,255,0.9)', color: 'var(--text-main)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, border: '1px solid var(--surface-border)', marginBottom: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                UNAVAILABLE
                              </div>
                              <div style={{ fontSize: '10px', fontWeight: 700, color: '#333', background: 'rgba(255,255,255,0.8)', padding: '2px 8px', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                                {acceptedReq?.end_date ? `Available after ${new Date(acceptedReq.end_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}` : 'Available soon'}
                              </div>
                            </div>
                          )}
                          {userAcceptedReq && (
                            <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'var(--success)', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: 800, letterSpacing: '0.5px', zIndex: 6 }}>
                              RENTED BY YOU
                            </div>
                          )}
                        </>
                      );
                    })()}

                    {item.itemRating != null && (
                      <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: '#ffffff', color: '#000000', padding: '4px 8px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 800, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 10 }}>
                        <span>{item.itemRating}</span>
                        <Star size={12} fill="var(--success)" color="var(--success)" />
                      </div>
                    )}

                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        if (!session) navigate('/login'); else toggleLike(item.id); 
                      }}
                      style={{ position: 'absolute', bottom: '12px', right: '12px', width: '32px', height: '32px', padding: 0, borderRadius: '16px', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(4px)', border: '1px solid rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.liked ? 'var(--danger)' : 'var(--text-muted)' }}
                    >
                      <Heart size={16} fill={item.liked ? 'var(--danger)' : 'none'} />
                    </button>
                  </div>

                  {/* Text Container Below Image */}
                  <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                      <span style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', background: 'var(--surface-border)', color: 'var(--text-muted)', padding: '2px 6px', borderRadius: '4px', marginBottom: '2px', textAlign: 'center', display: 'inline-block', alignSelf: 'flex-start' }}>
                        {item.category}
                      </span>
                      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', width: '100%' }}>{item.title}</h3>
                      <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--success)' }}>
                        ₹{item.price}<span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)' }}>/day</span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500, minWidth: 0, flex: 1 }}>
                        <Building2 size={14} style={{ flexShrink: 0 }} />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.department?.startsWith('lat:') ? DEPARTMENTS[(item.id % (DEPARTMENTS.length - 1)) + 1] : item.department}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
