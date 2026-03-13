/**
 * CelebrateCategoryStrip.jsx
 * 
 * Enhanced category strip that includes ALL celebrate sections:
 * - Products (Cakes, Treats, etc.)
 * - Bundles
 * - Services
 * - Soul Picks
 * - Mira's Picks
 * 
 * Clicking opens modal/drawer with content
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import CelebrateContentModal from './CelebrateContentModal';

// All celebrate categories with visual styling
const CELEBRATE_CATEGORIES = [
  // Product categories
  { id: 'birthday-cakes', name: 'Birthday Cakes', icon: '🎂', color: 'from-pink-100 to-pink-50', borderColor: 'border-pink-300' },
  { id: 'breed-cakes', name: 'Breed Cakes', icon: '🐾', color: 'from-purple-100 to-purple-50', borderColor: 'border-purple-300' },
  { id: 'pupcakes', name: 'Pupcakes & Dognuts', icon: '🧁', color: 'from-amber-100 to-amber-50', borderColor: 'border-amber-300' },
  { id: 'desi-treats', name: 'Desi Treats', icon: '🍖', color: 'from-orange-100 to-orange-50', borderColor: 'border-orange-300' },
  { id: 'gift-hampers', name: 'Gift Hampers', icon: '🎁', color: 'from-blue-100 to-blue-50', borderColor: 'border-blue-300' },
  { id: 'party-items', name: 'Party Items', icon: '🎀', color: 'from-rose-100 to-rose-50', borderColor: 'border-rose-300' },
  
  // Special sections (Soul-based)
  { id: 'soul-picks', name: "Soul Picks", icon: '✨', color: 'from-violet-100 to-violet-50', borderColor: 'border-violet-400', isSoulSection: true },
  { id: 'mira-picks', name: "Mira's Picks", icon: '💫', color: 'from-pink-100 to-pink-50', borderColor: 'border-pink-400', isSoulSection: true },
  { id: 'bundles', name: 'Bundles', icon: '📦', color: 'from-teal-100 to-teal-50', borderColor: 'border-teal-300' },
  { id: 'breed-smart', name: 'Breed Smart', icon: '🐕', color: 'from-green-100 to-green-50', borderColor: 'border-green-300' },
  { id: 'soul-made', name: 'Soul Made', icon: '💜', color: 'from-purple-100 to-purple-50', borderColor: 'border-purple-400', isSoulSection: true },
  
  // Premium at end
  { id: 'premium', name: 'Premium', icon: '👑', color: 'from-gradient-to-r from-pink-500 to-purple-500', borderColor: 'border-purple-500', isPremium: true },
];

// Single category card
const CategoryCard = ({ category, isActive, onClick }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        relative flex flex-col items-center justify-center
        min-w-[100px] md:min-w-[120px] h-20 md:h-24 px-3 py-2
        rounded-2xl border-2 transition-all duration-200
        ${category.isPremium 
          ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white border-transparent shadow-lg shadow-purple-500/30'
          : `bg-gradient-to-b ${category.color} ${category.borderColor}`
        }
        ${isActive ? 'ring-2 ring-purple-500 ring-offset-2' : ''}
        hover:shadow-md cursor-pointer
      `}
      data-testid={`category-card-${category.id}`}
    >
      {/* Soul badge for special sections */}
      {category.isSoulSection && (
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
          <span className="text-[8px] text-white">✦</span>
        </div>
      )}
      
      {/* Icon */}
      <span className="text-2xl md:text-3xl mb-1">{category.icon}</span>
      
      {/* Name */}
      <span className={`
        text-xs md:text-sm font-medium text-center leading-tight
        ${category.isPremium ? 'text-white' : 'text-gray-700'}
      `}>
        {category.name}
      </span>
    </motion.button>
  );
};

const CelebrateCategoryStrip = ({ pet, onCategorySelect }) => {
  const [activeCategory, setActiveCategory] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Check scroll position
  const checkScrollPosition = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const element = scrollRef.current;
    if (element) {
      element.addEventListener('scroll', checkScrollPosition);
      checkScrollPosition();
      return () => element.removeEventListener('scroll', checkScrollPosition);
    }
  }, []);

  // Scroll handlers
  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Handle category click
  const handleCategoryClick = (categoryId) => {
    setActiveCategory(categoryId);
    setShowModal(true);
    if (onCategorySelect) {
      onCategorySelect(categoryId);
    }
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowModal(false);
    // Keep activeCategory for visual feedback
  };

  return (
    <>
      <section className="relative bg-gradient-to-b from-purple-50/50 to-white py-4" data-testid="celebrate-category-strip">
        {/* Scroll buttons */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors md:flex hidden"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
        )}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors md:flex hidden"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        )}

        {/* Categories container */}
        <div 
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide px-4 md:px-8"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {CELEBRATE_CATEGORIES.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              isActive={activeCategory === category.id}
              onClick={() => handleCategoryClick(category.id)}
            />
          ))}
        </div>

        {/* Fade edges on mobile */}
        <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-purple-50/50 to-transparent pointer-events-none md:hidden" />
        <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-white to-transparent pointer-events-none md:hidden" />
      </section>

      {/* Content Modal */}
      <CelebrateContentModal
        isOpen={showModal}
        onClose={handleCloseModal}
        categoryId={activeCategory}
        pet={pet}
        pillar="celebrate"
      />
    </>
  );
};

export default CelebrateCategoryStrip;
export { CELEBRATE_CATEGORIES };
