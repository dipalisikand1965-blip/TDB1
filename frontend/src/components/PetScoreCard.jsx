/**
 * PetScoreCard Component
 * Displays the Pet Soul Score using server-side data as single source of truth
 */
import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Brain, Sparkles, HelpCircle, ChevronRight, Loader2, Trophy } from 'lucide-react';

// Tier colors for styling
const TIER_COLORS = {
  newcomer: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-700',
    progress: 'bg-gray-400',
    badge: 'bg-gray-100 text-gray-700'
  },
  soul_seeker: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    progress: 'bg-blue-500',
    badge: 'bg-blue-100 text-blue-700'
  },
  soul_explorer: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    progress: 'bg-purple-500',
    badge: 'bg-purple-100 text-purple-700'
  },
  soul_master: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    progress: 'bg-gradient-to-r from-amber-400 to-yellow-400',
    badge: 'bg-amber-100 text-amber-700'
  }
};

const PetScoreCard = ({
  scoreState,
  loading = false,
  petName = 'Your pet',
  onQuickQuestions,
  onFullJourney,
  compact = false
}) => {
  if (loading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
          <div className="w-16 h-16 bg-gray-200 rounded-full" />
        </div>
      </Card>
    );
  }

  if (!scoreState) {
    return null;
  }

  const { score, tier, next_tier, categories, stats, recommendations } = scoreState;
  const tierKey = tier?.key || 'newcomer';
  const colors = TIER_COLORS[tierKey] || TIER_COLORS.newcomer;
  const isComplete = score >= 100;

  if (compact) {
    return (
      <Card className={`p-4 ${colors.bg} ${colors.border} border`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{tier?.emoji || '🌱'}</div>
            <div>
              <p className="font-medium text-gray-900">{tier?.name || 'Newcomer'}</p>
              <p className="text-sm text-gray-500">{Math.round(score)}% complete</p>
            </div>
          </div>
          {!isComplete && onQuickQuestions && (
            <Button size="sm" variant="outline" onClick={onQuickQuestions}>
              <HelpCircle className="w-4 h-4 mr-1" /> Quick Q's
            </Button>
          )}
        </div>
        <Progress value={score} className="h-2 mt-3" />
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${colors.bg} ${colors.border} border overflow-hidden relative animate-fade-in-up`}>
      {/* Animated background glow for high scores */}
      {score >= 75 && (
        <div className="absolute inset-0 bg-gradient-to-br from-amber-200/20 via-transparent to-purple-200/20 animate-pulse" />
      )}
      
      {/* Header */}
      <div className="flex items-start justify-between mb-4 relative">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-2xl transition-transform duration-500 hover:scale-110 ${isComplete ? 'animate-float' : ''}`}>
            {tier?.emoji || '🌱'}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              {isComplete ? (
                <>
                  <Trophy className="w-5 h-5 text-amber-500 animate-pulse" />
                  Pet Soul Complete!
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5 text-purple-600" />
                  {tier?.name || 'Pet Soul'}
                </>
              )}
            </h3>
            <p className="text-sm text-gray-600">
              {isComplete 
                ? `We deeply understand ${petName}!` 
                : `Help us know ${petName} better`}
            </p>
          </div>
        </div>
        
        {/* Score Circle - Animated */}
        <div className="text-right">
          <div className={`text-3xl font-bold ${colors.text} transition-all duration-500`}>
            {Math.round(score)}%
          </div>
          <p className="text-xs text-gray-500">
            {stats?.answered || 0}/{stats?.total || 0} questions
          </p>
        </div>
      </div>

      {/* Progress Bar - Animated */}
      <div className="mb-4 relative">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>{tier?.name}</span>
          {next_tier && <span>{next_tier.name} ({next_tier.min_score}%)</span>}
        </div>
        <div className="w-full bg-white/60 rounded-full h-3 overflow-hidden">
          <div 
            className={`h-3 rounded-full transition-all duration-1000 ease-out ${colors.progress}`}
            style={{ width: `${Math.min(score, 100)}%` }}
          />
        </div>
        {next_tier && (
          <p className="text-xs text-gray-500 mt-1">
            {Math.round(next_tier.points_needed)}% more to unlock {next_tier.name}
          </p>
        )}
      </div>

      {/* Category Scores - Staggered animation */}
      {categories && Object.keys(categories).length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
          {Object.entries(categories).map(([key, cat], index) => (
            <div 
              key={key} 
              className="bg-white/70 rounded-lg p-2 text-center transition-all duration-300 hover:scale-105 hover:bg-white hover:shadow-sm animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
              title={cat.name}
            >
              <span className="text-lg">{cat.icon}</span>
              <p className="text-xs font-medium text-gray-600 mt-1">
                {Math.round(cat.percentage)}%
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Tier Benefits */}
      {tier?.benefits && tier.benefits.length > 0 && (
        <div className="mb-4 p-3 bg-white/50 rounded-lg">
          <p className="text-xs font-medium text-gray-600 mb-2">Current Benefits:</p>
          <div className="flex flex-wrap gap-1">
            {tier.benefits.slice(0, 3).map((benefit, idx) => (
              <Badge key={idx} variant="outline" className="text-xs bg-white">
                ✓ {benefit}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* High Impact Missing Questions */}
      {!isComplete && recommendations?.high_impact_missing?.length > 0 && (
        <div className="mb-4 p-3 bg-white/50 rounded-lg">
          <p className="text-xs font-medium text-gray-600 mb-2">
            Answer these for the biggest boost:
          </p>
          <div className="space-y-1">
            {recommendations.high_impact_missing.slice(0, 3).map((q) => (
              <div key={q.id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span>{q.icon}</span>
                  <span className="text-gray-700">{q.label}</span>
                </span>
                <Badge className="bg-green-100 text-green-700 text-xs">
                  +{q.weight}pts
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!isComplete && (
        <div className="flex gap-2">
          {onQuickQuestions && (
            <Button 
              onClick={onQuickQuestions}
              variant="outline"
              className="flex-1 border-purple-300 text-purple-600 hover:bg-purple-50"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              Quick Questions
            </Button>
          )}
          {onFullJourney && (
            <Button 
              onClick={onFullJourney}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Full Journey
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      )}

      {/* Complete State */}
      {isComplete && (
        <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
          <p className="text-green-700 font-medium">
            ✨ {petName}'s Pet Soul is complete! You've unlocked the deepest level of understanding.
          </p>
        </div>
      )}
    </Card>
  );
};

export default PetScoreCard;
