import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  PawPrint, Calendar, Gift, Heart, Sparkles, 
  ChevronRight, Crown, Users, Scissors, Cake,
  Syringe, AlertCircle, Clock, Brain, Home,
  ShoppingBag, Stethoscope, Star, Percent
} from 'lucide-react';
import MemoryTimeline from './MemoryTimeline';
import { API_URL } from '../utils/api';

// Persona icons
const PERSONA_ICONS = {
  royal: { icon: Crown, color: 'text-purple-500', bg: 'bg-purple-100' },
  shadow: { icon: '🌙', color: 'text-indigo-500', bg: 'bg-indigo-100' },
  adventurer: { icon: '⛰️', color: 'text-green-500', bg: 'bg-green-100' },
  couch_potato: { icon: '🛋️', color: 'text-amber-500', bg: 'bg-amber-100' },
  social_butterfly: { icon: Users, color: 'text-pink-500', bg: 'bg-pink-100' },
  foodie: { icon: '🍖', color: 'text-orange-500', bg: 'bg-orange-100' },
  athlete: { icon: '⚡', color: 'text-blue-500', bg: 'bg-blue-100' },
  mischief_maker: { icon: '😈', color: 'text-red-500', bg: 'bg-red-100' }
};

/**
 * FamilyDashboard Component
 * A household view showing all pets together with key moments
 * 
 * This is NOT a list - it's a family dashboard that thinks the way a pet parent thinks.
 */
