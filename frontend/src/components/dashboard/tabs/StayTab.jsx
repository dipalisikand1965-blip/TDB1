import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Home, Calendar, Star, Sparkles, MapPin } from 'lucide-react';

const StayTab = ({ stayHistory }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in-50 duration-300" data-testid="stay-tab">
      {/* Stay Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-green-500 to-teal-500 text-white rounded-xl">
          <Home className="w-4 h-4 sm:w-5 sm:h-5 mb-1 sm:mb-2" />
          <p className="text-xl sm:text-2xl font-bold">{stayHistory.bookings?.length || 0}</p>
          <p className="text-[10px] sm:text-sm opacity-90">Total Bookings</p>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-xl">
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mb-1 sm:mb-2" />
          <p className="text-xl sm:text-2xl font-bold">{stayHistory.upcoming?.length || 0}</p>
          <p className="text-[10px] sm:text-sm opacity-90">Upcoming</p>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl">
          <Star className="w-4 h-4 sm:w-5 sm:h-5 mb-1 sm:mb-2" />
          <p className="text-xl sm:text-2xl font-bold">{stayHistory.past?.length || 0}</p>
          <p className="text-[10px] sm:text-sm opacity-90">Completed</p>
        </Card>
      </div>

      {/* Stay Bookings */}
      <Card className="p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-base sm:text-lg font-bold flex items-center gap-2 text-white">
            <Home className="w-5 h-5 text-emerald-400" />
            My Stay Bookings
          </h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/stay')}
            className="bg-slate-800/50 border-white/10 text-white hover:bg-slate-700/50"
          >
            <Sparkles className="w-4 h-4 mr-1.5" />
            Book Stay
          </Button>
        </div>

        {stayHistory.upcoming?.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-xs sm:text-sm font-medium text-slate-400">Upcoming Stays</h4>
            {stayHistory.upcoming.map((booking) => (
              <div key={booking.id || booking.booking_id} className="p-3 sm:p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-white text-sm sm:text-base truncate">{booking.facility_name || 'Pet Stay'}</h4>
                    <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {booking.city || 'Location TBD'}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="flex items-center gap-1 text-xs sm:text-sm text-slate-300">
                        <Calendar className="w-3.5 h-3.5" /> {booking.check_in} - {booking.check_out}
                      </span>
                    </div>
                  </div>
                  <Badge className={`flex-shrink-0 border ${booking.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
                    {booking.status || 'Pending'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12">
            <div className="w-14 h-14 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Home className="w-7 h-7 text-slate-500" />
            </div>
            <p className="text-white font-medium mb-2">No upcoming stays</p>
            <p className="text-sm text-slate-400 mb-4">Find the perfect boarding or daycare for your pet</p>
            <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400" onClick={() => navigate('/stay')}>
              Explore Stay Options
            </Button>
          </div>
        )}

        {/* Past Stays */}
        {stayHistory.past?.length > 0 && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <h4 className="text-xs sm:text-sm font-medium text-slate-400 mb-3">Past Stays</h4>
            <div className="space-y-2">
              {stayHistory.past.slice(0, 3).map((booking) => (
                <div key={booking.id} className="p-3 bg-slate-800/30 rounded-lg flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-white text-sm truncate">{booking.facility_name || 'Pet Stay'}</p>
                    <p className="text-xs text-slate-500">{booking.check_in}</p>
                  </div>
                  <Badge variant="outline" className="text-slate-400 border-slate-600 text-xs">{booking.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default StayTab;
