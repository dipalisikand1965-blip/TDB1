/**
 * CareCategoryStrip.jsx
 * Horizontal scrollable category strip for /care page.
 * Each pill opens CareContentModal with pet-personalised products.
 * Mirrors DineCategoryStrip architecture with sage green palette.
 */

import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import CareContentModal from './CareContentModal';

const CARE_CATEGORIES = [
  { id: 'grooming',     icon: '✂️',  label: 'Grooming',      iconBg: 'linear-gradient(135deg,#E8F5E9,#A5D6A7)' },
  { id: 'dental',       icon: '🦷',  label: 'Dental & Paw',  iconBg: 'linear-gradient(135deg,#F3E5F5,#CE93D8)' },
  { id: 'coat',         icon: '🌿',  label: 'Coat & Skin',   iconBg: 'linear-gradient(135deg,#E8F5E9,#C8E6C9)' },
  { id: 'wellness',     icon: '🏥',  label: 'Wellness',       iconBg: 'linear-gradient(135deg,#E3F2FD,#90CAF9)' },
  { id: 'senior',       icon: '🌸',  label: 'Senior Care',   iconBg: 'linear-gradient(135deg,#FCE4EC,#F48FB1)' },
  { id: 'supplements',  icon: '💊',  label: 'Supplements',   iconBg: 'linear-gradient(135deg,#FFF9C4,#FFF176)' },
  { id: 'soul',         icon: '✨',  label: 'Soul Care',     iconBg: 'linear-gradient(135deg,#EDE7F6,#B39DDB)' },
  { id: 'mira',         icon: '🪄',  label: "Mira's Picks",  iconBg: 'linear-gradient(135deg,#FCE4EC,#F48FB1)' },
];

const G = {
  sage:      '#40916C',
  deepMid:   '#2D6A4F',
  pale:      '#D8F3DC',
  cream:     '#F0FFF4',
  darkText:  '#1B4332',
  mutedText: '#52796F',
  border:    'rgba(45,106,79,0.18)',
};

const CareCategoryStrip = ({ pet, onDimSelect, activeDim }) => {
  const [activeCategory, setActiveCategory] = useState(null);
  const [showModal, setShowModal]           = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [canScrollLeft, setCanScrollLeft]   = useState(false);
  const scrollRef = useRef(null);

  const handleCategoryClick = (cat) => {
    setActiveCategory(cat);
    setShowModal(true);
    if (onDimSelect) onDimSelect(cat.id);
  };

  const updateScrollButtons = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollButtons();
    el.addEventListener('scroll', updateScrollButtons, { passive: true });
    window.addEventListener('resize', updateScrollButtons);
    return () => {
      el.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, []);

  const scrollBy = (amount) => {
    scrollRef.current?.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <>
      <div
        data-testid="care-category-strip"
        style={{
          background: '#fff',
          borderBottom: `1px solid ${G.border}`,
          position: 'sticky',
          top: 0,
          zIndex: 40,
          position: 'relative',
        }}
      >
        {canScrollLeft && (
          <button
            onClick={() => scrollBy(-240)}
            style={{
              position: 'absolute', left: 0, top: 0, bottom: 0, zIndex: 10,
              width: 32, background: 'linear-gradient(to right, white 60%, transparent)',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            aria-label="Scroll left"
          >
            <span style={{ fontSize: 14, color: '#888' }}>‹</span>
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex overflow-x-auto"
          style={{
            scrollbarWidth: 'none', msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            display: 'flex',
            paddingLeft: canScrollLeft ? 32 : 8,
            paddingRight: canScrollRight ? 40 : 12,
          }}
        >
          {CARE_CATEGORIES.map(cat => {
            const isActive = activeCategory?.id === cat.id && showModal;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat)}
                data-testid={`care-category-${cat.id}`}
                style={{
                  minWidth: 82, height: 72,
                  padding: '10px 12px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  flexShrink: 0,
                  background: 'transparent', border: 'none',
                  borderBottomWidth: 3, borderBottomStyle: 'solid',
                  borderBottomColor: isActive ? G.sage : 'transparent',
                  cursor: 'pointer',
                  transition: 'border-color 150ms ease',
                }}
              >
                <div
                  style={{
                    width: 34, height: 34, borderRadius: 10,
                    background: cat.iconBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, marginBottom: 4, flexShrink: 0,
                  }}
                >
                  {cat.icon}
                </div>
                <span
                  style={{
                    fontSize: 11, fontWeight: isActive ? 700 : 500,
                    color: isActive ? G.deepMid : '#555',
                    whiteSpace: 'nowrap', maxWidth: 84,
                    overflow: 'hidden', textOverflow: 'ellipsis',
                  }}
                >
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>

        {canScrollRight && (
          <button
            onClick={() => scrollBy(240)}
            style={{
              position: 'absolute', right: 0, top: 0, bottom: 0, zIndex: 10,
              width: 48, background: 'linear-gradient(to left, white 50%, transparent)',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            aria-label="Scroll right"
            data-testid="care-category-strip-scroll-right"
          >
            <span style={{ fontSize: 16, color: G.sage, fontWeight: 700 }}>›</span>
          </button>
        )}
      </div>

      <AnimatePresence>
        {showModal && activeCategory && (
          <CareContentModal
            isOpen={showModal}
            onClose={() => { setShowModal(false); setActiveCategory(null); }}
            category={activeCategory.id}
            pet={pet}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default CareCategoryStrip;
