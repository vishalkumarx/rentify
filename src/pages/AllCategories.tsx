import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { CATEGORIES } from '../lib/constants';
import { useSEO } from '../hooks/useSEO';

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
// @ts-ignore
import imgDorm from '../assets/dorm essentials.PNG';
// @ts-ignore
import imgParty from '../assets/party supplies.PNG';
// @ts-ignore
import imgPhotography from '../assets/photography.PNG';
// @ts-ignore
import imgGaming from '../assets/gaming.PNG';
// @ts-ignore
import imgMusic from '../assets/usical instruments.PNG';
// @ts-ignore
import imgOthers from '../assets/others.PNG';

const visualCategories = [
  { id: 'Books and Stationary', title: 'Books and Stationary', img: imgBooks },
  { id: 'Clothing & Formalwear', title: 'Clothing & Formalwear', img: imgClothing },
  { id: 'Electronics', title: 'Electronics', img: imgElectronics },
  { id: 'Mobility', title: 'Mobility', img: imgMobility },
  { id: 'Sports Gear', title: 'Sports Gear', img: imgSports },
  { id: 'Tools & Hardware', title: 'Tools & Hardware', img: imgTools },
  { id: 'Dorm Essentials', title: 'Dorm Essentials', img: imgDorm },
  { id: 'Party Supplies', title: 'Party Supplies', img: imgParty },
  { id: 'Photography', title: 'Photography', img: imgPhotography },
  { id: 'Gaming', title: 'Gaming', img: imgGaming },
  { id: 'Music Instruments', title: 'Music Instruments', img: imgMusic },
  { id: 'Others', title: 'Others', img: imgOthers }
];

export default function AllCategories() {
  useSEO('All Categories', 'Browse all available categories on CampusRent');
  const navigate = useNavigate();
  const [columns, setColumns] = useState(window.innerWidth > 768 ? 4 : 2);

  useEffect(() => {
    const handleResize = () => setColumns(window.innerWidth > 768 ? 4 : 2);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      <header style={{ height: '60px', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--surface-border)', background: 'var(--surface)', flexShrink: 0, zIndex: 10 }}>
        <button onClick={() => navigate(-1)} style={{ width: '40px', height: '40px', padding: 0, borderRadius: '20px', background: 'var(--surface)', border: '1px solid var(--surface-border)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
          <ChevronLeft size={20} />
        </button>
        <h1 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>All Categories</h1>
      </header>

      <div style={{ padding: '24px 16px 100px 16px', flex: 1, overflowY: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: '16px' }}>
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
