'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

interface Document {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
}

const fileIcon = (type: string) => {
  if (type.includes('pdf')) return 'PDF';
  if (type.includes('word') || type.includes('docx')) return 'DOC';
  return 'TXT';
};

const fileColor = (type: string) => {
  if (type.includes('pdf')) return '#E24B4A';
  if (type.includes('word') || type.includes('docx')) return '#378ADD';
  return '#D4A853';
};

// Hook: detect when element enters viewport
function useScrollReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, visible };
}

// Magnetic button hook
function useMagnetic() {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) * 0.25;
    const dy = (e.clientY - cy) * 0.25;
    el.style.transform = `translate(${dx}px, ${dy}px)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = 'translate(0, 0)';
    el.style.transition = 'transform 0.4s cubic-bezier(0.16,1,0.3,1)';
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave]);

  return ref;
}

const DocCard: React.FC<{ doc: Document; index: number; onClick: () => void }> = ({ doc, index, onClick }) => {
  const { ref, visible } = useScrollReveal();
  const magneticRef = useMagnetic();
  const color = fileColor(doc.file_type);

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const formatSize = (b: number) => {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div
      ref={ref}
      className={`dc-card-outer ${visible ? 'dc-card-outer--in' : ''}`}
      style={{ transitionDelay: `${index * 0.08}s` }}
    >
      <div ref={magneticRef} className="dc-card-magnetic">
        <div className="dc-card" onClick={onClick}>
          <div className="dc-card-shimmer" />
          <div className="dc-card-top">
            <div
              className="dc-badge"
              style={{
                color,
                borderColor: `${color}44`,
                backgroundColor: `${color}0F`,
              }}
            >
              {fileIcon(doc.file_type)}
            </div>
            <div className="dc-arrow-wrap">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M3 11L11 3M11 3H6M11 3v5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          <div className="dc-body">
            <h3 className="dc-name">{doc.filename}</h3>
          </div>

          <div className="dc-meta">
            <span>{formatDate(doc.uploaded_at)}</span>
            <span className="dc-dot">·</span>
            <span>{formatSize(doc.file_size)}</span>
          </div>

          <div className="dc-footer">
            <span className="dc-cta">Open chat</span>
            <span className="dc-cta-arrow">→</span>
          </div>

          <div
            className="dc-accent-line"
            style={{ background: `linear-gradient(90deg, ${color}00, ${color}66, ${color}00)` }}
          />
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [headerVisible, setHeaderVisible] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => setHeaderVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/documents/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDocuments(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    if (user) fetchDocuments();
  }, [user]);

  const handleFileUpload = async (file?: File) => {
    const uploadFile = file || selectedFile;
    if (!uploadFile) return;

    const formData = new FormData();
    formData.append('file', uploadFile);
    setUploading(true);
    setUploadProgress(0);

    // Animate progress bar
    const interval = setInterval(() => {
      setUploadProgress(p => Math.min(p + 8, 90));
    }, 100);

    try {
      const token = localStorage.getItem('token');
      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
      });
      setUploadProgress(100);
      setTimeout(() => {
        fetchDocuments();
        setSelectedFile(null);
        setUploading(false);
        setUploadProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }, 500);
    } catch (error) {
      alert('Error uploading: ' + error);
      setUploading(false);
      setUploadProgress(0);
    } finally {
      clearInterval(interval);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const filtered = documents.filter(doc =>
    doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) return null;

  return (
    <div className="db-root">
      <div className="db-grid-bg" />

      {/* Ambient orbs */}
      <div className="db-orb db-orb-1" />
      <div className="db-orb db-orb-2" />

      {/* Sidebar */}
      <aside className={`db-sidebar ${headerVisible ? 'db-sidebar--in' : ''}`}>
        <div className="db-sidebar-top">
          <div className="db-brand">
            <div className="db-logo">
              <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
                <rect x="2" y="2" width="18" height="24" rx="2" stroke="#D4A853" strokeWidth="1.5"/>
                <path d="M6 8h10M6 12h10M6 16h6" stroke="#D4A853" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="20" cy="20" r="6" fill="#0B0B0A" stroke="#D4A853" strokeWidth="1.5"/>
                <path d="M18 20h4M20 18v4" stroke="#D4A853" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <div className="db-logo-pulse" />
            </div>
            <span className="db-brand-name">DocuSense</span>
          </div>

          <nav className="db-nav">
            <div className="db-nav-item db-nav-active">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 3h10M2 7h10M2 11h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              Documents
              <div className="db-nav-indicator" />
            </div>
          </nav>

          {/* Upload count */}
          <div className="db-sidebar-stat">
            <span className="db-sidebar-stat-num">{documents.length}</span>
            <span className="db-sidebar-stat-label">documents</span>
          </div>
        </div>

        <div className="db-sidebar-bottom">
          <div className="db-user-card">
            <div className="db-avatar">
              {user.email?.charAt(0).toUpperCase()}
              <div className="db-avatar-ring" />
            </div>
            <div>
              <span className="db-user-email">{user.email}</span>
            </div>
          </div>
          <button className="db-logout" onClick={logout}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h3M9 10l3-3-3-3M12 7H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="db-main">
        {/* Header */}
        <header className={`db-header ${headerVisible ? 'db-header--in' : ''}`}>
          <div className="db-header-left">
            <h1 className="db-title">Documents</h1>
            <span className="db-badge-count">{documents.length}</span>
          </div>
          <div className="db-header-right">
            <div className="db-search-wrap">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" className="db-search-icon">
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                placeholder="Search documents…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="db-search"
              />
            </div>
          </div>
        </header>

        {/* Upload Zone */}
        <div
          className={`db-upload ${dragOver ? 'db-upload--drag' : ''} ${uploading ? 'db-upload--busy' : ''} ${headerVisible ? 'db-upload--in' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.pdf,.docx"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) { setSelectedFile(f); handleFileUpload(f); }
            }}
          />

          <div className="db-upload-inner">
            {uploading ? (
              <>
                <div className="db-upload-progress-ring">
                  <svg width="36" height="36" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(212,168,83,0.15)" strokeWidth="2"/>
                    <circle
                      cx="18" cy="18" r="15"
                      fill="none"
                      stroke="#D4A853"
                      strokeWidth="2"
                      strokeDasharray={`${2 * Math.PI * 15}`}
                      strokeDashoffset={`${2 * Math.PI * 15 * (1 - uploadProgress / 100)}`}
                      strokeLinecap="round"
                      transform="rotate(-90 18 18)"
                      style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                    />
                  </svg>
                  <span className="db-upload-pct">{uploadProgress}%</span>
                </div>
                <span className="db-upload-label">Processing document…</span>
              </>
            ) : (
              <>
                <div className="db-upload-icon-wrap">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M12 15V3M8 7l4-4 4 4" stroke="#D4A853" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M4 17v1a3 3 0 003 3h10a3 3 0 003-3v-1" stroke="#D4A853" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <div className="db-upload-icon-ring" />
                </div>
                <div>
                  <div className="db-upload-label">Drop a file or click to upload</div>
                  <div className="db-upload-formats">PDF · DOCX · TXT</div>
                </div>
              </>
            )}
          </div>

          {/* Scanning line animation on drag */}
          {dragOver && <div className="db-upload-scan" />}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="db-empty">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ opacity: 0.2 }}>
              <rect x="4" y="4" width="24" height="32" rx="3" stroke="#D4A853" strokeWidth="1.5"/>
              <path d="M10 14h12M10 20h12M10 26h7" stroke="#D4A853" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <p className="db-empty-text">
              {searchQuery ? 'No documents match your search.' : 'Upload your first document above.'}
            </p>
          </div>
        ) : (
          <div className="db-grid">
            {filtered.map((doc, i) => (
              <DocCard
                key={doc.id}
                doc={doc}
                index={i}
                onClick={() => router.push(`/chat/${doc.id}`)}
              />
            ))}
          </div>
        )}
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@300;400;500&family=Outfit:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .db-root {
          display: flex;
          min-height: 100vh;
          background: #0B0B0A;
          font-family: 'Outfit', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        .db-grid-bg {
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(212,168,83,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(212,168,83,0.04) 1px, transparent 1px);
          background-size: 52px 52px;
          pointer-events: none;
          z-index: 0;
          animation: gridDrift 25s ease-in-out infinite alternate;
        }

        @keyframes gridDrift {
          from { background-position: 0 0; }
          to { background-position: 26px 26px; }
        }

        /* Ambient orbs */
        .db-orb {
          position: fixed;
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
          filter: blur(80px);
        }

        .db-orb-1 {
          width: 400px; height: 400px;
          background: rgba(212,168,83,0.04);
          top: -100px; left: -100px;
          animation: orbFloat1 12s ease-in-out infinite;
        }

        .db-orb-2 {
          width: 300px; height: 300px;
          background: rgba(55,138,221,0.03);
          bottom: -50px; right: 200px;
          animation: orbFloat2 15s ease-in-out infinite;
        }

        @keyframes orbFloat1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(60px, 40px); }
        }
        @keyframes orbFloat2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-40px, -30px); }
        }

        /* Sidebar */
        .db-sidebar {
          width: 220px;
          min-height: 100vh;
          border-right: 1px solid rgba(212,168,83,0.08);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 1.5rem 1rem;
          position: sticky;
          top: 0;
          z-index: 10;
          background: rgba(11,11,10,0.9);
          backdrop-filter: blur(16px);
          opacity: 0;
          transform: translateX(-20px);
          transition: opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1);
        }
        .db-sidebar--in { opacity: 1; transform: translateX(0); }

        .db-sidebar-top { display: flex; flex-direction: column; gap: 1.5rem; }

        .db-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 4px;
        }

        .db-logo {
          width: 34px; height: 34px;
          border: 1px solid rgba(212,168,83,0.2);
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(212,168,83,0.05);
          position: relative;
          flex-shrink: 0;
        }

        .db-logo-pulse {
          position: absolute;
          inset: -3px;
          border-radius: 10px;
          border: 1px solid rgba(212,168,83,0.2);
          animation: pulseLogo 3s ease-in-out infinite;
        }

        @keyframes pulseLogo {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0; }
        }

        .db-brand-name {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          color: #D4A853;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .db-nav { display: flex; flex-direction: column; gap: 2px; }

        .db-nav-item {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 8px 10px;
          border-radius: 6px;
          font-size: 13px;
          color: #6A6864;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }

        .db-nav-active {
          color: #D4A853;
          background: rgba(212,168,83,0.07);
        }

        .db-nav-indicator {
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 2px;
          height: 60%;
          background: #D4A853;
          border-radius: 1px;
          animation: indicatorPulse 2s ease-in-out infinite;
        }

        @keyframes indicatorPulse {
          0%, 100% { opacity: 1; height: 60%; }
          50% { opacity: 0.6; height: 30%; }
        }

        .db-sidebar-stat {
          display: flex;
          align-items: baseline;
          gap: 6px;
          padding: 8px 10px;
          border-radius: 6px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.04);
        }

        .db-sidebar-stat-num {
          font-family: 'DM Serif Display', serif;
          font-size: 1.4rem;
          color: #D4A853;
          letter-spacing: -0.02em;
        }

        .db-sidebar-stat-label {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          color: #4A4846;
          font-weight: 300;
        }

        .db-sidebar-bottom { display: flex; flex-direction: column; gap: 8px; }

        .db-user-card {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 8px;
          border-radius: 8px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.04);
        }

        .db-avatar {
          width: 28px; height: 28px;
          border-radius: 50%;
          background: rgba(212,168,83,0.12);
          border: 1px solid rgba(212,168,83,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 500;
          color: #D4A853;
          font-family: 'DM Mono', monospace;
          flex-shrink: 0;
          position: relative;
        }

        .db-avatar-ring {
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          border: 1px solid rgba(212,168,83,0.15);
          animation: pulseLogo 4s ease-in-out infinite 1s;
        }

        .db-user-email {
          font-size: 10px;
          color: #4A4846;
          font-family: 'DM Mono', monospace;
          font-weight: 300;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 130px;
          display: block;
        }

        .db-logout {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 10px;
          border-radius: 6px;
          font-size: 11px;
          color: #3A3836;
          background: none;
          border: none;
          cursor: pointer;
          font-family: 'DM Mono', monospace;
          font-weight: 300;
          width: 100%;
          transition: all 0.2s;
          letter-spacing: 0.03em;
        }
        .db-logout:hover { color: #7A7876; background: rgba(255,255,255,0.03); }

        /* Main */
        .db-main {
          flex: 1;
          padding: 2rem 2.5rem;
          position: relative;
          z-index: 1;
          overflow-x: hidden;
        }

        /* Header */
        .db-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
          opacity: 0;
          transform: translateY(-16px);
          transition: opacity 0.6s 0.1s cubic-bezier(0.16,1,0.3,1), transform 0.6s 0.1s cubic-bezier(0.16,1,0.3,1);
        }
        .db-header--in { opacity: 1; transform: translateY(0); }

        .db-header-left { display: flex; align-items: center; gap: 12px; }

        .db-title {
          font-family: 'DM Serif Display', serif;
          font-size: 1.8rem;
          color: #F0EDE6;
          letter-spacing: -0.02em;
          font-weight: 400;
        }

        .db-badge-count {
          background: rgba(212,168,83,0.12);
          border: 1px solid rgba(212,168,83,0.2);
          border-radius: 20px;
          padding: 2px 10px;
          font-size: 11px;
          font-family: 'DM Mono', monospace;
          color: #D4A853;
          font-weight: 400;
        }

        .db-search-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .db-search-icon {
          position: absolute;
          left: 10px;
          color: #3A3836;
          pointer-events: none;
        }

        .db-search {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(212,168,83,0.08);
          border-radius: 6px;
          padding: 7px 12px 7px 30px;
          font-size: 13px;
          color: #F0EDE6;
          font-family: 'Outfit', sans-serif;
          font-weight: 300;
          outline: none;
          width: 220px;
          transition: border-color 0.2s, background 0.2s;
        }
        .db-search::placeholder { color: #2A2826; }
        .db-search:focus { border-color: rgba(212,168,83,0.25); background: rgba(212,168,83,0.02); }

        /* Upload zone */
        .db-upload {
          border: 1px dashed rgba(212,168,83,0.18);
          border-radius: 12px;
          padding: 1.5rem 2rem;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
          margin-bottom: 2rem;
          background: rgba(212,168,83,0.015);
          position: relative;
          overflow: hidden;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s 0.2s cubic-bezier(0.16,1,0.3,1),
                      transform 0.6s 0.2s cubic-bezier(0.16,1,0.3,1),
                      border-color 0.3s, background 0.3s;
        }
        .db-upload--in { opacity: 1; transform: translateY(0); }
        .db-upload--drag {
          border-color: rgba(212,168,83,0.5) !important;
          background: rgba(212,168,83,0.06) !important;
          transform: scale(1.01) !important;
        }
        .db-upload--busy { cursor: default; }

        .db-upload-inner {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .db-upload-icon-wrap {
          position: relative;
          width: 36px; height: 36px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .db-upload-icon-ring {
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 1px solid rgba(212,168,83,0.2);
          animation: pulseLogo 2.5s ease-in-out infinite;
        }

        .db-upload-progress-ring {
          position: relative;
          width: 36px; height: 36px;
          flex-shrink: 0;
        }

        .db-upload-pct {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-family: 'DM Mono', monospace;
          color: #D4A853;
          font-weight: 400;
        }

        .db-upload-label {
          font-size: 13px;
          color: #8A8880;
          font-weight: 400;
        }

        .db-upload-formats {
          font-size: 10px;
          color: #3A3836;
          font-family: 'DM Mono', monospace;
          font-weight: 300;
          margin-top: 3px;
          letter-spacing: 0.06em;
        }

        /* Scanning line */
        .db-upload-scan {
          position: absolute;
          left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, #D4A853, transparent);
          animation: scanLine 1.2s ease-in-out infinite;
          pointer-events: none;
        }

        @keyframes scanLine {
          from { top: 0%; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          to { top: 100%; opacity: 0; }
        }

        /* Documents grid */
        .db-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 16px;
        }

        /* Card outer wrapper for scroll reveal */
        .dc-card-outer {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.5s cubic-bezier(0.16,1,0.3,1), transform 0.5s cubic-bezier(0.16,1,0.3,1);
        }
        .dc-card-outer--in { opacity: 1; transform: translateY(0); }

        .dc-card-magnetic {
          transition: transform 0.1s ease-out;
        }

        .dc-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(212,168,83,0.07);
          border-radius: 12px;
          padding: 1.25rem;
          cursor: pointer;
          transition: border-color 0.3s, background 0.3s, box-shadow 0.3s;
          display: flex;
          flex-direction: column;
          gap: 10px;
          position: relative;
          overflow: hidden;
        }

        .dc-card:hover {
          border-color: rgba(212,168,83,0.22);
          background: rgba(212,168,83,0.03);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(212,168,83,0.05);
        }

        /* Shimmer on hover */
        .dc-card-shimmer {
          position: absolute;
          top: 0; left: -100%;
          width: 60%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(212,168,83,0.04), transparent);
          transform: skewX(-15deg);
          transition: none;
          pointer-events: none;
        }

        .dc-card:hover .dc-card-shimmer {
          animation: shimmerPass 0.6s ease forwards;
        }

        @keyframes shimmerPass {
          from { left: -100%; }
          to { left: 150%; }
        }

        .dc-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .dc-badge {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.08em;
          padding: 3px 7px;
          border-radius: 4px;
          border: 1px solid;
        }

        .dc-arrow-wrap {
          color: #2A2826;
          transition: color 0.2s, transform 0.2s;
        }

        .dc-card:hover .dc-arrow-wrap {
          color: #D4A853;
          transform: translate(2px, -2px);
        }

        .dc-body { flex: 1; }

        .dc-name {
          font-size: 13px;
          font-weight: 400;
          color: #C0BCB5;
          line-height: 1.4;
          word-break: break-word;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .dc-card:hover .dc-name { color: #D8D4CD; }

        .dc-meta {
          display: flex;
          align-items: center;
          gap: 5px;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          color: #3A3836;
          font-weight: 300;
        }

        .dc-dot { color: #2A2826; }

        .dc-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid rgba(212,168,83,0.05);
          padding-top: 10px;
        }

        .dc-cta {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          color: #4A4846;
          font-weight: 300;
          transition: color 0.2s;
          letter-spacing: 0.04em;
        }

        .dc-cta-arrow {
          font-size: 12px;
          color: #2A2826;
          transition: color 0.2s, transform 0.2s;
        }

        .dc-card:hover .dc-cta { color: #D4A853; }
        .dc-card:hover .dc-cta-arrow { color: #D4A853; transform: translateX(3px); }

        .dc-accent-line {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 1px;
          opacity: 0;
          transition: opacity 0.3s;
        }

        .dc-card:hover .dc-accent-line { opacity: 1; }

        /* Empty */
        .db-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 5rem;
          gap: 1rem;
          text-align: center;
        }

        .db-empty-text {
          font-size: 12px;
          color: #3A3836;
          font-family: 'DM Mono', monospace;
          font-weight: 300;
        }

        @media (max-width: 768px) {
          .db-sidebar { display: none; }
          .db-main { padding: 1.25rem; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
