/**
 * TasteTestFeature.jsx
 * 
 * VISION: "Taste Test" Feature
 * - Request free sample of a food product
 * - If loved → auto-subscribe & save 15%
 * - If not → Mira never suggests again
 * 
 * Creates emotional engagement and drives subscription conversion.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gift, Heart, ThumbsUp, ThumbsDown, Package, Sparkles,
  Check, X, Truck, Loader2, ArrowRight, Star, Percent
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { toast } from 'sonner';
import { API_URL } from '../../utils/api';

const TasteTestFeature = ({ product, pet, token, userAddress, onSuccess }) => {
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState('request'); // request, shipping, feedback, result
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null); // 'loved' | 'not_for_me'
  
  const petName = pet?.name || 'your pet';
  const productName = product?.name || 'this food';
  
  // Request taste test sample
  const handleRequestSample = async () => {
    if (!token) {
      toast.error('Please sign in to request a taste test');
      return;
    }
    
    setLoading(true);
    try {
      // In production, this would call the backend API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate API response
      toast.success('Taste test requested!');
      setStep('shipping');
      
    } catch (err) {
      toast.error('Failed to request taste test');
    } finally {
      setLoading(false);
    }
  };
  
  // Submit feedback
  const handleFeedback = async (reaction) => {
    setFeedback(reaction);
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (reaction === 'loved') {
        // Show subscription offer
        setStep('loved');
        
        // Fire confetti!
        import('canvas-confetti').then(confetti => {
          confetti.default({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#22c55e', '#16a34a', '#15803d', '#fbbf24']
          });
        });
      } else {
        // Mark as "not for this pet"
        setStep('not_for_me');
        toast.info(`Noted! Mira won't suggest ${productName} for ${petName} again.`);
      }
      
    } catch (err) {
      toast.error('Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };
  
  // Subscribe with discount
  const handleSubscribe = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Subscription started with 15% off! 🎉');
      setStep('subscribed');
      
      if (onSuccess) {
        onSuccess({ type: 'subscribed', product, discount: 15 });
      }
      
    } catch (err) {
      toast.error('Failed to start subscription');
    } finally {
      setLoading(false);
    }
  };
  
  // Render trigger button
  const renderTrigger = () => (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => setShowModal(true)}
      className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-medium hover:from-purple-600 hover:to-pink-600 transition-all"
    >
      <Gift className="w-4 h-4" />
      Taste Test
    </motion.button>
  );
  
  // Render modal content based on step
  const renderModalContent = () => {
    switch (step) {
      case 'request':
        return (
          <div className="text-center py-4">
            <motion.div
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4"
            >
              <Gift className="w-10 h-10 text-white" />
            </motion.div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Try Before You Buy!
            </h3>
            <p className="text-gray-600 mb-4">
              Get a FREE sample of <span className="font-semibold">{productName}</span> for {petName} to try.
            </p>
            
            {/* Product preview */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4 flex items-center gap-4">
              <img
                src={product?.image_url || product?.image || '/placeholder-food.png'}
                alt={productName}
                className="w-16 h-16 object-cover rounded-lg"
              />
              <div className="text-left">
                <p className="font-semibold text-gray-900">{productName}</p>
                <p className="text-sm text-gray-500">Sample Size: Trial Pack</p>
                <Badge className="mt-1 bg-green-100 text-green-700">FREE</Badge>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-4">
              <p className="text-sm text-purple-800">
                <Sparkles className="w-4 h-4 inline mr-1" />
                If {petName} loves it, subscribe and save 15%!
              </p>
            </div>
            
            <Button
              onClick={handleRequestSample}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Requesting...
                </>
              ) : (
                <>
                  <Gift className="w-4 h-4 mr-2" />
                  Request Free Sample
                </>
              )}
            </Button>
          </div>
        );
        
      case 'shipping':
        return (
          <div className="text-center py-4">
            <motion.div
              animate={{ x: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4"
            >
              <Truck className="w-10 h-10 text-white" />
            </motion.div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Sample On Its Way! 📦
            </h3>
            <p className="text-gray-600 mb-4">
              We'll notify you when it arrives. Please share {petName}'s reaction!
            </p>
            
            {/* Feedback buttons */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <p className="text-sm font-medium text-gray-700 mb-3">
                How did {petName} like it?
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => handleFeedback('loved')}
                  disabled={loading}
                  className="flex-1 bg-green-500 hover:bg-green-600"
                >
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Loved It!
                </Button>
                <Button
                  onClick={() => handleFeedback('not_for_me')}
                  disabled={loading}
                  variant="outline"
                  className="flex-1 border-gray-300"
                >
                  <ThumbsDown className="w-4 h-4 mr-2" />
                  Not for Us
                </Button>
              </div>
            </div>
            
            <p className="text-xs text-gray-400">
              Haven't received it yet? We'll send a reminder in 3 days.
            </p>
          </div>
        );
        
      case 'loved':
        return (
          <div className="text-center py-4">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5 }}
              className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4"
            >
              <Heart className="w-10 h-10 text-white fill-white" />
            </motion.div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {petName} Loves It! 🎉
            </h3>
            <p className="text-gray-600 mb-4">
              Great news! Subscribe now and never run out.
            </p>
            
            {/* Subscription offer */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Percent className="w-5 h-5 text-green-600" />
                <span className="text-2xl font-bold text-green-600">15% OFF</span>
              </div>
              <p className="text-sm text-green-700">
                Auto-delivery every month. Cancel anytime.
              </p>
              
              <div className="mt-3 flex items-center justify-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-green-500" />
                Never run out
                <Check className="w-4 h-4 text-green-500" />
                Free shipping
                <Check className="w-4 h-4 text-green-500" />
                Skip anytime
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={handleSubscribe}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Star className="w-4 h-4 mr-2" />
                )}
                Subscribe & Save 15%
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
                className="border-gray-300"
              >
                Maybe Later
              </Button>
            </div>
          </div>
        );
        
      case 'not_for_me':
        return (
          <div className="text-center py-4">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <X className="w-10 h-10 text-white" />
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Got It! 👍
            </h3>
            <p className="text-gray-600 mb-4">
              Mira has noted this and won't suggest {productName} for {petName} again.
            </p>
            
            <div className="bg-purple-50 rounded-xl p-4 mb-4">
              <p className="text-sm text-purple-800">
                <Sparkles className="w-4 h-4 inline mr-1" />
                We'll find better matches for {petName}'s taste!
              </p>
            </div>
            
            <Button onClick={() => setShowModal(false)}>
              Continue Shopping
            </Button>
          </div>
        );
        
      case 'subscribed':
        return (
          <div className="text-center py-4">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 1 }}
              className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4"
            >
              <Star className="w-10 h-10 text-white fill-white" />
            </motion.div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Subscription Started! 🎉
            </h3>
            <p className="text-gray-600 mb-4">
              {petName}'s favorite {productName} will arrive monthly at 15% off.
            </p>
            
            <div className="bg-green-50 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-center gap-2 text-green-700">
                <Check className="w-5 h-5" />
                <span className="font-medium">First delivery on its way!</span>
              </div>
            </div>
            
            <Button onClick={() => setShowModal(false)}>
              Awesome! 
            </Button>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <>
      {renderTrigger()}
      
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-purple-500" />
              Taste Test
            </DialogTitle>
          </DialogHeader>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {renderModalContent()}
            </motion.div>
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TasteTestFeature;
