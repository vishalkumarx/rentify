import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Grid } from 'lucide-react';
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

  const userItems = items.filter(item => item.owner_id === id);

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
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading items...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-color)', paddingBottom: '32px' }} className="animate-slide-in">
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, display: 'flex', justifyContent: 'center', background: 'var(--surface)', borderBottom: '1px solid var(--surface-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', width: '100%', maxWidth: '800px' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '20px', marginLeft: '-8px' }}>
            <ChevronLeft size={28} />
          </button>
          <h1 style={{ flex: 1, textAlign: 'center', margin: 0, fontSize: '18px', fontWeight: 700, marginRight: '32px' }}>
            Items by {ownerName}
          </h1>
        </div>
      </div>

      <div style={{ padding: '24px', maxWidth: '800px', width: '100%', margin: '0 auto' }}>
        {userItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 20px', background: 'var(--surface)', borderRadius: '24px', border: '1px solid var(--surface-border)' }}>
            <Grid size={48} color="var(--text-muted)" style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '16px' }}>No items found for this user.</p>
          </div>
        ) : (
          <div className="product-grid">
            {userItems.map(item => (
              <div 
                key={item.id} 
                onClick={() => navigate(`/item/${item.id}`)}
                className="product-card"
              >
                <div className="product-image-container">
                  <img src={item.images[0]} alt={item.title} className="product-image" loading="lazy" />
                  <div className="product-price">
                    ₹{item.price}<span className="price-unit">/day</span>
                  </div>
                </div>
                <div className="product-info">
                  <h3 className="product-title">{item.title}</h3>
                  <div className="product-meta">
                    <span className="product-category">{item.category}</span>
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
