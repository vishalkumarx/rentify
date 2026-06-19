import toast from 'react-hot-toast';
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFeed } from '../context/FeedContext';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { getStorageJson } from '../lib/supabase';
import { ChevronLeft, MessageCircle, Heart, Tag, X, ChevronRight, Bell, BadgeCheck, Star, MapPin, Calendar as CalendarIcon, Check } from 'lucide-react';
import { Calendar } from '../components/Calendar';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { useBookings } from '../context/BookingContext';
import { differenceInDays, parseISO, isValid, format } from 'date-fns';

const ZoomableImage = ({ img, i }: { img: string, i: number }) => {
  const [isZoomed, setIsZoomed] = useState(false);
  return (
    <TransformWrapper 
      initialScale={1} 
      minScale={1} 
      maxScale={4} 
      centerOnInit
      onZoom={(ref: any) => setIsZoomed(ref.state.scale > 1)}
      onTransform={(ref: any) => setIsZoomed(ref.state.scale > 1)}
      panning={{ disabled: !isZoomed }}
    >
      <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
        <img src={img} alt={`Zoomed ${i}`} style={{ width: '100vw', maxHeight: '80vh', objectFit: 'contain' }} />
      </TransformComponent>
    </TransformWrapper>
  );
};

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { items, toggleLike } = useFeed();
  const { getOrCreateConversation, conversations, sendMessage } = useChat();
  const { session, loading } = useAuth();
  const { createRequest, deleteRequest, requests } = useBookings();
  const [zoomImageIndex, setZoomImageIndex] = useState<number | null>(null);
  const [currentMainImageIndex, setCurrentMainImageIndex] = useState(0);
  const isInitialModalRender = useRef(false);
  const modalScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (zoomImageIndex !== null && isInitialModalRender.current && modalScrollRef.current) {
      modalScrollRef.current.scrollLeft = zoomImageIndex * window.innerWidth;
      isInitialModalRender.current = false;
    }
  }, [zoomImageIndex]);

  const [bookingSheetState, setBookingSheetState] = useState<'none' | 'confirm' | 'success'>('none');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const [ownerProfile, setOwnerProfile] = useState<any>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bookingNote, setBookingNote] = useState('');
  
  const item = items.find(i => i.id === Number(id));
  const isOwner = session?.user?.id === item?.userId;
  const userRequest = session && item ? requests.find(r => r.item_id === item.id && r.requester_id === session.user.id && r.status !== 'rejected') : null;
  const chatExists = item && conversations.some(c => c.itemId === item.id && c.otherUserId === item.userId);

  useEffect(() => {
    if (item?.userId) {

      getStorageJson(`profiles/${item.userId}.json`).then(profile => {
        if (profile) setOwnerProfile(profile);
      });
    }
  }, [item?.userId]);

  if (loading) return null;

  if (!item) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <h2>Item not found</h2>
        <button onClick={() => navigate(-1)} style={{ width: 'auto', padding: '12px 24px' }}>Go Back</button>
      </div>
    );
  }

  const validImages = (item.images || []).filter(img => img && img.trim() !== '' && img !== item.image);
  const allImages = [item.image, ...validImages];
  
  const ownerName = ownerProfile?.name || item.seller?.name || `Owner of ${item.title}`;

  const handleMessageClick = () => {
    if (!session) {
      navigate('/login');
      return;
    }
    const ownerId = item.userId || `user-${item.id}`;
    const convId = getOrCreateConversation(item.id, item.title, item.image, ownerId, ownerName);
    navigate(`/chat/${convId}`);
  };

  const handleRequestClick = () => {
    if (!session) {
      navigate('/login');
      return;
    }
    if (!startDate || !endDate) return toast.error('Select dates');
    const days = differenceInDays(parseISO(endDate), parseISO(startDate));
    if (days < 0) return toast.error('End date must be after start date');
    setBookingSheetState('confirm');
  };

  const handleConfirmBookRequest = async () => {
    const days = differenceInDays(parseISO(endDate), parseISO(startDate));
    const totalDays = days === 0 ? 1 : days;
    const totalPrice = totalDays * Number(item.price);

    await createRequest({
      item_id: item.id,
      requester_id: session!.user.id,
      owner_id: item.userId || `user-${item.id}`,
      start_date: startDate,
      end_date: endDate,
      total_price: totalPrice,
      note: bookingNote.trim() !== '' ? bookingNote.trim() : undefined,
    });

    // Create or get conversation and send the note
    const ownerId = item.userId || `user-${item.id}`;
    const ownerName = ownerProfile?.name || item.seller?.name || `Owner of ${item.title}`;
    const convId = getOrCreateConversation(item.id, item.title, item.image, ownerId, ownerName);
    
    if (bookingNote.trim() !== '') {
      await sendMessage(convId, session!.user.id, `[Booking Request Note]: ${bookingNote.trim()}`);
    } else {
      await sendMessage(convId, session!.user.id, `[Booking Request]: User has requested to book this item from ${format(parseISO(startDate), 'MMM d, yyyy')} to ${format(parseISO(endDate), 'MMM d, yyyy')} for ₹${totalPrice}.`);
    }
    setBookingSheetState('success');
    setTimeout(() => {
      setBookingSheetState('none');
    }, 3000);
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const s = parseISO(startDate);
    const e = parseISO(endDate);
    if (!isValid(s) || !isValid(e)) return 0;
    const days = differenceInDays(e, s);
    return days < 0 ? 0 : days === 0 ? 1 : days;
  };

  return (
    <>
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
          onClick={() => {
            if (!session) {
              navigate('/login');
            } else {
              toggleLike(item.id);
            }
          }} 
          style={{ width: '40px', height: '40px', padding: 0, borderRadius: '20px', background: 'var(--surface)', border: '1px solid var(--surface-border)', color: item.liked ? 'var(--danger)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--card-shadow)' }}
        >
          <Heart size={20} fill={item.liked ? 'var(--danger)' : 'none'} />
        </button>
      </header>

      {/* Content */}
      <main style={{ flex: 1, overflowY: 'auto', paddingBottom: '200px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          
          {/* Main Image Slider */}
          <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3' }}>
            <div 
              style={{ 
                width: '100%', 
                height: '100%', 
                display: 'flex', 
                overflowX: 'auto', 
                scrollSnapType: 'x mandatory',
                scrollBehavior: 'smooth'
              }}
              className="hide-scrollbar"
              onScroll={(e) => {
                const el = e.currentTarget;
                const index = Math.round(el.scrollLeft / el.clientWidth);
                setCurrentMainImageIndex(index);
              }}
            >
              {allImages.map((img, i) => (
                <div 
                  key={i} 
                  style={{ minWidth: '100%', height: '100%', scrollSnapAlign: 'start', position: 'relative', cursor: 'pointer' }}
                  onClick={() => {
                    isInitialModalRender.current = true;
                    setZoomImageIndex(i);
                  }}
                >
                  <img src={img} alt={`${item.title} - ${i+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
            
            <div style={{ position: 'absolute', bottom: '16px', left: '16px', background: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: '16px', color: 'white', fontWeight: 700, backdropFilter: 'blur(8px)', pointerEvents: 'none' }}>
              {currentMainImageIndex + 1} / {allImages.length}
            </div>
            <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: '16px', color: 'white', fontWeight: 600, backdropFilter: 'blur(8px)', fontSize: '12px', pointerEvents: 'none' }}>
              Tap to Zoom
            </div>
            {/* Dots indicator */}
            {allImages.length > 1 && (
              <div style={{ position: 'absolute', bottom: '16px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '6px', pointerEvents: 'none' }}>
                {allImages.map((_, i) => (
                  <div key={i} style={{ width: '6px', height: '6px', borderRadius: '3px', background: i === currentMainImageIndex ? 'white' : 'rgba(255,255,255,0.4)', transition: 'all 0.2s' }} />
                ))}
              </div>
            )}
          </div>

          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {userRequest?.status === 'accepted' ? (
                  <span style={{ display: 'inline-block', background: 'var(--success)', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.5px', alignSelf: 'flex-start', textTransform: 'uppercase' }}>RENTED BY YOU</span>
                ) : item.status === 'booked' && (
                  <span style={{ display: 'inline-block', background: 'var(--danger)', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.5px', alignSelf: 'flex-start' }}>BOOKED</span>
                )}
                <h1 style={{ fontSize: '26px', margin: 0, fontWeight: 700, lineHeight: 1.2 }}>{item.title}</h1>
              </div>
              <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)' }}>₹{item.price}<span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>/day</span></span>
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
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'var(--primary-glow)', color: 'var(--text-main)', borderRadius: '16px', fontSize: '13px', fontWeight: 600 }}>
                <Tag size={14} /> {item.category}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'var(--surface)', border: '1px solid var(--surface-border)', color: 'var(--text-main)', borderRadius: '16px', fontSize: '13px', fontWeight: 600 }}>
                <MapPin size={14} /> {item.location?.address || 'Unknown Location'}
              </span>
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>Description</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: 1.6, margin: 0 }}>
              {item.description || "No description provided for this item. It's currently available for rent in good condition! Reach out to the owner for more details."}
            </p>


            {/* User's Booking Information */}
            {userRequest && (
              <div className="glass-panel" style={{ marginTop: '32px', padding: '24px', borderRadius: '20px', borderLeft: userRequest.status === 'accepted' ? '4px solid var(--success)' : '4px solid var(--warning)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CalendarIcon size={20} color={userRequest.status === 'accepted' ? 'var(--success)' : 'var(--warning)'} /> 
                  Booking info
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Status</span>
                    <span style={{ fontWeight: 800, color: userRequest.status === 'accepted' ? 'var(--success)' : 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {userRequest.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Dates</span>
                    <span style={{ fontWeight: 600 }}>
                      {userRequest.start_date ? format(parseISO(userRequest.start_date), 'dd MMM yyyy') : ''} to {userRequest.end_date ? format(parseISO(userRequest.end_date), 'dd MMM yyyy') : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Total Price</span>
                    <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '16px' }}>
                      ₹{userRequest.total_price}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Booking Calendar Section */}
            {!isOwner && !userRequest && (
              <div className="glass-panel" style={{ marginTop: '32px', padding: '24px', borderRadius: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CalendarIcon size={20} /> Select booking dates
                </h3>
                
                <Calendar 
                  startDate={startDate} 
                  endDate={endDate} 
                  onChange={(start, end) => {
                    setStartDate(start);
                    setEndDate(end);
                  }}
                  disabled={!!userRequest || item.status === 'booked'}
                />

                {startDate && endDate && calculateDays() > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
                      ₹{item.price} x {calculateDays()} {calculateDays() === 1 ? 'day' : 'days'}
                    </span>
                    <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>
                      ₹{calculateDays() * Number(item.price)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Seller Trust Profile */}
            {!isOwner && item.seller && (
              <div 
                onClick={() => navigate('/user/' + (item.userId || 'user-123'))}
                className="glass-panel" 
                style={{ marginTop: '32px', padding: '20px', borderRadius: '20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '16px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Posted by</h3>
                  <ChevronRight size={20} color="var(--text-muted)" />
                </div>
                
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  {ownerProfile?.avatar_url ? (
                    <img src={ownerProfile.avatar_url} alt="Owner" style={{ width: '60px', height: '60px', borderRadius: '30px', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '60px', height: '60px', borderRadius: '30px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 700, color: 'var(--text-main)' }}>
                      {ownerName.charAt(0)}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>{ownerName}</h4>
                      <BadgeCheck size={20} fill="#1877F2" color="white" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Joined {item.seller.memberSince}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>

      {/* Image Zoom Modal */}
      {zoomImageIndex !== null && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.95)', zIndex: 100,
          display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 101, position: 'absolute', top: 0, left: 0, right: 0 }}>
            <span style={{ color: 'white', fontWeight: 600 }}>{zoomImageIndex + 1} / {allImages.length}</span>
            <button 
              onClick={() => setZoomImageIndex(null)}
              style={{ width: '56px', height: '56px', borderRadius: '28px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={32} />
            </button>
          </div>
          <div 
            ref={modalScrollRef}
            style={{ flex: 1, display: 'flex', alignItems: 'center', overflowX: 'auto', scrollSnapType: 'x mandatory', width: '100vw' }}
            className="hide-scrollbar"
            onScroll={(e) => {
              const el = e.currentTarget;
              const index = Math.round(el.scrollLeft / el.clientWidth);
              if (index !== zoomImageIndex && !isInitialModalRender.current) {
                setZoomImageIndex(index);
              }
            }}
          >
            {allImages.map((img, i) => (
              <div key={i} style={{ minWidth: '100vw', height: '100%', scrollSnapAlign: 'start', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ZoomableImage img={img} i={i} />
              </div>
            ))}
          </div>
          <div style={{ position: 'absolute', bottom: '20px', left: 0, right: 0, textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: '14px', pointerEvents: 'none' }}>
            Swipe to change, pinch to zoom
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
          {isOwner ? (
            <button onClick={() => navigate(`/edit/${item.id}`)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '18px', fontSize: '18px', borderRadius: '24px', background: 'var(--surface-border)', color: 'var(--text-main)', border: 'none', width: '100%', cursor: 'pointer' }}>
              Edit Your Item
            </button>
          ) : userRequest?.status === 'accepted' || (chatExists && userRequest) ? (
            <button onClick={handleMessageClick} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '18px', fontSize: '18px', borderRadius: '24px', background: 'var(--text-main)', color: 'var(--surface)', boxShadow: 'none', width: '100%', cursor: 'pointer', border: 'none' }}>
              <MessageCircle size={22} />
              Chat with Owner
            </button>
          ) : item.status === 'booked' ? (
            <button onClick={() => toast.success("You'll be notified when this item becomes available again!")} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '18px', fontSize: '18px', borderRadius: '24px', background: 'var(--primary-glow)', color: 'var(--primary)', border: 'none', boxShadow: 'none', width: '100%', cursor: 'pointer' }}>
              <Bell size={22} />
              Notify Me
            </button>
          ) : userRequest?.status === 'pending' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
              <button disabled style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '18px', fontSize: '18px', borderRadius: '24px', background: 'var(--surface-border)', color: 'var(--text-muted)', boxShadow: 'none', width: '100%', cursor: 'not-allowed', border: 'none' }}>
                <MessageCircle size={22} />
                Chat Locked (Pending)
              </button>
              <button 
                onClick={() => setShowCancelConfirm(true)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '14px', fontSize: '16px', borderRadius: '24px', background: 'transparent', color: 'var(--danger)', boxShadow: 'none', width: '100%', cursor: 'pointer', border: 'none' }}>
                <X size={20} />
                Cancel Request
              </button>
            </div>
          ) : (
            <button 
              onClick={() => {
                if (!startDate || !endDate || calculateDays() === 0) {
                  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                  // If they are already near the bottom, just trigger the alert via handleRequestClick
                  if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 100) {
                    handleRequestClick();
                  }
                } else {
                  handleRequestClick();
                }
              }} 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '18px', fontSize: '18px', borderRadius: '24px', background: 'var(--primary)', color: '#fff', boxShadow: 'var(--primary-glow)', width: '100%', cursor: 'pointer', border: 'none' }}>
              <CalendarIcon size={22} />
              Request Booking
            </button>
          )}
          
          <p style={{ margin: '12px 0 0 0', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.4 }}>
            <strong>Safety Disclaimer:</strong> Vicinity is a platform connecting students. We are not responsible or liable for any lost, stolen, or damaged items. Inspect all items thoroughly and proceed at your own risk.
          </p>
        </div>
      </div>

      {bookingSheetState !== 'none' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setBookingSheetState('none')}>
          <div 
            className="animate-slide-up" 
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '600px', background: 'var(--surface)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 -10px 40px rgba(0,0,0,0.2)' }}
          >
            {bookingSheetState === 'confirm' ? (
              <>
                <div style={{ width: '40px', height: '6px', background: 'var(--surface-border)', borderRadius: '3px', margin: '0 auto', marginBottom: '8px' }} />
                <h3 style={{ margin: 0, fontSize: '22px', fontWeight: 800 }}>Confirm Booking</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '15px' }}>
                  You are requesting to book <strong>{item.title}</strong>.
                </p>
                <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--surface-border)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>From</span>
                    <span style={{ fontWeight: 700 }}>{format(parseISO(startDate), 'MMM dd, yyyy')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>To</span>
                    <span style={{ fontWeight: 700 }}>{format(parseISO(endDate), 'MMM dd, yyyy')}</span>
                  </div>
                  <div style={{ height: '1px', background: 'var(--surface-border)', margin: '8px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Total</span>
                    <span style={{ fontWeight: 800, color: '#000', fontSize: '24px' }}>₹{calculateDays() * Number(item.price)}</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)' }}>Message / Offer to Owner (Optional)</label>
                  <textarea
                    value={bookingNote}
                    onChange={(e) => setBookingNote(e.target.value)}
                    placeholder="e.g. Hi, I'm a student too, would you be willing to do ₹500 total?"
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      padding: '16px',
                      borderRadius: '16px',
                      background: 'var(--surface-border)',
                      border: '1px solid var(--surface-border)',
                      color: 'var(--text-main)',
                      fontSize: '15px',
                      resize: 'none',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                <button onClick={handleConfirmBookRequest} style={{ width: '100%', padding: '18px', borderRadius: '16px', border: 'none', background: 'var(--primary)', color: '#fff', fontSize: '18px', fontWeight: 700, cursor: 'pointer', marginTop: '8px', boxShadow: 'var(--primary-glow)' }}>
                  Confirm Request
                </button>
              </>
            ) : (
              <div style={{ padding: '32px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '32px', background: 'rgba(34, 197, 94, 0.15)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={32} strokeWidth={3} />
                </div>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 800 }}>Request Sent!</h3>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '16px', lineHeight: 1.5 }}>
                    The owner has been notified. You can check the status in your <strong>My Bookings</strong> tab.
                  </p>
                </div>
                <button onClick={() => setBookingSheetState('none')} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: 'none', background: 'var(--surface-border)', color: 'var(--text-main)', fontSize: '16px', fontWeight: 700, cursor: 'pointer', marginTop: '16px' }}>
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showCancelConfirm && userRequest && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '24px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Cancel Request?</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '15px' }}>
              Are you sure you want to cancel your booking request for <strong>{item.title}</strong>? The owner will no longer see it.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button onClick={() => setShowCancelConfirm(false)} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', background: 'var(--surface-border)', color: 'var(--text-main)', fontSize: '16px', fontWeight: 600, cursor: 'pointer' }}>
                No, Keep it
              </button>
              <button 
                onClick={() => {
                  deleteRequest(userRequest.id);
                  setShowCancelConfirm(false);
                }} 
                style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', background: 'var(--danger)', color: '#fff', fontSize: '16px', fontWeight: 600, cursor: 'pointer' }}>
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
