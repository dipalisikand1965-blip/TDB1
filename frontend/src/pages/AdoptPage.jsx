import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { toast } from '../hooks/use-toast';
import ServiceCatalogSection from '../components/ServiceCatalogSection';
import PillarPageLayout from '../components/PillarPageLayout';
import {
  Heart, PawPrint, Home, Calendar, MapPin, Phone, Mail, Users,
  ChevronRight, Sparkles, Search, Filter, Clock, CheckCircle,
  Building2, Gift, Star, ArrowRight, X, Send, Info, Loader2
} from 'lucide-react';

// Adopt Categories Configuration
const ADOPT_CATEGORIES = {
  rescue: {
    id: 'rescue',
    name: 'Rescue Adoption',
    icon: Home,
    description: 'Adopt from verified rescue organizations',
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-600'
  },
  shelter: {
    id: 'shelter',
    name: 'Shelter Adoption',
    icon: Building2,
    description: 'Adopt from local animal shelters',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600'
  },
  foster: {
    id: 'foster',
    name: 'Foster Program',
    icon: Heart,
    description: 'Temporarily foster a pet in need',
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-600'
  },
  events: {
    id: 'events',
    name: 'Adoption Events',
    icon: Calendar,
    description: 'Meet adoptable pets at local events',
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-600'
  }
};

// Hero images for adopt page
const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=1200&q=80',
  'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&q=80',
  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1200&q=80'
];

