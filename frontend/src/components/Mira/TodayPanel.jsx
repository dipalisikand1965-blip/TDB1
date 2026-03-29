/**
 * TodayPanel.jsx
 * 
 * TODAY = Time Layer - "What matters now"
 * Per MOJO Bible Part 2: Surfaces time-sensitive items that need attention.
 * This is proactive awareness, not shopping.
 * 
 * Components (per spec):
 * 1. Today Summary Header - count badge + last updated
 * 2. Urgent Stack (always top) - overdue items
 * 3. Due Soon Cards - upcoming reminders
 * 4. Season + Environment Alerts - weather, tick season, fireworks
 * 5. Active Tasks Watchlist - pending confirmations
 * 6. Documents + Compliance - expiring certificates
 * 7. Other Pets (compact) - alerts for other pets
 * 
 * UI/UX Laws Applied:
 * - Calm Interface: No clutter, soft transitions
 * - One Primary Action Per Card
 * - 44x44px touch targets for iOS
 * - 200ms ease-out animations
 */

import React, { useState, useEffect, useMemo, memo } from 'react';
import { 
  Calendar, Clock, AlertTriangle, AlertCircle, Bell, 
  Syringe, Scissors, Cake, FileText, CheckCircle, 
  Sun, Cloud, Thermometer, Heart, Shield, Activity,
  ChevronRight, X, Droplets, Wind, Zap, Package,
  CloudRain, AlertOctagon, Dog, MapPin, RefreshCw, BookOpen
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

// Calculate days until a date (positive = future, negative = past/overdue)
const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.ceil((date - today) / (1000 * 60 * 60 * 24));
};

// Calculate days since a date
const daysSince = (dateStr) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((today - date) / (1000 * 60 * 60 * 24));
};

