import React from 'react';
import { Card } from './ui/card';
import { PawPrint, Crown, Calendar, Shield } from 'lucide-react';
import { resolvePetAvatar } from '../utils/petAvatar';

/**
 * Digital Pet Pass Card Component
 * Shows the pet's unique Pet Pass identity card with:
 * - Pet name & photo
 * - Pet Pass number
 * - Plan type (Trial/Foundation)
 * - Validity dates
 * - The Doggy Company branding
 */
const PetPassCard = ({ pet, className = '' }) => {
  if (!pet) return null;

  const {
    name,
    pet_pass_number,
    pet_pass_status = 'pending',
    pet_pass_plan = 'trial',
    pet_pass_activated_at,
    pet_pass_expires
  } = pet;
  
  // Use centralized avatar resolver
  const { photoUrl, needsUpload } = resolvePetAvatar(pet);

  // Format dates
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  // Status colors
  const statusColors = {
    active: 'bg-green-100 text-green-700 border-green-200',
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    expired: 'bg-red-100 text-red-700 border-red-200',
    trial: 'bg-blue-100 text-blue-700 border-blue-200'
  };

  const isFoundation = pet_pass_plan === 'foundation' || pet_pass_plan === 'annual';

  return (
    <Card className={`relative overflow-hidden ${className}`}>
      {/* Background gradient */}
      <div className={`absolute inset-0 ${isFoundation ? 'bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700' : 'bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800'}`} />
      
      {/* Pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 right-4 w-32 h-32 rounded-full border-4 border-white/30"></div>
        <div className="absolute bottom-4 left-4 w-20 h-20 rounded-full border-4 border-white/20"></div>
      </div>

      {/* Card content */}
      <div className="relative p-6 text-white">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <PawPrint className="w-6 h-6 text-yellow-300" />
            <span className="font-bold text-lg tracking-wide">Pet Pass</span>
          </div>
          <div className={`px-2 py-0.5 rounded text-xs font-semibold ${isFoundation ? 'bg-yellow-400 text-yellow-900' : 'bg-white/20 text-white'}`}>
            {isFoundation ? 'FOUNDATION' : 'TRIAL'}
          </div>
        </div>

        {/* Pet Info */}
        <div className="flex gap-4 mb-4">
          {/* Pet Photo - using centralized avatar */}
          <div className="w-20 h-20 rounded-xl overflow-hidden bg-white/20 flex-shrink-0 border-2 border-white/30">
            <img 
              src={photoUrl} 
              alt={name} 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '';
              }}
            />
          </div>
          
          {/* Pet Details */}
          <div className="flex-1 min-w-0">
            <h3 className="text-2xl font-bold truncate">{name || 'Your Pet'}</h3>
            <p className="text-white/70 text-sm mt-1">Member since {formatDate(pet_pass_activated_at)}</p>
            
            {/* Status badge */}
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-2 ${statusColors[pet_pass_status] || statusColors.pending}`}>
              <Shield className="w-3 h-3" />
              {pet_pass_status?.toUpperCase() || 'PENDING'}
            </div>
          </div>
        </div>

        {/* Pet Pass Number */}
        <div className="bg-white/10 rounded-lg p-3 mb-4">
          <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Pet Pass Number</p>
          <p className="font-mono text-xl font-bold tracking-wider">
            {pet_pass_number || 'TDC-XXXXXX'}
          </p>
        </div>

        {/* Validity */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-white/70">
            <Calendar className="w-4 h-4" />
            <span>Valid until</span>
          </div>
          <span className="font-semibold">{formatDate(pet_pass_expires)}</span>
        </div>

        {/* Footer - Branding */}
        <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
          <div className="text-xs text-white/50">
            The Doggy Company
          </div>
          {isFoundation && (
            <Crown className="w-5 h-5 text-yellow-400" />
          )}
        </div>
      </div>
    </Card>
  );
};

export default PetPassCard;
