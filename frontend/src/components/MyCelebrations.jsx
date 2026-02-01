/**
 * MyCelebrations - Dashboard widget showing upcoming pet celebrations
 * Shows birthdays, gotcha days, vaccinations with countdown timers
 * Now includes "Build Box" buttons for occasion box ordering
 */

import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Calendar, Gift, Heart, Cake, Home, Syringe, 
  Sparkles, ChevronRight, PartyPopper, Clock, Bell, ShoppingBag
} from 'lucide-react';
import OccasionBoxBuilder from './OccasionBoxBuilder';

const CELEBRATION_TYPES = {
  birthday: {
    icon: '🎂',
    label: 'Birthday',
    color: 'from-pink-400 to-rose-400',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    textColor: 'text-pink-700',
    actionText: 'Build Birthday Box',
    actionPath: '/celebrate/cakes',
    hasBox: true,
    occasionType: 'birthday'
  },
  gotcha_day: {
    icon: '💝',
    label: 'Gotcha Day',
    color: 'from-purple-400 to-violet-400',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700',
    actionText: 'Build Gotcha Box',
    actionPath: '/celebrate',
    hasBox: true,
    occasionType: 'gotcha_day'
  },
  vaccination: {
    icon: '💉',
    label: 'Vaccination Due',
    color: 'from-blue-400 to-cyan-400',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    actionText: 'Book Vet Visit',
    actionPath: '/care?type=vet',
    hasBox: false
  },
  grooming: {
    icon: '✂️',
    label: 'Grooming Day',
    color: 'from-teal-400 to-emerald-400',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    textColor: 'text-teal-700',
    actionText: 'Book Grooming',
    actionPath: '/care?type=grooming'
  },
  anniversary: {
    icon: '🏠',
    label: 'Family Anniversary',
    color: 'from-amber-400 to-orange-400',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    actionText: 'Celebrate',
    actionPath: '/celebrate'
  }
};

// Confetti animation component
const Confetti = () => {
  const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA'];
  const pieces = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    left: Math.random() * 100,
    delay: Math.random() * 0.5
  }));
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {pieces.map(piece => (
        <div
          key={piece.id}
          className="absolute w-2 h-2 animate-confetti"
          style={{
            backgroundColor: piece.color,
            left: `${piece.left}%`,
            top: '-10px',
            animationDelay: `${piece.delay}s`,
            borderRadius: Math.random() > 0.5 ? '50%' : '0'
          }}
        />
      ))}
    </div>
  );
};

