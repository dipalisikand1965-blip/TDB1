/**
 * CuratedBundles.jsx
 * Displays pre-made product bundles for each pillar
 * Part of the "Golden Standard" page layout
 */

import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Package, Sparkles, Star, ChevronRight, ShoppingCart, 
  Gift, Check, Loader2 
} from 'lucide-react';
import { API_URL } from '../utils/api';
import { useCart } from '../context/CartContext';
import { usePillarContext } from '../context/PillarContext';
import { toast } from '../hooks/use-toast';
import { getBundleIntro, getArchetypeDisplayInfo } from '../utils/archetypeCopy';

// Bundle configurations per pillar
const PILLAR_BUNDLES = {
  celebrate: [
    {
      id: 'celebrate-birthday-bundle',
      name: 'Birthday Pawty Bundle',
      description: 'Everything for the perfect birthday celebration',
      items: ['Party Hat', 'Birthday Bandana', 'Celebration Mug', 'Treat Jar'],
      original_price: 2196,
      bundle_price: 1799,
      discount: 18,
      icon: '🎂',
      popular: true
    },
    {
      id: 'celebrate-gotcha-bundle',
      name: 'Gotcha Day Bundle',
      description: 'Celebrate the day they joined your family',
      items: ['Welcome Mat', 'Photo Frame', 'Celebration Bandana'],
      original_price: 1697,
      bundle_price: 1399,
      discount: 17,
      icon: '🏠'
    }
  ],
  travel: [
    {
      id: 'travel-adventure-bundle',
      name: 'Adventure Ready Bundle',
      description: 'Everything for trips with your furry friend',
      items: ['Passport Holder', 'Carrier Tag', 'Travel Bowl', 'Luggage Tag'],
      original_price: 1896,
      bundle_price: 1499,
      discount: 21,
      icon: '✈️',
      popular: true
    },
    {
      id: 'travel-road-trip-bundle',
      name: 'Road Trip Essentials',
      description: 'Perfect for car adventures',
      items: ['Travel Bowl', 'Pet Towel', 'Car Bandana'],
      original_price: 1347,
      bundle_price: 1099,
      discount: 18,
      icon: '🚗'
    }
  ],
  dine: [
    {
      id: 'dine-mealtime-bundle',
      name: 'Premium Mealtime Bundle',
      description: 'Elevate every meal with personalized gear',
      items: ['Food Bowl', 'Treat Jar', 'Feeding Mat', 'Food Scoop'],
      original_price: 2296,
      bundle_price: 1799,
      discount: 22,
      icon: '🍽️',
      popular: true
    },
    {
      id: 'dine-treats-bundle',
      name: 'Treat Lover Bundle',
      description: 'For the treat-motivated pup',
      items: ['Treat Jar', 'Treat Pouch', 'Training Treats Bag'],
      original_price: 1497,
      bundle_price: 1199,
      discount: 20,
      icon: '🦴'
    }
  ],
  care: [
    {
      id: 'care-grooming-bundle',
      name: 'Spa Day Bundle',
      description: 'Complete grooming essentials',
      items: ['Pet Robe', 'Grooming Apron', 'Pet Towel'],
      original_price: 1847,
      bundle_price: 1449,
      discount: 21,
      icon: '🛁',
      popular: true
    }
  ],
  learn: [
    {
      id: 'learn-training-bundle',
      name: 'Training Success Bundle',
      description: 'Everything for effective training',
      items: ['Training Treat Pouch', 'Training Log', 'Reward Jar'],
      original_price: 1547,
      bundle_price: 1199,
      discount: 22,
      icon: '🎓',
      popular: true
    }
  ],
  farewell: [
    {
      id: 'farewell-memorial-bundle',
      name: 'Forever in Heart Bundle',
      description: 'Cherish their memory forever',
      items: ['Memorial Ornament', 'Paw Print Frame', 'Memory Mug'],
      original_price: 1897,
      bundle_price: 1499,
      discount: 21,
      icon: '🌈',
      popular: true
    }
  ]
};

const CuratedBundles = ({ pillar, showTitle = true, className = '' }) => {
  const { addToCart } = useCart();
  const { currentPet } = usePillarContext();
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const pillarBundles = PILLAR_BUNDLES[pillar?.toLowerCase()] || [];
    setBundles(pillarBundles);
  }, [pillar]);
  
  const handleAddBundle = (bundle) => {
    // Add bundle as a single cart item
    addToCart({
      id: bundle.id,
      name: bundle.name,
      price: bundle.bundle_price,
      original_price: bundle.original_price,
      image: null, // Bundles don't have images yet
      quantity: 1,
      is_bundle: true,
      bundle_items: bundle.items,
      pet_name: currentPet?.name
    });
    
    toast({
      title: `${bundle.name} added! 🎁`,
      description: `Save ₹${bundle.original_price - bundle.bundle_price} with this bundle`,
    });
  };
  
  if (!bundles.length) {
    return null;
  }
  
  // Get archetype-based copy
  const archetype = currentPet?.soul_archetype?.primary_archetype || currentPet?.archetype;
  const archetypeInfo = getArchetypeDisplayInfo(archetype);
  const bundleIntro = getBundleIntro(archetype, currentPet?.name, currentPet?.breed);
  
  return (
    <div className={`py-8 ${className}`} data-testid="curated-bundles-section">
      {showTitle && (
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-xl">{archetypeInfo.emoji}</span>
            <Gift className="w-5 h-5 text-purple-600" />
            <h3 className="text-xl font-bold text-gray-800">
              {archetype ? `${archetypeInfo.name.replace('The ', '')} Bundles` : 'Curated Bundles'}
            </h3>
          </div>
          <p className="text-sm text-gray-600">
            {bundleIntro}
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {bundles.map((bundle) => (
          <Card 
            key={bundle.id}
            className={`overflow-hidden border-2 transition-all duration-300 hover:shadow-xl ${
              bundle.popular ? 'border-purple-300 bg-gradient-to-br from-purple-50 to-white' : 'border-gray-200'
            }`}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{bundle.icon}</span>
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg">
                      {bundle.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {bundle.description}
                    </p>
                  </div>
                </div>
                
                {bundle.popular && (
                  <Badge className="bg-purple-600 text-white">
                    <Star className="w-3 h-3 mr-1 fill-white" />
                    Popular
                  </Badge>
                )}
              </div>
              
              {/* Bundle Items */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                  What's Included
                </p>
                <div className="space-y-1">
                  {bundle.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Pricing */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-900">
                      ₹{bundle.bundle_price.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-400 line-through">
                      ₹{bundle.original_price.toLocaleString()}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-300 mt-1">
                    Save {bundle.discount}%
                  </Badge>
                </div>
                
                <Button
                  onClick={() => handleAddBundle(bundle)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add Bundle
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CuratedBundles;
