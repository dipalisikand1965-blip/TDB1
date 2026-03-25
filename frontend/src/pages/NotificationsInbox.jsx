/**
 * NotificationsInbox — Outlook-style Unified Inbox
 * 
 * Route: /notifications
 * Query: ?ticketId=XXX (desktop split view)
 * 
 * Architecture:
 * - Ticket-centric (not notification-event-centric)
 * - Sections: Active | Waiting on You | Resolved (collapsible)
 * - Desktop: split view (left list + right TicketThread)
 * - Mobile: full-width list, tap → /tickets/:id full screen
 * - Warm cream theme, no purple gradients
 * - Polls every 15s for updates
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Search, X, RefreshCw, Filter, Inbox,
  ChevronDown, ChevronRight, Clock, MessageSquare, AlertTriangle,
  CheckCircle2, Archive
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GlobalNav from '../components/Mira/GlobalNav';
import TicketThread from './TicketThread';
import MobileNavBar from '../components/MobileNavBar';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';
const POLL_MS = 15000;

/* ── Pillar colors ─────────────────────────────────── */
const PILLAR_COLORS = {
  care: '#40916C', dine: '#E07A3A', learn: '#7C3AED', go: '#1ABC9C',
  play: '#E76F51', celebrate: '#A855F7', emergency: '#EF4444',
  farewell: '#8B5CF6', paperwork: '#0D9488', adopt: '#65A30D',
  shop: '#F59E0B', services: '#6366F1', general: '#94A3B8',
};

const PILLAR_ICONS = {
  care: 'Health', dine: 'Food', learn: 'Training', go: 'Travel',
  play: 'Play', celebrate: 'Celebrate', emergency: 'SOS',
  farewell: 'Farewell', paperwork: 'Docs', adopt: 'Adopt',
  shop: 'Shop', services: 'Services', general: 'General',
};

