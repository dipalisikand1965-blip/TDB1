/**
 * CelebrateConcierge.jsx
 * 
 * "Want us to handle everything?"
 * The Celebrate Concierge® section
 * Gold and purple design - a door, not a product section
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';

// Service tags
const SERVICES = [
  { icon: '🎂', name: 'Custom cake design' },
  { icon: '📸', name: 'Professional photography' },
  { icon: '🎉', name: 'Venue & decoration' },
  { icon: '🐾', name: 'Guest treat bags' },
  { icon: '💌', name: 'Invitations' },
];

const CelebrateConcierge = ({ pet, onTalkToConcierge }) => {
  const petName = pet?.name || 'your pet';

  const handleTalkToConcierge = () => {
    if (onTalkToConcierge) {
      onTalkToConcierge();
    } else {
      // Fallback: open concierge modal or navigate
      window.dispatchEvent(new CustomEvent('openConcierge', { 
        detail: { context: 'celebrate', petName } 
      }));
    }
  };

  return (
    <section className="py-12 px-4" data-testid="celebrate-concierge">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl"
          style={{
            background: 'linear-gradient(135deg, #1a0a2e 0%, #1f1035 50%, #2d1b4e 100%)'
          }}
        >
          {/* Gold accent line at top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
          
          {/* Gradient overlays */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl" />
          
          <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row gap-8">
            {/* Left: Content */}
            <div className="flex-1">
              {/* Gold Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/20 backdrop-blur-sm text-amber-400 text-sm mb-4 border border-amber-500/30">
                <Crown className="w-4 h-4" />
                <span className="font-medium">Celebrate Concierge®</span>
              </div>

              {/* Headline */}
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Want us to handle everything?
              </h2>

              {/* Body Copy */}
              <p className="text-white/70 text-lg leading-relaxed mb-6">
                You tell us what {petName} deserves. We plan, source, coordinate and deliver the entire celebration — the cake, the venue, the photographer, the guest treats, the surprise moment. You just show up and love them.
              </p>

              {/* Service Tags */}
              <div className="flex flex-wrap gap-3 mb-6">
                {SERVICES.map((service, idx) => (
                  <div 
                    key={idx}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm text-white/80 text-sm border border-white/10"
                  >
                    <span>{service.icon}</span>
                    <span>{service.name}</span>
                  </div>
                ))}
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm text-white/60 text-sm border border-white/10">
                  + anything {petName} needs
                </div>
              </div>

              {/* Gold CTA Button */}
              <Button
                onClick={handleTalkToConcierge}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-6 py-3 rounded-full text-lg font-medium shadow-lg shadow-amber-500/30 border border-amber-400/50"
                data-testid="concierge-cta"
              >
                <Crown className="w-5 h-5 mr-2" />
                Talk to your Concierge
              </Button>
            </div>

            {/* Right: Stats Panel */}
            <div className="hidden md:flex flex-col items-center justify-center min-w-[200px]">
              {/* Crown Icon */}
              <motion.div
                animate={{ 
                  y: [0, -5, 0],
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-500/30 to-amber-600/20 border border-amber-500/40 flex items-center justify-center mb-4"
              >
                <Crown className="w-12 h-12 text-amber-400" />
              </motion.div>

              {/* 100% Stat */}
              <div className="text-center">
                <p className="text-4xl font-bold text-amber-400 mb-1">100%</p>
                <p className="text-white/50 text-sm mb-4">handled for you</p>
                
                {/* Divider */}
                <div className="w-16 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mx-auto mb-4" />
                
                {/* Promise Copy */}
                <div className="text-white/60 text-sm italic leading-relaxed">
                  <p>One concierge.</p>
                  <p>Every detail.</p>
                  <p>Nothing forgotten.</p>
                  <p className="text-amber-400/80 mt-2">{petName} at the centre</p>
                  <p className="text-amber-400/80">of everything.</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CelebrateConcierge;
