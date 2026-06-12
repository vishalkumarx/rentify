import { useFeed } from '../context/FeedContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Package } from 'lucide-react';

export default function MyListings() {
  const { items, toggleBookingStatus, deletePost } = useFeed();
  const { session } = useAuth();
  const navigate = useNavigate();

  const myItems = items.filter(item => item.userId === session?.user?.id);

  return (
    <div className="animate-slide-in" style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', width: '100%', paddingBottom: '100px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '24px' }}>My Listings</h2>
      {myItems.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {myItems.map(item => (
            <div key={item.id} onClick={() => navigate(`/item/${item.id}`)} className="glass-panel" style={{ padding: '16px', display: 'flex', gap: '16px', cursor: 'pointer' }}>
              <img src={item.image} alt={item.title} style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover' }} />
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
                <h4 style={{ margin: '0 0 4px', fontSize: '16px', color: 'var(--text-main)' }}>{item.title}</h4>
                <p style={{ margin: 0, color: 'var(--text-main)', fontWeight: 700 }}>₹{item.price}/day</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleBookingStatus(item.id);
                  }}
                  style={{ 
                    padding: '8px 16px', 
                    borderRadius: '8px', 
                    fontSize: '13px', 
                    fontWeight: 600,
                    border: 'none',
                    background: item.status === 'booked' ? 'var(--surface-border)' : '#000000',
                    color: item.status === 'booked' ? 'var(--text-muted)' : '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  {item.status === 'booked' ? 'Mark Available' : 'Mark Booked'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/edit/${item.id}`);
                  }}
                  style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, border: '1px solid var(--surface-border)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer' }}
                >
                  Edit
                </button>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (window.confirm('Are you sure you want to delete this listing?')) {
                      await deletePost(item.id);
                    }
                  }}
                  style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, border: 'none', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', cursor: 'pointer' }}
                >
                  Delete
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
  );
}
