import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFeed } from '../context/FeedContext';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { getStorageJson } from '../lib/supabase';
import { ChevronLeft, MessageCircle, Heart, Tag, ShieldCheck, X, ChevronRight, Bell, BadgeCheck, Star, MapPin, Calendar, CheckCircle } from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { useBookings } from '../context/BookingContext';
import { differenceInDays, parseISO, isValid } from 'date-fns';

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { items, toggleLike } = useFeed();
  const { getOrCreateConversation } = useChat();
  const { session, loading } = useAuth();
  const { createRequest, requests } = useBookings();
  const [zoomImageIndex, setZoomImageIndex] = useState<number | null>(null);
  const [ownerVerified, setOwnerVerified] = useState(false);
  const [ownerProfile, setOwnerProfile] = useState<any>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const item = items.find(i => i.id === Number(id));
  const isOwner = session?.user?.id === item?.userId;
  const userRequest = session && item ? requests.find(r => r.item_id === item.id && r.requester_id === session.user.id) : null;

  useEffect(() => {
    if (item?.userId) {
      getStorageJson('admin/approvals.json').then(apps => {
        if (apps && Array.isArray(apps) && apps.includes(item.userId)) {
          setOwnerVerified(true);
        }
      });
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

  const allImages = [item.image, ...(item.images || [])];
  
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

  const handleBookRequest = async () => {
    if (!session) {
      navigate('/login');
      return;
    }
    if (!startDate || !endDate) return alert('Select dates');
    const days = differenceInDays(parseISO(endDate), parseISO(startDate));
    if (days < 0) return alert('End date must be after start date');
    const totalDays = days === 0 ? 1 : days;
    const totalPrice = totalDays * Number(item.price);

    await createRequest({
      item_id: item.id,
      requester_id: session.user.id,
      owner_id: item.userId || `user-${item.id}`,
      start_date: startDate,
      end_date: endDate,
      total_price: totalPrice,
    });
    setStartDate('');
    setEndDate('');
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
          
          {/* Main Image */}
          <div 
            onClick={() => setZoomImageIndex(0)}
            style={{ width: '100%', aspectRatio: '4/3', position: 'relative', cursor: 'pointer' }}
          >
            <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', bottom: '16px', left: '16px', background: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: '16px', color: 'white', fontWeight: 700, backdropFilter: 'blur(8px)' }}>
              1 / {allImages.length}
            </div>
            <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: '16px', color: 'white', fontWeight: 600, backdropFilter: 'blur(8px)', fontSize: '12px' }}>
              Tap to Zoom
            </div>
          </div>

          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {item.status === 'booked' && (
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

            {/* Other Images */}
            {item.images && item.images.length > 0 && (
              <div style={{ marginTop: '32px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>More Photos</h3>
                <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }} className="hide-scrollbar">
                  {item.images.map((img, idx) => (
                    <img 
                      key={idx} 
                      onClick={() => setZoomImageIndex(idx + 1)}
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
              <div 
                onClick={() => navigate('/user/' + (item.userId || 'user-123'))}
                className="glass-panel" 
                style={{ marginTop: '32px', padding: '20px', borderRadius: '20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '16px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Meet the Owner</h3>
                  <ChevronRight size={20} color="var(--text-muted)" />
                </div>
                
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '30px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 700, color: 'var(--text-main)' }}>
                    {ownerName.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>{ownerName}</h4>
                      {ownerVerified ? (
                        <BadgeCheck size={20} fill="#1877F2" color="white" />
                      ) : (
                        <ShieldCheck size={18} color="var(--success)" />
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Joined {item.seller.memberSince}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Booking Calendar Section */}
            <div className="glass-panel" style={{ marginTop: '32px', padding: '24px', borderRadius: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={20} /> Reserve Dates
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>From</label>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{ padding: '12px', borderRadius: '12px', border: '1px solid var(--surface-border)', background: 'var(--surface)', color: 'var(--text-main)', outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>To</label>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{ padding: '12px', borderRadius: '12px', border: '1px solid var(--surface-border)', background: 'var(--surface)', color: 'var(--text-main)', outline: 'none' }}
                  />
                </div>
              </div>

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

              <button 
                onClick={handleBookRequest}
                disabled={!startDate || !endDate || calculateDays() === 0}
                style={{ 
                  width: '100%', 
                  padding: '16px', 
                  borderRadius: '16px', 
                  background: (!startDate || !endDate || calculateDays() === 0) ? 'var(--surface-border)' : 'var(--text-main)', 
                  color: (!startDate || !endDate || calculateDays() === 0) ? 'var(--text-muted)' : 'var(--surface)', 
                  fontSize: '16px', 
                  fontWeight: 700, 
                  border: 'none', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '8px',
                  transition: '0.2s',
                  cursor: (!startDate || !endDate || calculateDays() === 0) ? 'not-allowed' : 'pointer'
                }}
              >
                <CheckCircle size={20} />
                Request to Book
              </button>
            </div>

          </div>
        </div>
      </main>

      {/* Image Zoom Modal */}
      {zoomImageIndex !== null && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.95)', zIndex: 100,
          display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 101 }}>
            <span style={{ color: 'white', fontWeight: 600 }}>{zoomImageIndex + 1} / {allImages.length}</span>
            <button 
              onClick={() => setZoomImageIndex(null)}
              style={{ width: '40px', height: '40px', borderRadius: '20px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={24} />
            </button>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
            <TransformWrapper initialScale={1} minScale={0.5} maxScale={4} centerOnInit>
              <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
                <img src={allImages[zoomImageIndex]} alt="Zoomed" style={{ maxWidth: '100vw', maxHeight: '70vh', objectFit: 'contain' }} />
              </TransformComponent>
            </TransformWrapper>
            
            {zoomImageIndex > 0 && (
              <button onClick={() => setZoomImageIndex(i => (i !== null ? i - 1 : 0))} style={{ position: 'absolute', left: 10, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', padding: '10px', color: 'white', border: 'none' }}>
                <ChevronLeft size={24} />
              </button>
            )}
            {zoomImageIndex < allImages.length - 1 && (
              <button onClick={() => setZoomImageIndex(i => (i !== null ? i + 1 : 0))} style={{ position: 'absolute', right: 10, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', padding: '10px', color: 'white', border: 'none' }}>
                <ChevronRight size={24} />
              </button>
            )}
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
          {isOwner ? (
            <button onClick={() => navigate(`/edit/${item.id}`)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '18px', fontSize: '18px', borderRadius: '24px', background: 'var(--surface-border)', color: 'var(--text-main)', border: 'none', width: '100%', cursor: 'pointer' }}>
              Edit Your Item
            </button>
          ) : item.status === 'booked' ? (
            <button onClick={() => alert("You'll be notified when this item becomes available again!")} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '18px', fontSize: '18px', borderRadius: '24px', background: 'var(--primary-glow)', color: 'var(--primary)', border: 'none', boxShadow: 'none', width: '100%', cursor: 'pointer' }}>
              <Bell size={22} />
              Notify Me
            </button>
          ) : userRequest?.status === 'accepted' ? (
            <button onClick={handleMessageClick} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '18px', fontSize: '18px', borderRadius: '24px', background: 'var(--text-main)', color: 'var(--surface)', boxShadow: 'none', width: '100%', cursor: 'pointer', border: 'none' }}>
              <MessageCircle size={22} />
              Message Owner
            </button>
          ) : userRequest?.status === 'pending' ? (
            <button disabled style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '18px', fontSize: '18px', borderRadius: '24px', background: 'var(--surface-border)', color: 'var(--text-muted)', boxShadow: 'none', width: '100%', cursor: 'not-allowed', border: 'none' }}>
              Booking Pending Approval...
            </button>
          ) : userRequest?.status === 'rejected' ? (
            <button disabled style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '18px', fontSize: '18px', borderRadius: '24px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', boxShadow: 'none', width: '100%', cursor: 'not-allowed', border: 'none' }}>
              Booking Request Declined
            </button>
          ) : (
            <button onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '18px', fontSize: '18px', borderRadius: '24px', background: 'var(--primary)', color: '#fff', boxShadow: 'var(--primary-glow)', width: '100%', cursor: 'pointer', border: 'none' }}>
              <Calendar size={22} />
              Request Booking
            </button>
          )}
          
          <p style={{ margin: '12px 0 0 0', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.4 }}>
            <strong>Safety Disclaimer:</strong> Vicinity is a platform connecting students. We are not responsible or liable for any lost, stolen, or damaged items. Inspect all items thoroughly and proceed at your own risk.
          </p>
        </div>
      </div>

    </div>
  );
}
