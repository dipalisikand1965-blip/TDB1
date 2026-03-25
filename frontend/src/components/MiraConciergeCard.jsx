/**
 * MiraConciergeCard - Mira's Curated Recommendation Cards
 * 
 * MIRA OS DOCTRINE:
 * - Mira doesn't search catalogs - Mira RECOMMENDS
 * - These cards show Mira's actual suggestions, not product matches
 * - User selects → Goes to Concierge® for fulfillment
 * - No inventory check needed - Concierge® sources it
 * 
 * "Mira recommends, Concierge® delivers"
 */

import React, { useState } from 'react';
import { Sparkles, Check, ChevronRight, Heart, Clock, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { getApiUrl } from '../utils/api';

// Parse Mira's recommendation text into structured suggestions
export const parseMiraRecommendations = (miraText, petName = 'your pet') => {
  const suggestions = [];
  
  // Look for recommendation patterns in Mira's response
  // Pattern 1: "Option 1:" or "1." style lists
  const optionPattern = /(?:Option\s*\d+[:\.]?|^\d+[\.\)]\s*|\•\s*|[-–]\s*)(.*?)(?=(?:Option\s*\d+|^\d+[\.\)]|\•|[-–]|$))/gmi;
  
  // Pattern 2: Bold or emphasized recommendations
  const boldPattern = /\*\*(.*?)\*\*/g;
  
  // Pattern 3: Lines that look like recommendations (contain product-like words)
  const productKeywords = ['cake', 'treat', 'box', 'kit', 'meal', 'toy', 'bed', 'collar', 'food', 'snack', 'cupcake', 'party'];
  
  // First try to extract bold recommendations
  let match;
  while ((match = boldPattern.exec(miraText)) !== null) {
    const text = match[1].trim();
    if (text.length > 5 && text.length < 100) {
      suggestions.push({
        id: `rec-${suggestions.length + 1}`,
        title: text,
        description: extractDescription(miraText, text),
        whyRight: extractWhyRight(miraText, text, petName),
        type: detectType(text),
      });
    }
  }
  
  // If no bold recommendations, try option patterns
  if (suggestions.length === 0) {
    const lines = miraText.split('\n');
    for (const line of lines) {
      const cleanLine = line.replace(/^[\d\.\)\-\•\*]+\s*/, '').trim();
      if (cleanLine.length > 10 && productKeywords.some(kw => cleanLine.toLowerCase().includes(kw))) {
        suggestions.push({
          id: `rec-${suggestions.length + 1}`,
          title: cleanLine.split('–')[0].split('-')[0].trim(),
          description: cleanLine.includes('–') ? cleanLine.split('–')[1].trim() : '',
          whyRight: `Recommended by Mira for ${petName}`,
          type: detectType(cleanLine),
        });
      }
    }
  }
  
  return suggestions.slice(0, 4); // Max 4 recommendations
};

// Extract description from context
const extractDescription = (text, title) => {
  const titleIndex = text.indexOf(title);
  if (titleIndex === -1) return '';
  
  const afterTitle = text.substring(titleIndex + title.length, titleIndex + title.length + 150);
  const dash = afterTitle.indexOf('–');
  if (dash !== -1 && dash < 100) {
    const end = afterTitle.indexOf('\n', dash);
    return afterTitle.substring(dash + 1, end > 0 ? end : 100).trim();
  }
  return '';
};

// Extract why this is right for the pet
const extractWhyRight = (text, title, petName) => {
  const reasons = [];
  
  if (text.toLowerCase().includes('dairy-free') || text.toLowerCase().includes('dairy‑free')) {
    reasons.push('Dairy-free');
  }
  if (text.toLowerCase().includes('allergy')) {
    reasons.push('Allergy-safe');
  }
  if (text.toLowerCase().includes('favorite') || text.toLowerCase().includes('favourite')) {
    reasons.push('Matches preferences');
  }
  if (text.toLowerCase().includes('breed') || text.toLowerCase().includes('size')) {
    reasons.push('Right size');
  }
  
  if (reasons.length === 0) {
    return `Perfect for ${petName}`;
  }
  return reasons.join(' · ');
};

// Detect recommendation type
const detectType = (text) => {
  const lower = text.toLowerCase();
  if (lower.includes('cake') || lower.includes('cupcake')) return 'cake';
  if (lower.includes('treat') || lower.includes('snack')) return 'treat';
  if (lower.includes('box') || lower.includes('hamper')) return 'hamper';
  if (lower.includes('toy')) return 'toy';
  if (lower.includes('meal') || lower.includes('food')) return 'meal';
  return 'product';
};

