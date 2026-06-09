import { useState, useRef } from 'react';
import { Camera, Upload, Tag, DollarSign, AlignLeft, Plus, X, Building } from 'lucide-react';
import { useFeed } from '../context/FeedContext';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES, DEPARTMENTS } from '../lib/constants';

export default function Post() {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addPost } = useFeed();
  const navigate = useNavigate();

  // Exclude 'All' from posting categories
  const postingCategories = CATEGORIES.filter(c => c !== 'All');

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const newImageUrls = filesArray.map(file => URL.createObjectURL(file));
      setImages(prev => [...prev, ...newImageUrls].slice(0, 3)); // Max 3 images
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      addPost({
        title,
        price,
        category,
        department: department || 'Other',
        image: images.length > 0 ? images[0] : 'https://images.unsplash.com/photo-1588702545922-76289d043477?auto=format&fit=crop&q=80&w=400',
        images: images,
      });
      setLoading(false);
      navigate('/');
    }, 800);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', width: '100%' }} className="animate-slide-in">
      
      <form onSubmit={handleSubmit} className="post-grid glass-panel" style={{ padding: '32px', borderRadius: '24px' }}>
        
        {/* Hidden File Input */}
        <input 
          type="file" 
          multiple 
          accept="image/*" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleImageSelect}
        />

        {/* LEFT COLUMN: Photos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '22px', margin: 0, fontWeight: 700 }}>Listing Photos</h2>
          <p style={{ margin: '-12px 0 4px', color: 'var(--text-muted)', fontSize: '14px' }}>Add up to 3 photos. The first will be the cover.</p>
          
          {/* Real Photo Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {images[0] ? (
              <div style={{ position: 'relative', height: '240px' }}>
                <img src={images[0]} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px' }} />
                <button type="button" onClick={() => removeImage(0)} style={{ position: 'absolute', top: '12px', right: '12px', width: '32px', height: '32px', padding: 0, borderRadius: '16px', background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'none' }}>
                  <X size={18} />
                </button>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="glass-panel" 
                style={{ height: '240px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: '2px', cursor: 'pointer', color: 'var(--text-main)' }}
              >
                <Camera size={36} style={{ marginBottom: '12px' }} />
                <span style={{ fontWeight: 600, fontSize: '15px' }}>Add Cover</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: '12px' }}>
              {/* Image 2 */}
              {images[1] ? (
                <div style={{ position: 'relative', height: '100%' }}>
                  <img src={images[1]} alt="Pic 2" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px' }} />
                  <button type="button" onClick={() => removeImage(1)} style={{ position: 'absolute', top: '8px', right: '8px', width: '28px', height: '28px', padding: 0, borderRadius: '14px', background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'none' }}>
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div onClick={() => fileInputRef.current?.click()} className="glass-panel" style={{ height: '100%', background: 'var(--surface)', borderStyle: 'dashed', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Plus size={24} color="var(--text-muted)" />
                </div>
              )}
              
              {/* Image 3 */}
              {images[2] ? (
                <div style={{ position: 'relative', height: '100%' }}>
                  <img src={images[2]} alt="Pic 3" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px' }} />
                  <button type="button" onClick={() => removeImage(2)} style={{ position: 'absolute', top: '8px', right: '8px', width: '28px', height: '28px', padding: 0, borderRadius: '14px', background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'none' }}>
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div onClick={() => fileInputRef.current?.click()} className="glass-panel" style={{ height: '100%', background: 'var(--surface)', borderStyle: 'dashed', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Plus size={24} color="var(--text-muted)" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Details & Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '22px', margin: 0, fontWeight: 700 }}>Details</h2>
          
          {/* Category Selector */}
          <div style={{ position: 'relative', marginTop: '-8px' }}>
            <Tag size={20} color="var(--text-muted)" style={{ position: 'absolute', top: '16px', left: '16px' }} />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '16px 16px 16px 48px',
                borderRadius: '16px',
                border: '1px solid var(--surface-border)',
                background: 'var(--surface)',
                color: category ? 'var(--text-main)' : 'var(--text-muted)',
                fontFamily: 'Outfit, sans-serif',
                fontSize: '16px',
                outline: 'none',
                appearance: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="" disabled>Select a Category</option>
              {postingCategories.map(cat => (
                <option key={cat} value={cat} style={{ color: 'var(--text-main)' }}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ position: 'relative' }}>
              <Tag size={20} color="var(--text-muted)" style={{ position: 'absolute', top: '16px', left: '16px' }} />
              <input
                type="text"
                placeholder="What are you renting?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={{ paddingLeft: '48px' }}
              />
            </div>
            
            <div style={{ position: 'relative' }}>
              <DollarSign size={20} color="var(--text-muted)" style={{ position: 'absolute', top: '16px', left: '16px' }} />
              <input
                type="number"
                placeholder="Price per day"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                style={{ paddingLeft: '48px' }}
              />
            </div>

            <div style={{ position: 'relative' }}>
              <Building size={20} color="var(--text-muted)" style={{ position: 'absolute', top: '16px', left: '16px' }} />
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
                style={{ 
                  width: '100%',
                  padding: '16px 16px 16px 48px',
                  borderRadius: '24px',
                  border: '1px solid var(--surface-border)',
                  background: 'var(--surface)',
                  color: department ? 'var(--text-main)' : 'var(--text-muted)',
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '16px',
                  outline: 'none',
                  appearance: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="" disabled>Select your Department</option>
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept} style={{ color: 'var(--text-main)' }}>{dept}</option>
                ))}
              </select>
            </div>

            <div style={{ position: 'relative' }}>
              <AlignLeft size={20} color="var(--text-muted)" style={{ position: 'absolute', top: '16px', left: '16px' }} />
              <textarea
                placeholder="Describe your item..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '16px 16px 16px 48px',
                  borderRadius: '16px',
                  border: '1px solid var(--surface-border)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text-main)',
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '16px',
                  outline: 'none',
                  minHeight: '140px',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <div style={{ color: 'var(--danger)', marginTop: '2px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              <span style={{ color: 'var(--danger)', fontWeight: 600 }}>Policy Warning:</span> Do not list prohibited, dangerous, or morally objectionable items. Violations will result in immediate account termination and legal proceedings.
            </p>
          </div>

          <button type="submit" disabled={loading} style={{ marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '18px', fontSize: '17px', background: 'var(--text-main)', color: 'var(--surface)', boxShadow: 'none' }}>
            <Upload size={22} />
            {loading ? 'Publishing...' : 'Publish Listing'}
          </button>
        </div>

      </form>
    </div>
  );
}
