/**
 * PillarNav.jsx
 * Beautiful, engaging pillar navigation with Product/Service toggle
 * Makes Meister the hero - this is their personal concierge!
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, Package, Wrench, ChevronLeft, ChevronRight,
  Cake, Utensils, Home, Plane, Heart, Gamepad2, GraduationCap,
  Scissors, FileText, AlertTriangle, Flower2, PawPrint, Shield,
  Star, ShoppingBag, Stethoscope
} from 'lucide-react';

// Pillar configuration with icons and colors
const PILLARS = [
  { id: 'recommended', label: 'For You', icon: Sparkles, color: 'from-purple-500 to-pink-500', emoji: '✨' },
  { id: 'celebrate', label: 'Celebrate', icon: Cake, color: 'from-pink-500 to-rose-500', emoji: '🎂' },
  { id: 'dine', label: 'Dine', icon: Utensils, color: 'from-amber-500 to-orange-500', emoji: '🍖' },
  { id: 'stay', label: 'Stay', icon: Home, color: 'from-teal-500 to-cyan-500', emoji: '🏠' },
  { id: 'travel', label: 'Travel', icon: Plane, color: 'from-blue-500 to-indigo-500', emoji: '✈️' },
  { id: 'care', label: 'Care', icon: Scissors, color: 'from-pink-500 to-purple-500', emoji: '✂️' },
  { id: 'enjoy', label: 'Play', icon: Gamepad2, color: 'from-violet-500 to-purple-500', emoji: '🎾' },
  { id: 'fit', label: 'Fit', icon: Heart, color: 'from-red-500 to-pink-500', emoji: '💪' },
  { id: 'learn', label: 'Learn', icon: GraduationCap, color: 'from-emerald-500 to-teal-500', emoji: '🎓' },
  { id: 'advisory', label: 'Advisory', icon: Stethoscope, color: 'from-cyan-500 to-blue-500', emoji: '💬' },
  { id: 'paperwork', label: 'Paperwork', icon: FileText, color: 'from-slate-500 to-gray-500', emoji: '📄' },
  { id: 'emergency', label: 'Emergency', icon: AlertTriangle, color: 'from-red-600 to-orange-500', emoji: '🚨' },
  { id: 'farewell', label: 'Farewell', icon: Flower2, color: 'from-purple-400 to-indigo-400', emoji: '🌈' },
  { id: 'adopt', label: 'Adopt', icon: PawPrint, color: 'from-amber-400 to-yellow-500', emoji: '🐾' },
];

const PillarNav = ({ 
  selectedPillar, 
  onSelectPillar, 
  viewMode = 'products',
  onViewModeChange,
  petName = 'Your Pet',
  shoppingForOther = false,
  onShoppingForOtherClick,
  className = ''
}) => {
  const scrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const navigate = useNavigate();
  
  // Check scroll position
  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };
  
  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);
  
  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const scrollAmount = 200;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };
  
  const handlePillarClick = (pillarId) => {
    onSelectPillar(pillarId);
  };
  
  const handleViewModeChange = (mode) => {
    onViewModeChange?.(mode);
    // Navigate to the appropriate page
    if (mode === 'products') {
      navigate('/shop');
    } else {
      navigate('/services');
    }
  };
  
  return (
    <div className={`bg-white border-b border-gray-100 sticky top-0 z-40 ${className}`}>
      <div className="max-w-7xl mx-auto">
        
        {/* Top Row: Product/Service Toggle + Shopping for other */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-50">
          {/* Product/Service Toggle */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-full">
            <button
              onClick={() => handleViewModeChange('products')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                viewMode === 'products'
                  ? 'bg-white text-gray-900 shadow-md'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              data-testid="view-mode-products"
            >
              <Package className="w-4 h-4" />
              <span>Products</span>
            </button>
            <button
              onClick={() => handleViewModeChange('services')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                viewMode === 'services'
                  ? 'bg-white text-gray-900 shadow-md'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              data-testid="view-mode-services"
            >
              <Wrench className="w-4 h-4" />
              <span>Services</span>
            </button>
          </div>
          
          {/* Shopping for other dog link */}
          <button
            onClick={onShoppingForOtherClick}
            className={`flex items-center gap-1.5 text-xs sm:text-sm transition-all ${
              shoppingForOther 
                ? 'text-purple-600 font-medium' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
            data-testid="shopping-for-other"
          >
            <PawPrint className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {shoppingForOther ? 'Shopping for another dog' : `Buying for someone else?`}
            </span>
            <span className="sm:hidden">
              {shoppingForOther ? 'Other dog' : 'Other?'}
            </span>
          </button>
        </div>
        
        {/* Pillar Buttons Row */}
        <div className="relative">
          {/* Left scroll arrow */}
          {showLeftArrow && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 backdrop-blur shadow-md rounded-full flex items-center justify-center text-gray-600 hover:text-gray-900 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          
          {/* Pillars */}
          <div 
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              const isSelected = selectedPillar === pillar.id;
              
              return (
                <button
                  key={pillar.id}
                  onClick={() => handlePillarClick(pillar.id)}
                  className={`group relative flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl font-medium text-sm transition-all duration-300 ${
                    isSelected
                      ? `bg-gradient-to-r ${pillar.color} text-white shadow-lg shadow-purple-200/50 scale-105`
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:scale-102'
                  }`}
                  data-testid={`pillar-${pillar.id}`}
                >
                  {/* Animated background glow for selected */}
                  {isSelected && (
                    <div className={`absolute inset-0 bg-gradient-to-r ${pillar.color} rounded-2xl blur-md opacity-40 -z-10 animate-pulse`} />
                  )}
                  
                  {/* Icon */}
                  <span className={`text-base ${isSelected ? '' : 'group-hover:scale-110 transition-transform'}`}>
                    {pillar.emoji}
                  </span>
                  
                  {/* Label */}
                  <span className="whitespace-nowrap">{pillar.label}</span>
                  
                  {/* Pet name indicator for "For You" */}
                  {pillar.id === 'recommended' && !shoppingForOther && (
                    <span className={`text-xs ${isSelected ? 'text-white/80' : 'text-purple-500'}`}>
                      ({petName})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Right scroll arrow */}
          {showRightArrow && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 backdrop-blur shadow-md rounded-full flex items-center justify-center text-gray-600 hover:text-gray-900 transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PillarNav;
