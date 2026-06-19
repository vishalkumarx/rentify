import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFeed } from '../context/FeedContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CalendarCheck, Check, X, MessageCircle } from 'lucide-react';
import { useBookings } from '../context/BookingContext';
import { useChat } from '../context/ChatContext';
import { getStorageJson } from '../lib/supabase';
import { format, parseISO } from 'date-fns';

export default function Requests() {
  const { items } = useFeed();
  const { session } = useAuth();
  const { requests, updateRequestStatus } = useBookings();
  const { getOrCreateConversation } = useChat();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [incomingFilter, setIncomingFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [requesterNames, setRequesterNames] = useState<Record<string, string>>({});
  const [confirmAction, setConfirmAction] = useState<{ id: number; action: 'accepted' | 'rejected'; originalPrice?: number } | null>(null);
  const [customPrice, setCustomPrice] = useState('');

  // Incoming Requests: Requests sent TO me (I am the owner)
  const myIncomingRequests = requests.filter(r => r.owner_id === session?.user?.id && r.status === 'pending');
  const myAcceptedRequests = requests.filter(r => r.owner_id === session?.user?.id && r.status === 'accepted');
  const myRejectedRequests = requests.filter(r => r.owner_id === session?.user?.id && r.status === 'rejected');

  // Outgoing Requests: Requests I sent TO others
  const myOutgoingRequests = requests.filter(r => r.requester_id === session?.user?.id);

  useEffect(() => {
    const fetchNames = async () => {
      const names: Record<string, string> = {};
      const allIncoming = [...myIncomingRequests, ...myAcceptedRequests, ...myRejectedRequests];
      
      for (const req of allIncoming) {
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
    
    fetchNames();
  }, [requests]);

  return (
    <>
    <div className="animate-slide-in" style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', width: '100%', paddingBottom: '100px' }}>
      
      <div style={{ display: 'flex', background: 'var(--surface)', padding: '4px', borderRadius: '16px', border: '1px solid var(--surface-border)', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('incoming')}
          style={{
            flex: 1,
            padding: '10px 0',
            background: activeTab === 'incoming' ? 'var(--text-main)' : 'transparent',
            color: activeTab === 'incoming' ? 'var(--surface)' : 'var(--text-muted)',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 600,
            boxShadow: activeTab === 'incoming' ? 'var(--card-shadow)' : 'none',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          Incoming Requests
          {myIncomingRequests.length > 0 && (
            <span style={{ background: activeTab === 'incoming' ? 'var(--danger)' : 'var(--danger)', color: 'white', padding: '2px 6px', borderRadius: '8px', fontSize: '11px', fontWeight: 800 }}>
              {myIncomingRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('outgoing')}
          style={{
            flex: 1,
            padding: '10px 0',
            background: activeTab === 'outgoing' ? 'var(--text-main)' : 'transparent',
            color: activeTab === 'outgoing' ? 'var(--surface)' : 'var(--text-muted)',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 600,
            boxShadow: activeTab === 'outgoing' ? 'var(--card-shadow)' : 'none',
            border: 'none'
          }}
        >
          My Requests
        </button>
      </div>

      {activeTab === 'incoming' && (
        <div className="animate-fade-in">
          {myIncomingRequests.length > 0 || myAcceptedRequests.length > 0 || myRejectedRequests.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {['all', 'pending', 'accepted', 'rejected'].map(f => (
                  <button 
                    key={f}
                    onClick={() => setIncomingFilter(f as any)}
                    style={{
                      padding: '6px 16px',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: 600,
                      border: '1px solid',
                      borderColor: incomingFilter === f ? 'var(--text-main)' : 'var(--surface-border)',
                      background: incomingFilter === f ? 'var(--text-main)' : 'var(--surface)',
                      color: incomingFilter === f ? 'var(--surface)' : 'var(--text-main)',
                      textTransform: 'capitalize',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer'
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {(incomingFilter === 'all' || incomingFilter === 'pending') && myIncomingRequests.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px', color: 'var(--text-main)' }}>Pending Requests</h3>
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
                                  booking from {req.start_date ? format(parseISO(req.start_date), 'dd MMMM yyyy EEEE') : ''} to {req.end_date ? format(parseISO(req.end_date), 'dd MMMM yyyy EEEE') : ''}
                                </p>
                              </div>
                              <p style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#000' }}>
                                Total: ₹{req.total_price}
                              </p>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <button onClick={() => { setConfirmAction({ id: req.id, action: 'accepted', originalPrice: req.total_price }); setCustomPrice(req.total_price.toString()); }} style={{ width: '48px', height: '48px', borderRadius: '24px', border: 'none', background: 'rgba(34, 197, 94, 0.15)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                                <Check size={26} strokeWidth={2.5} />
                              </button>
                              <button onClick={() => setConfirmAction({ id: req.id, action: 'rejected' })} style={{ width: '48px', height: '48px', borderRadius: '24px', border: 'none', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                                <X size={26} strokeWidth={2.5} />
                              </button>
                            </div>
                          </div>
                          
                          {req.note && (
                            <div style={{ marginTop: '12px', padding: '12px', background: 'var(--surface-border)', borderRadius: '12px' }}>
                              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-main)', fontStyle: 'italic' }}>
                                "{req.note}"
                              </p>
                            </div>
                          )}
                          
                          <div style={{ marginTop: '12px', display: 'flex' }}>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!reqItem) return;
                                const convId = getOrCreateConversation(reqItem.id, reqItem.title, reqItem.image, req.requester_id, requesterName);
                                navigate(`/chat/${convId}`);
                              }}
                              style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
                            >
                              <MessageCircle size={18} />
                              Message User
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {(incomingFilter === 'all' || incomingFilter === 'accepted' || incomingFilter === 'rejected') && (myAcceptedRequests.length > 0 || myRejectedRequests.length > 0) && (
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '24px 0 16px', color: 'var(--text-main)' }}>Booking History (Incoming)</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[...myAcceptedRequests, ...myRejectedRequests].filter(r => incomingFilter === 'all' || r.status === incomingFilter).map(req => {
                      const reqItem = items.find(i => i.id === req.item_id);
                      const requesterName = requesterNames[req.requester_id] || 'Loading...';
                      return (
                        <div key={req.id} className="glass-panel" style={{ padding: '16px', borderRadius: '16px', borderLeft: `4px solid ${req.status === 'accepted' ? 'var(--success)' : 'var(--danger)'}` }}>
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
                                  from {req.start_date ? format(parseISO(req.start_date), 'dd MMM yyyy') : ''} to {req.end_date ? format(parseISO(req.end_date), 'dd MMM yyyy') : ''}
                                </p>
                              </div>
                              <p style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#000' }}>
                                Total: ₹{req.total_price}
                              </p>
                            </div>
                            <div style={{ padding: '4px 12px', borderRadius: '16px', background: req.status === 'accepted' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: req.status === 'accepted' ? 'var(--success)' : 'var(--danger)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              {req.status === 'accepted' ? 'Accepted by you' : 'Rejected by you'}
                            </div>
                          </div>
                          
                          {req.status === 'accepted' && (
                            <div style={{ marginTop: '16px', display: 'flex' }}>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!reqItem) return;
                                  const convId = getOrCreateConversation(reqItem.id, reqItem.title, reqItem.image, req.requester_id, requesterName);
                                  navigate(`/chat/${convId}`);
                                }}
                                style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'var(--surface-border)', border: 'none', color: 'var(--text-main)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
                              >
                                <MessageCircle size={18} />
                                Chat with User
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {[...myAcceptedRequests, ...myRejectedRequests].filter(r => incomingFilter === 'all' || r.status === incomingFilter).length === 0 && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '16px', textAlign: 'center' }}>No {incomingFilter} history to show.</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', color: 'var(--text-muted)', textAlign: 'center' }}>
              <CalendarCheck size={64} opacity={0.5} style={{ marginBottom: '16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 8px', color: 'var(--text-main)' }}>No Incoming Requests</h3>
              <p style={{ margin: 0 }}>You don't have any requests for your items right now.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'outgoing' && (
        <div className="animate-fade-in">
          {myOutgoingRequests.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {myOutgoingRequests.map(req => {
                const reqItem = items.find(i => i.id === req.item_id);
                return (
                  <div key={req.id} onClick={() => navigate(`/item/${req.item_id}`)} className="glass-panel" style={{ padding: '16px', borderRadius: '16px', cursor: 'pointer', borderLeft: `4px solid ${req.status === 'accepted' ? 'var(--success)' : req.status === 'rejected' ? 'var(--danger)' : 'var(--warning)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, paddingRight: '12px' }}>
                        <h4 style={{ margin: '0 0 4px', fontSize: '16px' }}>{reqItem?.title || 'Unknown Item'}</h4>
                        <p style={{ margin: '0 0 8px', fontSize: '14px', color: 'var(--text-muted)' }}>
                          Status: <strong style={{ color: req.status === 'accepted' ? 'var(--success)' : req.status === 'rejected' ? 'var(--danger)' : 'var(--warning)' }}>{req.status.toUpperCase()}</strong>
                        </p>
                        <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '8px', marginBottom: '8px' }}>
                          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                            booking from {req.start_date ? format(parseISO(req.start_date), 'dd MMMM yyyy') : ''} to {req.end_date ? format(parseISO(req.end_date), 'dd MMMM yyyy') : ''}
                          </p>
                        </div>
                        <p style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#000' }}>
                          Total: ₹{req.total_price}
                        </p>
                      </div>
                      {reqItem && (
                        <img src={reqItem.image} alt={reqItem.title} style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover' }} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', color: 'var(--text-muted)', textAlign: 'center' }}>
              <CalendarCheck size={64} opacity={0.5} style={{ marginBottom: '16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 8px', color: 'var(--text-main)' }}>No bookings yet</h3>
              <p style={{ margin: 0 }}>You haven't requested to book any items.</p>
            </div>
          )}
        </div>
      )}
      </div>
      
      {/* Confirm Action Modal */}
      {confirmAction && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '24px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>
              {confirmAction.action === 'accepted' ? 'Accept Request?' : 'Reject Request?'}
            </h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '15px' }}>
              Are you sure you want to {confirmAction.action === 'accepted' ? 'accept' : 'reject'} this booking request?
              {confirmAction.action === 'accepted' ? ' You will be expected to fulfill this booking.' : ' The user will be notified.'}
            </p>
            {confirmAction.action === 'accepted' && (
              <div style={{ marginTop: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px', display: 'block' }}>
                  Accepting Price (₹)
                </label>
                <input
                  type="number"
                  value={customPrice}
                  onChange={e => setCustomPrice(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--surface-border)', background: 'var(--surface)', color: 'var(--text-main)', fontSize: '16px', outline: 'none' }}
                />
                <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                  Original requested price: ₹{confirmAction.originalPrice}
                </p>
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button onClick={() => setConfirmAction(null)} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', background: 'var(--surface-border)', color: 'var(--text-main)', fontSize: '16px', fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button 
                onClick={() => {
                  const price = confirmAction.action === 'accepted' ? Number(customPrice) || confirmAction.originalPrice : undefined;
                  updateRequestStatus(confirmAction.id, confirmAction.action, price);
                  setConfirmAction(null);
                }} 
                style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', background: confirmAction.action === 'accepted' ? 'var(--success)' : 'var(--danger)', color: '#fff', fontSize: '16px', fontWeight: 600, cursor: 'pointer' }}>
                Yes, {confirmAction.action === 'accepted' ? 'Accept' : 'Reject'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
