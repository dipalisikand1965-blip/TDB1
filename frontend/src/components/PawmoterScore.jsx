/**
 * PawmoterScore Component (NPS - Net Promoter Score)
 * Measures member satisfaction and likelihood to recommend
 * Features:
 * - 0-10 rating scale
 * - Feedback collection
 * - Rewards for completing survey
 * - Tracks NPS over time
 */

import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { 
  TrendingUp, Star, MessageSquare, Gift, 
  ThumbsUp, ThumbsDown, Meh, Send, CheckCircle 
} from 'lucide-react';
import { API_URL } from '../utils/api';
import { toast } from '../hooks/use-toast';

const REWARD_POINTS = 10;

// NPS Categories
const getNPSCategory = (score) => {
  if (score >= 9) return { label: 'Promoter', color: 'text-green-600', bg: 'bg-green-100', icon: ThumbsUp };
  if (score >= 7) return { label: 'Passive', color: 'text-yellow-600', bg: 'bg-yellow-100', icon: Meh };
  return { label: 'Detractor', color: 'text-red-600', bg: 'bg-red-100', icon: ThumbsDown };
};

const PawmoterScore = ({ user, onScoreSubmitted }) => {
  const [showSurvey, setShowSurvey] = useState(false);
  const [selectedScore, setSelectedScore] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmittedRecently, setHasSubmittedRecently] = useState(false);
  const [lastSubmission, setLastSubmission] = useState(null);
  
  // Check if user has submitted recently (within 30 days)
  useEffect(() => {
    const checkRecentSubmission = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/rewards/nps/check?user_email=${user?.email}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setHasSubmittedRecently(data.has_recent_submission);
          setLastSubmission(data.last_submission);
        }
      } catch (err) {
        // Ignore error - just show the survey
      }
    };
    
    if (user?.email) {
      checkRecentSubmission();
    }
  }, [user?.email]);
  
  const handleSubmit = async () => {
    if (selectedScore === null) {
      toast({ title: 'Please select a score', variant: 'destructive' });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      const category = getNPSCategory(selectedScore);
      
      const res = await fetch(`${API_URL}/api/rewards/nps/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_email: user?.email,
          user_name: user?.full_name || user?.name,
          score: selectedScore,
          category: category.label.toLowerCase(),
          feedback: feedback,
          reward_points: REWARD_POINTS
        })
      });
      
      if (res.ok) {
        toast({ 
          title: '🎉 Thank you!', 
          description: `You earned ${REWARD_POINTS} points for your feedback` 
        });
        setShowSurvey(false);
        setHasSubmittedRecently(true);
        if (onScoreSubmitted) onScoreSubmitted(selectedScore);
      } else {
        throw new Error('Failed to submit');
      }
    } catch (err) {
      toast({ title: 'Submission failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Don't show if recently submitted
  if (hasSubmittedRecently) {
    return (
      <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200" data-testid="pawmoter-completed">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-green-700">Thanks for your feedback!</p>
            <p className="text-sm text-green-600">Next survey available in {lastSubmission ? `${Math.max(0, 30 - Math.floor((Date.now() - new Date(lastSubmission).getTime()) / (1000 * 60 * 60 * 24)))} days` : '30 days'}</p>
          </div>
        </div>
      </Card>
    );
  }
  
  return (
    <>
      {/* Survey CTA */}
      <Card className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-indigo-200" data-testid="pawmoter-score">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-sm sm:text-base text-gray-900 flex items-center gap-2 flex-wrap">
                Pawmoter Score <Badge className="bg-blue-100 text-blue-700 text-xs">{REWARD_POINTS} pts</Badge>
              </h4>
              <p className="text-xs sm:text-sm text-gray-500">Share your experience with us</p>
            </div>
          </div>
          <Button 
            onClick={() => setShowSurvey(true)}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-sm"
            size="sm"
          >
            <Star className="w-4 h-4 mr-2" /> Rate Us
          </Button>
        </div>
      </Card>
      
      {/* Survey Modal */}
      <Dialog open={showSurvey} onOpenChange={setShowSurvey}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              How likely are you to recommend us?
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Score Selection */}
            <div>
              <p className="text-sm text-gray-500 mb-4 text-center">
                On a scale of 0-10, how likely are you to recommend The Doggy Company to a friend?
              </p>
              
              <div className="flex justify-center gap-1">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
                  const isSelected = selectedScore === score;
                  const category = getNPSCategory(score);
                  return (
                    <button
                      key={score}
                      onClick={() => setSelectedScore(score)}
                      className={`w-9 h-9 rounded-lg font-medium text-sm transition-all ${
                        isSelected 
                          ? `${category.bg} ${category.color} ring-2 ring-offset-1 ring-${category.color.replace('text-', '')}` 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {score}
                    </button>
                  );
                })}
              </div>
              
              <div className="flex justify-between text-xs text-gray-400 mt-2 px-1">
                <span>Not likely</span>
                <span>Very likely</span>
              </div>
              
              {/* Category Badge */}
              {selectedScore !== null && (
                <div className="flex justify-center mt-4">
                  {(() => {
                    const category = getNPSCategory(selectedScore);
                    const Icon = category.icon;
                    return (
                      <Badge className={`${category.bg} ${category.color} border-0 px-3 py-1`}>
                        <Icon className="w-4 h-4 mr-1" /> {category.label}
                      </Badge>
                    );
                  })()}
                </div>
              )}
            </div>
            
            {/* Feedback */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Tell us more (optional)
              </label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={selectedScore >= 9 
                  ? "What do you love most about us?" 
                  : selectedScore >= 7 
                    ? "What could we do better?" 
                    : "What went wrong? We'd love to fix it."}
                rows={3}
              />
            </div>
            
            {/* Reward Notice */}
            <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg">
              <Gift className="w-5 h-5 text-amber-500" />
              <p className="text-sm text-amber-700">
                Earn <strong>{REWARD_POINTS} loyalty points</strong> for completing this survey!
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSurvey(false)}>
              Maybe Later
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={selectedScore === null || isSubmitting}
              className="bg-gradient-to-r from-blue-500 to-indigo-600"
            >
              {isSubmitting ? 'Submitting...' : (
                <><Send className="w-4 h-4 mr-2" /> Submit & Earn Points</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PawmoterScore;
