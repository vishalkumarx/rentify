import { ArrowRight } from 'lucide-react';

export default function SurjitPatarBanner() {
  return (
    <div className="card-hover item-card inline-promo-banner" style={{ 
      gridColumn: '1 / -1', 
      margin: '16px 0',
      cursor: 'pointer', 
      borderRadius: '0', 
      position: 'relative', 
      overflow: 'hidden', 
      display: 'flex', 
      background: '#efbe39' // Closest yellow match to the image
    }}>
      {/* Left Content Side */}
      <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 10 }}>
        <h2 style={{ 
          fontSize: 'clamp(24px, 5vw, 64px)', 
          margin: 0, 
          fontWeight: 800, 
          color: '#000', 
          letterSpacing: '2px',
          textTransform: 'uppercase',
          textAlign: 'center',
          lineHeight: 1
        }}>
          SURJIT PATAR
        </h2>
        
        <div style={{ 
          background: '#000', 
          color: '#fff', 
          padding: '8px 16px', 
          marginTop: '12px', 
          letterSpacing: '4px', 
          fontSize: 'clamp(10px, 2vw, 16px)', 
          fontWeight: 600,
          textTransform: 'uppercase'
        }}>
          POETRY BOOKS
        </div>
        
        <button style={{ 
          marginTop: '20px', 
          background: 'transparent', 
          border: 'none', 
          color: '#000', 
          fontSize: '14px', 
          fontWeight: 600, 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          cursor: 'pointer' 
        }}>
          Explore now 
          <span style={{ 
            background: '#000', 
            color: '#efbe39', 
            borderRadius: '50%', 
            width: '20px', 
            height: '20px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <ArrowRight size={12} />
          </span>
        </button>
      </div>

      {/* Right Image Side */}
      <div style={{ flex: 1, position: 'relative', height: '100%', minHeight: '100%' }}>
        {/* We use clipPath to hide the left half of the original image (where the baked text is) */}
        <img 
          src="/assets/surjit_patar.png" 
          alt="Surjit Patar" 
          style={{ 
            position: 'absolute', 
            right: 0, 
            top: 0, 
            height: '100%', 
            width: '200%', 
            objectFit: 'cover', 
            objectPosition: 'right',
            clipPath: 'inset(0 0 0 50%)'
          }} 
        />
      </div>
    </div>
  );
}