// Adoptable Pet Card Component
const AdoptablePetCard = ({ pet, onApply }) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer">
      <div className="relative h-48 overflow-hidden">
        <img
          src={pet.photos?.[0] || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80'}
          alt={pet.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-2 right-2">
          <Badge className={`${pet.status === 'available' ? 'bg-green-500' : 'bg-amber-500'} text-white`}>
            {pet.status === 'available' ? 'Available' : 'Pending'}
          </Badge>
        </div>
        {pet.special_needs && (
          <div className="absolute bottom-2 left-2">
            <Badge variant="outline" className="bg-white/90 text-purple-600">
              <Heart className="w-3 h-3 mr-1" /> Special Needs
            </Badge>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg text-gray-900">{pet.name}</h3>
          {pet.gender && (
            <span className={`text-sm ${pet.gender === 'male' ? 'text-blue-500' : 'text-pink-500'}`}>
              {pet.gender === 'male' ? '♂' : '♀'} {pet.gender}
            </span>
          )}
        </div>
        
        <p className="text-sm text-gray-600 mb-2">{pet.breed || 'Mixed breed'}</p>
        
        <div className="flex flex-wrap gap-2 mb-3">
          {pet.age && (
            <Badge variant="outline" className="text-xs">
              <Clock className="w-3 h-3 mr-1" /> {pet.age}
            </Badge>
          )}
          {pet.size && (
            <Badge variant="outline" className="text-xs">
              {pet.size}
            </Badge>
          )}
        </div>
        
        {pet.temperament?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {pet.temperament.slice(0, 3).map((trait, idx) => (
              <span key={idx} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                {trait}
              </span>
            ))}
          </div>
        )}
        
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center text-sm text-gray-500">
            <MapPin className="w-4 h-4 mr-1" />
            {pet.location || pet.shelter_name || 'Local'}
          </div>
          <Button
            size="sm"
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
            onClick={() => onApply(pet)}
          >
            Adopt Me <Heart className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

// Event Card Component
const EventCard = ({ event, onRegister }) => {
  const eventDate = new Date(event.date);
  
  return (
    <Card className="p-4 hover:shadow-md transition-all">
      <div className="flex gap-4">
        <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex flex-col items-center justify-center text-white">
          <span className="text-xs font-medium">{eventDate.toLocaleString('default', { month: 'short' })}</span>
          <span className="text-xl font-bold">{eventDate.getDate()}</span>
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{event.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{event.description}</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span className="flex items-center">
              <MapPin className="w-4 h-4 mr-1" /> {event.location}
            </span>
            {event.time && (
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" /> {event.time}
              </span>
            )}
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onRegister(event)}
          className="self-center"
        >
          Register
        </Button>
      </div>
    </Card>
  );
};

// Main Adopt Page Component
const AdoptPage = () => {
  const { user, token } = useAuth();
  
  // State
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [pets, setPets] = useState([]);
  const [events, setEvents] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  
  // Filter state
  const [filters, setFilters] = useState({
    species: 'all',
    breed: '',
    age: 'all',
    size: 'all',
    gender: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showFosterModal, setShowFosterModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Application form state
  const [applicationForm, setApplicationForm] = useState({
    applicant_name: '',
    applicant_email: '',
    applicant_phone: '',
    home_type: '',
    has_yard: null,
    other_pets: '',
    children_ages: '',
    experience: '',
    reason: '',
    availability: ''
  });
  
  // Foster form state
  const [fosterForm, setFosterForm] = useState({
    applicant_name: '',
    applicant_email: '',
    applicant_phone: '',
    home_type: '',
    experience: '',
    availability: '',
    foster_duration: '',
    notes: ''
  });

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    setLoading(true);
    try {
      const [petsRes, eventsRes, statsRes, sheltersRes] = await Promise.all([
        fetch(`${API_URL}/api/adopt/pets?status=available&limit=12`),
        fetch(`${API_URL}/api/adopt/events?upcoming=true&limit=5`),
        fetch(`${API_URL}/api/adopt/stats`),
        fetch(`${API_URL}/api/adopt/shelters?limit=10`)
      ]);
      
      if (petsRes.ok) {
        const data = await petsRes.json();
        setPets(data.pets || []);
      }
      
      if (eventsRes.ok) {
        const data = await eventsRes.json();
        setEvents(data.events || []);
      }
      
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
      
      if (sheltersRes.ok) {
        const data = await sheltersRes.json();
        setShelters(data.shelters || []);
      }
    } catch (error) {
      console.error('Error fetching adopt data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Filter pets
  const fetchFilteredPets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('status', 'available');
      params.append('limit', '50');
      
      if (filters.species && filters.species !== 'all') params.append('species', filters.species);
      if (filters.breed) params.append('breed', filters.breed);
      if (filters.age && filters.age !== 'all') params.append('age', filters.age);
      if (filters.size && filters.size !== 'all') params.append('size', filters.size);
      if (filters.gender) params.append('gender', filters.gender);
      
      const res = await fetch(`${API_URL}/api/adopt/pets?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPets(data.pets || []);
      }
    } catch (error) {
      console.error('Error fetching pets:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle apply for adoption
  const handleApply = (pet) => {
    setSelectedPet(pet);
    if (user) {
      setApplicationForm(prev => ({
        ...prev,
        applicant_name: user.name || '',
        applicant_email: user.email || '',
        applicant_phone: user.phone || ''
      }));
    }
    setShowApplicationModal(true);
  };
  
  // Submit adoption application
  const submitApplication = async () => {
    if (!applicationForm.applicant_name || !applicationForm.applicant_email || !applicationForm.applicant_phone) {
      toast({ title: 'Missing information', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/adopt/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pet_id: selectedPet.pet_id,
          ...applicationForm
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        toast({ title: '🎉 Application Submitted!', description: data.message });
        setShowApplicationModal(false);
        setSelectedPet(null);
      } else {
        const error = await res.json();
        toast({ title: 'Error', description: error.detail, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to submit application', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };
  
  // Submit foster application
  const submitFosterApplication = async () => {
    if (!fosterForm.applicant_name || !fosterForm.applicant_email || !fosterForm.applicant_phone) {
      toast({ title: 'Missing information', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/adopt/foster/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fosterForm)
      });
      
      if (res.ok) {
        const data = await res.json();
        toast({ title: '💝 Foster Application Submitted!', description: data.message });
        setShowFosterModal(false);
      } else {
        const error = await res.json();
        toast({ title: 'Error', description: error.detail, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to submit application', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };
  
  // Register for event
  const handleEventRegister = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };
  
  const submitEventRegistration = async (name, email, phone) => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/adopt/events/${selectedEvent.event_id}/register?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone || '')}`, {
        method: 'POST'
      });
      
      if (res.ok) {
        toast({ title: '✅ Registered!', description: `You're registered for ${selectedEvent.title}` });
        setShowEventModal(false);
      } else {
        const error = await res.json();
        toast({ title: 'Error', description: error.detail, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to register', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PillarPageLayout
      pillar="adopt"
      title="Finding the Right Companion"
      description="Thoughtful matching, not impulse"
    >
      {/* Adoption Application Modal */}
      <Dialog open={showApplicationModal} onOpenChange={setShowApplicationModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500" />
              Adopt {selectedPet?.name}
            </DialogTitle>
            <DialogDescription>
              Fill out this application and we&apos;ll contact you within 24-48 hours.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Your Name *</Label>
                <Input
                  value={applicationForm.applicant_name}
                  onChange={e => setApplicationForm({...applicationForm, applicant_name: e.target.value})}
                  placeholder="Full name"
                />
              </div>
              <div>
                <Label>Phone *</Label>
                <Input
                  value={applicationForm.applicant_phone}
                  onChange={e => setApplicationForm({...applicationForm, applicant_phone: e.target.value})}
                  placeholder="Phone number"
                />
              </div>
            </div>
            
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={applicationForm.applicant_email}
                onChange={e => setApplicationForm({...applicationForm, applicant_email: e.target.value})}
                placeholder="your@email.com"
              />
            </div>
            
            <div>
              <Label>Home Type</Label>
              <Select value={applicationForm.home_type} onValueChange={v => setApplicationForm({...applicationForm, home_type: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select home type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="condo">Condo</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Do you have other pets?</Label>
              <Textarea
                value={applicationForm.other_pets}
                onChange={e => setApplicationForm({...applicationForm, other_pets: e.target.value})}
                placeholder="Describe any current pets..."
                rows={2}
              />
            </div>
            
            <div>
              <Label>Pet experience</Label>
              <Textarea
                value={applicationForm.experience}
                onChange={e => setApplicationForm({...applicationForm, experience: e.target.value})}
                placeholder="Tell us about your experience with pets..."
                rows={2}
              />
            </div>
            
            <div>
              <Label>Why do you want to adopt {selectedPet?.name}?</Label>
              <Textarea
                value={applicationForm.reason}
                onChange={e => setApplicationForm({...applicationForm, reason: e.target.value})}
                placeholder="Share your reasons..."
                rows={3}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowApplicationModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitApplication}
              disabled={submitting}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Submit Application
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Foster Application Modal */}
      <Dialog open={showFosterModal} onOpenChange={setShowFosterModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-amber-500" />
              Become a Foster Parent
            </DialogTitle>
            <DialogDescription>
              Help pets in need by providing temporary loving care.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Your Name *</Label>
                <Input
                  value={fosterForm.applicant_name}
                  onChange={e => setFosterForm({...fosterForm, applicant_name: e.target.value})}
                  placeholder="Full name"
                />
              </div>
              <div>
                <Label>Phone *</Label>
                <Input
                  value={fosterForm.applicant_phone}
                  onChange={e => setFosterForm({...fosterForm, applicant_phone: e.target.value})}
                  placeholder="Phone number"
                />
              </div>
            </div>
            
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={fosterForm.applicant_email}
                onChange={e => setFosterForm({...fosterForm, applicant_email: e.target.value})}
                placeholder="your@email.com"
              />
            </div>
            
            <div>
              <Label>How long can you foster?</Label>
              <Select value={fosterForm.foster_duration} onValueChange={v => setFosterForm({...fosterForm, foster_duration: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-2 weeks">1-2 weeks</SelectItem>
                  <SelectItem value="1 month">1 month</SelectItem>
                  <SelectItem value="2-3 months">2-3 months</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Experience with pets</Label>
              <Textarea
                value={fosterForm.experience}
                onChange={e => setFosterForm({...fosterForm, experience: e.target.value})}
                placeholder="Tell us about your experience..."
                rows={3}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowFosterModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitFosterApplication}
              disabled={submitting}
              className="bg-gradient-to-r from-amber-500 to-orange-500"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Heart className="w-4 h-4 mr-2" />}
              Apply to Foster
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Event Registration Modal */}
      <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Register for {selectedEvent?.title}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            submitEventRegistration(
              formData.get('name'),
              formData.get('email'),
              formData.get('phone')
            );
          }} className="space-y-4 py-4">
            <div>
              <Label>Name *</Label>
              <Input name="name" required placeholder="Your name" defaultValue={user?.name || ''} />
            </div>
            <div>
              <Label>Email *</Label>
              <Input name="email" type="email" required placeholder="your@email.com" defaultValue={user?.email || ''} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input name="phone" placeholder="Phone number" defaultValue={user?.phone || ''} />
            </div>
            
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowEventModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Register
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PillarPageLayout>
  );
};

export default AdoptPage;
