/**
 * PersonalizedBreedCollection.jsx
 * 
 * Shows a SEPARATE section for breed-personalized products.
 * - Filters products by logged-in user's pet's breed
 * - Shows pet's name on products (e.g., "Mojo's Cake" for Indie dog named Mojo)
 * - Completely SEPARATE from Shopify synced products
 * 
 * The logic:
 * - Mojo = Indie → Show ONLY Indie products with "Mojo" name
 * - Buddy = Labrador → Show ONLY Labrador products with "Buddy" name
 * - Mystique = Shih Tzu → Show ONLY Shih Tzu products with "Mystique" name
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, ChevronRight, RefreshCw, PawPrint } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { API_URL } from '../utils/api';
import { usePillarContext } from '../context/PillarContext';
import { useAuth } from '../context/AuthContext';

// Map breed names to database keys
const BREED_KEY_MAP = {
  'labrador': 'labrador',
  'labrador retriever': 'labrador',
  'golden retriever': 'golden_retriever',
  'golden': 'golden_retriever',
  'cocker spaniel': 'cocker_spaniel',
  'irish setter': 'irish_setter',
  'german shepherd': 'german_shepherd',
  'rottweiler': 'rottweiler',
  'doberman': 'doberman',
  'doberman pinscher': 'doberman',
  'boxer': 'boxer',
  'st bernard': 'st_bernard',
  'saint bernard': 'st_bernard',
  'great dane': 'great_dane',
  'american bully': 'american_bully',
  'husky': 'husky',
  'siberian husky': 'husky',
  'pomeranian': 'pomeranian',
  'chow chow': 'chow_chow',
  'border collie': 'border_collie',
  'beagle': 'beagle',
  'dachshund': 'dachshund',
  'italian greyhound': 'italian_greyhound',
  'dalmatian': 'dalmatian',
  'jack russell': 'jack_russell',
  'jack russell terrier': 'jack_russell',
  'yorkshire terrier': 'yorkshire',
  'yorkshire': 'yorkshire',
  'yorkie': 'yorkshire',
  'scottish terrier': 'scottish_terrier',
  'pug': 'pug',
  'shih tzu': 'shih_tzu',
  'shitzu': 'shih_tzu',
  'chihuahua': 'chihuahua',
  'maltese': 'maltese',
  'lhasa apso': 'lhasa_apso',
  'cavalier king charles spaniel': 'cavalier',
  'cavalier': 'cavalier',
  'french bulldog': 'french_bulldog',
  'frenchie': 'french_bulldog',
  'english bulldog': 'bulldog',
  'bulldog': 'bulldog',
  'poodle': 'poodle',
  'schnoodle': 'schnoodle',
  'indie': 'indie',
  'indian pariah': 'indie',
  'indian pariah dog': 'indie',
  'desi dog': 'indie',
  'street dog': 'indie',
  'mixed': 'indie'
};

// Normalize breed name to database key
const getBreedKey = (breedName) => {
  if (!breedName) return null;
  const normalized = breedName.toLowerCase().trim();
  return BREED_KEY_MAP[normalized] || null;
};

// Product card component for personalized items
const PersonalizedProductCard = ({ product, petName, onViewDetails }) => {
  // Replace generic name with personalized name
  const getPersonalizedName = () => {
    // If product name contains a placeholder like "Pet Name", replace it
    let name = product.name || product.title || '';
    if (name.includes('Pet Name')) {
      name = name.replace('Pet Name', petName);
    }
    // Add "for {petName}" if not already personalized
    if (!name.toLowerCase().includes(petName.toLowerCase())) {
      return `${name} for ${petName}`;
    }
    return name;
  };

  const personalizedName = getPersonalizedName();
  const price = product.price ? `₹${product.price}` : 'Price on request';

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group bg-white"
      onClick={() => onViewDetails?.(product)}
      data-testid={`personalized-product-${product.id}`}
    >
      {/* Image */}
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {product.mockup_url ? (
          <img 
            src={product.mockup_url}
            alt={personalizedName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
            <PawPrint className="w-16 h-16 text-purple-300" />
          </div>
        )}
        
        {/* Soul Made Badge */}
        <Badge className="absolute top-2 left-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs">
          <Sparkles className="w-3 h-3 mr-1" />
          Soul Made
        </Badge>
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Category Badge */}
        <Badge className="mb-2 bg-purple-100 text-purple-700 text-xs capitalize">
          {product.product_type?.replace('_', ' ')}
        </Badge>
        
        {/* Product Name */}
        <h4 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1">
          {personalizedName}
        </h4>
        
        {/* Breed Info */}
        <p className="text-xs text-gray-500 mb-2">
          {product.breed_name}
        </p>
        
        {/* Price */}
        <p className="text-sm font-bold text-purple-600">
          {price}
        </p>
      </div>
    </Card>
  );
};

