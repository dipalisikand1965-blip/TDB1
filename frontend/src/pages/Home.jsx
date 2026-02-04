import React, { useState, useEffect, useRef } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { 
  Brain, Sparkles, Heart, ArrowRight, PawPrint, 
  Eye, MessageCircle, Shield, Star,
  TrendingUp, Quote, ChevronRight, Check,
  Lock, Users, Award, ExternalLink, X,
  Play, ChevronDown, Volume2, VolumeX
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../utils/api';
import SEOHead from '../components/SEOHead';
import { motion, AnimatePresence } from 'framer-motion';

// Pre-computed particle positions for floating effect
const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: (i * 5) % 100,
  top: (i * 7 + 10) % 100,
  duration: 3 + (i % 3),
  delay: (i % 5) * 0.4,
}));

// Emotional hero background images - rotating gallery
const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1608908507303-ddfde7c7d79e?w=1920&h=1080&fit=crop', // Soulful westie eyes
  'https://images.unsplash.com/photo-1597854578220-07c43e51aff8?w=1920&h=1080&fit=crop', // Emotional dog portrait
  'https://images.unsplash.com/photo-1749823029909-d2be10be5620?w=1920&h=1080&fit=crop', // Woman hugging dachshund
  'https://images.unsplash.com/photo-1752387632383-4ce85c32c9cc?w=1920&h=1080&fit=crop', // Man with beagle puppy
  'https://images.unsplash.com/photo-1745236852058-1cd0e504dc27?w=1920&h=1080&fit=crop', // Sleeping golden puppy
];

// The new emotional home page - designed to capture hearts in 3 seconds

