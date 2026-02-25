import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Plane, Calendar, MapPin, Sparkles, Globe } from 'lucide-react';

const TravelTab = ({ travelHistory }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in-50 duration-300" data-testid="travel-tab">
      {/* Travel Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-xl">
          <Plane className="w-4 h-4 sm:w-5 sm:h-5 mb-1 sm:mb-2" />
          <p className="text-xl sm:text-2xl font-bold">{travelHistory.trips?.length || 0}</p>
          <p className="text-[10px] sm:text-sm opacity-90">Total Trips</p>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl">
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mb-1 sm:mb-2" />
          <p className="text-xl sm:text-2xl font-bold">{travelHistory.upcoming?.length || 0}</p>
          <p className="text-[10px] sm:text-sm opacity-90">Upcoming</p>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-xl">
          <Globe className="w-4 h-4 sm:w-5 sm:h-5 mb-1 sm:mb-2" />
          <p className="text-xl sm:text-2xl font-bold">{travelHistory.destinations?.length || 0}</p>
          <p className="text-[10px] sm:text-sm opacity-90">Destinations</p>
        </Card>
      </div>

      {/* Travel Bookings */}
      <Card className="p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-base sm:text-lg font-bold flex items-center gap-2 text-white">
            <Plane className="w-5 h-5 text-blue-400" />
            My Travel Plans
          </h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/travel')}
            className="bg-slate-800/50 border-white/10 text-white hover:bg-slate-700/50"
          >
            <Sparkles className="w-4 h-4 mr-1.5" />
            Plan Trip
          </Button>
        </div>

        {travelHistory.upcoming?.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-xs sm:text-sm font-medium text-slate-400">Upcoming Trips</h4>
            {travelHistory.upcoming.map((trip) => (
              <div key={trip.id} className="p-3 sm:p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-white text-sm sm:text-base truncate">{trip.destination || 'Travel Plan'}</h4>
                    <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {trip.origin || 'Your City'} → {trip.destination || 'Destination'}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="flex items-center gap-1 text-xs sm:text-sm text-slate-300">
                        <Calendar className="w-3.5 h-3.5" /> {trip.travel_date || 'Date TBD'}
                      </span>
                      {trip.pets?.length > 0 && (
                        <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
                          {trip.pets.length} pet{trip.pets.length > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Badge className={`flex-shrink-0 border ${trip.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
                    {trip.status || 'Planning'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12">
            <div className="w-14 h-14 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plane className="w-7 h-7 text-slate-500" />
            </div>
            <p className="text-white font-medium mb-2">No upcoming trips</p>
            <p className="text-sm text-slate-400 mb-4 max-w-xs mx-auto">Plan your next adventure with your furry companion!</p>
            <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400" onClick={() => navigate('/travel')}>
              Start Planning
            </Button>
          </div>
        )}

        {/* Past Trips */}
        {travelHistory.past?.length > 0 && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <h4 className="text-xs sm:text-sm font-medium text-slate-400 mb-3">Past Trips</h4>
            <div className="space-y-2">
              {travelHistory.past.slice(0, 3).map((trip) => (
                <div key={trip.id} className="p-3 bg-slate-800/30 rounded-lg flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-white text-sm truncate">{trip.destination}</p>
                    <p className="text-xs text-slate-500">{trip.travel_date}</p>
                  </div>
                  <Badge variant="outline" className="text-slate-400 border-slate-600 text-xs">{trip.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Travel Tips */}
      <Card className="p-4 sm:p-6 bg-gradient-to-r from-blue-900/40 via-cyan-900/40 to-blue-900/40 border border-blue-500/20 rounded-2xl">
        <h3 className="text-base sm:text-lg font-bold flex items-center gap-2 mb-4 text-white">
          <Globe className="w-5 h-5 text-cyan-400" />
          Pet Travel Tips
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { tip: 'Book pet-friendly accommodations in advance', icon: '🏨' },
            { tip: 'Carry health certificates & vaccination records', icon: '📋' },
            { tip: 'Pack familiar items for comfort', icon: '🧳' },
            { tip: 'Research airline pet policies', icon: '✈️' },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl">
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              <p className="text-xs sm:text-sm text-slate-300">{item.tip}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default TravelTab;
