/**
 * MiraPillarRecommendations.jsx
 * Personalized AI recommendations for pillar pages
 * Shows smart suggestions based on pet profile and current pillar
 */

import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Sparkles, ChevronRight, ArrowRight, Star, Clock,
  TrendingUp, Heart, Zap, RefreshCw, Loader2
} from 'lucide-react';
import { getApiUrl } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';

const MiraPillarRecommendations = ({ 
  pillar,
  petId,
  petName,
  userId,
  onSelectService,
  onSelectProduct,
  className = ''
}) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('services');

  useEffect(() => {
    fetchRecommendations();
  }, [pillar, petId]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      // Fetch personalized recommendations
      let url = `${getApiUrl()}/api/recommendations/`;
      if (petId) {
        url += `pet/${petId}?limit=6`;
      } else {
        url += `dashboard?limit=6`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        // Filter recommendations relevant to this pillar
        const filtered = (data.recommendations || []).filter(r => 
          r.pillar === pillar || 
          r.category === pillar || 
          !r.pillar // Generic recommendations
        );
        setRecommendations(filtered.length > 0 ? filtered : data.recommendations?.slice(0, 4) || []);
      }
    } catch (error) {
      console.debug('Failed to fetch recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={`p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-100 ${className}`}>
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
          <span className="ml-2 text-sm text-purple-600">Mira is thinking...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`overflow-hidden border-0 shadow-lg ${className}`}>
      {/* Header with Mira branding */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Animated Mira Icon */}
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center"
              >
                <Zap className="w-2.5 h-2.5 text-yellow-800" />
              </motion.div>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">
                {petName ? `For ${petName}` : 'Mira Recommends'}
              </h3>
              <p className="text-white/80 text-sm">
                Personalized picks just for you
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchRecommendations}
            className="text-white/80 hover:text-white hover:bg-white/10"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Recommendations Grid */}
      <div className="p-4 sm:p-5 bg-gradient-to-b from-purple-50/50 to-white">
        {recommendations.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500 text-sm">
              Add your pet's details for personalized recommendations
            </p>
            <Button variant="outline" size="sm" className="mt-3">
              Complete Profile
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recommendations.slice(0, 4).map((rec, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <RecommendationCard 
                  recommendation={rec} 
                  onSelect={rec.type === 'product' ? onSelectProduct : onSelectService}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Reason/Context */}
        {recommendations.length > 0 && (
          <div className="mt-4 pt-4 border-t border-purple-100">
            <div className="flex items-start gap-2 text-xs text-purple-600">
              <TrendingUp className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>
                Based on {petName ? `${petName}'s` : 'your pet\'s'} profile, breed characteristics, and popular choices
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

// Individual Recommendation Card
const RecommendationCard = ({ recommendation, onSelect }) => {
  const { title, description, reason, priority, cta, link, category, type } = recommendation;
  
  const priorityColors = {
    high: 'border-l-red-500 bg-red-50/50',
    medium: 'border-l-amber-500 bg-amber-50/50',
    low: 'border-l-gray-300 bg-gray-50/50'
  };

  return (
    <div 
      onClick={() => onSelect?.(recommendation)}
      className={`p-3 rounded-xl border-l-4 ${priorityColors[priority] || priorityColors.medium} 
        cursor-pointer hover:shadow-md transition-all group bg-white`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 text-sm line-clamp-1 group-hover:text-purple-700 transition-colors">
            {title}
          </h4>
          {description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{description}</p>
          )}
          {reason && (
            <p className="text-xs text-purple-600 mt-1.5 flex items-center gap-1">
              <Star className="w-3 h-3" />
              {reason}
            </p>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
      </div>
    </div>
  );
};

export default MiraPillarRecommendations;
