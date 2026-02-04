import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { 
  Brain, Sparkles, Heart, ArrowRight, PawPrint, 
  Eye, MessageCircle, Shield, Star,
  TrendingUp, Quote, ChevronRight, Check,
  Lock, Users, Award, ExternalLink, X,
  Play, ChevronDown, Volume2, VolumeX, SkipForward,
  Crown, Zap, Clock, Gift, Video, PlayCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../utils/api';
import SEOHead from '../components/SEOHead';
import { motion, AnimatePresence } from 'framer-motion';

// ============ LIVING SOUL ORB COMPONENT ============
// This is the heart of the experience - a BREATHING, LIVING visualization
const LivingSoulOrb = ({ size = 'lg', className = '', interactive = true }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [pulseIntensity, setPulseIntensity] = useState(1);
  
  // Simulate "breathing" with varying intensity
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseIntensity(0.8 + Math.random() * 0.4);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-32 h-32 sm:w-40 sm:h-40',
    lg: 'w-40 h-40 sm:w-56 sm:h-56',
    xl: 'w-56 h-56 sm:w-72 sm:h-72'
  };

  return (
    <div 
      className={`relative ${sizeClasses[size]} ${className}`}
      onMouseEnter={() => interactive && setIsHovered(true)}
      onMouseLeave={() => interactive && setIsHovered(false)}
    >
      {/* Aurora outer rings - the "aura" */}
      <motion.div
        className="absolute inset-[-20%] rounded-full"
        style={{
          background: 'conic-gradient(from 0deg, rgba(168,85,247,0.3), rgba(236,72,153,0.3), rgba(99,102,241,0.3), rgba(168,85,247,0.3))',
          filter: 'blur(40px)',
        }}
        animate={{
          rotate: 360,
          scale: [1, 1.1 * pulseIntensity, 1],
        }}
        transition={{
          rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
          scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' }
        }}
      />
      
      {/* Secondary aurora ring */}
      <motion.div
        className="absolute inset-[-10%] rounded-full"
        style={{
          background: 'conic-gradient(from 180deg, rgba(236,72,153,0.4), rgba(168,85,247,0.4), rgba(59,130,246,0.4), rgba(236,72,153,0.4))',
          filter: 'blur(30px)',
        }}
        animate={{
          rotate: -360,
          scale: [1.1, 1, 1.1],
        }}
        transition={{
          rotate: { duration: 15, repeat: Infinity, ease: 'linear' },
          scale: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
        }}
      />

      {/* Breathing glow pulse */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/40 via-pink-500/30 to-indigo-500/40"
        animate={{
          scale: [1, 1.2 * pulseIntensity, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{ filter: 'blur(20px)' }}
      />

      {/* Core orb with glass effect */}
      <motion.div
        className="absolute inset-[15%] rounded-full overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(168,85,247,0.9) 0%, rgba(236,72,153,0.9) 50%, rgba(99,102,241,0.9) 100%)',
          boxShadow: `
            0 0 60px rgba(168,85,247,0.6),
            0 0 100px rgba(236,72,153,0.4),
            0 0 140px rgba(99,102,241,0.3),
            inset 0 0 60px rgba(255,255,255,0.1)
          `,
        }}
        animate={{
          scale: isHovered ? 1.1 : [1, 1.03 * pulseIntensity, 1],
        }}
        transition={{ duration: isHovered ? 0.3 : 2, repeat: isHovered ? 0 : Infinity }}
      >
        {/* Inner light refraction */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 50%)',
          }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        {/* Sparkle icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <Sparkles className="w-1/3 h-1/3 text-white/90 drop-shadow-lg" />
          </motion.div>
        </div>
      </motion.div>

      {/* Orbiting particles */}
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-white/80"
          style={{
            top: '50%',
            left: '50%',
            boxShadow: '0 0 10px rgba(255,255,255,0.8)',
          }}
          animate={{
            x: [
              Math.cos((i * 72 * Math.PI) / 180) * 60,
              Math.cos(((i * 72 + 180) * Math.PI) / 180) * 60,
              Math.cos((i * 72 * Math.PI) / 180) * 60,
            ],
            y: [
              Math.sin((i * 72 * Math.PI) / 180) * 60,
              Math.sin(((i * 72 + 180) * Math.PI) / 180) * 60,
              Math.sin((i * 72 * Math.PI) / 180) * 60,
            ],
            opacity: [0.3, 0.8, 0.3],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 6 + i,
            repeat: Infinity,
            delay: i * 0.5,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

// Brand Story Video Clips - BRIGHT versions with narrative text
const BRAND_STORY_CLIPS = [
  {
    src: '/videos/brand_story/01_eyes_bright.mp4',
    title: 'Look into their eyes...',
    subtitle: 'You already know.',
    duration: 4000
  },
  {
    src: '/videos/brand_story/02_bond_bright.mp4',
    title: "They're not just pets.",
    subtitle: "They're family.",
    duration: 4000
  },
  {
    src: '/videos/brand_story/03_joy_bright.mp4',
    title: 'Every tail wag, every happy moment...',
    subtitle: 'We help you cherish them all.',
    duration: 4000
  },
  {
    src: '/videos/brand_story/04_family_bright.mp4',
    title: 'The Doggy Company',
    subtitle: 'Every Pet Has a Soul™',
    duration: 4000
  }
];

// Brand Story Modal Component - Mobile Optimized
const BrandStoryModal = ({ onClose, videoMuted, setVideoMuted }) => {
  const [currentClip, setCurrentClip] = useState(0);
  const [isEnding, setIsEnding] = useState(false);
  const videoRef = useRef(null);
  
  // Auto-advance to next clip with smooth ending
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentClip < BRAND_STORY_CLIPS.length - 1) {
        setCurrentClip(prev => prev + 1);
      } else {
        // Show ending screen before looping
        setIsEnding(true);
        setTimeout(() => {
          setIsEnding(false);
          setCurrentClip(0);
        }, 2500);
      }
    }, BRAND_STORY_CLIPS[currentClip].duration);
    
    return () => clearTimeout(timer);
  }, [currentClip]);
  
  // Play video when clip changes
  useEffect(() => {
    if (videoRef.current && !isEnding) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [currentClip, isEnding]);
  
  const clip = BRAND_STORY_CLIPS[currentClip];
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black"
      style={{ 
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)'
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.98, opacity: 0 }}
        className="relative w-full h-full"
        onClick={e => e.stopPropagation()}
      >
        {/* Ending Screen */}
        <AnimatePresence>
          {isEnding && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 bg-slate-950 flex flex-col items-center justify-center"
            >
              {/* Soul Orb */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="relative mb-8"
              >
                <div className="absolute inset-0 w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-60" />
                <div className="relative w-24 h-24 bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-3xl sm:text-4xl font-bold text-white text-center mb-3"
              >
                Every Pet Has a Soul
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-white/60 text-lg"
              >
                The Doggy Company
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Video - Full screen, optimized for iOS/Android */}
        {!isEnding && (
          <video 
            ref={videoRef}
            className="absolute inset-0 w-full h-full"
            autoPlay
            muted={videoMuted}
            playsInline
            style={{
              objectFit: 'contain',
              objectPosition: 'center center',
              backgroundColor: '#000',
              WebkitTransform: 'translateZ(0)',
              transform: 'translateZ(0)'
            }}
          >
            <source src={clip.src} type="video/mp4" />
          </video>
        )}
        
        {/* Cinematic Overlays - Lighter gradient to show video */}
        {!isEnding && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent pointer-events-none h-32" />
          </>
        )}
        
        {/* Close Button - Safe area */}
        <button
          onClick={onClose}
          className="absolute top-4 sm:top-6 right-4 sm:right-6 z-40 p-2 sm:p-3 bg-black/40 rounded-full hover:bg-black/60 transition-colors backdrop-blur-sm"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </button>
        
        {/* Brand Logo - Top */}
        {!isEnding && (
          <div className="absolute top-4 sm:top-6 left-4 sm:left-6 z-30">
            <p className="text-purple-400 text-xs sm:text-sm uppercase tracking-widest">The Doggy Company</p>
          </div>
        )}
        
        {/* Story Text - BOTTOM positioned, higher to avoid mobile nav */}
        {!isEnding && (
          <div className="absolute bottom-32 sm:bottom-36 md:bottom-28 left-0 right-0 z-20 pointer-events-none">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentClip}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6 }}
                className="text-center px-6 sm:px-8"
              >
                <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2 sm:mb-4 drop-shadow-2xl leading-tight">
                  {clip.title}
                </h2>
                <p className="text-base sm:text-xl md:text-2xl text-white/90 drop-shadow-lg">
                  {clip.subtitle}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        )}
        
        {/* Progress Bar & Controls - Bottom, higher on mobile */}
        {!isEnding && (
          <div className="absolute bottom-20 sm:bottom-8 left-4 right-4 sm:left-6 sm:right-6 z-30">
            <div className="flex items-center justify-between">
              {/* Progress Dots */}
              <div className="flex gap-2 sm:gap-3">
                {BRAND_STORY_CLIPS.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentClip(idx)}
                    className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                      idx === currentClip 
                        ? 'bg-white w-6 sm:w-8' 
                        : 'bg-white/40 hover:bg-white/60 w-1.5 sm:w-2'
                    }`}
                  />
                ))}
              </div>
              
              {/* Controls */}
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() => setCurrentClip(prev => (prev + 1) % BRAND_STORY_CLIPS.length)}
                  className="p-2 sm:p-3 bg-black/40 rounded-full hover:bg-black/60 transition-colors backdrop-blur-sm"
                  title="Next clip"
                >
                  <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </button>
                <button
                  onClick={() => setVideoMuted(!videoMuted)}
                  className="p-2 sm:p-3 bg-black/40 rounded-full hover:bg-black/60 transition-colors backdrop-blur-sm"
                >
                  {videoMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-white" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

// Pre-computed particle positions for floating effect
const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: (i * 5) % 100,
  top: (i * 7 + 10) % 100,
  duration: 3 + (i % 3),
  delay: (i % 5) * 0.4,
}));

// Video Testimonials Data - Real Indian families with video stories
// Dogs in thumbnail MATCH dogs in video (golden retriever, beagle, labrador)
// Indian accent voiceovers synced to video length
const VIDEO_TESTIMONIALS = [
  {
    id: 1,
    name: "Priya & Bruno",
    pet: "Bruno",
    // Golden retriever face close-up - matches video
    thumbnail: "https://images.unsplash.com/photo-1743997182218-30d0e9c3b0f1?w=400&h=300&fit=crop",
    videoSrc: "/videos/testimonials/sharma_testimonial.mp4",
    quote: "They remembered Bruno's fear of thunderstorms... before I even told them.",
    duration: "0:05",
    hasVideo: true,
  },
  {
    id: 2,
    name: "Rahul & Max",
    pet: "Max",
    // Beagle thumbnail - matches video
    thumbnail: "https://images.unsplash.com/photo-1657162801081-acfdd45242ce?w=400&h=300&fit=crop",
    videoSrc: "/videos/testimonials/rahul_testimonial.mp4",
    quote: "Max's favorite treats, his walking route... Mira remembers everything.",
    duration: "0:06",
    hasVideo: true,
  },
  {
    id: 3,
    name: "The Kapoor Family",
    pet: "Luna",
    // Labrador thumbnail - matches video
    thumbnail: "https://images.unsplash.com/photo-1610112747663-45172b603dde?w=400&h=300&fit=crop",
    videoSrc: "/videos/testimonials/kapoor_testimonial.mp4",
    quote: "Luna's birthday cake arrived... without me even asking! They truly care.",
    duration: "0:05",
    hasVideo: true,
  },
];

// Real Membership Tiers from thedoggycompany.in/membership
const MEMBERSHIP_TIERS = [
  {
    name: "Explorer",
    price: "Free",
    period: "for 7 days",
    description: "Discover the Pet Soul™ experience",
    features: [
      "Basic Pet Profile",
      "Limited Mira AI Access",
      "Browse 14 Life Pillars",
      "Community Access",
    ],
    notIncluded: [
      "Full Pet Soul™ Profile",
      "Unlimited Mira AI",
      "Health Vault & Records",
      "Priority Support",
    ],
    cta: "Start 7-Day Free Trial",
    ctaLink: "https://thedoggycompany.in/pet-soul-onboard",
    highlighted: false,
  },
  {
    name: "Pet Pass Trial",
    price: "₹499",
    period: "/month",
    description: "Introduction to the concierge experience",
    features: [
      "Full Pet Soul™ Profile",
      "Unlimited Mira AI Concierge",
      "All 14 Life Pillars Unlocked",
      "Health Vault & Records",
      "Priority Concierge Support",
      "Paw Rewards Points",
    ],
    notIncluded: [],
    cta: "Start Trial",
    ctaLink: "https://thedoggycompany.in/membership",
    highlighted: false,
    badge: "Try First",
  },
  {
    name: "Pet Pass Foundation",
    price: "₹4,999",
    period: "/year",
    description: "Full concierge relationship",
    features: [
      "Full Pet Soul™ Profile",
      "Unlimited Mira AI Concierge",
      "All 14 Life Pillars Unlocked",
      "Health Vault & Records",
      "Priority Concierge Support",
      "Double Paw Points (2x)",
      "Birthday Surprise Gift",
      "Early Access to New Features",
    ],
    notIncluded: [],
    cta: "Activate Pet Pass",
    ctaLink: "https://thedoggycompany.in/membership",
    highlighted: true,
    badge: "Best Value",
    savings: "Save ₹989/year",
  },
];

// The 14 Life Pillars - Emotional Journey (We celebrate through ALL of life)
const LIFE_PILLARS = [
  { name: "Celebrate", icon: "🎂", desc: "Every moment deserves joy", emotion: "The spark of pure happiness" },
  { name: "Dine", icon: "🍽️", desc: "Breaking bread together", emotion: "Shared meals, deeper bonds" },
  { name: "Stay", icon: "🏨", desc: "Home away from home", emotion: "Comfort in new places" },
  { name: "Travel", icon: "✈️", desc: "Adventures await", emotion: "Exploring the world together" },
  { name: "Care", icon: "🛁", desc: "Tender loving care", emotion: "The language of touch" },
  { name: "Learn", icon: "🎓", desc: "Growing together", emotion: "Every lesson strengthens the bond" },
  { name: "Fit", icon: "🏃", desc: "Thriving in motion", emotion: "Joy in every stride" },
  { name: "Enjoy", icon: "🎾", desc: "Play is sacred", emotion: "Unfiltered happiness" },
  { name: "Shop", icon: "🛒", desc: "Thoughtful choices", emotion: "Love expressed through care" },
  { name: "Advisory", icon: "💡", desc: "Wisdom when needed", emotion: "Guidance with heart" },
  { name: "Paperwork", icon: "📋", desc: "Life documented", emotion: "Their story, preserved" },
  { name: "Emergency", icon: "🚨", desc: "Always protected", emotion: "Peace in uncertainty" },
  { name: "Farewell", icon: "🌈", desc: "Celebrating a life lived", emotion: "Love never ends" },
  { name: "Adopt", icon: "🐕", desc: "A new beginning", emotion: "Two souls finding each other" },
];

// Fallback images in case API fails
const FALLBACK_HERO_IMAGES = [
  'https://customer-assets.emergentagent.com/job_pet-soul-platform/artifacts/0iy6sezo_shutterstock_504980047%20%282%29.jpg',
  'https://customer-assets.emergentagent.com/job_pet-soul-platform/artifacts/phjxi6rd_dog-1194087_1920%20%281%29.jpg',
];

const FALLBACK_BOND_GALLERY = [
  { image_url: 'https://customer-assets.emergentagent.com/job_pet-soul-platform/artifacts/0iy6sezo_shutterstock_504980047%20%282%29.jpg', caption: 'Unconditional love', is_tall: false, is_wide: false },
  { image_url: 'https://customer-assets.emergentagent.com/job_pet-soul-platform/artifacts/7oe8caws_shutterstock_1293337687%20%282%29.jpg', caption: 'Pure joy', is_tall: false, is_wide: false },
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
  const [playingTestimonial, setPlayingTestimonial] = useState(null);
  const heroRef = useRef(null);
  
  // CMS-driven content
  const [heroImages, setHeroImages] = useState(FALLBACK_HERO_IMAGES);
  const [bondGallery, setBondGallery] = useState(FALLBACK_BOND_GALLERY);
  const [pageContent, setPageContent] = useState({
    headline: 'Every Pet Has a Soul',
    subheadline: "We don't just manage pet services. We nurture the soul of your companion.",
    cta_text: "Discover Your Pet's Soul"
  });

  // Fetch landing page content from CMS
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(`${getApiUrl()}/api/landing-page/content`);
        if (response.ok) {
          const data = await response.json();
          if (data.hero_images?.length > 0) {
            setHeroImages(data.hero_images.map(img => img.image_url));
          }
          if (data.bond_gallery?.length > 0) {
            setBondGallery(data.bond_gallery);
          }
          setPageContent({
            headline: data.headline || 'Every Pet Has a Soul',
            subheadline: data.subheadline || "We don't just manage pet services. We nurture the soul of your companion.",
            cta_text: data.cta_text || "Discover Your Pet's Soul"
          });
        }
      } catch (error) {
        console.debug('Using fallback landing page content');
      }
    };
    fetchContent();
  }, []);

  // Pulse the soul orb
  useEffect(() => {
    const interval = setInterval(() => {
      setSoulPulse(prev => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Rotate hero background images
  useEffect(() => {
    if (heroImages.length > 0) {
      const interval = setInterval(() => {
        setCurrentHeroImage(prev => (prev + 1) % heroImages.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [heroImages.length]);

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
        {/* AUTO-PLAYING VIDEO BACKGROUND - The emotional hook */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            poster={heroImages[0]}
          >
            <source src="/videos/brand_story/01_eyes_bright.mp4" type="video/mp4" />
          </video>
          {/* Fallback to rotating images if video fails */}
          <AnimatePresence mode="sync">
            {heroImages.map((img, idx) => (
              idx === currentHeroImage && (
                <motion.div
                  key={img}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5 }}
                  className="absolute inset-0 z-[-1]"
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
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-purple-950/70 to-slate-950/95" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/60 via-transparent to-slate-950/60" />
        </div>
        
        {/* Animated Background - Deep, soulful */}
        <div className="absolute inset-0 z-[1] pointer-events-none">
          {/* Floating soul particles */}
          <div className="absolute inset-0 overflow-hidden">
            {PARTICLES.map((particle) => (
              <motion.div
                key={particle.id}
                className="absolute w-2 h-2 rounded-full bg-purple-400/40"
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
            <p className="text-purple-300/90 text-lg sm:text-xl md:text-2xl mb-6 tracking-wide font-light">
              Look into their eyes. You already know.
            </p>
          </motion.div>

          {/* THE LIVING SOUL ORB - Now it BREATHES */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.5 }}
            className="mb-8"
          >
            <LivingSoulOrb size="lg" className="mx-auto" />
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
            className="text-lg sm:text-xl md:text-2xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.3 }}
          >
            We don&apos;t just manage pet services.<br className="hidden sm:block" />
            <span className="text-white/90 font-medium">We nurture the soul of your companion.</span>
          </motion.p>

          {/* CTA - Single, powerful */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.6 }}
          >
            <a href="https://thedoggycompany.in/pet-soul-onboard" target="_blank" rel="noopener noreferrer">
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
            </a>
            
            {/* Stunning Video Play Button */}
            <motion.button
              onClick={() => setShowVideo(true)}
              className="group flex items-center gap-4 px-6 py-3"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Animated Play Button with Glow */}
              <div className="relative">
                {/* Pulsing glow ring */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 blur-md"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                {/* Play button circle */}
                <div className="relative w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-shadow">
                  <Play className="w-6 h-6 text-white fill-white ml-1" />
                </div>
              </div>
              <div className="text-left">
                <span className="block text-white font-semibold group-hover:text-purple-200 transition-colors">Watch Our Story</span>
                <span className="block text-white/50 text-sm">See the magic unfold</span>
              </div>
            </motion.button>
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

      {/* ========== 14 LIFE PILLARS - The Pet Operating System ========== */}
      <section className="relative py-20 sm:py-28 bg-gradient-to-b from-slate-950 to-purple-950/20 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-slate-950 to-transparent" />
        
        {/* Animated connection lines in background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Flowing energy lines */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={`line-${i}`}
              className="absolute h-[2px] bg-gradient-to-r from-transparent via-purple-500/40 to-transparent"
              style={{
                top: `${20 + i * 15}%`,
                left: '-10%',
                width: '120%',
              }}
              animate={{
                x: ['-100%', '100%'],
                opacity: [0, 0.6, 0],
              }}
              transition={{
                duration: 8 + i * 2,
                repeat: Infinity,
                delay: i * 1.5,
                ease: 'linear',
              }}
            />
          ))}
          
          {/* Floating orbs connecting pillars */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={`orb-${i}`}
              className="absolute w-3 h-3 rounded-full bg-gradient-to-r from-purple-400 to-pink-400"
              style={{
                left: `${10 + (i * 12)}%`,
                top: '50%',
                boxShadow: '0 0 20px rgba(168,85,247,0.6)',
              }}
              animate={{
                y: [0, -100, 100, 0],
                x: [0, 50, -50, 0],
                opacity: [0.3, 0.8, 0.8, 0.3],
                scale: [0.5, 1.2, 1.2, 0.5],
              }}
              transition={{
                duration: 10 + i,
                repeat: Infinity,
                delay: i * 0.8,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
        
        <div className="relative max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-300 rounded-full text-sm font-medium mb-6"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <Heart className="w-4 h-4" />
              The Pet Operating System
            </motion.div>
            <motion.h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              We Don&apos;t Manage Services.
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                We Celebrate Life.
              </span>
            </motion.h2>
            <motion.p
              className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              Through every moment — the joyful, the challenging, even the final — 
              we see <span className="text-purple-300">celebration</span>. Because every day with them is a gift.
            </motion.p>
          </div>

          {/* Animated Pillars with Connection Effect */}
          <div className="relative">
            {/* Central Soul Orb */}
            <motion.div 
              className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0"
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-600/30 to-pink-600/30 blur-2xl" />
            </motion.div>
            
            {/* Pillars in circular/flowing layout on desktop, grid on mobile */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 sm:gap-4 relative z-10">
              {LIFE_PILLARS.map((pillar, idx) => (
                <motion.div
                  key={pillar.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ 
                    delay: idx * 0.08,
                    type: 'spring',
                    stiffness: 200,
                  }}
                  className="group"
                >
                  <motion.div 
                    className="relative p-4 sm:p-5 bg-white/5 rounded-2xl border border-white/10 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all duration-500 text-center h-full"
                    whileHover={{ 
                      scale: 1.08,
                      boxShadow: '0 0 30px rgba(168,85,247,0.4)',
                    }}
                  >
                    {/* Glow effect on hover */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/0 via-purple-500/20 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    />
                    
                    {/* Connection dot */}
                    <motion.div
                      className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-purple-400 opacity-0 group-hover:opacity-100"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                    
                    {/* Icon with bounce */}
                    <motion.span 
                      className="text-3xl sm:text-4xl mb-3 block"
                      whileHover={{ 
                        y: [-5, 0],
                        transition: { duration: 0.3 }
                      }}
                    >
                      {pillar.icon}
                    </motion.span>
                    
                    {/* Name */}
                    <h4 className="text-white font-bold text-sm mb-1 relative z-10">{pillar.name}</h4>
                    
                    {/* Emotion (shows on hover) */}
                    <motion.p 
                      className="text-purple-300/90 text-xs leading-snug hidden sm:block relative z-10"
                      initial={{ opacity: 0, y: 5 }}
                      whileHover={{ opacity: 1, y: 0 }}
                    >
                      {pillar.emotion}
                    </motion.p>
                    
                    {/* Description (mobile) */}
                    <p className="text-white/50 text-xs leading-snug sm:hidden relative z-10">
                      {pillar.desc}
                    </p>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Connection message */}
          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-purple-300/70 text-sm mb-2">
              ✨ All pillars are connected through Pet Soul™
            </p>
            <p className="text-white/50 text-sm italic">
              &quot;Even in farewell, we celebrate. Because love never ends.&quot;
            </p>
          </motion.div>

          {/* CTA */}
          <motion.div 
            className="text-center mt-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <a href="https://thedoggycompany.in/membership" target="_blank" rel="noopener noreferrer">
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-8 py-6 rounded-full text-lg">
                Begin Your Journey
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
          </motion.div>
        </div>
      </section>

      {/* ========== THE BOND - Magical Mobile-First Gallery ========== */}
      <section className="relative py-16 sm:py-24 lg:py-32 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-1/3 left-1/4 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-pink-600/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-6xl mx-auto px-4">
          {/* Section Header - Compact on mobile */}
          <div className="text-center mb-10 sm:mb-16">
            <motion.p
              className="text-purple-400/80 text-xs sm:text-sm uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-3 sm:mb-6"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              The Unbreakable Bond
            </motion.p>
            <motion.h2
              className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 sm:mb-6 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              More Than Pets.
              <span className="block mt-1 sm:mt-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-purple-300">
                They&apos;re Family.
              </span>
            </motion.h2>
            <motion.p
              className="text-white/50 text-sm sm:text-lg max-w-xl mx-auto hidden sm:block"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Every wet nose, every wagging tail, every quiet moment together — 
              these are the moments we help you cherish forever.
            </motion.p>
          </div>

          {/* MOBILE: Horizontal Scroll Gallery */}
          <div className="lg:hidden">
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
              {bondGallery.slice(0, 6).map((item, idx) => (
                <motion.div
                  key={item.id || idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="relative flex-shrink-0 snap-center"
                >
                  {/* Glow */}
                  <div className={`absolute inset-0 rounded-2xl blur-xl ${
                    idx % 3 === 0 ? 'bg-purple-500/20' : idx % 3 === 1 ? 'bg-pink-500/20' : 'bg-indigo-500/20'
                  }`} />
                  
                  <div className="relative w-44 h-56 rounded-2xl overflow-hidden border border-white/10 shadow-xl">
                    <img 
                      src={item.image_url} 
                      alt={item.caption}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white font-medium text-sm">{item.caption}</p>
                      <div className="w-8 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 mt-1.5" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            {/* Scroll hint */}
            <p className="text-center text-white/30 text-xs mt-2">← Swipe to explore →</p>
          </div>

          {/* DESKTOP: Elegant Floating Gallery - 3 Featured Pets */}
          <div className="hidden lg:flex relative items-center justify-center gap-12">
            {bondGallery.slice(0, 3).map((item, idx) => (
              <motion.div
                key={item.id || idx}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15, duration: 0.6 }}
                className={`relative group ${idx === 1 ? '-mt-12 z-10' : 'z-0'}`}
              >
                {/* Glow behind image */}
                <div className={`absolute inset-0 rounded-3xl blur-2xl transition-all duration-500 group-hover:blur-3xl ${
                  idx === 0 ? 'bg-purple-500/20' : idx === 1 ? 'bg-pink-500/25' : 'bg-indigo-500/20'
                } group-hover:scale-110`} />
                
                {/* Image container */}
                <div className={`relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:border-white/20 ${
                  idx === 1 ? 'w-80 h-96' : 'w-64 h-80'
                }`}>
                  <img 
                    src={item.image_url} 
                    alt={item.caption}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <p className="text-white font-medium text-lg">{item.caption}</p>
                    <div className="w-12 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 mt-2 group-hover:w-20 transition-all duration-500" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* DESKTOP: Secondary row - smaller floating portraits */}
          {bondGallery.length > 3 && (
            <div className="hidden lg:flex flex-wrap justify-center gap-6 mt-12">
              {bondGallery.slice(3, 7).map((item, idx) => (
                <motion.div
                  key={item.id || idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 rounded-2xl bg-purple-500/20 blur-xl group-hover:bg-purple-500/30 transition-all duration-500" />
                  <div className="relative w-44 h-44 rounded-2xl overflow-hidden border border-white/10 shadow-xl group-hover:border-white/20 transition-all duration-300 group-hover:scale-105 bg-slate-950">
                    {/* Image */}
                    <img 
                      src={item.image_url} 
                      alt={item.caption}
                      className="w-full h-full object-cover"
                    />
                    {/* Dark vignette overlay to blend white backgrounds elegantly */}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-950/60 via-transparent to-slate-950/60" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-slate-950/40" />
                    {/* Subtle purple tint */}
                    <div className="absolute inset-0 bg-purple-900/20 mix-blend-overlay" />
                    <p className="absolute bottom-2 left-2 right-2 text-white text-xs font-medium truncate">
                      {item.caption}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ========== MEET MIRA - The Memory & Judgement Layer ========== */}
      <section className="relative py-24 sm:py-32 bg-slate-950 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Mira Visual - Using Living Soul Orb */}
            <motion.div
              className="relative order-2 lg:order-1"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="relative mx-auto">
                <LivingSoulOrb size="xl" className="mx-auto" />
                
                {/* Floating text bubbles - Interpretations, not transactions */}
                <motion.div
                  className="absolute -top-4 -right-4 bg-white rounded-2xl px-4 py-2 shadow-xl"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <p className="text-sm text-gray-800">&quot;Bruno seems anxious today...&quot;</p>
                </motion.div>
                <motion.div
                  className="absolute -bottom-4 -left-4 bg-white rounded-2xl px-4 py-2 shadow-xl"
                  animate={{ y: [0, 5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                >
                  <p className="text-sm text-gray-800">&quot;Perhaps extra cuddles tonight?&quot;</p>
                </motion.div>
              </div>
            </motion.div>

            {/* Mira Description - New positioning */}
            <motion.div
              className="order-1 lg:order-2"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-300 rounded-full text-sm font-medium mb-6">
                <Brain className="w-4 h-4" />
                Meet Mira
              </div>
              
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                She Doesn&apos;t Fulfil Requests.
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  She Interprets Lives.
                </span>
              </h2>

              <p className="text-lg text-white/70 mb-4 leading-relaxed">
                Mira is the memory and judgement layer that turns infrastructure into relationship.
              </p>
              
              <p className="text-base text-white/50 mb-8 leading-relaxed italic border-l-2 border-purple-500/50 pl-4">
                Mira is the brain. Concierge is the hand.<br />
                One understands life. The other moves the world.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  { icon: Eye, title: 'She Sees Beyond Words', desc: 'Patterns, emotions, unspoken needs' },
                  { icon: Heart, title: 'She Builds Relationships', desc: 'Not transactions — connections that deepen' },
                  { icon: Brain, title: 'She Remembers Everything', desc: 'Every moment becomes part of the story' },
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
                Experience Mira
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========== VIDEO TESTIMONIALS - Real Families, Real Stories ========== */}
      <section className="relative py-24 sm:py-32 bg-gradient-to-b from-slate-950 to-purple-950/30 overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-300 rounded-full text-sm font-medium mb-6"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <Video className="w-4 h-4" />
              Real Stories, Real Tears
            </motion.div>
            <motion.h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Families Who Trusted Us With
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Their Most Precious Members
              </span>
            </motion.h2>
            <motion.p
              className="text-lg text-white/60 max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              Watch their stories. Feel their joy. Understand why they chose us.
            </motion.p>
          </div>

          {/* Video Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {VIDEO_TESTIMONIALS.map((testimonial, idx) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group relative"
              >
                {/* Video card */}
                <div 
                  className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm hover:border-purple-500/50 transition-all duration-300 cursor-pointer"
                  onClick={() => setPlayingTestimonial(playingTestimonial === testimonial.id ? null : testimonial.id)}
                >
                  {/* Video/Thumbnail */}
                  <div className="relative aspect-video overflow-hidden">
                    {playingTestimonial === testimonial.id && testimonial.hasVideo ? (
                      <video
                        autoPlay
                        loop
                        muted={false}
                        playsInline
                        className="w-full h-full object-cover"
                      >
                        <source src={testimonial.videoSrc} type="video/mp4" />
                      </video>
                    ) : (
                      <>
                        <img 
                          src={testimonial.thumbnail} 
                          alt={testimonial.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                        
                        {/* Play button overlay */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <motion.div
                            className="relative"
                            whileHover={{ scale: 1.1 }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-md opacity-50" />
                            <div className="relative w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-xl">
                              <Play className="w-8 h-8 text-white fill-white ml-1" />
                            </div>
                          </motion.div>
                        </div>
                      </>
                    )}
                    
                    {/* Duration badge */}
                    <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 rounded text-xs text-white font-medium">
                      {playingTestimonial === testimonial.id ? 'Playing' : testimonial.duration}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-5">
                    <h3 className="text-white font-semibold mb-2">{testimonial.name}</h3>
                    <p className="text-white/60 text-sm italic line-clamp-2">&quot;{testimonial.quote}&quot;</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Text Testimonial Carousel (below video) */}
          <div className="relative max-w-3xl mx-auto mt-16 pt-16 border-t border-white/10">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <Quote className="w-10 h-10 text-purple-500/30 mx-auto mb-6" />
                <p className="text-xl sm:text-2xl text-white/90 mb-6 leading-relaxed italic">
                  &quot;{REAL_STORIES[currentTestimonial].quote}&quot;
                </p>
                <div className="flex items-center justify-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-500/50">
                    <img 
                      src={REAL_STORIES[currentTestimonial].petImage} 
                      alt={REAL_STORIES[currentTestimonial].petName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-semibold">{REAL_STORIES[currentTestimonial].humanName}</p>
                    <p className="text-white/60 text-sm">Pet parent of {REAL_STORIES[currentTestimonial].petName}</p>
                  </div>
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
                    idx === currentTestimonial ? 'bg-purple-500 w-6' : 'bg-white/30 hover:bg-white/50'
                  }`}
                  data-testid={`testimonial-dot-${idx}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========== MEMBERSHIP TIERS - Real Pet Pass Pricing ========== */}
      <section className="relative py-24 sm:py-32 bg-slate-950 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/5 rounded-full blur-3xl" />
        
        <div className="relative max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 rounded-full text-sm font-medium mb-6"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <Crown className="w-4 h-4" />
              Pet Pass — Personal Concierge®
            </motion.div>
            <motion.h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              A Personal Concierge
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                For Your Dog
              </span>
            </motion.h2>
            <motion.p
              className="text-lg text-white/60 max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              Pet Pass creates a living concierge relationship — beginning with understanding your dog, sustained through memory, care, and continuity.
            </motion.p>
          </div>

          {/* Membership Cards */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {MEMBERSHIP_TIERS.map((tier, idx) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`relative ${tier.highlighted ? 'md:-mt-4 md:mb-4' : ''}`}
              >
                {/* Highlighted badge */}
                {tier.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <div className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-sm font-semibold text-white shadow-lg shadow-purple-500/30">
                      {tier.badge}
                    </div>
                  </div>
                )}
                
                <Card className={`relative overflow-hidden h-full ${
                  tier.highlighted 
                    ? 'bg-gradient-to-b from-purple-900/40 to-slate-900/90 border-purple-500/50 shadow-xl shadow-purple-500/20' 
                    : 'bg-white/5 border-white/10'
                } backdrop-blur-sm`}>
                  {/* Glow effect for highlighted */}
                  {tier.highlighted && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-purple-500 to-pink-500 blur-sm" />
                  )}
                  
                  <div className="p-6 sm:p-8">
                    {/* Tier name */}
                    <h3 className="text-xl font-bold text-white mb-2">{tier.name}</h3>
                    <p className="text-white/60 text-sm mb-6">{tier.description}</p>
                    
                    {/* Price */}
                    <div className="mb-2">
                      <span className="text-4xl font-black text-white">{tier.price}</span>
                      {tier.period && <span className="text-white/60">{tier.period}</span>}
                    </div>
                    {tier.savings && (
                      <p className="text-green-400 text-sm mb-4">{tier.savings}</p>
                    )}
                    {!tier.savings && <div className="mb-6" />}
                    
                    {/* CTA Button - External Link */}
                    <a href={tier.ctaLink || "https://thedoggycompany.in/membership"} target="_blank" rel="noopener noreferrer">
                      <Button 
                        className={`w-full mb-6 py-6 rounded-xl font-semibold ${
                          tier.highlighted 
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/30' 
                            : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                        }`}
                        data-testid={`membership-cta-${tier.name.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {tier.cta}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </a>
                    
                    {/* Features */}
                    <div className="space-y-3">
                      {tier.features.map((feature, fIdx) => (
                        <div key={fIdx} className="flex items-start gap-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                            tier.highlighted ? 'bg-purple-500/30' : 'bg-white/10'
                          }`}>
                            <Check className="w-3 h-3 text-purple-400" />
                          </div>
                          <span className="text-sm text-white/80">{feature}</span>
                        </div>
                      ))}
                      
                      {/* Not included (for free tier) */}
                      {tier.notIncluded?.map((feature, fIdx) => (
                        <div key={`not-${fIdx}`} className="flex items-start gap-3 opacity-50">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-white/5">
                            <X className="w-3 h-3 text-white/40" />
                          </div>
                          <span className="text-sm text-white/40 line-through">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Trust badges */}
          <motion.div 
            className="flex flex-wrap justify-center gap-8 mt-12 pt-12 border-t border-white/10"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {[
              { icon: Shield, text: 'Secure Payments' },
              { icon: Lock, text: 'Your Data Protected' },
              { icon: Zap, text: 'Cancel Anytime' },
              { icon: Gift, text: 'Birthday Surprises' },
            ].map((badge, idx) => (
              <div key={idx} className="flex items-center gap-2 text-white/50">
                <badge.icon className="w-4 h-4" />
                <span className="text-sm">{badge.text}</span>
              </div>
            ))}
          </motion.div>
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
                { icon: Shield, title: 'Built on Trust', desc: 'Every interaction earns your confidence' },
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

            <a href="https://thedoggycompany.in/pet-soul-onboard" target="_blank" rel="noopener noreferrer">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-12 py-7 text-lg rounded-full shadow-2xl shadow-purple-500/30 transition-all hover:scale-105"
              >
                Begin Your Pet&apos;s Soul Journey
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
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

      {/* Video Modal - Brand Story with Multiple Clips */}
      <AnimatePresence>
        {showVideo && (
          <BrandStoryModal 
            onClose={() => setShowVideo(false)}
            videoMuted={videoMuted}
            setVideoMuted={setVideoMuted}
          />
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
  {
    quote: "Mira knew exactly which treats work best for Coco's training. It's like having a pet expert who actually knows MY dog.",
    humanName: "Sneha Patel",
    petName: "Coco",
    petImage: "https://images.unsplash.com/photo-1618762869266-1e23a6b73a1d?w=200&h=200&fit=crop",
  },
];

export default Home;
