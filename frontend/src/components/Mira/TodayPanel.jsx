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
  CloudRain, AlertOctagon, Dog, MapPin, RefreshCw
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
}) => {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [activeTasks, setActiveTasks] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [isStale, setIsStale] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
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
      const today = new Date();
      let thisYearBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
      if (thisYearBday < today) {
        thisYearBday.setFullYear(today.getFullYear() + 1);
      }
      const daysUntilBday = Math.ceil((thisYearBday - today) / (1000 * 60 * 60 * 24));
      if (daysUntilBday <= 30) {
        birthday = { daysUntil: daysUntilBday };
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
    
    return { urgent, dueSoon, environment, documents, birthday };
  }, [pet, weather]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FETCH ACTIVE TASKS
  // ═══════════════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    const fetchTasks = async () => {
      if (!pet?.id || !apiUrl || !isOpen) return;
      
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const response = await fetch(
          `${apiUrl}/api/service-desk/tickets?pet_id=${pet.id}&status=active`,
          { headers }
        );
        
        if (response.ok) {
          const data = await response.json();
          const tasks = (data.tickets || []).slice(0, 5).map(ticket => ({
            id: ticket._id || ticket.id,
            title: ticket.subject || ticket.type || 'Service Request',
            status: ticket.status,
            statusText: getStatusText(ticket.status)
          }));
          setActiveTasks(tasks);
        }
      } catch (err) {
        console.log('[TODAY] Could not fetch tasks:', err.message);
      }
    };
    
    fetchTasks();
  }, [isOpen, pet?.id, apiUrl, token]);
  
  const getStatusText = (status) => {
    const texts = {
      'pending': 'Awaiting your confirmation',
      'awaiting_confirmation': 'Awaiting your confirmation',
      'scheduling': 'Concierge is scheduling',
      'in_progress': 'In progress',
      'payment_pending': 'Payment pending',
      'shipped': 'Order shipped',
      'confirmed': 'Confirmed'
    };
    return texts[status] || status;
  };
  
  // ═══════════════════════════════════════════════════════════════════════════
  // REFRESH HANDLER
  // ═══════════════════════════════════════════════════════════════════════════
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setLastUpdated(new Date());
    // Trigger re-fetch of tasks
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsRefreshing(false);
  };
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CALCULATE TOTAL COUNT
  // ═══════════════════════════════════════════════════════════════════════════
  
  const totalCount = useMemo(() => {
    return todayData.urgent.length + 
           todayData.dueSoon.length + 
           todayData.environment.length +
           todayData.documents.length +
           activeTasks.length +
           (todayData.birthday ? 1 : 0);
  }, [todayData, activeTasks]);
  
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
                ACTIVE TASKS WATCHLIST
            ───────────────────────────────────────────────────────────────── */}
            {activeTasks.length > 0 && (
              <section className="today-section">
                <SectionHeader 
                  icon={Activity} 
                  title="Active Requests" 
                  count={activeTasks.length}
                  iconColor="text-blue-400"
                />
                <div className="cards-stack">
                  {activeTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      title={task.title}
                      status={task.status}
                      statusText={task.statusText}
                      onView={() => onNavigate?.(`/my-tickets?id=${task.id}`)}
                    />
                  ))}
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
  width: 36px;
  height: 36px;
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
  width: 32px;
  height: 32px;
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
  padding: 4px 8px;
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
  padding: 8px 12px;
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
`;

// Export styles separately if needed
export { todayPanelStyles };