// Format date for display
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Get grooming interval in days based on frequency string
const getGroomingIntervalDays = (frequency) => {
  const intervals = {
    'Daily': 1,
    'Every few days': 3,
    'Weekly': 7,
    'Bi-weekly': 14,
    'Every 2 weeks': 14,
    'Monthly': 30,
    'Every 6 weeks': 42,
    'Every 2 months': 60,
    'Quarterly': 90,
    'As needed': 45, // Default estimate
  };
  return intervals[frequency] || 30;
};

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// Weather Hero Card - Full weather display at top of TODAY
const WeatherHeroCard = memo(({ weather, city, petName, onAskMira }) => {
  if (!weather) return null;
  
  // Handle various weather data structures
  const currentWeather = weather.current_weather || weather;
  const temp = currentWeather.temperature || currentWeather.temp || weather.temperature || weather.temp;
  const description = currentWeather.description || currentWeather.conditions || weather.description || 'Clear';
  const humidity = currentWeather.humidity || weather.humidity;
  const windSpeed = currentWeather.wind_speed || currentWeather.windSpeed || weather.wind_speed;
  const feelsLike = currentWeather.feels_like || currentWeather.feelsLike || weather.feels_like;
  const weatherCity = city || weather.city || currentWeather.city || 'Your area';
  
  // Skip if no valid temperature
  if (temp === undefined || temp === null || isNaN(temp)) return null;
  
  // Determine walk safety
  const getWalkSafety = () => {
    if (temp >= 35) return { level: 'danger', text: 'Avoid walks', icon: AlertOctagon, color: 'text-red-400' };
    if (temp >= 30) return { level: 'warning', text: 'Early/late walks only', icon: Sun, color: 'text-amber-400' };
    if (temp <= 5) return { level: 'warning', text: 'Keep walks short', icon: Thermometer, color: 'text-blue-400' };
    return { level: 'safe', text: 'Great for walks', icon: CheckCircle, color: 'text-green-400' };
  };
  
  const walkSafety = getWalkSafety();
  const WalkIcon = walkSafety.icon;
  
  return (
    <div className="weather-hero-card" data-testid="weather-hero">
      {/* Main temp display */}
      <div className="weather-hero-main">
        <div className="weather-temp-large">
          <span className="temp-number">{Math.round(temp)}</span>
          <span className="temp-unit">°C</span>
        </div>
        <div className="weather-location">
          <MapPin className="w-3 h-3" />
          <span>{weatherCity}</span>
        </div>
        <p className="weather-description">{description}</p>
      </div>
      
      {/* Walk safety indicator */}
      <div className={`walk-safety ${walkSafety.level}`}>
        <WalkIcon className={`w-4 h-4 ${walkSafety.color}`} />
        <span>{walkSafety.text}</span>
      </div>
      
      {/* Weather details */}
      <div className="weather-details">
        {feelsLike && (
          <div className="weather-detail">
            <Thermometer className="w-3.5 h-3.5 text-slate-400" />
            <span>Feels {Math.round(feelsLike)}°</span>
          </div>
        )}
        {humidity && (
          <div className="weather-detail">
            <Droplets className="w-3.5 h-3.5 text-blue-400" />
            <span>{humidity}%</span>
          </div>
        )}
        {windSpeed && (
          <div className="weather-detail">
            <Wind className="w-3.5 h-3.5 text-slate-400" />
            <span>{windSpeed} km/h</span>
          </div>
        )}
      </div>
      
      {/* Ask Mira button */}
      {onAskMira && (
        <button 
          className="weather-ask-mira"
          onClick={() => onAskMira(`What's the best time to walk ${petName} today?`)}
        >
          Ask Mira about today's weather
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
});

// Section Header Component
const SectionHeader = memo(({ icon: Icon, title, count, iconColor = 'text-purple-400' }) => (
  <div className="today-section-header">
    <Icon className={`w-4 h-4 ${iconColor}`} />
    <span className="section-title">{title}</span>
    {count > 0 && <span className="section-count">{count}</span>}
  </div>
));

// Urgent Card - For overdue/critical items
const UrgentCard = memo(({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  onAction, 
  variant = 'warning',
  pet 
}) => (
  <div className={`today-card urgent ${variant}`} data-testid="urgent-card">
    <div className="card-icon-wrap">
      <Icon className="w-5 h-5" />
    </div>
    <div className="card-content">
      <span className="card-title">{title}</span>
      <span className="card-description">{description}</span>
      {pet && <span className="card-pet">for {pet}</span>}
    </div>
    {action && (
      <button 
        className="card-action-btn" 
        onClick={onAction}
        data-testid="urgent-action-btn"
      >
        {action}
        <ChevronRight className="w-4 h-4" />
      </button>
    )}
  </div>
));

// Due Soon Card - For upcoming reminders
const DueSoonCard = memo(({ 
  icon: Icon, 
  title, 
  dueIn, 
  pet, 
  action,
  onAction 
}) => {
  const urgencyClass = dueIn <= 0 ? 'overdue' : dueIn <= 3 ? 'urgent' : dueIn <= 7 ? 'soon' : 'upcoming';
  
  const getDueLabel = () => {
    if (dueIn < 0) return `${Math.abs(dueIn)} days overdue`;
    if (dueIn === 0) return 'Due today';
    if (dueIn === 1) return 'Tomorrow';
    return `in ${dueIn} days`;
  };
  
  return (
    <div className={`today-card due-soon ${urgencyClass}`} data-testid="due-soon-card">
      <div className="card-icon-wrap">
        <Icon className="w-5 h-5" />
      </div>
      <div className="card-content">
        <span className="card-title">{title}</span>
        <span className="card-pet">for {pet}</span>
      </div>
      <div className="card-timing">
        <span className={`timing-badge ${urgencyClass}`}>{getDueLabel()}</span>
      </div>
      <button 
        className="card-chevron" 
        onClick={onAction}
        aria-label={action || 'View details'}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
});

// Environment Alert Card - Weather, tick season, fireworks
const EnvironmentAlertCard = memo(({ 
  icon: Icon, 
  title, 
  message, 
  level = 'info',
  action,
  onAction 
}) => (
  <div className={`today-card environment ${level}`} data-testid="environment-alert">
    <div className="card-icon-wrap">
      <Icon className="w-5 h-5" />
    </div>
    <div className="card-content">
      <span className="card-title">{title}</span>
      <span className="card-description">{message}</span>
    </div>
    {action && (
      <button className="card-action-link" onClick={onAction}>
        {action}
      </button>
    )}
  </div>
));

// Watchlist Task Card - For active tickets from Services watchlist
// Supports "Awaiting You" one-tap actions
const WatchlistTaskCard = memo(({ 
  ticket,
  onAction,
  onView 
}) => {
  const status = ticket.status;
  const isAwaitingUser = ticket.awaiting_user;
  const statusDisplay = ticket.status_display || {};
  
  const getStatusIcon = () => {
    switch (status) {
      case 'clarification_needed': return <AlertCircle className="w-4 h-4 text-amber-400" />;
      case 'options_ready': return <CheckCircle className="w-4 h-4 text-purple-400" />;
      case 'approval_pending': return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      case 'payment_pending': return <Zap className="w-4 h-4 text-rose-400" />;
      case 'in_progress': return <Activity className="w-4 h-4 text-cyan-400" />;
      case 'scheduled': return <Calendar className="w-4 h-4 text-green-400" />;
      case 'shipped': return <Package className="w-4 h-4 text-indigo-400" />;
      default: return <Bell className="w-4 h-4 text-gray-400" />;
    }
  };
  
  // Get one-tap action based on status
  const getQuickAction = () => {
    switch (status) {
      case 'clarification_needed': return { label: 'Reply', action: 'clarify' };
      case 'options_ready': return { label: 'Choose', action: 'select_option' };
      case 'approval_pending': return { label: 'Approve', action: 'approve_quote' };
      case 'payment_pending': return { label: 'Pay', action: 'complete_payment' };
      default: return null;
    }
  };
  
  const quickAction = getQuickAction();
  const petDisplay = ticket.pet_display || ticket.pet_names?.join(', ') || 'Your pet';
  
  return (
    <div 
      className={`today-card watchlist-task ${isAwaitingUser ? 'awaiting' : ''}`} 
      data-testid="watchlist-task-card"
    >
      <div className="card-status-icon">
        {getStatusIcon()}
      </div>
      <div className="card-content">
        <span className="card-title">{ticket.title || ticket.service_type || 'Service Request'}</span>
        <span className="card-pet">{petDisplay}</span>
        <span className="card-status-text">{statusDisplay.label || status}</span>
      </div>
      {isAwaitingUser && quickAction ? (
        <button 
          className="card-quick-action-btn"
          onClick={() => onAction?.(ticket, quickAction.action)}
          data-testid="watchlist-quick-action"
        >
          {quickAction.label}
        </button>
      ) : (
        <button 
          className="card-view-btn" 
          onClick={() => onView?.(ticket)}
          data-testid="watchlist-view-btn"
        >
          View
        </button>
      )}
    </div>
  );
});

// Legacy Task Card - Kept for backward compatibility
const TaskCard = memo(({ 
  icon: Icon,
  title, 
  status, 
  statusText,
  onView 
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-amber-400" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'in_progress': return <Activity className="w-4 h-4 text-blue-400" />;
      case 'shipped': return <Package className="w-4 h-4 text-purple-400" />;
      default: return <Bell className="w-4 h-4 text-gray-400" />;
    }
  };
  
  return (
    <div className="today-card task" data-testid="task-card">
      <div className="card-status-icon">
        {getStatusIcon()}
      </div>
      <div className="card-content">
        <span className="card-title">{title}</span>
        <span className="card-status-text">{statusText}</span>
      </div>
      <button className="card-view-btn" onClick={onView}>
        View
      </button>
    </div>
  );
});

// Document Card - For expiring documents
const DocumentCard = memo(({ 
  title, 
  daysToExpiry, 
  pet,
  onAction 
}) => {
  const isExpired = daysToExpiry <= 0;
  const isUrgent = daysToExpiry <= 7;
  
  return (
    <div className={`today-card document ${isExpired ? 'expired' : isUrgent ? 'urgent' : ''}`} data-testid="document-card">
      <div className="card-icon-wrap">
        <FileText className="w-5 h-5" />
      </div>
      <div className="card-content">
        <span className="card-title">{title}</span>
        <span className="card-pet">for {pet}</span>
      </div>
      <div className="card-timing">
        <span className={`timing-badge ${isExpired ? 'overdue' : isUrgent ? 'urgent' : 'soon'}`}>
          {isExpired ? 'Expired' : `Expires ${formatDate(new Date(Date.now() + daysToExpiry * 86400000))}`}
        </span>
      </div>
      <button className="card-action-link" onClick={onAction}>
        {isExpired ? 'Renew' : 'Upload'}
      </button>
    </div>
  );
});

// Birthday Countdown - Special celebration card
const BirthdayCountdown = memo(({ pet, daysUntil: days }) => {
  if (days === null || days > 30 || days < 0) return null;
  
  const getMessage = () => {
    if (days === 0) return `Happy Birthday, ${pet.name}!`;
    if (days === 1) return `${pet.name}'s birthday is tomorrow!`;
    return `${pet.name}'s birthday in ${days} days`;
  };
  
  return (
    <div className="today-card birthday" data-testid="birthday-countdown">
      <div className="birthday-icon-wrap">
        <Cake className="w-6 h-6" />
      </div>
      <div className="card-content">
        <span className="birthday-title">{getMessage()}</span>
        {days > 0 && days <= 7 && (
          <span className="birthday-hint">Plan something special?</span>
        )}
      </div>
      {days > 0 && (
        <div className="birthday-countdown-number">{days}</div>
      )}
      {days === 0 && (
        <span className="birthday-celebration">🎉</span>
      )}
    </div>
  );
});

// Other Pet Summary - Compact alerts for other pets
const OtherPetSummary = memo(({ pets, currentPetId, onPetClick }) => {
  // Filter out current pet and only show pets with alerts
  const otherPetsWithAlerts = pets
    .filter(p => p.id !== currentPetId)
    .map(p => {
      const alerts = [];
      const soulAnswers = p.doggy_soul_answers || {};
      
      // Check vaccination
      if (soulAnswers.vaccination_status === 'Overdue' || soulAnswers.vaccination_status === 'Due soon') {
        alerts.push('vaccination');
      }
      
      // Check vet visit
      const lastVet = soulAnswers.last_vet_visit;
      if (lastVet && daysSince(lastVet) > 365) {
        alerts.push('checkup');
      }
      
      return { ...p, alerts };
    })
    .filter(p => p.alerts.length > 0)
    .slice(0, 3);
  
  if (otherPetsWithAlerts.length === 0) return null;
  
  return (
    <div className="other-pets-section" data-testid="other-pets-section">
      <SectionHeader 
        icon={Dog} 
        title="Other Pets" 
        count={otherPetsWithAlerts.length}
        iconColor="text-pink-400"
      />
      <div className="other-pets-list">
        {otherPetsWithAlerts.map(pet => (
          <button 
            key={pet.id} 
            className="other-pet-row"
            onClick={() => onPetClick?.(pet)}
          >
            <span className="other-pet-name">{pet.name}</span>
            <span className="other-pet-alert">
              {pet.alerts.includes('vaccination') && '💉'}
              {pet.alerts.includes('checkup') && '🏥'}
              {pet.alerts.length} item{pet.alerts.length > 1 ? 's' : ''} need attention
            </span>
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        ))}
      </div>
    </div>
  );
});

// Empty State - When no items
const EmptyState = memo(({ petName }) => (
  <div className="today-empty-state" data-testid="today-empty">
    <CheckCircle className="w-12 h-12 text-green-400" />
    <h3>All caught up!</h3>
    <p>No urgent items for {petName} today.</p>
    <span className="empty-hint">Check back later for reminders</span>
  </div>
));

// ═══════════════════════════════════════════════════════════════════════════════
// LEARN NUDGE CARD - Smart nudge from LEARN layer
// Shows when user completed/saved a Learn item that has a service action
// ═══════════════════════════════════════════════════════════════════════════════

const LearnNudgeCard = memo(({ 
  nudge, 
  onPrimaryAction,
  onSecondaryAction,
  onDismiss 
}) => {
  if (!nudge) return null;
  
  return (
    <div className="today-card learn-nudge" data-testid="learn-nudge-card">
      <div className="card-icon-wrap learn-nudge-icon">
        <BookOpen className="w-5 h-5" />
      </div>
      <div className="card-content">
        <span className="card-title">{nudge.title}</span>
        <span className="card-description learn-context">{nudge.context_line}</span>
      </div>
      <div className="learn-nudge-actions">
        <button 
          className="learn-nudge-primary"
          onClick={() => onPrimaryAction?.(nudge)}
          data-testid="learn-nudge-primary-btn"
        >
          {nudge.primary_cta?.label || 'Let Mira do it'}
        </button>
        <button 
          className="learn-nudge-secondary"
          onClick={() => onSecondaryAction?.(nudge)}
          data-testid="learn-nudge-secondary-btn"
        >
          {nudge.secondary_cta?.label || 'Ask Mira'}
        </button>
        <button 
          className="learn-nudge-dismiss"
          onClick={() => onDismiss?.(nudge)}
          aria-label="Not now"
          data-testid="learn-nudge-dismiss-btn"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

// Import BookOpen for LearnNudgeCard (already imported as part of lucide-react)

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const TodayPanel = ({
  isOpen,
  onClose,
  pet,
  allPets = [],
  weather = null,
  apiUrl,
  token,
  onNavigate,
  onPetSwitch,
  onTicketAction, // Handler for ticket quick actions
  onOpenServices, // Handler for opening ServiceRequestBuilder with prefill
  onOpenConcierge, // Handler for opening ConciergePanel with context
  onAskMira, // Handler for asking Mira a question
}) => {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [activeTasks, setActiveTasks] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [isStale, setIsStale] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [learnNudge, setLearnNudge] = useState(null); // LEARN → TODAY smart nudge
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FETCH LEARN NUDGE FOR TODAY
  // ═══════════════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    // AbortController to cancel in-flight request when effect re-runs
    const abortController = new AbortController();
    
    const fetchLearnNudge = async () => {
      console.log('[TODAY] fetchLearnNudge called - isOpen:', isOpen, 'pet:', pet?.id, 'hasToken:', !!token);
      
      if (!isOpen) {
        console.log('[TODAY] Skipping - panel not open');
        return;
      }
      
      // Skip for demo pets
      const isDemoPet = !pet?.id || pet.id === 'demo-pet' || pet.id === 'demo';
      if (isDemoPet) {
        console.log('[TODAY] Skipping - demo pet:', pet?.id);
        return;
      }
      
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const url = `${apiUrl}/api/os/learn/today-nudge?pet_id=${pet.id}`;
        console.log('[TODAY] Fetching learn nudge from:', url);
        
        const response = await fetch(url, { 
          headers,
          signal: abortController.signal 
        });
        console.log('[TODAY] Learn nudge response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('[TODAY] Learn nudge response:', data);
          if (data.nudge) {
            console.log('[TODAY] Learn nudge received:', data.nudge.learn_item?.title);
            setLearnNudge(data.nudge);
            
            // Acknowledge the nudge was displayed (starts 7-day cooldown)
            // This ensures cooldown only starts when nudge is actually rendered
            if (data.nudge.ack_required && data.nudge.learn_item?.id) {
              fetch(
                `${apiUrl}/api/os/learn/today-nudge/ack?item_id=${data.nudge.learn_item.id}&pet_id=${pet.id}`,
                { method: 'POST', headers }
              ).then(() => console.log('[TODAY] Nudge acknowledged - cooldown started'))
               .catch(err => console.log('[TODAY] Ack failed:', err.message));
            }
          } else {
            console.log('[TODAY] No nudge in response, reason:', data.reason);
            setLearnNudge(null);
          }
        } else {
          console.log('[TODAY] Learn nudge request failed:', response.status);
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          console.log('[TODAY] Learn nudge fetch aborted (expected in StrictMode)');
        } else {
          console.log('[TODAY] Could not fetch learn nudge:', err.message);
        }
      }
    };
    
    fetchLearnNudge();
    
    // Cleanup - abort the fetch when effect re-runs or component unmounts
    return () => {
      abortController.abort();
    };
  }, [isOpen, pet?.id, apiUrl, token]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FETCH TODAY DATA FROM API (Tickets, Tasks, Active Requests)
  // This supplements the local pet profile calculations (vaccinations, grooming)
  // ═══════════════════════════════════════════════════════════════════════════
  
  const [apiTodayData, setApiTodayData] = useState({ items: [], summary: {} });
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  
  useEffect(() => {
    const abortController = new AbortController();
    
    const fetchTodayData = async () => {
      if (!isOpen || !pet?.id) return;
      
      // Skip for demo pets
      const isDemoPet = pet.id === 'demo-pet' || pet.id === 'demo';
      if (isDemoPet) return;
      
      setIsLoadingApi(true);
      
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const url = `${apiUrl}/api/mira/today/${encodeURIComponent(pet.id)}`;
        console.log('[TODAY] Fetching today data from API:', url);
        
        const response = await fetch(url, { 
          headers,
          signal: abortController.signal 
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('[TODAY] API data received:', {
            items: data.items?.length || 0,
            urgent: data.summary?.urgent_count || 0,
            awaiting: data.summary?.awaiting_count || 0
          });
          setApiTodayData({
            items: data.items || [],
            summary: data.summary || {}
          });
          setLastUpdated(new Date());
        } else {
          console.log('[TODAY] API request failed:', response.status);
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          console.log('[TODAY] API fetch aborted');
        } else {
          console.error('[TODAY] Error fetching today data:', err.message);
        }
      } finally {
        setIsLoadingApi(false);
      }
    };
    
    fetchTodayData();
    
    return () => {
      abortController.abort();
    };
  }, [isOpen, pet?.id, apiUrl, token]);
  
  // Handler for Learn nudge primary action (Let Mira do it → Services)
  const handleLearnNudgePrimary = (nudge) => {
    if (onOpenServices && nudge.primary_cta) {
      onOpenServices({
        type: nudge.primary_cta.service_type,
        name: nudge.primary_cta.label,
        prefill: nudge.primary_cta.prefill,
        learn_context: {
          source_layer: 'learn',
          source_item: nudge.learn_item,
          context_note: nudge.context_line
        }
      });
      onClose();
    } else {
      onNavigate?.('/services');
    }
  };
  
  // Handler for Learn nudge secondary action (Ask Mira → Concierge®)
  const handleLearnNudgeSecondary = (nudge) => {
    if (onOpenConcierge && nudge.secondary_cta?.context) {
      onOpenConcierge(nudge.secondary_cta.context);
      onClose();
    }
  };
  
  // Handler for Learn nudge dismiss
  const handleLearnNudgeDismiss = async (nudge) => {
    setLearnNudge(null);
    
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      await fetch(
        `${apiUrl}/api/os/learn/today-nudge/dismiss?nudge_id=${nudge.id}&item_id=${nudge.learn_item?.id}&pet_id=${nudge.pet_id}`,
        { method: 'POST', headers }
      );
    } catch (err) {
      console.log('[TODAY] Could not dismiss nudge:', err.message);
    }
  };
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CALCULATE TODAY ITEMS FROM PET DATA
  // ═══════════════════════════════════════════════════════════════════════════
  
  const todayData = useMemo(() => {
    if (!pet) return { urgent: [], dueSoon: [], environment: [], documents: [], birthday: null };
    
    const soulAnswers = pet.doggy_soul_answers || {};
    const urgent = [];
    const dueSoon = [];
    const environment = [];
    const documents = [];
    let birthday = null;
    
    // ─────────────────────────────────────────────────────────────────────────
    // 1. VACCINATION STATUS
    // ─────────────────────────────────────────────────────────────────────────
    const vaccStatus = soulAnswers.vaccination_status;
    const nextVaccDate = soulAnswers.next_vaccination_date;
    
    if (vaccStatus === 'Overdue') {
      urgent.push({
        id: 'vacc-overdue',
        icon: Syringe,
        title: 'Vaccination Overdue',
        description: `${pet.name}'s vaccinations need immediate attention`,
        action: 'Schedule',
        variant: 'danger',
        navigateTo: '/care'
      });
    } else if (vaccStatus === 'Due soon' || (nextVaccDate && daysUntil(nextVaccDate) <= 14)) {
      const days = nextVaccDate ? daysUntil(nextVaccDate) : 7;
      dueSoon.push({
        id: 'vacc-due',
        icon: Syringe,
        title: 'Vaccination Due',
        dueIn: days,
        pet: pet.name,
        action: 'Schedule'
      });
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // 2. VET CHECKUP (Annual)
    // ─────────────────────────────────────────────────────────────────────────
    const lastVetVisit = soulAnswers.last_vet_visit;
    if (lastVetVisit) {
      const daysSinceVet = daysSince(lastVetVisit);
      if (daysSinceVet > 365) {
        urgent.push({
          id: 'checkup-overdue',
          icon: Heart,
          title: 'Annual Checkup Overdue',
          description: `Last visit was ${Math.floor(daysSinceVet / 30)} months ago`,
          action: 'Book Now',
          variant: 'warning',
          navigateTo: '/care'
        });
      } else if (daysSinceVet > 300) {
        dueSoon.push({
          id: 'checkup-due',
          icon: Heart,
          title: 'Annual Checkup',
          dueIn: 365 - daysSinceVet,
          pet: pet.name,
          action: 'Schedule'
        });
      }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // 3. GROOMING CADENCE
    // ─────────────────────────────────────────────────────────────────────────
    const groomingFreq = soulAnswers.grooming_frequency;
    const lastGrooming = soulAnswers.last_grooming_date;
    
    if (groomingFreq && lastGrooming) {
      const intervalDays = getGroomingIntervalDays(groomingFreq);
      const daysSinceGrooming = daysSince(lastGrooming);
      const daysUntilDue = intervalDays - daysSinceGrooming;
      
      if (daysUntilDue <= 0) {
        urgent.push({
          id: 'groom-overdue',
          icon: Scissors,
          title: 'Grooming Overdue',
          description: `${pet.name} was due ${Math.abs(daysUntilDue)} days ago`,
          action: 'Book',
          variant: 'warning',
          navigateTo: '/care'
        });
      } else if (daysUntilDue <= 7) {
        dueSoon.push({
          id: 'groom-due',
          icon: Scissors,
          title: 'Grooming Session',
          dueIn: daysUntilDue,
          pet: pet.name,
          action: 'Book'
        });
      }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // 4. PARASITE PREVENTION (Monthly estimate)
    // ─────────────────────────────────────────────────────────────────────────
    const lastParasiteDose = soulAnswers.last_parasite_dose;
    if (lastParasiteDose) {
      const daysSinceDose = daysSince(lastParasiteDose);
      if (daysSinceDose > 30) {
        urgent.push({
          id: 'parasite-overdue',
          icon: Shield,
          title: 'Parasite Prevention Due',
          description: 'Monthly dose is overdue',
          action: 'Remind',
          variant: 'warning'
        });
      } else if (daysSinceDose > 25) {
        dueSoon.push({
          id: 'parasite-due',
          icon: Shield,
          title: 'Parasite Prevention',
          dueIn: 30 - daysSinceDose,
          pet: pet.name,
          action: 'Order'
        });
      }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // 5. BIRTHDAY COUNTDOWN
    // ─────────────────────────────────────────────────────────────────────────
    const dob = pet.birthday || pet.dob || soulAnswers.dob;
    if (dob) {
      const bday = new Date(dob);
      // Guard: skip if DOB is invalid or produces age = 0
      const isValidDob = !isNaN(bday.getTime()) && bday.getFullYear() > 2000;
      if (isValidDob) {
        const today = new Date();
        let thisYearBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
        if (thisYearBday < today) {
          thisYearBday.setFullYear(today.getFullYear() + 1);
        }
        const daysUntilBday = Math.ceil((thisYearBday - today) / (1000 * 60 * 60 * 24));
        const petAge = today.getFullYear() - bday.getFullYear();
        if (daysUntilBday <= 30 && petAge > 0) {
          birthday = { daysUntil: daysUntilBday, age: petAge };
        }
      }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // 6. WEATHER & ENVIRONMENT ALERTS
    // ─────────────────────────────────────────────────────────────────────────
    if (weather) {
      const temp = weather.temperature || weather.temp;
      const city = weather.city || 'your area';
      
      // Heat alert
      if (temp >= 35) {
        environment.push({
          id: 'heat-danger',
          icon: Sun,
          title: 'Extreme Heat Warning',
          message: `${temp}°C in ${city}. Avoid outdoor activity.`,
          level: 'danger'
        });
      } else if (temp >= 30) {
        environment.push({
          id: 'heat-caution',
          icon: Sun,
          title: 'Heat Advisory',
          message: `${temp}°C in ${city}. Walk early morning or late evening.`,
          level: 'warning'
        });
      }
      
      // Cold alert
      if (temp <= 5) {
        environment.push({
          id: 'cold-warning',
          icon: Thermometer,
          title: 'Cold Weather Alert',
          message: `${temp}°C. Keep walks short, consider a coat.`,
          level: 'warning'
        });
      }
      
      // Rain
      if (weather.condition?.toLowerCase().includes('rain')) {
        environment.push({
          id: 'rain-alert',
          icon: CloudRain,
          title: 'Rain Expected',
          message: 'Pack rain gear for walks today.',
          level: 'info'
        });
      }
    }
    
    // Seasonal alerts based on month
    const month = new Date().getMonth();
    
    // Tick season (Spring/Summer)
    if (month >= 3 && month <= 8) {
      const hasTickAlert = soulAnswers.seasonal_concerns?.includes('Tick season');
      if (hasTickAlert || month >= 4 && month <= 6) {
        environment.push({
          id: 'tick-season',
          icon: AlertCircle,
          title: 'Tick Season Active',
          message: 'Check for ticks after outdoor activities.',
          level: 'info',
          action: 'Prevention tips'
        });
      }
    }
    
    // Fireworks anxiety (Diwali - Oct/Nov, New Year - Dec/Jan)
    if (month === 9 || month === 10 || month === 11 || month === 0) {
      const hasAnxiety = soulAnswers.fear_triggers?.includes('Fireworks') || 
                         soulAnswers.anxiety_level === 'Severe' ||
                         soulAnswers.anxiety_level === 'Moderate';
      if (hasAnxiety) {
        environment.push({
          id: 'fireworks-prep',
          icon: Zap,
          title: 'Fireworks Season',
          message: `Prepare ${pet.name}'s safe space and calming aids.`,
          level: 'warning',
          action: 'Anxiety prep'
        });
      }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // 7. DOCUMENT EXPIRY
    // ─────────────────────────────────────────────────────────────────────────
    const petDocuments = pet.documents || [];
    petDocuments.forEach(doc => {
      if (doc.expiry_date) {
        const daysToExpiry = daysUntil(doc.expiry_date);
        if (daysToExpiry !== null && daysToExpiry <= 30) {
          if (daysToExpiry <= 0) {
            urgent.push({
              id: `doc-${doc.id || doc.name}`,
              icon: FileText,
              title: `${doc.name || 'Document'} Expired`,
              description: 'Renewal required',
              action: 'Renew',
              variant: 'danger'
            });
          } else {
            documents.push({
              id: `doc-${doc.id || doc.name}`,
              title: doc.name || 'Document',
              daysToExpiry,
              pet: pet.name
            });
          }
        }
      }
    });
    
    // Check for missing vaccination certificate
    const hasVaccCert = petDocuments.some(d => 
      d.type === 'vaccination' || d.name?.toLowerCase().includes('vaccin')
    );
    if (!hasVaccCert && vaccStatus === 'Up to date') {
      documents.push({
        id: 'vacc-cert-missing',
        title: 'Vaccination Certificate',
        daysToExpiry: null,
        pet: pet.name,
        isMissing: true
      });
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // MERGE API DATA (tickets, tasks) WITH LOCAL CALCULATIONS
    // API items come from /api/mira/today/{pet_id}
    // ═══════════════════════════════════════════════════════════════════════════
    
    if (apiTodayData.items && apiTodayData.items.length > 0) {
      apiTodayData.items.forEach(item => {
        const apiItem = {
          id: `api-${item.id}`,
          icon: item.badge === 'urgent' ? AlertTriangle : 
                item.badge === 'awaiting_you' ? Bell : Clock,
          title: item.title,
          description: item.pet_name ? `For ${item.pet_name}` : null,
          action: item.badge === 'awaiting_you' ? 'Respond' : 'View',
          variant: item.badge === 'urgent' ? 'danger' : 
                   item.badge === 'awaiting_you' ? 'warning' : 'default',
          pillar: item.pillar,
          ticketId: item.id,
          fromApi: true
        };
        
        if (item.badge === 'urgent') {
          urgent.push(apiItem);
        } else if (item.badge === 'awaiting_you') {
          // Add to urgent as "needs your response"
          urgent.push(apiItem);
        } else {
          dueSoon.push(apiItem);
        }
      });
    }
    
    return { urgent, dueSoon, environment, documents, birthday };
  }, [pet, weather, apiTodayData]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FETCH WATCHLIST FROM SERVICES API
  // Uses the unified watchlist endpoint for "in-motion" tickets
  // ═══════════════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    const fetchWatchlist = async () => {
      // Skip if not open - apiUrl can be empty string for relative paths
      if (!isOpen) return;
      
      // Skip for demo pets - they don't have real tickets
      // Note: Real pet IDs are like 'pet-e6348b13c975', demo is exactly 'demo-pet' or 'demo'
      const isDemoPet = !pet?.id || pet.id === 'demo-pet' || pet.id === 'demo';
      if (isDemoPet) {
        console.log('[TODAY] Skipping watchlist fetch for demo pet');
        return;
      }
      
      console.log('[TODAY] Fetching watchlist for pet:', pet.id);
      
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        // Fetch watchlist with pet filter
        const url = `${apiUrl}/api/os/services/watchlist?pet_id=${pet.id}`;
        
        const response = await fetch(url, { headers });
        
        if (response.ok) {
          const data = await response.json();
          console.log('[TODAY] Watchlist fetched:', data.count, 'items for pet:', pet.id);
          
          // Set watchlist items directly from API (already enriched)
          setWatchlist(data.watchlist || []);
          
          // Check if data is stale (API returns stale flag)
          setIsStale(data.stale || false);
          
          // Also support legacy activeTasks for backward compatibility
          const tasks = (data.watchlist || []).slice(0, 5).map(ticket => ({
            id: ticket.ticket_id || ticket._id || ticket.id,
            title: ticket.title || ticket.service_type || 'Service Request',
            status: ticket.status,
            statusText: getStatusText(ticket.status)
          }));
          setActiveTasks(tasks);
        } else {
          console.log('[TODAY] Watchlist fetch failed:', response.status);
        }
      } catch (err) {
        console.log('[TODAY] Could not fetch watchlist:', err.message);
      }
    };
    
    fetchWatchlist();
  }, [isOpen, pet?.id, apiUrl, token]);
  
  const getStatusText = (status) => {
    const texts = {
      'clarification_needed': 'Awaiting your input',
      'options_ready': 'Choose an option',
      'approval_pending': 'Awaiting your approval',
      'payment_pending': 'Payment pending',
      'in_progress': 'In progress',
      'scheduled': 'Scheduled',
      'shipped': 'Shipped - on its way',
      'pending': 'Awaiting your confirmation',
      'awaiting_confirmation': 'Awaiting your confirmation',
      'scheduling': 'Concierge® is scheduling',
      'confirmed': 'Confirmed'
    };
    return texts[status] || status;
  };
  
  // Handler for quick actions on watchlist tickets
  const handleTicketAction = async (ticket, action) => {
    if (onTicketAction) {
      onTicketAction(ticket, action);
    } else {
      // Default: navigate to ticket detail
      onNavigate?.(`/services?ticket=${ticket.ticket_id}`);
    }
  };
  
  // ═══════════════════════════════════════════════════════════════════════════
  // REFRESH HANDLER
  // ═══════════════════════════════════════════════════════════════════════════
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setLastUpdated(new Date());
    
    // Re-fetch watchlist data
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(
        `${apiUrl}/api/os/services/watchlist?pet_id=${pet?.id}`,
        { headers }
      );
      
      if (response.ok) {
        const data = await response.json();
        setWatchlist(data.watchlist || []);
        setIsStale(data.stale || false);
      }
    } catch (err) {
      console.log('[TODAY] Refresh failed:', err.message);
    }
    
    setIsRefreshing(false);
  };
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CALCULATE TOTAL COUNT
  // ═══════════════════════════════════════════════════════════════════════════
  
  const awaitingYouCount = useMemo(() => {
    return watchlist.filter(t => t.awaiting_user).length;
  }, [watchlist]);
  
  const totalCount = useMemo(() => {
    return todayData.urgent.length + 
           todayData.dueSoon.length + 
           todayData.environment.length +
           todayData.documents.length +
           watchlist.length +
           (todayData.birthday ? 1 : 0);
  }, [todayData, watchlist]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // BODY SCROLL LOCK (iOS Safari fix)
  // ═══════════════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  
  if (!isOpen) return null;
  
  return (
    <>
      <style>{todayPanelStyles}</style>
      <div 
        className="today-panel-overlay" 
        onClick={(e) => e.target === e.currentTarget && onClose()}
        data-testid="today-panel-overlay"
      >
        <div className="today-panel" data-testid="today-panel">
          {/* ═══════════════════════════════════════════════════════════════════
              HEADER
          ═══════════════════════════════════════════════════════════════════ */}
          <header className="today-header">
            <div className="header-left">
              <Calendar className="w-5 h-5 text-purple-400" />
              <h2>Today</h2>
              {totalCount > 0 && (
                <span className="today-count-badge" data-testid="today-count">
                  {totalCount}
                </span>
              )}
            </div>
            <div className="header-right">
              {/* Stale Indicator */}
              {isStale && (
                <span className="stale-indicator" data-testid="stale-indicator" title="Data may be outdated">
                  <AlertCircle className="w-4 h-4" />
                </span>
              )}
              <button 
                className="refresh-btn"
                onClick={handleRefresh}
                disabled={isRefreshing}
                aria-label="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <span className="last-updated">
                {lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </span>
              <button 
                className="close-btn" 
                onClick={onClose}
                aria-label="Close"
                data-testid="today-close-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </header>
          
          {/* ═══════════════════════════════════════════════════════════════════
              CONTENT
          ═══════════════════════════════════════════════════════════════════ */}
          <div className="today-content">
            
            {/* WEATHER HERO - Full weather display at top */}
            {weather && (
              <WeatherHeroCard
                weather={weather}
                city={weather.city || 'Your area'}
                petName={pet?.name}
                onAskMira={onAskMira}
              />
            )}
            
            {/* Birthday Countdown - Special prominence */}
            {todayData.birthday && (
              <BirthdayCountdown pet={pet} daysUntil={todayData.birthday.daysUntil} />
            )}
            
            {/* ─────────────────────────────────────────────────────────────────
                URGENT STACK (Always at top)
            ───────────────────────────────────────────────────────────────── */}
            {todayData.urgent.length > 0 && (
              <section className="today-section urgent-section">
                <SectionHeader 
                  icon={AlertTriangle} 
                  title="Needs Attention" 
                  count={todayData.urgent.length}
                  iconColor="text-red-400"
                />
                <div className="cards-stack">
                  {todayData.urgent.map(item => (
                    <UrgentCard
                      key={item.id}
                      icon={item.icon}
                      title={item.title}
                      description={item.description}
                      action={item.action}
                      variant={item.variant}
                      onAction={() => onNavigate?.(item.navigateTo || '/care')}
                    />
                  ))}
                </div>
              </section>
            )}
            
            {/* ─────────────────────────────────────────────────────────────────
                DUE SOON CARDS
            ───────────────────────────────────────────────────────────────── */}
            {todayData.dueSoon.length > 0 && (
              <section className="today-section">
                <SectionHeader 
                  icon={Clock} 
                  title="Coming Up" 
                  count={todayData.dueSoon.length}
                  iconColor="text-amber-400"
                />
                <div className="cards-stack">
                  {todayData.dueSoon.map(item => (
                    <DueSoonCard
                      key={item.id}
                      icon={item.icon}
                      title={item.title}
                      dueIn={item.dueIn}
                      pet={item.pet}
                      action={item.action}
                      onAction={() => onNavigate?.('/care')}
                    />
                  ))}
                </div>
              </section>
            )}
            
            {/* ─────────────────────────────────────────────────────────────────
                ENVIRONMENT ALERTS
            ───────────────────────────────────────────────────────────────── */}
            {todayData.environment.length > 0 && (
              <section className="today-section">
                <SectionHeader 
                  icon={Cloud} 
                  title="Environment" 
                  count={todayData.environment.length}
                  iconColor="text-blue-400"
                />
                <div className="cards-stack">
                  {todayData.environment.map(item => (
                    <EnvironmentAlertCard
                      key={item.id}
                      icon={item.icon}
                      title={item.title}
                      message={item.message}
                      level={item.level}
                      action={item.action}
                      onAction={() => {}}
                    />
                  ))}
                </div>
              </section>
            )}
            
            {/* ─────────────────────────────────────────────────────────────────
                AWAITING YOU - One-tap actions (Killer UX)
            ───────────────────────────────────────────────────────────────── */}
            {watchlist.filter(t => t.awaiting_user).length > 0 && (
              <section className="today-section awaiting-section" data-testid="awaiting-you-section">
                <SectionHeader 
                  icon={Bell} 
                  title="Awaiting You" 
                  count={awaitingYouCount}
                  iconColor="text-rose-400"
                />
                <div className="cards-stack">
                  {watchlist.filter(t => t.awaiting_user).map(ticket => (
                    <WatchlistTaskCard
                      key={ticket.ticket_id || ticket.id}
                      ticket={ticket}
                      onAction={handleTicketAction}
                      onView={(t) => onNavigate?.(`/services?ticket=${t.ticket_id}`)}
                    />
                  ))}
                </div>
              </section>
            )}
            
            {/* ─────────────────────────────────────────────────────────────────
                IN PROGRESS - Active service requests
            ───────────────────────────────────────────────────────────────── */}
            {watchlist.filter(t => !t.awaiting_user).length > 0 && (
              <section className="today-section">
                <SectionHeader 
                  icon={Activity} 
                  title="In Progress" 
                  count={watchlist.filter(t => !t.awaiting_user).length}
                  iconColor="text-cyan-400"
                />
                <div className="cards-stack">
                  {watchlist.filter(t => !t.awaiting_user).map(ticket => (
                    <WatchlistTaskCard
                      key={ticket.ticket_id || ticket.id}
                      ticket={ticket}
                      onAction={handleTicketAction}
                      onView={(t) => onNavigate?.(`/services?ticket=${t.ticket_id}`)}
                    />
                  ))}
                </div>
              </section>
            )}
            
            {/* ─────────────────────────────────────────────────────────────────
                LEARN NUDGE - Smart nudge from LEARN layer (max 1)
                Shows when user completed/saved a Learn item with service action
                Placement: After watchlist, before Documents
            ───────────────────────────────────────────────────────────────── */}
            {learnNudge && (
              <section className="today-section learn-nudge-section" data-testid="learn-nudge-section">
                <SectionHeader 
                  icon={BookOpen} 
                  title="Based on your learning" 
                  count={1}
                  iconColor="text-purple-400"
                />
                <div className="cards-stack">
                  <LearnNudgeCard
                    nudge={learnNudge}
                    onPrimaryAction={handleLearnNudgePrimary}
                    onSecondaryAction={handleLearnNudgeSecondary}
                    onDismiss={handleLearnNudgeDismiss}
                  />
                </div>
              </section>
            )}
            
            {/* ─────────────────────────────────────────────────────────────────
                DOCUMENTS + COMPLIANCE
            ───────────────────────────────────────────────────────────────── */}
            {todayData.documents.length > 0 && (
              <section className="today-section">
                <SectionHeader 
                  icon={FileText} 
                  title="Documents" 
                  count={todayData.documents.length}
                  iconColor="text-orange-400"
                />
                <div className="cards-stack">
                  {todayData.documents.map(doc => (
                    <DocumentCard
                      key={doc.id}
                      title={doc.title}
                      daysToExpiry={doc.daysToExpiry}
                      pet={doc.pet}
                      onAction={() => onNavigate?.('/paperwork')}
                    />
                  ))}
                </div>
              </section>
            )}
            
            {/* ─────────────────────────────────────────────────────────────────
                EMPTY STATE
            ───────────────────────────────────────────────────────────────── */}
            {totalCount === 0 && (
              <EmptyState petName={pet?.name || 'your pet'} />
            )}
            
            {/* ─────────────────────────────────────────────────────────────────
                OTHER PETS
            ───────────────────────────────────────────────────────────────── */}
            {allPets.length > 1 && (
              <OtherPetSummary 
                pets={allPets} 
                currentPetId={pet?.id}
                onPetClick={onPetSwitch}
              />
            )}
            
          </div>
        </div>
      </div>
    </>
  );
};

export default TodayPanel;

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// Per MOJO Bible UI Laws: Calm, minimal, purposeful animations
// ═══════════════════════════════════════════════════════════════════════════════

const todayPanelStyles = `
/* ═══════════════════════════════════════════════════════════════════════════════
   TODAY PANEL - Time Layer Styles
   Following MOJO Bible UI Laws:
   - Calm Interface
   - Minimal Animation (200ms ease-out open, 150ms close)
   - 44x44px touch targets
═══════════════════════════════════════════════════════════════════════════════ */

/* Overlay */
.today-panel-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 100;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 80px;
  animation: fadeIn 150ms ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Panel Container */
.today-panel {
  width: 100%;
  max-width: 440px;
  max-height: calc(100vh - 120px);
  max-height: calc(100dvh - 120px);
  background: linear-gradient(180deg, #1a1a2e 0%, #16162a 100%);
  border-radius: 20px;
  border: 1px solid rgba(139, 92, 246, 0.2);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideDown 200ms ease-out;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  /* iOS Safari safe area */
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

/* Mobile bottom sheet variant */
@media (max-width: 640px) {
  .today-panel-overlay {
    padding-top: 0;
    align-items: flex-end;
  }
  
  .today-panel {
    max-width: 100%;
    border-radius: 20px 20px 0 0;
    max-height: calc(85vh);
    max-height: calc(85dvh);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Header */
.today-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(139, 92, 246, 0.08);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-left h2 {
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin: 0;
  letter-spacing: -0.02em;
}

.today-count-badge {
  background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%);
  color: white;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.refresh-btn {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.refresh-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.refresh-btn:disabled {
  cursor: not-allowed;
}

.last-updated {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
}

.close-btn {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.08);
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

/* Content Area */
.today-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  -webkit-overflow-scrolling: touch;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   WEATHER HERO CARD - Full weather display at top of TODAY
═══════════════════════════════════════════════════════════════════════════════ */

.weather-hero-card {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.weather-hero-main {
  text-align: center;
}

.weather-temp-large {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  line-height: 1;
}

.weather-temp-large .temp-number {
  font-size: 64px;
  font-weight: 300;
  color: white;
  letter-spacing: -0.02em;
}

.weather-temp-large .temp-unit {
  font-size: 24px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 8px;
}

.weather-location {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
  margin-top: 4px;
}

.weather-description {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  margin: 8px 0 0 0;
  text-transform: capitalize;
}

.walk-safety {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
}

.walk-safety.safe {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
}

.walk-safety.warning {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
}

.walk-safety.danger {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
}

.weather-details {
  display: flex;
  justify-content: center;
  gap: 24px;
}

.weather-detail {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.weather-ask-mira {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 12px;
  background: rgba(139, 92, 246, 0.2);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 12px;
  color: #a78bfa;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.weather-ask-mira:hover {
  background: rgba(139, 92, 246, 0.3);
}

/* Section */
.today-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.today-section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 4px;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.section-count {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.1);
  padding: 1px 6px;
  border-radius: 6px;
}

.cards-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   CARD STYLES
═══════════════════════════════════════════════════════════════════════════════ */

.today-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.2s;
}

.today-card:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.12);
}

/* Card Icon */
.card-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: rgba(139, 92, 246, 0.15);
  color: #A78BFA;
}

/* Card Content */
.card-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.card-title {
  font-size: 14px;
  font-weight: 500;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-description {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.card-pet {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
}

/* Card Timing Badge */
.card-timing {
  flex-shrink: 0;
}

.timing-badge {
  font-size: 11px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 8px;
  white-space: nowrap;
}

.timing-badge.overdue {
  background: rgba(239, 68, 68, 0.15);
  color: #F87171;
}

.timing-badge.urgent {
  background: rgba(249, 115, 22, 0.15);
  color: #FB923C;
}

.timing-badge.soon {
  background: rgba(250, 204, 21, 0.15);
  color: #FACC15;
}

.timing-badge.upcoming {
  background: rgba(139, 92, 246, 0.15);
  color: #A78BFA;
}

/* Card Actions */
.card-action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  border-radius: 10px;
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: #A78BFA;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  min-height: 44px;
}

.card-action-btn:hover {
  background: rgba(139, 92, 246, 0.25);
  border-color: #8B5CF6;
}

.card-chevron {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.card-chevron:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.card-action-link {
  font-size: 12px;
  font-weight: 500;
  color: #A78BFA;
  background: none;
  border: none;
  cursor: pointer;
  padding: 12px 12px;
  min-height: 44px;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}

.card-action-link:hover {
  color: #C4B5FD;
}

.card-view-btn {
  font-size: 12px;
  font-weight: 500;
  color: #A78BFA;
  background: none;
  border: none;
  cursor: pointer;
  padding: 12px 16px;
  min-height: 44px;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}
  min-height: 44px;
}

.card-view-btn:hover {
  color: #C4B5FD;
}

/* Task Card Status */
.card-status-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}

.card-status-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

/* ═══════════════════════════════════════════════════════════════════════════════
   URGENT CARD VARIANTS
═══════════════════════════════════════════════════════════════════════════════ */

.today-card.urgent.danger {
  background: rgba(239, 68, 68, 0.08);
  border-color: rgba(239, 68, 68, 0.25);
}

.today-card.urgent.danger .card-icon-wrap {
  background: rgba(239, 68, 68, 0.2);
  color: #F87171;
}

.today-card.urgent.warning {
  background: rgba(249, 115, 22, 0.08);
  border-color: rgba(249, 115, 22, 0.25);
}

.today-card.urgent.warning .card-icon-wrap {
  background: rgba(249, 115, 22, 0.2);
  color: #FB923C;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   ENVIRONMENT CARD VARIANTS
═══════════════════════════════════════════════════════════════════════════════ */

.today-card.environment.danger {
  background: rgba(239, 68, 68, 0.08);
  border-color: rgba(239, 68, 68, 0.2);
}

.today-card.environment.danger .card-icon-wrap {
  background: rgba(239, 68, 68, 0.2);
  color: #F87171;
}

.today-card.environment.warning {
  background: rgba(249, 115, 22, 0.08);
  border-color: rgba(249, 115, 22, 0.2);
}

.today-card.environment.warning .card-icon-wrap {
  background: rgba(249, 115, 22, 0.2);
  color: #FB923C;
}

.today-card.environment.info {
  background: rgba(59, 130, 246, 0.08);
  border-color: rgba(59, 130, 246, 0.2);
}

.today-card.environment.info .card-icon-wrap {
  background: rgba(59, 130, 246, 0.2);
  color: #60A5FA;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   BIRTHDAY CARD
═══════════════════════════════════════════════════════════════════════════════ */

.today-card.birthday {
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.12) 0%, rgba(168, 85, 247, 0.12) 100%);
  border-color: rgba(236, 72, 153, 0.3);
  padding: 18px 20px;
}

.birthday-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #EC4899 0%, #A855F7 100%);
  color: white;
  flex-shrink: 0;
}

.birthday-title {
  font-size: 15px;
  font-weight: 600;
  color: white;
}

.birthday-hint {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.birthday-countdown-number {
  font-size: 28px;
  font-weight: 700;
  color: #EC4899;
  line-height: 1;
}

.birthday-celebration {
  font-size: 28px;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   DOCUMENT CARD
═══════════════════════════════════════════════════════════════════════════════ */

.today-card.document.expired {
  background: rgba(239, 68, 68, 0.08);
  border-color: rgba(239, 68, 68, 0.2);
}

.today-card.document.expired .card-icon-wrap {
  background: rgba(239, 68, 68, 0.2);
  color: #F87171;
}

.today-card.document.urgent .card-icon-wrap {
  background: rgba(249, 115, 22, 0.2);
  color: #FB923C;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   OTHER PETS SECTION
═══════════════════════════════════════════════════════════════════════════════ */

.other-pets-section {
  margin-top: 8px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.other-pets-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.other-pet-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  text-align: left;
  min-height: 44px;
}

.other-pet-row:hover {
  background: rgba(255, 255, 255, 0.06);
}

.other-pet-name {
  font-size: 14px;
  font-weight: 500;
  color: white;
}

.other-pet-alert {
  flex: 1;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  text-align: right;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   EMPTY STATE
═══════════════════════════════════════════════════════════════════════════════ */

.today-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}

.today-empty-state h3 {
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin: 16px 0 4px;
}

.today-empty-state p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

.empty-hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 8px;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MOBILE RESPONSIVE
═══════════════════════════════════════════════════════════════════════════════ */

@media (max-width: 640px) {
  .today-panel-overlay {
    padding: 0;
    align-items: flex-end;
  }
  
  .today-panel {
    max-width: 100%;
    max-height: 90vh;
    max-height: 90dvh;
    border-radius: 24px 24px 0 0;
    /* iOS safe area */
    padding-bottom: env(safe-area-inset-bottom, 0);
  }
  
  .today-header {
    padding: 20px;
  }
  
  .today-content {
    padding: 16px 20px 24px;
  }
  
  /* Larger touch targets on mobile */
  .card-action-btn {
    padding: 10px 16px;
    min-height: 48px;
  }
  
  .close-btn {
    width: 48px;
    height: 48px;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════════
   iOS SPECIFIC
═══════════════════════════════════════════════════════════════════════════════ */

@supports (-webkit-touch-callout: none) {
  .today-panel {
    /* iOS momentum scrolling */
    -webkit-overflow-scrolling: touch;
  }
  
  .today-content {
    /* Prevent rubber-banding issues */
    overscroll-behavior: contain;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════════
   REDUCED MOTION
═══════════════════════════════════════════════════════════════════════════════ */

@media (prefers-reduced-motion: reduce) {
  .today-panel-overlay,
  .today-panel,
  .today-card,
  .card-action-btn,
  .close-btn {
    animation: none;
    transition: none;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════════
   DARK MODE ENHANCEMENTS (Already dark, but ensure consistency)
═══════════════════════════════════════════════════════════════════════════════ */

@media (prefers-color-scheme: dark) {
  .today-panel {
    background: linear-gradient(180deg, #1a1a2e 0%, #16162a 100%);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════════
   STALE INDICATOR
═══════════════════════════════════════════════════════════════════════════════ */

.stale-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(249, 115, 22, 0.15);
  color: #FB923C;
  animation: stale-pulse 2s ease-in-out infinite;
}

@keyframes stale-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* ═══════════════════════════════════════════════════════════════════════════════
   WATCHLIST TASK CARDS
═══════════════════════════════════════════════════════════════════════════════ */

.today-card.watchlist-task {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.today-card.watchlist-task.awaiting {
  background: rgba(244, 63, 94, 0.08);
  border: 1px solid rgba(244, 63, 94, 0.2);
}

.today-card.watchlist-task.awaiting:hover {
  background: rgba(244, 63, 94, 0.12);
  border-color: rgba(244, 63, 94, 0.3);
}

.card-quick-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 18px;
  border-radius: 10px;
  background: linear-gradient(135deg, #EC4899 0%, #F43F5E 100%);
  border: none;
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  min-height: 44px;
  box-shadow: 0 2px 8px rgba(244, 63, 94, 0.3);
}

.card-quick-action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(244, 63, 94, 0.4);
}

.card-quick-action-btn:active {
  transform: translateY(0);
}

/* Awaiting You Section styling */
.today-section.awaiting-section {
  background: rgba(244, 63, 94, 0.05);
  border-radius: 16px;
  padding: 14px;
  margin: -4px;
}

.today-section.awaiting-section .today-section-header {
  margin-bottom: 8px;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   LEARN NUDGE CARD - Smart nudge from LEARN layer
═══════════════════════════════════════════════════════════════════════════════ */

.today-section.learn-nudge-section {
  background: rgba(139, 92, 246, 0.05);
  border-radius: 16px;
  padding: 14px;
  margin: -4px;
}

.today-card.learn-nudge {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(168, 85, 247, 0.12) 100%);
  border: 1px solid rgba(139, 92, 246, 0.25);
  flex-wrap: wrap;
  gap: 12px;
}

.today-card.learn-nudge:hover {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.18) 0%, rgba(168, 85, 247, 0.18) 100%);
  border-color: rgba(139, 92, 246, 0.35);
}

.learn-nudge-icon {
  background: rgba(139, 92, 246, 0.2);
  color: #A78BFA;
}

.card-description.learn-context {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  font-style: italic;
}

.learn-nudge-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  margin-top: 4px;
}

.learn-nudge-primary {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 16px;
  border-radius: 10px;
  background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%);
  border: none;
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 44px;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
}

.learn-nudge-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
}

.learn-nudge-secondary {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 44px;
}

.learn-nudge-secondary:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.25);
  color: white;
}

.learn-nudge-dismiss {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.learn-nudge-dismiss:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
}
`;

// Export styles separately if needed
export { todayPanelStyles };
