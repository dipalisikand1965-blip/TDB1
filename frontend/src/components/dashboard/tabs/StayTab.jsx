import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Home, Calendar, Star } from 'lucide-react';

const StayTab = ({ stayHistory }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Stay Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-green-500 to-teal-500 text-white">
          <Home className="w-5 h-5 mb-2" />
          <p className="text-2xl font-bold">{stayHistory.bookings?.length || 0}</p>
          <p className="text-sm opacity-90">Total Bookings</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
          <Calendar className="w-5 h-5 mb-2" />
          <p className="text-2xl font-bold">{stayHistory.upcoming?.length || 0}</p>
          <p className="text-sm opacity-90">Upcoming</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 text-white">
          <Star className="w-5 h-5 mb-2" />
          <p className="text-2xl font-bold">{stayHistory.past?.length || 0}</p>
          <p className="text-sm opacity-90">Completed</p>
        </Card>
      </div>

      {/* Stay Bookings */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Home className="w-5 h-5 text-green-500" />
            My Stay Bookings
          </h3>
          <Button variant="outline" size="sm" onClick={() => navigate('/stay')}>
            Book Stay
          </Button>
        </div>

        {stayHistory.upcoming?.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-500">Upcoming Stays</h4>
            {stayHistory.upcoming.map((booking) => (
              <div key={booking.id || booking.booking_id} className="p-4 bg-green-50 rounded-lg border border-green-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">{booking.property_name || booking.hotel_name}</h4>
                    <p className="text-sm text-gray-500">{booking.location || booking.city}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" /> {booking.check_in} - {booking.check_out}
                      </span>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700">{booking.status || 'Confirmed'}</Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Home className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No upcoming stays</p>
            <Button className="mt-4 bg-green-500 hover:bg-green-600" onClick={() => navigate('/stay')}>
              Explore Pet-Friendly Stays
            </Button>
          </div>
        )}

        {/* Past Stays */}
        {stayHistory.past?.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="text-sm font-medium text-gray-500 mb-3">Past Stays</h4>
            <div className="space-y-2">
              {stayHistory.past.slice(0, 3).map((booking) => (
                <div key={booking.id || booking.booking_id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-medium">{booking.property_name || booking.hotel_name}</p>
                    <p className="text-sm text-gray-500">{booking.check_in}</p>
                  </div>
                  <Badge variant="outline" className="text-gray-500">Completed</Badge>
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
