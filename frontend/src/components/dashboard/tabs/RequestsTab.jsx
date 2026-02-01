import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Calendar, RefreshCw, Loader2, MessageCircle, Sparkles, PawPrint } from 'lucide-react';

const RequestsTab = ({ 
  myRequests, 
  requestsLoading, 
  onRefresh 
}) => {
  const navigate = useNavigate();

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-600" />
          My Bookings & Requests
        </h3>
        <Button 
          variant="outline" 
          size="sm"
          onClick={onRefresh}
          disabled={requestsLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-1 ${requestsLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      {requestsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : myRequests.length > 0 ? (
        <div className="space-y-4">
          {myRequests.map((request) => (
            <div 
              key={request.id} 
              className="border rounded-xl p-4 hover:shadow-md transition-shadow bg-white"
            >
              <div className="flex flex-wrap justify-between items-start gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        request.status_display?.color === 'green' ? 'bg-green-50 text-green-700 border-green-200' :
                        request.status_display?.color === 'yellow' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        request.status_display?.color === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        request.status_display?.color === 'red' ? 'bg-red-50 text-red-700 border-red-200' :
                        request.status_display?.color === 'orange' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                        'bg-gray-50 text-gray-700 border-gray-200'
                      }`}
                    >
                      {request.status_display?.icon} {request.status_display?.label || request.status}
                    </Badge>
                    <span className="text-xs text-gray-500 font-mono">#{request.id}</span>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">{request.description}</p>
                  {(request.pet_name || request.pet_names?.length > 0) && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                      <PawPrint className="w-3 h-3" />
                      {request.pet_name || request.pet_names?.join(', ')}
                    </div>
                  )}
                </div>
                <div className="text-right text-sm">
                  <p className="text-gray-500">{request.pillar}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(request.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No active requests</p>
          <p className="text-sm text-gray-400">
            Chat with Mira to create booking requests, grooming appointments, and more!
          </p>
          <Button 
            className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600"
            onClick={() => navigate('/care')}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Talk to Mira
          </Button>
        </div>
      )}
    </Card>
  );
};

export default RequestsTab;
