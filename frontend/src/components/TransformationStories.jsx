/**
 * TransformationStories.jsx
 * Community stories section - Shows real user stories or invitation to share
 * TRUTH-FOCUSED: No fake testimonials or made-up statistics
 * WITH MODAL: Click on a story to see full details
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Camera, Star, Sparkles, MessageCircle, X, MapPin, Calendar, ArrowRight } from 'lucide-react';
import { Badge } from './ui/badge';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const TransformationStories = ({ 
  pillar = 'care',
  className = '' 
}) => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState(null);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const response = await fetch(`${API_URL}/api/engagement/transformations?pillar=${pillar}&active_only=true`);
        if (response.ok) {
          const data = await response.json();
          setStories(data.stories || []);
        }
      } catch (error) {
        console.log('No stories available yet');
      } finally {
        setLoading(false);
      }
    };
    fetchStories();
  }, [pillar]);

  // Story Detail Modal
  const StoryModal = ({ story, onClose }) => {
    if (!story) return null;
    
    return (
      <Dialog open={!!story} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          {/* Hero Image */}
          <div className="relative h-64 sm:h-80">
            <img 
              src={story.after_image || story.before_image} 
              alt={story.pet_name} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            
            {/* Close button */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* Pet info overlay */}
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <h2 className="text-2xl sm:text-3xl font-bold mb-1">{story.pet_name}</h2>
              <p className="text-white/80">{story.breed}</p>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {/* Achievement badge */}
            {story.headline && (
              <Badge className="bg-gradient-to-r from-rose-500 to-pink-500 text-white mb-4">
                {story.headline}
              </Badge>
            )}
            
            {/* Testimonial */}
            <blockquote className="text-lg text-gray-700 mb-6 leading-relaxed">
              &ldquo;{story.testimonial}&rdquo;
            </blockquote>
            
            {/* Before/After comparison if both images exist */}
            {story.before_image && story.after_image && (
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-2 text-center">Before</p>
                  <img 
                    src={story.before_image} 
                    alt="Before" 
                    className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                  />
                </div>
                <div className="flex items-center">
                  <ArrowRight className="w-6 h-6 text-rose-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-rose-600 mb-2 text-center font-medium">After</p>
                  <img 
                    src={story.after_image} 
                    alt="After" 
                    className="w-full h-32 object-cover rounded-lg border-2 border-rose-300"
                  />
                </div>
              </div>
            )}
            
            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
              <div className="flex items-center gap-1">
                <span>— {story.owner_name}</span>
              </div>
              {story.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{story.location}</span>
                </div>
              )}
              {story.service_used && (
                <Badge variant="outline" className="text-xs">
                  {story.service_used}
                </Badge>
              )}
            </div>
            
            {/* Rating */}
            <div className="flex items-center gap-2 pt-4 border-t">
              <span className="text-sm text-gray-500">Rating:</span>
              <div className="flex items-center gap-0.5">
                {[...Array(story.rating || 5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // If we have real stories from the database, show them with click-to-view
  if (!loading && stories.length > 0) {
    return (
      <div className={`py-12 sm:py-16 ${className}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <Badge className="bg-gradient-to-r from-rose-500 to-pink-500 text-white px-4 py-1.5 mb-4">
              <Sparkles className="w-3.5 h-3.5 mr-1.5 inline" />
              Community Stories
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
              Real Stories from Our Community
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Authentic experiences shared by pet parents like you
            </p>
          </div>

          {/* Horizontally scrollable on mobile, grid on desktop */}
          <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible">
            {stories.slice(0, 6).map((story, idx) => (
              <motion.div
                key={story.id || idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => setSelectedStory(story)}
                className="flex-shrink-0 w-[280px] md:w-auto snap-start bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-lg hover:shadow-xl transition-all cursor-pointer group"
              >
                {story.after_image && (
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={story.after_image} 
                      alt={story.pet_name || 'Pet'} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </div>
                )}
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 text-lg mb-1">{story.pet_name}</h3>
                  {story.breed && <p className="text-sm text-gray-500 mb-2">{story.breed}</p>}
                  {story.headline && (
                    <p className="text-rose-600 font-medium text-sm mb-2">{story.headline}</p>
                  )}
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">&ldquo;{story.testimonial}&rdquo;</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>— {story.owner_name}</span>
                    <div className="flex items-center gap-0.5">
                      {[...Array(story.rating || 5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Mobile scroll hint */}
          <div className="flex justify-center mt-4 md:hidden">
            <span className="text-xs text-gray-400">← Swipe for more stories →</span>
          </div>
        </div>
        
        {/* Story Modal */}
        <StoryModal story={selectedStory} onClose={() => setSelectedStory(null)} />
      </div>
    );
  }

  // Default: Show invitation to share stories (no fake content)
  const pillarColors = {
    care: { bg: 'from-cyan-50 to-teal-50', border: 'border-cyan-100', text: 'text-cyan-600', badge: 'bg-cyan-100 text-cyan-700' },
    fit: { bg: 'from-teal-50 to-emerald-50', border: 'border-teal-100', text: 'text-teal-600', badge: 'bg-teal-100 text-teal-700' },
    stay: { bg: 'from-emerald-50 to-green-50', border: 'border-emerald-100', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
    travel: { bg: 'from-violet-50 to-purple-50', border: 'border-violet-100', text: 'text-violet-600', badge: 'bg-violet-100 text-violet-700' },
    enjoy: { bg: 'from-rose-50 to-pink-50', border: 'border-rose-100', text: 'text-rose-600', badge: 'bg-rose-100 text-rose-700' },
  };
  
  const colors = pillarColors[pillar] || pillarColors.care;

  return (
    <div className={`py-10 sm:py-12 ${className}`}>
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center">
          <Badge className={`${colors.badge} mb-2 sm:mb-3`}>Community</Badge>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Share Your Story</h2>
          <p className="text-gray-600 text-sm sm:text-base mb-6">
            Had a great experience? We&apos;d love to hear from you!
          </p>
          
          <div className={`bg-gradient-to-br ${colors.bg} rounded-2xl p-6 sm:p-8 ${colors.border} border`}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="flex -space-x-3">
                <div className="w-12 h-12 rounded-full bg-white/80 border-2 border-white flex items-center justify-center shadow">
                  <Heart className={`w-5 h-5 ${colors.text}`} />
                </div>
                <div className="w-12 h-12 rounded-full bg-white/80 border-2 border-white flex items-center justify-center shadow">
                  <Camera className={`w-5 h-5 ${colors.text}`} />
                </div>
                <div className="w-12 h-12 rounded-full bg-white/80 border-2 border-white flex items-center justify-center shadow">
                  <MessageCircle className={`w-5 h-5 ${colors.text}`} />
                </div>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-gray-700 font-medium">Your story could inspire others!</p>
                <p className="text-sm text-gray-500">Tag us @thedoggycompany or share via Mira</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransformationStories;