const PersonalizedBreedCollection = ({ 
  pillar = null, // Optional pillar filter (celebrate, dine, stay, etc.)
  maxItems = 12,
  showTitle = true,
  className = '' 
}) => {
  const { currentPet } = usePillarContext();
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get the breed key from the current pet's breed
  const petBreedKey = currentPet?.breed ? getBreedKey(currentPet.breed) : null;
  const petName = currentPet?.name || 'Your Pet';

  // Fetch breed-specific products
  useEffect(() => {
    const fetchBreedProducts = async () => {
      if (!petBreedKey) {
        setProducts([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let url = `${API_URL}/api/mockups/breed-products?breed=${petBreedKey}&has_mockup=true&limit=${maxItems}`;
        if (pillar) {
          url += `&pillar=${pillar}`;
        }

        const response = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        if (response.ok) {
          const data = await response.json();
          // Only show proper product mockups (breed- prefix filename)
          const clean = (data.products || []).filter(p => {
            const url = p.mockup_url || p.cloudinary_url || '';
            if (!url) return false;
            return url.split('/').pop().startsWith('breed-');
          });
          setProducts(clean);
        } else {
          throw new Error('Failed to fetch products');
        }
      } catch (err) {
        console.error('[PersonalizedBreedCollection] Error:', err);
        setError('Could not load personalized products');
      } finally {
        setLoading(false);
      }
    };

    fetchBreedProducts();
  }, [petBreedKey, pillar, maxItems, token]);

  // Debug logging
  useEffect(() => {
    console.log('[PersonalizedBreedCollection] State:', {
      currentPet: currentPet?.name,
      petBreed: currentPet?.breed,
      petBreedKey,
      productsCount: products.length,
      loading
    });
  }, [currentPet, petBreedKey, products, loading]);

  // Don't render if no pet or no breed detected
  if (!currentPet || !petBreedKey) {
    console.log('[PersonalizedBreedCollection] Not rendering - missing pet or breed key');
    return null;
  }

  // Handle empty state
  if (!loading && products.length === 0) {
    return null;
  }

  return (
    <div className={`${className}`} data-testid="personalized-breed-collection">
      {/* Section Header */}
      {showTitle && (
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-600" />
                Made for {petName}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Personalized {currentPet.breed} products just for {petName}
              </p>
            </div>
            {products.length > 0 && (
              <Button variant="ghost" className="text-purple-600 hover:text-purple-700">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-8 text-gray-500">
          <p>{error}</p>
        </div>
      )}

      {/* Product Grid */}
      {!loading && products.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {products.map(product => (
            <PersonalizedProductCard
              key={product.id}
              product={product}
              petName={petName}
              onViewDetails={(p) => {
                // TODO: Open product detail modal
                console.log('View product:', p);
              }}
            />
          ))}
        </div>
      )}

      {/* Subtle branding */}
      {!loading && products.length > 0 && (
        <p className="text-xs text-gray-400 text-center mt-6">
          <Sparkles className="w-3 h-3 inline mr-1" />
          Soul-Level Personalization powered by The Doggy Company
        </p>
      )}
    </div>
  );
};

export default PersonalizedBreedCollection;
