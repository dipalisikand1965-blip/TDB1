/**
 * CelebrateCategoryStrip.jsx
 *
 * Spec: 72px height, white bg, border-bottom: 1px solid #F0E8E0
 * Horizontally scrollable, scrollbar hidden
 * Active: border-bottom: 3px solid #FF8C42; color: #C44400
 */

import React, { useState, useRef } from 'react';
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
];

export { CELEBRATE_CATEGORIES };

const CelebrateCategoryStrip = ({ pet, onCategorySelect }) => {
  const [activeCategory, setActiveCategory] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const scrollRef = useRef(null);

  const handleCategoryClick = (cat) => {
    setActiveCategory(cat);
    setShowModal(true);
    if (onCategorySelect) onCategorySelect(cat);
  };

  return (
    <>
      {/* Strip */}
      <div
        className="w-full bg-white"
        style={{ borderBottom: '1px solid #F0E8E0' }}
        data-testid="celebrate-category-strip"
      >
        <div
          ref={scrollRef}
          className="flex overflow-x-auto"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
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
                  minWidth: 78,
                  height: 72,
                  padding: '10px 12px',
                  borderBottom: isActive ? '3px solid #FF8C42' : '3px solid transparent',
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
                    fontSize: 10,
                    fontWeight: 500,
                    color: isActive ? '#C44400' : '#555',
                    whiteSpace: 'nowrap',
                    maxWidth: 72,
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
