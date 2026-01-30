/**
 * TransformationStories.jsx
 * Before & After pet transformation carousel
 * Emotional, persuasive social proof that builds trust
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote, Star, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';

// Sample transformation stories (in production, fetch from API)
const SAMPLE_TRANSFORMATIONS = [
  {
    id: 1,
    petName: 'Bruno',
    breed: 'Labrador',
    ownerName: 'Priya M.',
    beforeImage: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop',
    afterImage: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=200&h=200&fit=crop',
    achievement: 'Lost 4kg in 10 weeks',
    testimonial: 'The trainers understood Bruno perfectly. He actually enjoys his workouts now!',
    program: 'Weight Journey Partner®',
    rating: 5
  },
  {
    id: 2,
    petName: 'Coco',
    breed: 'Beagle',
    ownerName: 'Rahul S.',
    beforeImage: 'https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=200&h=200&fit=crop',
    afterImage: 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=200&h=200&fit=crop',
    achievement: 'From couch potato to agility star',
    testimonial: 'Coco went from sleeping all day to winning her first agility ribbon!',
    program: 'Active Lifestyle Curator®',
    rating: 5
  },
  {
    id: 3,
    petName: 'Max',
    breed: 'Golden Retriever',
    ownerName: 'Anita K.',
    beforeImage: 'https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=200&h=200&fit=crop',
    afterImage: 'https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=200&h=200&fit=crop',
    achievement: 'Senior mobility restored',
    testimonial: 'At 11, Max is moving like a puppy again. The hydrotherapy made all the difference.',
    program: 'Senior Wellness Companion®',
    rating: 5
  },
  {
    id: 4,
    petName: 'Luna',
    breed: 'German Shepherd',
    ownerName: 'Vikram P.',
    beforeImage: 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=200&h=200&fit=crop',
    afterImage: 'https://images.unsplash.com/photo-1568572933382-74d440642117?w=200&h=200&fit=crop',
    achievement: 'Anxiety reduced, confidence gained',
    testimonial: 'Luna was always nervous. The structured training gave her so much confidence.',
    program: 'Wellness Architect®',
    rating: 5
  }
];

const TransformationStories = ({ 
  stories = SAMPLE_TRANSFORMATIONS,
  onViewProgram,
  className = '' 
}) => {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 320;
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
  }, []);

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Real Transformations</h3>
          <p className="text-sm text-gray-500">Stories from our pet community</p>
        </div>
        
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all
              ${canScrollLeft 
                ? 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm' 
                : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all
              ${canScrollRight 
                ? 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm' 
                : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {stories.map((story, idx) => (
          <TransformationCard 
            key={story.id || idx} 
            story={story}
            onViewProgram={onViewProgram}
          />
        ))}
      </div>
    </div>
  );
};

// Individual transformation card
const TransformationCard = ({ story, onViewProgram }) => {
  const { petName, breed, ownerName, beforeImage, afterImage, achievement, testimonial, program, rating } = story;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex-shrink-0 w-[300px] bg-white rounded-2xl border border-gray-100 overflow-hidden 
                 hover:shadow-lg transition-shadow"
      style={{ scrollSnapAlign: 'start' }}
    >
      {/* Before/After Images */}
      <div className="relative h-32 bg-gradient-to-r from-gray-100 to-gray-50">
        <div className="absolute inset-0 flex">
          {/* Before */}
          <div className="w-1/2 relative">
            <img 
              src={beforeImage} 
              alt={`${petName} before`}
              className="w-full h-full object-cover grayscale opacity-80"
            />
            <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 text-white text-[10px] rounded-full">
              Before
            </div>
          </div>
          
          {/* Arrow */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
              <ArrowRight className="w-4 h-4 text-teal-600" />
            </div>
          </div>
          
          {/* After */}
          <div className="w-1/2 relative">
            <img 
              src={afterImage} 
              alt={`${petName} after`}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-teal-600 text-white text-[10px] rounded-full">
              After
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Pet Info & Achievement */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <h4 className="font-bold text-gray-900">{petName}</h4>
            <p className="text-xs text-gray-500">{breed}</p>
          </div>
          <div className="px-2 py-1 bg-teal-50 text-teal-700 text-xs font-medium rounded-full">
            {achievement}
          </div>
        </div>

        {/* Testimonial */}
        <div className="relative mb-3">
          <Quote className="absolute -top-1 -left-1 w-4 h-4 text-gray-200" />
          <p className="text-sm text-gray-600 italic pl-3 line-clamp-2">
            {testimonial}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="flex">
              {[...Array(rating)].map((_, i) => (
                <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <span className="text-xs text-gray-500">— {ownerName}</span>
          </div>
          
          <button
            onClick={() => onViewProgram?.(program)}
            className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
          >
            {program?.split('®')[0]} <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default TransformationStories;
