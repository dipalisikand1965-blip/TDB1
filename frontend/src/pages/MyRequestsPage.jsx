import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePillarContext } from '../context/PillarContext';

// ─── MyRequestsPage.jsx ───────────────────────────────────────────────────────
// Path: /app/frontend/src/pages/MyRequestsPage.jsx
//
// FIX: Auto-polls every 15 seconds for new messages.
// Members see concierge replies without manual page reload.
// Unread badge updates automatically.
// New message notification toast appears when reply arrives.

const API = (path) => `/api${path}`;
const POLL_INTERVAL_MS = 15000; // 15 seconds

const TABS = [
  { id: 'all',       label: 'All',      icon: '📬' },
  { id: 'open',      label: 'Active',   icon: '⚡' },
  { id: 'bookings',  label: 'Bookings', icon: '📅' },
  { id: 'mira',      label: 'Mira',     icon: '✦' },
  { id: 'resolved',  label: 'Resolved', icon: '✓' },
];

const PILLAR_COLORS = {
  celebrate: '#A855F7', dine: '#FF8C42', care: '#40916C',
  go: '#1ABC9C', play: '#E76F51', learn: '#7C3AED',
  shop: '#F59E0B', paperwork: '#0D9488', emergency: '#EF4444',
  adopt: '#65A30D', farewell: '#8B5CF6', advisory: '#0D9488',
  general: '#C96D9E',
};

function timeAgo(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60)  return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function StatusBadge({ status }) {
  const map = {
    open:                { label: 'Open',       bg: 'rgba(59,130,246,0.12)', color: '#60A5FA' },
    awaiting_concierge:  { label: 'Concierge',  bg: 'rgba(232,160,69,0.12)', color: '#E8A045' },
    in_progress:         { label: 'In Progress',bg: 'rgba(77,191,168,0.12)', color: '#4DBFA8' },
    resolved:            { label: 'Resolved',   bg: 'rgba(34,197,94,0.12)',  color: '#4ADE80' },
    closed:              { label: 'Closed',     bg: 'rgba(244,239,230,0.06)',color: 'rgba(244,239,230,0.4)' },
  };
  const s = map[status] || map.open;
  return (
    <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 600, background: s.bg, color: s.color, letterSpacing: '0.04em' }}>
      {s.label}
    </span>
  );
}

