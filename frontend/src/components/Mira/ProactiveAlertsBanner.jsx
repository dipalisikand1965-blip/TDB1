/**
 * ProactiveAlertsBanner - Smart notifications from Mira
 * =====================================================
 * "Mira doesn't just respond - she anticipates."
 * 
 * Shows vaccination due, birthday reminders, grooming alerts
 * 
 * Urgency levels:
 * - CRITICAL: Red pulse, immediate action
 * - HIGH: Orange, action within 24h  
 * - MEDIUM: Yellow, plan ahead
 * - LOW: Blue, informational
 */

import React, { useState } from 'react';
import { 
  AlertTriangle, Calendar, Scissors, Syringe, 
  X, ChevronRight, Bell, Gift, Heart
} from 'lucide-react';
import hapticFeedback from '../../utils/haptic';

const URGENCY_STYLES = {
  critical: {
    bg: 'bg-red-500/20 border-red-500/50',
    text: 'text-red-100',
    icon: 'text-red-400',
    pulse: true
  },
  high: {
    bg: 'bg-orange-500/20 border-orange-500/50',
    text: 'text-orange-100',
    icon: 'text-orange-400',
    pulse: false
  },
  medium: {
    bg: 'bg-yellow-500/20 border-yellow-500/50',
    text: 'text-yellow-100',
    icon: 'text-yellow-400',
    pulse: false
  },
  low: {
    bg: 'bg-blue-500/20 border-blue-500/50',
    text: 'text-blue-100',
    icon: 'text-blue-400',
    pulse: false
  }
};

const TYPE_ICONS = {
  vaccination: Syringe,
  birthday: Gift,
  grooming: Scissors,
  health: Heart,
  default: Bell
};

const ProactiveAlertCard = ({ alert, onAction, onDismiss }) => {
  const style = URGENCY_STYLES[alert.urgency] || URGENCY_STYLES.medium;
  const IconComponent = TYPE_ICONS[alert.type] || TYPE_ICONS.default;
  
  return (
    <div 
      className={`
        relative p-3 rounded-xl border backdrop-blur-sm
        ${style.bg} ${style.text}
        ${style.pulse ? 'animate-pulse' : ''}
        transition-all duration-300 hover:scale-[1.02]
      `}
      data-testid={`alert-${alert.id}`}
    >
      {/* Dismiss button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          hapticFeedback.buttonTap(e);
          onDismiss?.(alert.id);
        }}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/10 transition-colors"
        data-testid={`dismiss-${alert.id}`}
      >
        <X size={14} className="opacity-60" />
      </button>
      
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`p-2 rounded-lg bg-white/10 ${style.icon}`}>
          <IconComponent size={20} />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0 pr-6">
          <h4 className="font-semibold text-sm truncate">{alert.title}</h4>
          <p className="text-xs opacity-80 mt-0.5 line-clamp-2">{alert.message}</p>
          
          {/* Days until */}
          {alert.days_until !== null && alert.days_until !== undefined && (
            <div className="flex items-center gap-1 mt-1.5">
              <Calendar size={12} className="opacity-60" />
              <span className="text-xs opacity-70">
                {alert.days_until === 0 
                  ? 'Today!' 
                  : alert.days_until < 0 
                    ? `${Math.abs(alert.days_until)} days overdue`
                    : `In ${alert.days_until} days`
                }
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* CTA Button */}
      {alert.cta && (
        <button
          onClick={(e) => {
            hapticFeedback.buttonTap(e);
            onAction?.(alert);
          }}
          className={`
            w-full mt-3 py-2 px-3 rounded-lg
            bg-white/10 hover:bg-white/20
            text-xs font-medium
            flex items-center justify-center gap-1.5
            transition-colors
          `}
          data-testid={`cta-${alert.id}`}
        >
          {alert.cta}
          <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
};

const ProactiveAlertsBanner = ({ 
  alerts = [], 
  criticalCount = 0,
  onAlertAction,
  onDismiss,
  maxVisible = 3,
  className = ''
}) => {
  const [expanded, setExpanded] = useState(false);
  const [dismissedIds, setDismissedIds] = useState(new Set());
  
  // Filter out dismissed alerts
  const visibleAlerts = alerts.filter(a => !dismissedIds.has(a.id));
  
  // Show critical first, then by urgency
  const sortedAlerts = [...visibleAlerts].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return (order[a.urgency] || 4) - (order[b.urgency] || 4);
  });
  
  const displayAlerts = expanded ? sortedAlerts : sortedAlerts.slice(0, maxVisible);
  const hasMore = sortedAlerts.length > maxVisible;
  
  const handleDismiss = (alertId) => {
    setDismissedIds(prev => new Set([...prev, alertId]));
    onDismiss?.(alertId);
  };
  
  if (visibleAlerts.length === 0) {
    return null;
  }
  
  return (
    <div className={`space-y-2 ${className}`} data-testid="proactive-alerts-banner">
      {/* Header with count */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-purple-400" />
          <span className="text-xs text-purple-300 font-medium">
            Mira's Reminders
          </span>
          {criticalCount > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full animate-pulse">
              {criticalCount} urgent
            </span>
          )}
        </div>
        
        {hasMore && (
          <button
            onClick={(e) => {
              hapticFeedback.buttonTap(e);
              setExpanded(!expanded);
            }}
            className="text-xs text-purple-400 hover:text-purple-300"
          >
            {expanded ? 'Show less' : `+${sortedAlerts.length - maxVisible} more`}
          </button>
        )}
      </div>
      
      {/* Alert cards */}
      <div className="space-y-2">
        {displayAlerts.map(alert => (
          <ProactiveAlertCard
            key={alert.id}
            alert={alert}
            onAction={onAlertAction}
            onDismiss={handleDismiss}
          />
        ))}
      </div>
    </div>
  );
};

export default ProactiveAlertsBanner;
