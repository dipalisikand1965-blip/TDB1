/**
 * SoulPillarExpanded.jsx
 * 
 * Expanded view when a soul pillar is clicked
 * Fetches real products from Shopify via /api/products?category=X
 * Shows tabs per pillar with filtered, allergy-safe products
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, ShoppingBag, Loader2, Plus } from 'lucide-react';
import { getApiUrl } from '../../utils/api';

// Map pillar id → product categories to query
const PILLAR_CATEGORY_MAP = {
  food: ['cakes', 'treats', 'desi-treats'],
  play: ['toys', 'accessories'],
  social: ['accessories', 'hampers'],
  adventure: ['accessories'],
  grooming: ['grooming'],
  learning: ['puzzles', 'training'],
  health: ['supplements', 'health'],
  memory: ['accessories']
};

// Pillar to tab-category map (tabs are from spec)
const PILLAR_TABS = {
  food: [
    { name: 'Birthday Cakes', category: 'cakes' },
    { name: 'Breed Cakes', category: 'breed-cakes' },
    { name: 'Pupcakes', category: 'pupcakes' },
    { name: 'Desi Treats', category: 'desi-treats' },
  ],
  play: [
    { name: 'Toys & Enrichment', category: 'toys' },
    { name: 'Activity Kits', category: 'accessories' },
    { name: 'Outdoor Play', category: 'accessories' },
  ],
  social: [
    { name: 'Pawty Packages', category: 'hampers' },
    { name: 'Party Accessories', category: 'accessories' },
    { name: 'Gift Hampers', category: 'hampers' },
  ],
  adventure: [
    { name: 'Adventure Gear', category: 'accessories' },
    { name: 'Trail Kits', category: 'accessories' },
  ],
  grooming: [
    { name: 'Pamper Sessions', category: 'grooming' },
    { name: 'Birthday Bandanas', category: 'accessories' },
    { name: 'Spa Kits', category: 'grooming' },
  ],
  learning: [
    { name: 'Enrichment', category: 'puzzles' },
    { name: 'Training Gifts', category: 'training' },
    { name: 'Puzzle Toys', category: 'puzzles' },
  ],
  health: [
    { name: 'Wellness Gifts', category: 'supplements' },
    { name: 'Supplements', category: 'supplements' },
    { name: 'Annual Care Plans', category: 'health' },
  ],
  memory: [
    { name: 'Photoshoots', category: 'accessories' },
    { name: 'Memory Books', category: 'accessories' },
    { name: 'Keepsakes', category: 'accessories' },
  ]
};

// Mini product card matching spec
const SoulProductCard = ({ product, petName, onAddToCart }) => {
  const price = product.price || product.variants?.[0]?.price || 0;
  const image = product.image_url || product.image || product.images?.[0];

  return (
    <div
      className="rounded-xl overflow-hidden bg-white"
      style={{ border: '1px solid #F5E8D4' }}
      data-testid={`soul-product-${product.id || product.name?.replace(/\s/g, '-')}`}
    >
      {/* Image */}
      <div
        className="flex items-center justify-center bg-gray-50"
        style={{ height: 100 }}
      >
        {image ? (
          <img src={image} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-3xl">🎁</span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: 10 }}>
        {/* For-pet tag */}
        <div
          className="inline-block rounded-lg mb-1"
          style={{
            fontSize: 10, fontWeight: 600,
            background: 'linear-gradient(135deg, rgba(255,140,66,0.15), rgba(196,77,255,0.10))',
            border: '1px solid rgba(255,140,66,0.30)',
            padding: '2px 8px',
            color: '#8B4500'
          }}
        >
          For {petName}
        </div>

        <p className="font-bold line-clamp-1" style={{ fontSize: 13, color: '#1A0A00', marginBottom: 2 }}>
          {product.name}
        </p>
        {product.description && (
          <p className="line-clamp-1" style={{ fontSize: 11, color: '#888', lineHeight: 1.4, marginBottom: 8 }}>
            {product.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <span className="font-bold" style={{ fontSize: 14, color: '#1A0A00' }}>
            ₹{typeof price === 'number' ? price.toLocaleString('en-IN') : price}
          </span>
          <button
            onClick={() => onAddToCart && onAddToCart(product)}
            className="flex items-center gap-1 text-white rounded-full"
            style={{
              background: 'linear-gradient(135deg, #FF8C42, #C44DFF)',
              border: 'none',
              padding: '5px 12px',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer'
            }}
            data-testid={`add-to-cart-${product.id}`}
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

const SoulPillarExpanded = ({ pillar, pet, onClose }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const handleAddToCart = (product) => {
    window.dispatchEvent(new CustomEvent('addToCart', { detail: product }));
  };

  const petName = pet?.name || 'your pet';

  const tabs = PILLAR_TABS[pillar.id] || [{ name: 'All', category: 'cakes' }];

  // Fetch products for active tab category
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const apiUrl = getApiUrl();
        const currentCategory = tabs[activeTab]?.category || 'cakes';

        // Try celebrate-specific endpoint first
        const celebrateResp = await fetch(
          `${apiUrl}/api/celebrate/products?category=${currentCategory}&limit=16`
        );
        if (celebrateResp.ok) {
          const data = await celebrateResp.json();
          if (data.products?.length > 0) {
            setProducts(data.products);
            setLoading(false);
            return;
          }
        }

        // Fallback to main products API (Shopify products)
        const resp = await fetch(
          `${apiUrl}/api/products?category=${currentCategory}&limit=12`
        );
        if (resp.ok) {
          const data = await resp.json();
          setProducts(data.products || []);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error('[SoulPillarExpanded] Error:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [pillar.id, activeTab]);

  // Filter allergens
  const filteredProducts = React.useMemo(() => {
    if (!products.length) return [];
    const petAllergies = [
      ...(pet?.allergies || []),
      ...(Array.isArray(pet?.doggy_soul_answers?.food_allergies)
        ? pet.doggy_soul_answers.food_allergies
        : pet?.doggy_soul_answers?.food_allergies ? [pet.doggy_soul_answers.food_allergies] : [])
    ].map(a => a?.toLowerCase()).filter(a => a && a !== 'none');

    if (!petAllergies.length) return products;
    return products.filter(p => {
      const text = ((p.name || '') + (p.description || '') + (p.ingredients || '')).toLowerCase();
      return !petAllergies.some(a => text.includes(a));
    });
  }, [products, pet]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-white overflow-hidden"
      style={{
        borderRadius: 16,
        border: '2px solid #C44DFF',
        marginBottom: 32
      }}
      data-testid={`pillar-expanded-${pillar.id}`}
    >
      {/* Header */}
      <div
        className="p-5 relative"
        style={{ borderBottom: '1px solid #FFF3E0' }}
      >
        <div className="flex items-center gap-2.5">
          <span style={{ fontSize: 28 }}>{pillar.icon}</span>
          <div className="flex-1">
            <h3 className="font-bold" style={{ fontSize: 19, color: '#1A0A00' }}>{pillar.name}</h3>
            <p style={{ fontSize: 12, color: '#888' }}>{pillar.tagline(petName)}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto rounded-full font-semibold"
            style={{
              background: '#FFF3E0',
              padding: '4px 12px',
              fontSize: 12,
              color: '#C44400',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>

        {/* Mira quote */}
        <div
          className="mt-4 rounded-xl p-3 flex items-start gap-2.5"
          style={{ background: 'rgba(196,77,255,0.06)', border: '1px solid rgba(196,77,255,0.15)' }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm"
            style={{ background: 'linear-gradient(135deg, #C44DFF, #FF6B9D)' }}
          >
            ✦
          </div>
          <p className="text-sm text-gray-700 italic leading-relaxed">
            {pillar.miraQuote(pet)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab, idx) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(idx)}
              className="rounded-full font-semibold"
              style={{
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 600,
                border: activeTab === idx ? '1px solid #C44DFF' : '1px solid #FFCC99',
                background: activeTab === idx ? '#C44DFF' : '#FFF8F0',
                color: activeTab === idx ? '#FFFFFF' : '#C44400',
                cursor: 'pointer',
                transition: '150ms ease'
              }}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Allergy notice */}
        {pet?.allergies?.length > 0 && (
          <div
            className="mb-4 px-4 py-2 rounded-lg text-sm flex items-center gap-2"
            style={{ background: '#FFF3E0', border: '1px solid #FFCC99', color: '#8B4500' }}
          >
            <span>🛡️</span>
            <span>Showing only {petName}-safe items (no {pet.allergies.join(', ')})</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-7 h-7 animate-spin text-purple-500" />
            <span className="ml-3 text-gray-500 text-sm">Finding perfect items for {petName}...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-10 px-4">
            <span className="text-4xl block mb-3">🎁</span>
            <p className="text-gray-500 text-sm mb-4">
              We're curating the perfect {pillar.name.toLowerCase()} items for {petName}.
            </p>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('openMiraAI', {
                detail: { message: `Suggest ${pillar.name} celebration ideas for ${petName}`, context: 'celebrate' }
              }))}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
              style={{ background: 'rgba(196,77,255,0.10)', border: '1px solid rgba(196,77,255,0.30)', color: '#7C3AED' }}
            >
              <Sparkles className="w-4 h-4" />
              Ask Mira
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {filteredProducts.slice(0, 8).map((product, idx) => (
                <SoulProductCard
                  key={product.id || idx}
                  product={product}
                  petName={petName}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>

            {filteredProducts.length > 0 && (
              <div className="mt-5 text-center">
                <button
                  onClick={() => window.location.href = `/celebrate?category=${tabs[activeTab]?.category}`}
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium"
                  style={{
                    border: '1px solid rgba(196,77,255,0.40)',
                    color: '#7C3AED',
                    background: 'rgba(196,77,255,0.06)'
                  }}
                >
                  <ShoppingBag className="w-4 h-4" />
                  View all {pillar.name.toLowerCase()} for {petName}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default SoulPillarExpanded;
