/**
 * MultiPetSelector.jsx
 * Multi-pet selection component for services and bookings
 * Allows users to select one, multiple, or all pets for a service
 */

import React from 'react';
import { CheckCircle, PawPrint, Users } from 'lucide-react';
import { Badge } from './ui/badge';
import { getPetPhotoUrl } from '../utils/petAvatar';

const MultiPetSelector = ({
  userPets = [],
  selectedPets = [], // Array of selected pet objects or IDs
  onPetToggle, // (pet) => void - toggle single pet
  onSelectAll, // () => void - select all pets
  onClearAll, // () => void - deselect all
  multiSelect = true, // Allow multi-select (false = single select)
  compact = false,
  pillarColor = 'teal',
  showSelectAll = true,
  label = "Select Pet(s) for This Service"
}) => {
  // Normalize selectedPets to array of IDs
  const selectedIds = selectedPets.map(p => typeof p === 'string' ? p : (p?.id || p?._id));
  
  const isSelected = (pet) => selectedIds.includes(pet.id || pet._id);
  const allSelected = userPets.length > 0 && selectedIds.length === userPets.length;
  
  const colorClasses = {
    teal: {
      selected: 'border-teal-500 bg-teal-50',
      hover: 'hover:border-teal-200',
      check: 'text-teal-600',
      badge: 'bg-teal-100 text-teal-700'
    },
    rose: {
      selected: 'border-rose-500 bg-rose-50',
      hover: 'hover:border-rose-200',
      check: 'text-rose-600',
      badge: 'bg-rose-100 text-rose-700'
    },
    purple: {
      selected: 'border-purple-500 bg-purple-50',
      hover: 'hover:border-purple-200',
      check: 'text-purple-600',
      badge: 'bg-purple-100 text-purple-700'
    },
    amber: {
      selected: 'border-amber-500 bg-amber-50',
      hover: 'hover:border-amber-200',
      check: 'text-amber-600',
      badge: 'bg-amber-100 text-amber-700'
    },
    blue: {
      selected: 'border-blue-500 bg-blue-50',
      hover: 'hover:border-blue-200',
      check: 'text-blue-600',
      badge: 'bg-blue-100 text-blue-700'
    },
    emerald: {
      selected: 'border-emerald-500 bg-emerald-50',
      hover: 'hover:border-emerald-200',
      check: 'text-emerald-600',
      badge: 'bg-emerald-100 text-emerald-700'
    }
  };
  
  const colors = colorClasses[pillarColor] || colorClasses.teal;

  if (userPets.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-xl text-center">
        <PawPrint className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">
          Sign in to select from your pets, or we'll ask when we contact you.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Label & Select All */}
      <div className="flex items-center justify-between">
        <label className="font-semibold text-sm text-gray-700">{label}</label>
        {multiSelect && showSelectAll && userPets.length > 1 && (
          <button
            type="button"
            onClick={allSelected ? onClearAll : onSelectAll}
            className={`text-xs font-medium px-2 py-1 rounded-full transition-colors ${colors.badge}`}
          >
            <Users className="w-3 h-3 inline mr-1" />
            {allSelected ? 'Clear All' : 'Select All'}
          </button>
        )}
      </div>
      
      {/* Pet Selection Grid */}
      <div className={`grid ${compact ? 'grid-cols-2 gap-2' : 'grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3'}`}>
        {userPets.map((pet) => {
          const selected = isSelected(pet);
          return (
            <button
              key={pet.id || pet._id}
              type="button"
              onClick={() => onPetToggle(pet)}
              className={`p-2 sm:p-3 rounded-xl border-2 text-left flex items-center gap-2 sm:gap-3 transition-all ${
                selected ? colors.selected : `border-gray-200 ${colors.hover}`
              }`}
              data-testid={`pet-select-${pet.name?.toLowerCase()}`}
            >
              {/* Pet Photo */}
              <img 
                src={getPetPhotoUrl(pet)} 
                alt={pet.name}
                className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} rounded-full object-cover flex-shrink-0`}
              />
              
              {/* Pet Info */}
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${compact ? 'text-xs' : 'text-sm'}`}>{pet.name}</p>
                <p className={`text-gray-500 truncate ${compact ? 'text-[10px]' : 'text-xs'}`}>{pet.breed}</p>
              </div>
              
              {/* Selection Indicator */}
              {selected && (
                <CheckCircle className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} ${colors.check} flex-shrink-0`} />
              )}
            </button>
          );
        })}
      </div>
      
      {/* Selected Count */}
      {multiSelect && selectedIds.length > 0 && (
        <div className={`text-xs ${colors.check} flex items-center gap-1`}>
          <CheckCircle className="w-3 h-3" />
          {selectedIds.length} pet{selectedIds.length > 1 ? 's' : ''} selected
          {selectedIds.length > 1 && (
            <Badge variant="outline" className="ml-2 text-[10px]">
              Multi-booking
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiPetSelector;
