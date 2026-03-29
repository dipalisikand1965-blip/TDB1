/**
 * ServicesPanel.jsx
 * 
 * SERVICES = Execution Layer - "Where hands move"
 * Per MOJO Bible Part 4: Turn intent into real outcomes via tasks.
 * 
 * Layout (Premium, WhatsApp/Instagram DM Style):
 * - Top: Service Launchers (8 max visible, small grid)
 * - Middle: "Awaiting You" shelf (always pinned - the killer UX)
 *   - Unread dot indicator (pink/amber)
 *   - "New" badge label
 *   - Preview with "Concierge®:" prefix
 * - Next: Active Requests (status tabs + smart grouping)
 * - Bottom: Orders (only if there are orders - no empty modules)
 * 
 * UI/UX Laws:
 * - Feels like a private office dashboard (no emojis)
 * - WhatsApp/Instagram DM style unread indicators
 * - Desktop: Two-column (inbox left, detail right)
 * - Mobile: List → Detail page
 * - Micro-delights only for state changes
 */

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { 
  Scissors, GraduationCap, Home, Stethoscope, Footprints,
  Camera, PartyPopper, Plane, ChevronRight, ChevronDown,
  Clock, AlertCircle, CheckCircle, CreditCard, Calendar,
  Package, Truck, X, Loader2, RefreshCw, MoreHorizontal,
  HelpCircle, List, Edit, Inbox, CalendarCheck, PawPrint, Check,
  MessageSquare
} from 'lucide-react';
import TicketDetailPanel from './TicketDetailPanel';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// ═══════════════════════════════════════════════════════════════════════════════
// ICON MAPPING
// ═══════════════════════════════════════════════════════════════════════════════

const ICON_MAP = {
  scissors: Scissors,
  'graduation-cap': GraduationCap,
  home: Home,
  stethoscope: Stethoscope,
  footprints: Footprints,
  camera: Camera,
  'party-popper': PartyPopper,
  plane: Plane,
  'help-circle': HelpCircle,
  list: List,
  'check-circle': CheckCircle,
  'credit-card': CreditCard,
  loader: Loader2,
  'calendar-check': CalendarCheck,
  truck: Truck,
  'package-check': Package,
  check: CheckCircle,
  x: X,
  'alert-circle': AlertCircle,
  edit: Edit,
  inbox: Inbox,
};

const getIcon = (iconName) => ICON_MAP[iconName] || HelpCircle;

// ═══════════════════════════════════════════════════════════════════════════════
// STATUS COLORS
// ═══════════════════════════════════════════════════════════════════════════════

