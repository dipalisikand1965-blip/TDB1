/**
 * CuratedBundles.jsx
 * Displays pre-made product bundles for each pillar
 * Part of the "Golden Standard" page layout
 * Now with modal detail view
 */

import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { 
  Package, Sparkles, Star, ChevronRight, ShoppingCart, 
  Gift, Check, Loader2, X, Heart
} from 'lucide-react';
import { API_URL } from '../utils/api';
import { useCart } from '../context/CartContext';
import { usePillarContext } from '../context/PillarContext';
import { toast } from '../hooks/use-toast';
import { getBundleIntro, getArchetypeDisplayInfo, getPillarAwareBundleIntro } from '../utils/archetypeCopy';

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
      description: 'Everything for effective positive-reinforcement training',
      items: ['Training Treat Pouch', 'Clicker', 'Training Treats', 'Reward Jar'],
      original_price: 1547,
      bundle_price: 1199,
      discount: 22,
      icon: '🎓',
      popular: true
    },
    {
      id: 'learn-puppy-starter-bundle',
      name: 'Puppy Learning Starter',
      description: 'The essentials for first-time puppy parents',
      items: ['Puppy Training Guide', 'Teething Ring', 'Potty Training Pads', 'Bite Inhibition Toy'],
      original_price: 1899,
      bundle_price: 1449,
      discount: 24,
      icon: '🐶',
      popular: false
    },
    {
      id: 'learn-mental-enrichment-bundle',
      name: 'Mental Enrichment Bundle',
      description: 'Keep your dog mentally stimulated and happy',
      items: ['Puzzle Feeder', 'Snuffle Mat', 'Lick Mat', 'Interactive Treat Ball'],
      original_price: 2196,
      bundle_price: 1699,
      discount: 23,
      icon: '🧩'
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
    },
    {
      id: 'farewell-keepsake-bundle',
      name: 'Precious Memories Bundle',
      description: 'Beautiful keepsakes to honor their legacy',
      items: ['Photo Engraved Frame', 'Memorial Garden Stone', 'Pawprint Keychain', 'Memory Box'],
      original_price: 2499,
      bundle_price: 1899,
      discount: 24,
      icon: '💜'
    },
    {
      id: 'farewell-tribute-bundle',
      name: 'Loving Tribute Bundle',
      description: 'A complete memorial collection',
      items: ['Angel Wing Ornament', 'Rainbow Bridge Frame', 'Heart Pendant', 'Memorial Candle'],
      original_price: 2199,
      bundle_price: 1699,
      discount: 23,
      icon: '🕊️'
    }
  ],
  adopt: [
    {
      id: 'adopt-day1-essentials',
      name: 'Day 1 Essentials Bundle',
      description: 'Everything you need before bringing your new dog home',
      items: ['Starter Bowl Set', 'First Collar', 'Leash', 'ID Tag', 'Pee Pads', 'Bed', 'Blanket'],
      original_price: 3999,
      bundle_price: 2999,
      discount: 25,
      icon: '📦',
      popular: true
    },
    {
      id: 'adopt-comfort-bundle',
      name: 'Comfort & Settling Bundle',
      description: 'Help your rescue feel safe and secure in their new home',
      items: ['Calming Blanket', 'Snuggle Toy', 'Crate Cover', 'Lick Mat', 'Calming Mat'],
      original_price: 3499,
      bundle_price: 2699,
      discount: 23,
      icon: '💆'
    },
    {
      id: 'adopt-puppy-starter',
      name: 'New Puppy Starter Kit',
      description: 'Complete essentials for your new puppy\'s first month',
      items: ['Puppy Food Bowl', 'Training Treats', 'Clicker', 'Pee Pads', 'Chew Toys', 'Crate Mat', 'Brush'],
      original_price: 2999,
      bundle_price: 2299,
      discount: 23,
      icon: '🐶'
    }
  ],
  advisory: [
    {
      id: 'advisory-puppy-starter',
      name: 'Puppy Starter Bundle',
      description: 'Everything for your new puppy - bed, bowls, collar, leash, and training essentials',
      items: ['Puppy Bed', 'Bowl Set', 'Collar & Leash', 'Training Treats', 'Chew Toys', 'Pee Pads'],
      original_price: 3299,
      bundle_price: 2499,
      discount: 24,
      icon: '🐶',
      popular: true
    },
    {
      id: 'advisory-senior-comfort',
      name: 'Senior Comfort Bundle',
      description: 'Support your aging companion with orthopedic comfort and joint care essentials',
      items: ['Orthopedic Bed', 'Joint Supplement', 'Non-Slip Mat', 'Raised Bowl Stand', 'Fleece Blanket'],
      original_price: 4599,
      bundle_price: 3499,
      discount: 24,
      icon: '❤️'
    },
    {
      id: 'advisory-grooming-pro',
      name: 'Complete Grooming Bundle',
      description: 'Professional-grade grooming tools for at-home coat care',
      items: ['Slicker Brush', 'De-shedding Comb', 'Pet Shampoo', 'Nail Clipper', 'Ear Cleaner', 'Grooming Towel'],
      original_price: 2399,
      bundle_price: 1799,
      discount: 25,
      icon: '✂️'
    }
  ],
  emergency: [
    {
      id: 'emergency-first-aid-bundle',
      name: 'Pet First Aid Bundle',
      description: 'Be prepared for pet emergencies with essential first aid supplies',
      items: ['First Aid Kit', 'Digital Thermometer', 'Gauze & Bandages', 'Tick Remover', 'Emergency Blanket'],
      original_price: 2199,
      bundle_price: 1599,
      discount: 27,
      icon: '🚨',
      popular: true
    },
    {
      id: 'emergency-travel-kit',
      name: 'Travel Emergency Kit',
      description: 'Essential emergency supplies for travel with your pet',
      items: ['Portable First Aid', 'Water Bottle', 'Collapsible Bowl', 'ID Tag', 'Slip Leash'],
      original_price: 3499,
      bundle_price: 2799,
      discount: 20,
      icon: '✈️'
    },
    {
      id: 'emergency-recovery-bundle',
      name: 'Post-Surgery Recovery Bundle',
      description: 'Everything needed for comfortable recovery after surgery',
      items: ['E-Collar', 'Recovery Suit', 'Orthopedic Mat', 'Cooling Pad', 'Gentle Treats'],
      original_price: 4299,
      bundle_price: 3499,
      discount: 19,
      icon: '🏥'
    }
  ]
};

