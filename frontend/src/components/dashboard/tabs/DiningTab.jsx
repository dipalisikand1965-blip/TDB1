import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { UtensilsCrossed, Users, Calendar, Clock, Bell, MessageSquare } from 'lucide-react';

const DiningTab = ({ diningHistory }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Dining Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-orange-500 to-red-500 text-white">
          <UtensilsCrossed className="w-5 h-5 mb-2" />
          <p className="text-2xl font-bold">{diningHistory.reservations?.items?.length || 0}</p>
          <p className="text-sm opacity-90">Reservations</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 text-white">
          <Users className="w-5 h-5 mb-2" />
          <p className="text-2xl font-bold">{diningHistory.visits?.items?.length || 0}</p>
          <p className="text-sm opacity-90">Pet Buddy Visits</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
          <MessageSquare className="w-5 h-5 mb-2" />
          <p className="text-2xl font-bold">{diningHistory.meetups?.items?.length || 0}</p>
          <p className="text-sm opacity-90">Meetup Requests</p>
        </Card>
      </div>

      {/* Upcoming Reservations */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-orange-500" />
            My Reservations
          </h3>
          <Button variant="outline" size="sm" onClick={() => navigate('/dine')}>
            Book New
          </Button>
        </div>
        
        {diningHistory.reservations?.upcoming?.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-500">Upcoming</h4>
            {diningHistory.reservations.upcoming.map((res) => (
              <div key={res.id} className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">{res.restaurant_name}</h4>
                    <p className="text-sm text-gray-500">{res.restaurant_area}, {res.restaurant_city}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" /> {res.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" /> {res.time}
                      </span>
                    </div>
                  </div>
                  <Badge className={res.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                    {res.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <UtensilsCrossed className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No upcoming reservations</p>
            <Button className="mt-4 bg-orange-500 hover:bg-orange-600" onClick={() => navigate('/dine')}>
              Explore Restaurants
            </Button>
          </div>
        )}

        {/* Past Reservations */}
        {diningHistory.reservations?.past?.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="text-sm font-medium text-gray-500 mb-3">Past Reservations</h4>
            <div className="space-y-2">
              {diningHistory.reservations.past.slice(0, 5).map((res) => (
                <div key={res.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-medium">{res.restaurant_name}</p>
                    <p className="text-sm text-gray-500">{res.date}</p>
                  </div>
                  <Badge variant="outline" className="text-gray-500">{res.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Pet Buddy Visits */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-500" />
            Pet Buddy Visits
          </h3>
        </div>
        
        {diningHistory.visits?.upcoming?.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-500">Scheduled</h4>
            {diningHistory.visits.upcoming.map((visit) => (
              <div key={visit.id} className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">{visit.restaurant_name}</h4>
                    <p className="text-sm text-gray-500">{visit.restaurant_area}, {visit.restaurant_city}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" /> {visit.date}
                      </span>
                      <Badge variant="outline" className="capitalize">{visit.time_slot}</Badge>
                    </div>
                    {visit.notes && <p className="text-sm text-purple-600 mt-2">&quot;{visit.notes}&quot;</p>}
                  </div>
                  {visit.looking_for_buddies && (
                    <Badge className="bg-purple-100 text-purple-700">Looking for Buddies</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No scheduled visits</p>
            <p className="text-sm text-gray-400 mt-1">Schedule a visit and meet other pet parents!</p>
          </div>
        )}
      </Card>

      {/* Meetup Requests */}
      {diningHistory.meetups?.pending?.length > 0 && (
        <Card className="p-6 border-purple-200 bg-purple-50">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-purple-500" />
            Pending Meetup Requests
          </h3>
          <div className="space-y-3">
            {diningHistory.meetups.pending.map((meetup) => (
              <div key={meetup.id} className="p-4 bg-white rounded-lg border">
                <p className="font-medium">Meetup at {meetup.restaurant_name}</p>
                <p className="text-sm text-gray-500">{meetup.visit_date}</p>
                {meetup.message && <p className="text-sm text-gray-600 mt-2">&quot;{meetup.message}&quot;</p>}
                <div className="flex gap-2 mt-3">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">Accept</Button>
                  <Button size="sm" variant="outline" className="text-red-600">Decline</Button>
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
