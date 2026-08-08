import toast from 'react-hot-toast';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useFeed } from '../context/FeedContext';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { useSEO } from '../hooks/useSEO';
import { supabase, getStorageJson, setStorageJson } from '../lib/supabase';
import { ArrowRight, ChevronLeft, MessageCircle, Heart, Tag, X, ChevronRight, Bell, BadgeCheck, Star, Calendar as CalendarIcon, Wallet, ShieldCheck, CheckCircle2, Building2, Lock, Trash2, Share } from 'lucide-react';
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

// Reviews are fetched dynamically now

export default function ItemDetail() {
  const { id } = useParams();
  const { items, toggleLike, deletePost } = useFeed();
  const item = items.find(i => i.id === Number(id));
  useSEO(item?.title || 'Item Detail', item?.description || 'View item details on CampusRent');

  const navigate = useNavigate();
  const location = useLocation();
  const { getOrCreateConversation, conversations, sendMessage } = useChat();
  const { session, loading } = useAuth();
  const { createRequest, requests, updateRequestStatus } = useBookings();
  const [zoomImageIndex, setZoomImageIndex] = useState<number | null>(null);
  const [currentMainImageIndex, setCurrentMainImageIndex] = useState(0);
  const isInitialModalRender = useRef(false);
  const modalScrollRef = useRef<HTMLDivElement>(null);
  
  const [displayReviewsCount, setDisplayReviewsCount] = useState(5);
  const [detailTab, setDetailTab] = useState<'description' | 'reviews'>('description');
  const [reviews, setReviews] = useState<any[]>([]);
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [showReviewConfirm, setShowReviewConfirm] = useState(false);
  const [showWriteReview, setShowWriteReview] = useState(false);

  useEffect(() => {
    if (item) {
      const fetchReviews = async () => {
        const { data: reviewFiles } = await supabase.storage.from('item-images').list('item_reviews');
        if (reviewFiles && reviewFiles.length > 0) {
          const validFiles = reviewFiles.filter((f: any) => f.name.endsWith('.json'));
          const reviewPromises = validFiles.map(async (f: any) => {
            const urlData = supabase.storage.from('item-images').getPublicUrl(`item_reviews/${f.name}`);
            if (urlData.data?.publicUrl) {
              try {
                const res = await fetch(`${urlData.data.publicUrl}?t=${Date.now()}`);
                if (res.ok) {
                  const data = await res.json();
                  if (data.itemId === item.id.toString() || data.itemId === item.id) return data;
                }
              } catch (e) {}
            }
            return null;
          });
          const resolved = await Promise.all(reviewPromises);
          const validReviews = resolved.filter((r: any) => r != null);
          const uniqueReviews = Array.from(new Map(validReviews.map((r: any) => [r.id, r])).values()) as any[];
          setReviews(uniqueReviews.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        }
      };
      fetchReviews();
    }
  }, [item]);

  const handleSubmitReview = async () => {
    if (!session || !newReviewText.trim() || !item) return;
    setIsSubmittingReview(true);
    const timestamp = Date.now().toString();
    const reviewId = `${item.id}-${session.user.id}-${timestamp}`;
    const reviewData = {
      id: reviewId,
      itemId: item.id,
      userId: session.user.id,
      name: session.user.user_metadata?.full_name || 'User',
      initial: (session.user.user_metadata?.full_name || 'U').charAt(0),
      profilePic: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
      rating: newReviewRating,
      text: newReviewText,
      createdAt: new Date().toISOString()
    };
    await setStorageJson(`item_reviews/${reviewId}.json`, reviewData);
    setReviews(prev => [reviewData, ...prev]);
    setNewReviewText('');
    setIsSubmittingReview(false);
    setShowReviewConfirm(false);
    toast.success('Review added successfully!');
  };

  const handlePrevImage = () => {
    if (zoomImageIndex !== null && zoomImageIndex > 0) {
      const prevIdx = zoomImageIndex - 1;
      setZoomImageIndex(prevIdx);
      if (modalScrollRef.current) {
        modalScrollRef.current.scrollTo({
          left: prevIdx * window.innerWidth,
          behavior: 'smooth'
        });
      }
    }
  };

  const handleNextImage = () => {
    if (zoomImageIndex !== null && zoomImageIndex < allImages.length - 1) {
      const nextIdx = zoomImageIndex + 1;
      setZoomImageIndex(nextIdx);
      if (modalScrollRef.current) {
        modalScrollRef.current.scrollTo({
          left: nextIdx * window.innerWidth,
          behavior: 'smooth'
        });
      }
    }
  };

  useEffect(() => {
    if (zoomImageIndex !== null && isInitialModalRender.current && modalScrollRef.current) {
      modalScrollRef.current.scrollLeft = zoomImageIndex * window.innerWidth;
      isInitialModalRender.current = false;
    }
  }, [zoomImageIndex]);

  // Booking state has been refactored inline
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showChatLockedDialog, setShowChatLockedDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const [ownerProfile, setOwnerProfile] = useState<any>(null);
  const [verificationStatus, setVerificationStatus] = useState<string>('none');
  const [startDate, setStartDate] = useState(location.state?.startDate || '');
  const [endDate, setEndDate] = useState(location.state?.endDate || '');
  const [bookingNote, setBookingNote] = useState(location.state?.bookingNote || '');
  const [showBargainDialog, setShowBargainDialog] = useState(false);
  const [tempNote, setTempNote] = useState('');
  const [showConfirmSheet, setShowConfirmSheet] = useState(false);
  const [showSuccessSheet, setShowSuccessSheet] = useState(false);
  
  const isOwner = session?.user?.id === item?.userId;
  const userRequest = session && item ? requests.find(r => 
    r.item_id === item.id && 
    r.requester_id === session.user.id && 
    r.status !== 'rejected' && 
    r.status !== 'cancelled' &&
    !(r.status === 'accepted' && r.end_date && new Date(r.end_date).setHours(23, 59, 59, 999) < new Date().getTime())
  ) : null;
  const isBookingCompleted = userRequest?.status === 'accepted' && userRequest.end_date && new Date(userRequest.end_date).setHours(23, 59, 59, 999) < new Date().getTime();
  const chatExists = item && conversations.some(c => c.itemId === item.id && c.otherUserId === item.userId);

  const [ownerRating, setOwnerRating] = useState<string>('0');

  useEffect(() => {
    if (item?.userId) {
      getStorageJson(`profiles/${item.userId}.json`).then(profile => {
        if (profile) setOwnerProfile(profile);
      });
      getStorageJson('admin/verifications.json').then(verificationsData => {
        if (verificationsData && item.userId && verificationsData[item.userId]) {
          setVerificationStatus(verificationsData[item.userId].status);
        }
      });
      
      // Fetch Owner Reviews to calculate rating
      supabase.storage.from('item-images').list('reviews').then(({ data: reviewFiles }) => {
        if (reviewFiles) {
          const targetFiles = reviewFiles.filter(f => f.name.startsWith(item.userId + '-'));
          Promise.all(targetFiles.map(f => getStorageJson(`reviews/${f.name}`))).then(loaded => {
            const valid = loaded.filter(Boolean);
            if (valid.length > 0) {
              const total = valid.reduce((sum, rev) => sum + (rev.rating || 5), 0);
              setOwnerRating((total / valid.length).toFixed(1));
            } else {
              setOwnerRating('0');
            }
          });
        }
      });
    }
  }, [item?.userId]);

  if (loading) return null;

  if (!item) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <h2>Item not found</h2>
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
      navigate('/login', { state: { returnTo: location.pathname, startDate, endDate, bookingNote } });
      return;
    }
    if (!startDate || !endDate) return toast.error('Select dates');
    const days = differenceInDays(parseISO(endDate), parseISO(startDate));
    if (days < 0) return toast.error('End date must be after start date');
    
    setShowConfirmSheet(true);
  };

  const handleConfirmBookRequest = async () => {
    const totalDays = calculateDays();
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
      await sendMessage(convId, session!.user.id, `[Booking Request]: User has requested to book this item from ${format(parseISO(startDate), 'MMM d, yyyy')} to ${format(parseISO(endDate), 'MMM d, yyyy')} for ₹${item.price}/day.`);
    }
    setShowConfirmSheet(false);
    setShowSuccessSheet(true);
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const s = parseISO(startDate);
    const e = parseISO(endDate);
    if (!isValid(s) || !isValid(e)) return 0;
    const days = differenceInDays(e, s);
    return days < 0 ? 0 : days + 1;
  };


  const descriptionBlock = (
    <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.5, margin: 0 }}>
                {item.description || "No description provided for this item. It's currently available for rent in good condition! Reach out to the owner for more details."}
              </p>
  );

  const reviewsBlock = (
    <div style={{ paddingTop: '8px' }}>
<h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-main)' }}>Reviews ({reviews.length})</h3>
              
              {reviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                  No reviews yet. Be the first to review!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {reviews.slice(0, displayReviewsCount).map((review, index) => (
                    <div key={review.id} style={{ paddingBottom: '20px', borderBottom: index < Math.min(reviews.length, displayReviewsCount) - 1 ? '1px solid var(--surface-border)' : 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} size={14} fill={star <= review.rating ? "var(--warning)" : "transparent"} color={star <= review.rating ? "var(--warning)" : "var(--surface-border)"} />
                        ))}
                      </div>
                      <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                        {review.text}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        {review.profilePic ? (
                          <img src={review.profilePic} alt="" style={{ width: '20px', height: '20px', borderRadius: '10px', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '20px', height: '20px', borderRadius: '10px', background: index % 2 === 0 ? 'var(--primary)' : '#e5e7eb', color: index % 2 === 0 ? '#000' : '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '10px' }}>
                            {review.initial}
                          </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: 600 }}>
                            {review.name}
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            {format(new Date(review.createdAt), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {displayReviewsCount < reviews.length && (
                <button 
                  onClick={() => setDisplayReviewsCount(prev => prev + 5)}
                  style={{ width: '100%', marginTop: '16px', padding: '14px', background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--surface-border)', borderRadius: '16px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  Load More Reviews
                </button>
              )}

              {/* Write Review Form */}
              {session && !isOwner && (
                <div style={{ marginTop: '24px' }}>
                  {!showWriteReview ? (
                    <button 
                      onClick={() => setShowWriteReview(true)}
                      style={{ width: '100%', padding: '14px', background: 'var(--surface-border)', color: 'var(--text-main)', border: 'none', borderRadius: '16px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                      Click here to write a review about this product
                    </button>
                  ) : (
                    <div className="animate-slide-up" style={{ padding: '16px', background: 'var(--bg)', borderRadius: '16px', border: '1px solid var(--surface-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Write a Review</h4>
                        <button 
                          onClick={() => setShowWriteReview(false)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <X size={18} />
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star 
                            key={star} 
                            size={20} 
                            fill={star <= newReviewRating ? "var(--warning)" : "transparent"} 
                            color={star <= newReviewRating ? "var(--warning)" : "var(--surface-border)"} 
                            style={{ cursor: 'pointer' }}
                            onClick={() => setNewReviewRating(star)}
                          />
                        ))}
                      </div>
                      <textarea 
                        value={newReviewText}
                        onChange={e => setNewReviewText(e.target.value)}
                        placeholder="Share your experience..."
                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--surface-border)', background: 'var(--surface)', resize: 'vertical', minHeight: '80px', marginBottom: '12px', outline: 'none' }}
                      />
                      <button 
                        onClick={() => setShowReviewConfirm(true)}
                        disabled={isSubmittingReview || !newReviewText.trim()}
                        style={{ width: '100%', background: 'var(--primary)', color: '#000', border: 'none', padding: '12px 20px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', opacity: isSubmittingReview || !newReviewText.trim() ? 0.5 : 1 }}
                      >
                        {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            
              </div>
  );

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
        flexShrink: 0,
        zIndex: 50
      }}>
        <button 
          onClick={() => {
            if (window.history.state && window.history.state.idx > 0) {
              navigate(-1);
            } else {
              navigate('/', { replace: true });
            }
          }} 
          style={{ width: '40px', height: '40px', padding: 0, borderRadius: '20px', background: 'var(--surface)', border: '1px solid var(--surface-border)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--card-shadow)' }}
        >
          <ChevronLeft size={20} />
        </button>
        <h1 style={{ fontSize: '18px', margin: 0, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
          {item.title}
        </h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: item.title,
                  text: `Check out ${item.title} on CampusRent!`,
                  url: window.location.href,
                }).catch(console.error);
              } else {
                navigator.clipboard.writeText(window.location.href);
                toast.success('Link copied to clipboard!');
              }
            }} 
            style={{ width: '40px', height: '40px', padding: 0, borderRadius: '20px', background: 'var(--surface)', border: '1px solid var(--surface-border)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--card-shadow)' }}
          >
            <Share size={20} />
          </button>
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
        </div>
      </header>

      {/* Content */}
      <main style={{ flex: 1, overflowY: 'auto', paddingBottom: '200px' }}>
        <div className="item-detail-layout" style={{ maxWidth: '1000px', margin: '0 auto' }}>
          
          {/* Left Column: Images & Reviews */}
          <div className="item-detail-images">
            <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
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
                  <img src={img} alt={`${item.title} - ${i+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: item.status === 'booked' ? 0.5 : 1 }} />
                  {item.status === 'booked' && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 5, pointerEvents: 'none' }}>
                      <div style={{ background: 'rgba(255,255,255,0.9)', color: 'var(--text-main)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, border: '1px solid var(--surface-border)', marginBottom: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                        UNAVAILABLE
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div style={{ position: 'absolute', top: '16px', left: '16px', background: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: '16px', color: 'white', fontWeight: 700, backdropFilter: 'blur(8px)', pointerEvents: 'none', zIndex: 10 }}>
              {currentMainImageIndex + 1} / {allImages.length}
            </div>
            <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: '16px', color: 'white', fontWeight: 600, backdropFilter: 'blur(8px)', fontSize: '12px', pointerEvents: 'none', zIndex: 10 }}>
              Tap to Zoom
            </div>
            {item.itemRating != null && (
              <div style={{ position: 'absolute', bottom: '16px', left: '16px', background: '#ffffff', color: '#000000', padding: '6px 10px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 800, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 10, pointerEvents: 'none' }}>
                <span>{item.itemRating}</span>
                <Star size={14} fill="var(--success)" color="var(--success)" />
              </div>
            )}
            {/* Dots indicator */}
            {allImages.length > 1 && (
              <div style={{ position: 'absolute', bottom: '16px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '6px', pointerEvents: 'none' }}>
                {allImages.map((_, i) => (
                  <div key={i} style={{ width: '6px', height: '6px', borderRadius: '3px', background: i === currentMainImageIndex ? 'white' : 'rgba(255,255,255,0.4)', transition: 'all 0.2s' }} />
                ))}
              </div>
            )}
            </div>
            
            {/* Desktop View: Reviews Below Image */}
            <div className="desktop-only" style={{ marginTop: '32px' }}>
              {reviewsBlock}
            </div>
            
          </div>

          <div className="item-detail-info" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {userRequest?.status === 'accepted' ? (
                  <span style={{ display: 'inline-block', background: 'var(--success)', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.5px', alignSelf: 'flex-start', textTransform: 'uppercase' }}>RENTED BY YOU</span>
                ) : item.status === 'booked' && (
                  <span style={{ display: 'inline-block', background: 'var(--danger)', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.5px', alignSelf: 'flex-start' }}>BOOKED</span>
                )}
                <h1 style={{ fontSize: '20px', margin: 0, fontWeight: 700, lineHeight: 1.2 }}>{item.title}</h1>
              </div>
              <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--success)' }}>₹{item.price}<span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>/day</span></span>
            </div>
            
            {showReviewConfirm && createPortal(
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '24px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--surface)', border: '1px solid var(--surface-border)' }}>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Submit Review</h3>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.5 }}>
                    Are you sure you want to submit this review? This action cannot be undone.
                  </p>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <button 
                      onClick={() => setShowReviewConfirm(false)} 
                      disabled={isSubmittingReview}
                      style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', background: 'var(--surface-border)', color: 'var(--text-main)', fontSize: '16px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitReview}
                      disabled={isSubmittingReview}
                      style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', background: 'var(--success)', color: '#fff', fontSize: '16px', fontWeight: 600, cursor: 'pointer', opacity: isSubmittingReview ? 0.7 : 1 }}
                    >
                      {isSubmittingReview ? 'Submitting...' : 'Submit'}
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )}



            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'var(--primary-glow)', color: 'var(--text-main)', borderRadius: '16px', fontSize: '13px', fontWeight: 600 }}>
                <Tag size={14} /> {item.category}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'var(--surface)', border: '1px solid var(--surface-border)', color: 'var(--text-main)', borderRadius: '16px', fontSize: '13px', fontWeight: 600 }}>
                <Building2 size={14} /> {item.department || 'Unknown Department'}
              </span>
              {item.securityDeposit && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid var(--success)', color: 'var(--success)', borderRadius: '16px', fontSize: '13px', fontWeight: 600 }}>
                  <ShieldCheck size={14} /> ₹{item.securityDeposit} Security Deposit
                </span>
              )}
            </div>
            {item.securityDeposit && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', fontStyle: 'italic' }}>* Security deposit is fully refundable upon safe return.</div>
            )}

            
            {/* Mobile View: Tabs for Description and Reviews */}
            <div className="mobile-only">
            {/* Tabs for Description and Reviews */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--surface-border)', marginBottom: '24px', marginTop: '32px' }}>
              <button 
                onClick={() => setDetailTab('description')}
                style={{ 
                  flex: 1, 
                  background: 'none', 
                  border: 'none', 
                  padding: '12px', 
                  fontSize: '16px', 
                  fontWeight: 700, 
                  color: detailTab === 'description' ? 'var(--primary)' : 'var(--text-muted)',
                  borderBottom: detailTab === 'description' ? '2px solid var(--primary)' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Description
              </button>
              <button 
                onClick={() => setDetailTab('reviews')}
                style={{ 
                  flex: 1, 
                  background: 'none', 
                  border: 'none', 
                  padding: '12px', 
                  fontSize: '16px', 
                  fontWeight: 700, 
                  color: detailTab === 'reviews' ? 'var(--primary)' : 'var(--text-muted)',
                  borderBottom: detailTab === 'reviews' ? '2px solid var(--primary)' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Reviews ({reviews.length})
              </button>
            </div>


              {detailTab === 'description' ? descriptionBlock : reviewsBlock}
            </div>
            
            {/* Desktop View: Description Only */}
            <div className="desktop-only" style={{ marginTop: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-main)' }}>Description</h3>
              {descriptionBlock}
            </div>



            {/* User's Booking Information */}
            {userRequest && (
              <div style={{
                marginTop: '20px',
                padding: '24px',
                borderRadius: '24px',
                background: userRequest.status === 'accepted' 
                  ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)' 
                  : 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
                border: `1px solid ${userRequest.status === 'accepted' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                boxShadow: '0 8px 32px rgba(0,0,0,0.05)'
              }}>
                <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>

                  <span style={{
                    padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px',
                    background: isBookingCompleted ? 'var(--primary)' : (userRequest.status === 'accepted' ? 'var(--success)' : 'var(--warning)'),
                    color: '#fff',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    {isBookingCompleted ? 'Completed' : userRequest.status}
                  </span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--surface)', padding: '20px', borderRadius: '16px', border: '1px solid var(--surface-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ background: 'var(--bg)', padding: '10px', borderRadius: '12px', color: 'var(--primary)' }}>
                      <CalendarIcon size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '13px', marginBottom: '4px' }}>Dates</span>
                      <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-main)', display: 'block' }}>
                        {userRequest.start_date ? format(parseISO(userRequest.start_date), 'dd MMM yyyy') : ''}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '2px 0', display: 'block' }}>to</span>
                      <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-main)', display: 'block' }}>
                        {userRequest.end_date ? format(parseISO(userRequest.end_date), 'dd MMM yyyy') : ''}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ height: '1px', background: 'var(--surface-border)', width: '100%' }}></div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ background: 'var(--bg)', padding: '10px', borderRadius: '12px', color: 'var(--primary)' }}>
                      <Wallet size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '13px', marginBottom: '4px' }}>Total Price</span>
                      <span style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '20px' }}>
                        ₹{userRequest.total_price}
                      </span>
                    </div>
                  </div>
                </div>
                
                {userRequest.status === 'pending' && (
                  <p style={{ margin: '16px 0 0', fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic' }}>
                    Waiting for owner approval. They will review your request soon.
                  </p>
                )}
                {userRequest.status === 'accepted' && !isBookingCompleted && (
                  <p style={{ margin: '16px 0 0', fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic' }}>
                    Your booking is confirmed! Reach out to the owner to coordinate.
                  </p>
                )}
                {isBookingCompleted && (
                  <p style={{ margin: '16px 0 0', fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic' }}>
                    This booking has been completed.
                  </p>
                )}
                {userRequest.note && (
                  <div style={{ margin: '16px 0 0', padding: '16px', borderRadius: '16px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid var(--success)' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 700, color: 'var(--success)' }}>Your Message / Offer:</p>
                    <p style={{ margin: 0, fontSize: '15px', color: 'var(--text-main)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>"{userRequest.note}"</p>
                  </div>
                )}
              </div>
            )}

            {/* Booking Calendar Section */}
            {!isOwner && !userRequest && item.status === 'available' && (
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
                  disabled={!!userRequest}
                />

                {startDate && endDate && calculateDays() > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
                      ₹{item.price} x {calculateDays()} {calculateDays() === 1 ? 'day' : 'days'}
                    </span>
                    <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--success)' }}>
                      ₹{calculateDays() * Number(item.price)}
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                  {!bookingNote ? (
                    <button
                      onClick={() => {
                        setTempNote('');
                        setShowBargainDialog(true);
                      }}
                      style={{
                        width: '100%',
                        padding: '14px',
                        borderRadius: '16px',
                        background: 'rgba(34, 197, 94, 0.1)',
                        color: 'var(--success)',
                        border: '1px dashed var(--success)',
                        fontWeight: 700,
                        fontSize: '15px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <MessageCircle size={18} /> Send a bargain request
                    </button>
                  ) : (
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)',
                      border: '1px solid var(--success)',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      boxShadow: '0 4px 12px rgba(34, 197, 94, 0.1)',
                      borderLeft: '4px dashed var(--success)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingTop: '2px' }}>
                          <MessageCircle size={16} color="var(--success)" style={{ flexShrink: 0 }} />
                          <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--success)', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Bargain Request Attached
                          </span>
                        </div>
                        <button
                          onClick={() => setBookingNote('')}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: 0, width: '24px', height: '24px', minWidth: '24px', minHeight: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                        >
                          <X size={18} />
                        </button>
                      </div>
                      <span style={{ fontSize: '14px', color: 'var(--text-main)', fontStyle: 'italic', whiteSpace: 'pre-wrap', paddingLeft: '22px' }}>
                        "{bookingNote}"
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Seller Trust Profile */}
            {!isOwner && item.seller && (
              <div 
                onClick={() => navigate('/user/' + (item.userId || 'user-123'), { state: { avatar_url: ownerProfile?.avatar_url || null } })}
                className="glass-panel" 
                style={{ marginTop: '20px', padding: '20px', borderRadius: '20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '16px' }}
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
                      {verificationStatus === 'approved' && (
                        <BadgeCheck size={20} fill="#1877F2" color="white" />
                      )}
                    </div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                       <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Joined {item.seller.memberSince}</span>
                       <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>•</span>
                       <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600 }}>
                         <Star size={14} fill="var(--warning)" color="var(--warning)" />
                         <span style={{ color: 'var(--warning)' }}>{ownerRating !== '0' ? ownerRating : '0.0'}</span>
                       </span>
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
          background: 'rgba(0,0,0,0.95)', zIndex: 1000,
          display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1002, position: 'absolute', top: 0, left: 0, right: 0 }}>
            <span style={{ color: 'white', fontWeight: 600 }}>{zoomImageIndex + 1} / {allImages.length}</span>
            <button 
              onClick={() => setZoomImageIndex(null)}
              style={{ width: '56px', height: '56px', borderRadius: '28px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={32} />
            </button>
          </div>
          
          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', width: '100vw', height: '100%' }}>
            <div 
              ref={modalScrollRef}
              style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', overflowX: 'auto', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
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

            {/* Left Arrow Button */}
            {zoomImageIndex > 0 && (
              <button 
                onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', width: '56px', height: '56px', borderRadius: '28px', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 1005 }}
              >
                <ChevronLeft size={36} color="white" />
              </button>
            )}

            {/* Right Arrow Button */}
            {zoomImageIndex < allImages.length - 1 && (
              <button 
                onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', width: '56px', height: '56px', borderRadius: '28px', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 1005 }}
              >
                <ChevronRight size={36} color="white" />
              </button>
            )}
          </div>

          <div style={{ position: 'absolute', bottom: '20px', left: 0, right: 0, textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: '14px', pointerEvents: 'none', zIndex: 1002 }}>
            Swipe or use buttons to change, pinch to zoom
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
        <div style={{ maxWidth: '400px', margin: '0 auto', width: '100%' }}>
          {isOwner ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
              <button onClick={() => navigate(`/edit/${item.id}`)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '16px', fontSize: '16px', borderRadius: '20px', background: 'var(--surface-border)', color: 'var(--text-main)', border: 'none', width: '100%', cursor: 'pointer', fontWeight: 700 }}>
                Edit Your Item
              </button>
              <button onClick={async () => {
                  if (window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
                    try {
                      await deletePost(item.id);
                      toast.success('Listing deleted');
                      navigate(-1);
                    } catch (e) {
                      // error handled in context
                    }
                  }
                }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px', fontSize: '16px', borderRadius: '20px', background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)', width: '100%', cursor: 'pointer', fontWeight: 700 }}>
                <Trash2 size={18} />
                Delete Listing
              </button>
            </div>
          ) : isBookingCompleted ? (
            <div style={{ padding: '18px', background: 'var(--surface)', color: 'var(--text-main)', borderRadius: '24px', textAlign: 'center', border: '1px solid var(--surface-border)' }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><BadgeCheck size={18} color="var(--primary)" /> Booking Completed</p>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>You booked this from {userRequest?.start_date ? format(parseISO(userRequest.start_date), 'dd MMM') : ''} to {userRequest?.end_date ? format(parseISO(userRequest.end_date), 'dd MMM') : ''}</p>
            </div>
          ) : userRequest?.status === 'accepted' ? (
            <button onClick={handleMessageClick} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', fontSize: '14px', borderRadius: '20px', background: 'var(--text-main)', color: 'var(--surface)', boxShadow: 'none', cursor: 'pointer', border: 'none', fontWeight: 700 }}>
              <MessageCircle size={18} />
              Chat with Owner
            </button>
          ) : userRequest?.status === 'pending' ? (
            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <button 
                onClick={chatExists ? handleMessageClick : () => setShowChatLockedDialog(true)}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', fontSize: '14px', borderRadius: '20px', background: chatExists ? 'var(--text-main)' : 'var(--surface-border)', color: chatExists ? 'var(--surface)' : 'var(--text-muted)', boxShadow: 'none', cursor: 'pointer', border: 'none', fontWeight: 700 }}
              >
                <MessageCircle size={18} />
                {chatExists ? 'Chat with Owner' : 'Chat Locked'}
              </button>
              <button 
                onClick={() => setShowCancelConfirm(true)}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', fontSize: '14px', borderRadius: '20px', background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)', boxShadow: 'none', cursor: 'pointer', fontWeight: 700 }}>
                <X size={18} />
                Withdraw
              </button>
            </div>
          ) : item.status === 'booked' ? (
            <button onClick={() => toast.success("You'll be notified when this item becomes available again!")} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '18px', fontSize: '18px', borderRadius: '24px', background: 'var(--primary-glow)', color: 'var(--primary)', border: 'none', boxShadow: 'none', width: '100%', cursor: 'pointer' }}>
              <Bell size={22} />
              Notify Me
            </button>
          ) : (
            <button 
              onClick={handleRequestClick} 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '18px', fontSize: '18px', borderRadius: '24px', background: 'var(--primary)', color: '#000', boxShadow: 'var(--primary-glow)', width: '100%', cursor: 'pointer', border: 'none', fontWeight: 800 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'center' }}>
                <CalendarIcon size={20} />
                Request Booking
              </span>
              <ArrowRight size={20} style={{ opacity: 0.8 }} />
            </button>
          )}
        </div>
      </div>

      {showCancelConfirm && userRequest && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '24px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Withdraw Request?</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '15px' }}>
              Are you sure you want to withdraw your request for <strong>{item.title}</strong>? The owner will no longer see it.
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
              <button onClick={() => { setShowCancelConfirm(false); setCancelReason(''); }} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', background: 'var(--surface-border)', color: 'var(--text-main)', fontSize: '16px', fontWeight: 600, cursor: 'pointer' }}>
                No, Keep it
              </button>
              <button 
                onClick={async () => {
                  const rolePrefix = `[Cancelled by rentee] `;
                  const formattedReason = cancelReason.trim() ? `${rolePrefix}${cancelReason.trim()}` : rolePrefix;
                  await updateRequestStatus(userRequest.id, 'cancelled', undefined, formattedReason);
                  
                  // Send automated message
                  const ownerId = item.userId || `user-${item.id}`;
                  const convId = getOrCreateConversation(item.id, item.title, item.image, ownerId, ownerName);
                  if (convId && session?.user?.id && session?.user?.user_metadata?.full_name) {
                    const reasonText = cancelReason.trim() ? `\nReason: ${cancelReason.trim()}` : '';
                    await sendMessage(convId, session.user.id, `[System]: Booking request was withdrawn by ${session.user.user_metadata.full_name}.${reasonText}`);
                  }
                  
                  setShowCancelConfirm(false);
                  setCancelReason('');
                }} 
                style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', background: 'var(--danger)', color: '#fff', fontSize: '16px', fontWeight: 600, cursor: 'pointer' }}>
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showChatLockedDialog && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setShowChatLockedDialog(false)}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '360px', padding: '24px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center', background: 'var(--surface)', border: '1px solid var(--surface-border)' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: '56px', height: '56px', borderRadius: '28px', background: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
              <Lock size={28} />
            </div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Chat is Locked</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.5 }}>
              To prevent spam, chat is disabled until the owner accepts your booking request. Once accepted, you can message the owner directly!
            </p>
            <button 
              onClick={() => setShowChatLockedDialog(false)} 
              style={{ width: '100%', padding: '14px', borderRadius: '16px', border: 'none', background: 'var(--primary)', color: '#000', fontSize: '16px', fontWeight: 700, cursor: 'pointer', marginTop: '8px' }}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Confirm Bottom Sheet */}
      <div className={`bottom-sheet-overlay ${showConfirmSheet ? 'visible' : ''}`} onClick={() => setShowConfirmSheet(false)}></div>
      <div className={`bottom-sheet ${showConfirmSheet ? 'visible' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', margin: 0, fontWeight: 800 }}>Confirm Request</h2>
          <button onClick={() => setShowConfirmSheet(false)} style={{ background: 'var(--surface-border)', border: 'none', width: '40px', height: '40px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-main)', padding: 0 }}>
            <X size={24} />
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', background: 'var(--surface)', padding: '12px', borderRadius: '16px', border: '1px solid var(--surface-border)' }}>
          <img src={item.image} alt={item.title} style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover' }} />
          <div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '16px' }}>{item.title}</h3>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--success)' }}>₹{item.price} / day</p>
          </div>
        </div>

        <div style={{ background: 'var(--surface)', padding: '16px', borderRadius: '16px', marginBottom: '20px', border: '1px solid var(--surface-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--surface-border)' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '14px' }}>Duration</span>
            <span style={{ fontWeight: 600, fontSize: '14px' }}>{calculateDays()} Days</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--surface-border)' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '14px' }}>Dates</span>
            <span style={{ fontWeight: 600, fontSize: '14px' }}>
              {startDate ? format(parseISO(startDate), 'MMM d') : ''} - {endDate ? format(parseISO(endDate), 'MMM d') : ''}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--surface-border)' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '14px' }}>Platform Fee</span>
            <span style={{ fontWeight: 600, fontSize: '14px' }}>₹0</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--surface-border)' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '14px' }}>GST</span>
            <span style={{ fontWeight: 600, fontSize: '14px' }}>₹0</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: 'var(--text-main)', fontSize: '16px', fontWeight: 700 }}>Total Amount</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>{calculateDays()} {calculateDays() === 1 ? 'day' : 'days'} × ₹{item.price}</span>
            </div>
            <span style={{ color: 'var(--success)', fontSize: '20px', fontWeight: 800 }}>₹{calculateDays() * Number(item.price)}</span>
          </div>
        </div>

        <button 
          onClick={handleConfirmBookRequest}
          style={{ width: '100%', padding: '18px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '16px', fontSize: '18px', fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--primary-glow)' }}
        >
          Confirm & Send Request
        </button>
      </div>

      {/* Success Bottom Sheet */}
      <div className={`bottom-sheet-overlay ${showSuccessSheet ? 'visible' : ''}`} onClick={() => setShowSuccessSheet(false)}></div>
      <div className={`bottom-sheet ${showSuccessSheet ? 'visible' : ''}`} style={{ textAlign: 'center', padding: '40px 24px' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '40px', background: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <CheckCircle2 size={40} />
        </div>
        <h2 style={{ fontSize: '28px', margin: '0 0 12px 0', fontWeight: 800 }}>Request Sent!</h2>
        <p style={{ fontSize: '16px', color: 'var(--text-muted)', margin: '0 0 32px 0', lineHeight: 1.5 }}>
          The owner will review your request. We'll notify you as soon as they accept.
        </p>
        <button 
          onClick={() => setShowSuccessSheet(false)}
          style={{ width: '100%', padding: '18px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '16px', fontSize: '18px', fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--primary-glow)' }}
        >
          Got it
        </button>
      </div>

      {/* Bargain Dialog */}
      {showBargainDialog && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '24px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: 'var(--success)' }}>
              Bargain Request
            </h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.5 }}>
              Type your custom message or offer to the owner. This will be sent along with your booking request.
            </p>
            
            <textarea
              value={tempNote}
              onChange={e => setTempNote(e.target.value)}
              placeholder="e.g. Hi, I'm a student too, would you be willing to do ₹500 total?"
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '16px',
                borderRadius: '16px',
                background: 'var(--bg)',
                border: '1px solid var(--surface-border)',
                color: 'var(--text-main)',
                fontFamily: 'inherit',
                fontSize: '15px',
                resize: 'none'
              }}
            />
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button 
                onClick={() => setShowBargainDialog(false)}
                style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid var(--surface-border)', background: 'transparent', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setBookingNote(tempNote);
                  setShowBargainDialog(false);
                }}
                disabled={!tempNote.trim()}
                style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: 'var(--success)', color: '#fff', fontWeight: 600, cursor: 'pointer', opacity: !tempNote.trim() ? 0.5 : 1 }}
              >
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </>
  );
}
