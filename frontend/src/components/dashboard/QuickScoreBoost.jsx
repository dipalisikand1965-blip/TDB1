/**
 * QuickScoreBoost - Component to quickly answer soul questions
 * Extracted from MemberDashboard.jsx
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Zap, ChevronRight, X, Loader2 } from 'lucide-react';
import { API_URL } from '../../utils/api';
import { toast } from '../../hooks/use-toast';

const QuickScoreBoost = ({ pet, onAnswerQuestion }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [potentialBoost, setPotentialBoost] = useState(0);
  const [currentScore, setCurrentScore] = useState(0);
  const [answering, setAnswering] = useState(null);
  const [answerInput, setAnswerInput] = useState('');
  
  useEffect(() => {
    if (!pet?.id) return;
    
    const fetchQuestions = async () => {
      try {
        const res = await fetch(`${API_URL}/api/pet-score/${pet.id}/quick-questions?limit=3`);
        if (res.ok) {
          const data = await res.json();
          setQuestions(data.questions || []);
          setPotentialBoost(data.potential_boost || 0);
          setCurrentScore(data.current_score || 0);
        }
      } catch (err) {
        console.error('Error fetching quick questions:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuestions();
  }, [pet?.id]);
  
  const handleQuickAnswer = async (questionId, answer) => {
    // Try both token keys for compatibility
    const token = localStorage.getItem('tdb_auth_token') || localStorage.getItem('token');
    if (!token) {
      console.error('No auth token found');
      toast({
        title: "Session Expired",
        description: "Please log in again to save your answer",
        variant: "destructive"
      });
      return;
    }
    if (!answer.trim()) {
      return;
    }
    
    setSaving(true);
    try {
      // Use the correct endpoint: /api/pets/{pet_id}/soul-answer
      const res = await fetch(`${API_URL}/api/pets/${pet.id}/soul-answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ question_id: questionId, answer: answer.trim() })
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('Answer saved successfully:', data);
        toast({
          title: "✓ Answer Saved!",
          description: `${pet.name}'s Soul Score is now ${Math.round(data.new_score)}%`,
        });
        setQuestions(prev => prev.filter(q => q.id !== questionId));
        setAnswering(null);
        setAnswerInput('');
        if (onAnswerQuestion) onAnswerQuestion();
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('Failed to save answer:', res.status, errorData);
        toast({
          title: "Save Failed",
          description: errorData.detail || 'Please try again',
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
      toast({
        title: "Network Error",
        description: "Please check your connection and try again",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  if (loading || questions.length === 0 || currentScore >= 75) return null;
  
  return (
    <Card className="p-4 mb-6 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 border-2 border-amber-200 rounded-2xl overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-200/30 to-transparent rounded-bl-full" />
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-amber-800">Quick Score Boost</h3>
            <p className="text-sm text-amber-600">
              Answer {questions.length} quick questions to boost {pet?.name}&apos;s Soul Score by up to <span className="font-bold">+{potentialBoost}%</span>
            </p>
          </div>
        </div>
        <Badge className="bg-amber-500 text-white px-3 py-1">
          {Math.round(currentScore)}% → {Math.min(100, Math.round(currentScore + potentialBoost))}%
        </Badge>
      </div>
      
      <div className="space-y-3">
        {questions.map((q) => (
          <div 
            key={q.id}
            className={`p-3 rounded-xl transition-all ${
              answering === q.id 
                ? 'bg-white shadow-lg border-2 border-amber-400' 
                : 'bg-white/60 hover:bg-white hover:shadow-md cursor-pointer border border-amber-200'
            }`}
            onClick={() => {
              if (answering !== q.id) {
                setAnswering(q.id);
                setAnswerInput('');
              }
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">{q.icon}</span>
                <div>
                  <p className="font-medium text-gray-800">{q.label}</p>
                  <p className="text-xs text-gray-500">{q.why_important}</p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-700 border border-green-300">
                {q.points_value}
              </Badge>
            </div>
            
            {answering === q.id && (
              <div className="mt-3 pt-3 border-t border-amber-200">
                <div className="flex gap-2">
                  <Input
                    value={answerInput}
                    onChange={(e) => setAnswerInput(e.target.value)}
                    placeholder={`Enter ${pet?.name}'s ${q.label.toLowerCase()}...`}
                    className="flex-1"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && answerInput.trim()) {
                        handleQuickAnswer(q.id, answerInput);
                      }
                    }}
                  />
                  <Button 
                    size="sm" 
                    className="bg-amber-500 hover:bg-amber-600"
                    onClick={() => handleQuickAnswer(q.id, answerInput)}
                    disabled={!answerInput.trim() || saving}
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAnswering(null);
                      setAnswerInput('');
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-3 border-t border-amber-200 flex justify-end">
        <Button 
          variant="ghost" 
          className="text-amber-700 hover:text-amber-800 hover:bg-amber-100"
          onClick={() => window.location.href = `/pet/${pet?.id}?tab=personality`}
        >
          View All Questions <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </Card>
  );
};

export default QuickScoreBoost;
