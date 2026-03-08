/**
 * TummyProfileDashboard.jsx
 * 
 * Shows a pet's digestive profile at a glance - what they love,
 * what they're sensitive to, and what to avoid.
 * 
 * VISION: Pet parents should feel like they have a personal nutritionist
 * who knows their pet's tummy better than they do.
 * 
 * This component appears at the top of the Dine pillar and
 * drives personalized product filtering.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, AlertTriangle, Ban, Target, Sparkles, 
  ChevronRight, Edit2, Check, Info
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

const TummyProfileDashboard = ({ pet, onEditProfile, compact = false }) => {
  const [isExpanded, setIsExpanded] = useState(!compact);
  
  if (!pet) return null;
  
  // Extract dietary information from pet soul data
  const soulData = pet.soul_data || pet.doggy_soul_answers || {};
  const allergies = pet.allergies || soulData.allergies || [];
  const favorites = pet.favorite_treats || soulData.favorite_treats || soulData.treats || [];
  const sensitivities = pet.sensitivities || soulData.sensitivities || [];
  const dietaryGoals = pet.dietary_goals || soulData.dietary_goals || [];
  
  // Parse string data if needed
  const parseList = (data) => {
    if (Array.isArray(data)) return data;
    if (typeof data === 'string') return data.split(',').map(s => s.trim()).filter(Boolean);
    return [];
  };
  
  const allergyList = parseList(allergies);
  const favoriteList = parseList(favorites);
  const sensitivityList = parseList(sensitivities);
  
  // Determine diet type from soul data
  const getDietType = () => {
    const answers = soulData;
    if (answers.diet_type) return answers.diet_type;
    if (answers.food_preference) return answers.food_preference;
    return 'Standard';
  };
  
  const petName = pet.name || 'Your pet';
  
  // Compact view for other pages
  if (compact && !isExpanded) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-3 border border-emerald-200"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <span className="text-lg">🍖</span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-800">{petName}'s Tummy Profile</span>
              {allergyList.length > 0 && (
                <span className="ml-2 text-xs text-red-600 font-medium">
                  ⚠️ {allergyList.length} allergen{allergyList.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsExpanded(true)}
            className="text-emerald-700"
          >
            View <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="bg-gradient-to-br from-emerald-50 via-white to-teal-50 border-emerald-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-emerald-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">🍖</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  {petName}'s Tummy Profile
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm">Products are filtered based on this profile</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </h3>
                <p className="text-sm text-gray-500">Personalized nutrition insights</p>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={onEditProfile}
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              <Edit2 className="w-4 h-4 mr-1" />
              Update
            </Button>
          </div>
        </div>
        
        {/* Content Grid */}
        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Loves - What they enjoy */}
            <div className="bg-white rounded-xl p-4 border border-emerald-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Heart className="w-4 h-4 text-green-600 fill-green-200" />
                </div>
                <span className="font-semibold text-gray-800">Loves</span>
              </div>
              
              {favoriteList.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {favoriteList.slice(0, 4).map((item, idx) => (
                    <Badge 
                      key={idx} 
                      variant="secondary"
                      className="bg-green-100 text-green-800 text-xs"
                    >
                      ✓ {item}
                    </Badge>
                  ))}
                  {favoriteList.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{favoriteList.length - 4} more
                    </Badge>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">Not specified yet</p>
              )}
            </div>
            
            {/* Sensitive - Mild issues */}
            <div className="bg-white rounded-xl p-4 border border-amber-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <span className="font-semibold text-gray-800">Sensitive</span>
              </div>
              
              {sensitivityList.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {sensitivityList.map((item, idx) => (
                    <Badge 
                      key={idx} 
                      variant="secondary"
                      className="bg-amber-100 text-amber-800 text-xs"
                    >
                      ⚠️ {item}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">None known</p>
              )}
            </div>
            
            {/* Allergic - Must avoid */}
            <div className={`rounded-xl p-4 border shadow-sm ${
              allergyList.length > 0 
                ? 'bg-red-50 border-red-200' 
                : 'bg-white border-gray-100'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  allergyList.length > 0 ? 'bg-red-200' : 'bg-gray-100'
                }`}>
                  <Ban className={`w-4 h-4 ${allergyList.length > 0 ? 'text-red-600' : 'text-gray-400'}`} />
                </div>
                <span className="font-semibold text-gray-800">Allergic</span>
                {allergyList.length > 0 && (
                  <Badge className="bg-red-500 text-white text-xs ml-auto">
                    AVOID
                  </Badge>
                )}
              </div>
              
              {allergyList.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {allergyList.map((item, idx) => (
                    <Badge 
                      key={idx} 
                      variant="secondary"
                      className="bg-red-200 text-red-800 text-xs font-medium"
                    >
                      🚫 {item}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No known allergies ✓</p>
              )}
            </div>
            
            {/* Goal - Dietary objective */}
            <div className="bg-white rounded-xl p-4 border border-blue-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Target className="w-4 h-4 text-blue-600" />
                </div>
                <span className="font-semibold text-gray-800">Goal</span>
              </div>
              
              <div className="flex flex-wrap gap-1.5">
                <Badge 
                  variant="secondary"
                  className="bg-blue-100 text-blue-800 text-xs"
                >
                  🎯 {getDietType()}
                </Badge>
                {dietaryGoals.length > 0 && dietaryGoals.map((goal, idx) => (
                  <Badge 
                    key={idx}
                    variant="outline"
                    className="text-xs"
                  >
                    {goal}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          
          {/* Smart Tip */}
          <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-purple-800 font-medium">Mira's Tip</p>
                <p className="text-xs text-purple-600">
                  {allergyList.length > 0 
                    ? `All products shown are filtered to exclude ${allergyList.join(', ')}. Look for the "Safe for ${petName}" badge!`
                    : `Complete ${petName}'s tummy profile to get personalized product recommendations and allergy-safe filtering.`
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Collapse button for expanded view */}
        {compact && isExpanded && (
          <div className="px-4 pb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsExpanded(false)}
              className="w-full text-gray-500"
            >
              Collapse
            </Button>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default TummyProfileDashboard;
