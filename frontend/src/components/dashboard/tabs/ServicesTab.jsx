import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Crown, Stethoscope, Home, Cake } from 'lucide-react';

const ServicesTab = () => {
  const navigate = useNavigate();

  const pillars = [
    { id: 'celebrate', name: 'Celebrate', icon: '🎂', path: '/celebrate', color: 'from-pink-400 to-rose-500', desc: 'Birthdays & parties' },
    { id: 'dine', name: 'Dine', icon: '🍽️', path: '/dine', color: 'from-amber-400 to-orange-500', desc: 'Pet-friendly dining' },
    { id: 'stay', name: 'Stay', icon: '🏨', path: '/stay', color: 'from-blue-400 to-indigo-500', desc: 'Boarding & daycare' },
    { id: 'travel', name: 'Travel', icon: '✈️', path: '/travel', color: 'from-cyan-400 to-blue-500', desc: 'Pet travel services' },
    { id: 'care', name: 'Care', icon: '💊', path: '/care', color: 'from-red-400 to-rose-500', desc: 'Health & wellness' },
    { id: 'enjoy', name: 'Enjoy', icon: '🎾', path: '/enjoy', color: 'from-violet-400 to-purple-500', desc: 'Activities & fun' },
    { id: 'fit', name: 'Fit', icon: '🏃', path: '/fit', color: 'from-green-400 to-emerald-500', desc: 'Fitness & exercise' },
    { id: 'learn', name: 'Learn', icon: '🎓', path: '/learn', color: 'from-teal-400 to-cyan-500', desc: 'Training & courses' },
    { id: 'paperwork', name: 'Paperwork', icon: '📄', path: '/paperwork', color: 'from-slate-400 to-gray-500', desc: 'Documents & KCI' },
    { id: 'advisory', name: 'Advisory', icon: '📋', path: '/advisory', color: 'from-indigo-400 to-blue-500', desc: 'Expert consultations' },
    { id: 'emergency', name: 'Emergency', icon: '🚨', path: '/emergency', color: 'from-red-500 to-rose-600', desc: '24/7 emergency help' },
    { id: 'farewell', name: 'Farewell', icon: '🌈', path: '/farewell', color: 'from-purple-400 to-pink-500', desc: 'Memorial services' },
    { id: 'adopt', name: 'Adopt', icon: '🐾', path: '/adopt', color: 'from-orange-400 to-amber-500', desc: 'Pet adoption' },
    { id: 'shop', name: 'Shop', icon: '🛒', path: '/shop', color: 'from-emerald-400 to-teal-500', desc: 'Products & supplies' }
  ];

  return (
    <div className="animate-in fade-in-50 duration-300">
      <Card className="p-6 bg-gradient-to-br from-slate-50 to-white">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">All Pet Life Services</h3>
            <p className="text-sm text-gray-500">Access all 14 pillars of pet life with your Pet Pass</p>
          </div>
        </div>
        
        {/* Service Pillars Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {pillars.map((pillar) => (
            <button
              key={pillar.id}
              onClick={() => navigate(pillar.path)}
              className="group p-4 bg-white rounded-xl border-2 border-gray-100 hover:border-purple-300 hover:shadow-lg transition-all text-center"
            >
              <div className={`w-14 h-14 mx-auto rounded-xl bg-gradient-to-br ${pillar.color} flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform shadow-md`}>
                {pillar.icon}
              </div>
              <p className="font-semibold text-gray-900 mb-1">{pillar.name}</p>
              <p className="text-xs text-gray-500">{pillar.desc}</p>
            </button>
          ))}
        </div>
        
        {/* Quick Service Links */}
        <div className="mt-8 pt-6 border-t">
          <h4 className="font-semibold text-gray-900 mb-4">Quick Actions</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" onClick={() => navigate('/care')} className="justify-start">
              <Stethoscope className="w-4 h-4 mr-2" /> Book Vet Visit
            </Button>
            <Button variant="outline" onClick={() => navigate('/stay')} className="justify-start">
              <Home className="w-4 h-4 mr-2" /> Find Boarding
            </Button>
            <Button variant="outline" onClick={() => navigate('/celebrate')} className="justify-start">
              <Cake className="w-4 h-4 mr-2" /> Order Cake
            </Button>
            <Button variant="outline" onClick={() => navigate('/emergency')} className="justify-start text-red-600 border-red-200 hover:bg-red-50">
              🚨 Emergency Help
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ServicesTab;
