import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { 
  PawPrint, ArrowRight, Sparkles, Heart, Crown,
  Check, Gift, Calendar, Shield, MessageCircle,
  PartyPopper, Star
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import confetti from 'canvas-confetti';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showContent, setShowContent] = useState(false);
  
  const planType = searchParams.get('plan') || 'founder';
  const petName = searchParams.get('pet') || 'Your furry friend';
  const parentName = searchParams.get('name') || 'Pet Parent';
  const orderId = searchParams.get('order_id') || '';
  
  const isFoundation = planType === 'annual' || planType === 'foundation';
  const planName = isFoundation ? 'Pet Pass Foundation' : 'Pet Pass Trial';
  const duration = isFoundation ? '372 days' : '37 days';

  // Trigger confetti on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      // Fire confetti
      const count = 200;
      const defaults = {
        origin: { y: 0.7 },
        colors: ['#ec4899', '#a855f7', '#f59e0b', '#10b981']
      };

      function fire(particleRatio, opts) {
        confetti({
          ...defaults,
          particleCount: Math.floor(count * particleRatio),
          ...opts
        });
      }

      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
      
      setShowContent(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const benefits = [
    { icon: PawPrint, title: 'Pet Soul™ Profile', desc: 'Your pet\'s complete digital identity' },
    { icon: MessageCircle, title: 'Mira AI Concierge®', desc: 'Your 24/7 pet care companion' },
    { icon: Shield, title: 'Health Vault', desc: 'All records in one secure place' },
    { icon: Calendar, title: 'Celebration Reminders', desc: 'Never miss an important date' },
    { icon: Gift, title: 'Paw Rewards', desc: isFoundation ? 'Earn 2x points on everything' : 'Earn points on every service' },
    { icon: Star, title: 'Priority Support', desc: 'Skip the queue, get help fast' },
  ];

  return (
    <>
      <Helmet>
        <title>Welcome to The Pack! | The Doggy Company</title>
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/30 to-slate-950 py-8 px-4">
        {/* Decorative background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-fuchsia-500/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-2xl mx-auto">
          {/* Success Animation */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', duration: 0.8 }}
            className="text-center mb-8"
          >
            {/* Animated Soul Orb */}
            <div className="relative w-32 h-32 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-400 via-fuchsia-500 to-purple-600 rounded-full animate-pulse opacity-50 blur-xl"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full animate-ping opacity-30"></div>
              <div className="relative w-32 h-32 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40">
                <Check className="w-16 h-16 text-white" />
              </div>
            </div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
              transition={{ delay: 0.3 }}
              className="text-3xl md:text-4xl font-bold text-white mb-3"
            >
              Welcome to The Pack! 🎉
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: showContent ? 1 : 0 }}
              transition={{ delay: 0.5 }}
              className="text-xl text-slate-300"
            >
              {petName}&apos;s Pet Soul™ is now active
            </motion.p>
          </motion.div>

          {/* Plan Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 30 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="p-6 bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-md border border-purple-500/30 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-white text-lg">{planName}</h2>
                    <p className="text-slate-400 text-sm">{duration} of full access</p>
                  </div>
                </div>
                <div className="px-3 py-1.5 bg-emerald-500/20 rounded-full border border-emerald-500/30">
                  <p className="text-emerald-400 text-sm font-semibold">Active</p>
                </div>
              </div>
              
              {/* Benefits Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                {benefits.map((benefit, idx) => (
                  <div key={idx} className="p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                    <benefit.icon className="w-5 h-5 text-pink-400 mb-2" />
                    <p className="text-white text-sm font-medium">{benefit.title}</p>
                    <p className="text-slate-400 text-xs">{benefit.desc}</p>
                  </div>
                ))}
              </div>
              
              {orderId && (
                <p className="text-slate-500 text-xs text-center">Order ID: {orderId}</p>
              )}
            </Card>
          </motion.div>

          {/* What's Next Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 30 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="p-6 bg-slate-900/60 backdrop-blur-md border border-white/10 mb-6">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <PartyPopper className="w-5 h-5 text-amber-400" />
                What&apos;s Next?
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-3 bg-slate-800/50 rounded-xl">
                  <div className="w-8 h-8 bg-pink-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-pink-400 font-bold">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-white">Complete Pet Soul™ Profile</p>
                    <p className="text-sm text-slate-400">Add more details about {petName} - favorites, health info, personality</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-3 bg-slate-800/50 rounded-xl">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-400 font-bold">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-white">Meet Mira, Your Concierge®</p>
                    <p className="text-sm text-slate-400">Chat with our AI assistant for personalized recommendations</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-3 bg-slate-800/50 rounded-xl">
                  <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-amber-400 font-bold">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-white">Explore the 14 Pillars</p>
                    <p className="text-sm text-slate-400">Discover services across Dine, Groom, Stay, Learn, and more</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: showContent ? 1 : 0 }}
            transition={{ delay: 1 }}
            className="space-y-3"
          >
            <Button 
              onClick={() => navigate('/soul-builder')}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 py-6 text-lg rounded-xl font-semibold shadow-lg shadow-pink-500/30"
              data-testid="start-soul-profile-btn"
            >
              Start {petName || "Your Pet"}'s Soul Profile
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            
            <Button 
              onClick={() => navigate('/mira-search')}
              variant="outline"
              className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white py-6 text-lg rounded-xl"
              data-testid="chat-with-mira-btn"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Chat with Mira First
            </Button>
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: showContent ? 1 : 0 }}
            transition={{ delay: 1.2 }}
            className="text-center text-slate-500 text-sm mt-8"
          >
            A confirmation email has been sent to your registered email address.
            <br />
            Welcome to The Doggy Company family! 💜
          </motion.p>
        </div>
      </div>
    </>
  );
};

export default PaymentSuccess;
