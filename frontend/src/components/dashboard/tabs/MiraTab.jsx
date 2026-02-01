import React from 'react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Sparkles, MessageCircle, Zap, Heart, PawPrint } from 'lucide-react';

const MiraTab = ({ user, pets }) => {
  const primaryPet = pets[0];
  
  const miraCapabilities = [
    { icon: '🛒', title: 'Shopping Help', desc: 'Find products, compare prices, place orders' },
    { icon: '📅', title: 'Booking Services', desc: 'Schedule grooming, vet visits, boarding' },
    { icon: '💊', title: 'Health Reminders', desc: 'Track vaccinations, medications, appointments' },
    { icon: '🎂', title: 'Celebration Planning', desc: 'Plan birthdays, parties, special occasions' },
    { icon: '✈️', title: 'Travel Assistance', desc: 'Pet-friendly stays, travel arrangements' },
    { icon: '📋', title: 'Document Help', desc: 'KCI paperwork, pet passport, registrations' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Mira Introduction Card */}
      <Card className="p-6 bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 text-white border-none shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Meet Mira</h2>
              <p className="text-white/80">Your AI Pet Concierge®</p>
            </div>
          </div>
          
          <p className="text-white/90 mb-4">
            Hi{user?.name ? ` ${user.name.split(' ')[0]}` : ''}! I&apos;m Mira, your personal AI assistant for everything 
            {primaryPet?.name ? ` ${primaryPet.name}` : ' your pet'} needs. From booking services to finding the perfect treats, 
            I&apos;m here 24/7 to help.
          </p>
          
          <div className="flex flex-wrap gap-3">
            <Button 
              className="bg-white text-purple-600 hover:bg-white/90 font-semibold"
              onClick={() => window.dispatchEvent(new CustomEvent('openMiraAI'))}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat with Mira
            </Button>
            <Button 
              variant="outline"
              className="border-white/30 text-white hover:bg-white/20"
            >
              <Zap className="w-4 h-4 mr-2" />
              Quick Commands
            </Button>
          </div>
        </div>
      </Card>
      
      {/* What Mira Can Do */}
      <Card className="p-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Heart className="w-5 h-5 text-pink-500" />
          What Mira Can Do For You
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {miraCapabilities.map((cap, idx) => (
            <div 
              key={idx}
              className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => window.dispatchEvent(new CustomEvent('openMiraAI'))}
            >
              <span className="text-3xl mb-3 block group-hover:scale-110 transition-transform">{cap.icon}</span>
              <h4 className="font-semibold text-gray-900 mb-1">{cap.title}</h4>
              <p className="text-sm text-gray-500">{cap.desc}</p>
            </div>
          ))}
        </div>
      </Card>
      
      {/* Quick Actions */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-600" />
          Try These Quick Commands
        </h3>
        <div className="flex flex-wrap gap-2">
          {[
            `Book grooming for ${primaryPet?.name || 'my pet'}`,
            'Find a pet-friendly hotel in Goa',
            'Order birthday cake',
            'Schedule vet appointment',
            'Show my recent orders',
            `What vaccines does ${primaryPet?.name || 'my pet'} need?`
          ].map((cmd, idx) => (
            <Badge 
              key={idx}
              variant="outline"
              className="px-4 py-2 cursor-pointer hover:bg-purple-100 hover:border-purple-300 transition-colors text-sm"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('openMiraAI', { detail: { message: cmd } }));
              }}
            >
              🎤 &quot;{cmd}&quot;
            </Badge>
          ))}
        </div>
      </Card>
      
      {/* Pet Context */}
      {primaryPet && (
        <Card className="p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <PawPrint className="w-5 h-5 text-purple-600" />
            Mira Knows About {primaryPet.name}
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3 bg-purple-50 rounded-lg">
              <p className="text-xs text-purple-600 font-medium">Name</p>
              <p className="font-semibold text-gray-900">{primaryPet.name}</p>
            </div>
            <div className="p-3 bg-pink-50 rounded-lg">
              <p className="text-xs text-pink-600 font-medium">Breed</p>
              <p className="font-semibold text-gray-900">{primaryPet.breed || 'Not set'}</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg">
              <p className="text-xs text-amber-600 font-medium">Birthday</p>
              <p className="font-semibold text-gray-900">{primaryPet.birth_date || 'Not set'}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-green-600 font-medium">Soul Score</p>
              <p className="font-semibold text-gray-900">{Math.min(100, Math.round(primaryPet.overall_score || 0))}%</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            💡 The more you complete {primaryPet.name}&apos;s Pet Soul™, the more personalized Mira&apos;s recommendations become!
          </p>
        </Card>
      )}
    </div>
  );
};

export default MiraTab;
