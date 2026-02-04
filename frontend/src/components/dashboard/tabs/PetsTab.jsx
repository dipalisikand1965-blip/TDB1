import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { PawPrint, Stethoscope, Sparkles, Plus, Calendar, Heart } from 'lucide-react';
import PetAvatar from '../../PetAvatar';

const PetsTab = ({ pets }) => {
  const navigate = useNavigate();

  // Get milestone badge based on soul score
  const getMilestoneBadge = (score) => {
    if (score >= 90) return { label: '👑 Soul Master', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
    if (score >= 75) return { label: '🛡️ Guardian', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' };
    if (score >= 50) return { label: '🧭 Explorer', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
    if (score >= 25) return { label: '🔍 Seeker', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
    return { label: '✨ Awakened', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' };
  };

  return (
    <div className="animate-in fade-in-50 duration-300" data-testid="pets-tab">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-white">My Pets</h3>
          <p className="text-sm text-slate-400">{pets.length} pet{pets.length !== 1 ? 's' : ''} in your family</p>
        </div>
        <Button 
          onClick={() => navigate('/my-pets')}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
        >
          <PawPrint className="w-4 h-4 mr-2" />
          Manage Pets
        </Button>
      </div>
      
      {/* Pets Grid - Mobile: 1 col, Desktop: 2 cols */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {pets.map(pet => {
          const score = Math.round(pet.overall_score || 0);
          const milestone = getMilestoneBadge(score);
          
          return (
            <Card 
              key={pet.id} 
              className="p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl hover:border-purple-500/30 transition-all"
              data-testid={`pet-card-${pet.id}`}
            >
              {/* Pet Header */}
              <div className="flex items-center gap-3 sm:gap-4">
                <PetAvatar pet={pet} size="lg" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-bold text-white truncate">{pet.name}</h3>
                  <p className="text-slate-400 text-sm truncate">{pet.breed || 'Unknown breed'} • {pet.age_years || '?'} years</p>
                  {pet.soul?.persona && (
                    <Badge className="mt-1.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs">
                      {pet.soul.persona}
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Soul Score Progress */}
              <div className="mt-4 bg-slate-800/50 rounded-xl p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-400">Pet Soul™ Score</span>
                  <Badge className={`text-xs ${milestone.color} border`}>
                    {milestone.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2.5 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, score)}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-purple-400 w-10 text-right">{score}%</span>
                </div>
              </div>
              
              {/* Date Info - Responsive grid */}
              <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
                <div className="p-2.5 sm:p-3 bg-orange-500/10 rounded-xl border border-orange-500/20">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Calendar className="w-3 h-3 text-orange-400" />
                    <p className="text-[10px] sm:text-xs text-orange-400 font-semibold uppercase">Birthday</p>
                  </div>
                  <p className="font-medium text-white text-xs sm:text-sm truncate">{pet.birth_date || 'Not set'}</p>
                </div>
                <div className="p-2.5 sm:p-3 bg-pink-500/10 rounded-xl border border-pink-500/20">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Heart className="w-3 h-3 text-pink-400" />
                    <p className="text-[10px] sm:text-xs text-pink-400 font-semibold uppercase">Gotcha Day</p>
                  </div>
                  <p className="font-medium text-white text-xs sm:text-sm truncate">{pet.gotcha_date || 'Not set'}</p>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50"
                  onClick={() => navigate(`/pet-vault/${pet.id}`)}
                >
                  <Stethoscope className="w-4 h-4 mr-1.5" /> Health Vault
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
                  onClick={() => navigate(`/pet/${pet.id}`)}
                >
                  <Sparkles className="w-4 h-4 mr-1.5" /> Pet Soul™
                </Button>
              </div>
            </Card>
          );
        })}
        
        {/* Add New Pet Card */}
        <Card 
          className="p-6 flex flex-col items-center justify-center bg-slate-900/30 border-2 border-dashed border-white/10 hover:border-purple-500/30 cursor-pointer transition-all rounded-2xl min-h-[200px]"
          onClick={() => navigate('/my-pets')}
          data-testid="add-pet-card"
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-4">
            <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
          </div>
          <h3 className="font-semibold text-base sm:text-lg text-white">Add New Pet</h3>
          <p className="text-slate-400 text-xs sm:text-sm text-center mt-1">Create a profile for your furry friend</p>
        </Card>
      </div>
    </div>
  );
};

export default PetsTab;
