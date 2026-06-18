import { useState, useEffect } from 'react';
import { useFeed } from '../context/FeedContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Package, CalendarCheck, Check, X } from 'lucide-react';
import { useBookings } from '../context/BookingContext';
import { getStorageJson } from '../lib/supabase';

export default function MyListings() {
  const { items, toggleBookingStatus, deletePost } = useFeed();
  const { session } = useAuth();
  const { requests, updateRequestStatus } = useBookings();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'requests' | 'listings'>('requests');
  const [requesterNames, setRequesterNames] = useState<Record<string, string>>({});

  const myItems = items.filter(item => item.userId === session?.user?.id);
  const myIncomingRequests = requests.filter(r => r.owner_id === session?.user?.id && r.status === 'pending');

  useEffect(() => {
    // If there are no requests, auto-switch to listings tab
    if (myIncomingRequests.length === 0 && activeTab === 'requests') {
      setActiveTab('listings');
    }
  }, [myIncomingRequests.length]);

  useEffect(() => {
    const fetchNames = async () => {
      const names: Record<string, string> = {};
      for (const req of myIncomingRequests) {
        if (!requesterNames[req.requester_id]) {
          try {
            const profile = await getStorageJson(`profiles/${req.requester_id}.json`);
            names[req.requester_id] = profile?.name || 'A user';
          } catch (e) {
            names[req.requester_id] = 'A user';
          }
        }
      }
      if (Object.keys(names).length > 0) {
        setRequesterNames(prev => ({ ...prev, ...names }));
      }
    };
    
    if (myIncomingRequests.length > 0) {
      fetchNames();
    }
  }, [myIncomingRequests]);

  return (
    <div className="animate-slide-in" style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', width: '100%', paddingBottom: '100px' }}>
      
      <div style={{ display: 'flex', background: 'var(--surface)', padding: '4px', borderRadius: '16px', border: '1px solid var(--surface-border)', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('requests')}
          style={{
            flex: 1,
            padding: '10px 0',
            background: activeTab === 'requests' ? 'var(--text-main)' : 'transparent',
            color: activeTab === 'requests' ? 'var(--surface)' : 'var(--text-muted)',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 600,
            boxShadow: activeTab === 'requests' ? 'var(--card-shadow)' : 'none',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          Requests
          {myIncomingRequests.length > 0 && (
            <span style={{ background: activeTab === 'requests' ? 'var(--danger)' : 'var(--danger)', color: 'white', padding: '2px 6px', borderRadius: '8px', fontSize: '11px', fontWeight: 800 }}>
              {myIncomingRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('listings')}
          style={{
            flex: 1,
            padding: '10px 0',
            background: activeTab === 'listings' ? 'var(--text-main)' : 'transparent',
            color: activeTab === 'listings' ? 'var(--surface)' : 'var(--text-muted)',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 600,
            boxShadow: activeTab === 'listings' ? 'var(--card-shadow)' : 'none',
            border: 'none'
          }}
        >
          My Listings
        </button>
      </div>

      {activeTab === 'requests' && (
        <div className="animate-fade-in">
          {myIncomingRequests.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {myIncomingRequests.map(req => {
                const reqItem = items.find(i => i.id === req.item_id);
                const requesterName = requesterNames[req.requester_id] || 'Loading...';
                return (
                  <div key={req.id} className="glass-panel" style={{ padding: '16px', borderRadius: '16px', borderLeft: '4px solid var(--warning)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, paddingRight: '12px' }}>
                        <h4 style={{ margin: '0 0 4px', fontSize: '16px' }}>{reqItem?.title || 'Unknown Item'}</h4>
                        <p style={{ margin: '0 0 8px', fontSize: '14px', color: 'var(--text-muted)' }}>
                          Requested by <strong 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/user/${req.requester_id}`);
                            }}
                            style={{ color: 'var(--text-main)', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '4px' }}
                          >
                            {requesterName}
                          </strong>
                        </p>
                        <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '8px', marginBottom: '8px' }}>
                          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                            {req.start_date} &rarr; {req.end_date}
                          </p>
                        </div>
                        <p style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--primary)' }}>
                          Total: ₹{req.total_price}
                        </p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button onClick={() => updateRequestStatus(req.id, 'accepted')} style={{ width: '48px', height: '48px', borderRadius: '24px', border: 'none', background: 'rgba(34, 197, 94, 0.15)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                          <Check size={26} strokeWidth={2.5} />
                        </button>
                        <button onClick={() => updateRequestStatus(req.id, 'rejected')} style={{ width: '48px', height: '48px', borderRadius: '24px', border: 'none', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                          <X size={26} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', color: 'var(--text-muted)', textAlign: 'center' }}>
              <CalendarCheck size={64} opacity={0.5} style={{ marginBottom: '16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 8px', color: 'var(--text-main)' }}>No Pending Requests</h3>
              <p style={{ margin: 0 }}>You don't have any incoming booking requests right now.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'listings' && (
        <div className="animate-fade-in">
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
      )}
    </div>
  );
}
