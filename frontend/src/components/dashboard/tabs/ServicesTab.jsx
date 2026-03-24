import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Crown, Stethoscope, Home, Cake, ChevronRight } from 'lucide-react';

const ServicesTab = () => {
  const navigate = useNavigate();

  const pillars = [
    { id: 'celebrate', name: 'Celebrate', icon: '🎂', path: '/celebrate', color: 'from-pink-500 to-rose-600', desc: 'Birthdays & parties' },
    { id: 'dine', name: 'Dine', icon: '🍽️', path: '/dine', color: 'from-amber-500 to-orange-600', desc: 'Pet-friendly dining' },
    { id: 'stay', name: 'Stay', icon: '🏨', path: '/stay', color: 'from-blue-500 to-indigo-600', desc: 'Boarding & daycare' },
    { id: 'travel', name: 'Travel', icon: '✈️', path: '/travel', color: 'from-cyan-500 to-blue-600', desc: 'Pet travel services' },
    { id: 'care', name: 'Care', icon: '💊', path: '/care', color: 'from-red-500 to-rose-600', desc: 'Health & wellness' },
    { id: 'enjoy', name: 'Enjoy', icon: '🎾', path: '/enjoy', color: 'from-violet-500 to-purple-600', desc: 'Activities & fun' },
    { id: 'fit', name: 'Fit', icon: '🏃', path: '/fit', color: 'from-green-500 to-emerald-600', desc: 'Fitness & exercise' },
    { id: 'learn', name: 'Learn', icon: '🎓', path: '/learn', color: 'from-teal-500 to-cyan-600', desc: 'Training & courses' },
    { id: 'paperwork', name: 'Paperwork', icon: '📄', path: '/paperwork', color: 'from-slate-500 to-gray-600', desc: 'Documents & KCI' },
    { id: 'advisory', name: 'Advisory', icon: '📋', path: '/advisory', color: 'from-indigo-500 to-blue-600', desc: 'Expert consultations' },
    { id: 'emergency', name: 'Emergency', icon: '🚨', path: '/emergency', color: 'from-red-600 to-rose-700', desc: '24/7 emergency help' },
    { id: 'farewell', name: 'Farewell', icon: '🌈', path: '/farewell', color: 'from-purple-500 to-pink-600', desc: 'Memorial services' },
    { id: 'adopt', name: 'Adopt', icon: '🐾', path: '/adopt', color: 'from-orange-500 to-amber-600', desc: 'Pet adoption' },
    { id: 'shop', name: 'Shop', icon: '🛒', path: '/shop', color: 'from-emerald-500 to-teal-600', desc: 'Products & supplies' }
  ];

  return (
    <div className="animate-in fade-in-50 duration-300 space-y-6" data-testid="services-tab">
      {/* Header Card */}
      <Card className="p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 sm:p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg shadow-purple-500/20">
            <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-white">All Pet Life Services</h3>
            <p className="text-xs sm:text-sm text-slate-400">Access all 12 pillars with your Pet Pass</p>
          </div>
        </div>
        
        {/* Service Pillars Grid - Mobile: 2 cols, Tablet: 4 cols, Desktop: 7 cols */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
          {pillars.map((pillar) => (
            <button
              key={pillar.id}
              onClick={() => navigate(pillar.path)}
              className="group p-3 sm:p-4 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl border border-white/5 hover:border-purple-500/30 transition-all text-center"
              data-testid={`service-${pillar.id}`}
            >
              <div className={`w-10 h-10 sm:w-14 sm:h-14 mx-auto rounded-xl bg-gradient-to-br ${pillar.color} flex items-center justify-center text-xl sm:text-2xl mb-2 sm:mb-3 group-hover:scale-110 transition-transform shadow-lg`}>
                {pillar.icon}
              </div>
              <p className="font-semibold text-white text-sm sm:text-base mb-0.5 sm:mb-1">{pillar.name}</p>
              <p className="text-[10px] sm:text-xs text-slate-400 leading-tight">{pillar.desc}</p>
            </button>
          ))}
        </div>
      </Card>
      
      {/* Quick Actions Card */}
      <Card className="p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl">
        <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
          <ChevronRight className="w-4 h-4 text-purple-400" />
          Quick Actions
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Button 
            variant="outline" 
            onClick={() => navigate('/care')} 
            className="justify-start bg-slate-800/50 border-white/10 text-white hover:bg-slate-700/50 hover:border-purple-500/30 h-auto py-3"
          >
            <Stethoscope className="w-4 h-4 mr-2 text-purple-400 flex-shrink-0" /> 
            <span className="text-sm">Book Vet Visit</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/stay')} 
            className="justify-start bg-slate-800/50 border-white/10 text-white hover:bg-slate-700/50 hover:border-purple-500/30 h-auto py-3"
          >
            <Home className="w-4 h-4 mr-2 text-blue-400 flex-shrink-0" /> 
            <span className="text-sm">Find Boarding</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/celebrate')} 
            className="justify-start bg-slate-800/50 border-white/10 text-white hover:bg-slate-700/50 hover:border-purple-500/30 h-auto py-3"
          >
            <Cake className="w-4 h-4 mr-2 text-pink-400 flex-shrink-0" /> 
            <span className="text-sm">Order Cake</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/emergency')} 
            className="justify-start bg-red-950/50 border-red-500/30 text-red-400 hover:bg-red-900/50 hover:border-red-500/50 h-auto py-3"
          >
            <span className="mr-2">🚨</span>
            <span className="text-sm">Emergency Help</span>
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ServicesTab;