// Single celebration card
const CelebrationCard = ({ celebration, onAction, onBuildBox }) => {
  const type = CELEBRATION_TYPES[celebration.type] || CELEBRATION_TYPES.birthday;
  const isToday = celebration.daysUntil === 0;
  const isOverdue = celebration.daysUntil < 0;
  const isRecent = celebration.daysUntil < 0 && celebration.daysUntil >= -7;
  
  return (
    <div 
      className={`relative p-4 rounded-xl border-2 ${type.bgColor} ${type.borderColor} transition-all hover:shadow-md ${isToday ? 'ring-2 ring-offset-2 ring-yellow-400' : ''} ${isRecent ? 'ring-2 ring-offset-2 ring-purple-400' : ''}`}
    >
      {isToday && <Confetti />}
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center text-2xl shadow-lg ${isToday ? 'animate-bounce-gentle' : ''}`}>
              {type.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-bold ${type.textColor}`}>{celebration.petName}</h3>
                {isToday && (
                  <Badge className="bg-yellow-400 text-yellow-900 animate-pulse">
                    🎉 TODAY!
                  </Badge>
                )}
                {isRecent && (
                  <Badge className="bg-purple-500 text-white">
                    Celebrate now!
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600">{celebration.label}</p>
            </div>
          </div>
          
          {/* Countdown */}
          <div className={`text-right ${isOverdue ? 'text-purple-600' : ''}`}>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span className="text-2xl font-bold">
                {isToday ? '🎊' : Math.abs(celebration.daysUntil)}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              {isToday ? 'Celebrate!' : isRecent ? 'days ago' : isOverdue ? 'days ago' : 'days left'}
            </p>
          </div>
        </div>
        
        {/* Additional Info */}
        {celebration.detail && (
          <p className="text-sm text-gray-600 mb-3 pl-15">
            {celebration.detail}
          </p>
        )}
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          {type.hasBox && onBuildBox ? (
            <>
              <Button 
                size="sm"
                onClick={() => onBuildBox(type.occasionType, celebration.petName)}
                className={`flex-1 bg-gradient-to-r ${type.color} text-white hover:opacity-90 shadow-md`}
              >
                <Gift className="w-4 h-4 mr-1" />
                {type.actionText}
              </Button>
              <Button 
                size="sm"
                variant="outline"
                onClick={() => onAction(type.actionPath)}
                className="border-2"
              >
                <ShoppingBag className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button 
              size="sm"
              onClick={() => onAction(type.actionPath)}
              className={`w-full bg-gradient-to-r ${type.color} text-white hover:opacity-90 shadow-md`}
            >
              {type.actionText}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// Main component
const MyCelebrations = ({ pets = [], onNavigate, onAddToCart }) => {
  const [celebrations, setCelebrations] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [showBoxBuilder, setShowBoxBuilder] = useState(false);
  const [selectedOccasion, setSelectedOccasion] = useState(null);
  const [selectedPetName, setSelectedPetName] = useState('');
  
  // Helper for ordinal suffix - declared before useEffect
  const getOrdinalSuffix = (n) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };
  
  useEffect(() => {
    const today = new Date();
    const allCelebrations = [];
    
    pets.forEach(pet => {
      // Birthday check (within 60 days AND recent past 7 days)
      if (pet.birth_date) {
        const birthDate = new Date(pet.birth_date);
        const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
        
        // Check if birthday already passed this year
        let daysUntil = Math.ceil((thisYearBirthday - today) / (1000 * 60 * 60 * 24));
        
        // If birthday was in the past 7 days, show it as "recent"
        if (daysUntil < -7) {
          // Move to next year
          thisYearBirthday.setFullYear(today.getFullYear() + 1);
          daysUntil = Math.ceil((thisYearBirthday - today) / (1000 * 60 * 60 * 24));
        }
        
        // Show upcoming (60 days) OR recent (past 7 days)
        if (daysUntil <= 60 && daysUntil >= -7) {
          const age = thisYearBirthday.getFullYear() - birthDate.getFullYear();
          const isRecent = daysUntil < 0;
          
          allCelebrations.push({
            id: `${pet.id}-birthday`,
            type: 'birthday',
            petName: pet.name,
            petId: pet.id,
            daysUntil,
            date: thisYearBirthday,
            label: `${age}${getOrdinalSuffix(age)} Birthday`,
            detail: daysUntil === 0 ? `Happy Birthday ${pet.name}! 🎉` : 
                    isRecent ? `${pet.name}'s birthday was ${Math.abs(daysUntil)} days ago - still time to celebrate!` :
                    daysUntil <= 7 ? `Time to plan the pawty!` : null
          });
        }
      }
      
      // Gotcha Day check (within 60 days AND recent past 7 days)
      if (pet.gotcha_date) {
        const gotchaDate = new Date(pet.gotcha_date);
        const thisYearGotcha = new Date(today.getFullYear(), gotchaDate.getMonth(), gotchaDate.getDate());
        
        let daysUntil = Math.ceil((thisYearGotcha - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntil < -7) {
          thisYearGotcha.setFullYear(today.getFullYear() + 1);
          daysUntil = Math.ceil((thisYearGotcha - today) / (1000 * 60 * 60 * 24));
        }
        
        if (daysUntil <= 60 && daysUntil >= -7) {
          const years = thisYearGotcha.getFullYear() - gotchaDate.getFullYear();
          const isRecent = daysUntil < 0;
          
          allCelebrations.push({
            id: `${pet.id}-gotcha`,
            type: 'gotcha_day',
            petName: pet.name,
            petId: pet.id,
            daysUntil,
            date: thisYearGotcha,
            label: `${years} Year${years > 1 ? 's' : ''} Together`,
            detail: isRecent 
              ? `${years} years since ${pet.name} joined - celebrate now!`
              : `${years} amazing year${years > 1 ? 's' : ''} since ${pet.name} joined the family!`
          });
        }
      }
      
      // Vaccination reminders (from health data)
      const vaccinations = pet.health?.vaccinations || pet.vaccinations || [];
      vaccinations.forEach(vax => {
        if (vax.next_due) {
          const dueDate = new Date(vax.next_due);
          const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
          
          if (daysUntil <= 30 && daysUntil >= -7) {
            allCelebrations.push({
              id: `${pet.id}-vax-${vax.name}`,
              type: 'vaccination',
              petName: pet.name,
              petId: pet.id,
              daysUntil,
              date: dueDate,
              label: `${vax.name} Due`,
              detail: daysUntil < 0 ? `Overdue by ${Math.abs(daysUntil)} days` : 
                      daysUntil === 0 ? 'Due today!' : null
            });
          }
        }
      });
    });
    
    // Sort: recent celebrations first, then by closest upcoming
    allCelebrations.sort((a, b) => {
      // Put recent (negative days) first
      if (a.daysUntil < 0 && b.daysUntil >= 0) return -1;
      if (b.daysUntil < 0 && a.daysUntil >= 0) return 1;
      // Then sort by absolute value (closest first)
      return Math.abs(a.daysUntil) - Math.abs(b.daysUntil);
    });
    
    setCelebrations(allCelebrations);
  }, [pets, getOrdinalSuffix]);
  
  const handleBuildBox = (occasionType, petName) => {
    console.log('Building box for:', occasionType, petName);
    setSelectedOccasion(occasionType);
    setSelectedPetName(petName);
    // Use setTimeout to ensure state is updated before opening modal
    setTimeout(() => {
      setShowBoxBuilder(true);
    }, 0);
  };
  
  const handleAction = (path) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.location.href = path;
    }
  };
  
  // Don't render if no celebrations
  if (celebrations.length === 0) {
    return (
      <Card className="p-6 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 border-purple-200">
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
            <Calendar className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="font-semibold text-gray-800 mb-2">No Celebrations Yet</h3>
          <p className="text-sm text-gray-600 mb-4">
            Add your pet&apos;s birthday and gotcha day to get reminders!
          </p>
          <Button 
            variant="outline" 
            onClick={() => handleAction('/my-pets')}
            className="border-purple-300 text-purple-700 hover:bg-purple-100"
          >
            <Heart className="w-4 h-4 mr-2" />
            Update Pet Profile
          </Button>
        </div>
      </Card>
    );
  }
  
  const displayCelebrations = showAll ? celebrations : celebrations.slice(0, 3);
  const hasToday = celebrations.some(c => c.daysUntil === 0);
  
  return (
    <Card className={`overflow-hidden ${hasToday ? 'ring-2 ring-yellow-400 ring-offset-2' : ''}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <PartyPopper className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">My Celebrations</h3>
              <p className="text-white/80 text-sm">
                {celebrations.length} upcoming event{celebrations.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          {hasToday && (
            <Badge className="bg-yellow-400 text-yellow-900 font-bold animate-pulse">
              🎉 Today!
            </Badge>
          )}
        </div>
      </div>
      
      {/* Celebrations List */}
      <div className="p-4 bg-gradient-to-b from-white to-purple-50/30">
        <div className="space-y-3">
          {displayCelebrations.map(celebration => (
            <CelebrationCard 
              key={celebration.id}
              celebration={celebration}
              onAction={handleAction}
              onBuildBox={handleBuildBox}
            />
          ))}
        </div>
        
        {celebrations.length > 3 && (
          <Button 
            variant="ghost" 
            className="w-full mt-4 text-purple-600 hover:text-purple-700 hover:bg-purple-100"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Show Less' : `View ${celebrations.length - 3} More`}
          </Button>
        )}
      </div>
      
      {/* Footer Tip */}
      <div className="bg-purple-50 px-4 py-3 border-t border-purple-100">
        <div className="flex items-center gap-2 text-sm text-purple-700">
          <Bell className="w-4 h-4" />
          <span>We&apos;ll remind you before each celebration!</span>
        </div>
      </div>
      
      {/* Occasion Box Builder Modal */}
      <OccasionBoxBuilder
        isOpen={showBoxBuilder}
        onClose={() => setShowBoxBuilder(false)}
        occasionType={selectedOccasion}
        petName={selectedPetName}
        onAddToCart={onAddToCart}
      />
    </Card>
  );
};

export default MyCelebrations;
