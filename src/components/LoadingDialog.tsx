import { createPortal } from 'react-dom';

export function LoadingDialog({ message = 'Loading...' }: { message?: string }) {
  return createPortal(
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 999999,
      background: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div className="glass-panel animate-slide-up" style={{
        background: 'var(--surface)',
        padding: '32px 48px',
        borderRadius: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        border: '1px solid var(--surface-border)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        textAlign: 'center'
      }}>
        <div style={{
          width: '48px', height: '48px',
          borderRadius: '50%',
          border: '4px solid var(--surface-border)',
          borderTopColor: 'var(--primary)',
          animation: 'spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite'
        }} />
        <div style={{
          fontSize: '16px',
          fontWeight: 700,
          color: 'var(--text-main)',
          letterSpacing: '0.5px'
        }}>
          {message}
        </div>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>,
    document.body
  );
}
