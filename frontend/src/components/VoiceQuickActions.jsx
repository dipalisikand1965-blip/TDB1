import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Mic, MicOff, Loader2, Volume2, X, ChevronRight,
  Scissors, Stethoscope, ShoppingBag, PawPrint, 
  PartyPopper, GraduationCap, AlertTriangle, Heart
} from 'lucide-react';
import { getApiUrl } from '../utils/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// Icon mapping for actions
const ACTION_ICONS = {
  book_grooming: Scissors,
  book_vet: Stethoscope,
  book_walk: PawPrint,
  book_training: GraduationCap,
  order_food: ShoppingBag,
  plan_celebration: PartyPopper,
  emergency: AlertTriangle,
  nutrition_advice: Heart,
  default: Mic
};

const VoiceQuickActions = ({ 
  isOpen, 
  onClose, 
  userId, 
  petId,
  onActionComplete 
}) => {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [processing, setProcessing] = useState(false);
  const [actionResult, setActionResult] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [recognition, setRecognition] = useState(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      // Check for iOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      if (SpeechRecognition && !isIOS) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = 'en-US';

        recognitionInstance.onresult = (event) => {
          const current = event.resultIndex;
          const transcriptText = event.results[current][0].transcript;
          setTranscript(transcriptText);
          
          if (event.results[current].isFinal) {
            processVoiceCommand(transcriptText);
          }
        };

        recognitionInstance.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          if (event.error === 'not-allowed') {
            toast.error('Microphone access denied. Please enable it in your browser settings.');
          } else if (event.error === 'network') {
            toast.error('Network error. Please check your connection.');
          } else {
            toast.error('Voice input error. Try again or use the suggestions below.');
          }
        };

        recognitionInstance.onend = () => {
          setIsListening(false);
        };

        setRecognition(recognitionInstance);
      } else if (isIOS) {
        console.log('Voice input limited on iOS Safari - using suggestion chips instead');
      }
    }

    // Fetch suggestions
    fetchSuggestions();
  }, [petId]);

  const fetchSuggestions = async () => {
    try {
      let url = `${getApiUrl()}/api/voice-actions/suggestions`;
      if (petId) url += `?pet_id=${petId}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.debug('Failed to fetch voice suggestions:', error);
    }
  };

  const toggleListening = () => {
    if (!recognition) {
      toast.error('Voice input not supported in your browser');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setActionResult(null);
      recognition.start();
      setIsListening(true);
    }
  };

  const processVoiceCommand = async (text) => {
    if (!text.trim()) return;
    
    setProcessing(true);
    try {
      const params = new URLSearchParams({ text });
      if (userId) params.append('user_id', userId);
      if (petId) params.append('pet_id', petId);

      const response = await fetch(`${getApiUrl()}/api/voice-actions/process?${params}`, {
        method: 'POST'
      });

      if (response.ok) {
        const result = await response.json();
        setActionResult(result);
        
        // Speak the response
        if (window.speechSynthesis && result.response_text) {
          const utterance = new SpeechSynthesisUtterance(result.response_text);
          utterance.rate = 0.9;
          window.speechSynthesis.speak(utterance);
        }
      }
    } catch (error) {
      console.error('Failed to process voice command:', error);
      toast.error('Failed to process command. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleSuggestionClick = (phrase) => {
    setTranscript(phrase);
    processVoiceCommand(phrase);
  };

  const handleActionClick = (action) => {
    if (action.action === 'navigate') {
      navigate(action.target);
      onClose?.();
    } else if (action.action === 'open_chat') {
      onActionComplete?.({ type: 'open_chat', message: action.message });
      onClose?.();
    } else if (action.action === 'call') {
      window.location.href = `tel:${action.target}`;
    }
  };

  if (!isOpen) return null;

  const ActionIcon = actionResult?.action ? (ACTION_ICONS[actionResult.action] || ACTION_ICONS.default) : Mic;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose?.()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Voice Quick Actions</h3>
                  <p className="text-sm text-white/80">Say what you need</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/20"
                onClick={onClose}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-6">
            {/* Voice Button */}
            <div className="flex justify-center mb-6">
              <button
                onClick={toggleListening}
                disabled={processing}
                className={`
                  w-24 h-24 rounded-full flex items-center justify-center
                  transition-all duration-300 transform
                  ${isListening 
                    ? 'bg-red-500 animate-pulse scale-110 shadow-lg shadow-red-500/50' 
                    : 'bg-gradient-to-br from-purple-500 to-pink-500 hover:scale-105 shadow-lg'
                  }
                  ${processing ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {processing ? (
                  <Loader2 className="w-10 h-10 text-white animate-spin" />
                ) : isListening ? (
                  <MicOff className="w-10 h-10 text-white" />
                ) : (
                  <Mic className="w-10 h-10 text-white" />
                )}
              </button>
            </div>

            {/* Status Text */}
            <div className="text-center mb-4">
              {isListening ? (
                <p className="text-red-500 font-medium animate-pulse">🎤 Listening...</p>
              ) : processing ? (
                <p className="text-purple-500 font-medium">Processing...</p>
              ) : (
                <p className="text-gray-500">Tap the microphone and speak</p>
              )}
            </div>

            {/* Transcript */}
            {transcript && (
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-sm text-gray-500 mb-1">You said:</p>
                <p className="text-gray-900 font-medium">"{transcript}"</p>
              </div>
            )}

            {/* Action Result */}
            {actionResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 mb-4 border border-purple-100"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    ${actionResult.is_urgent ? 'bg-red-500' : 'bg-gradient-to-br from-purple-500 to-pink-500'}
                  `}>
                    <ActionIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium">{actionResult.response_text}</p>
                    {actionResult.extracted_data?.date && (
                      <Badge className="mt-2 bg-purple-100 text-purple-700">
                        📅 {new Date(actionResult.extracted_data.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Suggested Actions */}
                {actionResult.suggested_actions?.length > 0 && (
                  <div className="space-y-2">
                    {actionResult.suggested_actions.map((action, idx) => (
                      <Button
                        key={idx}
                        variant={action.urgent ? 'destructive' : 'outline'}
                        className={`w-full justify-between ${
                          action.urgent ? '' : 'border-purple-200 hover:bg-purple-50'
                        }`}
                        onClick={() => handleActionClick(action)}
                      >
                        {action.label}
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Suggestions */}
            {!actionResult && suggestions.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">
                  Try saying:
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.slice(0, 6).map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(suggestion.phrase)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-purple-100 rounded-full text-sm text-gray-700 hover:text-purple-700 transition-colors flex items-center gap-1"
                    >
                      <span>{suggestion.icon}</span>
                      <span>{suggestion.phrase}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 text-center">
            <p className="text-xs text-gray-400">
              Voice commands help you quickly book services, order products, and more
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VoiceQuickActions;