// Type-specific icons and colors
const typeConfig = {
  cake: { emoji: '🎂', color: 'from-pink-500 to-rose-500', bg: 'bg-pink-50' },
  treat: { emoji: '🦴', color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50' },
  hamper: { emoji: '🎁', color: 'from-purple-500 to-violet-500', bg: 'bg-purple-50' },
  toy: { emoji: '🧸', color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50' },
  meal: { emoji: '🍖', color: 'from-green-500 to-emerald-500', bg: 'bg-green-50' },
  product: { emoji: '✨', color: 'from-purple-500 to-pink-500', bg: 'bg-purple-50' },
};

// Single Concierge® Card Component
const ConciergeCard = ({ 
  recommendation, 
  petName,
  isSelected, 
  onSelect, 
  onSendToConcierge 
}) => {
  const config = typeConfig[recommendation.type] || typeConfig.product;
  
  return (
    <div 
      className={`relative rounded-xl border-2 transition-all cursor-pointer ${
        isSelected 
          ? 'border-purple-500 bg-purple-50/50 shadow-lg scale-[1.02]' 
          : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md'
      }`}
      onClick={() => onSelect(recommendation.id)}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center shadow-md">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}
      
      <div className="p-3">
        {/* Header with emoji and title */}
        <div className="flex items-start gap-2 mb-2">
          <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center text-xl flex-shrink-0`}>
            {config.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2">
              {recommendation.title}
            </h4>
            {recommendation.description && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                {recommendation.description}
              </p>
            )}
          </div>
        </div>
        
        {/* Why it's right badge */}
        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${config.bg} text-gray-700`}>
          <Heart className="w-3 h-3 text-pink-500" />
          {recommendation.whyRight}
        </div>
        
        {/* Concierge® action (only show when selected) */}
        {isSelected && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSendToConcierge(recommendation);
            }}
            className={`mt-3 w-full py-2.5 rounded-lg bg-gradient-to-r ${config.color} text-white text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all`}
          >
            <Sparkles className="w-4 h-4" />
            Request via Concierge®
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// Main Concierge® Cards Container
const MiraConciergeCards = ({ 
  recommendations = [], 
  petName = 'your pet',
  petId,
  token,
  onRequestCreated 
}) => {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [sending, setSending] = useState(false);
  
  const handleSelect = (id) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };
  
  const handleSendToConcierge = async (recommendation) => {
    setSending(true);
    
    try {
      const response = await fetch(`${getApiUrl()}/api/concierge/mira-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          type: 'mira_recommendation',
          pet_id: petId,
          pet_name: petName,
          recommendation: {
            title: recommendation.title,
            description: recommendation.description,
            type: recommendation.type,
            why_right: recommendation.whyRight
          },
          source: 'mira_fab',
          priority: 'normal'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success(`Request sent to Concierge®!`, {
          description: `We'll source "${recommendation.title}" for ${petName}`,
          duration: 4000
        });
        onRequestCreated?.(data);
      } else {
        throw new Error('Failed to create request');
      }
    } catch (error) {
      console.error('Concierge® request error:', error);
      toast.error('Could not send request', {
        description: 'Please try again'
      });
    } finally {
      setSending(false);
    }
  };
  
  const handleSendAllSelected = async () => {
    const selected = recommendations.filter(r => selectedIds.has(r.id));
    if (selected.length === 0) return;
    
    setSending(true);
    
    try {
      const response = await fetch(`${getApiUrl()}/api/concierge/mira-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          type: 'mira_bundle',
          pet_id: petId,
          pet_name: petName,
          recommendations: selected.map(r => ({
            title: r.title,
            description: r.description,
            type: r.type,
            why_right: r.whyRight
          })),
          source: 'mira_fab',
          priority: 'normal'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success(`${selected.length} items sent to Concierge®!`, {
          description: `We'll prepare everything for ${petName}`,
          duration: 4000
        });
        setSelectedIds(new Set());
        onRequestCreated?.(data);
      } else {
        throw new Error('Failed to create bundle request');
      }
    } catch (error) {
      console.error('Concierge® bundle request error:', error);
      toast.error('Could not send request', {
        description: 'Please try again'
      });
    } finally {
      setSending(false);
    }
  };
  
  if (!recommendations || recommendations.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
        <p className="text-xs font-bold text-purple-700 uppercase tracking-wider">
          Mira's Picks for {petName}
        </p>
      </div>
      
      {/* Cards Grid */}
      <div className="grid grid-cols-1 gap-2">
        {recommendations.map((rec) => (
          <ConciergeCard
            key={rec.id}
            recommendation={rec}
            petName={petName}
            isSelected={selectedIds.has(rec.id)}
            onSelect={handleSelect}
            onSendToConcierge={handleSendToConcierge}
          />
        ))}
      </div>
      
      {/* Send All Selected Button */}
      {selectedIds.size > 1 && (
        <button
          onClick={handleSendAllSelected}
          disabled={sending}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {sending ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Send {selectedIds.size} Picks to Concierge®
            </>
          )}
        </button>
      )}
      
      {/* Trust indicators */}
      <div className="flex items-center justify-center gap-4 text-xs text-gray-500 pt-2">
        <span className="flex items-center gap-1">
          <Shield className="w-3 h-3" />
          Verified by Mira
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Concierge® sourced
        </span>
      </div>
    </div>
  );
};

export default MiraConciergeCards;
