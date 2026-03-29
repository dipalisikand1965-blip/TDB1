/**
 * TicketDetailPanel.jsx
 * 
 * Ticket Detail View - Timeline, updates, and action panel
 * Shows full ticket information when user selects a ticket from inbox
 * 
 * Features:
 * - Status timeline with visual progress
 * - Action buttons based on current status
 * - Notes and updates
 * - Smooth animations
 */

import React, { useState, useEffect, useCallback, memo } from 'react';
import { 
  X, ChevronLeft, Clock, Calendar, MapPin, PawPrint,
  Check, AlertCircle, CreditCard, MessageCircle, FileText,
  Loader2, CheckCircle, XCircle, CalendarCheck, Package,
  Truck, Phone, MoreHorizontal
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// Status step icons
const STATUS_ICONS = {
  placed: Package,
  clarification_needed: MessageCircle,
  options_ready: FileText,
  approval_pending: CheckCircle,
  payment_pending: CreditCard,
  in_progress: Clock,
  scheduled: CalendarCheck,
  shipped: Truck,
  delivered: CheckCircle,
  completed: CheckCircle,
  cancelled: XCircle,
  unable: AlertCircle,
};

// Timeline step component
const TimelineStep = memo(({ step, isLast, isCompleted, isCurrent }) => {
  const Icon = STATUS_ICONS[step.status] || Clock;
  
  return (
    <div className="relative flex gap-3">
      {/* Vertical line */}
      {!isLast && (
        <div className={`absolute left-[15px] top-8 bottom-0 w-0.5 
                        ${isCompleted ? 'bg-purple-500' : 'bg-slate-700'}`} />
      )}
      
      {/* Icon */}
      <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                      ${isCurrent 
                        ? 'bg-purple-500 text-white ring-4 ring-purple-500/20' 
                        : isCompleted 
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-slate-800 text-slate-500'}`}>
        <Icon className="w-4 h-4" />
      </div>
      
      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-sm font-medium ${isCurrent ? 'text-white' : 'text-slate-300'}`}>
            {step.status_label || step.status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </span>
          {isCurrent && (
            <span className="tdc-chip tdc-chip-dark" style={{ background:'rgba(139,92,246,0.2)', color:'#c4b5fd', borderColor:'rgba(139,92,246,0.3)' }}>
              Current
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500">{step.note || 'Status updated'}</p>
        <p className="text-xs text-slate-600 mt-1">
          {step.timestamp ? new Date(step.timestamp).toLocaleString() : ''}
        </p>
      </div>
    </div>
  );
});

// Action Button component
const ActionButton = memo(({ label, variant, icon: Icon, onClick, loading, disabled }) => {
  const variants = {
    primary: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500',
    secondary: 'bg-slate-700 text-white hover:bg-slate-600',
    success: 'bg-green-600 text-white hover:bg-green-500',
    warning: 'bg-amber-600 text-white hover:bg-amber-500',
    danger: 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30',
  };

  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={`flex-1 py-2.5 px-4 rounded-xl font-medium flex items-center justify-center gap-2
                  transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4" />
      ) : null}
      {label}
    </button>
  );
});

