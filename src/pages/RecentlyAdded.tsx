import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useFeed } from '../context/FeedContext';
import { useAuth } from '../context/AuthContext';
import { useBookings } from '../context/BookingContext';

export default function RecentlyAdded() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { requests } = useBookings();
  const { items, toggleLike } = useFeed();
  const [displayCount, setDisplayCount] = useState(12);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setDisplayCount(prev => prev + 12);
        }
      },
      { rootMargin: '200px' }
    );
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    return () => observer.disconnect();
  }, []);

  // Filter and sort items exactly as they are on the home page (Recently Added section)
  const filteredItems = items
    .filter(item => {
      if (session?.user?.id && item.userId === session.user.id) return false;
      return true;
    })
    .sort((a, b) => b.id - a.id);

  const displayedItems = filteredItems.slice(0, displayCount);

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '80px', minHeight: '100vh', background: 'var(--bg-color)' }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'var(--surface)', borderBottom: '1px solid var(--surface-border)', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          onClick={() => navigate(-1)}
          style={{ width: '40px', height: '40px', borderRadius: '20px', border: '1px solid var(--surface-border)', background: 'var(--bg-color)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Recently Added</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Explore all the newest items</p>
        </div>
      </div>

      {/* Grid */}
      <div style={{ padding: '24px 16px' }}>
        <div className="responsive-grid">
          {displayedItems.map((item) => (
            <div 
              key={item.id} 
              className="card-hover item-card animate-slide-up"
              style={{ background: 'var(--surface)', borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--surface-border)', display: 'flex', flexDirection: 'column', position: 'relative' }}
              onClick={() => navigate(`/item/${item.id}`)}
            >
              <div className="tile-image-container">
                <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: item.status === 'booked' ? 0.5 : 1 }} />
                
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

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLike(item.id);
                  }}
                  style={{ position: 'absolute', top: '12px', right: '12px', width: '36px', height: '36px', borderRadius: '18px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', zIndex: 10 }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={item.liked ? 'var(--danger)' : 'none'} stroke={item.liked ? 'var(--danger)' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                </button>
              </div>
              
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, lineHeight: 1.3, color: 'var(--text-main)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.title}</h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '12px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', background: 'var(--primary-glow)', color: '#000', padding: '2px 6px', borderRadius: '4px' }}>
                    {item.category}
                  </span>
                </div>
                <div style={{ marginTop: 'auto', paddingTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)' }}>₹{item.price}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/day</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Loading trigger for infinite scroll */}
        {displayedItems.length < filteredItems.length && (
          <div ref={loadMoreRef} style={{ padding: '40px 0', display: 'flex', justifyContent: 'center' }}>
            <div className="loading-spinner" style={{ width: '30px', height: '30px', border: '3px solid var(--surface-border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </div>
        )}
      </div>
    </div>
  );
}
