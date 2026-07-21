import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Grid, Star } from 'lucide-react';
import { LoadingDialog } from '../components/LoadingDialog';
import { useFeed } from '../context/FeedContext';
import { getStorageJson } from '../lib/supabase';
import { useSEO } from '../hooks/useSEO';

export default function UserItems() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { items } = useFeed();
  const [ownerName, setOwnerName] = useState('User');
  const [loading, setLoading] = useState(true);

  useSEO(`Items by ${ownerName}`, `View all items available for rent by ${ownerName}`);

  const userItems = items.filter(item => item.userId === id);

  useEffect(() => {
    if (!id) return;
    const fetchName = async () => {
      try {
        const pData = await getStorageJson(`profiles/${id}.json`);
        if (pData?.name) {
          setOwnerName(pData.name);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchName();
  }, [id]);

  if (loading) {
    return <LoadingDialog message="Loading your items..." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-color)', paddingBottom: '32px' }} className="animate-slide-in">
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, display: 'flex', justifyContent: 'center', background: 'var(--surface)', borderBottom: '1px solid var(--surface-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', width: '100%', maxWidth: '1000px' }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ width: '40px', height: '40px', padding: 0, borderRadius: '20px', background: 'var(--surface)', border: '1px solid var(--surface-border)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--card-shadow)', cursor: 'pointer', marginLeft: '-8px' }}
          >
            <ChevronLeft size={20} />
          </button>
          <h1 style={{ fontSize: '18px', margin: 0, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '60%' }}>
            Items by {ownerName}
          </h1>
          <div style={{ width: '40px', height: '40px' }} />
        </div>
      </div>

      <div style={{ padding: '16px', maxWidth: '1000px', width: '100%', margin: '0 auto' }}>
        {userItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 20px', background: 'var(--surface)', borderRadius: '24px', border: '1px solid var(--surface-border)' }}>
            <Grid size={48} color="var(--text-muted)" style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '16px' }}>No items found for this user.</p>
          </div>
        ) : (
          <div className="responsive-grid">
            {userItems.map(item => (
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
                  cursor: 'pointer'
                }}
              >
                <div className="tile-image-container">
                  <img 
                    src={item.images && item.images.length > 0 ? item.images[0] : item.image} 
                    alt={item.title} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} 
                    loading="lazy" 
                  />
                  {item.itemRating != null && (
                    <div style={{ position: 'absolute', top: '12px', left: '12px', background: '#ffffff', color: '#000000', padding: '4px 8px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 800, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 10 }}>
                      <span>{item.itemRating}</span>
                      <Star size={12} fill="var(--success)" color="var(--success)" />
                    </div>
                  )}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', padding: '16px 12px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div style={{ color: 'white', fontWeight: 800, fontSize: '16px' }}>
                      ₹{item.price}<span style={{ fontSize: '11px', fontWeight: 600, opacity: 0.8, marginLeft: '2px' }}>/day</span>
                    </div>
                  </div>
                </div>
                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#000', background: 'var(--primary-glow)', padding: '4px 8px', borderRadius: '12px' }}>{item.category}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
