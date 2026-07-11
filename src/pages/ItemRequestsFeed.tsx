import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Megaphone, X, MoreVertical, Trash2, MapPin, IndianRupee, Calendar, Image as ImageIcon, Eye, MessageSquare, Send, Heart } from 'lucide-react';
import { getStorageJson, setStorageJson, supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { LoadingDialog } from '../components/LoadingDialog';
import toast from 'react-hot-toast';
import { createPortal } from 'react-dom';

interface ItemRequest {
  id: string;
  userId: string;
  name: string;
  department: string;
  year: string;
  title: string;
  description: string;
  createdAt: string;
  profilePic?: string;
  budget?: string;
  location?: string;
  dateRequired?: string;
  imageUrl?: string;
  suspended?: boolean;
  views?: number;
  commentCount?: number;
}

interface NeedComment {
  id: string;
  needId: string;
  userId: string;
  name: string;
  profilePic?: string;
  text: string;
  createdAt: string;
  likes?: string[];
  parentId?: string;
}

export default function ItemRequestsFeed() {
  const navigate = useNavigate();
  const { session, profile } = useAuth();
  const [requests, setRequests] = useState<ItemRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [locationStr, setLocationStr] = useState('');
  const [dateRequired, setDateRequired] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ message: string, onConfirm: () => void } | null>(null);
  const [selectedNeed, setSelectedNeed] = useState<ItemRequest | null>(null);
  const [needComments, setNeedComments] = useState<NeedComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [expandedThreads, setExpandedThreads] = useState<Record<string, boolean>>({});

  const toggleThread = (id: string) => {
    setExpandedThreads(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuId(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);
  
  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    const data = await getStorageJson('feed/item_requests.json') || [];
    const allComments = await getStorageJson('feed/need_comments.json') || [];
    
    // Sort by newest first and attach comment counts
    const enrichedData = data.map((req: ItemRequest) => ({
      ...req,
      commentCount: allComments.filter((c: NeedComment) => c.needId === req.id).length
    })).sort((a: ItemRequest, b: ItemRequest) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    setRequests(enrichedData);
    setLoading(false);
  };

  const handleViewNeed = async (req: ItemRequest) => {
    setSelectedNeed(req);
    
    if (req.userId !== session?.user?.id) {
      const allReqs = await getStorageJson('feed/item_requests.json') || [];
      const updatedReqs = allReqs.map((r: ItemRequest) => {
        if (r.id === req.id) {
          return { ...r, views: (r.views || 0) + 1 };
        }
        return r;
      });
      await setStorageJson('feed/item_requests.json', updatedReqs);
      
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, views: (r.views || 0) + 1 } : r));
    }
    
    const allComments = await getStorageJson('feed/need_comments.json') || [];
    setNeedComments(allComments.filter((c: NeedComment) => c.needId === req.id).sort((a: NeedComment, b: NeedComment) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
  };
  
  const handleAddComment = async () => {
    if (!newComment.trim() || !session || !selectedNeed) return;
    setIsSubmittingComment(true);
    
    const comment: NeedComment = {
      id: Date.now().toString(),
      needId: selectedNeed.id,
      userId: session.user.id,
      name: profile?.name || session.user.user_metadata?.full_name || 'User',
      profilePic: profile?.avatar_url || session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
      text: newComment.trim(),
      createdAt: new Date().toISOString(),
      likes: [],
      parentId: undefined // We'll set this below
    };
    
    const allComments = await getStorageJson('feed/need_comments.json') || [];
    
    if (replyingTo) {
      const parentComment = allComments.find((c: NeedComment) => c.id === replyingTo);
      comment.parentId = parentComment?.parentId || replyingTo;
    }
    
    allComments.push(comment);
    await setStorageJson('feed/need_comments.json', allComments);
    
    setNeedComments(prev => [...prev, comment]);
    setRequests(prev => prev.map(r => r.id === selectedNeed.id ? { ...r, commentCount: (r.commentCount || 0) + 1 } : r));
    setNewComment('');
    setReplyingTo(null);
    setIsSubmittingComment(false);
  };

  const handleLikeComment = async (commentId: string) => {
    if (!session) return;
    
    const userId = session.user.id;
    const allComments = await getStorageJson('feed/need_comments.json') || [];
    const commentIndex = allComments.findIndex((c: NeedComment) => c.id === commentId);
    
    if (commentIndex > -1) {
      const comment = allComments[commentIndex];
      const likes = comment.likes || [];
      const hasLiked = likes.includes(userId);
      
      if (hasLiked) {
        comment.likes = likes.filter((id: string) => id !== userId);
      } else {
        comment.likes = [...likes, userId];
      }
      
      await setStorageJson('feed/need_comments.json', allComments);
      setNeedComments(prev => prev.map(c => c.id === commentId ? { ...c, likes: comment.likes } : c));
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    
    if (!session) {
      toast.error('You must be logged in to post a request');
      return;
    }

    setIsSubmitting(true);
    
    let uploadedImageUrl = undefined;
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `need-${Date.now()}-${Math.random()}.${fileExt}`;
      const { error } = await supabase.storage.from('item-images').upload(fileName, imageFile);
      if (!error) {
        const { data } = supabase.storage.from('item-images').getPublicUrl(fileName);
        uploadedImageUrl = data.publicUrl;
      }
    }
    
    const newRequest: ItemRequest = {
      id: Date.now().toString(),
      userId: session.user.id,
      name: profile?.name || session.user.user_metadata?.full_name || 'Anonymous Student',
      department: profile?.department || 'Unknown Department',
      year: profile?.memberSince || new Date().getFullYear().toString(),
      title: title.trim(),
      description: description.trim(),
      budget: budget.trim() || undefined,
      location: locationStr.trim() || undefined,
      dateRequired: dateRequired.trim() || undefined,
      createdAt: new Date().toISOString(),
      profilePic: profile?.avatar_url || session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
      imageUrl: uploadedImageUrl
    };

    const currentRequests = await getStorageJson('feed/item_requests.json') || [];
    const updatedRequests = [newRequest, ...currentRequests];
    
    await setStorageJson('feed/item_requests.json', updatedRequests);
    
    setRequests(updatedRequests);
    setIsSubmitting(false);
    setShowModal(false);
    setTitle('');
    setDescription('');
    setBudget('');
    setLocationStr('');
    setDateRequired('');
    setImageFile(null);
    toast.success('Request posted successfully!');
  };

  const deleteRequest = (id: string) => {
    setConfirmDialog({
      message: 'Are you sure you want to delete this need?',
      onConfirm: async () => {
        const currentRequests = await getStorageJson('feed/item_requests.json') || [];
        const updated = currentRequests.filter((r: any) => r.id !== id);
        await setStorageJson('feed/item_requests.json', updated);
        setRequests(updated);
        toast.success('Need deleted successfully');
      }
    });
  };

  const timeAgo = (dateStr: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)', overflowY: 'auto' }} className="hide-scrollbar">
      <header style={{ height: '60px', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--surface-border)', background: 'var(--surface)', flexShrink: 0, position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate(-1)} style={{ width: '40px', height: '40px', padding: 0, borderRadius: '20px', background: 'var(--surface)', border: '1px solid var(--surface-border)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
            <ChevronLeft size={20} />
          </button>
          <h1 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Community Requests</h1>
        </div>
      </header>

      <div style={{ background: 'none', color: 'var(--success)', padding: '8px 16px', fontSize: '12px', fontWeight: 600, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', margin: '16px auto 0', width: 'fit-content' }}>
        <MapPin size={14} color="var(--success)" style={{ flexShrink: 0 }} /> <span>Currently available in <strong>Guru Nanak Dev University, Amritsar</strong> only</span>
      </div>

      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        
        <div style={{ background: 'rgba(244, 196, 48, 0.1)', border: '1px dashed var(--primary)', borderRadius: '24px', padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '24px', background: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Megaphone size={24} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 800 }}>Can't find what you need?</h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Post a request to the community feed. If someone has what you're looking for, they can message you directly!
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 900, margin: 0 }}>Community Needs</h2>
          <button 
            onClick={() => {
              if (!session) {
                toast.error('Please log in to post a request');
                navigate('/login', { state: { returnTo: '/item-requests' } });
                return;
              }
              setShowModal(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--primary)', color: '#000', padding: '10px 16px', borderRadius: '20px', border: 'none', fontWeight: 700, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px var(--primary-glow)', width: 'fit-content', whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            <Plus size={18} /> <span>Post a Need</span>
          </button>
        </div>

        {loading ? (
          <LoadingDialog message="Loading Community Feed..." />
        ) : requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--surface)', borderRadius: '24px', border: '1px solid var(--surface-border)' }}>
            <Megaphone size={40} color="var(--primary)" style={{ opacity: 0.5, marginBottom: '16px' }} />
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700 }}>No requests yet</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>Be the first to post what you need!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {requests.map(req => (
              <div key={req.id} onClick={() => { if (!req.suspended) handleViewNeed(req); }} className="glass-panel" style={{ background: 'var(--surface)', padding: '24px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid var(--surface-border)', cursor: req.suspended ? 'default' : 'pointer', position: 'relative', userSelect: 'none', opacity: req.suspended ? 0.7 : 1 }}>
                
                {req.suspended && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(4px)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '24px' }}>
                    <div style={{ background: 'var(--danger)', color: 'white', padding: '12px 24px', borderRadius: '24px', fontWeight: 800, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}>
                      This post is unavailable due to policy violations
                    </div>
                  </div>
                )}
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {req.profilePic ? (
                    <img src={req.profilePic} alt={req.name} style={{ width: '40px', height: '40px', borderRadius: '20px', objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: '40px', height: '40px', borderRadius: '20px', background: 'var(--text-main)', color: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '16px', textTransform: 'uppercase', flexShrink: 0 }}>
                      {req.name.charAt(0)}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ fontWeight: 700, fontSize: '15px', lineHeight: 1.2 }}>{req.name}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {req.department} • {req.year}
                        </div>
                      </div>
                      {req.userId === session?.user?.id && (
                        <div style={{ position: 'relative', marginTop: '-4px', marginRight: '-8px', zIndex: 20 }}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === req.id ? null : req.id); }}
                            style={{ background: 'transparent', border: 'none', padding: '4px', cursor: 'pointer', color: 'var(--text-muted)' }}
                          >
                            <MoreVertical size={20} />
                          </button>
                          {openMenuId === req.id && (
                            <div style={{ position: 'absolute', top: '100%', right: '0', background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 10, minWidth: '120px', overflow: 'hidden' }}>
                              <button onClick={(e) => { e.stopPropagation(); deleteRequest(req.id); setOpenMenuId(null); }} style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--danger)', borderRadius: 0, fontWeight: 600 }}>
                                <Trash2 size={16} /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>
                      <span style={{ color: 'var(--primary)' }}>{timeAgo(req.createdAt)}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Eye size={16} /> {req.views || 0}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MessageSquare size={20} /> {req.commentCount || 0}
                        </div>
                  </div>
                  </div>
                </div>
                
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 800 }}>{req.title}</h3>
                  {req.imageUrl && (
                    <img src={req.imageUrl} alt="Need Attachment" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '16px', marginBottom: '12px', border: '1px solid var(--surface-border)' }} />
                  )}
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-main)', lineHeight: 1.5, opacity: 0.9 }}>
                    {req.description}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '12px' }}>
                    {req.budget && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--text-main)', background: 'var(--surface)', padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                        <IndianRupee size={14} color="var(--primary)" /> {req.budget}
                      </div>
                    )}
                    {req.location && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--text-main)', background: 'var(--surface)', padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                        <MapPin size={14} color="var(--primary)" /> {req.location}
                      </div>
                    )}
                    {req.dateRequired && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--text-main)', background: 'var(--surface)', padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                        <Calendar size={14} color="var(--primary)" /> Need by: {req.dateRequired}
                      </div>
                    )}
                  </div>
                  {req.commentCount && req.commentCount > 0 ? (
                    <div style={{ marginTop: '12px' }}>
                      <button onClick={() => handleViewNeed(req)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '14px', fontWeight: 500, cursor: 'pointer', padding: 0 }}>
                        View all {req.commentCount} comments
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', animation: 'fadeIn 0.2s' }}>
          <div className="animate-slide-up" style={{ width: '100%', maxWidth: '400px', background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '32px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Request an Item</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'var(--surface-border)', border: 'none', width: '36px', height: '36px', borderRadius: '18px', color: 'var(--text-main)', cursor: 'pointer', padding: 0, margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700 }}>What do you need?</label>
                <input 
                  type="text" 
                  placeholder="e.g. Scientific Calculator Casio fx-991" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  style={{ padding: '14px', borderRadius: '16px', border: '1px solid var(--surface-border)', background: 'var(--bg)', color: 'var(--text-main)', fontSize: '15px' }} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700 }}>Budget (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. ₹50/day" 
                    value={budget} 
                    onChange={e => setBudget(e.target.value)} 
                    style={{ padding: '14px', borderRadius: '16px', border: '1px solid var(--surface-border)', background: 'var(--bg)', color: 'var(--text-main)', fontSize: '15px' }} 
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700 }}>Need By (Optional)</label>
                  <input 
                    type="date" 
                    value={dateRequired} 
                    onChange={e => setDateRequired(e.target.value)} 
                    style={{ padding: '14px', borderRadius: '16px', border: '1px solid var(--surface-border)', background: 'var(--bg)', color: 'var(--text-main)', fontSize: '15px' }} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700 }}>Location (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. North Campus, Block C" 
                  value={locationStr} 
                  onChange={e => setLocationStr(e.target.value)} 
                  style={{ padding: '14px', borderRadius: '16px', border: '1px solid var(--surface-border)', background: 'var(--bg)', color: 'var(--text-main)', fontSize: '15px' }} 
                />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700 }}>More Details</label>
                <textarea 
                  placeholder="When do you need it by? Any specific requirements?" 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  rows={4} 
                  style={{ padding: '14px', borderRadius: '16px', border: '1px solid var(--surface-border)', background: 'var(--bg)', color: 'var(--text-main)', fontSize: '15px', resize: 'none', fontFamily: 'inherit' }} 
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700 }}>Attach Image (Optional)</label>
                {imageFile ? (
                  <div style={{ position: 'relative', width: 'fit-content' }}>
                    <img src={URL.createObjectURL(imageFile)} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '12px', border: '1px solid var(--surface-border)' }} />
                    <button onClick={() => setImageFile(null)} style={{ position: 'absolute', top: '-6px', right: '-6px', background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'var(--bg)', border: '1px dashed var(--primary)', borderRadius: '16px', color: 'var(--primary)', fontWeight: 600, fontSize: '14px', cursor: 'pointer', width: 'fit-content' }}>
                    <ImageIcon size={18} />
                    <span>Upload Image</span>
                    <input type="file" accept="image/*" onChange={(e) => { if (e.target.files && e.target.files[0]) setImageFile(e.target.files[0]); }} style={{ display: 'none' }} />
                  </label>
                )}
              </div>
              
              <button 
                onClick={handleSubmit} 
                disabled={isSubmitting} 
                className="glow" 
                style={{ padding: '16px', borderRadius: '20px', background: 'var(--primary)', color: '#000', border: 'none', fontWeight: 800, cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '16px', marginTop: '8px' }}
              >
                {isSubmitting ? 'Publishing...' : 'Publish Need'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Publishing Modal */}
      {isSubmitting && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '360px', padding: '32px 24px', borderRadius: '32px', textAlign: 'center', background: 'var(--surface)', border: '1px solid var(--surface-border)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '32px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <div style={{ width: '32px', height: '32px', border: '4px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            </div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '22px', fontWeight: 900 }}>Publishing Need...</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.5 }}>
              Campus community will be notified about your need shortly. Hang tight!
            </p>
          </div>
        </div>,
        document.body
      )}

      {confirmDialog && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '24px', borderRadius: '24px', textAlign: 'center', background: 'var(--surface)', border: '1px solid var(--surface-border)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 800 }}>Confirm Action</h3>
            <p style={{ margin: '0 0 24px 0', color: 'var(--text-muted)', fontSize: '15px' }}>{confirmDialog.message}</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setConfirmDialog(null)} style={{ flex: 1, padding: '14px', borderRadius: '16px', border: 'none', background: 'var(--surface-border)', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }} style={{ flex: 1, padding: '14px', borderRadius: '16px', border: 'none', background: 'var(--danger)', color: 'white', fontWeight: 600, cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Need View Dialog */}
      {selectedNeed && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 999999, display: 'flex', alignItems: 'flex-end' }} onClick={() => setSelectedNeed(null)}>
          <div className="animate-slide-up" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '800px', margin: '0 auto', background: 'var(--surface)', borderTopLeftRadius: '32px', borderTopRightRadius: '32px', height: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--surface)', position: 'relative' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Need Details</h3>
              <button onClick={() => setSelectedNeed(null)} style={{ position: 'absolute', right: '16px', top: '16px', background: 'var(--surface-border)', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '8px', borderRadius: '20px', display: 'flex' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {selectedNeed.profilePic ? (
                    <img src={selectedNeed.profilePic} alt={selectedNeed.name} style={{ width: '48px', height: '48px', borderRadius: '24px', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '48px', height: '48px', borderRadius: '24px', background: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '18px', textTransform: 'uppercase' }}>
                      {selectedNeed.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '16px' }}>{selectedNeed.name}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{selectedNeed.department} • {selectedNeed.year}</div>
                  </div>
              </div>
              
              <div>
                <h2 style={{ margin: '0 0 12px 0', fontSize: '22px', fontWeight: 900 }}>{selectedNeed.title}</h2>
                {selectedNeed.imageUrl && (
                  <img src={selectedNeed.imageUrl} alt="Need Attachment" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '16px', marginBottom: '16px', border: '1px solid var(--surface-border)' }} />
                )}
                <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.6, color: 'var(--text-main)' }}>{selectedNeed.description}</p>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--surface-border)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--text-muted)', fontWeight: 600 }}>
                    <Eye size={16} /> {selectedNeed.views || 0} Views
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--text-muted)', fontWeight: 600 }}>
                    <MessageSquare size={16} /> {needComments.length} Comments
                  </span>
                </div>
              </div>
              
              {selectedNeed.userId !== session?.user?.id && (
                <button 
                  onClick={() => { setSelectedNeed(null); navigate(`/chat/req-${selectedNeed.id}`); }}
                  style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'var(--primary)', color: '#000', border: 'none', fontWeight: 800, fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  Message User Privately
                </button>
              )}

              <div>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 800 }}>Comments</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {needComments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px', background: 'var(--bg)', borderRadius: '16px', color: 'var(--text-muted)', fontSize: '14px' }}>
                      No comments yet. Be the first to comment!
                    </div>
                  ) : (
                    needComments.filter(c => !c.parentId).map(comment => {
                      const renderComment = (c: NeedComment, isReply = false) => {
                        const hasLiked = c.likes?.includes(session?.user?.id || '');
                        const replies = needComments.filter(r => r.parentId === c.id);
                        
                        return (
                          <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: isReply ? '32px' : '0', borderLeft: isReply ? '2px solid var(--surface-border)' : 'none', paddingLeft: isReply ? '16px' : '0' }}>
                            <div style={{ display: 'flex', gap: '12px' }}>
                              {c.profilePic ? (
                                <img src={c.profilePic} alt="" onClick={(e) => { e.stopPropagation(); navigate(`/profile/${c.userId}`); }} style={{ width: '32px', height: '32px', borderRadius: '16px', objectFit: 'cover', flexShrink: 0, cursor: 'pointer' }} />
                              ) : (
                                <div onClick={(e) => { e.stopPropagation(); navigate(`/profile/${c.userId}`); }} style={{ width: '32px', height: '32px', borderRadius: '16px', background: 'var(--surface-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', flexShrink: 0, cursor: 'pointer' }}>
                                  {c.name.charAt(0)}
                                </div>
                              )}
                              <div style={{ flex: 1 }}>
                                <div style={{ background: 'var(--bg)', padding: '12px 16px', borderRadius: '16px', borderTopLeftRadius: '4px' }}>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                                      <strong onClick={(e) => { e.stopPropagation(); navigate(`/profile/${c.userId}`); }} style={{ fontSize: '13px', color: 'var(--text-main)', cursor: 'pointer' }}>{c.name}</strong>
                                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{timeAgo(c.createdAt)}</span>
                                    </div>
                                  <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5, color: 'var(--text-main)' }}>{c.text}</p>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '4px', marginTop: '6px', marginLeft: '8px' }}>
                                  <button onClick={() => handleLikeComment(c.id)} style={{ width: 'auto', background: 'none', border: 'none', color: hasLiked ? 'var(--danger)' : 'var(--text-muted)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '4px', padding: 0 }}>
                                    <Heart size={14} fill={hasLiked ? 'currentColor' : 'none'} /> {c.likes?.length || 0}
                                  </button>
                                    <button onClick={() => setReplyingTo(c.id)} style={{ width: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: 0, textAlign: 'left', marginLeft: '4px' }}>
                                      Reply
                                    </button>
                                </div>
                              </div>
                            </div>
                            
                            {replies.length > 0 && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
                                {expandedThreads[c.id] && replies.map(r => renderComment(r, true))}
                                <button onClick={() => toggleThread(c.id)} style={{ width: 'auto', alignSelf: 'flex-start', background: 'none', border: 'none', color: 'var(--primary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: '0', marginLeft: isReply ? '32px' : '48px' }}>
                                  {expandedThreads[c.id] ? 'View less replies' : `View all replies (${replies.length})`}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      };
                      return renderComment(comment);
                    })
                  )}
                </div>
              </div>
            </div>
            
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--surface-border)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
              {replyingTo && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', background: 'var(--bg)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span>Replying to {needComments.find(c => c.id === replyingTo)?.name || 'Comment'}</span>
                  <button onClick={() => setReplyingTo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}><X size={14} /></button>
                </div>
              )}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input 
                  type="text" 
                  placeholder={session ? (replyingTo ? "Write a reply..." : "Write a comment...") : "Login to comment"}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  disabled={!session || isSubmittingComment}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(); }}
                  style={{ flex: 1, padding: '12px 16px', borderRadius: '24px', border: '1px solid var(--surface-border)', background: 'var(--bg)', color: 'var(--text-main)', outline: 'none' }}
                />
                <button 
                  onClick={handleAddComment}
                  disabled={!session || !newComment.trim() || isSubmittingComment}
                  style={{ width: '40px', height: '40px', borderRadius: '20px', background: newComment.trim() ? 'var(--primary)' : 'var(--surface-border)', color: newComment.trim() ? '#000' : 'var(--text-muted)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: newComment.trim() ? 'pointer' : 'default', flexShrink: 0 }}
                >
                  <Send size={22} />
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
