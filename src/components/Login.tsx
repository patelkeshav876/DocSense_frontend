'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const { login, register } = useAuth();

  useEffect(() => {
    // Trigger mount animations
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isRegister) {
        await register(email, password);
      } else {
        await login(email, password);
      }
    } catch (error) {
      alert('Error: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  // Floating particles data
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    left: `${(i * 23.7 + 5) % 95}%`,
    top: `${(i * 17.3 + 8) % 88}%`,
    size: i % 3 === 0 ? 3 : i % 3 === 1 ? 2 : 1.5,
    delay: `${(i * 0.4) % 4}s`,
    duration: `${4 + (i % 4)}s`,
    opacity: i % 4 === 0 ? 0.5 : 0.25,
  }));

  return (
    <div className="lr-root" ref={containerRef}>
      {/* Cursor glow */}
      <div
        className="lr-cursor-glow"
        style={{ left: mousePos.x - 200, top: mousePos.y - 200 }}
      />

      {/* Animated grid */}
      <div className="lr-grid" />

      {/* Floating particles */}
      <div className="lr-particles">
        {particles.map(p => (
          <div
            key={p.id}
            className="lr-particle"
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              animationDelay: p.delay,
              animationDuration: p.duration,
              opacity: p.opacity,
            }}
          />
        ))}
      </div>

      {/* Diagonal accent line */}
      <div className="lr-diagonal" />

      {/* Left panel */}
      <div className={`lr-left ${mounted ? 'lr-left--in' : ''}`}>
        <div className="lr-brand">
          <div className="lr-logo-wrap">
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
              <rect x="2" y="2" width="18" height="24" rx="2" stroke="#D4A853" strokeWidth="1.5"/>
              <path d="M6 8h10M6 12h10M6 16h6" stroke="#D4A853" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="20" cy="20" r="6" fill="#0F0F0E" stroke="#D4A853" strokeWidth="1.5"/>
              <path d="M18 20h4M20 18v4" stroke="#D4A853" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <div className="lr-logo-ring" />
          </div>
          <span className="lr-brand-name">DocuSense</span>
        </div>

        <div className="lr-hero">
          <div className="lr-eyebrow">AI Document Intelligence</div>
          <h1 className="lr-headline">
            <span className="lr-word lr-word-1">Interrogate</span>
            <span className="lr-word lr-word-2"> your</span>
            <br />
            <span className="lr-word lr-word-3 lr-word-accent">documents.</span>
          </h1>
          <p className="lr-subhead">
            Upload PDFs, Word files, or text — then ask anything.
            Your AI research partner is ready.
          </p>
        </div>

        <div className="lr-features">
          {[
            { sym: '◈', text: 'RAG-powered search across all documents', delay: '0.6s' },
            { sym: '◉', text: 'Voice-to-text for hands-free querying', delay: '0.75s' },
            { sym: '◆', text: 'Full conversation history preserved', delay: '0.9s' },
          ].map((f, i) => (
            <div
              key={i}
              className={`lr-feat ${mounted ? 'lr-feat--in' : ''}`}
              style={{ transitionDelay: f.delay }}
            >
              <span className="lr-feat-sym">{f.sym}</span>
              <span className="lr-feat-text">{f.text}</span>
            </div>
          ))}
        </div>

        {/* Animated counter row */}
        <div className={`lr-stats ${mounted ? 'lr-stats--in' : ''}`}>
          {[
            { val: '50K+', label: 'documents analyzed' },
            { val: '99%', label: 'uptime' },
            { val: '<1s', label: 'response time' },
          ].map((s, i) => (
            <div key={i} className="lr-stat">
              <span className="lr-stat-val">{s.val}</span>
              <span className="lr-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel / Auth card */}
      <div className={`lr-right ${mounted ? 'lr-right--in' : ''}`}>
        <div className="lr-card">
          <div className="lr-card-glow" />

          <div className="lr-card-header">
            <h2 className="lr-card-title">
              {isRegister ? 'Create account' : 'Welcome back'}
            </h2>
            <p className="lr-card-sub">
              {isRegister ? 'Start analyzing documents in seconds.' : 'Sign in to your workspace.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="lr-form">
            <div className="lr-field">
              <label className="lr-label">Email address</label>
              <div className="lr-input-wrap">
                <input
                  type="email"
                  required
                  className="lr-input"
                  placeholder="you@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
                <div className="lr-input-line" />
              </div>
            </div>

            <div className="lr-field">
              <label className="lr-label">Password</label>
              <div className="lr-input-wrap">
                <input
                  type="password"
                  required
                  className="lr-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <div className="lr-input-line" />
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="lr-btn">
              <span className={`lr-btn-text ${isLoading ? 'lr-btn-text--hide' : ''}`}>
                {isRegister ? 'Create account' : 'Sign in'}
                <span className="lr-btn-arrow">→</span>
              </span>
              {isLoading && <span className="lr-spinner" />}
              <div className="lr-btn-shine" />
            </button>
          </form>

          <div className="lr-switch">
            <span className="lr-switch-text">
              {isRegister ? 'Already have an account?' : 'New to DocuSense?'}
            </span>
            <button className="lr-switch-btn" onClick={() => setIsRegister(!isRegister)}>
              {isRegister ? 'Sign in' : 'Create account'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@300;400;500&family=Outfit:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .lr-root {
          min-height: 100vh;
          display: flex;
          background: #0B0B0A;
          font-family: 'Outfit', sans-serif;
          position: relative;
          overflow: hidden;
        }

        /* Cursor glow */
        .lr-cursor-glow {
          position: fixed;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(212,168,83,0.07) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
          transition: left 0.15s ease-out, top 0.15s ease-out;
        }

        /* Animated grid */
        .lr-grid {
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(212,168,83,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(212,168,83,0.05) 1px, transparent 1px);
          background-size: 52px 52px;
          animation: gridDrift 20s ease-in-out infinite alternate;
          pointer-events: none;
          z-index: 0;
        }

        @keyframes gridDrift {
          from { background-position: 0 0; }
          to { background-position: 26px 26px; }
        }

        /* Particles */
        .lr-particles {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }

        .lr-particle {
          position: absolute;
          border-radius: 50%;
          background: #D4A853;
          animation: floatParticle var(--dur, 5s) ease-in-out infinite alternate;
        }

        @keyframes floatParticle {
          0% { transform: translateY(0px) translateX(0px) scale(1); }
          33% { transform: translateY(-18px) translateX(8px) scale(1.2); }
          66% { transform: translateY(-8px) translateX(-12px) scale(0.9); }
          100% { transform: translateY(-24px) translateX(4px) scale(1.1); }
        }

        /* Diagonal line */
        .lr-diagonal {
          position: fixed;
          top: -20%;
          right: 28%;
          width: 1px;
          height: 140%;
          background: linear-gradient(to bottom, transparent, rgba(212,168,83,0.08) 30%, rgba(212,168,83,0.12) 60%, transparent);
          transform: rotate(-8deg);
          pointer-events: none;
          z-index: 0;
          animation: diagonalPulse 6s ease-in-out infinite;
        }

        @keyframes diagonalPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        /* Left panel */
        .lr-left {
          flex: 1;
          padding: 3rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          z-index: 1;
          opacity: 0;
          transform: translateX(-40px);
          transition: opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1);
        }
        .lr-left--in { opacity: 1; transform: translateX(0); }

        /* Brand */
        .lr-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .lr-logo-wrap {
          position: relative;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(212,168,83,0.25);
          border-radius: 8px;
          background: rgba(212,168,83,0.05);
        }

        .lr-logo-ring {
          position: absolute;
          inset: -4px;
          border-radius: 12px;
          border: 1px solid rgba(212,168,83,0.15);
          animation: ringPulse 3s ease-in-out infinite;
        }

        @keyframes ringPulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.08); opacity: 0; }
        }

        .lr-brand-name {
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          color: #D4A853;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-weight: 400;
        }

        /* Hero */
        .lr-hero {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 3rem 0 2rem;
        }

        .lr-eyebrow {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          color: #D4A853;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          margin-bottom: 1rem;
          opacity: 0;
          animation: fadeUp 0.6s 0.2s cubic-bezier(0.16,1,0.3,1) forwards;
        }

        .lr-headline {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(2.8rem, 5vw, 4.2rem);
          color: #F0EDE6;
          line-height: 1.05;
          letter-spacing: -0.02em;
          margin-bottom: 1.5rem;
        }

        .lr-word {
          display: inline-block;
          opacity: 0;
          transform: translateY(30px);
          animation: wordReveal 0.7s cubic-bezier(0.16,1,0.3,1) forwards;
        }

        .lr-word-1 { animation-delay: 0.3s; }
        .lr-word-2 { animation-delay: 0.45s; }
        .lr-word-3 { animation-delay: 0.6s; }
        .lr-word-accent { color: #D4A853; font-style: italic; }

        @keyframes wordReveal {
          to { opacity: 1; transform: translateY(0); }
        }

        .lr-subhead {
          font-size: 15px;
          color: #6A6864;
          line-height: 1.7;
          max-width: 380px;
          font-weight: 300;
          opacity: 0;
          animation: fadeUp 0.6s 0.7s cubic-bezier(0.16,1,0.3,1) forwards;
        }

        /* Features */
        .lr-features {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .lr-feat {
          display: flex;
          align-items: center;
          gap: 12px;
          opacity: 0;
          transform: translateX(-20px);
          transition: opacity 0.5s cubic-bezier(0.16,1,0.3,1), transform 0.5s cubic-bezier(0.16,1,0.3,1);
        }
        .lr-feat--in { opacity: 1; transform: translateX(0); }

        .lr-feat-sym {
          color: #D4A853;
          font-size: 12px;
          width: 18px;
          flex-shrink: 0;
          animation: symSpin 8s linear infinite;
        }

        @keyframes symSpin {
          0%, 90%, 100% { transform: rotate(0deg); }
          95% { transform: rotate(180deg); }
        }

        .lr-feat-text {
          font-size: 12px;
          color: #5A5856;
          font-family: 'DM Mono', monospace;
          font-weight: 300;
          letter-spacing: 0.03em;
        }

        /* Stats */
        .lr-stats {
          display: flex;
          gap: 2rem;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s 1s cubic-bezier(0.16,1,0.3,1), transform 0.6s 1s cubic-bezier(0.16,1,0.3,1);
        }
        .lr-stats--in { opacity: 1; transform: translateY(0); }

        .lr-stat {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .lr-stat-val {
          font-family: 'DM Serif Display', serif;
          font-size: 1.4rem;
          color: #D4A853;
          letter-spacing: -0.02em;
        }

        .lr-stat-label {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          color: #3A3836;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          font-weight: 300;
        }

        /* Right / Card */
        .lr-right {
          width: 440px;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2.5rem;
          position: relative;
          z-index: 1;
          border-left: 1px solid rgba(212,168,83,0.08);
          opacity: 0;
          transform: translateX(40px);
          transition: opacity 0.8s 0.15s cubic-bezier(0.16,1,0.3,1), transform 0.8s 0.15s cubic-bezier(0.16,1,0.3,1);
        }
        .lr-right--in { opacity: 1; transform: translateX(0); }

        .lr-card {
          width: 100%;
          max-width: 370px;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(212,168,83,0.12);
          border-radius: 16px;
          padding: 2.5rem;
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(20px);
          animation: cardFloat 6s ease-in-out infinite;
        }

        @keyframes cardFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }

        .lr-card-glow {
          position: absolute;
          top: -60px;
          right: -60px;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(212,168,83,0.08) 0%, transparent 70%);
          pointer-events: none;
          animation: glowOrbit 8s ease-in-out infinite;
        }

        @keyframes glowOrbit {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-20px, 10px); }
          50% { transform: translate(-10px, 20px); }
          75% { transform: translate(10px, 5px); }
        }

        .lr-card-header { margin-bottom: 2rem; position: relative; z-index: 1; }

        .lr-card-title {
          font-family: 'DM Serif Display', serif;
          font-size: 1.6rem;
          color: #F0EDE6;
          margin-bottom: 6px;
          letter-spacing: -0.02em;
          font-weight: 400;
        }

        .lr-card-sub {
          font-size: 12px;
          color: #5A5856;
          font-weight: 300;
        }

        .lr-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
          margin-bottom: 1.5rem;
          position: relative;
          z-index: 1;
        }

        .lr-field { display: flex; flex-direction: column; gap: 6px; }

        .lr-label {
          font-size: 10px;
          font-family: 'DM Mono', monospace;
          color: #4A4846;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-weight: 400;
        }

        .lr-input-wrap { position: relative; }

        .lr-input {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(212,168,83,0.12);
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 14px;
          color: #F0EDE6;
          font-family: 'Outfit', sans-serif;
          font-weight: 300;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
        }

        .lr-input::placeholder { color: #2A2826; }

        .lr-input:focus {
          border-color: rgba(212,168,83,0.4);
          background: rgba(212,168,83,0.03);
        }

        .lr-input-line {
          position: absolute;
          bottom: 0;
          left: 14px;
          right: 14px;
          height: 1px;
          background: #D4A853;
          transform: scaleX(0);
          transition: transform 0.3s cubic-bezier(0.16,1,0.3,1);
          transform-origin: left;
          border-radius: 1px;
        }

        .lr-input:focus ~ .lr-input-line { transform: scaleX(1); }

        /* Button */
        .lr-btn {
          width: 100%;
          padding: 12px;
          background: #D4A853;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          font-family: 'Outfit', sans-serif;
          color: #0B0B0A;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: background 0.2s, transform 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 4px;
        }

        .lr-btn:hover:not(:disabled) {
          background: #E0B862;
          transform: translateY(-1px);
        }

        .lr-btn:active:not(:disabled) {
          transform: scale(0.98) translateY(0);
        }

        .lr-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .lr-btn-text {
          display: flex;
          align-items: center;
          gap: 8px;
          transition: opacity 0.2s, transform 0.2s;
        }

        .lr-btn-text--hide { opacity: 0; transform: translateY(-8px); }

        .lr-btn-arrow {
          transition: transform 0.2s;
        }

        .lr-btn:hover .lr-btn-arrow { transform: translateX(4px); }

        .lr-btn-shine {
          position: absolute;
          top: 0;
          left: -100%;
          width: 60%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transform: skewX(-20deg);
          animation: btnShine 4s ease-in-out infinite;
        }

        @keyframes btnShine {
          0%, 70%, 100% { left: -100%; }
          40% { left: 150%; }
        }

        .lr-spinner {
          position: absolute;
          width: 18px;
          height: 18px;
          border: 2px solid rgba(15,15,14,0.3);
          border-top-color: #0B0B0A;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* Switch */
        .lr-switch {
          display: flex;
          gap: 8px;
          align-items: center;
          position: relative;
          z-index: 1;
        }

        .lr-switch-text {
          font-size: 11px;
          color: #3A3836;
          font-family: 'DM Mono', monospace;
          font-weight: 300;
        }

        .lr-switch-btn {
          background: none;
          border: none;
          font-size: 11px;
          color: #D4A853;
          cursor: pointer;
          font-family: 'DM Mono', monospace;
          padding: 0;
          text-decoration: underline;
          text-underline-offset: 3px;
          transition: color 0.2s;
        }

        .lr-switch-btn:hover { color: #E0B862; }

        @keyframes fadeUp {
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .lr-root { flex-direction: column; }
          .lr-left { padding: 2rem; min-height: 50vh; }
          .lr-right { width: 100%; min-height: auto; border-left: none; border-top: 1px solid rgba(212,168,83,0.08); }
          .lr-stats { gap: 1.5rem; }
        }
      `}</style>
    </div>
  );
};

export default Login;
