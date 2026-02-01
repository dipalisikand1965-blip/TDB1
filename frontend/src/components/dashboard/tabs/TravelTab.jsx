import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Plane, Clock, Star, Calendar, PawPrint } from 'lucide-react';

const TravelTab = ({ travelHistory }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Travel Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
          <Plane className="w-5 h-5 mb-2" />
          <p className="text-2xl font-bold">{travelHistory.requests?.length || 0}</p>
          <p className="text-sm opacity-90">Total Requests</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-500 to-violet-500 text-white">
          <Clock className="w-5 h-5 mb-2" />
          <p className="text-2xl font-bold">{travelHistory.upcoming?.length || 0}</p>
          <p className="text-sm opacity-90">Upcoming</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-500 to-emerald-500 text-white">
          <Star className="w-5 h-5 mb-2" />
          <p className="text-2xl font-bold">{travelHistory.requests?.filter(r => r.status === 'completed').length || 0}</p>
          <p className="text-sm opacity-90">Completed</p>
        </Card>
      </div>

      {/* Travel Requests */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Plane className="w-5 h-5 text-blue-500" />
            My Travel Requests
          </h3>
          <Button variant="outline" size="sm" onClick={() => navigate('/travel')}>
            New Request
          </Button>
        </div>

        {travelHistory.requests?.length > 0 ? (
          <div className="space-y-3">
            {travelHistory.requests.slice(0, 5).map((request) => (
              <div key={request.request_id} className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900">{request.request_id}</h4>
                      <Badge variant="outline" className="text-xs">{request.travel_type_name}</Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {request.journey?.pickup_city} → {request.journey?.drop_city}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" /> {request.journey?.travel_date}
                      </span>
                      <span className="flex items-center gap-1">
                        <PawPrint className="w-4 h-4" /> {request.pet?.name}
                      </span>
                    </div>
                  </div>
                  <Badge className={
                    request.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                    request.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                    request.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }>
                    {request.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Plane className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No travel requests yet</p>
            <p className="text-sm text-gray-400 mt-1">Plan your pet&apos;s next adventure!</p>
            <Button className="mt-4 bg-blue-500 hover:bg-blue-600" onClick={() => navigate('/travel')}>
              Plan Travel
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default TravelTab;
