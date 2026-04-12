import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Heart, Send, CheckCircle } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * Pawmoter NPS Modal — fires after a user's 3rd (6th, 9th...) order.
 * Submits to /api/rewards/nps/submit and awards 50 paw points.
 */
const PawmoterNPSModal = ({ isOpen, onClose, userEmail, userName, orderCount = 3 }) => {
  const [score, setScore] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (score === null) return;
    setSubmitting(true);
    try {
      await fetch(`${API_URL}/api/rewards/nps/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: userEmail,
          user_name: userName,
          score,
          feedback,
          category: 'product_order',
          reward_points: 50
        })
      });
      setSubmitted(true);
      setTimeout(onClose, 2500);
    } catch (e) {
      console.error('NPS submit failed', e);
    } finally {
      setSubmitting(false);
    }
  };

  const getScoreLabel = (s) => {
    if (s === null) return '';
    if (s <= 2) return 'Not likely at all';
    if (s <= 4) return 'Unlikely';
    if (s <= 6) return 'Maybe';
    if (s <= 8) return 'Likely';
    return 'Absolutely!';
  };

  const getScoreColor = (s) => {
    if (s === null) return 'text-gray-400';
    if (s <= 3) return 'text-red-400';
    if (s <= 6) return 'text-amber-400';
    return 'text-emerald-400';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ y: 80, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 80, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            data-testid="pawmoter-nps-modal"
          >
            {submitted ? (
              /* Thank you state */
              <div className="p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 15, delay: 0.1 }}
                >
                  <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Thank you! 🐾</h3>
                <p className="text-gray-500">Your feedback shapes Mira's next upgrade.</p>
                <p className="text-sm text-purple-600 font-semibold mt-3">+50 Paw Points added!</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="relative px-6 pt-6 pb-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                    data-testid="nps-close-btn"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="w-5 h-5 text-yellow-300" />
                    <span className="text-xs font-semibold uppercase tracking-widest text-white/80">Pawmoter Score</span>
                  </div>
                  <h3 className="text-xl font-bold">You've made {orderCount} orders! 🎉</h3>
                  <p className="text-white/80 text-sm mt-1">How likely are you to recommend The Doggy Company to a fellow pet parent?</p>
                </div>

                <div className="px-6 py-5">
                  {/* Score selector */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-400 mb-2">
                      <span>Not at all</span>
                      <span>Absolutely!</span>
                    </div>
                    <div className="flex gap-1.5 justify-between">
                      {[0,1,2,3,4,5,6,7,8,9,10].map((n) => (
                        <button
                          key={n}
                          onClick={() => setScore(n)}
                          data-testid={`nps-score-${n}`}
                          className={`flex-1 h-10 rounded-xl text-sm font-bold transition-all ${
                            score === n
                              ? n <= 3 ? 'bg-red-500 text-white scale-110' :
                                n <= 6 ? 'bg-amber-500 text-white scale-110' :
                                'bg-emerald-500 text-white scale-110'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                    {score !== null && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`text-center text-sm font-semibold mt-2 ${getScoreColor(score)}`}
                      >
                        {getScoreLabel(score)}
                      </motion.p>
                    )}
                  </div>

                  {/* Feedback textarea */}
                  <div className="mb-5">
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="What made your experience great? Any suggestions? (optional)"
                      className="w-full border border-gray-200 rounded-2xl p-3 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 placeholder-gray-400"
                      rows={2}
                      data-testid="nps-feedback-input"
                    />
                  </div>

                  {/* Points reminder */}
                  <div className="flex items-center gap-2 bg-purple-50 rounded-xl px-3 py-2 mb-4">
                    <Heart className="w-4 h-4 text-purple-500" />
                    <p className="text-xs text-purple-700 font-medium">Submit to earn 50 Paw Points!</p>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={score === null || submitting}
                    data-testid="nps-submit-btn"
                    className={`w-full py-3.5 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all ${
                      score === null
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg hover:shadow-purple-500/30'
                    }`}
                  >
                    {submitting ? (
                      <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send My Pawmoter Score
                      </>
                    )}
                  </button>

                  <button
                    onClick={onClose}
                    className="w-full text-center text-xs text-gray-400 mt-3 hover:text-gray-600 transition-colors"
                    data-testid="nps-skip-btn"
                  >
                    Skip for now
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PawmoterNPSModal;
