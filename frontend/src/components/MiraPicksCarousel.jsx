/**
 * MiraPicksCarousel.jsx
 * Subtle, persuasive horizontal carousel of curated picks
 * Like travel deal cards - small, elegant, with reason tags
 */

import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Sparkles, ChevronLeft, ChevronRight, Star, ArrowRight,
  RefreshCw, Loader2, ShoppingCart
} from 'lucide-react';
import { getApiUrl } from '../utils/api';
import { getPetPhotoUrl } from '../utils/petAvatar';
import { motion } from 'framer-motion';

const MiraPicksCarousel = ({ 
  pillar,
  petId,
  petName,
  petPhoto,
  userId,
  onSelectService,
  onSelectProduct,
  onQuickAdd,
  className = ''
}) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, [pillar, petId]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      let url = `${getApiUrl()}/api/recommendations/`;
      if (petId) {
        url += `pet/${petId}?limit=8`;
      } else {
        url += `dashboard?limit=8`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const filtered = (data.recommendations || []).filter(r => 
          r.pillar === pillar || r.category === pillar || !r.pillar
        );
        setRecommendations(filtered.length > 0 ? filtered : data.recommendations?.slice(0, 6) || []);
      }
    } catch (error) {
      console.debug('Failed to fetch recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 280;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      setTimeout(checkScroll, 300);
    }
  };

  useEffect(() => {
    checkScroll();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', checkScroll);
      return () => ref.removeEventListener('scroll', checkScroll);
    }
  }, [recommendations]);

  if (loading) {
    return (
      <div className={`py-4 ${className}`}>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Finding perfect picks...</span>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <div className={`${className}`}>
      {/* Header - Subtle with pet photo */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* Pet Photo Circle */}
          {(petPhoto || petName) && (
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 overflow-hidden border-2 border-white shadow-sm">
                {petPhoto ? (
                  <img src={petPhoto} alt={petName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-purple-500 text-xs font-bold">
                    {petName?.charAt(0)}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-purple-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-2 h-2 text-white" />
              </div>
            </div>
          )}
          
          <div>
            <p className="text-sm font-medium text-gray-900">
              {petName ? `Recommended for ${petName}` : 'Mira Picks'}
            </p>
          </div>
        </div>

        {/* Scroll Arrows */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all
              ${canScrollLeft 
                ? 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm' 
                : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all
              ${canScrollRight 
                ? 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm' 
                : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div 
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {recommendations.map((rec, idx) => (
          <PickCard 
            key={idx}
            recommendation={rec}
            petName={petName}
            onSelect={rec.type === 'product' ? onSelectProduct : onSelectService}
            onQuickAdd={onQuickAdd}
          />
        ))}
      </div>
    </div>
  );
};

// Individual Pick Card - Small, elegant like travel deal cards
const PickCard = ({ recommendation, petName, onSelect, onQuickAdd }) => {
  const { title, description, reason, price, image, type, category } = recommendation;
  const [isHovered, setIsHovered] = useState(false);
  
  // Generate a reason if not provided
  const displayReason = reason || (
    category === 'weight' ? 'Good for weight management' :
    category === 'training' ? 'Build healthy habits' :
    category === 'senior' ? 'Gentle on senior pets' :
    category === 'puppy' ? 'Perfect for puppies' :
    category === 'nutrition' ? 'Supports nutrition goals' :
    petName ? `Recommended for ${petName}` : 'Curated pick'
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-shrink-0 w-[200px] sm:w-[220px] group"
      style={{ scrollSnapAlign: 'start' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        onClick={() => onSelect?.(recommendation)}
        className="bg-white rounded-xl border border-gray-100 overflow-hidden cursor-pointer 
                   hover:shadow-lg hover:border-purple-200 transition-all duration-200"
      >
        {/* Image/Icon Area - Small */}
        <div className="relative h-24 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
          {image ? (
            <img 
              src={image} 
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          )}
          
          {/* Type Badge */}
          <Badge className="absolute top-2 left-2 bg-white/90 text-gray-700 text-[10px] px-1.5 py-0.5 font-medium">
            {type === 'product' ? 'Product' : 'Service'}
          </Badge>
        </div>

        {/* Content */}
        <div className="p-3">
          {/* Title */}
          <h4 className="font-semibold text-gray-900 text-sm line-clamp-1 group-hover:text-purple-700 transition-colors">
            {title}
          </h4>
          
          {/* Reason Tag - The key differentiator */}
          <p className="text-[11px] text-purple-600 mt-1 flex items-center gap-1 line-clamp-1">
            <Star className="w-3 h-3 flex-shrink-0 fill-purple-500 text-purple-500" />
            <span className="truncate">{displayReason}</span>
          </p>

          {/* Price + Action */}
          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-50">
            {price ? (
              <div>
                <span className="text-sm font-bold text-gray-900">₹{price.toLocaleString()}</span>
                {type === 'service' && <span className="text-[10px] text-gray-400 ml-0.5">onwards</span>}
              </div>
            ) : (
              <span className="text-xs text-gray-500">View details</span>
            )}
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect?.(recommendation);
              }}
              className="text-xs text-purple-600 font-medium hover:text-purple-800 flex items-center gap-0.5"
            >
              View <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MiraPicksCarousel;
