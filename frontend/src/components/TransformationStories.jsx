/**
 * TransformationStories.jsx
 * Community stories section - Shows real user stories or invitation to share
 * TRUTH-FOCUSED: No fake testimonials or made-up statistics
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Camera, Star, Sparkles, MessageCircle } from 'lucide-react';
import { Badge } from './ui/badge';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const TransformationStories = ({ 
  pillar = 'care',
  className = '' 
}) => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // If we have real stories from the database, show them
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.slice(0, 6).map((story, idx) => (
              <motion.div
                key={story.id || idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-lg hover:shadow-xl transition-all"
              >
                {story.after_image && (
                  <img 
                    src={story.after_image} 
                    alt={story.pet_name || 'Pet'} 
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 mb-2">{story.pet_name}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-3">{story.testimonial}</p>
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
        </div>
      </div>
    );
  }

  // Default: Show invitation to share stories (no fake content)
  const pillarColors = {
    care: { bg: 'from-cyan-50 to-teal-50', border: 'border-cyan-100', text: 'text-cyan-600', badge: 'bg-cyan-100 text-cyan-700' },
    fit: { bg: 'from-teal-50 to-emerald-50', border: 'border-teal-100', text: 'text-teal-600', badge: 'bg-teal-100 text-teal-700' },
    stay: { bg: 'from-emerald-50 to-green-50', border: 'border-emerald-100', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
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
