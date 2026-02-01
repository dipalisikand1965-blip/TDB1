import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { PawPrint, Stethoscope, Sparkles } from 'lucide-react';
import PetAvatar from '../../PetAvatar';

const PetsTab = ({ pets }) => {
  const navigate = useNavigate();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">My Pets</h3>
        <Button onClick={() => navigate('/my-pets')}>Manage Pets</Button>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {pets.map(pet => (
          <Card key={pet.id} className="p-6 relative overflow-hidden group hover:border-purple-300 transition-colors">
            <div className="flex items-center gap-4">
              <PetAvatar pet={pet} size="lg" />
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">{pet.name}</h3>
                <p className="text-gray-600">{pet.breed} • {pet.age_years || '?'} years</p>
                {pet.soul?.persona && <Badge className="mt-2 bg-purple-100 text-purple-700 hover:bg-purple-200 border-none">{pet.soul.persona}</Badge>}
              </div>
            </div>
            
            {/* Soul Score Progress */}
            <div className="mt-4 bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-600">Soul Score</span>
                <span className="text-xs font-bold text-purple-600">{Math.min(100, Math.round(pet.overall_score || 0))}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, pet.overall_score || 0)}%` }}
                />
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="p-3 bg-orange-50 rounded-lg">
                <p className="text-xs text-orange-600 font-semibold uppercase mb-1">Birthday</p>
                <p className="font-medium text-gray-900 text-sm">{pet.birth_date || 'Not set'}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-600 font-semibold uppercase mb-1">Gotcha Day</p>
                <p className="font-medium text-gray-900 text-sm">{pet.gotcha_date || 'Not set'}</p>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="mt-4 flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 text-green-700 border-green-200 hover:bg-green-50"
                onClick={() => navigate(`/pet-vault/${pet.id}`)}
              >
                <Stethoscope className="w-4 h-4 mr-1" /> Health Vault
              </Button>
              <Button 
                size="sm" 
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                onClick={() => navigate(`/pet/${pet.id}`)}
              >
                <Sparkles className="w-4 h-4 mr-1" /> Pet Soul
              </Button>
            </div>
          </Card>
        ))}
        
        <Card 
          className="p-6 flex flex-col items-center justify-center border-dashed border-2 cursor-pointer hover:bg-gray-50 transition-colors min-h-[200px]"
          onClick={() => navigate('/my-pets')}
        >
          <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4">
            <PawPrint className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="font-semibold text-lg text-gray-900">Add New Pet</h3>
          <p className="text-gray-500 text-sm text-center mt-1">Create a profile for your furry friend</p>
        </Card>
      </div>
    </div>
  );
};

export default PetsTab;