const FamilyDashboard = ({ 
  memberId,
  memberName,
  token,
  pets = [],
  onSelectPet,
  showTimeline = true,
  showBulkActions = true
}) => {
  const [upcomingMoments, setUpcomingMoments] = useState([]);
  const [healthAlerts, setHealthAlerts] = useState([]);
  const [householdBenefits, setHouseholdBenefits] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pets.length > 0) {
      loadFamilyData();
    }
  }, [pets, token]);

  const loadFamilyData = async () => {
    setLoading(true);
    try {
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      // Load household benefits
      if (memberId) {
        try {
          const householdRes = await fetch(
            `${API_URL}/api/household/${encodeURIComponent(memberId)}`,
            { headers }
          );
          if (householdRes.ok) {
            const data = await householdRes.json();
            setHouseholdBenefits(data);
          }
        } catch (e) {
          console.log('Household benefits not available');
        }
      }

      // Calculate upcoming moments from pets data
      const moments = [];
      const alerts = [];
      const now = new Date();
      
      for (const pet of pets) {
        // Birthday check
        if (pet.birth_date) {
          const birthday = new Date(pet.birth_date);
          const nextBirthday = new Date(now.getFullYear(), birthday.getMonth(), birthday.getDate());
          if (nextBirthday < now) {
            nextBirthday.setFullYear(now.getFullYear() + 1);
          }
          const daysUntil = Math.ceil((nextBirthday - now) / (1000 * 60 * 60 * 24));
          
          if (daysUntil <= 30) {
            moments.push({
              type: 'birthday',
              pet: pet.name,
              petId: pet.id,
              date: nextBirthday,
              daysUntil,
              icon: Cake,
              color: 'pink'
            });
          }
        }
        
        // Gotcha day check
        if (pet.gotcha_date) {
          const gotchaDay = new Date(pet.gotcha_date);
          const nextGotcha = new Date(now.getFullYear(), gotchaDay.getMonth(), gotchaDay.getDate());
          if (nextGotcha < now) {
            nextGotcha.setFullYear(now.getFullYear() + 1);
          }
          const daysUntil = Math.ceil((nextGotcha - now) / (1000 * 60 * 60 * 24));
          
          if (daysUntil <= 30) {
            moments.push({
              type: 'gotcha',
              pet: pet.name,
              petId: pet.id,
              date: nextGotcha,
              daysUntil,
              icon: Gift,
              color: 'purple'
            });
          }
        }
        
        // Check health data for vaccines
        try {
          const vaccineRes = await fetch(`${API_URL}/api/pet-vault/${pet.id}/vaccines`);
          if (vaccineRes.ok) {
            const vaccineData = await vaccineRes.json();
            (vaccineData.vaccines || []).forEach(vaccine => {
              if (vaccine.next_due_date) {
                const dueDate = new Date(vaccine.next_due_date);
                const daysUntil = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
                
                if (daysUntil <= 14) {
                  if (daysUntil < 0) {
                    alerts.push({
                      type: 'vaccine_overdue',
                      pet: pet.name,
                      petId: pet.id,
                      vaccine: vaccine.vaccine_name,
                      daysOverdue: Math.abs(daysUntil),
                      icon: AlertCircle,
                      color: 'red'
                    });
                  } else {
                    moments.push({
                      type: 'vaccine',
                      pet: pet.name,
                      petId: pet.id,
                      vaccine: vaccine.vaccine_name,
                      date: dueDate,
                      daysUntil,
                      icon: Syringe,
                      color: 'blue'
                    });
                  }
                }
              }
            });
          }
        } catch (e) {
          // Vaccine data not available
        }
      }
      
      // Sort moments by date
      moments.sort((a, b) => a.daysUntil - b.daysUntil);
      
      setUpcomingMoments(moments);
      setHealthAlerts(alerts);
      
    } catch (error) {
      console.error('Error loading family data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate Soul completeness for a pet
  const getSoulCompleteness = (pet) => {
    const soulAnswers = pet.doggy_soul_answers || {};
    const totalQuestions = 10;
    const answeredQuestions = Object.keys(soulAnswers).length;
    return Math.round((answeredQuestions / totalQuestions) * 100);
  };

  // Get persona display
  const getPersonaDisplay = (pet) => {
    const persona = pet.doggy_soul_answers?.persona || pet.soul?.persona;
    if (!persona) return null;
    
    const config = PERSONA_ICONS[persona];
    if (!config) return null;
    
    return {
      name: persona.replace('_', ' '),
      ...config
    };
  };

  if (loading && pets.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Family Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
            <Home className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {memberName ? `${memberName}'s Family` : 'Your Pet Family'}
            </h2>
            <p className="text-sm text-gray-500">
              {pets.length} {pets.length === 1 ? 'pet' : 'pets'} in your household
            </p>
          </div>
        </div>
        
        {/* Family Benefits Badge */}
        {pets.length >= 2 && householdBenefits?.benefits && (
          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1">
            <Percent className="w-3 h-3 mr-1" />
            {householdBenefits.benefits.family_discount}% Family Discount Active
          </Badge>
        )}
      </div>

      {/* Health Alerts (if any) */}
      {healthAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="font-semibold text-red-800">Health Alerts</span>
            </div>
            <div className="space-y-2">
              {healthAlerts.map((alert, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg">
                  <div className="flex items-center gap-2">
                    <PawPrint className="w-4 h-4 text-red-500" />
                    <span className="font-medium">{alert.pet}</span>
                    <span className="text-red-600">
                      {alert.vaccine} overdue by {alert.daysOverdue} days
                    </span>
                  </div>
                  <Button size="sm" variant="destructive" onClick={() => onSelectPet?.(alert.petId)}>
                    Schedule Now
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Moments */}
      {upcomingMoments.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              Upcoming Moments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {upcomingMoments.slice(0, 6).map((moment, idx) => {
                const Icon = moment.icon;
                const bgColors = {
                  pink: 'bg-pink-50 border-pink-200',
                  purple: 'bg-purple-50 border-purple-200',
                  blue: 'bg-blue-50 border-blue-200'
                };
                const textColors = {
                  pink: 'text-pink-600',
                  purple: 'text-purple-600',
                  blue: 'text-blue-600'
                };
                
                return (
                  <div 
                    key={idx}
                    className={`p-3 rounded-lg border ${bgColors[moment.color]} cursor-pointer hover:shadow-md transition-shadow`}
                    onClick={() => onSelectPet?.(moment.petId)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${bgColors[moment.color]}`}>
                        <Icon className={`w-4 h-4 ${textColors[moment.color]}`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">
                          {moment.type === 'birthday' && `${moment.pet}'s Birthday`}
                          {moment.type === 'gotcha' && `${moment.pet}'s Gotcha Day`}
                          {moment.type === 'vaccine' && `${moment.pet}: ${moment.vaccine}`}
                        </p>
                        <p className="text-sm text-gray-500">
                          {moment.daysUntil === 0 ? 'Today!' : 
                           moment.daysUntil === 1 ? 'Tomorrow' :
                           `In ${moment.daysUntil} days`}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pet Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pets.map((pet) => {
          const soulCompleteness = getSoulCompleteness(pet);
          const persona = getPersonaDisplay(pet);
          
          return (
            <Card 
              key={pet.id}
              className="overflow-hidden cursor-pointer hover:shadow-lg transition-all group"
              onClick={() => onSelectPet?.(pet.id)}
            >
              {/* Pet Photo Header */}
              <div className="relative h-32 bg-gradient-to-br from-purple-100 to-pink-100">
                {pet.photo_url ? (
                  <img 
                    src={pet.photo_url} 
                    alt={pet.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <PawPrint className="w-16 h-16 text-purple-300" />
                  </div>
                )}
                
                {/* Persona Badge */}
                {persona && (
                  <div className={`absolute top-2 right-2 px-2 py-1 rounded-full ${persona.bg} text-xs font-medium`}>
                    {typeof persona.icon === 'string' ? persona.icon : <persona.icon className="w-3 h-3 inline mr-1" />}
                    {persona.name}
                  </div>
                )}
              </div>
              
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">{pet.name}</h3>
                    <p className="text-sm text-gray-500">
                      {pet.breed || 'Unknown breed'} • {pet.species || 'Dog'}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" />
                </div>
                
                {/* Soul Completeness */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Brain className="w-3 h-3" />
                      Pet Soul™
                    </span>
                    <span className="font-medium text-purple-600">{soulCompleteness}%</span>
                  </div>
                  <Progress value={soulCompleteness} className="h-2" />
                </div>
                
                {/* Quick Stats */}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {pet.birth_date && (
                    <span className="flex items-center gap-1">
                      <Cake className="w-3 h-3" />
                      {new Date(pet.birth_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  {pet.gender && (
                    <Badge variant="outline" className="text-xs">
                      {pet.gender}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bulk Actions */}
      {showBulkActions && pets.length > 1 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-500" />
              Family Actions
              <Badge variant="secondary" className="ml-2">All Pets</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button variant="outline" className="h-auto py-3 flex flex-col items-center gap-2">
                <Scissors className="w-5 h-5 text-purple-500" />
                <span className="text-sm">Book Grooming</span>
                <span className="text-xs text-gray-400">For all pets</span>
              </Button>
              <Button variant="outline" className="h-auto py-3 flex flex-col items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-green-500" />
                <span className="text-sm">Order Treats</span>
                <span className="text-xs text-gray-400">Respects allergies</span>
              </Button>
              <Button variant="outline" className="h-auto py-3 flex flex-col items-center gap-2">
                <Stethoscope className="w-5 h-5 text-blue-500" />
                <span className="text-sm">Vet Checkup</span>
                <span className="text-xs text-gray-400">Group booking</span>
              </Button>
              <Button variant="outline" className="h-auto py-3 flex flex-col items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-500" />
                <span className="text-sm">Set Reminders</span>
                <span className="text-xs text-gray-400">Sync schedules</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Memory Timeline */}
      {showTimeline && memberId && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" />
              Family Journey
              <Badge variant="secondary" className="ml-2">Relationship Memory</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MemoryTimeline 
              memberId={memberId}
              token={token}
              isAdmin={false}
              maxItems={5}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FamilyDashboard;