function NewMessageToast({ message, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div style={{
      position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(28,22,48,0.97)', border: '1px solid rgba(77,191,168,0.3)',
      borderRadius: '14px', padding: '12px 20px',
      display: 'flex', alignItems: 'center', gap: '10px',
      zIndex: 1000, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      animation: 'slideUp 0.3s ease',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateX(-50%) translateY(20px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4DBFA8', flexShrink: 0, animation: 'pulse 1s infinite' }} />
      <span style={{ fontSize: '13px', color: '#F4EFE6' }}>{message}</span>
      <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: 'rgba(244,239,230,0.4)', cursor: 'pointer', fontSize: '14px', marginLeft: '4px' }}>✕</button>
    </div>
  );
}

export default function MyRequestsPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { currentPet } = usePillarContext();
  const [tickets, setTickets]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState('all');
  const [activeTicket, setActiveTicket] = useState(null);
  const [unreadCount, setUnreadCount]   = useState(0);
  const [toast, setToast]           = useState(null);
  const [replyText, setReplyText]   = useState('');
  const [sending, setSending]       = useState(false);
  const prevTicketsRef              = useRef({});
  const pollRef                     = useRef(null);
  const threadEndRef                = useRef(null);

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // ── Fetch tickets ──
  const fetchTickets = useCallback(async (silent = false) => {
    if (!token) return;
    if (!silent) setLoading(true);
    try {
      const res = await fetch(API('/mira/my-tickets'), { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.tickets || [];

      // ── Detect new concierge messages ──
      let newCount = 0;
      list.forEach(ticket => {
        const prev = prevTicketsRef.current[ticket.ticket_id];
        const prevLen = prev ? prev.thread_length : 0;
        const currLen = ticket.thread?.length || 0;
        if (prevLen > 0 && currLen > prevLen) {
          // Check if new message is from concierge
          const newMsgs = (ticket.thread || []).slice(prevLen);
          const hasConciergReply = newMsgs.some(m => m.sender === 'concierge' || m.sender === 'admin');
          if (hasConciergReply) {
            newCount++;
            setToast(`Concierge replied to your ${ticket.pillar || 'request'} ✦`);
          }
        }
        prevTicketsRef.current[ticket.ticket_id] = { thread_length: currLen };
      });

      setTickets(list);

      // Count unread (tickets with new concierge messages not seen)
      const unread = list.filter(t => {
        const last = (t.thread || []).slice(-1)[0];
        return last && (last.sender === 'concierge' || last.sender === 'mira') && t.status !== 'resolved';
      }).length;
      setUnreadCount(unread);

      // Update active ticket thread if open
      if (activeTicket) {
        const updated = list.find(t => t.ticket_id === activeTicket.ticket_id);
        if (updated) setActiveTicket(updated);
      }
    } catch (e) {
      console.error('Failed to fetch tickets:', e);
    } finally {
      setLoading(false);
    }
  }, [token, activeTicket]);

  // ── Initial load ──
  useEffect(() => {
    fetchTickets(false);
  }, [token]);

  // ── Auto-poll every 15 seconds ──
  useEffect(() => {
    pollRef.current = setInterval(() => fetchTickets(true), POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [fetchTickets]);

  // ── Scroll thread to bottom when new messages ──
  useEffect(() => {
    if (threadEndRef.current) {
      threadEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTicket?.thread?.length]);

  // ── Send message from member ──
  const sendMessage = async () => {
    if (!replyText.trim() || !activeTicket) return;
    setSending(true);
    try {
      await fetch(API('/service_desk/append_message'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ticket_id: activeTicket.ticket_id,
          message: {
            sender: 'parent',
            text: replyText.trim(),
            timestamp: new Date().toISOString(),
          },
          send_whatsapp: false, // member sending in-app, not via WhatsApp
        }),
      });
      setReplyText('');
      fetchTickets(true);
    } catch (e) {
      console.error('Send failed:', e);
    } finally {
      setSending(false);
    }
  };

  // ── Filter tickets by tab ──
  const filtered = tickets.filter(t => {
    if (activeTab === 'all')      return true;
    if (activeTab === 'open')     return ['open', 'awaiting_concierge', 'in_progress'].includes(t.status);
    if (activeTab === 'bookings') return t.intent_primary === 'service_booking';
    if (activeTab === 'mira')     return t.channel?.includes('mira');
    if (activeTab === 'resolved') return ['resolved', 'closed'].includes(t.status);
    return true;
  });

  const c = {
    page: { background: '#0D0A1A', minHeight: '100vh', color: '#F4EFE6', fontFamily: "'DM Sans', -apple-system, sans-serif", fontWeight: 300 },
    header: { padding: '20px 20px 0', borderBottom: '1px solid rgba(244,239,230,0.07)' },
    title: { fontSize: '20px', fontWeight: 700, color: '#F4EFE6', fontFamily: "'Playfair Display', Georgia, serif", marginBottom: '4px' },
    sub: { fontSize: '13px', color: 'rgba(244,239,230,0.5)', marginBottom: '16px' },
    tabs: { display: 'flex', gap: '0', overflowX: 'auto', scrollbarWidth: 'none' },
    tab: (active) => ({ padding: '10px 16px', fontSize: '13px', fontWeight: active ? 500 : 400, color: active ? '#F4EFE6' : 'rgba(244,239,230,0.5)', borderBottom: `2px solid ${active ? '#C96D9E' : 'transparent'}`, cursor: 'pointer', whiteSpace: 'nowrap', background: 'none', border: 'none', borderBottomWidth: '2px', borderBottomStyle: 'solid', borderBottomColor: active ? '#C96D9E' : 'transparent', fontFamily: "'DM Sans', sans-serif' ", transition: 'all 0.15s' }),
    list: { padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' },
    ticketCard: (active) => ({ background: active ? 'rgba(201,109,158,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${active ? 'rgba(201,109,158,0.25)' : 'rgba(244,239,230,0.07)'}`, borderRadius: '14px', padding: '14px 16px', cursor: 'pointer', transition: 'all 0.15s' }),
    pillarDot: (pillar) => ({ width: '8px', height: '8px', borderRadius: '50%', background: PILLAR_COLORS[pillar] || PILLAR_COLORS.general, flexShrink: 0, marginTop: '4px' }),
    empty: { textAlign: 'center', padding: '60px 20px', color: 'rgba(244,239,230,0.4)' },
  };

  // ── THREAD VIEW (when ticket selected) ──
  if (activeTicket) {
    const pillarColor = PILLAR_COLORS[activeTicket.pillar] || PILLAR_COLORS.general;
    return (
      <div style={c.page}>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
        {toast && <NewMessageToast message={toast} onDismiss={() => setToast(null)} />}

        {/* Thread header */}
        <div style={{ padding: '16px 16px 0', borderBottom: '1px solid rgba(244,239,230,0.07)', background: 'rgba(13,10,26,0.96)', position: 'sticky', top: 0, zIndex: 10, backdropFilter: 'blur(12px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <button onClick={() => setActiveTicket(null)} style={{ background: 'rgba(244,239,230,0.06)', border: '1px solid rgba(244,239,230,0.1)', borderRadius: '8px', padding: '6px 10px', color: 'rgba(244,239,230,0.7)', cursor: 'pointer', fontSize: '13px', fontFamily: "'DM Sans', sans-serif" }}>← Back</button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#F4EFE6' }}>
                <span style={{ color: pillarColor, textTransform: 'capitalize' }}>{activeTicket.pillar}</span>
                {' — '}
                {activeTicket.intent_primary?.replace(/_/g, ' ')}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(244,239,230,0.4)', marginTop: '2px' }}>#{activeTicket.ticket_id}</div>
            </div>
            <StatusBadge status={activeTicket.status} />
          </div>
        </div>

        {/* Thread messages */}
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '100px', minHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
          {(activeTicket.thread || []).map((msg, i) => {
            const isParent    = msg.sender === 'parent';
            const isConcierge = msg.sender === 'concierge' || msg.sender === 'admin';
            const isMira      = msg.sender === 'mira';
            return (
              <div key={i} style={{ display: 'flex', justifyContent: isParent ? 'flex-end' : 'flex-start', gap: '8px', alignItems: 'flex-end' }}>
                {!isParent && (
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: isMira ? 'linear-gradient(135deg,#C96D9E,#9B3F7A)' : `${pillarColor}25`, border: `1px solid ${pillarColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0 }}>
                    {isMira ? '✦' : '👤'}
                  </div>
                )}
                <div style={{ maxWidth: '75%' }}>
                  {!isParent && (
                    <div style={{ fontSize: '10px', color: 'rgba(244,239,230,0.4)', marginBottom: '3px', paddingLeft: '4px' }}>
                      {isMira ? 'Mira' : 'Concierge®'}
                    </div>
                  )}
                  <div style={{
                    padding: '10px 14px', borderRadius: isParent ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: isParent ? 'linear-gradient(135deg,#C96D9E,#9B3F7A)' : isMira ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.06)',
                    border: isParent ? 'none' : `1px solid ${isMira ? 'rgba(139,92,246,0.2)' : 'rgba(244,239,230,0.08)'}`,
                    fontSize: '14px', color: '#F4EFE6', lineHeight: 1.6,
                  }}>
                    {msg.text}
                  </div>
                  <div style={{ fontSize: '10px', color: 'rgba(244,239,230,0.3)', marginTop: '3px', textAlign: isParent ? 'right' : 'left', paddingLeft: isParent ? 0 : '4px' }}>
                    {timeAgo(msg.timestamp)}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={threadEndRef} />
        </div>

        {/* Reply input — fixed at bottom */}
        {activeTicket.status !== 'resolved' && activeTicket.status !== 'closed' && (
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 16px', background: 'rgba(13,10,26,0.97)', borderTop: '1px solid rgba(244,239,230,0.08)', backdropFilter: 'blur(12px)', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Reply to your concierge..."
              rows={1}
              style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(244,239,230,0.1)', borderRadius: '20px', padding: '10px 16px', color: '#F4EFE6', fontSize: '14px', fontFamily: "'DM Sans', sans-serif", resize: 'none', outline: 'none', lineHeight: 1.5, maxHeight: '100px', overflowY: 'auto' }}
            />
            <button
              onClick={sendMessage}
              disabled={sending || !replyText.trim()}
              style={{ width: '40px', height: '40px', borderRadius: '50%', background: replyText.trim() ? 'linear-gradient(135deg,#C96D9E,#9B3F7A)' : 'rgba(255,255,255,0.06)', border: 'none', cursor: replyText.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0, transition: 'all 0.2s' }}
            >
              {sending ? '⏳' : '→'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── TICKET LIST VIEW ──
  return (
    <div style={c.page}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      {toast && <NewMessageToast message={toast} onDismiss={() => setToast(null)} />}

      <div style={c.header}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <div style={c.title}>My Requests</div>
          {unreadCount > 0 && (
            <div style={{ padding: '3px 10px', borderRadius: '12px', background: 'rgba(201,109,158,0.15)', border: '1px solid rgba(201,109,158,0.3)', fontSize: '12px', fontWeight: 600, color: '#C96D9E' }}>
              {unreadCount} new
            </div>
          )}
        </div>
        <div style={c.sub}>Your concierge requests · Updates every 15 seconds</div>
        <div style={c.tabs}>
          {TABS.map(tab => (
            <button key={tab.id} style={c.tab(activeTab === tab.id)} onClick={() => setActiveTab(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'rgba(244,239,230,0.4)', fontSize: '14px' }}>Loading your requests...</div>
      ) : filtered.length === 0 ? (
        <div style={c.empty}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📬</div>
          <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '6px', color: '#F4EFE6' }}>No requests yet</div>
          <div style={{ fontSize: '13px' }}>Tap any "Book →" or "Send to Concierge" button to get started</div>
        </div>
      ) : (
        <div style={c.list}>
          {filtered.map(ticket => {
            const lastMsg  = (ticket.thread || []).slice(-1)[0];
            const isUnread = lastMsg && (lastMsg.sender === 'concierge' || lastMsg.sender === 'mira') && ticket.status !== 'resolved';
            const pillarColor = PILLAR_COLORS[ticket.pillar] || PILLAR_COLORS.general;
            return (
              <div
                key={ticket.ticket_id}
                style={c.ticketCard(activeTicket?.ticket_id === ticket.ticket_id)}
                onClick={() => setActiveTicket(ticket)}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${pillarColor}18`, border: `1px solid ${pillarColor}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                    {ticket.pillar === 'celebrate' ? '🎂' : ticket.pillar === 'care' ? '🌿' : ticket.pillar === 'dine' ? '🍽️' : ticket.pillar === 'go' ? '✈️' : ticket.pillar === 'emergency' ? '🚨' : '🐾'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#F4EFE6', textTransform: 'capitalize' }}>{ticket.pillar || 'General'}</span>
                        {isUnread && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#C96D9E' }} />}
                      </div>
                      <StatusBadge status={ticket.status} />
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(244,239,230,0.55)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '4px' }}>
                      {lastMsg?.text || ticket.intent_primary?.replace(/_/g, ' ') || 'New request'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '10px', color: 'rgba(244,239,230,0.3)' }}>
                        {(ticket.thread || []).length} messages
                      </span>
                      <span style={{ fontSize: '10px', color: 'rgba(244,239,230,0.3)' }}>
                        {timeAgo(lastMsg?.timestamp || ticket.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