const STATUS_COLORS = {
  slate: { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' },
  blue: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  amber: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  purple: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  orange: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  rose: { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/30' },
  cyan: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  green: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
  indigo: { bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  emerald: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  gray: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' },
  red: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
};

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// Service Launcher Card (small, clean)
const LauncherCard = memo(({ service, onClick, isHighlighted = false }) => {
  const IconComponent = getIcon(service.icon);
  
  return (
    <button
      onClick={() => onClick(service)}
      className={`group flex flex-col items-center p-3 bg-slate-800/40 hover:bg-slate-700/50 
                 rounded-xl border transition-all
                 min-w-[80px] min-h-[80px] touch-manipulation
                 ${isHighlighted 
                   ? 'border-purple-500 ring-2 ring-purple-500/50 bg-purple-500/20 animate-pulse' 
                   : 'border-white/5 hover:border-purple-500/30'}`}
      data-testid={`launcher-${service.id}`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center
                      transition-colors mb-2
                      ${isHighlighted 
                        ? 'bg-purple-500/30' 
                        : 'bg-slate-700/50 group-hover:bg-purple-500/20'}`}>
        <IconComponent className={`w-5 h-5 transition-colors 
          ${isHighlighted ? 'text-purple-400' : 'text-slate-300 group-hover:text-purple-400'}`} />
      </div>
      <span className={`text-xs font-medium text-center leading-tight
        ${isHighlighted ? 'text-purple-300' : 'text-slate-300'}`}>
        {service.name}
      </span>
      {isHighlighted && (
        <span className="text-[10px] text-purple-400 mt-1">From chat</span>
      )}
    </button>
  );
});

// Status Badge (clean, no emojis)
const StatusBadge = memo(({ status, statusDisplay }) => {
  const colors = STATUS_COLORS[statusDisplay?.color] || STATUS_COLORS.gray;
  const IconComponent = getIcon(statusDisplay?.icon);
  
  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ${colors.bg}`}>
      <IconComponent className={`w-3.5 h-3.5 ${colors.text}`} />
      <span className={`text-xs font-medium ${colors.text}`}>
        {statusDisplay?.short || status}
      </span>
    </div>
  );
});

// Awaiting You Card (WhatsApp/Instagram DM style - highlighted, actionable)
const AwaitingCard = memo(({ ticket, onAction, onSelect, isUnread = false }) => {
  const colors = STATUS_COLORS[ticket.status_display?.color] || STATUS_COLORS.amber;
  const IconComponent = getIcon(ticket.status_display?.icon);
  
  // Get latest message preview for DM-style display
  const lastMessage = ticket.last_message || ticket.status_display?.description || '';
  const hasConciergReply = ticket.has_concierge_reply || ticket.last_sender === 'concierge';
  
  const getActionButton = () => {
    switch (ticket.status) {
      case 'clarification_needed':
        return { label: 'Provide Details', action: 'clarify' };
      case 'options_ready':
        return { label: 'Choose Option', action: 'select_option' };
      case 'approval_pending':
        return { label: 'Approve', action: 'approve_quote' };
      case 'payment_pending':
        return { label: 'Pay Now', action: 'complete_payment' };
      default:
        return { label: 'View', action: 'view' };
    }
  };
  
  const actionBtn = getActionButton();
  
  return (
    <div 
      className={`relative p-4 rounded-xl border transition-all cursor-pointer group
                  ${isUnread 
                    ? 'bg-gradient-to-r from-amber-500/10 to-pink-500/10 border-amber-500/30 hover:border-pink-500/40' 
                    : 'bg-slate-800/60 border-white/5 hover:border-purple-500/40'}`}
      onClick={() => onSelect(ticket)}
      data-testid={`awaiting-card-${ticket.ticket_id}`}
    >
      {/* Unread dot indicator - WhatsApp style */}
      {isUnread && (
        <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-gradient-to-r from-pink-500 to-amber-500 shadow-lg shadow-pink-500/40 animate-pulse" />
      )}
      
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Title row with NEW badge */}
          <div className="flex items-center gap-2 mb-1">
            <IconComponent className={`w-4 h-4 ${colors.text} flex-shrink-0`} />
            <h4 className="text-sm font-medium text-white truncate">
              {ticket.subject || ticket.title || ticket.service_type || ticket.intent_primary || 'Concierge® Request'}
            </h4>
            {/* NEW badge - Instagram DM style */}
            {isUnread && (
              <span className="px-1.5 py-0.5 bg-pink-500 text-white text-[10px] font-bold rounded uppercase tracking-wide flex-shrink-0">
                New
              </span>
            )}
          </div>
          
          {/* Preview row - WhatsApp style with "Concierge®:" prefix */}
          <p className={`text-xs mb-2 truncate ${isUnread ? 'text-white/80 font-medium' : 'text-slate-400'}`}>
            {hasConciergReply && (
              <span className="text-purple-400 font-semibold">Concierge®: </span>
            )}
            {lastMessage || `${ticket.pet_display} • ${ticket.status_display?.description}`}
          </p>
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAction(ticket, actionBtn.action);
          }}
          className={`px-4 py-2.5 text-xs font-medium rounded-lg transition-opacity flex-shrink-0 min-h-[44px] touch-manipulation
                      ${isUnread 
                        ? 'bg-gradient-to-r from-pink-500 to-amber-500 text-white hover:opacity-90' 
                        : `${colors.bg} ${colors.text} hover:opacity-80`}`}
        >
          {actionBtn.label}
        </button>
      </div>
    </div>
  );
});

