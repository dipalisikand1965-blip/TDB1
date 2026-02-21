import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { API_URL } from '../utils/api';
import { Star, Heart, PawPrint, Send, CheckCircle, Sparkles } from 'lucide-react';

const NPSFeedbackPage = () => {
  const [searchParams] = useSearchParams();
  const ticketId = searchParams.get('ticket');
  const token = searchParams.get('token');
  const initialScore = searchParams.get('score');

  const [score, setScore] = useState(initialScore ? parseInt(initialScore) : null);
  const [feedback, setFeedback] = useState('');
  const [allowPublish, setAllowPublish] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  // Auto-submit if score came from URL
  useEffect(() => {
    if (initialScore && ticketId && token) {
      // Don't auto-submit, let user add feedback
    }
  }, [initialScore, ticketId, token]);

  const handleSubmit = async () => {
    if (score === null) {
      setError('Please select a score');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${API_URL}/api/concierge/nps/respond?ticket_id=${ticketId}&token=${token}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            score,
            feedback: feedback.trim() || null,
            allow_publish: allowPublish
          })
        }
      );

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        setSubmitted(true);
      } else {
        setError(data.detail || 'Failed to submit feedback');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreLabel = (s) => {
    if (s >= 9) return { label: 'Promoter', emoji: '🎉', color: 'text-green-600', bg: 'bg-green-100' };
    if (s >= 7) return { label: 'Passive', emoji: '😊', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { label: 'Detractor', emoji: '😔', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const scoreInfo = score !== null ? getScoreLabel(score) : null;

  // Invalid access
  if (!ticketId || !token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <PawPrint className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid Link</h1>
          <p className="text-gray-600">This feedback link is invalid or has expired.</p>
        </Card>
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank You! 🐾</h1>
          <p className="text-gray-600 mb-6">{result?.message || 'Your feedback has been recorded.'}</p>
          
          {result?.review_created && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <Sparkles className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <p className="text-purple-700 text-sm">
                Your review is pending approval and may be featured on our website!
              </p>
            </div>
          )}

          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${scoreInfo?.bg}`}>
            <span className="text-2xl">{scoreInfo?.emoji}</span>
            <span className={`font-medium ${scoreInfo?.color}`}>
              Score: {score}/10 ({scoreInfo?.label})
            </span>
          </div>

          <div className="mt-8">
            <a 
              href="/" 
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Visit The Doggy Company →
            </a>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <PawPrint className="w-8 h-8 text-purple-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              The Doggy Company
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">How Did We Do? 🐾</h1>
          <p className="text-gray-600">Your feedback helps us serve you and your furry friends better!</p>
          {ticketId && (
            <p className="text-sm text-gray-500 mt-2">Ticket: {ticketId}</p>
          )}
        </div>

        <Card className="shadow-xl">
          <CardContent className="p-6 sm:p-8">
            {/* NPS Score Selection */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                How likely are you to recommend The Doggy Company to a fellow pet parent?
              </h2>
              
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <button
                    key={n}
                    onClick={() => setScore(n)}
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full font-bold transition-all ${
                      score === n
                        ? n >= 9
                          ? 'bg-green-500 text-white ring-4 ring-green-200'
                          : n >= 7
                          ? 'bg-yellow-500 text-white ring-4 ring-yellow-200'
                          : 'bg-red-500 text-white ring-4 ring-red-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              <div className="flex justify-between text-xs text-gray-500 px-2">
                <span>Not likely</span>
                <span>Extremely likely</span>
              </div>

              {scoreInfo && (
                <div className={`mt-4 text-center p-3 rounded-lg ${scoreInfo.bg}`}>
                  <span className="text-2xl mr-2">{scoreInfo.emoji}</span>
                  <span className={`font-medium ${scoreInfo.color}`}>{scoreInfo.label}</span>
                </div>
              )}
            </div>

            {/* Feedback Text */}
            <div className="mb-6">
              <Label className="text-gray-700 font-medium mb-2 block">
                Tell us more (optional)
              </Label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="What made your experience great? Or what could we improve?"
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                {feedback.length}/500 characters
              </p>
            </div>

            {/* Allow Publish Checkbox */}
            {score >= 9 && feedback.trim() && (
              <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="allow-publish"
                    checked={allowPublish}
                    onCheckedChange={setAllowPublish}
                    className="mt-1"
                  />
                  <div>
                    <Label htmlFor="allow-publish" className="text-gray-900 font-medium cursor-pointer">
                      ✨ Feature my review on the website
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Your feedback is pawsome! Allow us to share it with other pet parents? (We'll only show your first name)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={loading || score === null}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-6 text-lg"
            >
              {loading ? (
                <>Submitting...</>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Submit Feedback
                </>
              )}
            </Button>

            {/* Footer */}
            <p className="text-center text-xs text-gray-500 mt-6">
              <Heart className="w-3 h-3 inline text-pink-500" /> Thank you for being part of The Doggy Company family!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NPSFeedbackPage;
