import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Sparkles, ChevronRight, Scissors, Heart, GraduationCap, 
  Stethoscope, ShoppingBag, PartyPopper, PawPrint, Gift,
  TrendingUp, Clock, Loader2
} from 'lucide-react';
import { getApiUrl } from '../utils/api';

// Icon mapping for recommendation types
const ICON_MAP = {
  grooming: Scissors,
  training: GraduationCap,
  wellness: Stethoscope,
  walks: PawPrint,
  nutrition: Heart,
  product: ShoppingBag,
  celebration: PartyPopper,
  birthday: Gift,
  default: Sparkles
};

// Color mapping for categories
const COLOR_MAP = {
  grooming: 'from-pink-500 to-rose-500',
  training: 'from-blue-500 to-indigo-500',
  wellness: 'from-purple-500 to-violet-500',
  walks: 'from-green-500 to-emerald-500',
  nutrition: 'from-orange-500 to-amber-500',
  product: 'from-cyan-500 to-teal-500',
  celebration: 'from-yellow-500 to-orange-500',
  birthday: 'from-pink-500 to-purple-500',
  default: 'from-gray-500 to-slate-500'
};

const SmartRecommendationsCard = ({ 
  userId, 
  petId, 
  compact = false,
  showTitle = true,
  limit = 4 
}) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [petName, setPetName] = useState('');

  useEffect(() => {
    fetchRecommendations();
  }, [userId, petId]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      let url = `${getApiUrl()}/api/recommendations/`;
      
      if (petId) {
        url += `pet/${petId}?limit=${limit}`;
      } else if (userId) {
        url += `dashboard?user_id=${userId}&limit=${limit}`;
      } else {
        url += `dashboard?limit=${limit}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations || []);
        setPetName(data.pet_name || '');
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
        </div>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  const RecommendationItem = ({ rec }) => {
    const Icon = ICON_MAP[rec.category] || ICON_MAP.default;
    const gradient = COLOR_MAP[rec.category] || COLOR_MAP.default;
    
    return (
      <Link 
        to={rec.link || '#'}
        className="group block"
      >
        <div className={`
          relative p-3 rounded-xl bg-white border border-gray-100 
          hover:border-purple-200 hover:shadow-md transition-all duration-200
          ${compact ? 'flex items-center gap-3' : ''}
        `}>
          {/* Icon */}
          <div className={`
            w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} 
            flex items-center justify-center flex-shrink-0
            group-hover:scale-105 transition-transform
          `}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          
          {/* Content */}
          <div className={compact ? 'flex-1 min-w-0' : 'mt-3'}>
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-medium text-gray-900 text-sm line-clamp-1">
                {rec.title}
              </h4>
              {rec.priority === 'high' && (
                <Badge className="bg-red-100 text-red-600 text-xs px-1.5 py-0 flex-shrink-0">
                  Important
                </Badge>
              )}
            </div>
            
            {!compact && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {rec.description}
              </p>
            )}
            
            {rec.reason && (
              <p className="text-xs text-purple-600 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {rec.reason}
              </p>
            )}
          </div>
          
          {/* Arrow */}
          <ChevronRight className={`
            w-4 h-4 text-gray-400 group-hover:text-purple-500 
            group-hover:translate-x-1 transition-all
            ${compact ? '' : 'absolute top-3 right-3'}
          `} />
        </div>
      </Link>
    );
  };

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-purple-50/50 to-pink-50/50 border-purple-100/50">
      {showTitle && (
        <div className="p-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                {petName ? `For ${petName}` : 'Recommended for You'}
              </h3>
              <p className="text-xs text-gray-500">AI-powered suggestions</p>
            </div>
          </div>
          <Badge className="bg-purple-100 text-purple-700 text-xs">
            <Sparkles className="w-3 h-3 mr-1" />
            Smart
          </Badge>
        </div>
      )}
      
      <div className={`p-4 pt-2 ${compact ? 'space-y-2' : 'grid grid-cols-2 gap-3'}`}>
        {recommendations.slice(0, limit).map((rec, idx) => (
          <RecommendationItem key={idx} rec={rec} />
        ))}
      </div>
      
      {recommendations.length > limit && (
        <div className="px-4 pb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full text-purple-600 hover:text-purple-700 hover:bg-purple-50"
          >
            View All Recommendations
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </Card>
  );
};

export default SmartRecommendationsCard;
