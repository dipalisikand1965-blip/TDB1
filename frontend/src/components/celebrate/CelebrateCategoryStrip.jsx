/**
 * CelebrateCategoryStrip.jsx
 *
 * Spec: 72px height, white bg, border-bottom: 1px solid #F0E8E0
 * Horizontally scrollable, scrollbar hidden
 * Active: border-bottom: 3px solid #FF8C42; color: #C44400
 */

import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import CelebrateContentModal from './CelebrateContentModal';

// Category definitions — IDs must match CATEGORY_API in CelebrateContentModal
const CELEBRATE_CATEGORIES = [
  {
    id: 'birthday-cakes',
    name: 'Birthday Cakes',
    icon: '🎂',
    iconBg: 'linear-gradient(135deg, #FCE4EC, #F8BBD0)'
  },
  {
    id: 'breed-cakes',
    name: 'Breed Cakes',
    icon: '🐕',
    iconBg: 'linear-gradient(135deg, #F3E5F5, #E1BEE7)'
  },
  {
    id: 'pupcakes',
    name: 'Pupcakes & Dognuts',
    icon: '🧁',
    iconBg: 'linear-gradient(135deg, #FFF9C4, #FFF176)'
  },
  {
    id: 'desi-treats',
    name: 'Desi Treats',
    icon: '🪔',
    iconBg: 'linear-gradient(135deg, #FFF3E0, #FFE0B2)'
  },
  {
    id: 'frozen-treats',
    name: 'Frozen Treats',
    icon: '🧊',
    iconBg: 'linear-gradient(135deg, #E3F2FD, #B3E5FC)'
  },
  {
    id: 'hampers',
    name: 'Gift Hampers',
    icon: '🎁',
    iconBg: 'linear-gradient(135deg, #E3F2FD, #BBDEFB)'
  },
  {
    id: 'bundles',
    name: 'Bundles',
    icon: '🎀',
    iconBg: 'linear-gradient(135deg, #F3E5F5, #CE93D8)'
  },
  {
    id: 'party',
    name: 'Party & Decor',
    icon: '🎉',
    iconBg: 'linear-gradient(135deg, #FFF9C4, #FFEB3B)'
  },
  {
    id: 'nut-butters',
    name: 'Nut Butters',
    icon: '🥜',
    iconBg: 'linear-gradient(135deg, #FFF3E0, #FFCC80)'
  },
  {
    id: 'soul-picks',
    name: 'Soul Picks',
    icon: '✨',
    iconBg: 'linear-gradient(135deg, #C44DFF, #FF6B9D)'
  },
  {
    id: 'miras-picks',
    name: "Mira's Picks",
    icon: '💫',
    iconBg: 'linear-gradient(135deg, #FCE4EC, #FF6B9D)'
  },
  {
    id: 'soul_made',
    name: 'Soul Made™',
    icon: '✦',
    iconBg: 'linear-gradient(135deg, #E8D5F5, #C44DFF)'
  },
  {
    id: 'portraits',
    name: 'Portraits & Photoshoot',
    icon: '📸',
    iconBg: 'linear-gradient(135deg, #FFF8EE, #F5E6C8)'
  },
  {
    id: 'memory_books',
    name: 'Memory Books',
    icon: '📖',
    iconBg: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)'
  },
];

export { CELEBRATE_CATEGORIES };

const CelebrateCategoryStrip = ({ pet, onCategorySelect }) => {
  const [activeCategory, setActiveCategory] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const scrollRef = useRef(null);

  const handleCategoryClick = (cat) => {
    setActiveCategory(cat);
    setShowModal(false); // modal handled by parent — outside Framer Motion tree
    if (onCategorySelect) onCategorySelect(cat.id, cat);
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
      {/* Strip */}
      <div
        className="w-full bg-white relative"
        style={{ borderBottom: '1px solid #F0E8E0' }}
        data-testid="celebrate-category-strip"
      >
        {/* Left scroll arrow — desktop only */}
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

        <div
          ref={scrollRef}
          className="flex overflow-x-auto"
          style={{
            display: 'flex',
            gap: '10px',
            overflowX: 'auto',
            paddingBottom: '8px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            padding: '4px 0 12px',
            paddingLeft: canScrollLeft ? 32 : 8,
            paddingRight: canScrollRight ? 40 : 12
          }}
        >
          {CELEBRATE_CATEGORIES.map((cat) => {
            const isActive = activeCategory?.id === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat)}
                className="flex flex-col items-center flex-shrink-0"
                style={{
                  flexShrink: 0,
                  minHeight: '44px',
                  minWidth: 78,
                  height: 76,
                  padding: '10px 16px',
                  cursor: 'pointer',
                  background: 'transparent',
                  border: 'none',
                  borderBottomWidth: 3,
                  borderBottomStyle: 'solid',
                  borderBottomColor: isActive ? '#FF8C42' : 'transparent',
                  transition: 'border-color 150ms ease'
                }}
                data-testid={`category-strip-${cat.id}`}
              >
                {/* Icon box */}
                <div
                  className="flex items-center justify-center mb-1 flex-shrink-0"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: cat.iconBg,
                    fontSize: 18
                  }}
                >
                  {cat.icon}
                </div>
                {/* Label */}
                <span
                  className="text-center leading-tight"
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: isActive ? '#C44400' : '#555',
                    whiteSpace: 'nowrap',
                    maxWidth: 90,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right scroll arrow — desktop only, shows when more items exist */}
        {canScrollRight && (
          <button
            onClick={() => scrollBy(240)}
            className="hidden md:flex absolute right-0 top-0 bottom-0 z-10 items-center justify-center"
            style={{ width: 48, background: 'linear-gradient(to left, white 50%, transparent)', border: 'none', cursor: 'pointer' }}
            aria-label="Scroll right — more categories"
            data-testid="category-strip-scroll-right"
          >
            <span style={{ fontSize: 16, color: '#FF8C42', fontWeight: 700 }}>›</span>
          </button>
        )}
      </div>

      {/* Category Modal */}
      <AnimatePresence>
        {showModal && activeCategory && (
          <CelebrateContentModal
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

export default CelebrateCategoryStrip;
