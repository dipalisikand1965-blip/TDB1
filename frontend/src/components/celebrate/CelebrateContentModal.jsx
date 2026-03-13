/**
 * CelebrateContentModal.jsx
 * 
 * Modal/Drawer for displaying celebrate content when category is clicked
 * Works like Fresh Food modal on Dine page
 * Mobile: Opens as bottom drawer
 * Desktop: Opens as side sheet
 */

import React, { useState, useEffect, useCallback } from 'react';
import { X, Loader2, ShoppingBag, Filter, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '../ui/drawer';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import ProductCard from '../ProductCard';
import CuratedBundles from '../CuratedBundles';
import { API_URL, getApiUrl } from '../../utils/api';

// Category configurations with their content types
const CATEGORY_CONFIG = {
  // Product Categories
  'birthday-cakes': { 
    type: 'products', 
    title: 'Birthday Cakes',
    icon: '🎂',
    filter: { category: 'cakes' }
  },
  'breed-cakes': { 
    type: 'products', 
    title: 'Breed Cakes',
    icon: '🐾',
    filter: { category: 'breed-cakes' }
  },
  'pupcakes': { 
    type: 'products', 
    title: 'Pupcakes & Dognuts',
    icon: '🧁',
    filter: { category: 'pupcakes' }
  },
  'desi-treats': { 
    type: 'products', 
    title: 'Desi Treats',
    icon: '🍖',
    filter: { category: 'desi-treats' }
  },
  'gift-hampers': { 
    type: 'bundles', 
    title: 'Gift Hampers',
    icon: '🎁'
  },
  'party-items': { 
    type: 'products', 
    title: 'Party Accessories',
    icon: '🎀',
    filter: { category: 'party-accessories' }
  },
  'premium': { 
    type: 'products', 
    title: 'Premium Collection',
    icon: '👑',
    filter: { is_premium: true }
  },
  // Special sections from the 18 existing sections
  'soul-picks': {
    type: 'soul-picks',
    title: "Mojo's Soul Picks",
    icon: '✨',
  },
  'bundles': {
    type: 'bundles',
    title: 'Celebration Bundles',
    icon: '📦',
  },
  'services': {
    type: 'services',
    title: 'Celebration Services',
    icon: '🎉',
  },
  'breed-smart': {
    type: 'breed-smart',
    title: 'Breed-Smart Picks',
    icon: '🐕',
  },
  'soul-made': {
    type: 'soul-made',
    title: 'Soul Made Collection',
    icon: '💜',
  },
  'mira-picks': {
    type: 'mira-picks',
    title: "Mira's Picks",
    icon: '💫',
  },
};

// Mobile detection hook
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
};

// Content renderer for different types
const ContentRenderer = ({ type, products, bundles, services, loading, pet, category }) => {
  const petName = pet?.name || 'your pet';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-4" />
        <p className="text-gray-500">Finding perfect items for {petName}...</p>
      </div>
    );
  }

  if (type === 'products' && products?.length > 0) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {products.map((product, idx) => (
          <ProductCard key={product.id || idx} product={product} />
        ))}
      </div>
    );
  }

  if (type === 'bundles') {
    return <CuratedBundles pillar="celebrate" maxBundles={6} showTitle={false} />;
  }

  if (type === 'services') {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Services will be shown here</p>
      </div>
    );
  }

  // Empty state
  return (
    <div className="text-center py-16">
      <div className="text-6xl mb-4">🎉</div>
      <p className="text-gray-600 mb-2">
        No items found in this category for {petName}
      </p>
      <p className="text-sm text-gray-400">
        Try another category or ask Mira for suggestions
      </p>
    </div>
  );
};

const CelebrateContentModal = ({ 
  isOpen, 
  onClose, 
  categoryId, 
  pet,
  pillar = 'celebrate'
}) => {
  const isMobile = useIsMobile();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const config = CATEGORY_CONFIG[categoryId] || { 
    type: 'products', 
    title: categoryId,
    icon: '🎉'
  };
  const petName = pet?.name || 'your pet';

  // Fetch content based on category type
  const fetchContent = useCallback(async () => {
    if (!isOpen || !categoryId) return;
    
    setLoading(true);
    try {
      const apiUrl = getApiUrl();
      
      if (config.type === 'products') {
        const params = new URLSearchParams({
          pillar,
          limit: '20',
          ...config.filter
        });
        const response = await fetch(`${apiUrl}/api/celebrate/products?${params}`);
        if (response.ok) {
          const data = await response.json();
          setProducts(data.products || []);
        }
      }
    } catch (error) {
      console.error('[CelebrateContentModal] Error:', error);
    } finally {
      setLoading(false);
    }
  }, [isOpen, categoryId, config, pillar]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Content to render inside modal/drawer
  const modalContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{config.icon}</span>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{config.title}</h2>
            <p className="text-sm text-gray-500">For {petName}</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Filters (optional) */}
      {config.type === 'products' && (
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
          <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
            <Filter className="w-3 h-3 mr-1" />
            All Items
            <ChevronDown className="w-3 h-3 ml-1" />
          </Badge>
          {pet?.allergies?.length > 0 && (
            <Badge className="bg-green-100 text-green-700">
              🛡️ {petName}-safe only
            </Badge>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <ContentRenderer
          type={config.type}
          products={products}
          bundles={[]}
          services={[]}
          loading={loading}
          pet={pet}
          category={categoryId}
        />
      </div>

      {/* Footer CTA */}
      {products.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <Button 
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white"
            onClick={onClose}
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            Continue Shopping
          </Button>
        </div>
      )}
    </>
  );

  // Use Drawer for mobile, Sheet for desktop
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="max-h-[90vh]">
          <div className="p-4 overflow-y-auto">
            {modalContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        {modalContent}
      </SheetContent>
    </Sheet>
  );
};

export default CelebrateContentModal;
export { CATEGORY_CONFIG };
