/**
 * CareCategoryStrip.jsx
 * Horizontal scrollable category strip for /care page.
 * Each pill opens CareContentModal with pet-personalised products.
 * Matches DineCategoryStrip structure exactly — centre-aligned, 72px height.
 */

import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import CareContentModal from './CareContentModal';

const CARE_CATEGORIES = [
  { id: 'grooming',     icon: '✂️',  name: 'Grooming',      iconBg: 'linear-gradient(135deg, #E8F5E9, #A5D6A7)' },
  { id: 'dental',       icon: '🦷',  name: 'Dental & Paw',  iconBg: 'linear-gradient(135deg, #F3E5F5, #CE93D8)' },
  { id: 'coat',         icon: '🌿',  name: 'Coat & Skin',   iconBg: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)' },
  { id: 'wellness',     icon: '🏥',  name: 'Wellness',       iconBg: 'linear-gradient(135deg, #E3F2FD, #90CAF9)' },
  { id: 'senior',       icon: '🌸',  name: 'Senior Care',   iconBg: 'linear-gradient(135deg, #FCE4EC, #F48FB1)' },
  { id: 'supplements',  icon: '💊',  name: 'Supplements',   iconBg: 'linear-gradient(135deg, #FFF9C4, #FFF176)' },
  { id: 'soul',         icon: '✨',  name: 'Soul Care',     iconBg: 'linear-gradient(135deg, #EDE7F6, #B39DDB)' },
  { id: 'mira',         icon: '🪄',  name: "Mira's Picks",  iconBg: 'linear-gradient(135deg, #FCE4EC, #F48FB1)' },
];

const G = {
  sage:    '#40916C',
  deepMid: '#2D6A4F',
  border:  'rgba(45,106,79,0.18)',
};

const CareCategoryStrip = ({ pet, onDimSelect, activeDim }) => {
  const [activeCategory, setActiveCategory] = useState(null);
  const [showModal, setShowModal]           = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
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
        className="w-full bg-white relative"
        style={{ borderBottom: `1px solid ${G.border}` }}
      >
        {canScrollLeft && (
          <button
            onClick={() => scrollBy(-240)}
            className="hidden md:flex absolute left-0 top-0 bottom-0 z-10 items-center justify-center"
            style={{ width: 32, background: 'linear-gradient(to right, white 60%, transparent)', border: 'none', cursor: 'pointer' }}
            aria-label="Scroll left"
          >
            <span style={{ fontSize: 14, color: '#888' }}>‹</span>
          </button>
        )}

        {/* Scrollable row — same as DineCategoryStrip */}
        <div
          ref={scrollRef}
          className="flex overflow-x-auto"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            paddingLeft: canScrollLeft ? 32 : 0,
            paddingRight: canScrollRight ? 40 : 12,
            justifyContent: 'center',
          }}
        >
          {CARE_CATEGORIES.map(cat => {
            const isActive = activeCategory?.id === cat.id && showModal;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat)}
                className="flex flex-col items-center flex-shrink-0"
                data-testid={`care-category-${cat.id}`}
                style={{
                  minWidth: 82,
                  height: 72,
                  padding: '10px 12px',
                  cursor: 'pointer',
                  background: 'transparent',
                  border: 'none',
                  borderBottomWidth: 3,
                  borderBottomStyle: 'solid',
                  borderBottomColor: isActive ? G.sage : 'transparent',
                  transition: 'border-color 150ms ease',
                }}
              >
                <div
                  className="flex items-center justify-center mb-1 flex-shrink-0"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: cat.iconBg,
                    fontSize: 18,
                  }}
                >
                  {cat.icon}
                </div>
                <span
                  className="text-center leading-tight"
                  style={{
                    fontSize: 11,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? G.deepMid : '#555',
                    whiteSpace: 'nowrap',
                    maxWidth: 84,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {cat.name}
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
