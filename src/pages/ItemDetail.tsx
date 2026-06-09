import { useParams, useNavigate } from 'react-router-dom';
import { useFeed } from '../context/FeedContext';
import { useChat } from '../context/ChatContext';
import { ChevronLeft, MessageCircle, Heart, Building, Tag } from 'lucide-react';

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { items, toggleLike } = useFeed();
  const { getOrCreateConversation } = useChat();

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
          <div style={{ width: '100%', aspectRatio: '4/3', position: 'relative' }}>
            <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', bottom: '16px', left: '16px', background: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: '16px', color: 'white', fontWeight: 700, backdropFilter: 'blur(8px)' }}>
              1 / {item.images ? item.images.length + 1 : 1}
            </div>
          </div>

          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <h1 style={{ fontSize: '26px', margin: 0, fontWeight: 700, lineHeight: 1.2 }}>{item.title}</h1>
              <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)' }}>₹{item.price}<span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>/day</span></span>
            </div>

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
                    <img key={idx} src={img} alt={`Pic ${idx+2}`} style={{ width: '120px', height: '120px', borderRadius: '16px', objectFit: 'cover', flexShrink: 0 }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

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
