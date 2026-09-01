import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const RakhiBanner: React.FC = () => {
  const navigate = useNavigate();
  const particleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (particleRef.current) {
      const container = particleRef.current;
      container.innerHTML = ''; 
      const count = 40;

      for (let i = 0; i < count; i++) {
        const drop = document.createElement("div");
        drop.className = "rakhi-particle";
        drop.style.left = Math.random() * 100 + "%";
        drop.style.top = Math.random() * 100 + "%";
        drop.style.animationDuration = (3 + Math.random() * 4) + "s";
        drop.style.animationDelay = Math.random() * 2 + "s";
        const size = (4 + Math.random() * 8);
        drop.style.width = size + "px";
        drop.style.height = size + "px";
        drop.style.opacity = (0.2 + Math.random() * 0.6).toString();
        container.appendChild(drop);
      }
    }
  }, []);

  return (
    <>
      <style>{`
        .rakhi-banner {
          --bg1: #8b005d; /* Deep magenta */
          --bg2: #e63946; /* Festive red */
          --text: #ffffff;
          --muted: #fcd5ce;
          --accent: #ffb703; /* Yellow gold */
          --accent2: #fb8500; /* Orange */
          --shadow: rgba(230, 57, 70, 0.35);

          position: relative;
          width: 100%;
          height: 280px;
          border-radius: 0;
          overflow: hidden;
          background:
            radial-gradient(circle at 80% 20%, rgba(255, 183, 3, 0.25), transparent 40%),
            linear-gradient(135deg, var(--bg1), var(--bg2));
          box-shadow: 0 18px 50px var(--shadow);
          border: 1px solid rgba(255,255,255,0.15);
          cursor: pointer;
          transform: translateZ(0);
          flex-shrink: 0;
        }

        .rakhi-banner::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(to bottom, rgba(255,255,255,0.1), transparent 40%);
          pointer-events: none;
        }

        .rakhi-particle-layer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1;
        }

        .rakhi-particle {
          position: absolute;
          border-radius: 50%;
          background: #ffb703;
          box-shadow: 0 0 10px #ffb703, 0 0 20px #fb8500;
          animation: floatParticle linear infinite alternate;
        }

        .rakhi-content {
          position: absolute;
          inset: 0;
          z-index: 4;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 36px 36px 36px 38px;
          color: var(--text);
        }

        .rakhi-eyebrow {
          display: inline-flex;
          width: fit-content;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.25);
          color: #fff;
          font-size: 0.82rem;
          margin-bottom: 14px;
          backdrop-filter: blur(8px);
          font-weight: 600;
        }

        .rakhi-title {
          margin: 0;
          font-size: clamp(1.8rem, 4.5vw, 4.3rem);
          line-height: 1;
          font-weight: 900;
          letter-spacing: -0.02em;
          text-shadow: 0 4px 16px rgba(0,0,0,0.25);
          background: linear-gradient(to right, #ffffff, #ffb703);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .rakhi-subtitle {
          max-width: 540px;
          margin: 14px 0 20px;
          color: var(--muted);
          font-size: clamp(0.98rem, 1.6vw, 1.08rem);
          line-height: 1.55;
          text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .rakhi-cta-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 2px;
        }

        .rakhi-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 11px 16px;
          border-radius: 12px;
          font-weight: 700;
          text-decoration: none;
          transition: transform 0.15s ease, filter 0.15s ease;
          border: 1px solid transparent;
        }

        .rakhi-btn:hover {
          transform: translateY(-1px);
          filter: brightness(1.08);
        }

        .rakhi-btn-primary {
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          color: #580000;
          box-shadow: 0 10px 24px rgba(251, 133, 0, 0.4);
        }

        .rakhi-btn-secondary {
          background: rgba(255,255,255,0.15);
          color: #fff;
          border-color: rgba(255,255,255,0.3);
          backdrop-filter: blur(8px);
        }

        .rakhi-details {
          position: absolute;
          right: 28px;
          bottom: 22px;
          z-index: 4;
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .rakhi-pill {
          padding: 9px 12px;
          border-radius: 999px;
          background: rgba(139, 0, 93, 0.6);
          border: 1px solid rgba(255,255,255,0.2);
          color: #fff;
          font-size: 0.82rem;
          backdrop-filter: blur(8px);
        }

        .rakhi-highlight {
          color: var(--accent);
          font-weight: 700;
        }

        @keyframes floatParticle {
          0% {
            transform: translateY(0) translateX(0) scale(1);
          }
          100% {
            transform: translateY(-20px) translateX(10px) scale(1.2);
          }
        }

        @media (max-width: 640px) {
          .rakhi-banner {
            height: 380px;
          }

          .rakhi-content {
            padding: 24px 22px;
            justify-content: flex-start;
          }

          .rakhi-details {
            left: 22px;
            right: 22px;
            bottom: 20px;
            justify-content: flex-start;
            gap: 8px;
          }
        }
      `}</style>

      <div className="rakhi-banner" onClick={() => navigate('/category/Gifts')}>
        <div className="rakhi-particle-layer" ref={particleRef}></div>

        <div className="rakhi-content">
          <div className="rakhi-eyebrow">🪔 Raksha Bandhan Special</div>
          <h1 className="rakhi-title">Celebrate the Bond</h1>
          <p className="rakhi-subtitle">
            Find the perfect rental gifts for your sibling this Rakhi. From premium electronics to traditional wear.
          </p>
          <div className="rakhi-cta-row">
            <div className="rakhi-btn rakhi-btn-primary" onClick={(e) => { e.stopPropagation(); navigate('/category/Gifts'); }}>View Gifts</div>
            <div className="rakhi-btn rakhi-btn-secondary" onClick={(e) => { e.stopPropagation(); navigate('/post'); }}>List a Gift Item</div>
          </div>
        </div>

        <div className="rakhi-details">
          <div className="rakhi-pill"><span className="rakhi-highlight">Festive</span> Deals</div>
          <div className="rakhi-pill">Limited Time</div>
        </div>
      </div>
    </>
  );
};

export default RakhiBanner;
