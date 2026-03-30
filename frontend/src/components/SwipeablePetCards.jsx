/**
 * SwipeablePetCards - Swipe between pets for multi-pet households
 * Touch-friendly horizontal scrolling with snap points
 */

import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, PawPrint, Sparkles, Heart, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from './ui/card';

const SwipeablePetCards = ({ pets, activePetId, onPetChange }) => {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showArrows, setShowArrows] = useState(false);

  useEffect(() => {
    if (activePetId && pets.length > 0) {
      const index = pets.findIndex(p => p.id === activePetId);
      if (index >= 0) {
        setCurrentIndex(index);
        scrollToIndex(index, false);
      }
    }
  }, [activePetId, pets]);

  const scrollToIndex = (index, smooth = true) => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.firstChild?.offsetWidth || 200;
      scrollRef.current.scrollTo({
        left: index * (cardWidth + 12), // 12px gap
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.firstChild?.offsetWidth || 200;
      const scrollLeft = scrollRef.current.scrollLeft;
      const newIndex = Math.round(scrollLeft / (cardWidth + 12));
      
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < pets.length) {
        setCurrentIndex(newIndex);
        onPetChange?.(pets[newIndex]);
      }
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      scrollToIndex(newIndex);
      onPetChange?.(pets[newIndex]);
    }
  };

  const goToNext = () => {
    if (currentIndex < pets.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      scrollToIndex(newIndex);
      onPetChange?.(pets[newIndex]);
    }
  };

  if (!pets || pets.length === 0) return null;

  // Single pet - simple card
  if (pets.length === 1) {
    const pet = pets[0];
    return (
      <Card 
        className="p-3 cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-r from-purple-50 to-pink-50"
        onClick={() => navigate(`/pet/${pet.id}`)}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-purple-200">
            <img
              src={pet.photo_url || ''}
              alt={pet.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-gray-900 truncate">{pet.name}</h4>
            <p className="text-xs text-gray-500 truncate">{pet.breed || 'Your furry friend'}</p>
          </div>
          <div className="flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
            <Sparkles className="w-3 h-3" />
            <span className="text-xs font-medium">{Math.round(pet.overall_score || 0)}%</span>
          </div>
        </div>
      </Card>
    );
  }

  // Multiple pets - swipeable cards
  return (
    <div 
      className="relative"
      onMouseEnter={() => setShowArrows(true)}
      onMouseLeave={() => setShowArrows(false)}
    >
      {/* Navigation arrows - desktop only */}
      {showArrows && pets.length > 1 && (
        <>
          {currentIndex > 0 && (
            <button
              onClick={goToPrev}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white shadow-lg rounded-full flex items-center justify-center text-gray-600 hover:text-purple-600 transition-colors hidden md:flex"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          {currentIndex < pets.length - 1 && (
            <button
              onClick={goToNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white shadow-lg rounded-full flex items-center justify-center text-gray-600 hover:text-purple-600 transition-colors hidden md:flex"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </>
      )}

      {/* Swipeable container */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2"
        onScroll={handleScroll}
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {pets.map((pet, index) => (
          <Card
            key={pet.id}
            className={`flex-shrink-0 w-[85%] sm:w-72 snap-center p-3 cursor-pointer transition-all ${
              index === currentIndex 
                ? 'ring-2 ring-purple-500 shadow-lg' 
                : 'opacity-70 hover:opacity-100'
            }`}
            onClick={() => navigate(`/pet/${pet.id}`)}
          >
            <div className="flex items-center gap-3">
              {/* Pet Photo */}
              <div className="relative">
                <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-purple-200">
                  <img
                    src={pet.photo_url || ''}
                    alt={pet.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Soul score badge */}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white">
                  {Math.round(pet.overall_score || 0)}
                </div>
              </div>

              {/* Pet Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 truncate">{pet.name}</h4>
                <p className="text-xs text-gray-500 truncate">{pet.breed || 'Your furry friend'}</p>
                <div className="flex items-center gap-2 mt-1">
                  {pet.birth_date && (
                    <span className="flex items-center gap-0.5 text-xs text-gray-400">
                      <Calendar className="w-3 h-3" />
                      {new Date(pet.birth_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>

              {/* Species indicator */}
              <div className="text-2xl">
                {pet.species === 'cat' ? '🐱' : '🐕'}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Dot indicators */}
      {pets.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {pets.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index);
                scrollToIndex(index);
                onPetChange?.(pets[index]);
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? 'bg-purple-600 w-4' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SwipeablePetCards;
