import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ShieldCheck, UserCheck, MapPin, AlertTriangle, EyeOff } from 'lucide-react';

export default function SafetyGuidelines() {
  const navigate = useNavigate();

  const rules = [
    {
      icon: <UserCheck size={24} className="text-volt" />,
      title: 'Verify Users Before Trading',
      description: 'Always check the user profile. Verified users have a blue checkmark, meaning their College ID and identity have been confirmed by our admins.'
    },
    {
      icon: <MapPin size={24} className="text-volt" />,
      title: 'Meet in Public Campus Spaces',
      description: 'Whenever exchanging an item, meet in well-lit, public areas on campus such as the library, student center, or a busy cafeteria.'
    },
    {
      icon: <EyeOff size={24} className="text-volt" />,
      title: 'Protect Your Personal Information',
      description: 'Use the in-app chat to communicate. Avoid sharing your phone number, social media, or exact room number unless absolutely necessary.'
    },
    {
      icon: <AlertTriangle size={24} className="text-volt" />,
      title: 'Report Suspicious Activity',
      description: 'If a listing seems too good to be true, or if a user behaves inappropriately, use the "Report" feature immediately to notify our admin team.'
    },
    {
      icon: <ShieldCheck size={24} className="text-volt" />,
      title: 'Inspect Before Renting',
      description: 'Both the owner and the renter should inspect the item at the time of exchange to agree on its condition before concluding the transaction.'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)', overflowY: 'auto' }} className="hide-scrollbar">
      <header style={{ height: '60px', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--surface-border)', background: 'var(--surface)', flexShrink: 0, position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate(-1)} style={{ width: '40px', height: '40px', padding: 0, borderRadius: '20px', background: 'var(--surface)', border: '1px solid var(--surface-border)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
          <ChevronLeft size={20} />
        </button>
        <h1 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Safety Guidelines</h1>
      </header>

      <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '32px', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '40px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', color: 'var(--danger)' }}>
            <ShieldCheck size={40} />
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text-main)', margin: '0 0 12px 0', letterSpacing: '-0.5px' }}>Your Safety First</h2>
          <p style={{ fontSize: '16px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
            We want CampusRent to be a trusted space for everyone. Follow these core safety principles when interacting with others.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {rules.map((rule, idx) => (
            <div key={idx} className="glass-panel animate-slide-up" style={{ padding: '20px', borderRadius: '20px', display: 'flex', gap: '16px', animationDelay: `${idx * 0.1}s` }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '24px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--primary)' }}>
                {rule.icon}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>{rule.title}</h3>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{rule.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '20px', background: 'rgba(244, 196, 48, 0.1)', borderRadius: '20px', border: '1px dashed var(--primary)', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-main)', fontWeight: 600, lineHeight: 1.5 }}>
            Have a safety concern or need help?
            <br />
            <span style={{ color: 'var(--primary)', fontWeight: 800, marginTop: '8px', display: 'inline-block' }}>Contact campus security or our admin team.</span>
          </p>
        </div>

        <div style={{ padding: '24px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '20px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 800, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={20} /> Legal Disclaimer & Terms
          </h3>
          <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--text-main)', lineHeight: 1.6 }}>
            <strong>CampusRent is a peer-to-peer facilitation platform.</strong> By using this platform, you explicitly agree that CampusRent, its developers, and its administrators act solely as an intermediary to connect students.
          </p>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--text-main)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li><strong>No Liability:</strong> CampusRent is not responsible or liable for any lost, stolen, damaged, or unreturned items.</li>
            <li><strong>User Responsibility:</strong> Any disputes, financial agreements, or interactions are strictly between the renter and the owner.</li>
            <li><strong>No Guarantees:</strong> We do not guarantee the quality, safety, or legality of items listed, nor the truth or accuracy of users' content or listings.</li>
            <li><strong>Risk Acceptance:</strong> You assume all risks associated with dealing with other users on the platform.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
