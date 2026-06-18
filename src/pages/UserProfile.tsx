import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import { supabase, getStorageJson, setStorageJson } from '../lib/supabase';
import { ChevronLeft, Star, ShieldCheck, CheckCircle2, AlertTriangle, BadgeCheck, X, Send } from 'lucide-react';

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();

  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [newReviewText, setNewReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Report State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Scam / Fraud');
  const [reportDesc, setReportDesc] = useState('');
  const [reporting, setReporting] = useState(false);

  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    
    const fetchUserData = async () => {
      // Check Verification
      const apps = await getStorageJson('admin/approvals.json') || [];
      if (apps.includes(id)) {
        setIsVerified(true);
      }

      // Fetch Profile Data
      const pData = await getStorageJson(`profiles/${id}.json`);
      if (pData) {
        setProfile(pData);
      } else {
        setProfile({
          name: 'User ' + (id ? id.substring(0, 5) : ''),
          memberSince: new Date().getFullYear().toString(),
          verifications: ['Email Confirmed']
        });
      }

      // Fetch Reviews from Storage
      const { data: reviewFiles } = await supabase.storage.from('item-images').list('reviews');
      if (reviewFiles) {
        // Filter reviews for this specific user ID
        const targetFiles = reviewFiles.filter(f => f.name.startsWith(id + '-'));
        const loadedReviews = await Promise.all(
          targetFiles.map(async f => await getStorageJson(`reviews/${f.name}`))
        );
        // Sort newest first
        setReviews(loadedReviews.filter(Boolean).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
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
      alert('Report submitted successfully. Admins will review it shortly.');
      setShowReportModal(false);
    } catch (err) {
      alert('Failed to submit report');
    }
    setReporting(false);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id || !id) {
      alert('Please log in to write a review');
      return;
    }
    if (!newReviewText.trim()) return;

    setSubmittingReview(true);
    try {
      const reviewObj = {
        reviewerId: session.user.id,
        text: newReviewText,
        timestamp: new Date().toISOString(),
        reviewerName: session.user.user_metadata?.full_name || 'A user'
      };
      
      await setStorageJson(`reviews/${id}-${session.user.id}-${Date.now()}.json`, reviewObj);
      setReviews([reviewObj, ...reviews]);
      setNewReviewText('');
      alert('Review posted successfully!');
    } catch (err) {
      alert('Failed to post review');
    }
    setSubmittingReview(false);
  };

  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading profile...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg-color)', overflowY: 'auto' }} className="animate-slide-in">
      
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center', padding: '16px 20px', background: 'var(--surface)', borderBottom: '1px solid var(--surface-border)' }}>
        <div onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '20px', marginLeft: '-8px', boxShadow: 'none' }}>
          <ChevronLeft size={28} />
        </div>
        <h1 style={{ flex: 1, textAlign: 'center', margin: 0, fontSize: '18px', fontWeight: 700, marginRight: '32px' }}>Profile</h1>
      </div>

      <div style={{ padding: '24px' }}>
        
        {/* User Card */}
        <div className="glass-panel" style={{ padding: '32px 24px', borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '96px', height: '96px', borderRadius: '48px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '16px', position: 'relative' }}>
            {(() => {
              const avatarUrl = profile?.avatar_url || (session?.user?.id === id ? session?.user?.user_metadata?.avatar_url || session?.user?.user_metadata?.picture : null);
              if (avatarUrl) {
                return <img src={avatarUrl} alt="Profile" style={{ width: '96px', height: '96px', borderRadius: '48px', objectFit: 'cover' }} />;
              }
              return profile?.name?.charAt(0)?.toUpperCase() || 'U';
            })()}
            {isVerified && (
              <div style={{ position: 'absolute', bottom: '0', right: '0', background: 'var(--surface)', borderRadius: '50%', padding: '2px' }}>
                <BadgeCheck size={28} fill="#1877F2" color="white" />
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', marginBottom: '4px', width: '100%' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', maxWidth: '100%', padding: '0 16px' }}>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile?.name}</span>
            </h2>
            {session?.user?.id === id && session?.user?.email && (
              <p title={session.user.email} style={{ margin: 0, color: 'var(--text-muted)', fontSize: '15px', maxWidth: '100%', padding: '0 24px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {session.user.email}
              </p>
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', color: 'var(--text-muted)', fontSize: '15px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Star size={16} fill="var(--warning)" color="var(--warning)" /> {profile?.rating} 
            </span>
            <span>•</span>
            <span>Joined {profile?.memberSince}</span>
          </div>
        </div>

        {/* Verifications */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Verifications</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {isVerified && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(24, 119, 242, 0.1)', padding: '16px', borderRadius: '16px', color: '#1877F2', fontWeight: 600 }}>
                <ShieldCheck size={20} /> Official University ID Verified
              </div>
            )}
            {profile?.verifications?.map((ver: string, idx: number) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--surface)', border: '1px solid var(--surface-border)', padding: '16px', borderRadius: '16px', color: 'var(--success)', fontWeight: 600 }}>
                <CheckCircle2 size={20} /> {ver}
              </div>
            ))}
          </div>
        </div>

        {/* Reviews Section */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Reviews ({reviews.length})</h3>
          
          {session?.user?.id && session.user.id !== id && (
            <form onSubmit={handleSubmitReview} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
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
                style={{ width: '48px', height: '48px', borderRadius: '24px', background: '#000000', color: '#ffffff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: newReviewText.trim() ? 'pointer' : 'not-allowed', opacity: newReviewText.trim() ? 1 : 0.4 }}
              >
                <Send size={20} />
              </button>
            </form>
          )}

          {reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', background: 'var(--surface)', borderRadius: '16px', border: '1px dashed var(--surface-border)', color: 'var(--text-muted)' }}>
              No reviews yet. Be the first to leave one!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {reviews.map((rev, idx) => (
                <div key={idx} className="glass-panel" style={{ padding: '16px', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '15px' }}>{rev.reviewerName}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{new Date(rev.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.5, color: 'var(--text-main)' }}>{rev.text}</p>
                </div>
              ))}
            </div>
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
              <button onClick={() => setShowReportModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={24} />
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
