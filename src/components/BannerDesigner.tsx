import React, { useState, useRef, useEffect } from 'react';
import { Type, Image as ImageIcon, Move, Maximize2, Trash2, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

type ElementType = 'text' | 'image';

interface CanvasElement {
  id: string;
  type: ElementType;
  content: string; // text string or image url
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  zIndex: number;
}

export function BannerDesigner({ onSave }: { onSave: (url: string) => void }) {
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [background, setBackground] = useState<string>('#ffffff'); // color or image url
  const [isBgImage, setIsBgImage] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Drag and Drop State
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Dimensions
  const canvasWidth = 800;
  const canvasHeight = 400; // 2:1 aspect ratio
  
  const addText = () => {
    const newElement: CanvasElement = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'text',
      content: 'Double click to edit',
      x: canvasWidth / 2 - 100,
      y: canvasHeight / 2 - 20,
      width: 200,
      height: 40,
      fontSize: 24,
      color: '#000000',
      fontWeight: 700,
      zIndex: elements.length + 1
    };
    setElements([...elements, newElement]);
    setSelectedId(newElement.id);
  };
  
  const addImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      const newElement: CanvasElement = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'image',
        content: url,
        x: canvasWidth / 2 - 100,
        y: canvasHeight / 2 - 100,
        width: 200,
        height: 200,
        zIndex: elements.length + 1
      };
      setElements([...elements, newElement]);
      setSelectedId(newElement.id);
    }
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setBackground(url);
      setIsBgImage(true);
    }
  };
  
  // Mouse Event Handlers for Dragging
  const handleMouseDown = (e: React.MouseEvent, id: string, action: 'drag' | 'resize') => {
    e.stopPropagation();
    setSelectedId(id);
    const element = elements.find(el => el.id === id);
    if (!element) return;
    
    if (action === 'drag') {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - element.x,
        y: e.clientY - element.y
      });
    } else {
      setIsResizing(true);
      setDragOffset({
        x: e.clientX - element.width,
        y: e.clientY - element.height
      });
    }
  };
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging && !isResizing) return;
      
      setElements(prev => prev.map(el => {
        if (el.id !== selectedId) return el;
        
        if (isDragging) {
          return {
            ...el,
            x: e.clientX - dragOffset.x,
            y: e.clientY - dragOffset.y
          };
        } else if (isResizing) {
          return {
            ...el,
            width: Math.max(50, e.clientX - dragOffset.x),
            height: Math.max(20, e.clientY - dragOffset.y)
          };
        }
        return el;
      }));
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };
    
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, selectedId, dragOffset]);
  
  const updateSelected = (updates: Partial<CanvasElement>) => {
    setElements(prev => prev.map(el => el.id === selectedId ? { ...el, ...updates } : el));
  };
  
  const deleteSelected = () => {
    setElements(prev => prev.filter(el => el.id !== selectedId));
    setSelectedId(null);
  };
  
  const selectedElement = elements.find(el => el.id === selectedId);

  const exportBanner = async () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    setSelectedId(null); // Deselect before export to hide borders
    
    try {
      // Small delay to let selection borders disappear
      await new Promise(r => setTimeout(r, 100));
      
      const canvas = await html2canvas(canvasRef.current, {
        scale: 2, // High resolution
        useCORS: true,
        backgroundColor: isBgImage ? null : background
      });
      
      canvas.toBlob(async (blob) => {
        if (!blob) throw new Error("Canvas to Blob failed");
        
        const fileName = `banner_${Date.now()}.png`;
        const { error } = await supabase.storage
          .from('item-images')
          .upload(`promos/${fileName}`, blob, { contentType: 'image/png' });
          
        if (error) throw error;
        
        const { data: publicUrlData } = supabase.storage
          .from('item-images')
          .getPublicUrl(`promos/${fileName}`);
          
        onSave(publicUrlData.publicUrl);
        toast.success("Banner generated successfully!");
      }, 'image/png');
      
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate banner");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '20px', height: '600px', background: 'var(--surface)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--surface-border)' }}>
      {/* Sidebar Controls */}
      <div style={{ width: '300px', padding: '20px', background: 'var(--bg-color)', borderRight: '1px solid var(--surface-border)', overflowY: 'auto' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 800 }}>Banner Tools</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          <button onClick={addText} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--surface-border)', cursor: 'pointer', fontWeight: 600 }}>
            <Type size={18} /> Add Heading
          </button>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--surface-border)', cursor: 'pointer', fontWeight: 600 }}>
            <ImageIcon size={18} /> Add Image
            <input type="file" accept="image/*" onChange={addImage} style={{ display: 'none' }} />
          </label>
        </div>
        
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 700 }}>Background</h4>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="color" 
              value={isBgImage ? '#ffffff' : background} 
              onChange={e => { setBackground(e.target.value); setIsBgImage(false); }}
              style={{ width: '40px', height: '40px', padding: 0, border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            />
            <label style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '8px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--surface-border)', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
              <ImageIcon size={16} /> Upload BG
              <input type="file" accept="image/*" onChange={handleBgUpload} style={{ display: 'none' }} />
            </label>
          </div>
        </div>
        
        {selectedElement && (
          <div style={{ padding: '16px', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--primary-glow)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>Edit Element</h4>
              <button onClick={deleteSelected} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}>
                <Trash2 size={16} />
              </button>
            </div>
            
            {selectedElement.type === 'text' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Text Content</label>
                  <textarea 
                    value={selectedElement.content} 
                    onChange={e => updateSelected({ content: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--surface-border)', marginTop: '4px', resize: 'none' }}
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Font Size</label>
                    <input 
                      type="number" 
                      value={selectedElement.fontSize || 24} 
                      onChange={e => updateSelected({ fontSize: Number(e.target.value) })}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--surface-border)', marginTop: '4px' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Color</label>
                    <input 
                      type="color" 
                      value={selectedElement.color || '#000000'} 
                      onChange={e => updateSelected({ color: e.target.value })}
                      style={{ width: '100%', height: '36px', padding: '2px', borderRadius: '6px', border: '1px solid var(--surface-border)', marginTop: '4px' }}
                    />
                  </div>
                </div>
                
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Font Weight</label>
                  <select 
                    value={selectedElement.fontWeight || 400} 
                    onChange={e => updateSelected({ fontWeight: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--surface-border)', marginTop: '4px' }}
                  >
                    <option value={400}>Normal</option>
                    <option value={600}>Semi Bold</option>
                    <option value={700}>Bold</option>
                    <option value={800}>Extra Bold</option>
                    <option value={900}>Black</option>
                  </select>
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Width</label>
                <input 
                  type="number" 
                  value={Math.round(selectedElement.width)} 
                  onChange={e => updateSelected({ width: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--surface-border)', marginTop: '4px' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Height</label>
                <input 
                  type="number" 
                  value={Math.round(selectedElement.height)} 
                  onChange={e => updateSelected({ height: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--surface-border)', marginTop: '4px' }}
                />
              </div>
            </div>
            
            <div style={{ marginTop: '12px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Z-Index (Layer)</label>
              <input 
                type="number" 
                value={selectedElement.zIndex} 
                onChange={e => updateSelected({ zIndex: Number(e.target.value) })}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--surface-border)', marginTop: '4px' }}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Canvas Area */}
      <div style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'auto' }} onClick={() => setSelectedId(null)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '800px', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Banner Preview (800x400)</h3>
          <button 
            onClick={(e) => { e.stopPropagation(); exportBanner(); }}
            disabled={isExporting}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', background: 'var(--primary)', color: '#000', border: 'none', fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--primary-glow)' }}
          >
            {isExporting ? 'Processing...' : <><Download size={16} /> Save Banner</>}
          </button>
        </div>
        
        {/* The actual canvas to be exported */}
        <div 
          ref={canvasRef}
          style={{
            position: 'relative',
            width: `${canvasWidth}px`,
            height: `${canvasHeight}px`,
            background: isBgImage ? `url(${background}) center/cover` : background,
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}
        >
          {elements.map(el => {
            const isSelected = el.id === selectedId;
            return (
              <div
                key={el.id}
                onClick={(e) => { e.stopPropagation(); setSelectedId(el.id); }}
                style={{
                  position: 'absolute',
                  left: `${el.x}px`,
                  top: `${el.y}px`,
                  width: `${el.width}px`,
                  height: el.type === 'image' ? `${el.height}px` : 'auto', // Auto height for text to prevent clipping unless forced
                  zIndex: el.zIndex,
                  border: isSelected ? '2px dashed var(--primary)' : '2px solid transparent',
                  cursor: isDragging && isSelected ? 'grabbing' : 'grab',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {/* Drag Handle */}
                {isSelected && (
                  <div 
                    onMouseDown={(e) => handleMouseDown(e, el.id, 'drag')}
                    style={{ position: 'absolute', top: '-12px', left: '-12px', width: '24px', height: '24px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'move', color: '#000', zIndex: 10 }}
                  >
                    <Move size={14} />
                  </div>
                )}
                
                {/* Resize Handle */}
                {isSelected && (
                  <div 
                    onMouseDown={(e) => handleMouseDown(e, el.id, 'resize')}
                    style={{ position: 'absolute', bottom: '-12px', right: '-12px', width: '24px', height: '24px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'se-resize', color: '#000', zIndex: 10 }}
                  >
                    <Maximize2 size={14} />
                  </div>
                )}
                
                {/* Content */}
                {el.type === 'text' ? (
                  <div style={{ 
                    width: '100%', 
                    fontSize: `${el.fontSize}px`, 
                    color: el.color, 
                    fontWeight: el.fontWeight,
                    lineHeight: 1.2,
                    userSelect: 'none',
                    whiteSpace: 'pre-wrap',
                    textAlign: 'center'
                  }}>
                    {el.content}
                  </div>
                ) : (
                  <img 
                    src={el.content} 
                    alt="Element" 
                    style={{ width: '100%', height: '100%', objectFit: 'contain', userSelect: 'none', pointerEvents: 'none' }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
