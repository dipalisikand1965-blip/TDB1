/**
 * PillarServicesGrid.jsx
 * MakeMyTrip-style card grid for pillar services
 * Features: Category tabs, responsive grid, hover effects, smart filtering
 */

import React, { useState, useMemo } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Filter, ChevronDown, Grid3X3, List, SlidersHorizontal,
  Sparkles, TrendingUp, Clock, Star, Check, ArrowRight
} from 'lucide-react';
import PillarServiceCard from './PillarServiceCard';
import { motion, AnimatePresence } from 'framer-motion';

const PillarServicesGrid = ({
  services = [],
  categories = [],
  onServiceSelect,
  onServiceBook,
  selectedService,
  relatedProducts = {},
  pillarGradient = 'from-purple-500 to-pink-500',
  pillarColor = 'purple',
  showFilters = true
}) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [sortBy, setSortBy] = useState('popular'); // popular, price-low, price-high, rating

  // Filter and sort services
  const filteredServices = useMemo(() => {
    let filtered = [...services];
    
    // Filter by category
    if (activeCategory !== 'all') {
      filtered = filtered.filter(s => 
        s.category === activeCategory || 
        s.type === activeCategory ||
        s.tags?.includes(activeCategory)
      );
    }
    
    // Sort
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-high':
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'popular':
      default:
        filtered.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
    }
    
    return filtered;
  }, [services, activeCategory, sortBy]);

  // All categories including 'all'
  const allCategories = [
    { id: 'all', name: 'All', icon: '✨' },
    ...categories
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Category Tabs - Horizontal Scroll on Mobile */}
      <div className="relative">
        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
          {allCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
                whitespace-nowrap transition-all flex-shrink-0
                ${activeCategory === cat.id 
                  ? `bg-gradient-to-r ${pillarGradient} text-white shadow-lg` 
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              {cat.icon && <span>{cat.icon}</span>}
              {cat.name}
              {activeCategory === cat.id && (
                <Badge className="bg-white/20 text-white text-xs ml-1">
                  {activeCategory === 'all' ? services.length : filteredServices.length}
                </Badge>
              )}
            </button>
          ))}
        </div>
        
        {/* Fade indicators */}
        <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none sm:hidden" />
      </div>

      {/* Filters Row */}
      {showFilters && (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="font-medium">{filteredServices.length}</span>
            <span>services found</span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm text-gray-700 cursor-pointer hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              >
                <option value="popular">Most Popular</option>
                <option value="rating">Top Rated</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            
            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
              >
                <Grid3X3 className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
              >
                <List className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Services Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory + sortBy}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`
            ${viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5' 
              : 'space-y-4'
            }
          `}
        >
          {filteredServices.map((service, idx) => (
            <PillarServiceCard
              key={service.id || idx}
              service={service}
              onSelect={onServiceSelect}
              onBookNow={onServiceBook}
              isSelected={selectedService?.id === service.id}
              relatedProducts={relatedProducts[service.category] || relatedProducts[service.id] || []}
              compact={viewMode === 'list'}
              gradient={pillarGradient}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Empty State */}
      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Filter className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No services found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your filters or browse all services</p>
          <Button onClick={() => setActiveCategory('all')} variant="outline">
            View All Services
          </Button>
        </div>
      )}

      {/* Load More (if paginated) */}
      {filteredServices.length >= 8 && (
        <div className="text-center pt-4">
          <Button variant="outline" className="px-8">
            Load More Services
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default PillarServicesGrid;
