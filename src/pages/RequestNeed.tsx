import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, X, Image as ImageIcon } from 'lucide-react';
import { getStorageJson, setStorageJson, supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useSEO } from '../hooks/useSEO';
import toast from 'react-hot-toast';

export default function RequestNeed() {
  useSEO('Request a Need', 'Post a request for an item you need to the community feed.');
  const navigate = useNavigate();
  const { session, profile } = useAuth();

  const [title, setTitle] = useState('');
  const [budget, setBudget] = useState('');
  const [dateRequired, setDateRequired] = useState('');
  const [locationStr, setLocationStr] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Please provide a title');
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
    
    const newRequest = {
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

    try {
      const currentRequests = await getStorageJson('feed/item_requests.json') || [];
      const updatedRequests = [newRequest, ...currentRequests];
      await setStorageJson('feed/item_requests.json', updatedRequests);
      
      toast.success('Request posted successfully!');
      navigate('/item-requests');
    } catch (e) {
      toast.error('Failed to post request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg-color)', overflowY: 'auto' }} className="animate-slide-in">
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, display: 'flex', justifyContent: 'center', background: 'var(--surface)', borderBottom: '1px solid var(--surface-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', width: '100%', maxWidth: '600px' }}>
          <div onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '20px', marginLeft: '-8px', boxShadow: 'none' }}>
            <ChevronLeft size={28} />
          </div>
          <h1 style={{ flex: 1, textAlign: 'center', margin: 0, fontSize: '18px', fontWeight: 700, marginRight: '32px' }}>Request a Need</h1>
        </div>
      </div>

      <div style={{ padding: '24px', maxWidth: '600px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid var(--surface-border)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700 }}>What do you need?</label>
            <input 
              type="text" 
              placeholder="e.g. Scientific Calculator Casio fx-991" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              style={{ padding: '14px', borderRadius: '16px', border: '1px solid var(--surface-border)', background: 'var(--bg)', color: 'var(--text-main)', fontSize: '15px', outline: 'none' }} 
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
                style={{ padding: '14px', borderRadius: '16px', border: '1px solid var(--surface-border)', background: 'var(--bg)', color: 'var(--text-main)', fontSize: '15px', outline: 'none' }} 
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 700 }}>Need By (Optional)</label>
              <input 
                type="date" 
                value={dateRequired} 
                onChange={e => setDateRequired(e.target.value)} 
                style={{ padding: '14px', borderRadius: '16px', border: '1px solid var(--surface-border)', background: 'var(--bg)', color: 'var(--text-main)', fontSize: '15px', outline: 'none' }} 
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
              style={{ padding: '14px', borderRadius: '16px', border: '1px solid var(--surface-border)', background: 'var(--bg)', color: 'var(--text-main)', fontSize: '15px', outline: 'none' }} 
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700 }}>More Details (Optional)</label>
            <textarea 
              placeholder="When do you need it by? Any specific requirements?" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              rows={4} 
              style={{ padding: '14px', borderRadius: '16px', border: '1px solid var(--surface-border)', background: 'var(--bg)', color: 'var(--text-main)', fontSize: '15px', resize: 'none', fontFamily: 'inherit', outline: 'none' }} 
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

      {/* Publishing Modal */}
      {isSubmitting && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '360px', padding: '32px 24px', borderRadius: '32px', textAlign: 'center', background: 'var(--surface)', border: '1px solid var(--surface-border)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '32px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <div style={{ width: '32px', height: '32px', border: '4px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            </div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '22px', fontWeight: 900 }}>Publishing Need...</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.5 }}>
              Campus community will see your request shortly. Hang tight!
            </p>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
