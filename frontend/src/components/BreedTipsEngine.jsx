/**
 * BreedTipsEngine Component
 * Smart breed-specific tips based on the pet's breed
 * Features:
 * - Uses backend API with 50+ breeds database
 * - Category-based tips (nutrition, exercise, grooming, health)
 * - Breed-specific recommendations based on size, energy, coat, health tendencies
 */

import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Lightbulb, ChevronRight, RefreshCw, Heart, 
  Apple, Dumbbell, Scissors, Stethoscope, Loader2
} from 'lucide-react';
import { API_URL } from '../utils/api';

const CATEGORY_CONFIG = {
  nutrition: { icon: Apple, color: 'text-green-500', bg: 'bg-green-100', label: 'Nutrition' },
  exercise: { icon: Dumbbell, color: 'text-orange-500', bg: 'bg-orange-100', label: 'Exercise' },
  grooming: { icon: Scissors, color: 'text-purple-500', bg: 'bg-purple-100', label: 'Grooming' },
  health: { icon: Stethoscope, color: 'text-red-500', bg: 'bg-red-100', label: 'Health' }
};

const BreedTipsEngine = ({ pet }) => {
  const [currentCategory, setCurrentCategory] = useState('nutrition');
  const [tipIndex, setTipIndex] = useState(0);
  const [breedData, setBreedData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Fetch breed-specific tips from API
  useEffect(() => {
    const fetchBreedTips = async () => {
      if (!pet?.breed) {
        setLoading(false);
        return;
      }
      
      try {
        const res = await fetch(`${API_URL}/api/breed/tips?breed=${encodeURIComponent(pet.breed)}`);
        if (res.ok) {
          const data = await res.json();
          setBreedData(data);
        }
      } catch (err) {
        console.error('Error fetching breed tips:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBreedTips();
  }, [pet?.breed]);
  
  // Get tips for current category
  const tips = breedData?.tips?.[currentCategory] || [];
  const currentTip = tips[tipIndex] || 'No tips available for this category';
  
  // Rotate tip daily based on date
  useEffect(() => {
    if (tips.length > 0) {
      const today = new Date().getDate();
      setTipIndex(today % tips.length);
    }
  }, [currentCategory, tips.length]);
  
  const nextTip = () => {
    setTipIndex((prev) => (prev + 1) % Math.max(1, tips.length));
  };
  
  if (loading) {
    return (
      <Card className="p-5 bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200">
        <div className="flex items-center justify-center gap-2 py-4">
          <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
          <span className="text-amber-600">Loading breed tips...</span>
        </div>
      </Card>
    );
  }
  
  if (!pet?.breed || !breedData) {
    return null;
  }
  
  const CategoryIcon = CATEGORY_CONFIG[currentCategory].icon;
  const characteristics = breedData.characteristics || {};
  
  return (
    <Card className="p-5 bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200" data-testid="breed-tips-engine">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Breed Tips</h3>
            <p className="text-sm text-gray-500">For {breedData.breed || pet.breed}</p>
          </div>
        </div>
        <div className="flex gap-1 flex-wrap justify-end">
          {characteristics.size && (
            <Badge className="bg-blue-100 text-blue-700 text-xs">{characteristics.size}</Badge>
          )}
          {characteristics.energy_level && (
            <Badge className="bg-orange-100 text-orange-700 text-xs">{characteristics.energy_level} energy</Badge>
          )}
        </div>
      </div>
      
      {/* Category Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
          const Icon = config.icon;
          const isActive = currentCategory === key;
          const tipCount = breedData?.tips?.[key]?.length || 0;
          return (
            <button
              key={key}
              onClick={() => { setCurrentCategory(key); setTipIndex(0); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                isActive 
                  ? `${config.bg} ${config.color}` 
                  : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {config.label}
              {tipCount > 0 && <span className="text-xs opacity-60">({tipCount})</span>}
            </button>
          );
        })}
      </div>
      
      {/* Tip Card */}
      <div className={`p-4 rounded-xl ${CATEGORY_CONFIG[currentCategory].bg}`}>
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-lg bg-white flex items-center justify-center ${CATEGORY_CONFIG[currentCategory].color}`}>
            <CategoryIcon className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <p className="text-gray-800 font-medium">{currentTip}</p>
            <p className="text-xs text-gray-500 mt-2">
              Tip {tipIndex + 1} of {tips.length} • {CATEGORY_CONFIG[currentCategory].label}
            </p>
          </div>
        </div>
      </div>
      
      {/* Health Alerts */}
      {(characteristics.is_brachycephalic || characteristics.prone_to_hip_dysplasia || characteristics.prone_to_obesity) && (
        <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center gap-2 text-red-700 text-sm">
            <Heart className="w-4 h-4" />
            <span className="font-medium">Health Considerations:</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {characteristics.is_brachycephalic && (
              <Badge className="bg-red-100 text-red-700 text-xs">Brachycephalic (flat-faced)</Badge>
            )}
            {characteristics.prone_to_hip_dysplasia && (
              <Badge className="bg-red-100 text-red-700 text-xs">Hip dysplasia prone</Badge>
            )}
            {characteristics.prone_to_obesity && (
              <Badge className="bg-red-100 text-red-700 text-xs">Obesity prone</Badge>
            )}
            {characteristics.prone_to_skin_issues && (
              <Badge className="bg-red-100 text-red-700 text-xs">Skin issues prone</Badge>
            )}
          </div>
        </div>
      )}
      
      {/* Actions */}
      <div className="flex items-center justify-between mt-4">
        <button 
          onClick={nextTip}
          className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700"
          disabled={tips.length <= 1}
        >
          <RefreshCw className="w-4 h-4" /> Next Tip
        </button>
        <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700 hover:bg-amber-100">
          View All Tips <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </Card>
  );
};

export default BreedTipsEngine;
