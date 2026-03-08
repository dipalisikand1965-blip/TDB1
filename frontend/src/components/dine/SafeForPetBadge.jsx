/**
 * SafeForPetBadge.jsx
 * 
 * VISION: "Safe for [Pet]" Badge System
 * Every product on the Dine page should show whether it's safe 
 * for the selected pet based on their allergies and sensitivities.
 * 
 * Badge States:
 * - ✅ Safe for [Pet] - Green badge
 * - ⚠️ Contains sensitivity - Yellow warning
 * - 🚫 Contains allergen - Red alert (should not buy)
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Shield, ShieldAlert, ShieldX, AlertTriangle, Check, X, Info } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

// Common food allergens and ingredients mapping
const INGREDIENT_ALIASES = {
  'chicken': ['chicken', 'poultry', 'fowl'],
  'beef': ['beef', 'cattle', 'bovine'],
  'pork': ['pork', 'pig', 'swine'],
  'fish': ['fish', 'salmon', 'tuna', 'cod', 'sardine', 'anchovy'],
  'dairy': ['milk', 'cheese', 'cream', 'butter', 'lactose', 'whey', 'casein'],
  'egg': ['egg', 'eggs', 'albumin'],
  'wheat': ['wheat', 'flour', 'gluten', 'bread'],
  'soy': ['soy', 'soya', 'soybean', 'tofu'],
  'corn': ['corn', 'maize'],
  'lamb': ['lamb', 'sheep', 'mutton'],
  'grain': ['grain', 'cereal', 'rice', 'oat', 'barley', 'wheat'],
};

const SafeForPetBadge = ({ 
  product, 
  pet, 
  petSoulData,
  size = 'default', // 'small', 'default', 'large'
  showDetails = true,
  className = ''
}) => {
  // Extract pet's dietary restrictions
  const restrictions = useMemo(() => {
    if (!pet && !petSoulData) return { allergies: [], sensitivities: [] };
    
    const soulData = petSoulData?.answers || petSoulData?.soul_profile || pet?.soul_data || {};
    
    // Get allergies
    let allergies = pet?.allergies || soulData.allergies || [];
    if (typeof allergies === 'string') {
      allergies = allergies.split(',').map(a => a.trim().toLowerCase()).filter(Boolean);
    } else if (Array.isArray(allergies)) {
      allergies = allergies.map(a => (typeof a === 'string' ? a.toLowerCase() : '')).filter(Boolean);
    }
    
    // Get sensitivities
    let sensitivities = pet?.sensitivities || soulData.sensitivities || [];
    if (typeof sensitivities === 'string') {
      sensitivities = sensitivities.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    } else if (Array.isArray(sensitivities)) {
      sensitivities = sensitivities.map(s => (typeof s === 'string' ? s.toLowerCase() : '')).filter(Boolean);
    }
    
    return { allergies, sensitivities };
  }, [pet, petSoulData]);
  
  // Get product ingredients
  const productIngredients = useMemo(() => {
    if (!product) return [];
    
    let ingredients = product.ingredients || product.tags || [];
    
    // Also check product name and description for common ingredients
    const nameAndDesc = `${product.name || ''} ${product.description || ''}`.toLowerCase();
    
    // Add ingredients based on product name/description
    Object.entries(INGREDIENT_ALIASES).forEach(([key, aliases]) => {
      if (aliases.some(alias => nameAndDesc.includes(alias))) {
        ingredients.push(key);
      }
    });
    
    if (typeof ingredients === 'string') {
      ingredients = ingredients.split(',').map(i => i.trim().toLowerCase());
    } else if (Array.isArray(ingredients)) {
      ingredients = ingredients.map(i => (typeof i === 'string' ? i.toLowerCase() : '')).filter(Boolean);
    }
    
    return [...new Set(ingredients)]; // Remove duplicates
  }, [product]);
  
  // Check safety
  const safetyCheck = useMemo(() => {
    const { allergies, sensitivities } = restrictions;
    
    // If no restrictions, it's safe
    if (allergies.length === 0 && sensitivities.length === 0) {
      return { 
        status: 'safe', 
        allergensFound: [], 
        sensitivitiesFound: [],
        message: 'No dietary restrictions set'
      };
    }
    
    // Check for allergens
    const allergensFound = [];
    allergies.forEach(allergy => {
      // Check direct match and aliases
      const aliases = INGREDIENT_ALIASES[allergy] || [allergy];
      aliases.forEach(alias => {
        if (productIngredients.some(ing => ing.includes(alias) || alias.includes(ing))) {
          if (!allergensFound.includes(allergy)) {
            allergensFound.push(allergy);
          }
        }
      });
    });
    
    // Check for sensitivities
    const sensitivitiesFound = [];
    sensitivities.forEach(sensitivity => {
      const aliases = INGREDIENT_ALIASES[sensitivity] || [sensitivity];
      aliases.forEach(alias => {
        if (productIngredients.some(ing => ing.includes(alias) || alias.includes(ing))) {
          if (!sensitivitiesFound.includes(sensitivity)) {
            sensitivitiesFound.push(sensitivity);
          }
        }
      });
    });
    
    if (allergensFound.length > 0) {
      return {
        status: 'danger',
        allergensFound,
        sensitivitiesFound,
        message: `Contains ${allergensFound.join(', ')} - NOT SAFE`
      };
    }
    
    if (sensitivitiesFound.length > 0) {
      return {
        status: 'warning',
        allergensFound,
        sensitivitiesFound,
        message: `May contain ${sensitivitiesFound.join(', ')}`
      };
    }
    
    return {
      status: 'safe',
      allergensFound: [],
      sensitivitiesFound: [],
      message: 'Safe based on dietary profile'
    };
  }, [restrictions, productIngredients]);
  
  const petName = pet?.name || 'your pet';
  
  // Size configurations
  const sizeConfig = {
    small: {
      badge: 'text-[10px] px-1.5 py-0.5',
      icon: 'w-3 h-3',
      text: 'text-xs'
    },
    default: {
      badge: 'text-xs px-2 py-1',
      icon: 'w-4 h-4',
      text: 'text-sm'
    },
    large: {
      badge: 'text-sm px-3 py-1.5',
      icon: 'w-5 h-5',
      text: 'text-base'
    }
  };
  
  const config = sizeConfig[size] || sizeConfig.default;
  
  // Render based on status
  const renderBadge = () => {
    switch (safetyCheck.status) {
      case 'danger':
        return (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <Badge className={`bg-red-500 text-white ${config.badge} ${className}`}>
              <ShieldX className={`${config.icon} mr-1`} />
              {size !== 'small' && `Not Safe for ${petName}`}
              {size === 'small' && '⚠️ Allergen'}
            </Badge>
          </motion.div>
        );
        
      case 'warning':
        return (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <Badge className={`bg-yellow-500 text-white ${config.badge} ${className}`}>
              <AlertTriangle className={`${config.icon} mr-1`} />
              {size !== 'small' && 'Caution'}
              {size === 'small' && '⚡'}
            </Badge>
          </motion.div>
        );
        
      case 'safe':
      default:
        return (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <Badge className={`bg-green-500 text-white ${config.badge} ${className}`}>
              <Shield className={`${config.icon} mr-1`} />
              {size !== 'small' && `Safe for ${petName}`}
              {size === 'small' && '✓ Safe'}
            </Badge>
          </motion.div>
        );
    }
  };
  
  // If showDetails, wrap in tooltip
  if (showDetails) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {renderBadge()}
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[200px]">
            <div className="space-y-1">
              <p className={`font-medium ${config.text}`}>{safetyCheck.message}</p>
              
              {safetyCheck.allergensFound.length > 0 && (
                <div className="flex items-center gap-1 text-red-600">
                  <X className="w-3 h-3" />
                  <span className="text-xs">Allergens: {safetyCheck.allergensFound.join(', ')}</span>
                </div>
              )}
              
              {safetyCheck.sensitivitiesFound.length > 0 && (
                <div className="flex items-center gap-1 text-yellow-600">
                  <AlertTriangle className="w-3 h-3" />
                  <span className="text-xs">Sensitivities: {safetyCheck.sensitivitiesFound.join(', ')}</span>
                </div>
              )}
              
              {safetyCheck.status === 'safe' && restrictions.allergies.length > 0 && (
                <div className="flex items-center gap-1 text-green-600">
                  <Check className="w-3 h-3" />
                  <span className="text-xs">No conflicts with {petName}'s diet</span>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return renderBadge();
};

export default SafeForPetBadge;
