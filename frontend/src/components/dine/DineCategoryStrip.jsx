/**
 * DineCategoryStrip.jsx
 *
 * Horizontal scrollable category strip for /dine — same golden principle as
 * CelebrateCategoryStrip. Each tile opens DineContentModal.
 *
 * Spec: 72px height, white bg, border-bottom: 1px solid #F0E8E0
 * Active: border-bottom: 3px solid #FF8C42; color: #C44400
 */

import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import DineContentModal from './DineContentModal';

export const DINE_CATEGORIES = [
  {
    id: 'daily-meals',
    name: 'Daily Meals',
    icon: '🐟',
    iconBg: 'linear-gradient(135deg, #FFF3E0, #FFE0B2)',
  },
  {
    id: 'treats-rewards',
    name: 'Treats & Rewards',
    icon: '🦴',
    iconBg: 'linear-gradient(135deg, #FCE4EC, #F8BBD0)',
  },
  {
    id: 'supplements',
    name: 'Supplements',
    icon: '💊',
    iconBg: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)',
  },
  {
    id: 'frozen-fresh',
    name: 'Frozen & Fresh',
    icon: '🧊',
    iconBg: 'linear-gradient(135deg, #E3F2FD, #B3E5FC)',
  },
  {
    id: 'homemade-recipes',
    name: 'Homemade & Recipes',
    icon: '🍳',
    iconBg: 'linear-gradient(135deg, #FFFDE7, #FFF59D)',
  },
  {
    id: 'bundles',
    name: 'Bundles',
    icon: '🎁',
    iconBg: 'linear-gradient(135deg, #FFF3E0, #FFCCBC)',
  },
  {
    id: 'soul-picks',
    name: 'Soul Picks',
    icon: '✨',
    iconBg: 'linear-gradient(135deg, #C44DFF, #FF6B9D)',
  },
  {
    id: 'miras-picks',
    name: "Mira's Picks",
    icon: '💫',
    iconBg: 'linear-gradient(135deg, #FCE4EC, #FF6B9D)',
  },
  {
    id: 'soul_made',
    name: 'Soul Made™',
    icon: '✦',
    iconBg: 'linear-gradient(135deg, #FFF3E0, #FFE0B2)',
  },
];

const DineCategoryStrip = ({ pet, onCategorySelect }) => {
  const [activeCategory, setActiveCategory] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const scrollRef = useRef(null);

  const handleCategoryClick = (cat) => {
    setActiveCategory(cat);
    setShowModal(true);
    if (onCategorySelect) onCategorySelect(cat);
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
        className="w-full bg-white relative"
        style={{ borderBottom: '1px solid #F0E8E0' }}
        data-testid="dine-category-strip"
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

        <div
          ref={scrollRef}
          className="flex overflow-x-auto"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            paddingLeft: canScrollLeft ? 32 : 0,
            paddingRight: canScrollRight ? 40 : 12,
          }}
        >
          {DINE_CATEGORIES.map((cat) => {
            const isActive = activeCategory?.id === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat)}
                className="flex flex-col items-center flex-shrink-0"
                style={{
                  minWidth: 82,
                  height: 90,
                  padding: '10px 12px',
                  cursor: 'pointer',
                  background: 'transparent',
                  border: 'none',
                  borderBottomWidth: 3,
                  borderBottomStyle: 'solid',
                  borderBottomColor: isActive ? '#FF8C42' : 'transparent',
                  transition: 'border-color 150ms ease',
                }}
                data-testid={`dine-category-strip-${cat.id}`}
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
                    fontWeight: 500,
                    color: isActive ? '#C44400' : '#555',
                    whiteSpace: 'normal',
                    maxWidth: 82,
                    lineHeight: 1.25,
                    wordBreak: 'break-word',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
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
            className="hidden md:flex absolute right-0 top-0 bottom-0 z-10 items-center justify-center"
            style={{ width: 48, background: 'linear-gradient(to left, white 50%, transparent)', border: 'none', cursor: 'pointer' }}
            aria-label="Scroll right"
            data-testid="dine-category-strip-scroll-right"
          >
            <span style={{ fontSize: 16, color: '#FF8C42', fontWeight: 700 }}>›</span>
          </button>
        )}
      </div>

      <AnimatePresence>
        {showModal && activeCategory && (
          <DineContentModal
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

export default DineCategoryStrip;
