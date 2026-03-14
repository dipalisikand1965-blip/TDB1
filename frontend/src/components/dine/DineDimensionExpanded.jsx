/**
 * DineDimensionExpanded.jsx
 * Replicates SoulPillarExpanded pattern for /dine dimensions.
 * Layout: Panel header → Mira bar → Tab bar → Product grid → DrawerBottomBar
 * Rendered via ReactDOM.createPortal into document.body to escape stacking context.
 */

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Loader2, Sparkles } from 'lucide-react';
import { useResizeMobile } from '../../hooks/useResizeMobile';
import DrawerBottomBar from '../celebrate/DrawerBottomBar';
import ProductDetailModal from '../celebrate/ProductDetailModal';
import { getApiUrl } from '../../utils/api';

const API_BASE = process.env.REACT_APP_BACKEND_URL;

const sendToConcierge = async ({ requestType, label, message, petName, pillar }) => {
  try {
    await fetch(`${API_BASE}/api/concierge/pillar-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pillar, request_type: requestType, request_label: label, pet_name: petName, message, source: 'dine_dimension_expanded' }),
    });
  } catch {}
};

const DineDimensionExpanded = ({ dimension, pet, token, onClose }) => {
  const isMobile = useResizeMobile();
  const [activeTab, setActiveTab] = useState(0);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const petName = pet?.name || 'your dog';

  useEffect(() => {
    if (!dimension) return;
    setLoading(true);
    setProducts([]);
    const controller = new AbortController();
    fetch(`${getApiUrl()}/api/products?pillar=dine&category=${dimension.productCategory}&limit=20`, {
      signal: controller.signal,
    })
      .then(r => r.json())
      .then(data => setProducts(Array.isArray(data.products) ? data.products : Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [dimension]);

  if (!dimension) return null;

  const panel = (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9200,
        background: 'rgba(26,10,0,0.55)',
        display: 'flex',
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'center',
        padding: isMobile ? '88px 0 0' : '20px',
        overflowY: isMobile ? 'auto' : 'visible',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#FFFFFF',
          borderRadius: isMobile ? '20px 20px 0 0' : 24,
          width: '100%',
          maxWidth: 640,
          maxHeight: isMobile ? 'none' : '88vh',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(26,10,0,0.25)',
        }}
        data-testid={`dine-dim-expanded-${dimension.id}`}
      >
        {/* Header */}
        <div style={{
          padding: '20px 20px 16px',
          borderBottom: `2px solid ${dimension.color}22`,
          background: dimension.bg,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 24 }}>{dimension.icon}</span>
              <div>
                <p style={{ fontSize: 17, fontWeight: 800, color: '#1A0A00' }}>{dimension.title}</p>
                <p style={{ fontSize: 12, color: '#888' }}>{dimension.description}</p>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <X size={22} color="#888" />
            </button>
          </div>

          {/* Mira bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#1A0A00', borderRadius: 12, padding: '10px 14px',
          }}>
            <Sparkles size={14} color={dimension.color} />
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', flex: 1 }}>
              {dimension.miraQuote(
                petName,
                pet?.preferences?.favorite_flavors || [],
                (() => {
                  const s = new Set();
                  const add = (v) => { if (Array.isArray(v)) v.forEach(x => x && s.add(x)); else if (v) s.add(v); };
                  add(pet?.preferences?.allergies); add(pet?.doggy_soul_answers?.food_allergies); add(pet?.allergies);
                  return [...s].filter(a => a.toLowerCase() !== 'none');
                })(),
                pet
              )}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: `1.5px solid ${dimension.color}22`, background: '#FAFAFA', flexShrink: 0, overflowX: 'auto' }}>
          {dimension.tabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              style={{
                padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: activeTab === i ? 700 : 500,
                color: activeTab === i ? dimension.color : '#888',
                borderBottom: activeTab === i ? `2.5px solid ${dimension.color}` : '2.5px solid transparent',
                marginBottom: -1.5, whiteSpace: 'nowrap', transition: 'color 0.2s',
              }}
            >{tab}</button>
          ))}
        </div>

        {/* Product grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              <Loader2 size={28} color={dimension.color} className="animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ fontSize: 28, marginBottom: 10 }}>{dimension.icon}</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#1A0A00', marginBottom: 6 }}>
                {dimension.title} coming soon
              </p>
              <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
                Mira is curating the best options for {petName}. Check back soon.
              </p>
              <button
                onClick={() => sendToConcierge({ requestType: 'product_request', label: dimension.title, message: `Looking for ${dimension.title.toLowerCase()} for ${petName}`, petName, pillar: 'dine' })}
                style={{ background: dimension.color, color: '#fff', border: 'none', borderRadius: 20, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                Ask Mira to find options
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {products.map(p => (
                <button
                  key={p.id || p._id}
                  onClick={() => setSelectedProduct(p)}
                  style={{
                    textAlign: 'left', background: '#FFFBF7',
                    border: `1.5px solid ${dimension.color}22`,
                    borderRadius: 14, padding: 12, cursor: 'pointer',
                    transition: 'border-color 0.2s',
                  }}
                >
                  {p.image && (
                    <img src={p.image} alt={p.name} style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 10, marginBottom: 8 }} />
                  )}
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#1A0A00', marginBottom: 4 }}>{p.name}</p>
                  {p.price && <p style={{ fontSize: 13, fontWeight: 700, color: dimension.color }}>₹{p.price}</p>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <DrawerBottomBar
          color={dimension.color}
          petName={petName}
          pillar="dine"
          onAskMira={() => {
            onClose();
            window.dispatchEvent(new CustomEvent('openMiraAI', { detail: { message: `Help me choose ${dimension.title.toLowerCase()} for ${petName}`, context: 'dine' } }));
          }}
          onConcierge={() => sendToConcierge({ requestType: 'concierge', label: dimension.title, message: `Concierge help for ${dimension.title} for ${petName}`, petName, pillar: 'dine' })}
        />
      </div>

      {/* Product detail modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          petName={petName}
          pillarColor={dimension.color}
        />
      )}
    </div>
  );

  return ReactDOM.createPortal(panel, document.body);
};

export default DineDimensionExpanded;
