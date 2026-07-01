
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Building2, Heart } from 'lucide-react';
import { useFeed } from '../context/FeedContext';
import { useAuth } from '../context/AuthContext';
import { useBookings } from '../context/BookingContext';
import { DEPARTMENTS } from '../lib/constants';

export default function CategoryItems() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { items, toggleLike } = useFeed();
  const { session } = useAuth();
  const { requests } = useBookings();
  
  const decodedCategory = decodeURIComponent(categoryId || '');

  // Filter items. Simple fuzzy match for 'Books & Stationary' vs 'Books and Stationary'
  const categoryItems = items.filter(item => {
    const itemCat = item.category?.toLowerCase() || '';
    const paramCat = decodedCategory.toLowerCase();
    if (paramCat.includes('books') && itemCat.includes('books')) return true;
    if (paramCat.includes('cloth') && itemCat.includes('cloth')) return true;
    if (paramCat.includes('tool') && itemCat.includes('tool')) return true;
    return itemCat === paramCat;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      <header style={{ padding: '16px', display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--surface-border)', background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', padding: '8px', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={24} />
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 0 8px', color: 'var(--text-main)' }}>{decodedCategory}</h1>
      </header>

      <div style={{ padding: '24px 16px', flex: 1, overflowY: 'auto' }}>
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
              style={{ marginTop: '32px', background: 'var(--text-main)', color: 'white', padding: '16px 32px', borderRadius: '24px', fontSize: '16px', fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
            >
              List an Item
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {categoryItems.map((item, index) => {
              const isFeatured = item.itemRating && item.itemRating >= 4.8;
              
              return (
                <div 
                  key={item.id} 
                  onClick={() => navigate(`/item/${item.id}`)}
                  className="glass-panel animate-slide-up hover-scale"
                  style={{ 
                    borderRadius: '24px', 
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
                        ₹{item.price}<span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>/day</span>
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
            })}
          </div>
        )}
      </div>
    </div>
  );
}
