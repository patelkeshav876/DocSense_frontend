'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart?: () => void;
  onresult?: (event: SpeechRecognitionEvent) => void;
  onend?: () => void;
  onerror?: (event: SpeechRecognitionErrorEvent) => void;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionEvent {
  results: Array<Array<{ transcript: string }>>;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface ChatProps {
  docId: string;
}

const Chat: React.FC<ChatProps> = ({ docId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [docName, setDocName] = useState('Document');
  const [mounted, setMounted] = useState(false);
  const [newMsgIds, setNewMsgIds] = useState<Set<string>>(new Set());
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:8000/chat/${docId}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [docId, user]);

  useEffect(() => {
    fetchMessages();
    const fetchDoc = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:8000/documents/${docId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDocName(res.data.filename || 'Document');
      } catch {}
    };
    fetchDoc();
  }, [docId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 130) + 'px';
    }
  }, [input]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const question = input.trim();
    setInput('');
    setLoading(true);

    const tempId = 'temp-' + Date.now();
    const tempMsg: Message = {
      id: tempId,
      role: 'user',
      content: question,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);
    setNewMsgIds(prev => new Set(prev).add(tempId));

    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:8000/chat/${docId}/ask`, { question }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const res = await axios.get(`http://localhost:8000/chat/${docId}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const newMsgs: Message[] = res.data;
      const latestAssistant = newMsgs[newMsgs.length - 1];
      if (latestAssistant) {
        setNewMsgIds(prev => new Set(prev).add(latestAssistant.id));
      }
      setMessages(newMsgs);
    } catch (error) {
      alert('Error: ' + error);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setLoading(false);
    }
  };

  interface SpeechRecognitionConstructor { new(): SpeechRecognitionInstance; }
  type SpeechRecognitionWindow = Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

  const startListening = () => {
    const Cls = (window as SpeechRecognitionWindow).SpeechRecognition ||
      (window as SpeechRecognitionWindow).webkitSpeechRecognition;
    if (!Cls) { alert('Speech recognition not supported'); return; }
    recognitionRef.current = new Cls();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';
    recognitionRef.current.onstart = () => setIsListening(true);
    recognitionRef.current.onresult = (e) => setInput(e.results[0][0].transcript);
    recognitionRef.current.onend = () => setIsListening(false);
    recognitionRef.current.onerror = () => setIsListening(false);
    recognitionRef.current.start();
  };

  const stopListening = () => recognitionRef.current?.stop();

  const formatTime = (s: string) =>
    new Date(s).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const suggestions = [
    'Summarize this document',
    'What are the key findings?',
    'List the main conclusions',
    'Explain it simply',
  ];

  if (!user) return null;

  return (
    <div className="ct-root">
      <div className="ct-grid-bg" />
      <div className="ct-orb ct-orb-1" />
      <div className="ct-orb ct-orb-2" />

      {/* Topbar */}
      <header className={`ct-topbar ${mounted ? 'ct-topbar--in' : ''}`}>
        <div className="ct-topbar-left">
          <button className="ct-back" onClick={() => window.location.href = '/'}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M10 7H4M4 7l3-3M4 7l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="ct-divider" />
          <div className="ct-doc-pill">
            <div className="ct-doc-icon">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <rect x="1" y="1" width="7.5" height="10" rx="1" stroke="#D4A853" strokeWidth="1"/>
                <path d="M3 4h4M3 6h4M3 8h2" stroke="#D4A853" strokeWidth="1" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="ct-doc-name">{docName}</span>
          </div>
        </div>
        <div className="ct-topbar-right">
          <div className="ct-ai-status">
            <div className="ct-status-ring">
              <div className="ct-status-dot" />
            </div>
            <span className="ct-status-txt">AI ready</span>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="ct-messages">
        {messages.length === 0 && !loading && (
          <div className={`ct-empty ${mounted ? 'ct-empty--in' : ''}`}>
            <div className="ct-empty-icon">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="13" stroke="#D4A853" strokeWidth="0.75" strokeOpacity="0.3"/>
                <circle cx="16" cy="16" r="9" stroke="#D4A853" strokeWidth="0.75" strokeOpacity="0.5"/>
                <circle cx="16" cy="16" r="3" fill="#D4A853" fillOpacity="0.4"/>
              </svg>
              <div className="ct-empty-icon-ring" />
            </div>
            <h3 className="ct-empty-title">Ask anything about your document</h3>
            <p className="ct-empty-sub">The AI has read every word. Start your interrogation.</p>
            <div className="ct-suggestions">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className="ct-suggestion"
                  onClick={() => setInput(s)}
                  style={{ animationDelay: `${0.4 + i * 0.08}s` }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          const isNew = newMsgIds.has(msg.id);
          return (
            <div
              key={msg.id}
              className={`ct-msg ct-msg-${msg.role} ${isNew ? 'ct-msg--new' : 'ct-msg--old'}`}
              style={isNew ? { animationDelay: '0s' } : {}}
            >
              {msg.role === 'assistant' && (
                <div className="ct-avatar">
                  <div className="ct-avatar-inner">
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <circle cx="6" cy="6" r="4" stroke="#D4A853" strokeWidth="1"/>
                      <circle cx="6" cy="6" r="1.5" fill="#D4A853"/>
                    </svg>
                  </div>
                  <div className="ct-avatar-ring" />
                </div>
              )}

              <div className={`ct-bubble-wrap ${msg.role === 'user' ? 'ct-bubble-wrap--user' : ''}`}>
                <div className={`ct-bubble ct-bubble-${msg.role}`}>
                  {msg.role === 'assistant' && (
                    <div className="ct-bubble-glow" />
                  )}
                  <p className="ct-msg-text">{msg.content}</p>
                </div>
                <span className="ct-msg-time">{formatTime(msg.created_at)}</span>
              </div>
            </div>
          );
        })}

        {/* Thinking indicator */}
        {loading && (
          <div className="ct-msg ct-msg-assistant ct-msg--new">
            <div className="ct-avatar">
              <div className="ct-avatar-inner">
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="4" stroke="#D4A853" strokeWidth="1"/>
                  <circle cx="6" cy="6" r="1.5" fill="#D4A853"/>
                </svg>
              </div>
              <div className="ct-avatar-ring" />
            </div>
            <div className="ct-bubble-wrap">
              <div className="ct-bubble ct-bubble-assistant ct-thinking-bub">
                <div className="ct-thinking">
                  <span className="ct-thinking-dot" />
                  <span className="ct-thinking-dot" />
                  <span className="ct-thinking-dot" />
                </div>
                <span className="ct-thinking-label">Analyzing…</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} style={{ height: 1 }} />
      </div>

      {/* Input */}
      <div className={`ct-input-area ${mounted ? 'ct-input-area--in' : ''}`}>
        <div className={`ct-input-box ${isListening ? 'ct-input-box--listening' : ''}`}>
          {isListening && (
            <div className="ct-listen-wave">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="ct-wave-bar" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
            }}
            placeholder="Ask about your document…"
            className="ct-textarea"
            rows={1}
            disabled={loading}
          />

          <div className="ct-input-actions">
            <button
              className={`ct-mic ${isListening ? 'ct-mic--on' : ''}`}
              onClick={isListening ? stopListening : startListening}
              title={isListening ? 'Stop' : 'Voice input'}
            >
              {isListening ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <rect x="2" y="2" width="8" height="8" rx="1.5" fill="#E24B4A"/>
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <rect x="4.5" y="1" width="5" height="7" rx="2.5" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M2 7c0 2.76 2.24 5 5 5s5-2.24 5-5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  <path d="M7 12v1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              )}
            </button>

            <button
              className={`ct-send ${input.trim() && !loading ? 'ct-send--ready' : ''}`}
              onClick={sendMessage}
              disabled={loading || !input.trim()}
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M1.5 7h11M8.5 3.5l4 3.5-4 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        <p className="ct-hint">Enter to send · Shift+Enter for new line</p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@300;400;500&family=Outfit:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ct-root {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #0B0B0A;
          font-family: 'Outfit', sans-serif;
          position: relative;
          overflow: hidden;
        }

        .ct-grid-bg {
          position: fixed; inset: 0;
          background-image:
            linear-gradient(rgba(212,168,83,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(212,168,83,0.04) 1px, transparent 1px);
          background-size: 52px 52px;
          animation: gridDrift 20s ease-in-out infinite alternate;
          pointer-events: none; z-index: 0;
        }

        @keyframes gridDrift {
          from { background-position: 0 0; }
          to { background-position: 26px 26px; }
        }

        .ct-orb {
          position: fixed;
          border-radius: 50%;
          pointer-events: none; z-index: 0;
          filter: blur(80px);
        }
        .ct-orb-1 {
          width: 350px; height: 350px;
          background: rgba(212,168,83,0.04);
          top: -80px; right: -80px;
          animation: orbF1 14s ease-in-out infinite;
        }
        .ct-orb-2 {
          width: 250px; height: 250px;
          background: rgba(55,138,221,0.025);
          bottom: 80px; left: -60px;
          animation: orbF2 18s ease-in-out infinite;
        }
        @keyframes orbF1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-30px,20px)} }
        @keyframes orbF2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(20px,-20px)} }

        /* Topbar */
        .ct-topbar {
          height: 52px;
          border-bottom: 1px solid rgba(212,168,83,0.08);
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 1.5rem;
          position: relative; z-index: 10;
          background: rgba(11,11,10,0.92);
          backdrop-filter: blur(16px);
          flex-shrink: 0;
          opacity: 0; transform: translateY(-10px);
          transition: opacity 0.5s cubic-bezier(0.16,1,0.3,1), transform 0.5s cubic-bezier(0.16,1,0.3,1);
        }
        .ct-topbar--in { opacity: 1; transform: translateY(0); }

        .ct-topbar-left { display: flex; align-items: center; gap: 12px; }

        .ct-back {
          width: 28px; height: 28px;
          border-radius: 6px;
          border: 1px solid rgba(212,168,83,0.15);
          background: rgba(212,168,83,0.04);
          display: flex; align-items: center; justify-content: center;
          color: #6A6864; cursor: pointer;
          transition: all 0.2s;
        }
        .ct-back:hover { border-color: rgba(212,168,83,0.3); color: #D4A853; transform: translateX(-1px); }

        .ct-divider { width: 1px; height: 18px; background: rgba(212,168,83,0.08); }

        .ct-doc-pill { display: flex; align-items: center; gap: 8px; }

        .ct-doc-icon {
          width: 22px; height: 22px;
          border-radius: 5px;
          background: rgba(212,168,83,0.07);
          border: 1px solid rgba(212,168,83,0.15);
          display: flex; align-items: center; justify-content: center;
        }

        .ct-doc-name {
          font-size: 12px; color: #B0ACA5; font-weight: 400;
          max-width: 340px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        .ct-ai-status { display: flex; align-items: center; gap: 8px; }

        .ct-status-ring {
          position: relative; width: 16px; height: 16px;
          display: flex; align-items: center; justify-content: center;
        }

        .ct-status-ring::before {
          content: '';
          position: absolute; inset: 0;
          border-radius: 50%;
          border: 1px solid rgba(99,153,34,0.3);
          animation: statusRing 2.5s ease-in-out infinite;
        }

        @keyframes statusRing {
          0%,100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.4); opacity: 0; }
        }

        .ct-status-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #639922;
          animation: statusPulse 2s ease-in-out infinite;
        }

        @keyframes statusPulse {
          0%,100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .ct-status-txt {
          font-size: 10px; color: #3A3836;
          font-family: 'DM Mono', monospace; font-weight: 300; letter-spacing: 0.06em;
        }

        /* Messages */
        .ct-messages {
          flex: 1; overflow-y: auto;
          padding: 1.5rem 2rem;
          display: flex; flex-direction: column; gap: 1.25rem;
          position: relative; z-index: 1;
          scrollbar-width: thin;
          scrollbar-color: rgba(212,168,83,0.1) transparent;
        }
        .ct-messages::-webkit-scrollbar { width: 3px; }
        .ct-messages::-webkit-scrollbar-thumb { background: rgba(212,168,83,0.12); border-radius: 2px; }

        /* Empty */
        .ct-empty {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 3rem; gap: 14px; text-align: center;
          opacity: 0; transform: translateY(20px);
          transition: opacity 0.6s 0.3s cubic-bezier(0.16,1,0.3,1), transform 0.6s 0.3s cubic-bezier(0.16,1,0.3,1);
        }
        .ct-empty--in { opacity: 1; transform: translateY(0); }

        .ct-empty-icon {
          position: relative; width: 60px; height: 60px;
          display: flex; align-items: center; justify-content: center;
          animation: iconFloat 4s ease-in-out infinite;
        }

        @keyframes iconFloat {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        .ct-empty-icon-ring {
          position: absolute; inset: 0;
          border-radius: 50%;
          border: 1px solid rgba(212,168,83,0.15);
          animation: ringExpand 3s ease-out infinite;
        }

        @keyframes ringExpand {
          0% { transform: scale(0.8); opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }

        .ct-empty-title {
          font-family: 'DM Serif Display', serif;
          font-size: 1.1rem; color: #C0BCB5; font-weight: 400; letter-spacing: -0.01em;
        }

        .ct-empty-sub {
          font-size: 12px; color: #3A3836; font-weight: 300; max-width: 300px;
        }

        .ct-suggestions {
          display: flex; flex-wrap: wrap; gap: 8px;
          justify-content: center; margin-top: 8px;
        }

        .ct-suggestion {
          background: rgba(212,168,83,0.04);
          border: 1px solid rgba(212,168,83,0.1);
          border-radius: 20px;
          padding: 6px 14px;
          font-size: 11px; color: #6A6864;
          cursor: pointer;
          font-family: 'DM Mono', monospace; font-weight: 300;
          transition: all 0.2s;
          opacity: 0;
          animation: suggFadeIn 0.4s cubic-bezier(0.16,1,0.3,1) forwards;
          letter-spacing: 0.02em;
        }

        @keyframes suggFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .ct-suggestion:hover {
          border-color: rgba(212,168,83,0.3);
          color: #D4A853;
          background: rgba(212,168,83,0.07);
          transform: translateY(-1px);
        }

        /* Messages */
        .ct-msg {
          display: flex; gap: 10px;
          max-width: 720px;
        }

        .ct-msg--new {
          animation: msgIn 0.4s cubic-bezier(0.16,1,0.3,1) both;
        }

        .ct-msg--old { opacity: 1; }

        @keyframes msgIn {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .ct-msg-user {
          align-self: flex-end; flex-direction: row-reverse; margin-left: auto;
        }
        .ct-msg-assistant { align-self: flex-start; }

        .ct-avatar {
          width: 28px; height: 28px; border-radius: 50%;
          flex-shrink: 0; position: relative; margin-top: 2px;
        }

        .ct-avatar-inner {
          width: 100%; height: 100%; border-radius: 50%;
          background: rgba(212,168,83,0.08);
          border: 1px solid rgba(212,168,83,0.2);
          display: flex; align-items: center; justify-content: center;
        }

        .ct-avatar-ring {
          position: absolute; inset: -3px; border-radius: 50%;
          border: 1px solid rgba(212,168,83,0.1);
          animation: avatarRing 4s ease-in-out infinite;
        }

        @keyframes avatarRing {
          0%,100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.2); opacity: 0; }
        }

        .ct-bubble-wrap {
          display: flex; flex-direction: column; gap: 4px; max-width: 560px;
        }
        .ct-bubble-wrap--user { align-items: flex-end; }

        .ct-bubble {
          padding: 10px 14px; border-radius: 14px; position: relative; overflow: hidden;
        }

        .ct-bubble-user {
          background: rgba(212,168,83,0.1);
          border: 1px solid rgba(212,168,83,0.18);
          border-bottom-right-radius: 4px;
        }

        .ct-bubble-assistant {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.05);
          border-bottom-left-radius: 4px;
        }

        .ct-bubble-glow {
          position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(212,168,83,0.3), transparent);
          opacity: 0;
          transition: opacity 0.3s;
        }

        .ct-msg-assistant:hover .ct-bubble-glow { opacity: 1; }

        .ct-msg-text {
          font-size: 14px; color: #C8C4BC;
          line-height: 1.6; white-space: pre-wrap; font-weight: 300;
        }
        .ct-msg-user .ct-msg-text { color: #E4D4A0; }

        .ct-msg-time {
          font-size: 10px; color: #2A2826;
          font-family: 'DM Mono', monospace; font-weight: 300; letter-spacing: 0.03em;
        }

        /* Thinking */
        .ct-thinking-bub {
          display: flex; align-items: center; gap: 10px;
        }

        .ct-thinking {
          display: flex; gap: 4px;
        }

        .ct-thinking-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #D4A853; opacity: 0.3;
          animation: thinkDot 1.4s ease-in-out infinite;
        }
        .ct-thinking-dot:nth-child(2) { animation-delay: 0.2s; }
        .ct-thinking-dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes thinkDot {
          0%,100% { opacity: 0.2; transform: scale(0.85); }
          50% { opacity: 0.9; transform: scale(1.15); }
        }

        .ct-thinking-label {
          font-size: 11px; color: #4A4846;
          font-family: 'DM Mono', monospace; font-weight: 300;
          letter-spacing: 0.06em;
          animation: thinkLabel 1.5s ease-in-out infinite;
        }

        @keyframes thinkLabel {
          0%,100% { opacity: 0.4; }
          50% { opacity: 0.9; }
        }

        /* Input area */
        .ct-input-area {
          padding: 1rem 1.5rem 1.25rem;
          border-top: 1px solid rgba(212,168,83,0.07);
          position: relative; z-index: 10;
          background: rgba(11,11,10,0.93);
          backdrop-filter: blur(16px);
          flex-shrink: 0;
          display: flex; flex-direction: column; gap: 6px;
          opacity: 0; transform: translateY(16px);
          transition: opacity 0.5s 0.2s cubic-bezier(0.16,1,0.3,1), transform 0.5s 0.2s cubic-bezier(0.16,1,0.3,1);
        }
        .ct-input-area--in { opacity: 1; transform: translateY(0); }

        .ct-input-box {
          display: flex; align-items: flex-end; gap: 8px;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(212,168,83,0.1);
          border-radius: 12px;
          padding: 10px 10px 10px 14px;
          transition: border-color 0.2s, box-shadow 0.2s;
          position: relative; overflow: hidden;
        }
        .ct-input-box:focus-within {
          border-color: rgba(212,168,83,0.28);
          box-shadow: 0 0 0 3px rgba(212,168,83,0.05);
        }
        .ct-input-box--listening {
          border-color: rgba(226,75,74,0.3) !important;
          box-shadow: 0 0 0 3px rgba(226,75,74,0.06) !important;
        }

        /* Voice wave */
        .ct-listen-wave {
          display: flex; align-items: center; gap: 2px;
          padding: 0 4px;
          flex-shrink: 0;
        }

        .ct-wave-bar {
          width: 3px; border-radius: 2px;
          background: #E24B4A;
          animation: waveAnim 0.8s ease-in-out infinite alternate;
        }

        .ct-wave-bar:nth-child(1) { height: 8px; }
        .ct-wave-bar:nth-child(2) { height: 14px; }
        .ct-wave-bar:nth-child(3) { height: 18px; }
        .ct-wave-bar:nth-child(4) { height: 14px; }
        .ct-wave-bar:nth-child(5) { height: 8px; }

        @keyframes waveAnim {
          from { transform: scaleY(0.4); opacity: 0.5; }
          to { transform: scaleY(1); opacity: 1; }
        }

        .ct-textarea {
          flex: 1; background: none; border: none; outline: none;
          font-size: 14px; color: #C8C4BC;
          font-family: 'Outfit', sans-serif; font-weight: 300;
          resize: none; line-height: 1.5;
          min-height: 22px; max-height: 130px;
          overflow-y: auto; scrollbar-width: none;
          padding: 0;
        }
        .ct-textarea::placeholder { color: #2A2826; }

        .ct-input-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }

        .ct-mic {
          width: 32px; height: 32px; border-radius: 7px;
          border: 1px solid rgba(212,168,83,0.15);
          background: rgba(212,168,83,0.04);
          display: flex; align-items: center; justify-content: center;
          color: #5A5856; cursor: pointer;
          transition: all 0.2s;
        }
        .ct-mic:hover { color: #D4A853; border-color: rgba(212,168,83,0.3); }
        .ct-mic--on {
          border-color: rgba(226,75,74,0.4);
          color: #E24B4A;
          background: rgba(226,75,74,0.06);
          animation: micPulse 1.5s ease-in-out infinite;
        }

        @keyframes micPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(226,75,74,0); }
          50% { box-shadow: 0 0 0 6px rgba(226,75,74,0.1); }
        }

        .ct-send {
          width: 34px; height: 34px; border-radius: 8px;
          border: 1px solid rgba(212,168,83,0.15);
          background: rgba(212,168,83,0.06);
          display: flex; align-items: center; justify-content: center;
          color: #5A5856; cursor: not-allowed;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .ct-send--ready {
          background: #D4A853;
          border-color: #D4A853;
          color: #0B0B0A;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(212,168,83,0.25);
        }

        .ct-send--ready:hover {
          background: #E0B862;
          transform: scale(1.05);
          box-shadow: 0 6px 18px rgba(212,168,83,0.3);
        }

        .ct-send--ready:active { transform: scale(0.95); }

        .ct-hint {
          font-size: 10px; color: #1E1E1C;
          font-family: 'DM Mono', monospace; font-weight: 300; letter-spacing: 0.04em;
        }

        @media (max-width: 600px) {
          .ct-topbar { padding: 0 1rem; }
          .ct-messages { padding: 1rem; }
          .ct-input-area { padding: 0.75rem 1rem 1rem; }
        }
      `}</style>
    </div>
  );
};

export default Chat;
