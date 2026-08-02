import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const MonsoonBanner: React.FC = () => {
  const navigate = useNavigate();
  const rainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (rainRef.current) {
      const rain = rainRef.current;
      rain.innerHTML = ''; // Clear existing drops on remount
      const count = 90;

      for (let i = 0; i < count; i++) {
        const drop = document.createElement("div");
        drop.className = "drop";
        drop.style.left = Math.random() * 100 + "%";
        drop.style.animationDuration = (0.45 + Math.random() * 0.75) + "s";
        drop.style.animationDelay = Math.random() * 2 + "s";
        drop.style.height = (12 + Math.random() * 18) + "px";
        drop.style.opacity = (0.25 + Math.random() * 0.55).toString();
        rain.appendChild(drop);
      }
    }
  }, []);

  return (
    <>
      <style>{`
        .monsoon-banner {
          --bg1: #1a1a1a;
          --bg2: #000000;
          --text: #ffffff;
          --muted: #cbd5e1;
          --accent: var(--primary); /* Yellow */
          --accent2: #ffd700;
          --shadow: rgba(0, 0, 0, 0.35);

          position: relative;
          width: 100%;
          height: 280px;
          border-radius: 24px;
          overflow: hidden;
          background:
            radial-gradient(circle at 20% 20%, rgba(244, 196, 48, 0.16), transparent 28%),
            linear-gradient(180deg, var(--bg1), var(--bg2));
          box-shadow: 0 18px 50px var(--shadow);
          border: 1px solid rgba(255,255,255,0.08);
          cursor: pointer;
          transform: translateZ(0);
          flex-shrink: 0;
        }

        .monsoon-banner::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(to bottom, rgba(255,255,255,0.05), transparent 40%),
            linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.03) 45%, transparent 60%);
          pointer-events: none;
        }

        .monsoon-cloud {
          position: absolute;
          top: 42px;
          right: 52px;
          width: 180px;
          height: 58px;
          background: #2a2a2a;
          border-radius: 999px;
          box-shadow:
            -54px 16px 0 -10px #2a2a2a,
            -18px -18px 0 -14px #2a2a2a,
            36px -12px 0 -14px #2a2a2a,
            76px 14px 0 -18px #2a2a2a;
          opacity: 0.95;
          animation: floatCloud 5s ease-in-out infinite alternate;
        }

        .monsoon-rain-layer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.9;
          filter: blur(0.15px);
        }

        .drop {
          position: absolute;
          top: -18px;
          width: 2px;
          height: 18px;
          border-radius: 999px;
          background: linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(255,255,255,0.08));
          animation: fall linear infinite;
        }

        .monsoon-flash {
          position: absolute;
          inset: 0;
          background: rgba(255,255,255,0);
          pointer-events: none;
          animation: lightning 8s infinite;
          z-index: 2;
        }

        .monsoon-bolt {
          position: absolute;
          top: 62px;
          right: 138px;
          width: 0;
          height: 0;
          opacity: 0;
          border-left: 8px solid transparent;
          border-right: 4px solid transparent;
          border-top: 34px solid rgba(244, 196, 48, 0.98); /* Yellow lightning */
          transform: rotate(18deg);
          filter: drop-shadow(0 0 16px rgba(244, 196, 48, 0.95));
          animation: boltFlash 8s infinite;
          z-index: 3;
        }

        .monsoon-bolt::before {
          content: "";
          position: absolute;
          top: -24px;
          left: -16px;
          width: 0;
          height: 0;
          border-left: 7px solid transparent;
          border-right: 4px solid transparent;
          border-top: 26px solid rgba(244, 196, 48, 0.98);
          transform: rotate(-30deg);
        }

        .monsoon-content {
          position: absolute;
          inset: 0;
          z-index: 4;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 36px 36px 36px 38px;
          color: var(--text);
        }

        .monsoon-eyebrow {
          display: inline-flex;
          width: fit-content;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.1);
          color: #e2e8f0;
          font-size: 0.82rem;
          margin-bottom: 14px;
          backdrop-filter: blur(8px);
        }

        .monsoon-title {
          margin: 0;
          font-size: clamp(1.8rem, 4.5vw, 4.3rem);
          line-height: 1;
          font-weight: 900;
          letter-spacing: -0.04em;
          text-shadow: 0 8px 24px rgba(0,0,0,0.35);
        }

        .monsoon-subtitle {
          max-width: 540px;
          margin: 14px 0 20px;
          color: var(--muted);
          font-size: clamp(0.98rem, 1.6vw, 1.08rem);
          line-height: 1.55;
        }

        .monsoon-cta-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 2px;
        }

        .monsoon-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 11px 16px;
          border-radius: 12px;
          font-weight: 700;
          text-decoration: none;
          transition: transform 0.15s ease, filter 0.15s ease, background 0.15s ease;
          border: 1px solid transparent;
        }

        .monsoon-btn:hover {
          transform: translateY(-1px);
          filter: brightness(1.04);
        }

        .monsoon-btn-primary {
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          color: #000;
          box-shadow: 0 10px 24px rgba(244, 196, 48, 0.25);
        }

        .monsoon-btn-secondary {
          background: rgba(255,255,255,0.08);
          color: #fff;
          border-color: rgba(255,255,255,0.12);
          backdrop-filter: blur(8px);
        }

        .monsoon-details {
          position: absolute;
          right: 28px;
          bottom: 22px;
          z-index: 4;
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .monsoon-pill {
          padding: 9px 12px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.55);
          border: 1px solid rgba(255,255,255,0.1);
          color: #e2e8f0;
          font-size: 0.82rem;
          backdrop-filter: blur(8px);
        }

        .monsoon-highlight {
          color: var(--accent);
          font-weight: 700;
        }

        @keyframes fall {
          0% {
            transform: translateY(-10vh);
          }
          100% {
            transform: translateY(115vh);
          }
        }

        @keyframes floatCloud {
          from {
            transform: translateX(-8px);
          }
          to {
            transform: translateX(8px);
          }
        }

        @keyframes lightning {
          0%, 90%, 100% { background: rgba(255,255,255,0); }
          91% { background: rgba(255,255,255,0.10); }
          92% { background: rgba(255,255,255,0.45); }
          93% { background: rgba(255,255,255,0.08); }
          94% { background: rgba(255,255,255,0); }
          98% { background: rgba(255,255,255,0.20); }
          99% { background: rgba(255,255,255,0); }
        }

        @keyframes boltFlash {
          0%, 90%, 100% { opacity: 0; transform: rotate(18deg) scale(0.85); }
          91% { opacity: 1; transform: rotate(18deg) scale(1); }
          92% { opacity: 0.2; }
          93% { opacity: 1; transform: rotate(18deg) scale(1.06); }
          94% { opacity: 0; }
          98% { opacity: 1; }
          99% { opacity: 0; }
        }

        @media (max-width: 640px) {
          .monsoon-banner {
            height: 400px;
          }

          .monsoon-content {
            padding: 24px 22px;
            justify-content: flex-start;
          }

          .monsoon-details {
            left: 22px;
            right: 22px;
            bottom: 20px;
            justify-content: flex-start;
            gap: 8px;
          }

          .monsoon-cloud {
            top: 30px;
            right: 26px;
            transform: scale(0.88);
            transform-origin: top right;
          }

          .monsoon-bolt {
            right: 116px;
            top: 52px;
          }
        }
      `}</style>

      <div className="monsoon-banner" onClick={() => navigate('/category/Monsoon')}>
        <div className="monsoon-flash"></div>
        <div className="monsoon-bolt"></div>
        <div className="monsoon-cloud"></div>
        <div className="monsoon-rain-layer" ref={rainRef}></div>

        <div className="monsoon-content">
          <div className="monsoon-eyebrow">🌧️ Seasonal Category • Campus Rentals</div>
          <h1 className="monsoon-title">Monsoon Essentials</h1>
          <p className="monsoon-subtitle">
            Rent monsoon-ready items from fellow students — umbrellas, raincoats, waterproof bags, gumboots, and more.
          </p>
          <div className="monsoon-cta-row">
            <div className="monsoon-btn monsoon-btn-primary" onClick={(e) => { e.stopPropagation(); navigate('/category/Monsoon'); }}>Explore Items</div>
            <div className="monsoon-btn monsoon-btn-secondary" onClick={(e) => { e.stopPropagation(); navigate('/post'); }}>List an Item</div>
          </div>
        </div>

        <div className="monsoon-details">
          <div className="monsoon-pill"><span className="monsoon-highlight">Verified</span> student rentals</div>
          <div className="monsoon-pill">Available during rainy season</div>
        </div>
      </div>
    </>
  );
};

export default MonsoonBanner;
