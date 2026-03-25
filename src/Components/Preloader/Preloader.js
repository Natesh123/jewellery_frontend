import React from 'react';

const Preloader = () => {
  return (
    <div className="preloader">
      <div className="background-pattern"></div>
      
      <div className="loader-container">
        <div className="gold-bars-container">
          <div className="gold-bar bar-1"></div>
          <div className="gold-bar bar-2"></div>
          <div className="gold-bar bar-3"></div>
          <div className="gold-bar bar-4"></div>
        </div>
        
        <div className="coin-container">
          <div className="coin-outer">
            <div className="coin-inner">
              <div className="rupee-symbol">₹</div>
            </div>
          </div>
        </div>
        
        <div className="brand-container">
          <h1 className="brand-name">Amaya Gold Point</h1>
          <div className="brand-tagline">Premium Gold Solutions</div>
        </div>
        
        <div className="loading-container">
          <div className="loading-bar">
            <div className="loading-progress"></div>
          </div>
          <div className="loading-text">Loading...</div>
        </div>
      </div>

      <style jsx>{`
        .preloader {
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          width: 100vw;
          background: var(--gradient-dark);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          overflow: hidden;
        }

        .background-pattern {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: 
            radial-gradient(circle at 20% 20%, rgba(201, 153, 24, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(0, 179, 179, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 40% 70%, rgba(201, 153, 24, 0.05) 0%, transparent 50%);
          animation: patternFloat 20s ease-in-out infinite;
        }

        .loader-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
        }

        .gold-bars-container {
          display: flex;
          gap: 8px;
          margin-bottom: 1rem;
        }

        .gold-bar {
          width: 4px;
          height: 40px;
          background: var(--gradient-gold);
          border-radius: 2px;
          animation: goldPulse 1.5s ease-in-out infinite;
          box-shadow: 0 0 10px rgba(201, 153, 24, 0.3);
        }

        .gold-bar.bar-1 { animation-delay: 0s; }
        .gold-bar.bar-2 { animation-delay: 0.2s; }
        .gold-bar.bar-3 { animation-delay: 0.4s; }
        .gold-bar.bar-4 { animation-delay: 0.6s; }

        .coin-container {
          position: relative;
          margin: 1rem 0;
        }

        .coin-outer {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: var(--gradient-gold);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 
            0 0 30px rgba(201, 153, 24, 0.4),
            inset 0 0 20px rgba(255, 255, 255, 0.1);
          animation: coinFloat 3s ease-in-out infinite;
          position: relative;
          overflow: hidden;
        }

        .coin-outer::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          animation: coinShine 2s ease-in-out infinite;
        }

        .coin-inner {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: var(--ebony-800);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--gold-400);
          position: relative;
          z-index: 2;
        }

        .rupee-symbol {
          font-size: 40px;
          font-weight: bold;
          color: var(--gold-400);
          text-shadow: 
            0 0 10px rgba(201, 153, 24, 0.5),
            0 2px 4px rgba(0, 0, 0, 0.3);
          animation: symbolPulse 2s ease-in-out infinite;
        }

        .brand-container {
          text-align: center;
          color: var(--text-inverse);
        }

        .brand-name {
          font-size: 2rem;
          font-weight: 700;
          margin: 0;
          background: var(--gradient-gold);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: brandGlow 2s ease-in-out infinite alternate;
          letter-spacing: 1px;
        }

        .brand-tagline {
          font-size: 0.9rem;
          color: var(--ebony-300);
          margin-top: 0.5rem;
          font-weight: 300;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          margin-top: 1rem;
        }

        .loading-bar {
          width: 200px;
          height: 3px;
          background: var(--ebony-700);
          border-radius: 2px;
          overflow: hidden;
          position: relative;
        }

        .loading-progress {
          height: 100%;
          background: var(--gradient-gold);
          border-radius: 2px;
          animation: loadingProgress 2s ease-in-out infinite;
          box-shadow: 0 0 10px rgba(201, 153, 24, 0.5);
        }

        .loading-text {
          font-size: 0.9rem;
          color: var(--ebony-300);
          font-weight: 300;
          letter-spacing: 1px;
          animation: textFade 1.5s ease-in-out infinite alternate;
        }

        @keyframes patternFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }

        @keyframes goldPulse {
          0%, 100% { 
            transform: scaleY(0.5);
            opacity: 0.5;
          }
          50% { 
            transform: scaleY(1);
            opacity: 1;
          }
        }

        @keyframes coinFloat {
          0%, 100% { transform: translateY(0px) rotateY(0deg); }
          50% { transform: translateY(-10px) rotateY(180deg); }
        }

        @keyframes coinShine {
          0% { left: -100%; }
          100% { left: 100%; }
        }

        @keyframes symbolPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        @keyframes brandGlow {
          0% { filter: brightness(1); }
          100% { filter: brightness(1.2); }
        }

        @keyframes loadingProgress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }

        @keyframes textFade {
          0% { opacity: 0.5; }
          100% { opacity: 1; }
        }

        @media (max-width: 768px) {
          .coin-outer {
            width: 80px;
            height: 80px;
          }

          .coin-inner {
            width: 64px;
            height: 64px;
          }

          .rupee-symbol {
            font-size: 32px;
          }

          .brand-name {
            font-size: 1.5rem;
          }

          .brand-tagline {
            font-size: 0.8rem;
          }

          .loading-bar {
            width: 150px;
          }

          .gold-bar {
            height: 30px;
          }
        }

        @media (max-width: 480px) {
          .loader-container {
            gap: 1.5rem;
          }

          .brand-name {
            font-size: 1.25rem;
          }

          .brand-tagline {
            font-size: 0.7rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Preloader;