/* ── Helpers ────────────────────────────────────────── */
function timeAgo(ts) {
  if (!ts) return '';
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function getLastMessage(ticket) {
  // Merge all message sources
  const conv = ticket.conversation || [];
  const msgs = ticket.messages || [];
  const thread = ticket.thread || [];
  const all = [...conv, ...msgs, ...thread];
  if (all.length === 0) return null;

  // Filter out mira system briefings (internal-only messages)
  const userFacing = all.filter(m => m.sender !== 'mira' && m.sender !== 'system');
  const pool = userFacing.length > 0 ? userFacing : all;

  // Return the latest by timestamp
  return pool.reduce((latest, m) => {
    if (!latest) return m;
    const lTime = new Date(latest.timestamp || 0).getTime();
    const mTime = new Date(m.timestamp || 0).getTime();
    return mTime > lTime ? m : latest;
  }, null);
}

function getThreadCount(ticket) {
  const conv = ticket.conversation || [];
  const msgs = ticket.messages || [];
  const thread = ticket.thread || [];
  // Use a Set to deduplicate by timestamp
  const seen = new Set();
  let count = 0;
  [...conv, ...msgs, ...thread].forEach(m => {
    const key = `${m.sender}-${m.timestamp}`;
    if (!seen.has(key)) { seen.add(key); count++; }
  });
  return count;
}

function classifyTicket(ticket) {
  const status = (ticket.status || '').toLowerCase();
  const resolved = ['resolved', 'closed'].includes(status);
  if (resolved) return 'resolved';

  const lastMsg = getLastMessage(ticket);
  const lastSender = lastMsg?.sender || '';
  // Only actual concierge/admin replies count as "waiting on parent"
  // mira briefings are internal and don't count
  const waitingOnParent = ['concierge', 'admin'].includes(lastSender);
  if (waitingOnParent) return 'waiting';
  return 'active';
}

function isUrgent(ticket) {
  return String(ticket.status || '').toLowerCase() === 'urgent' ||
         String(ticket.priority || '').toLowerCase() === 'urgent';
}

/* ── Section Header ─────────────────────────────────── */
const SectionHeader = ({ title, count, icon: Icon, color, collapsed, onToggle }) => (
  <button
    onClick={onToggle}
    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left group transition-colors hover:bg-black/5"
    data-testid={`section-${title.toLowerCase().replace(/\s/g, '-')}`}
  >
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
      <span className="text-xs font-semibold tracking-wide uppercase" style={{ color }}>
        {title}
      </span>
      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
        style={{ backgroundColor: `${color}15`, color }}>
        {count}
      </span>
    </div>
    {collapsed
      ? <ChevronRight className="w-4 h-4 text-gray-400" />
      : <ChevronDown className="w-4 h-4 text-gray-400" />
    }
  </button>
);

/* ── Ticket Card ────────────────────────────────────── */
const TicketCard = ({ ticket, section, isSelected, isUnread, onClick }) => {
  const lastMsg = getLastMessage(ticket);
  const threadLen = getThreadCount(ticket);
  const pillar = (ticket.pillar || 'general').toLowerCase();
  const pillarColor = PILLAR_COLORS[pillar] || PILLAR_COLORS.general;
  const pillarLabel = PILLAR_ICONS[pillar] || 'General';
  const urgent = isUrgent(ticket);

  const borderColor = section === 'waiting'
    ? '#F59E0B'
    : section === 'resolved'
      ? '#CBD5E1'
      : urgent ? '#EF4444' : '#40916C';

  const bgColor = section === 'resolved' ? '#FFFFFF' : '#FAF7F2';

  const msgText = lastMsg?.text || lastMsg?.content || lastMsg?.message || '';
  const snippet = msgText
    ? msgText.replace(/[━═─]+/g, '').replace(/[✦◆●▸]/g, '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').trim().substring(0, 90)
    : ticket.description?.substring(0, 90) || ticket.intent_primary || 'New request';

  const senderLabel = lastMsg
    ? ['concierge', 'admin'].includes(lastMsg.sender)
      ? 'Concierge®'
      : lastMsg.sender === 'mira'
        ? 'Mira'
        : 'You'
    : '';

  return (
    <div
      onClick={onClick}
      className={`
        group cursor-pointer transition-all duration-150 mx-2 mb-1.5 rounded-lg
        ${isSelected ? 'ring-1 ring-[#C96D9E] shadow-sm' : 'hover:shadow-sm'}
      `}
      style={{
        backgroundColor: isSelected ? '#FDF6F0' : bgColor,
        borderLeft: `3px solid ${borderColor}`,
      }}
      data-testid={`ticket-card-${ticket.ticket_id}`}
    >
      <div className="flex items-start gap-3 px-3 py-3">
        {/* Unread dot */}
        <div className="flex-shrink-0 pt-1.5 w-2">
          {isUnread && (
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: '#E8507A' }}
              data-testid={`unread-dot-${ticket.ticket_id}`}
            />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Row 1: Subject + Time */}
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <h3 className={`text-[13px] leading-tight truncate ${isUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
              {ticket.subject || ticket.title || `${pillarLabel} Request`}
            </h3>
            <span className="text-[11px] text-gray-400 flex-shrink-0 whitespace-nowrap">
              {timeAgo(lastMsg?.timestamp || ticket.updated_at || ticket.created_at)}
            </span>
          </div>

          {/* Row 2: Pillar pill + Pet name + Thread count */}
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className="text-[10px] font-semibold px-1.5 py-[1px] rounded"
              style={{
                backgroundColor: `${pillarColor}15`,
                color: pillarColor,
              }}
            >
              {pillarLabel}
            </span>
            {ticket.pet_name && (
              <span className="text-[11px] text-gray-500">{ticket.pet_name}</span>
            )}
            {threadLen > 1 && (
              <span className="flex items-center gap-0.5 text-[10px] text-gray-400 ml-auto">
                <MessageSquare className="w-3 h-3" />
                {threadLen}
              </span>
            )}
          </div>

          {/* Row 3: Snippet */}
          <p className="text-[12px] text-gray-500 truncate leading-relaxed">
            {senderLabel && <span className="font-medium text-gray-600">{senderLabel}: </span>}
            {snippet}
          </p>
        </div>
      </div>
    </div>
  );
};

/* ── Main Component ─────────────────────────────────── */
const NotificationsInbox = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, token } = useAuth();

  const selectedTicketId = searchParams.get('ticketId');

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadTicketIds, setUnreadTicketIds] = useState(new Set());
  const [pets, setPets] = useState([]);
  const [activePet, setActivePet] = useState(null);

  // UI state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedSections, setCollapsedSections] = useState({ resolved: true });
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  const pollRef = useRef(null);
  const prevTicketCountRef = useRef(0);

  // Responsive
  useEffect(() => {
    const h = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  // Fetch pets
  useEffect(() => {
    if (!user?.email) return;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/pets/my-pets`, {
          headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
        });
        if (res.ok) {
          const data = await res.json();
          const fetched = data.pets || (Array.isArray(data) ? data : []);
          setPets(fetched);
          const savedId = localStorage.getItem('selectedPetId');
          const found = savedId && fetched.find(p => p.id === savedId);
          setActivePet(found || fetched[0] || null);
        }
      } catch (e) { console.error('Pets fetch fail:', e); }
    })();
  }, [user?.email, token]);

  // Fetch tickets + unread info
  const fetchData = useCallback(async (silent = false) => {
    if (!token) return;
    if (!silent) setLoading(true);
    try {
      // Parallel: tickets + notifications unread count
      const [ticketsRes, notifsRes] = await Promise.all([
        fetch(`${API_URL}/api/mira/my-tickets`, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        }),
        user?.email
          ? fetch(`${API_URL}/api/member/notifications/inbox/${encodeURIComponent(user.email)}?limit=100`, {
              headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
            })
          : Promise.resolve(null),
      ]);

      if (ticketsRes.ok) {
        const data = await ticketsRes.json();
        const list = Array.isArray(data) ? data : data.tickets || [];
        setTickets(list);
        prevTicketCountRef.current = list.length;
      }

      if (notifsRes?.ok) {
        const nData = await notifsRes.json();
        setUnreadCount(nData.unread || 0);
        // Build set of ticket IDs that have unread notifications
        const unreadSet = new Set();
        (nData.notifications || []).forEach(n => {
          if (!n.read && n.ticket_id) unreadSet.add(n.ticket_id);
        });
        setUnreadTicketIds(unreadSet);
      }
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [token, user?.email]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Poll
  useEffect(() => {
    pollRef.current = setInterval(() => fetchData(true), POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [fetchData]);

  // Listen for pet changes
  useEffect(() => {
    const h = (e) => {
      if (e.key === 'selectedPetId' && e.newValue) {
        const p = pets.find(p => p.id === e.newValue);
        if (p) setActivePet(p);
      }
    };
    window.addEventListener('storage', h);
    return () => window.removeEventListener('storage', h);
  }, [pets]);

  // Classify and filter tickets
  const { activeTickets, waitingTickets, resolvedTickets } = useMemo(() => {
    let filtered = [...tickets];

    // Deduplicate by ticket_id
    const seen = new Set();
    filtered = filtered.filter(t => {
      if (!t.ticket_id || seen.has(t.ticket_id)) return false;
      seen.add(t.ticket_id);
      return true;
    });

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        (t.subject || '').toLowerCase().includes(q) ||
        (t.pet_name || '').toLowerCase().includes(q) ||
        (t.pillar || '').toLowerCase().includes(q) ||
        (t.ticket_id || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q)
      );
    }

    const active = [], waiting = [], resolved = [];
    for (const t of filtered) {
      const cat = classifyTicket(t);
      if (cat === 'resolved') resolved.push(t);
      else if (cat === 'waiting') waiting.push(t);
      else active.push(t);
    }

    // Sort each group: urgent first, then by last activity
    const sortFn = (a, b) => {
      if (isUrgent(a) && !isUrgent(b)) return -1;
      if (!isUrgent(a) && isUrgent(b)) return 1;
      const aTime = new Date(getLastMessage(a)?.timestamp || a.updated_at || a.created_at || 0);
      const bTime = new Date(getLastMessage(b)?.timestamp || b.updated_at || b.created_at || 0);
      return bTime - aTime;
    };

    active.sort(sortFn);
    waiting.sort(sortFn);
    resolved.sort(sortFn);

    return { activeTickets: active, waitingTickets: waiting, resolvedTickets: resolved };
  }, [tickets, searchQuery]);

  const toggleSection = (key) => {
    setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTicketClick = (ticket) => {
    if (isDesktop) {
      const p = new URLSearchParams(searchParams);
      p.set('ticketId', ticket.ticket_id);
      setSearchParams(p);
    } else {
      navigate(`/tickets/${ticket.ticket_id}?returnTo=${encodeURIComponent('/notifications')}`);
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/mira-os');
  };

  const totalActive = activeTickets.length + waitingTickets.length;

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: '#F5F2EC' }}>
      {/* Global Nav */}
      <GlobalNav
        unreadCount={unreadCount}
        activePetName={activePet?.name}
        activePetId={activePet?.id}
        pets={pets}
        onPetSelect={(pet) => {
          setActivePet(pet);
          localStorage.setItem('selectedPetId', pet.id);
        }}
        onPetClick={() => navigate('/my-pets')}
      />

      {/* Inbox Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-2 rounded-lg hover:bg-gray-100 lg:hidden transition-colors"
              data-testid="back-btn"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                <Inbox className="w-5 h-5 text-[#C96D9E]" />
                Inbox
              </h1>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {totalActive > 0 ? `${totalActive} active` : 'All caught up'}
                {resolvedTickets.length > 0 && ` · ${resolvedTickets.length} resolved`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => { setShowSearch(!showSearch); setSearchQuery(''); }}
              className={`p-2 rounded-lg transition-colors ${showSearch ? 'bg-[#C96D9E]/10 text-[#C96D9E]' : 'hover:bg-gray-100 text-gray-500'}`}
              data-testid="search-toggle"
            >
              <Search className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={() => fetchData()}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              data-testid="refresh-btn"
            >
              <RefreshCw className={`w-4.5 h-4.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Search */}
        {showSearch && (
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by pet, pillar, ticket..."
                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-10 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C96D9E]/30 focus:border-[#C96D9E]/50"
                autoFocus
                data-testid="search-input"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Content — Split View */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left: Ticket List */}
        <div className={`
          overflow-y-auto bg-[#F5F2EC] min-h-0
          ${isDesktop && selectedTicketId ? 'w-[380px] flex-shrink-0 border-r border-gray-200' : 'flex-1'}
        `}>
          {loading && tickets.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-5 h-5 animate-spin text-[#C96D9E]" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Inbox className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium text-gray-500">No conversations yet</p>
              <p className="text-xs mt-1">Your concierge requests will appear here</p>
            </div>
          ) : (
            <div className="py-2" data-testid="ticket-list">
              {/* ─── Waiting on You ─── */}
              {waitingTickets.length > 0 && (
                <div className="mb-1">
                  <SectionHeader
                    title="Waiting on You"
                    count={waitingTickets.length}
                    icon={Clock}
                    color="#D97706"
                    collapsed={!!collapsedSections.waiting}
                    onToggle={() => toggleSection('waiting')}
                  />
                  {!collapsedSections.waiting && waitingTickets.map((t, idx) => (
                    <TicketCard
                      key={`w-${t.ticket_id}-${idx}`}
                      ticket={t}
                      section="waiting"
                      isSelected={selectedTicketId === t.ticket_id}
                      isUnread={unreadTicketIds.has(t.ticket_id)}
                      onClick={() => handleTicketClick(t)}
                    />
                  ))}
                </div>
              )}

              {/* ─── Active ─── */}
              {activeTickets.length > 0 && (
                <div className="mb-1">
                  <SectionHeader
                    title="Active"
                    count={activeTickets.length}
                    icon={MessageSquare}
                    color="#40916C"
                    collapsed={!!collapsedSections.active}
                    onToggle={() => toggleSection('active')}
                  />
                  {!collapsedSections.active && activeTickets.map((t, idx) => (
                    <TicketCard
                      key={`a-${t.ticket_id}-${idx}`}
                      ticket={t}
                      section="active"
                      isSelected={selectedTicketId === t.ticket_id}
                      isUnread={unreadTicketIds.has(t.ticket_id)}
                      onClick={() => handleTicketClick(t)}
                    />
                  ))}
                </div>
              )}

              {/* ─── Resolved ─── */}
              {resolvedTickets.length > 0 && (
                <div className="mb-1">
                  <SectionHeader
                    title="Resolved"
                    count={resolvedTickets.length}
                    icon={CheckCircle2}
                    color="#94A3B8"
                    collapsed={collapsedSections.resolved !== false}
                    onToggle={() => toggleSection('resolved')}
                  />
                  {collapsedSections.resolved === false && resolvedTickets.map((t, idx) => (
                    <TicketCard
                      key={`r-${t.ticket_id}-${idx}`}
                      ticket={t}
                      section="resolved"
                      isSelected={selectedTicketId === t.ticket_id}
                      isUnread={unreadTicketIds.has(t.ticket_id)}
                      onClick={() => handleTicketClick(t)}
                    />
                  ))}
                </div>
              )}

              {/* No results */}
              {activeTickets.length === 0 && waitingTickets.length === 0 && resolvedTickets.length === 0 && searchQuery && (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                  <Search className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">No matching conversations</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Thread Panel (Desktop only) */}
        {isDesktop && selectedTicketId && (
          <div className="flex-1 min-h-0 bg-white overflow-hidden" data-testid="thread-panel">
            <TicketThread
              ticketId={selectedTicketId}
              mode="split"
              onClose={() => {
                const p = new URLSearchParams(searchParams);
                p.delete('ticketId');
                setSearchParams(p);
              }}
              onTicketUpdate={() => fetchData(true)}
            />
          </div>
        )}

        {/* Right: Empty State (Desktop, no ticket selected) */}
        {isDesktop && !selectedTicketId && (
          <div className="flex-1 bg-white flex items-center justify-center">
            <div className="text-center">
              <Inbox className="w-14 h-14 mx-auto mb-3 text-gray-200" />
              <p className="text-sm font-medium text-gray-400">Select a conversation</p>
              <p className="text-xs text-gray-300 mt-1">Choose from the list on the left</p>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Nav */}
      <div className="lg:hidden">
        <MobileNavBar />
      </div>
    </div>
  );
};

export default NotificationsInbox;
