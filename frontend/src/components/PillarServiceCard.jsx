/**
 * PillarServiceCard.jsx
 * MakeMyTrip-inspired service card with smart recommendations
 * Features: Image overlay, pricing, quick actions, related products
 */

import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  ChevronRight, Star, Clock, Users, Sparkles, 
  ArrowRight, Heart, Share2, Check, ShoppingBag,
  Plus, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PillarServiceCard = ({
  service,
  onSelect,
  onBookNow,
  relatedProducts = [],
  isSelected = false,
  compact = false,
  showRelated = true
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showProducts, setShowProducts] = useState(false);

  const {
    id,
    title,
    name,
    description,
    image,
    price,
    originalPrice,
    duration,
    rating,
    reviews,
    badge,
    badgeColor,
    highlights = [],
    gradient = 'from-purple-500 to-pink-500',
    icon,
    category
  } = service;

  const displayTitle = title || name;
  const discount = originalPrice ? Math.round((1 - price / originalPrice) * 100) : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card 
        className={`overflow-hidden transition-all duration-300 cursor-pointer border-0 shadow-md hover:shadow-xl ${
          isSelected ? 'ring-2 ring-purple-500 shadow-purple-100' : ''
        } ${compact ? '' : 'rounded-2xl'}`}
        onClick={() => onSelect?.(service)}
      >
        {/* Image Section */}
        <div className={`relative overflow-hidden ${compact ? 'h-36' : 'h-48 sm:h-56'}`}>
          {/* Background Image */}
          <img
            src={image || ''}
            alt={displayTitle}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          
          {/* Top Badges */}
          <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
            <div className="flex flex-wrap gap-1.5">
              {badge && (
                <Badge className={`${badgeColor || 'bg-purple-600'} text-white text-xs px-2 py-0.5 shadow-lg`}>
                  {badge}
                </Badge>
              )}
              {discount > 0 && (
                <Badge className="bg-green-500 text-white text-xs px-2 py-0.5 shadow-lg">
                  {discount}% OFF
                </Badge>
              )}
            </div>
            
            {/* Favorite Button */}
            <button
              onClick={(e) => { e.stopPropagation(); setIsFavorite(!isFavorite); }}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                isFavorite ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-600 hover:bg-white'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>
          
          {/* Bottom Content on Image */}
          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
            {/* Icon + Title */}
            <div className="flex items-start gap-2 mb-2">
              {icon && (
                <span className="text-2xl flex-shrink-0 drop-shadow-lg">{icon}</span>
              )}
              <h3 className="text-white font-bold text-base sm:text-lg leading-tight line-clamp-2 drop-shadow-lg">
                {displayTitle}
              </h3>
            </div>
            
            {/* Rating & Duration */}
            <div className="flex items-center gap-3 text-white/90 text-xs sm:text-sm">
              {rating && (
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{rating}</span>
                  {reviews && <span className="text-white/70">({reviews})</span>}
                </span>
              )}
              {duration && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {duration}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Content Section */}
        <div className="p-3 sm:p-4">
          {/* Description */}
          {!compact && description && (
            <p className="text-gray-600 text-sm line-clamp-2 mb-3">
              {description}
            </p>
          )}
          
          {/* Highlights (on hover or always on mobile) */}
          {!compact && highlights.length > 0 && (
            <div className={`space-y-1.5 mb-3 overflow-hidden transition-all duration-300 ${
              isHovered ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0 sm:max-h-0'
            } sm:group-hover:max-h-32 sm:group-hover:opacity-100`}>
              {highlights.slice(0, 3).map((highlight, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                  <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  <span className="line-clamp-1">{highlight}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* Price & CTA */}
          <div className="flex items-end justify-between gap-2">
            <div>
              {price !== undefined && (
                <div className="flex items-baseline gap-2">
                  <span className="text-lg sm:text-xl font-bold text-gray-900">
                    ₹{typeof price === 'number' ? price.toLocaleString() : price}
                  </span>
                  {originalPrice && (
                    <span className="text-sm text-gray-400 line-through">
                      ₹{originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>
              )}
              {!price && (
                <span className="text-sm text-purple-600 font-medium">Get Quote</span>
              )}
            </div>
            
            <Button
              size="sm"
              onClick={(e) => { e.stopPropagation(); onBookNow?.(service); }}
              className={`bg-gradient-to-r ${gradient} text-white hover:opacity-90 shadow-md px-4`}
            >
              Book
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
        
        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
        )}
      </Card>
      
      {/* Related Products Popup */}
      <AnimatePresence>
        {isSelected && showRelated && relatedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute left-0 right-0 top-full mt-2 z-20"
          >
            <Card className="p-3 bg-white border border-purple-100 shadow-xl rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-semibold text-gray-800">Mira Suggests</span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); onSelect?.(null); }}
                  className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                >
                  <X className="w-3.5 h-3.5 text-gray-500" />
                </button>
              </div>
              
              <p className="text-xs text-gray-500 mb-3">
                Perfect additions to your {displayTitle}
              </p>
              
              <div className="space-y-2">
                {relatedProducts.slice(0, 3).map((product, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); /* Add to cart */ }}
                  >
                    <img
                      src={product.image || ''}
                      alt={product.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 line-clamp-1">{product.name}</p>
                      <p className="text-xs text-purple-600 font-semibold">₹{product.price?.toLocaleString()}</p>
                    </div>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              {relatedProducts.length > 3 && (
                <Button variant="ghost" size="sm" className="w-full mt-2 text-purple-600 hover:text-purple-700">
                  View {relatedProducts.length - 3} more
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PillarServiceCard;
