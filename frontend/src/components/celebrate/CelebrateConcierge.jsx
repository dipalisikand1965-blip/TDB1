/**
 * CelebrateConcierge.jsx
 * 
 * Concierge section — flat #0E0620 background (NOT gradient, per spec)
 * Opens a drawer with two tabs: "Celebrate" and "Personalised"
 * Celebrate tab: real Shopify products (cakes) from The Doggy Bakery
 * Personalised tab: soul-filtered bundles from celebrate/bundles
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Loader2, ShoppingBag, Plus, Star } from 'lucide-react';
import { getApiUrl } from '../../utils/api';

// Product card for drawer
const ProductCard = ({ product, petName, onAddToCart }) => {
  const price = product.price || product.variants?.[0]?.price || 0;
  const image = product.image_url || product.image || product.images?.[0];

  return (
    <div
      className="rounded-xl overflow-hidden bg-white hover:shadow-md transition-shadow"
      style={{ border: '1px solid #F5E8D4' }}
    >
      <div className="flex items-center justify-center bg-gray-50" style={{ height: 120 }}>
        {image ? (
          <img src={image} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl">🎂</span>
        )}
      </div>
      <div style={{ padding: 12 }}>
        <p className="font-bold line-clamp-2 mb-1" style={{ fontSize: 13, color: '#1A0A00' }}>
          {product.name}
        </p>
        {product.description && (
          <p className="line-clamp-2 mb-2" style={{ fontSize: 11, color: '#888', lineHeight: 1.4 }}>
            {product.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="font-bold" style={{ fontSize: 14 }}>
            ₹{typeof price === 'number' ? price.toLocaleString('en-IN') : price}
          </span>
          <button
            onClick={() => onAddToCart && onAddToCart(product)}
            className="flex items-center gap-1 rounded-full text-white text-xs font-semibold"
            style={{
              background: 'linear-gradient(135deg, #FF8C42, #C44DFF)',
              border: 'none',
              padding: '5px 10px',
              cursor: 'pointer'
            }}
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

// Bundle card for personalised tab
const BundleCard = ({ bundle, petName, onAddToCart }) => {
  const image = bundle.image_url || bundle.image || bundle.images?.[0];
  return (
    <div
      className="rounded-xl overflow-hidden bg-white hover:shadow-md transition-shadow"
      style={{ border: '1px solid #F5E8D4' }}
    >
      <div className="flex items-center justify-center bg-purple-50" style={{ height: 120 }}>
        {image ? (
          <img src={image} alt={bundle.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl">🎁</span>
        )}
      </div>
      <div style={{ padding: 12 }}>
        <div
          className="inline-block rounded-full mb-1 text-white font-bold"
          style={{
            fontSize: 10, padding: '2px 8px',
            background: 'linear-gradient(135deg, #C44DFF, #FF6B9D)'
          }}
        >
          For {petName}
        </div>
        <p className="font-bold line-clamp-2 mb-1" style={{ fontSize: 13, color: '#1A0A00' }}>
          {bundle.name}
        </p>
        <div className="flex items-center justify-between">
          <span className="font-bold" style={{ fontSize: 14 }}>
            ₹{(bundle.total_price || bundle.price || 0).toLocaleString('en-IN')}
          </span>
          <button
            onClick={() => onAddToCart && onAddToCart(bundle)}
            className="flex items-center gap-1 rounded-full text-white text-xs font-semibold"
            style={{
              background: 'linear-gradient(135deg, #C44DFF, #FF6B9D)',
              border: 'none',
              padding: '5px 10px',
              cursor: 'pointer'
            }}
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

// Main drawer component
const ConciergeCatalogueDrawer = ({ isOpen, onClose, pet }) => {
  const [activeTab, setActiveTab] = useState('celebrate');
  const [cakes, setCakes] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(false);
  const petName = pet?.name || 'your pet';

  const addToCart = (product) => {
    window.dispatchEvent(new CustomEvent('addToCart', { detail: product }));
  };

  const tabs = [
    { id: 'celebrate', label: 'Celebrate', icon: '🎂' },
    { id: 'personalised', label: 'Personalised', icon: '✦' }
  ];

  useEffect(() => {
    if (!isOpen) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const apiUrl = getApiUrl();
        // Fetch cakes (Shopify/TDB products with beautiful illustrations)
        const cakeRes = await fetch(`${apiUrl}/api/products?category=cakes&limit=12`);
        if (cakeRes.ok) {
          const data = await cakeRes.json();
          setCakes(data.products || []);
        }
        // Also fetch treats
        const treatsRes = await fetch(`${apiUrl}/api/products?category=treats&limit=6`);
        if (treatsRes.ok) {
          const data = await treatsRes.json();
          setCakes(prev => [...prev, ...(data.products || [])]);
        }
        // Fetch bundles (celebrate bundles with Cloudinary illustrations)
        const bundleRes = await fetch(`${apiUrl}/api/celebrate/bundles`);
        if (bundleRes.ok) {
          const data = await bundleRes.json();
          setBundles(data.bundles || []);
        }
      } catch (err) {
        console.error('[ConciergeCatalogue] Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isOpen]);

  if (!isOpen) return null;

  const currentItems = activeTab === 'celebrate' ? cakes : bundles;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40"
        style={{ zIndex: 40 }}
        onClick={onClose}
      />

      {/* Drawer — slides from bottom */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 bg-white overflow-hidden"
        style={{
          zIndex: 50,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column'
        }}
        data-testid="concierge-catalogue-drawer"
      >
        {/* Drawer handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="rounded-full bg-gray-200" style={{ width: 40, height: 4 }} />
        </div>

        {/* Drawer header */}
        <div className="px-5 pt-3 pb-0 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg" style={{ color: '#1A0A00' }}>
              Celebrate {petName}, Concierge Style
            </h3>
            <p className="text-sm" style={{ color: '#888' }}>
              Curated by Mira — everything personalised for {petName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100"
            style={{ border: 'none', cursor: 'pointer', background: 'transparent' }}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-5 pt-4 pb-3">
          <div
            className="flex rounded-xl p-1"
            style={{ background: '#F5F0FF', border: '1px solid rgba(196,77,255,0.15)' }}
          >
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-all"
                style={{
                  border: 'none',
                  cursor: 'pointer',
                  background: activeTab === tab.id ? '#FFFFFF' : 'transparent',
                  color: activeTab === tab.id ? '#4B0082' : '#888',
                  boxShadow: activeTab === tab.id ? '0 1px 4px rgba(0,0,0,0.10)' : 'none'
                }}
                data-testid={`concierge-tab-${tab.id}`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Section label */}
        <div className="px-5 mb-3">
          {activeTab === 'celebrate' ? (
            <p className="text-xs font-semibold" style={{ color: '#C44400', letterSpacing: '0.05em' }}>
              BIRTHDAY CAKES & TREATS — FROM THE DOGGY BAKERY
            </p>
          ) : (
            <p className="text-xs font-semibold" style={{ color: '#7C3AED', letterSpacing: '0.05em' }}>
              PERSONALISED BUNDLES — MADE FOR {petName.toUpperCase()}
            </p>
          )}
        </div>

        {/* Allergy notice for celebrate tab */}
        {activeTab === 'celebrate' && pet?.allergies?.length > 0 && (
          <div className="px-5 mb-3">
            <div
              className="px-4 py-2 rounded-lg text-sm flex items-center gap-2"
              style={{ background: '#FFF3E0', border: '1px solid #FFCC99', color: '#8B4500' }}
            >
              <span>🛡️</span>
              <span>Always check with your vet. {petName} has a {pet.allergies.slice(0, 2).join(', ')} allergy — our bakers can customise any cake for {petName}!</span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
              <span className="ml-3 text-gray-500 text-sm">Curating for {petName}...</span>
            </div>
          ) : currentItems.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-4xl block mb-3">
                {activeTab === 'celebrate' ? '🎂' : '🎁'}
              </span>
              <p className="text-gray-500 text-sm mb-4">
                {activeTab === 'celebrate'
                  ? 'Our bakers are creating something special for the bakery.'
                  : `Mira is personalising bundles for ${petName}.`}
              </p>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('openMiraAI', {
                  detail: { message: `Suggest celebration ideas for ${petName}`, context: 'celebrate' }
                }))}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
                style={{ background: 'rgba(196,77,255,0.10)', border: '1px solid rgba(196,77,255,0.30)', color: '#7C3AED' }}
              >
                <Sparkles className="w-4 h-4" />
                Ask Mira
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {currentItems.map((item, idx) => (
                activeTab === 'celebrate' ? (
                  <ProductCard key={item.id || idx} product={item} petName={petName} onAddToCart={addToCart} />
                ) : (
                  <BundleCard key={item.id || idx} bundle={item} petName={petName} onAddToCart={addToCart} />
                )
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
};

// ─── Main CelebrateConcierge component ───
const CelebrateConcierge = ({ pet }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const petName = pet?.name || 'your pet';

  return (
    <>
      <section
        className="rounded-2xl p-7 mb-8"
        style={{ background: '#0E0620' }}
        data-testid="celebrate-concierge"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Left column */}
          <div className="flex-1">
            {/* Gold badge */}
            <div
              className="inline-flex items-center gap-1.5 rounded-full mb-3"
              style={{
                background: 'rgba(201,151,58,0.20)',
                border: '1px solid rgba(201,151,58,0.40)',
                padding: '4px 12px',
                color: '#F0C060',
                fontSize: 11,
                fontWeight: 600
              }}
            >
              <Star className="w-3 h-3 fill-current" />
              {petName}'s Concierge
            </div>

            <h2 className="font-extrabold text-white mb-2" style={{ fontSize: '1.25rem' }}>
              Celebrate Personally — The Club Concierge Way
            </h2>

            <p className="mb-5" style={{ fontSize: 13, color: 'rgba(255,255,255,0.60)', lineHeight: 1.7 }}>
              Our concierge team plans every celebration around {petName}'s soul — from custom cakes and pawty
              packages to birthday photoshoots and once-in-a-lifetime experiences.
            </p>

            {/* Service tags */}
            <div className="flex flex-wrap gap-2 mb-5">
              {['Birthday Cakes', 'Pawty Hampers', 'Photoshoots', 'Birthday Box', 'Custom Merch', 'Memory Books'].map(tag => (
                <span
                  key={tag}
                  className="rounded-full"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.14)',
                    padding: '4px 12px',
                    color: 'rgba(255,255,255,0.70)',
                    fontSize: 11
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="rounded-xl font-extrabold"
              style={{
                background: 'linear-gradient(135deg, #C9973A, #F0C060)',
                color: '#0E0620',
                border: 'none',
                padding: '12px 24px',
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer'
              }}
              data-testid="open-concierge-catalogue-btn"
            >
              Browse Celebrate Catalogue
            </button>
          </div>

          {/* Right column — stat */}
          <div className="flex-shrink-0 text-center">
            <div
              className="rounded-full flex items-center justify-center mx-auto mb-2"
              style={{
                width: 80, height: 80,
                background: 'rgba(201,151,58,0.20)',
                border: '2px solid rgba(201,151,58,0.40)',
                fontSize: 34
              }}
            >
              🎂
            </div>
            <p className="font-extrabold" style={{ fontSize: '1.25rem', color: '#F0C060' }}>2,000+</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)' }}>celebrations planned</p>
            <p className="mt-1" style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
              48h response promise
            </p>
          </div>
        </div>
      </section>

      {/* Catalogue Drawer */}
      {drawerOpen && (
        <ConciergeCatalogueDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          pet={pet}
        />
      )}
    </>
  );
};

export default CelebrateConcierge;
