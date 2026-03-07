/**
 * Welcome Wrapped Celebration Modal
 * Pops up after Soul Profile completion with confetti and shareable card
 */
import React, { useState, useEffect } from 'react';
import { X, Share2, MessageCircle, Mail, Download, Sparkles, Heart } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const WelcomeWrappedModal = ({ isOpen, onClose, petId, petData }) => {
  const [wrappedData, setWrappedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(true);
  const [deliveryStatus, setDeliveryStatus] = useState(null);

  useEffect(() => {
    if (isOpen && petId) {
      triggerWelcomeWrapped();
    }
  }, [isOpen, petId]);

  useEffect(() => {
    // Auto-hide confetti after 5 seconds
    if (showConfetti) {
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  const triggerWelcomeWrapped = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/wrapped/trigger-welcome/${petId}`, {
        method: 'POST'
      });
      const data = await res.json();
      setWrappedData(data);
      setDeliveryStatus(data.delivery);
    } catch (err) {
      console.error('Failed to trigger welcome wrapped:', err);
      // Use petData as fallback
      if (petData) {
        setWrappedData({
          pet_name: petData.name,
          breed: petData.breed,
          soul_score: petData.soul_score || 0,
          message: "The journey of knowing them has begun."
        });
      }
    }
    setLoading(false);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/wrapped/${petId}`;
    const shareText = `${wrappedData?.pet_name}'s Soul Score is ${wrappedData?.soul_score}%! 🐾 Create yours at thedoggycompany.com`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${wrappedData?.pet_name}'s Soul Profile`,
          text: shareText,
          url: shareUrl
        });
      } catch (err) {
        copyToClipboard(shareUrl);
      }
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const handleWhatsAppShare = () => {
    const shareUrl = `${API_URL}/api/wrapped/welcome-card/${petId}`;
    const text = `🐾 ${wrappedData?.pet_name}'s Soul Score is ${wrappedData?.soul_score}%! See their Soul Profile: ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Link copied! Share it with friends 🐾');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            >
              <span style={{ 
                fontSize: `${12 + Math.random() * 12}px`,
                color: ['#F0C060', '#C9973A', '#E8A0B0', '#7B4DB5', '#fff'][Math.floor(Math.random() * 5)]
              }}>
                {['✨', '🐾', '💜', '⭐', '🎉'][Math.floor(Math.random() * 5)]}
              </span>
            </div>
          ))}
        </div>
      )}
      
      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#1a0a2e] to-[#120826] rounded-3xl overflow-hidden shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-white/50 hover:text-white transition"
        >
          <X className="w-6 h-6" />
        </button>
        
        {loading ? (
          <div className="p-12 text-center">
            <Sparkles className="w-12 h-12 text-amber-400 mx-auto mb-4 animate-pulse" />
            <p className="text-purple-200">Creating your Pet Wrapped...</p>
          </div>
        ) : (
          <>
            {/* Card Content */}
            <div className="p-8 text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full mb-6">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 text-xs tracking-wider uppercase">Soul Profile Complete</span>
              </div>
              
              {/* Paw */}
              <div className="text-5xl mb-4">🐾</div>
              
              {/* Pet Name */}
              <h2 className="font-serif text-4xl text-amber-300 italic mb-2">
                {wrappedData?.pet_name}
              </h2>
              <p className="text-rose-300 text-sm tracking-wider uppercase mb-8">
                {wrappedData?.breed}
              </p>
              
              {/* Soul Score */}
              <div className="bg-white/5 border border-amber-500/20 rounded-2xl p-6 mb-6">
                <p className="text-purple-400 text-xs tracking-wider uppercase mb-2">Soul Score</p>
                <p className="font-serif text-6xl text-amber-400">
                  {wrappedData?.soul_score}
                  <span className="text-2xl text-amber-500">%</span>
                </p>
              </div>
              
              {/* Message */}
              <p className="font-serif text-lg text-white/70 italic mb-8">
                "{wrappedData?.message}"
              </p>
              
              {/* Delivery Status */}
              {deliveryStatus && (
                <div className="flex justify-center gap-4 mb-6 text-xs">
                  {deliveryStatus.whatsapp === 'sending' && (
                    <span className="flex items-center gap-1 text-green-400">
                      <MessageCircle className="w-3 h-3" /> WhatsApp sent
                    </span>
                  )}
                  {deliveryStatus.email === 'sending' && (
                    <span className="flex items-center gap-1 text-blue-400">
                      <Mail className="w-3 h-3" /> Email sent
                    </span>
                  )}
                </div>
              )}
              
              {/* Share Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleShare}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-amber-500 hover:bg-amber-400 text-[#120826] font-semibold rounded-xl transition"
                >
                  <Share2 className="w-5 h-5" />
                  Share {wrappedData?.pet_name}'s Soul Profile
                </button>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleWhatsAppShare}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl transition"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </button>
                  <button
                    onClick={() => window.open(`${API_URL}/api/wrapped/welcome-card/${petId}`, '_blank')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition"
                  >
                    <Download className="w-4 h-4" />
                    View Card
                  </button>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="bg-black/20 px-8 py-4 text-center">
              <p className="text-purple-400/60 text-xs">
                Every dog deserves to be truly known 💜
              </p>
            </div>
          </>
        )}
      </div>
      
      {/* Confetti Animation Styles */}
      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
      `}</style>
    </div>
  );
};

export default WelcomeWrappedModal;
