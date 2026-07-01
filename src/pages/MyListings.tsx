import { useFeed } from '../context/FeedContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Package, Plus, Edit2, Trash2 } from 'lucide-react';

export default function MyListings() {
  const { items, deletePost } = useFeed();
  const { session } = useAuth();
  const navigate = useNavigate();

  const myItems = items.filter(item => item.userId === session?.user?.id);

  return (
    <div className="animate-slide-in" style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', width: '100%', paddingBottom: '100px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '24px', color: 'var(--text-main)' }}>My Listings</h2>
      
      <div className="animate-fade-in">
        {myItems.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {myItems.map(item => (
              <div key={item.id} onClick={() => navigate(`/item/${item.id}`)} className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', cursor: 'pointer', borderRadius: '20px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <img src={item.image} alt={item.title} style={{ width: '96px', height: '96px', borderRadius: '16px', objectFit: 'cover', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>{item.title}</h3>
                    <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary)' }}>₹{item.price}<span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/day</span></span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid var(--surface-border)', paddingTop: '16px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/edit/${item.id}`);
                    }}
                    style={{ flex: 1, padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, border: 'none', background: 'var(--surface-border)', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <Edit2 size={16} /> Edit
                  </button>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (window.confirm('Are you sure you want to delete this listing?')) {
                        await deletePost(item.id);
                      }
                    }}
                    style={{ flex: 1, padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, border: 'none', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', color: 'var(--text-muted)', textAlign: 'center' }}>
            <Package size={64} opacity={0.5} style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 8px', color: 'var(--text-main)' }}>No listings yet</h3>
            <p style={{ margin: 0 }}>You haven't posted any items for rent.</p>
          </div>
        )}
      </div>

      {/* Floating Action Button for Posting */}
      <button 
        onClick={() => navigate('/post')}
        className="animate-slide-up"
        style={{
          position: 'fixed',
          bottom: '100px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '28px',
          background: 'var(--primary)',
          color: '#fff',
          border: 'none',
          boxShadow: 'var(--primary-glow)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 100
        }}
      >
        <Plus size={32} />
      </button>

    </div>
  );
}
