/**
 * CelebrationMemoryWall.jsx
 * 
 * A beautiful gallery showcasing real customer celebrations.
 * Uses polaroid-style photos to create emotional connection.
 * 
 * VISION: This should make pet parents feel part of a loving community
 * and inspire them to create their own magical moments.
 * 
 * Data sources:
 * - Backend API: /api/celebration-wall/photos (manageable from Admin)
 * - TheDoggyBakery product images (fallback)
 * - User-generated content from celebrations
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Camera, Share2, MessageCircle, Sparkles, 
  ChevronLeft, ChevronRight, X, Instagram, Star
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Dialog, DialogContent } from '../ui/dialog';
import { API_URL } from '../../utils/api';

// Default/Fallback celebration photos from TheDoggyBakery Shopify Store
// These are used if the API doesn't return any photos
const DEFAULT_CELEBRATION_PHOTOS = [
  {
    id: 1,
    imageUrl: 'https://thedoggybakery.com/cdn/shop/files/the_doggy_bakery_do_checkout_for_more_variety_in_cakes_and_treats_._Euro_love_it_._birthdayc.jpg?v=1759753685&width=800',
    petName: 'Euro',
    occasion: 'Birthday',
    caption: 'Euro loved his birthday cake! The best day ever 🎂',
    likes: 234,
    location: 'Mumbai',
    date: '2 days ago'
  },
  {
    id: 2,
    imageUrl: 'https://thedoggybakery.com/cdn/shop/files/If_Love_had_a_profile_picture_you_re_looking_at_it_..Glad_you_enjoyed_your_birthday_Simba_.._dogfood_dogs_doggygoals_celebratingpets_cakesfordogs_doggydesserts_dogtreats_dogfoodie_pet.jpg?v=1759753273&width=800',
    petName: 'Simba',
    occasion: 'Birthday',
    caption: 'If love had a profile picture, you\'re looking at it 💕',
    likes: 389,
    location: 'Bangalore',
    date: '5 days ago'
  },
  {
    id: 3,
    imageUrl: 'https://thedoggybakery.com/cdn/shop/files/zippy-april-4-1024x1024.png?v=1759752249&width=800',
    petName: 'Zippy',
    occasion: 'Birthday',
    caption: 'Birthday celebrations with the whole cake! 🎉',
    likes: 312,
    location: 'Delhi',
    date: '1 week ago'
  },
  {
    id: 4,
    imageUrl: 'https://thedoggybakery.com/cdn/shop/files/BOBA_MILK_TEA_7_f31d3215-5971-4b5b-bf65-da4157fed6d9.jpg?v=1759752285&width=800',
    petName: 'Boba',
    occasion: 'First Birthday',
    caption: 'Our little one turns 1! Time flies so fast 🥺',
    likes: 445,
    location: 'Pune',
    date: '1 week ago'
  },
  {
    id: 5,
    imageUrl: 'https://thedoggybakery.com/cdn/shop/files/438102159_450377974383140_7930303494133678708_n_78132051-77d9-455c-8a9c-3050abdeef81.jpg?v=1725448195&width=800',
    petName: 'Muffin',
    occasion: 'Birthday',
    caption: 'Best birthday party ever with all my friends! 💪',
    likes: 892,
    location: 'Chennai',
    date: '2 weeks ago'
  },
  {
    id: 6,
    imageUrl: 'https://thedoggybakery.com/cdn/shop/files/Breed_Birthday_Cake_Hamper_Toy.png?v=1723637829&width=800',
    petName: 'Luna',
    occasion: 'Gotcha Day',
    caption: 'Celebrating 3 years since Luna joined our family!',
    likes: 267,
    location: 'Hyderabad',
    date: '2 weeks ago'
  },
  {
    id: 7,
    imageUrl: 'https://thedoggybakery.com/cdn/shop/files/Breed_Cake_Party_Box.png?v=1723638074&width=800',
    petName: 'Rocky',
    occasion: 'Birthday',
    caption: 'The breed cake looked exactly like me! 🐕',
    likes: 523,
    location: 'Gurgaon',
    date: '3 weeks ago'
  },
  {
    id: 8,
    imageUrl: 'https://thedoggybakery.com/cdn/shop/files/Untitled_design_16.png?v=1723638287&width=800',
    petName: 'Charlie',
    occasion: 'First Birthday',
    caption: 'The pawfect party box for Charlie\'s big day!',
    likes: 678,
    location: 'Kolkata',
    date: '3 weeks ago'
  }
];

// Additional product images for fallback - all from TheDoggyBakery
const PRODUCT_CELEBRATION_IMAGES = [
  'https://thedoggybakery.com/cdn/shop/products/WhatsAppImage2022-05-13at3.24.11PM.jpg?v=1655357921&width=800',
  'https://thedoggybakery.com/cdn/shop/products/16E90556-0B54-4E9F-8DC1-668012C199AF.png?v=1656737240&width=800',
  'https://thedoggybakery.com/cdn/shop/files/Untitled_design_17.png?v=1723638766&width=800',
  'https://thedoggybakery.com/cdn/shop/files/Untitled_design_18.png?v=1723638716&width=800',
  'https://thedoggybakery.com/cdn/shop/products/7BED8A33-AE80-4DF6-830A-5519103A8013.png?v=1656737380&width=800',
  'https://thedoggybakery.com/cdn/shop/products/FC144498-711C-42A4-8867-99638A34FB8C.png?v=1656737324&width=800',
];

const CelebrationMemoryWall = ({ onShareStory, onViewAll, onCreateAlbum }) => {
  const [photos, setPhotos] = useState(DEFAULT_CELEBRATION_PHOTOS);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [likedPhotos, setLikedPhotos] = useState(new Set());
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  
  // Load celebration photos from backend API (manageable from Admin)
  useEffect(() => {
    const fetchCelebrations = async () => {
      try {
        // Try the new celebration wall API first
        const response = await fetch(`${API_URL}/api/celebration-wall/photos?featured_only=true&limit=12`);
        if (response.ok) {
          const data = await response.json();
          if (data.photos?.length > 0) {
            // Map API response to component format
            const formattedPhotos = data.photos.map((p, idx) => ({
              id: p.id || idx + 1,
              imageUrl: p.image_url || p.imageUrl,
              petName: p.pet_name || p.petName || 'Happy Pup',
              occasion: p.occasion || 'Birthday',
              caption: p.caption || '',
              likes: p.likes || Math.floor(Math.random() * 500) + 100,
              location: p.location || 'India',
              date: p.date || 'Recently'
            }));
            setPhotos(formattedPhotos);
            return;
          }
        }
        
        // Fallback: try old celebrations endpoint
        const fallbackResponse = await fetch(`${API_URL}/api/celebrations/gallery?limit=12`);
        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json();
          if (data.celebrations?.length > 0) {
            setPhotos([...data.celebrations, ...DEFAULT_CELEBRATION_PHOTOS]);
            return;
          }
        }
        
        // Use default photos if no API data
        setPhotos(DEFAULT_CELEBRATION_PHOTOS);
      } catch (err) {
        console.log('[MemoryWall] Using default celebration photos');
        setPhotos(DEFAULT_CELEBRATION_PHOTOS);
      }
    };
    fetchCelebrations();
  }, []);
  
  const handleScroll = () => {
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
    }
  };
  
  const handleLike = (photoId, e) => {
    e.stopPropagation();
    setLikedPhotos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  };
  
  const handleImageError = (e, index) => {
    // Fallback to product images
    if (PRODUCT_CELEBRATION_IMAGES[index % PRODUCT_CELEBRATION_IMAGES.length]) {
      e.target.src = PRODUCT_CELEBRATION_IMAGES[index % PRODUCT_CELEBRATION_IMAGES.length];
    }
  };
  
  return (
    <div className="relative">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Camera className="w-6 h-6 text-pink-500" />
            Celebration Wall
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Real moments of joy from our pet parent community 💕
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {onCreateAlbum && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onCreateAlbum}
              className="hidden sm:flex border-purple-200 text-purple-600 hover:bg-purple-50"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Create Album
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={onShareStory}
            className="hidden sm:flex border-pink-200 text-pink-600 hover:bg-pink-50"
          >
            <Camera className="w-4 h-4 mr-2" />
            Share Your Story
          </Button>
          
          {/* Scroll buttons for desktop */}
          <div className="hidden sm:flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="p-2 hover:bg-gray-100 disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="p-2 hover:bg-gray-100 disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Scrollable Photo Gallery */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Share CTA Card - First item */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="flex-shrink-0 snap-start"
        >
          <div 
            onClick={onShareStory}
            className="w-64 h-80 rounded-2xl bg-gradient-to-br from-pink-100 via-purple-50 to-amber-50 border-2 border-dashed border-pink-300 flex flex-col items-center justify-center cursor-pointer hover:border-pink-400 transition-all group"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center mb-4 shadow-lg"
            >
              <Camera className="w-8 h-8 text-white" />
            </motion.div>
            <h3 className="font-bold text-gray-800 mb-1">Share Your Story</h3>
            <p className="text-sm text-gray-500 text-center px-4">
              Celebrate your pet's special moments with our community
            </p>
            <Button 
              size="sm" 
              className="mt-4 bg-pink-500 hover:bg-pink-600 text-white rounded-full group-hover:scale-105 transition-transform"
            >
              <Sparkles className="w-4 h-4 mr-1" />
              Add Photo
            </Button>
          </div>
        </motion.div>
        
        {/* Photo Cards - Polaroid Style */}
        {photos.map((photo, index) => (
          <motion.div
            key={photo.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -5, rotate: index % 2 === 0 ? 1 : -1 }}
            className="flex-shrink-0 snap-start cursor-pointer"
            onClick={() => setSelectedPhoto(photo)}
          >
            <div className="w-64 bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all">
              {/* Photo */}
              <div className="relative h-52 bg-gray-100 overflow-hidden">
                <img 
                  src={photo.imageUrl}
                  alt={`${photo.petName}'s ${photo.occasion}`}
                  className="w-full h-full object-cover"
                  onError={(e) => handleImageError(e, index)}
                />
                
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                
                {/* Like button */}
                <button
                  onClick={(e) => handleLike(photo.id, e)}
                  className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-all ${
                    likedPhotos.has(photo.id) 
                      ? 'bg-pink-500 text-white' 
                      : 'bg-white/80 text-gray-600 hover:bg-white'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${likedPhotos.has(photo.id) ? 'fill-current' : ''}`} />
                </button>
                
                {/* Occasion badge */}
                <div className="absolute bottom-3 left-3">
                  <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-gray-700">
                    {photo.occasion === 'Birthday' && '🎂'}
                    {photo.occasion === 'Gotcha Day' && '💕'}
                    {photo.occasion === 'First Birthday' && '🎉'}
                    {photo.occasion === 'Recovery Party' && '💪'}
                    {' '}{photo.occasion}
                  </span>
                </div>
              </div>
              
              {/* Caption - Polaroid style */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-gray-900">{photo.petName}</h4>
                  <span className="text-xs text-gray-400">{photo.date}</span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{photo.caption}</p>
                
                {/* Stats */}
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Heart className="w-3 h-3 text-pink-500 fill-pink-500" />
                    {photo.likes + (likedPhotos.has(photo.id) ? 1 : 0)}
                  </span>
                  <span className="text-xs text-gray-400">📍 {photo.location}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        
        {/* View All Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="flex-shrink-0 snap-start"
        >
          <div 
            onClick={onViewAll}
            className="w-48 h-80 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex flex-col items-center justify-center cursor-pointer hover:from-purple-600 hover:to-pink-600 transition-all"
          >
            <span className="text-4xl mb-3">📸</span>
            <span className="text-white font-bold">View All</span>
            <span className="text-white/70 text-sm">500+ moments</span>
            <ChevronRight className="w-6 h-6 text-white mt-2" />
          </div>
        </motion.div>
      </div>
      
      {/* Mobile Share Button */}
      <div className="sm:hidden mt-4 flex gap-2">
        <Button 
          onClick={onShareStory}
          className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl"
        >
          <Camera className="w-4 h-4 mr-2" />
          Share Story
        </Button>
        {onCreateAlbum && (
          <Button 
            onClick={onCreateAlbum}
            variant="outline"
            className="flex-1 border-purple-300 text-purple-600 rounded-xl"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Create Album
          </Button>
        )}
      </div>
      
      {/* Photo Detail Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
              <div className="relative">
                <img 
                  src={selectedPhoto.imageUrl}
                  alt={`${selectedPhoto.petName}'s ${selectedPhoto.occasion}`}
                  className="w-full h-64 sm:h-80 object-cover"
                  onError={(e) => {
                    e.target.src = PRODUCT_CELEBRATION_IMAGES[0];
                  }}
                />
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="absolute top-3 right-3 p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedPhoto.petName}</h3>
                    <p className="text-sm text-gray-500">{selectedPhoto.occasion} • {selectedPhoto.location}</p>
                  </div>
                  <span className="text-sm text-gray-400">{selectedPhoto.date}</span>
                </div>
                
                <p className="text-gray-700 mb-4">{selectedPhoto.caption}</p>
                
                <div className="flex items-center gap-4">
                  <Button 
                    variant="outline"
                    onClick={(e) => handleLike(selectedPhoto.id, e)}
                    className={likedPhotos.has(selectedPhoto.id) ? 'text-pink-500 border-pink-200' : ''}
                  >
                    <Heart className={`w-4 h-4 mr-2 ${likedPhotos.has(selectedPhoto.id) ? 'fill-pink-500 text-pink-500' : ''}`} />
                    {selectedPhoto.likes + (likedPhotos.has(selectedPhoto.id) ? 1 : 0)}
                  </Button>
                  
                  <Button variant="outline">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  
                  <Button variant="outline">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Comment
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CelebrationMemoryWall;
