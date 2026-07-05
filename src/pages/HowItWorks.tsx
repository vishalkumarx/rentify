import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, Handshake, ShieldCheck, RefreshCcw } from 'lucide-react';

export default function HowItWorks() {
  const navigate = useNavigate();

  const steps = [
    {
      icon: <Search size={32} className="text-volt" />,
      title: 'Discover & Browse',
      description: 'Explore a wide variety of items listed by your fellow campus mates. From textbooks to electronics and dorm essentials, find exactly what you need for a fraction of the cost.'
    },
    {
      icon: <Handshake size={32} className="text-volt" />,
      title: 'Connect & Request',
      description: 'Send a secure booking request to the item owner. Chat directly through the app to coordinate the pickup time and location right on campus.'
    },
    {
      icon: <ShieldCheck size={32} className="text-volt" />,
      title: 'Rent & Verify',
      description: 'Meet up, inspect the item, and confirm the rental. Our verified student-only network ensures a safe and trusted community for everyone.'
    },
    {
      icon: <RefreshCcw size={32} className="text-volt" />,
      title: 'Return & Review',
      description: 'Once you are done, return the item on time and leave a review to help build community trust. Sharing is caring!'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)', overflowY: 'auto' }} className="hide-scrollbar">
      <header style={{ height: '60px', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--surface-border)', background: 'var(--surface)', flexShrink: 0, position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate(-1)} style={{ width: '40px', height: '40px', padding: 0, borderRadius: '20px', background: 'var(--surface)', border: '1px solid var(--surface-border)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
          <ChevronLeft size={20} />
        </button>
        <h1 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>How It Works</h1>
      </header>

      <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '32px', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text-main)', margin: '0 0 12px 0', letterSpacing: '-0.5px' }}>Simple. Fast. Local.</h2>
          <p style={{ fontSize: '16px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
            Renting from your campus community is easier than you think. Here is how you can get started in four simple steps.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {steps.map((step, idx) => (
            <div key={idx} className="glass-panel animate-slide-up" style={{ padding: '24px', borderRadius: '24px', display: 'flex', gap: '20px', animationDelay: `${idx * 0.1}s` }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '32px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--primary)' }}>
                {step.icon}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>{step.title}</h3>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6 }}>{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={() => navigate('/')}
          style={{ background: 'var(--text-main)', color: 'white', border: 'none', padding: '16px 32px', borderRadius: '24px', fontSize: '16px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', marginTop: '16px' }}
        >
          Start Exploring
        </button>
      </div>
    </div>
  );
}
