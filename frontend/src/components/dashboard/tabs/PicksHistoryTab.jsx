/**
 * PicksHistoryTab - Shows all picks Mira has suggested for the pet
 * Part of the Member Dashboard
 */
import React, { useState, useEffect } from 'react';
import { Gift, ShoppingBag, Sparkles, Clock, ChevronRight, Lightbulb, Filter } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Pillar icons and colors
const PILLAR_CONFIG = {
  celebrate: { icon: '🎂', color: '#ec4899', label: 'Celebrate' },
  dine: { icon: '🍽️', color: '#f59e0b', label: 'Dine' },
  stay: { icon: '🏨', color: '#8b5cf6', label: 'Stay' },
  travel: { icon: '✈️', color: '#3b82f6', label: 'Travel' },
  care: { icon: '💊', color: '#ef4444', label: 'Care' },
  enjoy: { icon: '🎾', color: '#10b981', label: 'Enjoy' },
  fit: { icon: '🏃', color: '#06b6d4', label: 'Fit' },
  learn: { icon: '🎓', color: '#6366f1', label: 'Learn' },
  shop: { icon: '🛒', color: '#f97316', label: 'Shop' },
  farewell: { icon: '🌈', color: '#64748b', label: 'Farewell' },
  general: { icon: '✨', color: '#a855f7', label: 'General' }
};

const PicksHistoryTab = ({ pet, user }) => {
  const [picksData, setPicksData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPillar, setSelectedPillar] = useState('all');

  useEffect(() => {
    fetchPicksHistory();
  }, [pet?.id]);

  const fetchPicksHistory = async () => {
    if (!pet?.id) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/mira/picks-history/${pet.id}`);
      setPicksData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching picks history:', err);
      setError('Unable to load picks history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const filteredPicks = selectedPillar === 'all' 
    ? picksData?.recent_picks || []
    : (picksData?.recent_picks || []).filter(p => p.pillar === selectedPillar);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{error}</p>
        <Button onClick={fetchPicksHistory} className="mt-4">Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Gift className="w-5 h-5 text-pink-500" />
            {pet?.name}'s Picks History
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            All the wonderful things Mira has suggested for {pet?.name}
          </p>
        </div>
        
        {/* Stats Badge */}
        {picksData?.total_picks > 0 && (
          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
            {picksData.total_picks} picks
          </Badge>
        )}
      </div>

      {/* Pillar Filter */}
      {picksData?.picks_by_pillar && Object.keys(picksData.picks_by_pillar).length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={selectedPillar === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPillar('all')}
            className="whitespace-nowrap"
          >
            All Picks
          </Button>
          {Object.entries(picksData.picks_by_pillar).map(([pillar, count]) => {
            const config = PILLAR_CONFIG[pillar] || PILLAR_CONFIG.general;
            return (
              <Button
                key={pillar}
                variant={selectedPillar === pillar ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPillar(pillar)}
                className="whitespace-nowrap"
                style={selectedPillar === pillar ? { backgroundColor: config.color } : {}}
              >
                <span className="mr-1">{config.icon}</span>
                {config.label} ({count})
              </Button>
            );
          })}
        </div>
      )}

      {/* Tip Cards Section */}
      {picksData?.tip_cards?.length > 0 && (
        <Card className="p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20">
          <h3 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Mira's Tips for {pet?.name}
          </h3>
          <div className="space-y-2">
            {picksData.tip_cards.map((card, idx) => (
              <div 
                key={idx}
                className="flex items-start gap-3 p-3 bg-black/20 rounded-lg"
              >
                <span className="text-2xl">{card.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm">{card.title}</p>
                  <p className="text-gray-400 text-xs line-clamp-2">{card.content}</p>
                </div>
                {card.date && (
                  <span className="text-xs text-gray-500">{formatDate(card.date)}</span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Picks Grid */}
      {filteredPicks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPicks.map((pick, idx) => {
            const config = PILLAR_CONFIG[pick.pillar] || PILLAR_CONFIG.general;
            return (
              <Card 
                key={idx}
                className="p-4 bg-white/5 border-white/10 hover:border-white/20 transition-colors"
              >
                <div className="flex gap-4">
                  {/* Image or Icon */}
                  {pick.image ? (
                    <img 
                      src={pick.image} 
                      alt={pick.name}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                  ) : (
                    <div 
                      className="w-20 h-20 rounded-lg flex items-center justify-center text-3xl"
                      style={{ backgroundColor: `${config.color}20` }}
                    >
                      {pick.type === 'service' ? '🛎️' : config.icon}
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-white text-sm line-clamp-1">{pick.name}</p>
                        <Badge 
                          className="mt-1 text-xs"
                          style={{ 
                            backgroundColor: `${config.color}20`,
                            color: config.color,
                            borderColor: `${config.color}40`
                          }}
                        >
                          {config.icon} {config.label}
                        </Badge>
                      </div>
                      {pick.price && (
                        <span className="text-green-400 font-semibold text-sm whitespace-nowrap">
                          ₹{pick.price}
                        </span>
                      )}
                    </div>
                    
                    {pick.why_for_pet && (
                      <p className="text-gray-400 text-xs mt-2 line-clamp-2">
                        💡 {pick.why_for_pet}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(pick.date)}
                      </span>
                      {pick.context && (
                        <span className="text-xs text-purple-400">{pick.context}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-8 bg-white/5 border-white/10 text-center">
          <Gift className="w-12 h-12 mx-auto text-gray-600 mb-3" />
          <h3 className="text-lg font-medium text-white mb-2">No picks yet</h3>
          <p className="text-gray-400 text-sm mb-4">
            Start chatting with Mira to get personalized picks for {pet?.name}!
          </p>
          <Button 
            onClick={() => window.location.href = '/mira-demo'}
            className="bg-gradient-to-r from-pink-500 to-purple-500"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Talk to Mira
          </Button>
        </Card>
      )}

      {/* Concierge® CTA */}
      {filteredPicks.length > 0 && (
        <Card className="p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border-emerald-500/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold">
              C°
            </div>
            <div className="flex-1">
              <p className="font-medium text-white">Want to act on these picks?</p>
              <p className="text-gray-400 text-sm">Your pet Concierge® can help you with any of these suggestions</p>
            </div>
            <Button 
              variant="outline" 
              className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
            >
              Contact Concierge®
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default PicksHistoryTab;
