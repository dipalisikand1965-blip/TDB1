import React from 'react';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { 
  Clock, User, AlertCircle, CheckCircle, Loader2, 
  ChevronRight, Timer, MoreVertical, ArrowRight
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';

// Status columns for Kanban
const KANBAN_COLUMNS = [
  { id: 'new', label: 'New', color: 'bg-blue-500', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  { id: 'open', label: 'Open', color: 'bg-amber-500', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-purple-500', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
  { id: 'on_hold', label: 'On Hold', color: 'bg-orange-500', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
  { id: 'resolved', label: 'Resolved', color: 'bg-green-500', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
  { id: 'closed', label: 'Closed', color: 'bg-gray-500', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' },
];

// Category icons
const CATEGORY_ICONS = {
  celebrate: '🎂', dine: '🍽️', travel: '✈️', stay: '🏨', enjoy: '🎉',
  club: '👑', care: '💊', shop: '🛒', work: '💼', fit: '🏃',
  learn: '📚', paperwork: '📋', advisory: '💡', emergency: '🚨',
  farewell: '🌈', adopt: '🏠', mira: '🤖', membership: '💎'
};

// Priority colors
const PRIORITY_COLORS = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  normal: 'bg-blue-100 text-blue-700 border-blue-200',
  low: 'bg-gray-100 text-gray-700 border-gray-200',
};

// Calculate SLA time remaining
const getSLAStatus = (sla_due_at) => {
  if (!sla_due_at) return null;
  const due = new Date(sla_due_at);
  const now = new Date();
  const diff = due - now;
  
  if (diff < 0) {
    return { breached: true, text: 'SLA Breached', color: 'text-red-600 bg-red-50' };
  }
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours < 1) {
    return { breached: false, text: `${minutes}m left`, color: 'text-orange-600 bg-orange-50' };
  }
  if (hours < 4) {
    return { breached: false, text: `${hours}h ${minutes}m left`, color: 'text-amber-600 bg-amber-50' };
  }
  return { breached: false, text: `${hours}h left`, color: 'text-green-600 bg-green-50' };
};

// Ticket Card Component
const KanbanTicketCard = ({ ticket, onSelect, onStatusChange }) => {
  const slaStatus = getSLAStatus(ticket.sla_due_at);
  const createdAt = ticket.created_at ? new Date(ticket.created_at) : null;
  const timeAgo = createdAt ? getTimeAgo(createdAt) : '';
  
  return (
    <Card 
      className={`p-3 cursor-pointer hover:shadow-md transition-all border-l-4 ${
        ticket.urgency === 'critical' ? 'border-l-red-500' :
        ticket.urgency === 'high' ? 'border-l-orange-500' :
        'border-l-transparent'
      }`}
      onClick={() => onSelect(ticket.ticket_id)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{CATEGORY_ICONS[ticket.category] || '📋'}</span>
          <span className="text-xs font-mono text-gray-500">{ticket.ticket_id}</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => e.stopPropagation()}>
              <MoreVertical className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {KANBAN_COLUMNS.filter(c => c.id !== ticket.status).map(col => (
              <DropdownMenuItem 
                key={col.id} 
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(ticket.ticket_id, col.id);
                }}
              >
                <ArrowRight className="w-3 h-3 mr-2" /> Move to {col.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Subject */}
      <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">
        {ticket.subject || ticket.description?.slice(0, 50) || 'No subject'}
      </p>
      
      {/* Customer */}
      <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-2">
        <User className="w-3 h-3" />
        <span className="truncate">{ticket.member?.name || ticket.customer_name || 'Unknown'}</span>
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Priority Badge */}
          {ticket.urgency && ticket.urgency !== 'normal' && (
            <Badge className={`text-xs ${PRIORITY_COLORS[ticket.urgency]}`}>
              {ticket.urgency}
            </Badge>
          )}
          
          {/* SLA Timer */}
          {slaStatus && (
            <span className={`text-xs px-1.5 py-0.5 rounded flex items-center gap-1 ${slaStatus.color}`}>
              <Timer className="w-3 h-3" />
              {slaStatus.text}
            </span>
          )}
        </div>
        
        {/* Time */}
        <span className="text-xs text-gray-400">{timeAgo}</span>
      </div>
      
      {/* Assigned Agent */}
      {ticket.assigned_to && (
        <div className="mt-2 pt-2 border-t flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
            {ticket.assigned_to.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs text-gray-500">{ticket.assigned_to.split('@')[0]}</span>
        </div>
      )}
    </Card>
  );
};

// Helper function for time ago
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  const intervals = [
    { label: 'y', seconds: 31536000 },
    { label: 'mo', seconds: 2592000 },
    { label: 'd', seconds: 86400 },
    { label: 'h', seconds: 3600 },
    { label: 'm', seconds: 60 },
  ];
  
  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count > 0) {
      return `${count}${interval.label} ago`;
    }
  }
  return 'Just now';
}

// Main Kanban Board Component
const KanbanBoard = ({ tickets, onSelectTicket, onStatusChange, loading }) => {
  // Group tickets by status
  const ticketsByStatus = KANBAN_COLUMNS.reduce((acc, col) => {
    acc[col.id] = tickets.filter(t => t.status === col.id);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 px-2" style={{ minHeight: '500px' }}>
      {KANBAN_COLUMNS.map(column => (
        <div 
          key={column.id} 
          className={`flex-shrink-0 w-72 rounded-xl ${column.bgColor} ${column.borderColor} border`}
        >
          {/* Column Header */}
          <div className="p-3 border-b border-white/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${column.color}`} />
                <span className="font-semibold text-gray-700">{column.label}</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {ticketsByStatus[column.id]?.length || 0}
              </Badge>
            </div>
          </div>
          
          {/* Column Content */}
          <div className="p-2 space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
            {ticketsByStatus[column.id]?.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                No tickets
              </div>
            ) : (
              ticketsByStatus[column.id]?.map(ticket => (
                <KanbanTicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onSelect={onSelectTicket}
                  onStatusChange={onStatusChange}
                />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default KanbanBoard;
