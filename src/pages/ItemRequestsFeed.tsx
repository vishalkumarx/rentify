import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, MessageSquare, Megaphone, X, MoreVertical, Trash2, MapPin, IndianRupee, Calendar, Image as ImageIcon } from 'lucide-react';
import { getStorageJson, setStorageJson, supabase } from '../lib/supabase';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
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
}

export default function ItemRequestsFeed() {
  const { getOrCreateConversation } = useChat();
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

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    const data = await getStorageJson('feed/item_requests.json') || [];
    // Sort by newest first
    setRequests(data.sort((a: ItemRequest, b: ItemRequest) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setLoading(false);
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

  const handleMessage = async (request: ItemRequest) => {
    if (!session) {
      toast.error('Please log in to send a message');
      navigate('/login', { state: { returnTo: '/item-requests' } });
      return;
    }
    if (request.userId === session.user.id) {
      toast.error('You cannot message yourself');
      return;
    }
    const convId = getOrCreateConversation(`req-${request.id}`, `Need: ${request.title}`, request.profilePic || '', request.userId, request.name);
    navigate(`/chat/${convId}`);
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
        
        <button 
          onClick={() => {
            if (!session) {
              toast.error('Please log in to post a request');
              navigate('/login', { state: { returnTo: '/item-requests' } });
              return;
            }
            setShowModal(true);
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--primary)', color: '#000', padding: '8px 16px', borderRadius: '20px', border: 'none', fontWeight: 700, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(244, 196, 48, 0.3)', width: 'fit-content', whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          <Plus size={16} /> Post a Need
        </button>
      </header>

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

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[1,2,3].map(i => (
              <div key={i} className="skeleton" style={{ height: '140px', borderRadius: '24px' }}></div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--surface)', borderRadius: '24px', border: '1px solid var(--surface-border)' }}>
            <Megaphone size={40} color="var(--primary)" style={{ opacity: 0.5, marginBottom: '16px' }} />
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700 }}>No requests yet</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>Be the first to post what you need!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {requests.map(req => (
              <div key={req.id} className="glass-panel" style={{ padding: '20px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                      <div style={{ fontWeight: 700, fontSize: '15px' }}>{req.name}</div>
                      {req.userId === session?.user?.id && (
                        <div style={{ position: 'relative' }}>
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
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {req.department} • {req.year}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600, marginTop: '2px' }}>
                      {timeAgo(req.createdAt)}
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
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid var(--surface-border)' }}>
                  {req.userId !== session?.user?.id && (
                    <button 
                      onClick={() => handleMessage(req)}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)', padding: '8px 16px', borderRadius: '16px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', width: 'fit-content', whiteSpace: 'nowrap', flexShrink: 0 }}
                    >
                      <MessageSquare size={16} /> I can help
                    </button>
                  )}
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
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: 0, margin: 0, marginRight: '-12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
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
                style={{ padding: '16px', borderRadius: '20px', background: 'var(--primary)', color: '#000', fontWeight: 800, fontSize: '16px', border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1, marginTop: '8px' }}
              >
                {isSubmitting ? 'Posting...' : 'Post Request'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Custom Confirm Dialog */}
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

    </div>
  );
}