// Info Row component
const InfoRow = memo(({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-2">
    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
      <Icon className="w-4 h-4 text-slate-400" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm text-white truncate">{value || 'Not specified'}</p>
    </div>
  </div>
));

// Main Component
const TicketDetailPanel = ({
  ticket,
  onClose,
  token = null,
  onAction = null,
  onRefresh = null,
}) => {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [ticketData, setTicketData] = useState(ticket);

  // Fetch full ticket details if needed
  useEffect(() => {
    if (ticket?.ticket_id) {
      setTicketData(ticket);
    }
  }, [ticket]);

  // Lock body scroll when panel is open (iOS Safari fix)
  useEffect(() => {
    // Component only renders when ticket exists, so always lock
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
  }, []);

  // Handle action execution
  const executeAction = useCallback(async (action, data = {}) => {
    if (!ticketData?.ticket_id) return;

    setActionLoading(action);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/os/services/ticket/${ticketData.ticket_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({ action, data }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'Action failed');
      }

      // Update local ticket data
      if (result.ticket) {
        setTicketData(result.ticket);
      }

      // Notify parent
      onAction?.(action, result);
      onRefresh?.();
      
      // Close panel for terminal actions (cancel)
      if (action === 'cancel') {
        setTimeout(() => onClose?.(), 500);
      }
    } catch (err) {
      console.error('[TICKET] Action error:', err);
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  }, [ticketData?.ticket_id, token, onAction, onRefresh, onClose]);

  // Get available actions based on status
  const getActions = useCallback(() => {
    if (!ticketData) return [];

    const status = ticketData.status;
    const actions = [];

    switch (status) {
      case 'clarification_needed':
        actions.push({
          key: 'clarify',
          label: 'Provide Details',
          variant: 'primary',
          icon: MessageCircle,
          action: () => executeAction('clarify'),
        });
        break;
      case 'options_ready':
        actions.push({
          key: 'select_option',
          label: 'Select Option',
          variant: 'primary',
          icon: Check,
          action: () => executeAction('select_option', { option: 'Option A' }),
        });
        break;
      case 'approval_pending':
        actions.push({
          key: 'approve_quote',
          label: 'Approve Quote',
          variant: 'success',
          icon: CheckCircle,
          action: () => executeAction('approve_quote', { amount: ticketData.quote_amount || 0 }),
        });
        break;
      case 'payment_pending':
        actions.push({
          key: 'complete_payment',
          label: 'Pay Now',
          variant: 'primary',
          icon: CreditCard,
          action: () => executeAction('complete_payment'),
        });
        break;
      case 'in_progress':
      case 'scheduled':
        // Contact support action
        actions.push({
          key: 'contact',
          label: 'Contact Support',
          variant: 'secondary',
          icon: Phone,
          action: () => window.open('tel:+919876543210'),
        });
        break;
    }

    // Always allow cancel unless terminal
    if (!['completed', 'cancelled', 'unable', 'delivered'].includes(status)) {
      actions.push({
        key: 'cancel',
        label: 'Cancel Request',
        variant: 'danger',
        icon: XCircle,
        action: () => {
          if (window.confirm('Are you sure you want to cancel this request?')) {
            executeAction('cancel');
          }
        },
      });
    }

    return actions;
  }, [ticketData, executeAction]);

  if (!ticketData) return null;

  const actions = getActions();
  const timeline = ticketData.timeline || [
    { status: ticketData.status, timestamp: ticketData.created_at, note: 'Request created' }
  ];
  const currentStatusIndex = timeline.findIndex(s => s.status === ticketData.status);

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
      data-testid="ticket-detail-panel"
      style={{ touchAction: 'none' }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Panel - uses dvh for iOS Safari */}
      <div className="relative w-full sm:max-w-lg bg-slate-900 rounded-t-2xl sm:rounded-2xl
                      border border-white/10 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300"
           style={{ 
             maxHeight: 'min(90vh, 90dvh)',
             paddingBottom: 'env(safe-area-inset-bottom, 0px)'
           }}>
        
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-white/5">
          <button 
            onClick={onClose}
            className="p-2.5 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-white truncate">
              {ticketData.title || ticketData.service_type}
            </h2>
            <p className="text-xs text-slate-500">
              {ticketData.ticket_id} • {ticketData.pet_display}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2.5 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          
          {/* Status Banner */}
          <div className={`px-4 py-3 ${ticketData.status_display?.color === 'amber' ? 'bg-amber-500/10' : 'bg-purple-500/10'}`}>
            <div className="flex items-center gap-2">
              {ticketData.awaiting_user && (
                <span className="tdc-chip tdc-chip-gold" style={{ background:'rgba(245,158,11,0.2)', color:'#fcd34d', borderColor:'rgba(245,158,11,0.3)' }}>
                  Awaiting You
                </span>
              )}
              <span className="text-sm text-slate-300">
                {ticketData.status_display?.description || ticketData.status}
              </span>
            </div>
          </div>
          
          {/* Info Section */}
          <div className="p-4 border-b border-white/5">
            <h3 className="text-sm font-medium text-slate-400 mb-3">Details</h3>
            
            <InfoRow 
              icon={PawPrint} 
              label="Pet(s)" 
              value={ticketData.pet_display} 
            />
            
            {ticketData.scheduled_at && (
              <InfoRow 
                icon={Calendar} 
                label="Scheduled" 
                value={new Date(ticketData.scheduled_at).toLocaleString()} 
              />
            )}
            
            {ticketData.preferred_time_window && (
              <InfoRow 
                icon={Clock} 
                label="Preferred Time" 
                value={ticketData.preferred_time_window} 
              />
            )}
            
            {ticketData.location && (
              <InfoRow 
                icon={MapPin} 
                label="Location" 
                value={ticketData.location} 
              />
            )}
            
            {ticketData.description && (
              <InfoRow 
                icon={FileText} 
                label="Notes" 
                value={ticketData.description} 
              />
            )}
            
            {ticketData.approved_amount && (
              <InfoRow 
                icon={CreditCard} 
                label="Approved Amount" 
                value={`₹${ticketData.approved_amount}`} 
              />
            )}
          </div>
          
          {/* Timeline Section */}
          <div className="p-4">
            <h3 className="text-sm font-medium text-slate-400 mb-4">Timeline</h3>
            
            <div className="space-y-0">
              {timeline.map((step, index) => (
                <TimelineStep
                  key={index}
                  step={step}
                  isLast={index === timeline.length - 1}
                  isCompleted={index < currentStatusIndex || index === currentStatusIndex}
                  isCurrent={index === currentStatusIndex}
                />
              ))}
            </div>
          </div>
          
          {/* Error Display */}
          {error && (
            <div className="mx-4 mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {error}
              </p>
            </div>
          )}
          
        </div>
        
        {/* Action Buttons */}
        {actions.length > 0 && (
          <div className="p-4 border-t border-white/5 bg-slate-900/80 backdrop-blur-sm">
            <div className="flex gap-3">
              {actions.slice(0, 2).map((action) => (
                <ActionButton
                  key={action.key}
                  label={action.label}
                  variant={action.variant}
                  icon={action.icon}
                  onClick={action.action}
                  loading={actionLoading === action.key}
                />
              ))}
            </div>
            
            {/* More actions dropdown */}
            {actions.length > 2 && (
              <div className="mt-2 flex justify-center">
                <button
                  onClick={() => {
                    const action = actions.find(a => a.key === 'cancel');
                    if (action) action.action();
                  }}
                  className="text-sm text-slate-500 hover:text-red-400 transition-colors"
                >
                  Cancel Request
                </button>
              </div>
            )}
          </div>
        )}
        
      </div>
    </div>
  );
};

export default TicketDetailPanel;
