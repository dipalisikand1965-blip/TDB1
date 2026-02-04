import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Calendar, RefreshCw, Loader2, MessageCircle, Sparkles, PawPrint, Clock } from 'lucide-react';

const RequestsTab = ({ 
  myRequests, 
  requestsLoading, 
  onRefresh 
}) => {
  const navigate = useNavigate();

  // Get status color classes for dark theme
  const getStatusColors = (color) => {
    switch (color) {
      case 'green': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'yellow': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'blue': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'red': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'orange': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="animate-in fade-in-50 duration-300" data-testid="requests-tab">
      <Card className="p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-white">
            <Calendar className="w-5 h-5 text-purple-400" />
            My Bookings & Requests
          </h3>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onRefresh}
            disabled={requestsLoading}
            className="bg-slate-800/50 border-white/10 text-white hover:bg-slate-700/50 hover:border-purple-500/30"
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${requestsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        {requestsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          </div>
        ) : myRequests.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {myRequests.map((request) => (
              <div 
                key={request.id} 
                className="bg-slate-800/50 border border-white/5 rounded-xl p-3 sm:p-4 hover:border-purple-500/30 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs border ${getStatusColors(request.status_display?.color)}`}
                      >
                        {request.status_display?.icon} {request.status_display?.label || request.status}
                      </Badge>
                      <span className="text-xs text-slate-500 font-mono">#{request.id}</span>
                    </div>
                    <p className="text-sm text-slate-300 line-clamp-2">{request.description}</p>
                    {(request.pet_name || request.pet_names?.length > 0) && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
                        <PawPrint className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{request.pet_name || request.pet_names?.join(', ')}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1 text-sm sm:text-right">
                    <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-500/20 text-xs">
                      {request.pillar}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      {new Date(request.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-white font-medium mb-2">No active requests</p>
            <p className="text-sm text-slate-400 max-w-xs mx-auto">
              Chat with Mira to create booking requests, grooming appointments, and more!
            </p>
            <Button 
              className="mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
              onClick={() => navigate('/care')}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Talk to Mira
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default RequestsTab;
