import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Tag, DollarSign, AlignLeft, Plus, X, Building, ArrowLeft } from 'lucide-react';
import { useFeed } from '../context/FeedContext';
import { useNavigate, useParams } from 'react-router-dom';
import { CATEGORIES, DEPARTMENTS } from '../lib/constants';
import { supabase } from '../lib/supabase';

export default function EditPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { items, updatePost } = useFeed();
  
  const item = items.find(i => i.id === Number(id));

  const [title, setTitle] = useState(item?.title || '');
  const [price, setPrice] = useState(item?.price || '');
  const [category, setCategory] = useState(item?.category || '');
  const [department, setDepartment] = useState(item?.department || '');
  const [description, setDescription] = useState(item?.description || '');
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>(item?.images || (item?.image ? [item.image] : []));
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [initialized, setInitialized] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (item && !initialized) {
      setTitle(item.title || '');
      setPrice(item.price || '');
      setCategory(item.category || '');
      setDepartment(item.department || '');
      setDescription(item.description || '');
      setImages(item.images || (item.image ? [item.image] : []));
      setInitialized(true);
    }
  }, [item, initialized]);

  useEffect(() => {
    // Only alert if we're sure items have been fetched but the item isn't in them
    if (items.length > 0 && !item) {
      alert('Item not found');
      navigate('/profile');
    }
  }, [items.length, item, navigate]);

  // Exclude 'All' from posting categories
  const postingCategories = CATEGORIES.filter(c => c !== 'All');

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const newImageUrls = filesArray.map(file => URL.createObjectURL(file));
      setImages(prev => [...prev, ...newImageUrls].slice(0, 3)); // Max 3 images
      setImageFiles(prev => [...prev, ...filesArray].slice(0, 3));
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let finalUrls = [...images];

      if (imageFiles.length > 0) {
        // Upload all images concurrently
        const uploadPromises = imageFiles.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('item-images')
            .upload(filePath, file);
            
          if (uploadError) throw uploadError;
          
          const { data: { publicUrl } } = supabase.storage
            .from('item-images')
            .getPublicUrl(filePath);
            
          return publicUrl;
        });

        const uploadedUrls = await Promise.all(uploadPromises);
        
        let uploadIndex = 0;
        finalUrls = finalUrls.map(url => {
          if (url.startsWith('blob:')) {
            return uploadedUrls[uploadIndex++];
          }
          return url;
        });
      }
      
      await updatePost(Number(id), {
        title,
        price,
        category,
        description,
        department: department || 'Other',
        image: finalUrls[0], // First image is cover
        images: finalUrls,   // All images
      });
      
      setLoading(false);
      navigate('/profile');
    } catch (error: any) {
      console.error('Error updating item:', error);
      alert('Failed to update item: ' + error.message);
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }
  if (!item) return null;

  return (
    <div style={{ height: '100vh', overflowY: 'auto' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button type="button" onClick={() => navigate(-1)} style={{ background: 'var(--surface-border)', border: 'none', width: '40px', height: '40px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <ArrowLeft size={20} color="var(--text-main)" />
            </button>
            <h2 style={{ fontSize: '22px', margin: 0, fontWeight: 700 }}>Edit Details</h2>
          </div>
          
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

          <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.4 }}>
            <strong>Liability Disclaimer:</strong> Vicinity is not responsible for any lost, stolen, or damaged items resulting from rentals on this platform. Please secure collateral or take precautions when renting to others.
          </p>

          <button type="submit" disabled={loading} style={{ marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '18px', fontSize: '17px', background: 'var(--text-main)', color: 'var(--surface)', boxShadow: 'none' }}>
            <Upload size={22} />
            {loading ? 'Publishing...' : 'Publish Listing'}
          </button>
        </div>

      </form>
      </div>
    </div>
  );
}
