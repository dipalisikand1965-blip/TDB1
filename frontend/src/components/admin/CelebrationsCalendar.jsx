import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import {
  Calendar, Gift, Cake, Home, PartyPopper, ChevronLeft, ChevronRight,
  Phone, Mail, MessageCircle, Search, Filter, Loader2, RefreshCw
} from 'lucide-react';
import axios from 'axios';
import { toast } from '../../hooks/use-toast';
import { API_URL } from '../../utils/api';

const CelebrationsCalendar = () => {
  const [events, setEvents] = useState([]);
  const [calendarView, setCalendarView] = useState({});
  const [loading, setLoading] = useState(true);
  const [daysAhead, setDaysAhead] = useState(90);
  const [includeFestivals, setIncludeFestivals] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchCalendar = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/admin/pet-soul/celebrations-calendar`, {
        params: { days_ahead: daysAhead, include_festivals: includeFestivals }
      });
      setEvents(res.data.upcoming_events || []);
      setCalendarView(res.data.calendar_view || {});
    } catch (error) {
      console.error('Failed to fetch celebrations:', error);
      toast({ title: 'Error', description: 'Failed to load celebrations calendar', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, [daysAhead, includeFestivals]);

  const getEventIcon = (type) => {
    switch (type) {
      case 'birthday': return <Cake className="w-4 h-4 text-pink-500" />;
      case 'gotcha_day': return <Home className="w-4 h-4 text-blue-500" />;
      case 'festival': return <PartyPopper className="w-4 h-4 text-orange-500" />;
      default: return <Gift className="w-4 h-4 text-purple-500" />;
    }
  };

  const getEventBadgeColor = (type) => {
    switch (type) {
      case 'birthday': return 'bg-pink-100 text-pink-700 border-pink-200';
      case 'gotcha_day': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'festival': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-purple-100 text-purple-700 border-purple-200';
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const filteredEvents = events.filter(event => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      event.pet_name?.toLowerCase().includes(query) ||
      event.breed?.toLowerCase().includes(query) ||
      event.owner?.name?.toLowerCase().includes(query) ||
      event.festival?.toLowerCase().includes(query)
    );
  });

  // Group events by time period
  const groupedEvents = {
    thisWeek: filteredEvents.filter(e => e.days_until <= 7),
    thisMonth: filteredEvents.filter(e => e.days_until > 7 && e.days_until <= 30),
    upcoming: filteredEvents.filter(e => e.days_until > 30)
  };

  const handleContactAction = (event, type) => {
    if (type === 'whatsapp' && event.owner?.phone) {
      const message = encodeURIComponent(`Hi! 🎉 ${event.suggestion}`);
      window.open(`https://wa.me/${event.owner.phone.replace(/\D/g, '')}?text=${message}`, '_blank');
    } else if (type === 'email' && event.owner?.email) {
      const subject = encodeURIComponent(`Special day coming up for ${event.pet_name}!`);
      const body = encodeURIComponent(`Hi ${event.owner?.name || 'there'},\n\n${event.suggestion}\n\nWould you like to make it special with a celebration cake or treats?\n\nWarm regards,\nThe Doggy Company`);
      window.open(`mailto:${event.owner.email}?subject=${subject}&body=${body}`, '_blank');
    }
    toast({ title: 'Opening...', description: `Opening ${type} for ${event.pet_name}` });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-purple-600" />
            Pet Celebrations Calendar
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Upcoming birthdays, gotcha days, and festival celebrations
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIncludeFestivals(!includeFestivals)}
            className={includeFestivals ? 'bg-orange-50 border-orange-200' : ''}
          >
            <PartyPopper className="w-4 h-4 mr-1" />
            Festivals {includeFestivals ? 'On' : 'Off'}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchCalendar}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by pet name, breed, or owner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={daysAhead}
          onChange={(e) => setDaysAhead(Number(e.target.value))}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value={30}>Next 30 days</option>
          <option value={60}>Next 60 days</option>
          <option value={90}>Next 90 days</option>
          <option value={180}>Next 6 months</option>
          <option value={365}>Full year</option>
        </select>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-pink-50 to-white border-pink-100">
          <div className="flex items-center gap-2 mb-1">
            <Cake className="w-5 h-5 text-pink-500" />
            <span className="text-sm font-medium text-gray-600">Birthdays</span>
          </div>
          <p className="text-2xl font-bold text-pink-700">
            {events.filter(e => e.type === 'birthday').length}
          </p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <div className="flex items-center gap-2 mb-1">
            <Home className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium text-gray-600">Gotcha Days</span>
          </div>
          <p className="text-2xl font-bold text-blue-700">
            {events.filter(e => e.type === 'gotcha_day').length}
          </p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-orange-50 to-white border-orange-100">
          <div className="flex items-center gap-2 mb-1">
            <PartyPopper className="w-5 h-5 text-orange-500" />
            <span className="text-sm font-medium text-gray-600">Festivals</span>
          </div>
          <p className="text-2xl font-bold text-orange-700">
            {events.filter(e => e.type === 'festival').length}
          </p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-white border-purple-100">
          <div className="flex items-center gap-2 mb-1">
            <Gift className="w-5 h-5 text-purple-500" />
            <span className="text-sm font-medium text-gray-600">This Week</span>
          </div>
          <p className="text-2xl font-bold text-purple-700">
            {groupedEvents.thisWeek.length}
          </p>
        </Card>
      </div>

      {/* This Week - Urgent */}
      {groupedEvents.thisWeek.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            This Week ({groupedEvents.thisWeek.length})
          </h3>
          <div className="grid gap-3">
            {groupedEvents.thisWeek.map((event, idx) => (
              <EventCard key={idx} event={event} onContact={handleContactAction} getIcon={getEventIcon} getBadgeColor={getEventBadgeColor} formatDate={formatDate} urgent />
            ))}
          </div>
        </div>
      )}

      {/* This Month */}
      {groupedEvents.thisMonth.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            This Month ({groupedEvents.thisMonth.length})
          </h3>
          <div className="grid gap-3">
            {groupedEvents.thisMonth.map((event, idx) => (
              <EventCard key={idx} event={event} onContact={handleContactAction} getIcon={getEventIcon} getBadgeColor={getEventBadgeColor} formatDate={formatDate} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming */}
      {groupedEvents.upcoming.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Coming Up ({groupedEvents.upcoming.length})
          </h3>
          <div className="grid gap-3">
            {groupedEvents.upcoming.slice(0, 20).map((event, idx) => (
              <EventCard key={idx} event={event} onContact={handleContactAction} getIcon={getEventIcon} getBadgeColor={getEventBadgeColor} formatDate={formatDate} />
            ))}
            {groupedEvents.upcoming.length > 20 && (
              <p className="text-sm text-gray-500 text-center py-2">
                +{groupedEvents.upcoming.length - 20} more events
              </p>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredEvents.length === 0 && (
        <Card className="p-12 text-center border-dashed">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-medium text-gray-900">No celebrations found</h3>
          <p className="text-sm text-gray-500 mt-1">
            {searchQuery ? 'Try a different search term' : 'No upcoming celebrations in this time period'}
          </p>
        </Card>
      )}
    </div>
  );
};

// Event Card Component
const EventCard = ({ event, onContact, getIcon, getBadgeColor, formatDate, urgent }) => {
  return (
    <Card className={`p-4 hover:shadow-md transition-shadow ${urgent ? 'border-red-200 bg-red-50/30' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            event.type === 'birthday' ? 'bg-pink-100' :
            event.type === 'gotcha_day' ? 'bg-blue-100' :
            'bg-orange-100'
          }`}>
            <span className="text-lg">{event.icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-gray-900">{event.pet_name}</h4>
              {event.breed && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  {event.breed}
                </span>
              )}
              <Badge className={`text-xs ${getBadgeColor(event.type)}`}>
                {event.type === 'birthday' ? `🎂 Birthday${event.age ? ` - Turning ${event.age}` : ''}` :
                 event.type === 'gotcha_day' ? `🏠 Gotcha Day${event.years ? ` - ${event.years}yr` : ''}` :
                 `🎉 ${event.festival}`}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mt-1">{event.suggestion}</p>
            {event.owner?.name && (
              <p className="text-xs text-gray-400 mt-1">Owner: {event.owner.name}</p>
            )}
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className="text-right">
            <p className="font-medium text-gray-900">{formatDate(event.date)}</p>
            <p className={`text-xs ${event.days_until <= 7 ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
              {event.days_until === 0 ? 'Today!' :
               event.days_until === 1 ? 'Tomorrow!' :
               `In ${event.days_until} days`}
            </p>
          </div>
          
          <div className="flex gap-1">
            {event.owner?.phone && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
                onClick={() => onContact(event, 'whatsapp')}
              >
                <MessageCircle className="w-4 h-4" />
              </Button>
            )}
            {event.owner?.email && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                onClick={() => onContact(event, 'email')}
              >
                <Mail className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CelebrationsCalendar;