// Active Request Card (simple list item)
const RequestCard = memo(({ ticket, onSelect }) => {
  const colors = STATUS_COLORS[ticket.status_display?.color] || STATUS_COLORS.blue;
  
  return (
    <div 
      className="p-3 bg-slate-800/40 rounded-lg border border-white/5 hover:border-purple-500/20
                 transition-all cursor-pointer group"
      onClick={() => onSelect(ticket)}
      data-testid={`request-card-${ticket.ticket_id}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm text-white truncate">
            {ticket.subject || ticket.title || ticket.service_type || ticket.intent_primary || 'Concierge® Request'}
          </h4>
          <p className="text-xs text-slate-500 truncate">
            {ticket.pet_display}
          </p>
        </div>
        <StatusBadge status={ticket.status} statusDisplay={ticket.status_display} />
      </div>
    </div>
  );
});

// Order Card (with shipping info)
const OrderCard = memo(({ order, onSelect }) => {
  const colors = STATUS_COLORS[order.status_display?.color] || STATUS_COLORS.indigo;
  const shipping = order.shipping || {};
  
  return (
    <div 
      className="p-3 bg-slate-800/40 rounded-lg border border-white/5 hover:border-indigo-500/20
                 transition-all cursor-pointer"
      onClick={() => onSelect(order)}
      data-testid={`order-card-${order.ticket_id}`}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <h4 className="text-sm text-white truncate flex-1">
          {order.title || 'Order'}
        </h4>
        <StatusBadge status={order.status} statusDisplay={order.status_display} />
      </div>
      
      {shipping.eta && (
        <p className="text-xs text-slate-400">
          Arriving {shipping.eta}
          {shipping.tracking_id && (
            <span className="ml-2 text-indigo-400">{shipping.carrier}</span>
          )}
        </p>
      )}
    </div>
  );
});

// Status Tab Button
const StatusTab = memo(({ label, count, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-all min-h-[44px] touch-manipulation
                ${isActive 
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
  >
    {label}
    {count > 0 && (
      <span className={`ml-1.5 text-xs ${isActive ? 'text-purple-300' : 'text-slate-500'}`}>
        ({count})
      </span>
    )}
  </button>
));

// Section Header
const SectionHeader = memo(({ title, count, action, onAction }) => (
  <div className="flex items-center justify-between mb-3">
    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
      {title}
      {count > 0 && (
        <span className="text-xs text-slate-500 font-normal">({count})</span>
      )}
    </h3>
    {action && (
      <button 
        onClick={onAction}
        className="text-xs text-purple-400 hover:text-purple-300 transition-colors min-h-[44px] px-3 flex items-center touch-manipulation"
      >
        {action}
      </button>
    )}
  </div>
));

// Empty State
const EmptyState = memo(({ title, description }) => (
  <div className="text-center py-8 text-slate-500">
    <Inbox className="w-8 h-8 mx-auto mb-2 opacity-50" />
    <p className="text-sm font-medium">{title}</p>
    <p className="text-xs mt-1">{description}</p>
  </div>
));

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const ServicesPanel = ({ 
  selectedPet = null,
  allPets = [],
  token = null,
  highlightedService = null, // Which service launcher to highlight (e.g., "grooming")
  onClose = null,
  onTicketSelect = null,
  onOpenRequestBuilder = null,
  unreadRepliesCount = 0, // NEW: Count of unread concierge replies
}) => {
  // Get selected pet ID
  const selectedPetId = selectedPet?.id || selectedPet?.name;
  
  // State
  const [launchers, setLaunchers] = useState([]);
  const [inbox, setInbox] = useState({
    awaiting_user: [],
    active: [],
    orders: [],
    completed: [],
    counts: { awaiting_user: 0, active: 0, orders: 0, total: 0 },
    unread_ticket_ids: [] // Track which tickets have unread messages
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeStatusTab, setActiveStatusTab] = useState('all');
  const [showMoreLaunchers, setShowMoreLaunchers] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketDetail, setShowTicketDetail] = useState(false);
  const [timelyServices, setTimelyServices] = useState([]);
  const [timelyContext, setTimelyContext] = useState({ enabled: false, topics: [] });
  const [showAllTimelyServices, setShowAllTimelyServices] = useState(false);
  
  // Fetch data
  const fetchData = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      
      // Fetch launchers (with pet_id for soul context) and inbox in parallel
      const petIdParam = selectedPetId ? `?pet_id=${selectedPetId}` : '';
      const [launchersRes, inboxRes] = await Promise.all([
        fetch(`${API_BASE}/api/os/services/launchers${petIdParam}`, { headers }),
        fetch(`${API_BASE}/api/os/services/inbox`, { headers })
      ]);
      
      if (launchersRes.ok) {
        const launchersData = await launchersRes.json();
        setLaunchers(launchersData.launchers || []);
        // Soul integration - timely services
        setTimelyServices(launchersData.timely_services || []);
        setTimelyContext(launchersData.timely_context || { enabled: false, topics: [] });
        if (launchersData.timely_context?.enabled) {
          console.log('[SERVICES SOUL] Timely context:', launchersData.timely_context.topics);
        }
      }
      
      if (inboxRes.ok) {
        const inboxData = await inboxRes.json();
        setInbox(inboxData);
      }
    } catch (err) {
      console.error('[SERVICES] Fetch error:', err);
      setError('Failed to load services');
    } finally {
      setLoading(false);
    }
  }, [token, selectedPetId]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Handlers
  const handleLauncherClick = useCallback((service) => {
    console.log('[SERVICES] Launcher clicked:', service.id);
    // Call parent to open request builder modal
    onOpenRequestBuilder?.(service);
  }, [onOpenRequestBuilder]);
  
  const handleAction = useCallback(async (ticket, action) => {
    console.log('[SERVICES] Action:', action, 'Ticket:', ticket.ticket_id);
    // Open ticket detail panel for action
    setSelectedTicket(ticket);
    setShowTicketDetail(true);
  }, []);
  
  const handleTicketSelect = useCallback((ticket) => {
    setSelectedTicket(ticket);
    setShowTicketDetail(true);
    onTicketSelect?.(ticket);
  }, [onTicketSelect]);
  
  const handleTicketDetailClose = useCallback(() => {
    setShowTicketDetail(false);
    setSelectedTicket(null);
  }, []);
  
  const handleTicketAction = useCallback((action, result) => {
    console.log('[SERVICES] Ticket action completed:', action, result);
    // Refresh inbox after action
    fetchData();
  }, [fetchData]);
  
  // Filter active requests by status tab
  const filteredActive = useMemo(() => {
    if (activeStatusTab === 'all') return inbox.active;
    return inbox.active.filter(t => t.status === activeStatusTab);
  }, [inbox.active, activeStatusTab]);
  
  // Count by status for tabs
  const statusCounts = useMemo(() => {
    const counts = { all: inbox.active.length };
    inbox.active.forEach(t => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    return counts;
  }, [inbox.active]);
  
  // Calculate unread count from awaiting_user that have concierge replies
  const unreadAwaitingCount = useMemo(() => {
    return inbox.awaiting_user.filter(t => 
      t.has_concierge_reply || 
      t.unread_count > 0 || 
      inbox.unread_ticket_ids?.includes(t.ticket_id)
    ).length;
  }, [inbox.awaiting_user, inbox.unread_ticket_ids]);
  
  // Render
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="services-panel h-full flex flex-col" data-testid="services-panel">
      {/* Header - Luxury execution thread */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-white">Services</h2>
            {/* Unread replies badge - WhatsApp DM style */}
            {(unreadRepliesCount > 0 || unreadAwaitingCount > 0) && (
              <span className="px-2.5 py-1 bg-gradient-to-r from-pink-500 to-amber-500 text-white text-xs rounded-full font-bold shadow-lg shadow-pink-500/30 animate-pulse" data-testid="services-unread-badge">
                {unreadRepliesCount || unreadAwaitingCount} new
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Your execution thread with Concierge®. Updates and replies live here.
          </p>
        </div>
        <button 
          onClick={fetchData}
          className="p-2 text-slate-400 hover:text-white transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          
          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* TIMELY SERVICES - "{petName} might need this" (Soul Integration) */}
          {/* Shows services based on recent chat intents - Mira knows         */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {timelyServices.length > 0 && (
            <section className="animate-in fade-in-50 duration-300">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    {selectedPet?.name || 'Your pet'} might need this
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Mira knows what's on your mind</p>
                </div>
                {timelyServices.length > 6 && (
                  <button
                    onClick={() => setShowAllTimelyServices(!showAllTimelyServices)}
                    className="text-xs text-amber-400 hover:text-amber-300"
                  >
                    {showAllTimelyServices ? 'Less' : 'More'}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {timelyServices.slice(0, showAllTimelyServices ? 8 : 6).map((service, index) => (
                  <button
                    key={service.service_type || index}
                    onClick={() => {
                      // Find matching launcher or create a request
                      const matchingLauncher = launchers.find(l => 
                        l.id?.toLowerCase().includes(service.service_type) ||
                        l.name?.toLowerCase().includes(service.service_type)
                      );
                      if (matchingLauncher) {
                        handleLauncherClick(matchingLauncher);
                      } else {
                        onOpenRequestBuilder?.({ 
                          id: service.service_type,
                          name: service.display_name || service.service_type,
                          emoji: service.emoji || '✨'
                        });
                      }
                    }}
                    className="relative p-3 rounded-xl bg-gradient-to-br from-amber-900/40 to-orange-900/30 border border-amber-500/30 hover:border-amber-400/50 transition-all active:scale-[0.98] text-left"
                  >
                    <span className="absolute top-1 right-1 text-[9px] px-2 py-0.5 bg-amber-500/80 text-white rounded-full font-semibold">
                      Timely
                    </span>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-lg">{service.emoji || '✨'}</span>
                      <div className="text-sm font-medium text-white">
                        {service.display_name || service.service_type.replace(/-/g, ' ')}
                      </div>
                    </div>
                    {service.why_timely && (
                      <div className="text-[10px] text-amber-300/80 mt-1 line-clamp-1 pl-7">
                        {service.why_timely}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </section>
          )}
          
          {/* Service Launchers */}
          <section>
            <SectionHeader 
              title="Quick Actions" 
              action={launchers.length > 8 ? (showMoreLaunchers ? 'Show Less' : 'More') : null}
              onAction={() => setShowMoreLaunchers(!showMoreLaunchers)}
            />
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {(showMoreLaunchers ? launchers : launchers.slice(0, 8)).map(service => (
                <LauncherCard 
                  key={service.id} 
                  service={service} 
                  onClick={handleLauncherClick}
                  isHighlighted={highlightedService && (
                    service.id === highlightedService || 
                    service.id?.toLowerCase().includes(highlightedService?.toLowerCase()) ||
                    service.display_name?.toLowerCase().includes(highlightedService?.toLowerCase())
                  )}
                />
              ))}
            </div>
          </section>
          
          {/* Awaiting You - THE KILLER SHELF (WhatsApp/Instagram DM Style) */}
          {inbox.awaiting_user.length > 0 && (
            <section className="animate-in fade-in-50 duration-300">
              <SectionHeader 
                title="Awaiting You" 
                count={inbox.awaiting_user.length}
              />
              <div className="space-y-2">
                {inbox.awaiting_user.map(ticket => {
                  // Check if this ticket has unread concierge replies
                  const isUnread = ticket.has_concierge_reply || 
                                   ticket.unread_count > 0 || 
                                   inbox.unread_ticket_ids?.includes(ticket.ticket_id);
                  return (
                    <AwaitingCard
                      key={ticket.ticket_id}
                      ticket={ticket}
                      onAction={handleAction}
                      onSelect={handleTicketSelect}
                      isUnread={isUnread}
                    />
                  );
                })}
              </div>
            </section>
          )}
          
          {/* Active Requests */}
          {inbox.active.length > 0 && (
            <section>
              <SectionHeader title="Active Requests" count={inbox.active.length} />
              
              {/* Status Tabs */}
              <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                <StatusTab 
                  label="All" 
                  count={statusCounts.all}
                  isActive={activeStatusTab === 'all'}
                  onClick={() => setActiveStatusTab('all')}
                />
                {statusCounts.placed > 0 && (
                  <StatusTab 
                    label="Placed" 
                    count={statusCounts.placed}
                    isActive={activeStatusTab === 'placed'}
                    onClick={() => setActiveStatusTab('placed')}
                  />
                )}
                {statusCounts.in_progress > 0 && (
                  <StatusTab 
                    label="In Progress" 
                    count={statusCounts.in_progress}
                    isActive={activeStatusTab === 'in_progress'}
                    onClick={() => setActiveStatusTab('in_progress')}
                  />
                )}
                {statusCounts.scheduled > 0 && (
                  <StatusTab 
                    label="Scheduled" 
                    count={statusCounts.scheduled}
                    isActive={activeStatusTab === 'scheduled'}
                    onClick={() => setActiveStatusTab('scheduled')}
                  />
                )}
              </div>
              
              {/* Request List */}
              <div className="space-y-2">
                {filteredActive.map(ticket => (
                  <RequestCard
                    key={ticket.ticket_id}
                    ticket={ticket}
                    onSelect={handleTicketSelect}
                  />
                ))}
              </div>
            </section>
          )}
          
          {/* Orders (only if there are orders) */}
          {inbox.orders.length > 0 && (
            <section>
              <SectionHeader title="Orders" count={inbox.orders.length} />
              <div className="space-y-2">
                {inbox.orders.map(order => (
                  <OrderCard
                    key={order.ticket_id}
                    order={order}
                    onSelect={handleTicketSelect}
                  />
                ))}
              </div>
            </section>
          )}
          
          {/* Empty State */}
          {inbox.awaiting_user.length === 0 && 
           inbox.active.length === 0 && 
           inbox.orders.length === 0 && (
            <EmptyState 
              title="No active requests"
              description="Start a service request using the quick actions above"
            />
          )}
          
        </div>
      </div>
      
      {/* Stale Indicator (if data is old) */}
      {inbox.stale && (
        <div className="px-4 py-2 bg-amber-500/10 border-t border-amber-500/20 text-center">
          <p className="text-xs text-amber-400">
            Data may be outdated. <button onClick={fetchData} className="underline">Refresh</button>
          </p>
        </div>
      )}
      
      {/* Ticket Detail Panel */}
      {showTicketDetail && selectedTicket && (
        <TicketDetailPanel
          ticket={selectedTicket}
          onClose={handleTicketDetailClose}
          token={token}
          onAction={handleTicketAction}
          onRefresh={fetchData}
        />
      )}
    </div>
  );
};

export default ServicesPanel;
