import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSEO } from '../hooks/useSEO';
import { LoadingDialog } from '../components/LoadingDialog';

import { useFeed } from '../context/FeedContext';
import { supabase, getStorageJson, setStorageJson } from '../lib/supabase';
import { ChevronLeft, Star, AlertTriangle, BadgeCheck, X, Send, Building, AlignLeft, Mail } from 'lucide-react';

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { avatar_url?: string } | null;
  const { session } = useAuth();
  const { items } = useFeed();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  const userItems = items.filter(item => item.userId === id);

  useSEO(profile?.name || 'User Profile', `View ${profile?.name || 'user'}'s profile and items on CampusRent`);

  const [reviews, setReviews] = useState<any[]>([]);
  const [displayReviewsCount, setDisplayReviewsCount] = useState(5);
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Report State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Scam / Fraud');
  const [reportDesc, setReportDesc] = useState('');
  const [reporting, setReporting] = useState(false);


  const [verificationStatus, setVerificationStatus] = useState<string>('none');

  useEffect(() => {
    if (!id) return;
    
    const fetchUserData = async () => {


      // Fetch Profile Data
      const pData = await getStorageJson(`profiles/${id}.json`);

      // Fetch Reviews from Storage
      const { data: reviewFiles } = await supabase.storage.from('item-images').list('reviews');
      let loadedReviews: any[] = [];
      if (reviewFiles) {
        // Filter reviews for this specific user ID
        const targetFiles = reviewFiles.filter(f => f.name.startsWith(id + '-'));
        loadedReviews = await Promise.all(
          targetFiles.map(async f => await getStorageJson(`reviews/${f.name}`))
        );
        loadedReviews = loadedReviews.filter(Boolean).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setReviews(loadedReviews);
      }
      
      let computedRating = '5.0';
      if (loadedReviews.length > 0) {
        const total = loadedReviews.reduce((sum, rev) => sum + (rev.rating || 5), 0);
        computedRating = (total / loadedReviews.length).toFixed(1);
      }

      // Fetch Verifications
      const verificationsData = await getStorageJson('admin/verifications.json');
      if (verificationsData && verificationsData[id]) {
        setVerificationStatus(verificationsData[id].status);
      }

      if (pData) {
        setProfile({ ...pData, rating: computedRating });
      } else {
        setProfile({
          name: 'User ' + (id ? id.substring(0, 5) : ''),
          memberSince: new Date().getFullYear().toString(),
          verifications: ['Email Confirmed'],
          rating: computedRating
        });
      }
      
      setLoading(false);
    };

    fetchUserData();
  }, [id]);



  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id || !id) return;
    setReporting(true);
    try {
      const report = {
        reportedUserId: id,
        reporterId: session.user.id,
        reason: reportReason,
        description: reportDesc,
        timestamp: new Date().toISOString()
      };
      await setStorageJson(`reports/${id}-${session.user.id}-${Date.now()}.json`, report);
      toast.success('Report submitted successfully. Admins will review it shortly.');
      setShowReportModal(false);
    } catch (err) {
      toast.error('Failed to submit report');
    }
    setReporting(false);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id || !id) {
      toast.error('Please log in to write a review');
      return;
    }
    if (!newReviewText.trim()) return;

    setSubmittingReview(true);
    try {
      const reviewObj = {
        reviewerId: session.user.id,
        text: newReviewText,
        rating: newReviewRating,
        timestamp: new Date().toISOString(),
        reviewerName: session.user.user_metadata?.full_name || 'A user'
      };
      
      await setStorageJson(`reviews/${id}-${session.user.id}-${Date.now()}.json`, reviewObj);
      
      const newReviews = [reviewObj, ...reviews];
      setReviews(newReviews);
      
      let computedRating = '5.0';
      if (newReviews.length > 0) {
        const total = newReviews.reduce((sum, rev) => sum + (rev.rating || 5), 0);
        computedRating = (total / newReviews.length).toFixed(1);
      }
      setProfile((prev: any) => prev ? { ...prev, rating: computedRating } : null);

      setNewReviewText('');
      setNewReviewRating(5);
      toast.success('Review posted successfully!');
    } catch (err) {
      toast.error('Failed to post review');
    }
    setSubmittingReview(false);
  };

  const avgRating = reviews.length > 0 ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length) : 0;

  if (loading) {
    return <LoadingDialog message="Loading profile..." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg-color)', overflowY: 'auto' }} className="animate-slide-in">
      
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, display: 'flex', justifyContent: 'center', background: 'var(--surface)', borderBottom: '1px solid var(--surface-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', width: '100%', maxWidth: '600px' }}>
          <div onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '20px', marginLeft: '-8px', boxShadow: 'none' }}>
            <ChevronLeft size={28} />
          </div>
          <h1 style={{ flex: 1, textAlign: 'center', margin: 0, fontSize: '18px', fontWeight: 700, marginRight: '32px' }}>Profile</h1>
        </div>
      </div>

      <div style={{ padding: '24px', maxWidth: '600px', width: '100%', margin: '0 auto' }}>
        
        {/* User Card */}
        <div className="glass-panel" style={{ padding: '32px 24px', borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '96px', height: '96px', borderRadius: '48px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '16px', position: 'relative' }}>
            {(() => {
              const avatarUrl = profile?.avatar_url || state?.avatar_url || (session?.user?.id === id ? session?.user?.user_metadata?.avatar_url || session?.user?.user_metadata?.picture : null);
              if (avatarUrl) {
                return <img src={avatarUrl} alt="Profile" style={{ width: '96px', height: '96px', borderRadius: '48px', objectFit: 'cover' }} />;
              }
              return profile?.name?.charAt(0)?.toUpperCase() || 'U';
            })()}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', marginBottom: '4px', width: '100%' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', maxWidth: '100%', padding: '0 16px' }}>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile?.name}</span>
              {verificationStatus === 'approved' && (
                <BadgeCheck size={24} fill="#1877F2" color="white" style={{ flexShrink: 0 }} />
              )}
            </h2>
            {session?.user?.id === id && session?.user?.email && (
              <div title={session.user.email} style={{ margin: 0, color: 'var(--text-muted)', fontSize: '15px', maxWidth: '100%', padding: '0 24px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                <Mail size={16} />
                {session.user.email}
              </div>
            )}
            {profile?.department && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '15px', marginTop: '4px' }}>
                <Building size={16} />
                <span>{profile.department}</span>
              </div>
            )}
            {profile?.bio && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', color: 'var(--text-main)', fontSize: '15px', marginTop: '12px', maxWidth: '85%', textAlign: 'left' }}>
                <AlignLeft size={16} style={{ marginTop: '2px', flexShrink: 0, color: 'var(--text-muted)' }} />
                <span style={{ lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{profile.bio}</span>
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', color: 'var(--text-muted)', fontSize: '15px', marginTop: '8px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Star size={16} fill="var(--warning)" color="var(--warning)" /> {avgRating > 0 ? avgRating.toFixed(1) : '(0)'} 
            </span>
            <span>•</span>
            <span>Joined {profile?.memberSince}</span>
          </div>
        </div>

        {/* Other Items Section */}
        {userItems.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Other items by {profile?.name || 'this user'}</h3>
            <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px', margin: '0 -24px', paddingLeft: '24px', paddingRight: '24px', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
              {userItems.slice(0, 5).map(item => (
                <div 
                  key={item.id} 
                  onClick={() => navigate(`/item/${item.id}`)}
                  style={{ 
                    minWidth: '160px',
                    width: '160px',
                    flexShrink: 0,
                    background: 'var(--surface)', 
                    borderRadius: '0', 
                    border: '1px solid var(--surface-border)', 
                    overflow: 'hidden', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    position: 'relative',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ position: 'relative', height: '120px' }}>
                    <img 
                      src={item.images && item.images.length > 0 ? item.images[0] : item.image} 
                      alt={item.title} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', opacity: item.status === 'booked' ? 0.5 : 1 }}
                    />
                    {item.status === 'booked' && (
                      <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(255,255,255,0.9)', color: 'var(--text-main)', padding: '4px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: 800, border: '1px solid var(--surface-border)' }}>
                        UNAVAILABLE
                      </div>
                    )}
                  </div>
                  
                  <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', background: 'var(--primary-glow)', color: '#000', padding: '2px 6px', borderRadius: '4px', marginBottom: '2px' }}>
                        {item.category || 'Category'}
                      </span>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', width: '100%' }}>{item.title}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--success)' }}>
                          ₹{item.price}<span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>/day</span>
                        </div>
                        {item.itemRating != null && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--warning)', fontWeight: 700 }}>
                            ⭐ {item.itemRating}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {userItems.length > 5 && (
                <div 
                  onClick={() => navigate(`/user/${id}/items`)}
                  className="glass-panel"
                  style={{ minWidth: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '24px', cursor: 'pointer', padding: '16px', textAlign: 'center', flexShrink: 0 }}
                >
                  <div style={{ width: '48px', height: '48px', borderRadius: '24px', background: 'var(--surface-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                    <ChevronLeft size={24} style={{ transform: 'rotate(180deg)' }} />
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 700 }}>View More</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Reviews ({reviews.length})</h3>
          
          {reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', background: 'var(--surface)', borderRadius: '16px', border: '1px dashed var(--surface-border)', color: 'var(--text-muted)' }}>
              No reviews yet. Be the first to leave one!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {reviews.slice(0, displayReviewsCount).map((rev, idx) => (
                <div key={idx} className="glass-panel" style={{ padding: '16px', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '15px' }}>{rev.reviewerName}</span>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star 
                            key={star} 
                            size={12} 
                            fill={star <= (rev.rating || 5) ? "var(--warning)" : "transparent"} 
                            color={star <= (rev.rating || 5) ? "var(--warning)" : "var(--surface-border)"} 
                          />
                        ))}
                      </div>
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{new Date(rev.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.5, color: 'var(--text-main)' }}>{rev.text}</p>
                </div>
              ))}
              {reviews.length > displayReviewsCount && (
                <button 
                  onClick={() => setDisplayReviewsCount(prev => prev + 5)}
                  style={{ padding: '12px', marginTop: '8px', background: 'var(--surface)', color: 'var(--text-main)', border: '1px solid var(--surface-border)', borderRadius: '16px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
                >
                  Load more reviews
                </button>
              )}
            </div>
          )}

          {session?.user?.id && session.user.id !== id && (
            <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    size={24} 
                    fill={star <= newReviewRating ? "var(--warning)" : "transparent"} 
                    color={star <= newReviewRating ? "var(--warning)" : "var(--surface-border)"} 
                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                    onClick={() => setNewReviewRating(star)}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input 
                  type="text" 
                  placeholder="Write a public review..." 
                  value={newReviewText}
                  onChange={(e) => setNewReviewText(e.target.value)}
                  style={{ flex: 1, padding: '14px 16px', borderRadius: '16px', border: '1px solid var(--surface-border)', background: 'var(--surface)', color: 'var(--text-main)', fontSize: '15px', outline: 'none' }}
                />
                <button 
                  type="submit" 
                  disabled={submittingReview || !newReviewText.trim()}
                  style={{ width: '48px', height: '48px', borderRadius: '24px', background: '#FEF3C7', color: '#000000', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: newReviewText.trim() ? 'pointer' : 'not-allowed', opacity: newReviewText.trim() ? 1 : 0.4 }}
                >
                  <Send size={20} />
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Report Action */}
        <div style={{ textAlign: 'center', marginTop: '48px', marginBottom: '24px' }}>
          <div 
            onClick={() => setShowReportModal(true)}
            style={{ width: 'auto', background: 'transparent', border: 'none', color: 'var(--danger)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '0px', boxShadow: 'none' }}
          >
            <AlertTriangle size={16} /> Report This User
          </div>
          <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
            If you suspect suspicious behavior, please report it immediately.
          </p>
        </div>

      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel animate-slide-in" style={{ width: '100%', maxWidth: '400px', background: 'var(--surface)', borderRadius: '24px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)' }}>
                <AlertTriangle size={20} /> Report User
              </h3>
              <button onClick={() => setShowReportModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, margin: 0, display: 'flex' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleReport} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-main)' }}>Reason</label>
                <select 
                  value={reportReason} 
                  onChange={e => setReportReason(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--surface-border)', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '14px', outline: 'none' }}
                >
                  <option value="Scam / Fraud">Scam / Fraud</option>
                  <option value="Inappropriate Content">Inappropriate Content</option>
                  <option value="Harassment">Harassment</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-main)' }}>Description (Optional)</label>
                <textarea 
                  value={reportDesc}
                  onChange={e => setReportDesc(e.target.value)}
                  placeholder="Please provide more details..."
                  style={{ width: '100%', minHeight: '100px', padding: '12px', borderRadius: '12px', border: '1px solid var(--surface-border)', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '14px', outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
                <button 
                  type="submit" 
                  disabled={reporting}
                  style={{ width: 'auto', padding: '12px 32px', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 700, cursor: reporting ? 'not-allowed' : 'pointer', opacity: reporting ? 0.7 : 1 }}
                >
                  {reporting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
