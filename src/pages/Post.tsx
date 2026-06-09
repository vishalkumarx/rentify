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
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-slide-in">
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Hidden File Input */}
        <input 
          type="file" 
          multiple 
          accept="image/*" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleImageSelect}
        />

        {/* Real Photo Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {images[0] ? (
            <div style={{ position: 'relative', height: '140px' }}>
              <img src={images[0]} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px' }} />
              <button type="button" onClick={() => removeImage(0)} style={{ position: 'absolute', top: '8px', right: '8px', width: '28px', height: '28px', padding: 0, borderRadius: '14px', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'none' }}>
                <X size={16} />
              </button>
            </div>
          ) : (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="glass-panel" 
              style={{ height: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: '2px', cursor: 'pointer', color: 'var(--primary)' }}
            >
              <Camera size={32} style={{ marginBottom: '8px' }} />
              <span style={{ fontWeight: 600, fontSize: '14px' }}>Add Cover</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: '12px' }}>
            {/* Image 2 */}
            {images[1] ? (
              <div style={{ position: 'relative', height: '100%' }}>
                <img src={images[1]} alt="Pic 2" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px' }} />
                <button type="button" onClick={() => removeImage(1)} style={{ position: 'absolute', top: '4px', right: '4px', width: '24px', height: '24px', padding: 0, borderRadius: '12px', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'none' }}>
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div onClick={() => fileInputRef.current?.click()} className="glass-panel" style={{ height: '100%', background: 'var(--social-bg)', borderStyle: 'dashed', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Plus size={20} color="var(--text-muted)" />
              </div>
            )}
            
            {/* Image 3 */}
            {images[2] ? (
              <div style={{ position: 'relative', height: '100%' }}>
                <img src={images[2]} alt="Pic 3" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px' }} />
                <button type="button" onClick={() => removeImage(2)} style={{ position: 'absolute', top: '4px', right: '4px', width: '24px', height: '24px', padding: 0, borderRadius: '12px', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'none' }}>
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div onClick={() => fileInputRef.current?.click()} className="glass-panel" style={{ height: '100%', background: 'var(--social-bg)', borderStyle: 'dashed', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Plus size={20} color="var(--text-muted)" />
              </div>
            )}
          </div>
        </div>

        {/* Category Selector */}
        <div className="hide-scrollbar" style={{ overflowX: 'auto', display: 'flex', gap: '8px', margin: '4px 0' }}>
          {postingCategories.map(cat => (
            <div 
              key={cat}
              onClick={() => setCategory(cat)}
              style={{ 
                padding: '8px 16px', 
                borderRadius: '20px', 
                fontSize: '13px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                background: category === cat ? 'var(--primary-glow)' : 'transparent',
                border: `1px solid ${category === cat ? 'var(--primary)' : 'var(--surface-border)'}`,
                color: category === cat ? 'var(--primary)' : 'var(--text-muted)'
              }}
            >
              {cat}
            </div>
          ))}
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
                appearance: 'none'
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
                minHeight: '120px',
                resize: 'vertical'
              }}
            />
          </div>
        </div>
        
        <button type="submit" disabled={loading} style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Upload size={20} />
          {loading ? 'Posting...' : 'Publish Listing'}
        </button>
      </form>
    </div>
  );
}