const Home = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [showVideo, setShowVideo] = useState(false);
  const [videoMuted, setVideoMuted] = useState(true);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [currentHeroImage, setCurrentHeroImage] = useState(0);
  const [soulPulse, setSoulPulse] = useState(false);
  const heroRef = useRef(null);

  // Pulse the soul orb
  useEffect(() => {
    const interval = setInterval(() => {
      setSoulPulse(prev => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Rotate hero background images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroImage(prev => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial(prev => (prev + 1) % REAL_STORIES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenMira = () => {
    window.dispatchEvent(new CustomEvent('openMiraAI'));
  };

  // If logged in, redirect to member dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-black overflow-x-hidden" data-testid="home-page">
      <SEOHead page="home" path="/" />
      
      {/* ========== THE EMOTIONAL HOOK - First 3 Seconds ========== */}
      <section 
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Rotating Photo Background - Emotional, Cinematic */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="sync">
            {HERO_IMAGES.map((img, idx) => (
              idx === currentHeroImage && (
                <motion.div
                  key={img}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5 }}
                  className="absolute inset-0"
                >
                  <img 
                    src={img} 
                    alt="Beloved pet"
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              )
            ))}
          </AnimatePresence>
          {/* Cinematic overlay - creates the emotional depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-purple-950/60 to-slate-950/90" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/50 via-transparent to-slate-950/50" />
        </div>
        
        {/* Animated Background - Deep, soulful */}
        <div className="absolute inset-0 z-[1]">
          {/* Base gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-purple-950/50 to-slate-950" />
          
          {/* Floating soul particles */}
          <div className="absolute inset-0 overflow-hidden">
            {PARTICLES.map((particle) => (
              <motion.div
                key={particle.id}
                className="absolute w-2 h-2 rounded-full bg-purple-400/30"
                style={{
                  left: `${particle.left}%`,
                  top: `${particle.top}%`,
                }}
                animate={{
                  y: [0, -30, 0],
                  opacity: [0.3, 0.8, 0.3],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: particle.duration,
                  repeat: Infinity,
                  delay: particle.delay,
                }}
              />
            ))}
          </div>
          
          {/* Large glowing orbs */}
          <motion.div 
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.div 
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 4, repeat: Infinity, delay: 1 }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          {/* The Opening Line - THE HOOK */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <p className="text-purple-300/80 text-lg sm:text-xl mb-4 tracking-wide">
              Look into their eyes. You already know.
            </p>
          </motion.div>

          {/* THE SOUL ORB - Central visual */}
          <motion.div
            className="relative w-40 h-40 sm:w-56 sm:h-56 mx-auto mb-8"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.5 }}
          >
            {/* Outer glow rings */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(168,85,247,0.4) 0%, transparent 70%)',
              }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-4 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(236,72,153,0.3) 0%, transparent 70%)',
              }}
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.4, 0.7, 0.4],
              }}
              transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
            />
            
            {/* Core orb */}
            <motion.div
              className="absolute inset-8 sm:inset-12 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 shadow-2xl"
              style={{
                boxShadow: '0 0 60px rgba(168,85,247,0.6), 0 0 100px rgba(236,72,153,0.4), inset 0 0 30px rgba(255,255,255,0.2)',
              }}
              animate={{
                scale: soulPulse ? 1.05 : 1,
              }}
              transition={{ duration: 1 }}
            >
              {/* Inner sparkle */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-8 h-8 sm:w-12 sm:h-12 text-white/80" />
              </div>
            </motion.div>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            className="text-4xl sm:text-5xl md:text-7xl font-black text-white leading-tight mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            Every Pet Has a
            <motion.span
              className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400"
              animate={{
                backgroundPosition: ['0%', '100%', '0%'],
              }}
              transition={{ duration: 5, repeat: Infinity }}
              style={{ backgroundSize: '200% auto' }}
            >
              Soul
            </motion.span>
          </motion.h1>

          {/* Emotional Subtext */}
          <motion.p
            className="text-lg sm:text-xl md:text-2xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.3 }}
          >
            We don&apos;t just manage pet services.<br className="hidden sm:block" />
            <span className="text-white/90">We nurture the soul of your companion.</span>
          </motion.p>

          {/* CTA - Single, powerful */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.6 }}
          >
            <Link to="/membership">
              <Button 
                size="lg" 
                className="group relative bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-10 py-7 text-lg rounded-full shadow-2xl shadow-purple-500/30 transition-all hover:scale-105 hover:shadow-purple-500/50"
                data-testid="hero-discover-soul-btn"
              >
                <motion.span
                  className="absolute inset-0 rounded-full bg-white/20"
                  animate={{ scale: [1, 1.05, 1], opacity: [0, 0.3, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <PawPrint className="w-5 h-5 mr-2" />
                Discover Your Pet&apos;s Soul
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            
            <button
              onClick={() => setShowVideo(true)}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors px-6 py-3"
            >
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <Play className="w-4 h-4 text-white fill-white" />
              </div>
              <span>Watch the Story</span>
            </button>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 2 }}
          >
            <ChevronDown className="w-8 h-8 text-white/30" />
          </motion.div>
        </div>
      </section>

      {/* ========== THE SOUL UNDERSTANDING ========== */}
      <section className="relative py-24 sm:py-32 bg-gradient-to-b from-slate-950 via-purple-950/30 to-slate-950">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <motion.p
              className="text-purple-400 text-sm uppercase tracking-widest mb-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              What is Pet Soul™?
            </motion.p>
            <motion.h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              A Living Memory of
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Everything They Are
              </span>
            </motion.h2>
            <motion.p
              className="text-lg text-white/60 max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Every quirk. Every fear. Every joy. We remember so you never have to explain.
            </motion.p>
          </div>

          {/* Soul Dimensions - Emotional Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {SOUL_DIMENSIONS.map((dim, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="relative overflow-hidden bg-white/5 backdrop-blur-sm border-white/10 p-6 hover:bg-white/10 transition-all group h-full">
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${dim.gradient} opacity-20 blur-2xl group-hover:opacity-30 transition-opacity`} />
                  <span className="text-3xl mb-4 block">{dim.icon}</span>
                  <h3 className="text-lg font-bold text-white mb-2">{dim.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed">{dim.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== MEET MIRA - The Guide ========== */}
      <section className="relative py-24 sm:py-32 bg-slate-950 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Mira Visual */}
            <motion.div
              className="relative order-2 lg:order-1"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="relative w-64 h-64 sm:w-80 sm:h-80 mx-auto">
                {/* Mira&apos;s orb */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600"
                  style={{
                    boxShadow: '0 0 80px rgba(168,85,247,0.5), 0 0 120px rgba(236,72,153,0.3)',
                  }}
                  animate={{
                    scale: [1, 1.03, 1],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-16 h-16 text-white/80" />
                  </div>
                </motion.div>
                
                {/* Floating text bubbles */}
                <motion.div
                  className="absolute -top-4 -right-4 bg-white rounded-2xl px-4 py-2 shadow-xl"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <p className="text-sm text-gray-800">&quot;I remember Max loves belly rubs&quot;</p>
                </motion.div>
                <motion.div
                  className="absolute -bottom-4 -left-4 bg-white rounded-2xl px-4 py-2 shadow-xl"
                  animate={{ y: [0, 5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                >
                  <p className="text-sm text-gray-800">&quot;His vet appointment is tomorrow&quot;</p>
                </motion.div>
              </div>
            </motion.div>

            {/* Mira Description */}
            <motion.div
              className="order-1 lg:order-2"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-300 rounded-full text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Meet Mira
              </div>
              
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Not a Chatbot.
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  Your Pet&apos;s Guardian Angel.
                </span>
              </h2>

              <p className="text-lg text-white/70 mb-8 leading-relaxed">
                Mira knows your pet like you do. Every allergy, every fear, every favorite spot behind the ears. 
                She doesn&apos;t just answer questions — she anticipates needs before you ask.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  { icon: Eye, title: 'She Remembers Everything', desc: 'Every interaction builds deeper understanding' },
                  { icon: Heart, title: 'She Truly Cares', desc: 'Not scripted responses — genuine guidance' },
                  { icon: Brain, title: 'She Gets Smarter', desc: 'The longer you stay, the more she knows' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{item.title}</h4>
                      <p className="text-sm text-white/60">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Button 
                onClick={handleOpenMira}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-8 py-6 text-lg rounded-full"
                data-testid="mira-section-cta"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Talk to Mira Now
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========== REAL STORIES - Trust Builder ========== */}
      <section className="relative py-24 sm:py-32 bg-gradient-to-b from-slate-950 to-purple-950/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <motion.p
              className="text-purple-400 text-sm uppercase tracking-widest mb-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              Real Stories, Real Souls
            </motion.p>
            <motion.h2
              className="text-3xl sm:text-4xl font-bold text-white mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Families Who Trusted Us With
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Their Most Precious Members
              </span>
            </motion.h2>
          </div>

          {/* Testimonial Carousel */}
          <div className="relative max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 rounded-full overflow-hidden border-4 border-purple-500/50">
                  <img 
                    src={REAL_STORIES[currentTestimonial].petImage} 
                    alt={REAL_STORIES[currentTestimonial].petName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <Quote className="w-8 h-8 text-purple-500/50 mx-auto mb-4" />
                <p className="text-xl sm:text-2xl text-white/90 mb-6 leading-relaxed italic">
                  &quot;{REAL_STORIES[currentTestimonial].quote}&quot;
                </p>
                <div>
                  <p className="text-white font-semibold">{REAL_STORIES[currentTestimonial].humanName}</p>
                  <p className="text-white/60 text-sm">Pet parent of {REAL_STORIES[currentTestimonial].petName}</p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-8">
              {REAL_STORIES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentTestimonial(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentTestimonial ? 'bg-purple-500 w-6' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========== THE PROMISE ========== */}
      <section className="relative py-24 sm:py-32 bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-8">
              Our Promise to You
            </h2>
            <p className="text-xl sm:text-2xl text-white/70 mb-12 leading-relaxed max-w-3xl mx-auto">
              The longer you stay with us, the less you&apos;ll have to explain. 
              We&apos;ll know your pet&apos;s soul — and treat them as family.
            </p>

            <div className="grid sm:grid-cols-3 gap-6 mb-12">
              {[
                { icon: Shield, title: '30-Day Guarantee', desc: 'Full refund if we don\'t earn your trust' },
                { icon: Lock, title: 'Your Data, Your Control', desc: 'We never sell or share pet data' },
                { icon: Heart, title: 'Lifetime Memory', desc: 'Your pet\'s soul lives forever with us' },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-6 bg-white/5 rounded-2xl border border-white/10"
                >
                  <item.icon className="w-8 h-8 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-white/60">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            <Link to="/membership">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-12 py-7 text-lg rounded-full shadow-2xl shadow-purple-500/30 transition-all hover:scale-105"
              >
                Begin Your Pet&apos;s Soul Journey
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ========== FOOTER CTA ========== */}
      <section className="relative py-16 bg-gradient-to-t from-purple-950/50 to-slate-950 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-white/60 mb-4">Questions? Mira is always here.</p>
          <Button 
            variant="ghost" 
            onClick={handleOpenMira}
            className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Chat with Mira
          </Button>
        </div>
      </section>

      {/* Video Modal */}
      <AnimatePresence>
        {showVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
            onClick={() => setShowVideo(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setShowVideo(false)}
                className="absolute top-4 right-4 z-10 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
              
              {/* Actual Video */}
              <video 
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted={videoMuted}
                playsInline
              >
                <source src="/videos/pet-soul-hero.mp4" type="video/mp4" />
              </video>
              
              {/* Video Controls Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">Every Pet Has a Soul</h3>
                    <p className="text-white/60 text-sm">This is how we nurture it.</p>
                  </div>
                  <button
                    onClick={() => setVideoMuted(!videoMuted)}
                    className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                  >
                    {videoMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Soul Dimensions - What we track
const SOUL_DIMENSIONS = [
  {
    icon: '❤️',
    title: 'Emotional Patterns',
    description: 'Anxiety triggers, comfort zones, and what makes their tail wag.',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    icon: '🍖',
    title: 'Dietary Soul',
    description: 'Allergies, favorites, what they pretend not to like but secretly love.',
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    icon: '🏥',
    title: 'Health History',
    description: 'Vaccinations, conditions, preferred vets, and emergency contacts.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: '✈️',
    title: 'Travel Readiness',
    description: 'Carrier comfort, motion sickness, and documentation always ready.',
    gradient: 'from-indigo-500 to-purple-500',
  },
  {
    icon: '🎓',
    title: 'Learning Style',
    description: 'Training progress, commands mastered, and behavioral growth.',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    icon: '🎂',
    title: 'Life Milestones',
    description: 'Birthdays, gotcha days, achievements — we celebrate them all.',
    gradient: 'from-purple-500 to-pink-500',
  },
];

// Real Stories - Trust through real families
const REAL_STORIES = [
  {
    quote: "They remembered Bruno's fear of thunderstorms before I even mentioned it. For the first time, I felt like someone truly understood my dog.",
    humanName: "Priya Sharma",
    petName: "Bruno",
    petImage: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop",
  },
  {
    quote: "When Max got sick at 2am, Mira already had his full health history ready for the emergency vet. That's when I knew this was different.",
    humanName: "Rahul Mehta",
    petName: "Max",
    petImage: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=200&h=200&fit=crop",
  },
  {
    quote: "They sent Luna a birthday cake without me even asking. It's the small things that show they actually care about our pets as family.",
    humanName: "Anita Kapoor",
    petName: "Luna",
    petImage: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=200&h=200&fit=crop",
  },
];

export default Home;
