/**
 * TransformationStories.jsx
 * Before & After pet transformation carousel
 * World-class design with large, impactful imagery
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote, Star, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

// Transformation stories with ACCURATE BREED-SPECIFIC images from Unsplash
const SAMPLE_TRANSFORMATIONS = [
  {
    id: 1,
    petName: 'Bruno',
    breed: 'Golden Retriever',
    ownerName: 'Priya M.',
    location: 'Mumbai',
    // Golden Retriever images - before (messy coat) and after (groomed)
    beforeImage: 'https://images.unsplash.com/photo-1461730117549-4b30953f78a6?w=600&h=600&fit=crop&q=80',
    afterImage: 'https://images.unsplash.com/photo-1608138498905-05b5cd816a36?w=600&h=600&fit=crop&q=80',
    beforeLabel: 'Before',
    afterLabel: 'After',
    headline: 'From matted to magnificent',
    testimonial: '"The groomer was so gentle with Bruno\'s anxiety. He actually enjoyed it!"',
    program: 'Groom & Glam Curator®',
    rating: 5
  },
  {
    id: 2,
    petName: 'Coco',
    breed: 'Beagle',
    ownerName: 'Rahul S.',
    location: 'Bangalore',
    // Beagle images - before (sick) and after (healthy happy)
    beforeImage: 'https://images.unsplash.com/photo-1737699430579-3f20b8abc613?w=600&h=600&fit=crop&q=80',
    afterImage: 'https://images.pexels.com/photos/19490048/pexels-photo-19490048.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop',
    beforeLabel: 'Sick',
    afterLabel: 'Healthy',
    headline: 'Emergency care saved his life',
    testimonial: '"They found a 24/7 vet at 2am. Forever grateful for their emergency support."',
    program: 'Emergency Response Partner®',
    rating: 5
  },
  {
    id: 3,
    petName: 'Max',
    breed: 'Labrador, 11 years',
    ownerName: 'Anita K.',
    location: 'Delhi',
    // Senior Labrador images - before (struggling) and after (thriving)
    beforeImage: 'https://images.unsplash.com/photo-1610661152225-10b323d1b855?w=600&h=600&fit=crop&q=80',
    afterImage: 'https://images.unsplash.com/photo-1619590694371-7eed5838e880?w=600&h=600&fit=crop&q=80',
    beforeLabel: 'Struggling',
    afterLabel: 'Thriving',
    headline: 'Senior mobility restored',
    testimonial: '"The physiotherapy sessions gave Max a new lease on life at 11!"',
    program: 'Senior Wellness Companion®',
    rating: 5
  },
  {
    id: 4,
    petName: 'Luna',
    breed: 'German Shepherd',
    ownerName: 'Vikram P.',
    location: 'Gurgaon',
    // German Shepherd images - before (anxious) and after (confident)
    beforeImage: 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=600&h=600&fit=crop&q=80',
    afterImage: 'https://images.unsplash.com/photo-1624736356321-a8f755bac571?w=600&h=600&fit=crop&q=80',
    beforeLabel: 'Anxious',
    afterLabel: 'Confident',
    headline: 'Anxiety to confidence',
    testimonial: '"The trainer understood Luna\'s fears perfectly. She\'s a different dog now!"',
    program: 'Behavior Architect®',
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
      const scrollAmount = 340;
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
    <div className={`py-12 sm:py-16 ${className}`}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <Badge className="bg-gradient-to-r from-rose-500 to-pink-500 text-white px-4 py-1.5 mb-4">
            <Sparkles className="w-3.5 h-3.5 mr-1.5 inline" />
            Success Stories
          </Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
            Real Transformations
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Stories from our pet care community
          </p>
        </div>

        {/* Navigation buttons - Desktop */}
        <div className="hidden sm:flex justify-end gap-2 mb-6">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all
              ${canScrollLeft 
                ? 'bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-rose-300 shadow-md' 
                : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all
              ${canScrollRight 
                ? 'bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-rose-300 shadow-md' 
                : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Carousel */}
        <div 
          ref={scrollRef}
          className="flex gap-5 sm:gap-6 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 sm:mx-0 sm:px-0"
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
    </div>
  );
};

// Individual transformation card - World-class design
const TransformationCard = ({ story, onViewProgram }) => {
  const { petName, breed, ownerName, location, beforeImage, afterImage, beforeLabel, afterLabel, headline, testimonial, program, rating } = story;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="flex-shrink-0 w-[320px] sm:w-[360px] bg-white rounded-3xl border border-gray-100 overflow-hidden 
                 shadow-lg hover:shadow-2xl transition-all duration-300"
      style={{ scrollSnapAlign: 'start' }}
    >
      {/* Before/After Images - MUCH LARGER */}
      <div className="relative h-48 sm:h-56 bg-gradient-to-br from-rose-50 to-pink-50">
        <div className="absolute inset-0 flex">
          {/* Before Image */}
          <div className="w-1/2 relative overflow-hidden">
            <img 
              src={beforeImage} 
              alt={`${petName} before`}
              className="w-full h-full object-cover filter grayscale-[30%] opacity-90 hover:grayscale-0 transition-all duration-500"
            />
            <div className="absolute bottom-3 left-3">
              <span className="px-3 py-1.5 bg-gray-900/70 backdrop-blur-sm text-white text-xs sm:text-sm font-medium rounded-full">
                {beforeLabel}
              </span>
            </div>
          </div>
          
          {/* Divider Arrow */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <motion.div 
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white shadow-xl flex items-center justify-center border-2 border-rose-200"
              whileHover={{ scale: 1.1 }}
            >
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500" />
            </motion.div>
          </div>
          
          {/* After Image */}
          <div className="w-1/2 relative overflow-hidden">
            <img 
              src={afterImage} 
              alt={`${petName} after`}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute bottom-3 right-3">
              <span className="px-3 py-1.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs sm:text-sm font-medium rounded-full shadow-lg">
                {afterLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 sm:p-6">
        {/* Pet Info */}
        <div className="mb-4">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">{petName}</h3>
          <p className="text-sm text-gray-500">{breed}</p>
        </div>
        
        {/* Achievement Headline */}
        <div className="mb-4">
          <p className="text-base sm:text-lg font-semibold text-rose-600">{headline}</p>
        </div>
        
        {/* Testimonial */}
        <div className="mb-4">
          <p className="text-sm sm:text-base text-gray-600 italic leading-relaxed">
            {testimonial}
          </p>
        </div>
        
        {/* Owner & Location */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <span className="text-sm text-gray-500">— {ownerName}, {location}</span>
          <div className="flex items-center gap-0.5">
            {[...Array(rating)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TransformationStories;
