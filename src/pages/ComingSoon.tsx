import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Sparkles } from 'lucide-react';

export default function ComingSoon() {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      <header style={{ height: '60px', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--surface-border)', background: 'var(--surface)', flexShrink: 0, zIndex: 10 }}>
        <button onClick={() => navigate(-1)} style={{ width: '40px', height: '40px', padding: 0, borderRadius: '20px', background: 'var(--surface)', border: '1px solid var(--surface-border)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
          <ChevronLeft size={20} />
        </button>
        <h1 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Coming Soon</h1>
      </header>

      <div className="animate-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '40px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', color: 'var(--primary)' }}>
          <Sparkles size={40} />
        </div>
        <h2 style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text-main)', margin: '0 0 16px 0', letterSpacing: '-0.5px' }}>
          Big Things Are Coming!
        </h2>
        <p style={{ fontSize: '16px', color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 32px 0', maxWidth: '300px' }}>
          We are working hard to bring this feature to life. Check back soon for exciting updates!
        </p>
        <button 
          onClick={() => navigate('/')}
          style={{ background: 'var(--text-main)', color: 'white', border: 'none', padding: '16px 32px', borderRadius: '24px', fontSize: '16px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
        >
          Back to Explore
        </button>
      </div>
    </div>
  );
}
