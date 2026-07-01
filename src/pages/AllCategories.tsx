
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { CATEGORIES } from '../lib/constants';

// @ts-ignore
import imgBooks from '../assets/books and stationary.PNG';
// @ts-ignore
import imgClothing from '../assets/clothings and lab wears.PNG';
// @ts-ignore
import imgElectronics from '../assets/electronics.PNG';
// @ts-ignore
import imgMobility from '../assets/mobility.PNG';
// @ts-ignore
import imgSports from '../assets/sports.PNG';
// @ts-ignore
import imgTools from '../assets/tools and hardware.PNG';

const visualCategories = [
  { id: 'Books and Stationary', title: 'Books & Stationary', img: imgBooks },
  { id: 'Clothing & Formalwear', title: 'Clothing & Formalwear', img: imgClothing },
  { id: 'Electronics', title: 'Electronics', img: imgElectronics },
  { id: 'Mobility', title: 'Mobility', img: imgMobility },
  { id: 'Sports Gear', title: 'Sports Gear', img: imgSports },
  { id: 'Tools & Hardware', title: 'Tools & Hardware', img: imgTools }
];

export default function AllCategories() {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      <header style={{ padding: '16px', display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--surface-border)', background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', padding: '8px', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={24} />
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 0 8px', color: 'var(--text-main)' }}>All Categories</h1>
      </header>

      <div style={{ padding: '24px 16px', flex: 1, overflowY: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
          {visualCategories.map(cat => (
            <div 
              key={cat.id} 
              onClick={() => navigate(`/category/${encodeURIComponent(cat.title)}`)}
              style={{ display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'pointer' }}
            >
              <div style={{ width: '100%', aspectRatio: '1', borderRadius: '20px', overflow: 'hidden', background: 'var(--surface-border)', border: '1px solid var(--surface-border)' }}>
                <img src={cat.img} alt={cat.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', textAlign: 'center' }}>{cat.title}</span>
            </div>
          ))}

          {/* Render remaining categories that don't have visual images */}
          {CATEGORIES.filter(c => c !== 'All' && !visualCategories.some(vc => vc.title === c || vc.id === c)).map(cat => (
            <div 
              key={cat} 
              onClick={() => navigate(`/category/${encodeURIComponent(cat)}`)}
              style={{ display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'pointer' }}
            >
              <div style={{ width: '100%', aspectRatio: '1', borderRadius: '20px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--primary)' }}>
                <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)' }}>{cat.charAt(0)}</span>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', textAlign: 'center' }}>{cat}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
