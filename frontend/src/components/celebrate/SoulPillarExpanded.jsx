/**
 * SoulPillarExpanded.jsx
 * 
 * Expanded view when a soul pillar is clicked
 * Contains tabs with filtered products, services, and experiences
 * 
 * Mobile: Consider using as bottom drawer (< 768px)
 * Desktop: Inline expansion below pillars
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, ShoppingBag, Package, Loader2 } from 'lucide-react';
import { API_URL, getApiUrl } from '../../utils/api';
import ProductCard from '../ProductCard';
import { Button } from '../ui/button';

// Tab content component
const TabContent = ({ products, services, loading, pet, pillar }) => {
  const petName = pet?.name || 'your pet';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <span className="ml-3 text-gray-600">Finding perfect items for {petName}...</span>
      </div>
    );
  }

  if (!products?.length && !services?.length) {
    return (
      <div className="text-center py-12 px-4">
        <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600 mb-4">
          We're curating the perfect {pillar.name.toLowerCase()} items for {petName}. 
          Ask Mira for personalised suggestions while we get these ready.
        </p>
        <Button 
          variant="outline" 
          className="border-purple-300 text-purple-600 hover:bg-purple-50"
          onClick={() => window.dispatchEvent(new CustomEvent('openMira', { detail: { context: pillar.id } }))}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Ask Mira
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {products?.slice(0, 8).map((product, idx) => (
        <ProductCard 
          key={product.id || idx} 
          product={product}
          showSoulBadge={true}
        />
      ))}
    </div>
  );
};

const SoulPillarExpanded = ({ pillar, pet, onClose }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const petName = pet?.name || 'your pet';

  // Fetch products filtered for this pillar and pet
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const apiUrl = getApiUrl();
        // Try to get pillar-specific products
        const response = await fetch(
          `${apiUrl}/api/celebrate/pillar-products?pillar=${pillar.id}&pet_id=${pet?.id || ''}`
        );
        
        if (response.ok) {
          const data = await response.json();
          setProducts(data.products || []);
        } else {
          // Fallback to general celebrate products
          const fallbackResponse = await fetch(`${apiUrl}/api/celebrate/products?limit=12`);
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            setProducts(fallbackData.products || []);
          }
        }
      } catch (error) {
        console.error('[SoulPillarExpanded] Error fetching products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [pillar.id, pet?.id]);

  // Filter out products with allergens if pet has allergies
  const filteredProducts = React.useMemo(() => {
    if (!products.length) return [];
    
    const petAllergies = pet?.allergies || [];
    const allergyAnswers = pet?.doggy_soul_answers?.food_allergies;
    const allAllergies = [
      ...petAllergies,
      ...(Array.isArray(allergyAnswers) ? allergyAnswers : allergyAnswers ? [allergyAnswers] : [])
    ].map(a => a?.toLowerCase()).filter(Boolean);

    if (!allAllergies.length || allAllergies.includes('none')) {
      return products;
    }

    return products.filter(product => {
      const productName = (product.name || '').toLowerCase();
      const productDesc = (product.description || '').toLowerCase();
      const productIngredients = (product.ingredients || '').toLowerCase();
      
      return !allAllergies.some(allergy => 
        productName.includes(allergy) || 
        productDesc.includes(allergy) ||
        productIngredients.includes(allergy)
      );
    });
  }, [products, pet]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-white rounded-3xl shadow-xl border-2 overflow-hidden"
      style={{ borderColor: pillar.borderColor }}
      data-testid={`pillar-expanded-${pillar.id}`}
    >
      {/* Header */}
      <div 
        className="p-6 relative"
        style={{ backgroundColor: pillar.color }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        <div className="flex items-start gap-4">
          <div className="text-5xl">{pillar.icon}</div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{pillar.name}</h3>
            
            {/* Mira's Quote */}
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 mt-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-gray-700 italic text-sm">
                    {pillar.miraQuote(pet)}
                  </p>
                  <p className="text-xs text-pink-600 mt-1 font-medium">
                    Mira knows {petName}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-100">
        <div className="flex overflow-x-auto scrollbar-hide">
          {pillar.tabs.map((tab, idx) => (
            <button
              key={tab}
              onClick={() => setActiveTab(idx)}
              className={`
                px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors
                ${activeTab === idx 
                  ? 'border-b-2 text-purple-600' 
                  : 'text-gray-500 hover:text-gray-700'
                }
              `}
              style={activeTab === idx ? { borderColor: pillar.borderColor } : {}}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Allergy warning if applicable */}
        {pet?.allergies?.length > 0 && (
          <div className="mb-4 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-center gap-2">
            <span>🚫</span>
            <span>Showing only {petName}-safe items (excluding {pet.allergies.join(', ')})</span>
          </div>
        )}

        <TabContent 
          products={filteredProducts}
          services={[]}
          loading={loading}
          pet={pet}
          pillar={pillar}
        />

        {/* View All Button */}
        {filteredProducts.length > 0 && (
          <div className="mt-6 text-center">
            <Button
              variant="outline"
              className="border-purple-300 text-purple-600 hover:bg-purple-50"
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              View all {pillar.name.toLowerCase()} for {petName}
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SoulPillarExpanded;