const CuratedBundles = ({ pillar, showTitle = true, className = '', maxBundles }) => {
  const { addToCart } = useCart();
  const { currentPet } = usePillarContext();
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  useEffect(() => {
    const fetchBundles = async () => {
      setLoading(true);
      try {
        // Use pillar-specific API endpoint
        const pillarLower = pillar?.toLowerCase();
        const apiEndpoint = `${API_URL}/api/${pillarLower}/bundles`;
        
        console.log('[CuratedBundles] Fetching from:', apiEndpoint);
        const response = await fetch(apiEndpoint);
        
        if (response.ok) {
          const data = await response.json();
          console.log('[CuratedBundles] API response:', data);
          if (data.bundles && data.bundles.length > 0) {
            console.log('[CuratedBundles] Using API bundles:', data.bundles.length);
            // Map the API response to the expected format
            const mappedBundles = data.bundles.map(b => ({
              ...b,
              id: b.id || b.slug,
              bundle_price: b.price || b.bundle_price,
              image_url: b.image || b.image_url,
              savings: b.original_price ? b.original_price - (b.price || b.bundle_price) : null
            }));
            setBundles(mappedBundles);
            setLoading(false);
            return;
          }
        }
      } catch (error) {
        console.log('[CuratedBundles] API error, using static fallback:', error);
      }
      
      // Fallback to static data only if API fails or returns empty
      console.log('[CuratedBundles] Using static fallback bundles (no images)');
      const pillarBundles = PILLAR_BUNDLES[pillar?.toLowerCase()] || [];
      setBundles(pillarBundles);
      setLoading(false);
    };
    
    if (pillar) {
      fetchBundles();
    }
  }, [pillar]);
  
  const handleAddBundle = (bundle) => {
    // Add bundle as a single cart item
    addToCart({
      id: bundle.id,
      name: bundle.name,
      price: bundle.bundle_price,
      original_price: bundle.original_price,
      image: bundle.image_url || null,
      quantity: 1,
      is_bundle: true,
      bundle_items: bundle.items,
      pet_name: currentPet?.name
    });
    
    toast({
      title: `${bundle.name} added! 🎁`,
      description: `Save ₹${bundle.original_price - bundle.bundle_price} with this bundle`,
    });
    
    // Close modal if open
    setShowModal(false);
  };

  const openBundleModal = (bundle) => {
    setSelectedBundle(bundle);
    setShowModal(true);
  };
  
  if (!bundles.length) {
    return null;
  }
  
  // Get archetype-based copy
  const archetype = currentPet?.soul_archetype?.primary_archetype || currentPet?.archetype;
  const archetypeInfo = getArchetypeDisplayInfo(archetype);
  
  // Use pillar-aware copy for emergency context
  const bundleIntro = getPillarAwareBundleIntro(archetype, currentPet?.name, currentPet?.breed, pillar);
  
  // Pillar-specific display
  const isEmergency = pillar === 'emergency';
  const isFarewell = pillar === 'farewell';
  const isAdopt = pillar === 'adopt';
  
  const sectionEmoji = isEmergency ? '🚨' : isFarewell ? '💜' : isAdopt ? '🏠' : archetypeInfo.emoji;
  const sectionTitle = isEmergency 
    ? 'Emergency Bundles' 
    : isFarewell
    ? 'Memorial Bundles'
    : isAdopt
    ? 'New Home Bundles'
    : (archetype ? `${archetypeInfo.name.replace('The ', '')} Bundles` : 'Curated Bundles');

  // Apply maxBundles limit if provided
  const displayBundles = maxBundles ? bundles.slice(0, maxBundles) : bundles;
  
  return (
    <>
      <div className={`py-8 ${className}`} data-testid="curated-bundles-section">
        {showTitle && (
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-xl">{sectionEmoji}</span>
              <Gift className={`w-5 h-5 ${isEmergency ? 'text-red-600' : isFarewell ? 'text-purple-600' : 'text-purple-600'}`} />
              <h3 className="text-xl font-bold text-gray-800">
                {sectionTitle}
              </h3>
            </div>
            <p className="text-sm text-gray-600">
              {bundleIntro}
            </p>
          </div>
        )}
        
        <div className={`grid grid-cols-1 ${displayBundles.length >= 2 ? 'md:grid-cols-2' : ''} ${displayBundles.length >= 3 ? 'lg:grid-cols-3' : ''} gap-6`}>
          {displayBundles.map((bundle) => (
            <Card 
              key={bundle.id}
              className={`overflow-hidden border-2 transition-all duration-300 hover:shadow-xl cursor-pointer ${
                bundle.popular ? 'border-purple-300 bg-gradient-to-br from-purple-50 to-white' : 'border-gray-200'
              }`}
              onClick={() => openBundleModal(bundle)}
              data-testid={`bundle-card-${bundle.id}`}
            >
              <div className="p-6">
                {/* Bundle Image (if available) */}
                {bundle.image_url && (
                  <div className="mb-4 -mx-6 -mt-6 bg-gradient-to-br from-amber-50/50 to-orange-50/50">
                    <img 
                      src={bundle.image_url} 
                      alt={bundle.name}
                      className="w-full h-48 object-contain"
                    />
                  </div>
                )}
                
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{bundle.icon}</span>
                    <div>
                      <h4 className="font-bold text-gray-800 text-lg">
                        {bundle.name}
                      </h4>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {bundle.description}
                      </p>
                    </div>
                  </div>
                  
                  {bundle.popular && (
                    <Badge className="bg-purple-600 text-white flex-shrink-0">
                      <Star className="w-3 h-3 mr-1 fill-white" />
                      Popular
                    </Badge>
                  )}
                </div>
                
                {/* Bundle Items Preview */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                    What's Included
                  </p>
                  <div className="space-y-1">
                    {(bundle.items || bundle.includes || []).slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>{typeof item === 'object' ? item.name : item}</span>
                      </div>
                    ))}
                    {(bundle.items || bundle.includes || []).length > 3 && (
                      <p className="text-xs text-purple-600 font-medium">
                        +{(bundle.items || bundle.includes || []).length - 3} more items
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Pricing */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-gray-900">
                        ₹{bundle.bundle_price?.toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-400 line-through">
                        ₹{bundle.original_price?.toLocaleString()}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-300 mt-1">
                      Save {bundle.discount}%
                    </Badge>
                  </div>
                  
                  <Button
                    onClick={(e) => { e.stopPropagation(); handleAddBundle(bundle); }}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                    data-testid={`add-bundle-${bundle.id}`}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Bundle Detail Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedBundle && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="text-2xl">{selectedBundle.icon}</span>
                  {selectedBundle.name}
                </DialogTitle>
              </DialogHeader>
              
              <div className="mt-4">
                {/* Bundle Image */}
                {selectedBundle.image_url && (
                  <div className="-mx-6 mb-4">
                    <img 
                      src={selectedBundle.image_url} 
                      alt={selectedBundle.name}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}
                
                {/* Description */}
                <p className="text-gray-600 mb-4">{selectedBundle.description}</p>
                
                {/* Popular Badge */}
                {selectedBundle.popular && (
                  <Badge className="bg-purple-600 text-white mb-4">
                    <Star className="w-3 h-3 mr-1 fill-white" />
                    Popular Choice
                  </Badge>
                )}
                
                {/* All Items */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3">
                    {selectedBundle.items.length} Items Included:
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {selectedBundle.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2 bg-white rounded-lg">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-purple-600" />
                        </div>
                        <span className="text-sm text-gray-800">{typeof item === 'object' ? item.name : item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Pricing Details */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Bundle Price</p>
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-bold text-gray-900">
                          ₹{selectedBundle.bundle_price?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 line-through">
                        Regular: ₹{selectedBundle.original_price?.toLocaleString()}
                      </p>
                      <Badge className="bg-green-500 text-white mt-1">
                        Save ₹{(selectedBundle.original_price - selectedBundle.bundle_price)?.toLocaleString()}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowModal(false)}
                  >
                    Close
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                    onClick={() => handleAddBundle(selectedBundle)}
                    data-testid="modal-add-bundle-btn"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CuratedBundles;
