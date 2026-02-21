import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { UtensilsCrossed, Users, Calendar, Clock, Bell, MessageSquare, Sparkles } from 'lucide-react';

const DiningTab = ({ diningHistory }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in-50 duration-300" data-testid="dining-tab">
      {/* Dining Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-xl">
          <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5 mb-1 sm:mb-2" />
          <p className="text-xl sm:text-2xl font-bold">{diningHistory.reservations?.items?.length || 0}</p>
          <p className="text-[10px] sm:text-sm opacity-90">Reservations</p>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl">
          <Users className="w-4 h-4 sm:w-5 sm:h-5 mb-1 sm:mb-2" />
          <p className="text-xl sm:text-2xl font-bold">{diningHistory.visits?.items?.length || 0}</p>
          <p className="text-[10px] sm:text-sm opacity-90">Buddy Visits</p>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-xl">
          <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 mb-1 sm:mb-2" />
          <p className="text-xl sm:text-2xl font-bold">{diningHistory.meetups?.items?.length || 0}</p>
          <p className="text-[10px] sm:text-sm opacity-90">Meetups</p>
        </Card>
      </div>

      {/* Upcoming Reservations */}
      <Card className="p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-base sm:text-lg font-bold flex items-center gap-2 text-white">
            <UtensilsCrossed className="w-5 h-5 text-orange-400" />
            My Reservations
          </h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/dine')}
            className="bg-slate-800/50 border-white/10 text-white hover:bg-slate-700/50"
          >
            <Sparkles className="w-4 h-4 mr-1.5" />
            Book New
          </Button>
        </div>
        
        {diningHistory.reservations?.upcoming?.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-xs sm:text-sm font-medium text-slate-400">Upcoming</h4>
            {diningHistory.reservations.upcoming.map((res) => (
              <div key={res.id} className="p-3 sm:p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-white text-sm sm:text-base truncate">{res.restaurant_name}</h4>
                    <p className="text-xs sm:text-sm text-slate-400">{res.restaurant_area}, {res.restaurant_city}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs sm:text-sm text-slate-300">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> {res.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {res.time}
                      </span>
                    </div>
                  </div>
                  <Badge className={`flex-shrink-0 border ${res.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
                    {res.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12">
            <div className="w-14 h-14 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <UtensilsCrossed className="w-7 h-7 text-slate-500" />
            </div>
            <p className="text-white font-medium mb-2">No upcoming reservations</p>
            <Button className="mt-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400" onClick={() => navigate('/dine')}>
              Explore Restaurants
            </Button>
          </div>
        )}

        {/* Past Reservations */}
        {diningHistory.reservations?.past?.length > 0 && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <h4 className="text-xs sm:text-sm font-medium text-slate-400 mb-3">Past Reservations</h4>
            <div className="space-y-2">
              {diningHistory.reservations.past.slice(0, 3).map((res) => (
                <div key={res.id} className="p-3 bg-slate-800/30 rounded-lg flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-white text-sm truncate">{res.restaurant_name}</p>
                    <p className="text-xs text-slate-500">{res.date}</p>
                  </div>
                  <Badge variant="outline" className="text-slate-400 border-slate-600 text-xs">{res.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Pet Buddy Visits */}
      <Card className="p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl">
        <h3 className="text-base sm:text-lg font-bold flex items-center gap-2 mb-4 text-white">
          <Users className="w-5 h-5 text-purple-400" />
          Pet Buddy Visits
        </h3>
        
        {diningHistory.visits?.upcoming?.length > 0 ? (
          <div className="space-y-3">
            {diningHistory.visits.upcoming.map((visit) => (
              <div key={visit.id} className="p-3 sm:p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-white text-sm sm:text-base truncate">{visit.restaurant_name}</h4>
                    <p className="text-xs sm:text-sm text-slate-400">{visit.restaurant_area}, {visit.restaurant_city}</p>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
                      <span className="flex items-center gap-1 text-xs sm:text-sm text-slate-300">
                        <Calendar className="w-3.5 h-3.5" /> {visit.date}
                      </span>
                      <Badge variant="outline" className="capitalize text-xs border-slate-600 text-slate-300">{visit.time_slot}</Badge>
                    </div>
                    {visit.notes && <p className="text-xs sm:text-sm text-purple-400 mt-2">&quot;{visit.notes}&quot;</p>}
                  </div>
                  {visit.looking_for_buddies && (
                    <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30 flex-shrink-0">Looking for Buddies</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-14 h-14 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7 text-slate-500" />
            </div>
            <p className="text-white font-medium mb-1">No scheduled visits</p>
            <p className="text-xs sm:text-sm text-slate-400">Schedule a visit and meet other pet parents!</p>
          </div>
        )}
      </Card>

      {/* Meetup Requests */}
      {diningHistory.meetups?.pending?.length > 0 && (
        <Card className="p-4 sm:p-6 bg-purple-500/10 border border-purple-500/20 rounded-2xl">
          <h3 className="text-base sm:text-lg font-bold flex items-center gap-2 mb-4 text-white">
            <Bell className="w-5 h-5 text-purple-400" />
            Pending Meetup Requests
          </h3>
          <div className="space-y-3">
            {diningHistory.meetups.pending.map((meetup) => (
              <div key={meetup.id} className="p-3 sm:p-4 bg-slate-900/60 rounded-xl border border-white/10">
                <p className="font-medium text-white text-sm sm:text-base">Meetup at {meetup.restaurant_name}</p>
                <p className="text-xs sm:text-sm text-slate-400">{meetup.visit_date}</p>
                {meetup.message && <p className="text-xs sm:text-sm text-slate-300 mt-2">&quot;{meetup.message}&quot;</p>}
                <div className="flex gap-2 mt-3">
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-xs sm:text-sm">Accept</Button>
                  <Button size="sm" variant="outline" className="text-red-400 border-red-500/30 hover:bg-red-500/10 text-xs sm:text-sm">Decline</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default DiningTab;
