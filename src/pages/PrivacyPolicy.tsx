import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Lock, FileText, Shield } from 'lucide-react';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)', overflowY: 'auto' }} className="hide-scrollbar">
      <header style={{ height: '60px', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--surface-border)', background: 'var(--surface)', flexShrink: 0, position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate(-1)} style={{ width: '40px', height: '40px', padding: 0, borderRadius: '20px', background: 'var(--surface)', border: '1px solid var(--surface-border)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
          <ChevronLeft size={20} />
        </button>
        <h1 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Privacy Policy</h1>
      </header>

      <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '32px', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '40px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', color: 'var(--primary)' }}>
            <Lock size={40} />
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text-main)', margin: '0 0 12px 0', letterSpacing: '-0.5px' }}>Privacy & Data Policy</h2>
          <p style={{ fontSize: '16px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
            How we handle your data and protect your privacy on CampusRent.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', background: 'var(--surface)', padding: '32px', borderRadius: '24px', border: '1px solid var(--surface-border)' }}>
          <section>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} className="text-volt" /> 1. Information We Collect
            </h3>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              When you register for CampusRent, we collect basic information required to facilitate peer-to-peer rentals, such as your email address, full name, and profile details. If you undergo ID Verification, your College ID and Aadhar Card images are securely uploaded for administrative review to establish trust.
            </p>
          </section>
          
          <section>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={20} className="text-volt" /> 2. How We Use Your Information
            </h3>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Your data is solely used to operate the CampusRent platform, verify identities for community safety, and enable communications between renters and owners. We do NOT sell your personal information to third parties. Verified status badges are displayed to reassure other users, but your actual verification documents remain private to the admin team.
            </p>
          </section>
          
          <section>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={20} className="text-volt" /> 3. Liability & Responsibility
            </h3>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              CampusRent provides the software infrastructure to connect students. We are not a party to the actual rental agreements between users.
            </p>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <li>We assume no liability for the accuracy of user profiles, listing details, or the condition of rented items.</li>
              <li>Users are entirely responsible for their own data, communications, and real-world interactions.</li>
              <li>CampusRent is not liable for data breaches resulting from unauthorized access beyond our reasonable security measures.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
