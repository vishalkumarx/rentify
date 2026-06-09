import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFeed } from '../context/FeedContext';
import { useChat } from '../context/ChatContext';
import { ChevronLeft, MessageCircle, Heart, Building, Tag, Star, ShieldCheck, CheckCircle2, X } from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { items, toggleLike } = useFeed();
  const { getOrCreateConversation } = useChat();
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const item = items.find(i => i.id === Number(id));

  if (!item) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <h2>Item not found</h2>
        <button onClick={() => navigate(-1)} style={{ width: 'auto', padding: '12px 24px' }}>Go Back</button>
      </div>
    );
  }

  const handleMessageClick = () => {
    const ownerId = item.userId || `user-${item.id}`;
    const ownerName = `Owner of ${item.title}`;
    const convId = getOrCreateConversation(item.id, item.title, item.image, ownerId, ownerName);
    navigate(`/chat/${convId}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg-color)' }} className="animate-slide-in">
      
      {/* Header */}
      <header style={{ 
        height: '60px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '0 20px', 
        background: 'var(--surface)', 
        borderBottom: '1px solid var(--surface-border)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{ width: '40px', height: '40px', padding: 0, borderRadius: '20px', background: 'var(--surface)', border: '1px solid var(--surface-border)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--card-shadow)' }}
        >
          <ChevronLeft size={20} />
        </button>
        <h1 style={{ fontSize: '18px', margin: 0, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
          {item.title}
        </h1>
        <button 
          onClick={() => toggleLike(item.id)} 
          style={{ width: '40px', height: '40px', padding: 0, borderRadius: '20px', background: 'var(--surface)', border: '1px solid var(--surface-border)', color: item.liked ? 'var(--danger)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--card-shadow)' }}
        >
          <Heart size={20} fill={item.liked ? 'var(--danger)' : 'none'} />
        </button>
      </header>

      {/* Content */}
      <main style={{ flex: 1, overflowY: 'auto', paddingBottom: '100px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          
          {/* Main Image */}
          <div 
            onClick={() => setZoomImage(item.image)}
            style={{ width: '100%', aspectRatio: '4/3', position: 'relative', cursor: 'pointer' }}
          >
            <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', bottom: '16px', left: '16px', background: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: '16px', color: 'white', fontWeight: 700, backdropFilter: 'blur(8px)' }}>
              1 / {item.images ? item.images.length + 1 : 1}
            </div>
            <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: '16px', color: 'white', fontWeight: 600, backdropFilter: 'blur(8px)', fontSize: '12px' }}>
              Tap to Zoom
            </div>
          </div>

          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <h1 style={{ fontSize: '26px', margin: 0, fontWeight: 700, lineHeight: 1.2 }}>{item.title}</h1>
              <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)' }}>₹{item.price}<span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>/day</span></span>
            </div>
            
            {/* Item Rating */}
            {item.itemRating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
                <Star size={18} fill="var(--warning)" color="var(--warning)" />
                <span style={{ fontWeight: 700, fontSize: '15px' }}>{item.itemRating}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>({item.itemReviewCount} reviews)</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'var(--primary-glow)', color: 'var(--primary)', borderRadius: '16px', fontSize: '13px', fontWeight: 600 }}>
                <Tag size={14} /> {item.category}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'var(--surface)', border: '1px solid var(--surface-border)', color: 'var(--text-main)', borderRadius: '16px', fontSize: '13px', fontWeight: 600 }}>
                <Building size={14} /> {item.department}
              </span>
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>Description</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: 1.6, margin: 0 }}>
              {item.description || "No description provided for this item. It's currently available for rent in good condition! Reach out to the owner for more details."}
            </p>

            {/* Other Images */}
            {item.images && item.images.length > 0 && (
              <div style={{ marginTop: '32px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>More Photos</h3>
                <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }} className="hide-scrollbar">
                  {item.images.map((img, idx) => (
                    <img 
                      key={idx} 
                      onClick={() => setZoomImage(img)}
                      src={img} 
                      alt={`Pic ${idx+2}`} 
                      style={{ width: '120px', height: '120px', borderRadius: '16px', objectFit: 'cover', flexShrink: 0, cursor: 'pointer' }} 
                    />
                  ))}
                </div>
              </div>
            )}
            {/* Seller Trust Profile */}
            {item.seller && (
              <div className="glass-panel" style={{ marginTop: '32px', padding: '20px', borderRadius: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px' }}>Meet the Owner</h3>
                
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '30px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 700, color: 'var(--primary)' }}>
                    {item.seller.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>{item.seller.name}</h4>
                      <ShieldCheck size={18} color="var(--success)" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                      <Star size={14} fill="var(--warning)" color="var(--warning)" />
                      <span style={{ fontSize: '14px', fontWeight: 600 }}>{item.seller.rating}</span>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>({item.seller.reviewCount} reviews)</span>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginLeft: '4px' }}>• Joined {item.seller.memberSince}</span>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {item.seller.verifications.map((ver, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', fontSize: '14px', fontWeight: 500 }}>
                      <CheckCircle2 size={16} />
                      {ver}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Image Zoom Modal */}
      {zoomImage && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.95)', zIndex: 100,
          display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ padding: '20px', display: 'flex', justifyContent: 'flex-end', zIndex: 101 }}>
            <button 
              onClick={() => setZoomImage(null)}
              style={{ width: '40px', height: '40px', borderRadius: '20px', background: 'var(--surface)', color: 'var(--text-main)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={24} />
            </button>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <TransformWrapper initialScale={1} minScale={0.5} maxScale={4} centerOnInit>
              <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
                <img src={zoomImage} alt="Zoomed" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
              </TransformComponent>
            </TransformWrapper>
          </div>
          <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
            Pinch or double tap to zoom. Drag to pan.
          </div>
        </div>
      )}

      {/* Sticky Bottom Action */}
      <div style={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        padding: '20px', 
        paddingBottom: 'calc(20px + env(safe-area-inset-bottom))',
        background: 'var(--surface)', 
        borderTop: '1px solid var(--surface-border)', 
        backdropFilter: 'blur(12px)',
        zIndex: 50,
        display: 'flex',
        justifyContent: 'center'
      }}>
        <div style={{ maxWidth: '800px', width: '100%' }}>
          <button onClick={handleMessageClick} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '18px', fontSize: '18px', borderRadius: '24px' }}>
            <MessageCircle size={22} />
            Message Owner
          </button>
        </div>
      </div>

    </div>
  );
}
