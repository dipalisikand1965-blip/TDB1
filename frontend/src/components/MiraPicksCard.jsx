import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Sparkles, ShoppingBag, Gift, Heart, AlertTriangle, 
  ChevronRight, Calendar, Clock, Star, PawPrint, Loader2
} from 'lucide-react';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getPetPhotoUrl } from '../utils/petAvatar';

const MiraPicksCard = ({ 
  userId, 
  petId = null, 
  title = "Mira's Picks", 
  subtitle = "Personalized for your pet",
  compact = false,
  maxItems = 4,
  showInsights = true
}) => {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const url = petId 
          ? `${API_URL}/api/smart/recommendations/${userId}?pet_id=${petId}`
          : `${API_URL}/api/smart/recommendations/${userId}`;
        
        const response = await fetch(url, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        if (!response.ok) throw new Error('Failed to fetch recommendations');
        
        const data = await response.json();
        setRecommendations(data);
      } catch (err) {
        console.error('Failed to fetch recommendations:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [userId, petId, token]);

  const handleAddToCart = (product) => {
    addToCart({
      id: product.id,
      name: product.name || product.title,
      price: product.price,
      image: product.image || product.images?.[0],
      quantity: 1
    });
  };

  if (loading) {
    return (
      <Card className="p-6 bg-gradient-to-br from-teal-50 to-white border-teal-100">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        </div>
      </Card>
    );
  }

  if (error || !recommendations) {
    return null;
  }

  const { mira_picks, birthday_gifts, insights, upcoming_events, primary_pet } = recommendations;

  // Show birthday section if birthday is coming
  const hasBirthday = birthday_gifts && birthday_gifts.length > 0 && upcoming_events?.some(e => e.type === 'birthday');

  if (compact) {
    return (
      <Card className="overflow-hidden border-teal-100 bg-gradient-to-r from-teal-50 to-white" data-testid="mira-picks-compact">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500">{subtitle}</p>
            </div>
          </div>

          {/* Quick picks */}
          <div className="grid grid-cols-2 gap-3">
            {mira_picks?.slice(0, 2).map((product, i) => (
              <div 
                key={product.id || i}
                className="bg-white rounded-xl p-3 border border-gray-100 hover:border-teal-200 transition-all cursor-pointer"
                onClick={() => handleAddToCart(product)}
              >
                <div className="aspect-square rounded-lg bg-gray-100 mb-2 overflow-hidden">
                  <img 
                    src={product.image || product.images?.[0] || '/placeholder-product.png'} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-sm font-medium text-gray-900 line-clamp-1">{product.name || product.title}</p>
                <p className="text-sm text-teal-600 font-semibold">₹{product.price}</p>
              </div>
            ))}
          </div>

          <Button variant="outline" className="w-full mt-4 text-teal-600 border-teal-200 hover:bg-teal-50">
            View All Picks
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-gray-100" data-testid="mira-picks-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{title}</h2>
              <p className="text-teal-100">
                {primary_pet?.name 
                  ? `Curated for ${primary_pet.name}` 
                  : subtitle
                }
              </p>
            </div>
          </div>
          {primary_pet?.photo_url && (
            <div className="w-16 h-16 rounded-full border-4 border-white/30 overflow-hidden">
              <img 
                src={getPetPhotoUrl(primary_pet)} 
                alt={primary_pet.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </div>

      {/* Birthday Alert */}
      {hasBirthday && (
        <div className="bg-gradient-to-r from-pink-50 to-amber-50 p-4 border-b border-amber-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <Gift className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">
                🎂 {upcoming_events.find(e => e.type === 'birthday')?.message}
              </p>
              <p className="text-sm text-gray-600">
                Don't forget to order a special gift!
              </p>
            </div>
            <Badge className="bg-amber-100 text-amber-700 border-amber-200">
              <Clock className="w-3 h-3 mr-1" />
              {upcoming_events.find(e => e.type === 'birthday')?.days_until} days
            </Badge>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="p-6">
        {/* Main Picks */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {mira_picks?.slice(0, maxItems).map((product, i) => (
            <div 
              key={product.id || i}
              className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-teal-200 transition-all"
            >
              {/* Product Image */}
              <div className="aspect-square bg-gray-50 relative overflow-hidden">
                <img 
                  src={product.image || product.images?.[0] || '/placeholder-product.png'} 
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                {product.urgency_level === 'high' && (
                  <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs">
                    Order Now!
                  </Badge>
                )}
                {product.reason && (
                  <Badge className="absolute bottom-2 left-2 bg-white/90 text-teal-700 text-xs border border-teal-200">
                    <PawPrint className="w-3 h-3 mr-1" />
                    {product.reason.split(' ').slice(0, 3).join(' ')}
                  </Badge>
                )}
              </div>
              
              {/* Product Info */}
              <div className="p-3">
                <p className="font-medium text-gray-900 line-clamp-2 text-sm mb-1">
                  {product.name || product.title}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold text-teal-600">₹{product.price}</span>
                    {product.compare_price && product.compare_price > product.price && (
                      <span className="text-xs text-gray-400 line-through ml-1">
                        ₹{product.compare_price}
                      </span>
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-teal-600 hover:bg-teal-700 h-8 w-8 p-0"
                    onClick={() => handleAddToCart(product)}
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Insights Section */}
        {showInsights && insights && insights.length > 0 && (
          <div className="bg-gradient-to-r from-teal-50 to-white rounded-xl p-4 border border-teal-100">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-500" />
              Care Tips for Your Pet
            </h4>
            <div className="space-y-2">
              {insights.slice(0, 3).map((insight, i) => (
                <p key={i} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-teal-500 mt-0.5">•</span>
                  {insight}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* View More */}
        <div className="flex justify-center mt-6">
          <Button 
            variant="outline" 
            className="px-8"
            onClick={() => window.location.href = '/shop'}
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            Browse All Recommendations
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default MiraPicksCard;
