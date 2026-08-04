import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFeed } from '../context/FeedContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CalendarCheck, Calendar, Check, X, MessageCircle, ChevronDown } from 'lucide-react';
import { useBookings } from '../context/BookingContext';
import { useChat } from '../context/ChatContext';
import { getStorageJson, supabase } from '../lib/supabase';
import { format, parseISO, isToday, isYesterday, differenceInDays } from 'date-fns';

export default function Requests() {
  const { items } = useFeed();
  const { session } = useAuth();
  const { requests, updateRequestStatus } = useBookings();
  const { getOrCreateConversation, sendMessage } = useChat();
  const navigate = useNavigate();

  const getDurationDays = (startDateStr: string, endDateStr: string) => {
    if (!startDateStr || !endDateStr) return 0;
    try {
      const start = parseISO(startDateStr);
      const end = parseISO(endDateStr);
      const days = differenceInDays(end, start) + 1;
      return days > 0 ? days : 1;
    } catch (e) {
      return 1;
    }
  };

  const formatTiming = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = parseISO(dateStr);
    if (isToday(d)) return `Today at ${format(d, 'h:mm a')}`;
    if (isYesterday(d)) return `Yesterday at ${format(d, 'h:mm a')}`;
    return format(d, "MMM dd, yyyy 'at' h:mm a");
  };

  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [incomingFilter, setIncomingFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected' | 'cancelled'>('all');
  const [outgoingFilter, setOutgoingFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected' | 'cancelled'>('all');
  const [requesterNames, setRequesterNames] = useState<Record<string, string>>({});
  const [confirmAction, setConfirmAction] = useState<{ id: number; action: 'accepted' | 'rejected'; originalPrice?: number } | null>(null);
  const [cancelAction, setCancelAction] = useState<{ id: number; role: 'owner' | 'rentee', itemTitle: string, otherUserId: string, otherUserName: string } | null>(null);
  const [customPrice, setCustomPrice] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showTypeDialog, setShowTypeDialog] = useState(false);
  const [showCustomPriceDialog, setShowCustomPriceDialog] = useState(false);
  const [showMultiRequestConfirm, setShowMultiRequestConfirm] = useState(false);
  const [otherPendingRequests, setOtherPendingRequests] = useState<any[]>([]);
  const [pendingAcceptPrice, setPendingAcceptPrice] = useState<number | null>(null);
  const [bookingToAccept, setBookingToAccept] = useState<any>(null);

  const handleAcceptBooking = async (price: number) => {
    if (!confirmAction) return;
    
    const req = requests.find(r => r.id === confirmAction.id);
    if (!req) return;
    
    // Check if there are other pending requests for the same item
    const { data: otherReqs } = await supabase
      .from('booking_requests')
      .select('*')
      .eq('item_id', req.item_id)
      .eq('status', 'pending')
      .neq('id', req.id);
      
    if (otherReqs && otherReqs.length > 0) {
      setOtherPendingRequests(otherReqs);
      setPendingAcceptPrice(price);
      setBookingToAccept(req);
      setConfirmAction(null); // Hide the accept bottom sheet
      setShowMultiRequestConfirm(true); // Show the warning
    } else {
      performAccept(req.id, price);
    }
  };

  const performAccept = async (reqId: number, price: number) => {
    await updateRequestStatus(reqId, 'accepted', price);
    setConfirmAction(null);
    setShowMultiRequestConfirm(false);
  };

  // Incoming Requests: Requests sent TO me (I am the owner)
  const myIncomingRequests = requests.filter(r => r.owner_id === session?.user?.id && r.status === 'pending');
  const myAcceptedRequests = requests.filter(r => r.owner_id === session?.user?.id && r.status === 'accepted');
  const myRejectedRequests = requests.filter(r => r.owner_id === session?.user?.id && (r.status === 'rejected' || r.status === 'cancelled'));

  // Outgoing Requests: Requests I sent TO others
  const myOutgoingRequests = requests.filter(r => r.requester_id === session?.user?.id);

  const getCancelInfo = (req: any, isIncoming: boolean) => {
    let tagText = req.status;
    let cleanReason = '';
    
    if (req.status?.toLowerCase() === 'rejected') {
      const noteStr = req.note || '';
      const parts = noteStr.split('Cancel Reason:');
      let rawReason = parts[1]?.trim() || '';
      if (rawReason.startsWith('[Declined by owner]')) {
        tagText = isIncoming ? 'DECLINED BY YOU' : 'DECLINED BY OWNER';
        cleanReason = rawReason.replace('[Declined by owner]', '').trim();
      } else {
        tagText = isIncoming ? 'DECLINED BY YOU' : 'DECLINED BY OWNER';
        cleanReason = rawReason;
      }
    } else if (req.status?.toLowerCase() === 'cancelled') {
      const noteStr = req.note || '';
      const parts = noteStr.split('Cancel Reason:');
      let rawReason = parts[1]?.trim() || '';
      if (rawReason.startsWith('[Cancelled by owner]')) {
        tagText = isIncoming ? 'CANCELLED BY YOU' : 'CANCELLED BY OWNER';
        cleanReason = rawReason.replace('[Cancelled by owner]', '').trim();
      } else if (rawReason.startsWith('[Cancelled by rentee]')) {
        tagText = isIncoming ? 'CANCELLED BY REQUESTER' : 'CANCELLED BY YOU';
        cleanReason = rawReason.replace('[Cancelled by rentee]', '').trim();
      } else {
        tagText = `CANCELLED (${rawReason})`;
        cleanReason = rawReason;
      }
    }
    return { tagText, cleanReason };
  };

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
      
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--text-main)' }}>Your Requests</h1>
        <p style={{ margin: '0 0 16px 0', color: 'var(--text-muted)', fontSize: '14px' }}>Manage your incoming and sent rental requests.</p>
        
        <div style={{ display: 'flex', gap: '8px', padding: '4px', background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '20px' }}>
          <button 
            onClick={() => setActiveTab('incoming')}
            style={{ flex: 1, padding: '12px', borderRadius: '16px', border: 'none', background: activeTab === 'incoming' ? '#FEF3C7' : 'transparent', color: activeTab === 'incoming' ? '#000000' : 'var(--text-muted)', fontWeight: 700, fontSize: '14px', cursor: 'pointer', boxShadow: activeTab === 'incoming' ? 'var(--card-shadow)' : 'none', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            Incoming
            {myIncomingRequests.length > 0 && (
              <span style={{ background: 'var(--danger)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>{myIncomingRequests.length}</span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('outgoing')}
            style={{ flex: 1, padding: '12px', borderRadius: '16px', border: 'none', background: activeTab === 'outgoing' ? '#FEF3C7' : 'transparent', color: activeTab === 'outgoing' ? '#000000' : 'var(--text-muted)', fontWeight: 700, fontSize: '14px', cursor: 'pointer', boxShadow: activeTab === 'outgoing' ? 'var(--card-shadow)' : 'none', transition: 'all 0.2s' }}
          >
            Sent
          </button>
        </div>
      </div>

      {activeTab === 'incoming' && (
        <div className="animate-fade-in">
          {myIncomingRequests.length > 0 || myAcceptedRequests.length > 0 || myRejectedRequests.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <div className="mobile-only" style={{ marginBottom: '4px' }}>
                <button 
                  onClick={() => setShowTypeDialog(true)}
                  style={{ width: '100%', padding: '14px 16px', borderRadius: '16px', border: '1px solid var(--surface-border)', background: 'var(--surface)', color: 'var(--text-main)', fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                >
                  <span style={{ textTransform: 'capitalize' }}>{incomingFilter} Requests</span>
                  <ChevronDown size={20} color="var(--text-muted)" />
                </button>
              </div>

              <div className="desktop-only" style={{ display: 'flex', gap: '8px', paddingBottom: '4px' }}>
                {['all', 'pending', 'accepted', 'rejected', 'cancelled'].map(f => (
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[...myIncomingRequests, ...myAcceptedRequests, ...myRejectedRequests].filter(req => incomingFilter === 'all' || req.status === incomingFilter).length > 0 ? (
                  [...myIncomingRequests, ...myAcceptedRequests, ...myRejectedRequests].filter(req => incomingFilter === 'all' || req.status === incomingFilter).map(req => {
                    const reqItem = items.find(i => i.id === req.item_id);
                    const requesterName = requesterNames[req.requester_id] || 'Loading...';
                    return (
                      <div key={req.id} className="glass-panel" style={{ padding: '16px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: `4px solid ${req.status === 'accepted' ? 'var(--success)' : (req.status === 'rejected' || req.status === 'cancelled') ? 'var(--danger)' : 'var(--warning)'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            {reqItem?.image && (
                              <img src={reqItem.image} alt="" style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover' }} />
                            )}
                            <div>
                              <h4 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 700 }}>{reqItem?.title || 'Unknown Item'}</h4>
                              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>{formatTiming(req.created_at)}</p>
                            </div>
                          </div>
                          {req.status !== 'pending' && (() => {
                            const { tagText } = getCancelInfo(req, true);
                            return (
                              <div style={{ padding: '4px 12px', borderRadius: '16px', background: req.status === 'accepted' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: req.status === 'accepted' ? 'var(--success)' : 'var(--danger)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                {tagText}
                              </div>
                            );
                          })()}
                        </div>

                        <div style={{ background: 'var(--surface-border)', padding: '12px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                          <div style={{ flex: '1 1 200px' }}>
                            <p style={{ margin: '0 0 4px', fontSize: '14px', color: 'var(--text-muted)' }}>
                              Requested by <strong onClick={(e) => { e.stopPropagation(); navigate(`/user/${req.requester_id}`); }} style={{ color: 'var(--text-main)', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '4px' }}>{requesterName}</strong> for {(() => {
                                const days = getDurationDays(req.start_date, req.end_date);
                                return `${days} ${days === 1 ? 'day' : 'days'}`;
                              })()}
                            </p>
                            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Calendar size={14} />
                              {req.start_date ? format(parseISO(req.start_date), 'dd MMM yyyy') : ''} to {req.end_date ? format(parseISO(req.end_date), 'dd MMM yyyy') : ''}
                            </p>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <p style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#000' }}>₹{req.total_price}</p>
                          </div>
                        </div>

                        {(() => {
                          const noteStr = req.note || '';
                          const noteParts = noteStr.split('Cancel Reason:');
                          const originalNote = noteParts[0]?.trim();
                          const { cleanReason } = getCancelInfo(req, true);

                          return (
                            <>
                              {req.status === 'pending' && originalNote && (
                                <div style={{ padding: '12px', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-main)', fontStyle: 'italic' }}>
                                    "{originalNote}"
                                  </p>
                                </div>
                              )}
                              {req.status === 'cancelled' && cleanReason && (
                                <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--danger)', marginBottom: '4px' }}>Cancellation Reason:</p>
                                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-main)' }}>{cleanReason}</p>
                                </div>
                              )}
                            </>
                          );
                        })()}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                          {req.status === 'pending' && (
                            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                              <button onClick={() => { setConfirmAction({ id: req.id, action: 'accepted', originalPrice: req.total_price }); setCustomPrice(''); }} style={{ flex: 1, height: '44px', borderRadius: '12px', border: 'none', background: 'var(--success)', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                                <Check size={18} strokeWidth={2.5} /> Accept
                              </button>
                              <button onClick={() => setConfirmAction({ id: req.id, action: 'rejected' })} style={{ flex: 1, height: '44px', borderRadius: '12px', border: 'none', background: 'var(--danger)', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                                <X size={18} strokeWidth={2.5} /> Decline
                              </button>
                            </div>
                          )}
                          {(req.status === 'pending' || req.status === 'accepted') && (
                            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!reqItem) return;
                                  const convId = getOrCreateConversation(reqItem.id, reqItem.title, reqItem.image, req.requester_id, requesterName);
                                  navigate(`/chat/${convId}`);
                                }}
                                style={{ flex: 1, height: '44px', borderRadius: '12px', background: 'var(--surface)', border: '1px solid var(--surface-border)', color: 'var(--text-main)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
                              >
                                <MessageCircle size={18} />
                                Message User
                              </button>
                            </div>
                          )}
                          {req.status === 'accepted' && (
                            <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '8px' }}>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCancelAction({ id: req.id, role: 'owner', itemTitle: reqItem?.title || '', otherUserId: req.requester_id, otherUserName: requesterName });
                                }}
                                style={{ flex: 1, height: '44px', borderRadius: '12px', border: '1px solid var(--danger)', background: 'transparent', color: 'var(--danger)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
                              >
                                <X size={18} /> Cancel Booking
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 0', color: 'var(--text-muted)', textAlign: 'center' }}>
                    <CalendarCheck size={48} opacity={0.3} style={{ marginBottom: '12px' }} />
                    <p style={{ margin: 0, fontSize: '15px' }}>No {incomingFilter === 'all' ? 'incoming' : incomingFilter} requests found.</p>
                  </div>
                )}
              </div>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="mobile-only" style={{ marginBottom: '4px' }}>
                <button 
                  onClick={() => setShowTypeDialog(true)}
                  style={{ width: '100%', padding: '14px 16px', borderRadius: '16px', border: '1px solid var(--surface-border)', background: 'var(--surface)', color: 'var(--text-main)', fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                >
                  <span style={{ textTransform: 'capitalize' }}>{outgoingFilter} Requests</span>
                  <ChevronDown size={20} color="var(--text-muted)" />
                </button>
              </div>

              <div className="desktop-only" style={{ display: 'flex', gap: '8px', paddingBottom: '4px' }}>
                {['all', 'pending', 'accepted', 'rejected', 'cancelled'].map(f => (
                  <button 
                    key={f}
                    onClick={() => setOutgoingFilter(f as any)}
                    style={{
                      padding: '6px 16px',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: 600,
                      border: '1px solid',
                      borderColor: outgoingFilter === f ? 'var(--text-main)' : 'var(--surface-border)',
                      background: outgoingFilter === f ? 'var(--text-main)' : 'var(--surface)',
                      color: outgoingFilter === f ? 'var(--surface)' : 'var(--text-main)',
                      textTransform: 'capitalize',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer'
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {myOutgoingRequests.filter(req => outgoingFilter === 'all' || req.status === outgoingFilter).length > 0 ? (
                  myOutgoingRequests.filter(req => outgoingFilter === 'all' || req.status === outgoingFilter).map(req => {
                    const reqItem = items.find(i => i.id === req.item_id);
                    return (
                      <div key={req.id} onClick={() => navigate(`/item/${req.item_id}`)} className="glass-panel" style={{ padding: '16px', borderRadius: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: `4px solid ${req.status === 'accepted' ? 'var(--success)' : (req.status === 'rejected' || req.status === 'cancelled') ? 'var(--danger)' : 'var(--warning)'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            {reqItem?.image && (
                              <img src={reqItem.image} alt="" style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover' }} />
                            )}
                            <div>
                              <h4 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 700 }}>{reqItem?.title || 'Unknown Item'}</h4>
                              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>{formatTiming(req.created_at)}</p>
                            </div>
                          </div>
                          {(() => {
                            const { tagText } = getCancelInfo(req, false);
                            return (
                              <div style={{ padding: '4px 12px', borderRadius: '16px', background: req.status === 'accepted' ? 'rgba(34, 197, 94, 0.1)' : (req.status === 'rejected' || req.status === 'cancelled') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: req.status === 'accepted' ? 'var(--success)' : (req.status === 'rejected' || req.status === 'cancelled') ? 'var(--danger)' : 'var(--warning)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                {tagText}
                              </div>
                            );
                          })()}
                        </div>

                        <div style={{ background: 'var(--surface-border)', padding: '12px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                          <div style={{ flex: '1 1 200px' }}>
                            <p style={{ margin: '0 0 4px', fontSize: '14px', color: 'var(--text-muted)' }}>
                              Requested by <strong>You</strong> for {(() => {
                                const days = getDurationDays(req.start_date, req.end_date);
                                return `${days} ${days === 1 ? 'day' : 'days'}`;
                              })()}
                            </p>
                            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Calendar size={14} />
                              {req.start_date ? format(parseISO(req.start_date), 'dd MMM yyyy') : ''} to {req.end_date ? format(parseISO(req.end_date), 'dd MMM yyyy') : ''}
                            </p>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <p style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#000' }}>₹{req.total_price}</p>
                          </div>
                        </div>

                        {(() => {
                          const noteStr = req.note || '';
                          const noteParts = noteStr.split('Cancel Reason:');
                          const originalNote = noteParts[0]?.trim();
                          const { cleanReason } = getCancelInfo(req, false);

                          return (
                            <>
                              {req.status === 'pending' && originalNote && (
                                <div style={{ padding: '12px', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-main)', fontStyle: 'italic' }}>
                                    "{originalNote}"
                                  </p>
                                </div>
                              )}
                              {req.status === 'cancelled' && cleanReason && (
                                <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--danger)', marginBottom: '4px' }}>Cancellation Reason:</p>
                                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-main)' }}>{cleanReason}</p>
                                </div>
                              )}
                            </>
                          );
                        })()}
                        
                        {(req.status === 'pending' || req.status === 'accepted') && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!reqItem) return;
                                const convId = getOrCreateConversation(reqItem.id, reqItem.title, reqItem.image, req.owner_id, "Owner");
                                navigate(`/chat/${convId}`);
                              }}
                              style={{ width: '100%', height: '44px', borderRadius: '12px', background: req.status === 'accepted' ? 'var(--surface)' : 'transparent', border: req.status === 'pending' ? '1px solid var(--primary)' : '1px solid var(--surface-border)', color: req.status === 'pending' ? 'var(--primary)' : 'var(--text-main)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
                            >
                              <MessageCircle size={18} />
                              {req.status === 'accepted' ? 'Message Owner' : 'Chat with Owner'}
                            </button>
                            {(req.status === 'accepted' || req.status === 'pending') && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCancelAction({ id: req.id, role: 'rentee', itemTitle: reqItem?.title || '', otherUserId: req.owner_id, otherUserName: 'Owner' });
                                }}
                                style={{ width: '100%', height: '44px', borderRadius: '12px', background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
                              >
                                <X size={18} /> {req.status === 'pending' ? 'Withdraw Request' : 'Cancel Booking'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 0', color: 'var(--text-muted)', textAlign: 'center' }}>
                    <CalendarCheck size={48} opacity={0.3} style={{ marginBottom: '12px' }} />
                    <p style={{ margin: 0, fontSize: '15px' }}>No {outgoingFilter === 'all' ? 'booking' : outgoingFilter} requests found.</p>
                  </div>
                )}
              </div>
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
      
      {confirmAction && createPortal(
        confirmAction.action === 'accepted' ? (
          <>
            <div className={`bottom-sheet-overlay visible`} onClick={() => { setConfirmAction(null); setCancelReason(''); }} style={{ zIndex: 999998 }}></div>
            <div className={`bottom-sheet visible`} style={{ zIndex: 999999 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>Accept Booking?</h3>
                <button onClick={() => { setConfirmAction(null); setCancelReason(''); }} style={{ background: 'var(--surface-border)', border: 'none', width: '40px', height: '40px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-main)', padding: 0 }}>
                  <X size={24} />
                </button>
              </div>
              {(() => {
                const reqToConfirm = requests.find(r => r.id === confirmAction.id);
                const totalDays = reqToConfirm ? getDurationDays(reqToConfirm.start_date, reqToConfirm.end_date) : 1;
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
                    <div style={{ padding: '16px', background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--surface-border)', fontSize: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Price per day</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>₹{(customPrice && Number(customPrice) > 0) ? Number(customPrice) : Math.round((confirmAction.originalPrice || 0) / totalDays)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Duration</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{totalDays} {totalDays === 1 ? 'day' : 'days'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Platform Fee</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>₹0</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>GST</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>₹0</span>
                      </div>
                      <div style={{ height: '1px', background: 'var(--surface-border)', margin: '12px 0' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-main)', fontSize: '16px' }}>
                        <span style={{ fontWeight: 700 }}>You will receive</span>
                        <span style={{ fontWeight: 800 }}>₹{(customPrice && Number(customPrice) > 0) ? (Number(customPrice) * totalDays) : (confirmAction.originalPrice || 0)}</span>
                      </div>
                    </div>

                    <div>
                      <button
                        onClick={() => setShowCustomPriceDialog(true)}
                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--primary)', background: 'transparent', color: 'var(--primary)', fontSize: '14px', fontWeight: 700, cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s ease' }}
                      >
                        Click here for custom price
                      </button>
                    </div>



                    <div style={{ marginTop: '8px' }}>
                      <button
                        onClick={() => {
                          const priceToUse = (customPrice && Number(customPrice) > 0) ? (Number(customPrice) * totalDays) : (confirmAction.originalPrice || 0);
                          handleAcceptBooking(priceToUse);
                        }}
                        style={{ width: '100%', padding: '16px', borderRadius: '16px', border: 'none', background: 'var(--success)', color: '#fff', fontSize: '16px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textAlign: 'center' }}
                      >
                        Proceed with ₹{(customPrice && Number(customPrice) > 0) ? (Number(customPrice) * totalDays) : confirmAction.originalPrice} for {totalDays} {totalDays === 1 ? 'day' : 'days'} &gt;&gt;
                      </button>
                    </div>
                  </div>
                );
              })()}
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button onClick={() => { setConfirmAction(null); setCancelReason(''); }} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', background: 'var(--surface-border)', color: 'var(--text-main)', fontSize: '16px', fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '24px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--surface)', border: '1px solid var(--surface-border)' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Decline Request?</h3>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '15px' }}>
                Are you sure you want to decline this booking request? The user will be notified.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
                  Reason for declining (optional):
                </label>
                <textarea
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  placeholder="e.g., Item is currently unavailable, busy schedule..."
                  rows={3}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--surface-border)', background: 'var(--surface)', color: 'var(--text-main)', fontSize: '15px', outline: 'none', resize: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button onClick={() => { setConfirmAction(null); setCancelReason(''); }} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', background: 'var(--surface-border)', color: 'var(--text-main)', fontSize: '16px', fontWeight: 600, cursor: 'pointer' }}>
                  No, Go Back
                </button>
                <button 
                  onClick={async () => {
                    const req = requests.find(r => r.id === confirmAction.id);
                    const reason = cancelReason.trim();
                    const rolePrefix = `[Declined by owner] `;
                    const formattedReason = reason ? `${rolePrefix}${reason}` : '';
                    
                    await updateRequestStatus(confirmAction.id, 'rejected', undefined, formattedReason);
                    
                    if (req) {
                      const reqItem = items.find(i => i.id === req.item_id);
                      const requesterName = req.requester?.full_name || "User";
                      const convId = getOrCreateConversation(req.item_id, reqItem?.title || '', reqItem?.image || '', req.requester_id, requesterName);
                      if (convId && session?.user?.id && session?.user?.user_metadata?.full_name) {
                        const reasonText = reason ? `\nReason: ${reason}` : '';
                        await sendMessage(convId, session.user.id, `[System]: Booking request was declined by ${session.user.user_metadata.full_name}.${reasonText}`);
                      }
                    }
                    setConfirmAction(null);
                    setCancelReason('');
                  }} 
                  style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', background: 'var(--danger)', color: '#fff', fontSize: '16px', fontWeight: 600, cursor: 'pointer' }}>
                  Yes, Decline
                </button>
              </div>
            </div>
          </div>
        ),
        document.body
      )}

      {showCustomPriceDialog && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 9999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '360px', padding: '24px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--surface)', border: '1px solid var(--surface-border)' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Custom Price</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>Enter the custom price per day below:</p>
            <input
              type="number"
              value={customPrice}
              onChange={e => setCustomPrice(e.target.value)}
              placeholder="Enter price per day"
              style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--surface-border)', background: 'var(--bg)', color: 'var(--text-main)', fontSize: '16px', outline: 'none' }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button 
                type="button" 
                onClick={() => { setCustomPrice(''); setShowCustomPriceDialog(false); }} 
                style={{ flex: 1, padding: '14px', borderRadius: '16px', border: 'none', background: 'var(--surface-border)', color: 'var(--text-main)', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowCustomPriceDialog(false)}
                disabled={!customPrice || Number(customPrice) <= 0}
                style={{ flex: 1, padding: '14px', borderRadius: '16px', border: 'none', background: 'var(--primary)', color: '#000', fontSize: '15px', fontWeight: 600, cursor: (!customPrice || Number(customPrice) <= 0) ? 'default' : 'pointer', opacity: (!customPrice || Number(customPrice) <= 0) ? 0.5 : 1 }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showMultiRequestConfirm && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '24px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--surface)', border: '1px solid var(--surface-border)' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Multiple Requests</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.5 }}>
              This item has been requested by <strong>{otherPendingRequests.length}</strong> other user{otherPendingRequests.length > 1 ? 's' : ''}. 
              If you accept this booking, all other pending requests will be automatically declined with the reason "Unavailable".
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button 
                type="button" 
                onClick={() => { 
                  setShowMultiRequestConfirm(false); 
                  if (bookingToAccept) {
                    setConfirmAction({ id: bookingToAccept.id, action: 'accepted', originalPrice: bookingToAccept.total_price });
                  }
                }} 
                style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', background: 'var(--surface-border)', color: 'var(--text-main)', fontSize: '16px', fontWeight: 600, cursor: 'pointer' }}
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (bookingToAccept && pendingAcceptPrice !== null) {
                    performAccept(bookingToAccept.id, pendingAcceptPrice);
                  }
                }}
                style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', background: 'var(--success)', color: '#fff', fontSize: '16px', fontWeight: 600, cursor: 'pointer' }}
              >
                Confirm Accept
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* Cancel Action Modal */}
      {cancelAction && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '24px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: 'var(--danger)' }}>
              Cancel Booking?
            </h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.5 }}>
              {cancelAction.role === 'rentee' 
                ? "You are about to cancel this booking. Cancellations are free up to 24 hours before the rental start date. Frequent last-minute cancellations may negatively affect your profile standing. Are you sure?"
                : "You are about to cancel this booking. Please ensure you only cancel if the item is truly unavailable. Frequent cancellations will lower your seller rating. Are you sure?"}
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>Reason for cancellation (optional)</label>
              <textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="Briefly explain why you are cancelling..."
                style={{ width: '100%', minHeight: '80px', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--surface-border)', background: 'var(--surface)', color: 'var(--text-main)', fontSize: '14px', resize: 'none', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button onClick={() => { setCancelAction(null); setCancelReason(''); }} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', background: 'var(--surface-border)', color: 'var(--text-main)', fontSize: '16px', fontWeight: 600, cursor: 'pointer' }}>
                Go Back
              </button>
              <button 
                onClick={async () => {
                  const rolePrefix = `[Cancelled by ${cancelAction.role}] `;
                  const formattedReason = cancelReason.trim() ? `${rolePrefix}${cancelReason.trim()}` : rolePrefix;
                  await updateRequestStatus(cancelAction.id, 'cancelled', undefined, formattedReason);
                  
                  // Send automated message
                  const req = requests.find(r => r.id === cancelAction.id);
                  if (req) {
                    const convId = getOrCreateConversation(req.item_id, cancelAction.itemTitle, "", cancelAction.otherUserId, cancelAction.otherUserName);
                    if (convId && session?.user?.id && session?.user?.user_metadata?.full_name) {
                      const reasonText = cancelReason.trim() ? `\nReason: ${cancelReason.trim()}` : '';
                      await sendMessage(convId, session.user.id, `[System]: Booking cancelled by ${session.user.user_metadata.full_name}.${reasonText}`);
                    }
                  }
                  
                  setCancelAction(null);
                  setCancelReason('');
                }} 
                style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', background: 'var(--danger)', color: '#fff', fontSize: '16px', fontWeight: 600, cursor: 'pointer' }}>
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* Type Selection Dialog */}
      {showTypeDialog && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 999999, display: 'flex', alignItems: 'flex-end', padding: '16px' }} onClick={() => setShowTypeDialog(false)}>
          <div className="animate-slide-up glass-panel" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '400px', margin: '0 auto', background: 'var(--surface)', borderRadius: '24px', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Select View</h3>
              <button onClick={() => setShowTypeDialog(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, margin: 0, display: 'flex' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '8px' }}>
              {['all', 'pending', 'accepted', 'rejected', 'cancelled'].map(type => (
                <button
                  key={type}
                  onClick={() => {
                    if (activeTab === 'incoming') setIncomingFilter(type as any);
                    else setOutgoingFilter(type as any);
                    setShowTypeDialog(false);
                  }}
                  style={{ width: '100%', padding: '16px', background: (activeTab === 'incoming' ? incomingFilter : outgoingFilter) === type ? 'var(--surface-border)' : 'transparent', border: 'none', borderRadius: '16px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)', textTransform: 'capitalize' }}>
                    {type} Requests
                  </span>
                  {(activeTab === 'incoming' ? incomingFilter : outgoingFilter) === type && <Check size={20} color="var(--primary)" />}
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
