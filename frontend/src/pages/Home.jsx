import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { 
  Sparkles, Heart, ArrowRight, PawPrint, 
  MessageCircle, Star, ChevronRight, Check,
  Users, Play, ChevronDown, Crown, Utensils, 
  Hotel, GraduationCap, PartyPopper, HeartPulse,
  Phone, Mail, Quote
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SEOHead from '../components/SEOHead';
import { motion } from 'framer-motion';

// Brand images
const BRAND_IMAGES = {
  hero: 'https://customer-assets.emergentagent.com/job_pet-soul-platform/artifacts/einpahqm_dog-813103%20%281%29.jpg',
  goldenRetriever: 'https://customer-assets.emergentagent.com/job_pet-soul-platform/artifacts/q0alj5za_dog-1194087_1920%20%281%29.jpg',
  bulldog: 'https://customer-assets.emergentagent.com/job_5cf50a1a-4d9d-44c4-a2ef-736fb1d18b6e/artifacts/hadl2vc0_shutterstock_136164980%20%282%29.jpg',
  petWithOwner: 'https://customer-assets.emergentagent.com/job_pet-soul-platform/artifacts/4oryz05r_shutterstock_131282603%20%281%29.jpg',
  happyPet: 'https://customer-assets.emergentagent.com/job_pet-soul-platform/artifacts/s4qmsach_shutterstock_199063937.jpg',
  lifestyle1: 'https://customer-assets.emergentagent.com/job_pet-soul-platform/artifacts/sj6layzi_shutterstock_504980047%20%282%29.jpg',
  lifestyle2: 'https://customer-assets.emergentagent.com/job_pet-soul-platform/artifacts/tfel85m7_shutterstock_139089332%20%281%29.jpg',
};

// Mira's Living Soul Orb - Simplified
const MiraSoulOrb = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-500"
        animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.8, 0.6] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{ filter: 'blur(15px)' }}
      />
      <div className="absolute inset-2 rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-indigo-600 flex items-center justify-center shadow-2xl">
        <Sparkles className="w-1/2 h-1/2 text-white" />
      </div>
    </div>
  );
};

// Pillar Card Component
const PillarCard = ({ icon: Icon, title, description, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className="group relative"
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${color} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl`} />
    <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-white/60 text-sm leading-relaxed">{description}</p>
    </div>
  </motion.div>
);

// Testimonial Card
const TestimonialCard = ({ quote, name, pet, image }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
  >
    <Quote className="w-8 h-8 text-purple-400 mb-4" />
    <p className="text-white/80 text-sm leading-relaxed mb-4 italic">"{quote}"</p>
    <div className="flex items-center gap-3">
      <img src={image} alt={name} className="w-10 h-10 rounded-full object-cover" />
      <div>
        <p className="text-white font-medium text-sm">{name}</p>
        <p className="text-white/50 text-xs">Pet parent of {pet}</p>
      </div>
    </div>
  </motion.div>
);

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState(0);

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 5);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Redirect logged-in users to Mira
  if (user) {
    navigate('/mira-demo');
    return null;
  }

  const pillars = [
    { icon: Utensils, title: 'Dine', description: 'Fresh meals & pet-friendly restaurants worldwide', color: 'from-orange-500 to-red-500' },
    { icon: Hotel, title: 'Stay', description: 'Pet-friendly hotels & accommodations globally', color: 'from-blue-500 to-cyan-500' },
    { icon: GraduationCap, title: 'Learn', description: 'Training videos & expert guidance', color: 'from-green-500 to-emerald-500' },
    { icon: PartyPopper, title: 'Enjoy', description: 'Activities, events & celebrations', color: 'from-purple-500 to-pink-500' },
    { icon: HeartPulse, title: 'Care', description: 'Health tracking & vet connections', color: 'from-red-500 to-rose-500' },
  ];

  const features = [
    { title: 'Remembers Everything', desc: 'Allergies, preferences, favorite treats - Mira never forgets' },
    { title: 'Personalized Recommendations', desc: 'Every suggestion tailored to your pet\'s unique personality' },
    { title: 'Worldwide Access', desc: 'Pet-friendly places in Paris, Tokyo, Mumbai - anywhere you go' },
    { title: 'Real Concierge Support', desc: 'Human experts ready to help with anything you need' },
    { title: 'One Dashboard', desc: 'Health, food, travel, memories - all in one place' },
  ];

  return (
    <>
      <SEOHead 
        title="MIRA - The World's First Pet Life Operating System"
        description="Meet Mira, your AI-powered pet companion. Personalized care, worldwide travel, fresh food, and a concierge that handles everything for your furry family member."
      />
      
      <div className="min-h-screen bg-gradient-to-b from-[#0f0720] via-[#1a0a2e] to-[#0f0720]">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0f0720]/80 backdrop-blur-lg border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <PawPrint className="w-5 h-5 text-white" />
                </div>
                <span className="text-white font-bold text-lg">thedoggycompany</span>
              </Link>
              <div className="flex items-center gap-3">
                <Link to="/login">
                  <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10">
                    Login
                  </Button>
                </Link>
                <Link to="/join">
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                    Join Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
          {/* Background gradient orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/30 rounded-full blur-3xl" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-20">
            {/* MOBILE HERO - SPECTACULAR WOW DESIGN */}
            <div className="lg:hidden flex flex-col items-center">
              {/* Full-width dog image - MIRA'S SOUL EMBRACING YOUR PET */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1 }}
                className="relative w-full max-w-sm mx-auto mb-6"
              >
                {/* Outer soul glow - breathing animation */}
                <motion.div 
                  className="absolute -inset-4 bg-gradient-to-r from-purple-500 via-pink-400 to-indigo-500 rounded-full blur-2xl opacity-50"
                  animate={{ 
                    scale: [1, 1.05, 1],
                    opacity: [0.4, 0.6, 0.4]
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
                
                {/* Inner soul glow - counter animation */}
                <motion.div 
                  className="absolute -inset-2 bg-gradient-to-r from-pink-400 via-purple-500 to-pink-400 rounded-full blur-xl opacity-60"
                  animate={{ 
                    scale: [1.05, 1, 1.05],
                    opacity: [0.5, 0.7, 0.5]
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                />
                
                {/* Sparkle particles floating around */}
                <motion.div
                  className="absolute -top-2 -right-2 text-2xl"
                  animate={{ 
                    y: [0, -8, 0],
                    opacity: [0.5, 1, 0.5],
                    rotate: [0, 10, 0]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ✨
                </motion.div>
                <motion.div
                  className="absolute top-1/4 -left-4 text-xl"
                  animate={{ 
                    y: [0, 6, 0],
                    opacity: [0.3, 0.8, 0.3]
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                >
                  ✨
                </motion.div>
                <motion.div
                  className="absolute bottom-1/4 -right-4 text-lg"
                  animate={{ 
                    y: [0, -6, 0],
                    opacity: [0.4, 0.9, 0.4]
                  }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                >
                  ✨
                </motion.div>
                
                {/* Dog image - circular with soul border */}
                <div className="relative w-72 h-72 mx-auto rounded-full overflow-hidden shadow-2xl">
                  {/* Animated gradient border */}
                  <div className="absolute inset-0 rounded-full p-1 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500">
                    <div className="w-full h-full rounded-full overflow-hidden bg-[#0f0720]">
                      <img 
                        src={BRAND_IMAGES.goldenRetriever} 
                        alt="Your beloved pet" 
                        className="w-full h-full object-cover"
                      />
                      {/* Subtle soul overlay on the image */}
                      <div className="absolute inset-0 bg-gradient-to-t from-purple-900/40 via-transparent to-pink-500/10" />
                    </div>
                  </div>
                </div>
                
                {/* Badge - YOUR PET with soul sparkle */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 px-6 py-2.5 rounded-full shadow-lg shadow-purple-500/30"
                >
                  <span className="text-white font-bold text-sm flex items-center gap-1">
                    ✨ This is YOUR pet ❤️
                  </span>
                </motion.div>
              </motion.div>
              
              {/* Text content - high contrast */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-center px-2"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-400/30 rounded-full mb-4">
                  <Sparkles className="w-4 h-4 text-purple-300" />
                  <span className="text-purple-200 text-sm font-medium">Pet Life Operating System</span>
                </div>
                
                <h1 className="text-4xl font-black text-white leading-tight mb-4 drop-shadow-lg">
                  Your Pet Deserves{' '}
                  <span className="bg-gradient-to-r from-amber-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
                    Extraordinary
                  </span>
                </h1>
                
                <p className="text-lg text-purple-100 mb-6 leading-relaxed font-medium">
                  AI that knows your pet. Concierge® that handles everything. 
                  <span className="text-amber-300"> One app. Unlimited love.</span>
                </p>
              </motion.div>
              
              {/* CTA Buttons - PROMINENT */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="w-full space-y-3 px-4"
              >
                <Link to="/join" className="block">
                  <Button size="lg" className="w-full bg-gradient-to-r from-amber-500 via-pink-500 to-purple-600 hover:from-amber-600 hover:via-pink-600 hover:to-purple-700 text-white py-7 text-xl font-bold rounded-2xl shadow-2xl shadow-purple-500/30">
                    Begin Your Pet's Journey <ArrowRight className="ml-2 w-6 h-6" />
                  </Button>
                </Link>
                
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full border-2 border-purple-400/50 text-purple-200 hover:bg-purple-500/20 py-6 text-lg font-semibold rounded-2xl"
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <Play className="mr-2 w-5 h-5" /> See the Magic
                </Button>
              </motion.div>
              
              {/* Trust badges - compact but visible */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="flex items-center justify-center gap-3 mt-8 px-4 py-3 bg-white/5 rounded-2xl border border-white/10"
              >
                <div className="flex -space-x-2">
                  {[BRAND_IMAGES.goldenRetriever, BRAND_IMAGES.bulldog, BRAND_IMAGES.happyPet].map((img, i) => (
                    <img key={i} src={img} alt="Pet" className="w-10 h-10 rounded-full border-2 border-purple-900 object-cover" />
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-purple-200 text-sm font-semibold">10,000+ families</span>
              </motion.div>
            </div>
            
            {/* DESKTOP HERO - Original Design */}
            <div className="hidden lg:grid lg:grid-cols-2 gap-12 items-center">
              {/* Left content */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-6">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-white/70 text-sm">The World's First Pet Life Operating System</span>
                </div>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                  Every moment with your pet deserves to be{' '}
                  <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
                    extraordinary
                  </span>
                </h1>
                
                <p className="text-lg text-white/60 mb-8 leading-relaxed max-w-xl">
                  Meet Mira - an AI that truly knows your pet. From personalized nutrition to worldwide travel, 
                  from health tracking to a real concierge team that handles everything. Because your pet isn't just a pet. 
                  They're family.
                </p>
                
                <div className="flex flex-wrap gap-4">
                  <Link to="/join">
                    <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-6 text-lg rounded-xl">
                      Meet Mira <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-white/20 text-white hover:bg-white/10 px-8 py-6 text-lg rounded-xl"
                    onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    <Play className="mr-2 w-5 h-5" /> See How It Works
                  </Button>
                </div>
                
                {/* Trust badges */}
                <div className="flex items-center gap-6 mt-10">
                  <div className="flex -space-x-3">
                    {[BRAND_IMAGES.goldenRetriever, BRAND_IMAGES.bulldog, BRAND_IMAGES.happyPet].map((img, i) => (
                      <img key={i} src={img} alt="Pet" className="w-10 h-10 rounded-full border-2 border-[#0f0720] object-cover" />
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-white/50 text-sm">Loved by 10,000+ pet families</p>
                  </div>
                </div>
              </motion.div>
              
              {/* Right - Hero Image with Mira Orb */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative"
              >
                <div className="relative">
                  {/* Glowing border effect */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 rounded-3xl blur-lg opacity-50" />
                  
                  {/* Main image */}
                  <div className="relative rounded-3xl overflow-hidden border border-white/10">
                    <img 
                      src={BRAND_IMAGES.hero} 
                      alt="Happy pet" 
                      className="w-full h-auto object-cover"
                    />
                    
                    {/* Mira floating card */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="absolute bottom-4 left-4 right-4 bg-[#1a0a2e]/90 backdrop-blur-lg rounded-2xl p-4 border border-white/10"
                    >
                      <div className="flex items-center gap-3">
                        <MiraSoulOrb size="sm" />
                        <div className="flex-1">
                          <p className="text-white font-medium">Mira</p>
                          <p className="text-white/60 text-sm">Hi! I already know your pet loves morning walks and is allergic to chicken. Ready to plan something special?</p>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
          
          {/* Scroll indicator */}
          <motion.div 
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ChevronDown className="w-8 h-8 text-white/30" />
          </motion.div>
        </section>

        {/* "We See Your Pet Differently" Section */}
        <section className="py-16 md:py-24 relative" id="how-it-works">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10 md:mb-16"
            >
              <h2 className="text-2xl md:text-4xl font-black text-white mb-3">
                We See Your Pet <span className="text-amber-300">Differently</span>
              </h2>
              <p className="text-purple-200 text-base md:text-lg max-w-2xl mx-auto">
                Not just food and walks. <span className="text-white font-semibold">Joy. Comfort. Health. Memories.</span>
              </p>
            </motion.div>
            
            {/* Mobile: Stacked cards */}
            <div className="space-y-4 md:hidden">
              {/* Old Way - Dimmed */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-gray-900/50 border border-gray-700/50 rounded-2xl p-5"
              >
                <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-3 font-semibold">❌ The Old Way</h3>
                <div className="space-y-2">
                  {['Generic pet food', 'Random vet visits', 'No travel planning', 'Figure it out yourself'].map((item, i) => (
                    <p key={i} className="text-gray-500 text-sm flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-gray-600 rounded-full" />
                      {item}
                    </p>
                  ))}
                </div>
              </motion.div>
              
              {/* Mira Way - Highlighted */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-purple-900/80 to-pink-900/80 border-2 border-purple-500/50 rounded-2xl p-5 shadow-lg shadow-purple-500/20"
              >
                <h3 className="text-purple-300 text-xs uppercase tracking-wider mb-3 font-semibold">✨ The Mira Way</h3>
                <div className="space-y-3">
                  {[
                    { text: 'Personalized nutrition', icon: '🍽️' },
                    { text: 'Smart health tracking', icon: '💊' },
                    { text: 'Pet-friendly travel worldwide', icon: '✈️' },
                    { text: 'Concierge® handles it all', icon: '👑' }
                  ].map((item, i) => (
                    <p key={i} className="text-white text-base flex items-center gap-3 font-medium">
                      <span className="text-lg">{item.icon}</span>
                      {item.text}
                    </p>
                  ))}
                </div>
              </motion.div>
            </div>
            
            {/* Desktop: Side by side */}
            <div className="hidden md:grid md:grid-cols-2 gap-8 items-center">
              {/* Before/After comparison */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
              >
                <h3 className="text-white/50 text-sm uppercase tracking-wider mb-4">The Old Way</h3>
                <ul className="space-y-3">
                  {['Generic pet food', 'Random vet visits', 'No travel planning', 'Scattered information', 'Figure it out yourself'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-white/40">
                      <div className="w-2 h-2 rounded-full bg-white/20" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6"
              >
                <h3 className="text-purple-400 text-sm uppercase tracking-wider mb-4">The Mira Way</h3>
                <ul className="space-y-3">
                  {[
                    'Personalized nutrition for their breed & age',
                    'Health tracking with smart reminders',
                    'Pet-friendly travel anywhere in the world',
                    'One dashboard for everything',
                    'A concierge team that handles it all'
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-white">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Mira AI Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-pink-900/20" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left - Mira visualization */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="flex justify-center"
              >
                <div className="relative">
                  <MiraSoulOrb size="lg" />
                  
                  {/* Floating insight cards */}
                  {features.map((feature, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ 
                        opacity: activeFeature === i ? 1 : 0.3,
                        scale: activeFeature === i ? 1 : 0.9,
                      }}
                      className={`absolute bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2 text-sm text-white whitespace-nowrap ${
                        i === 0 ? 'top-0 left-full ml-4' :
                        i === 1 ? 'top-1/4 right-full mr-4' :
                        i === 2 ? 'bottom-1/4 left-full ml-4' :
                        i === 3 ? 'bottom-0 right-full mr-4' :
                        'top-1/2 left-full ml-4'
                      }`}
                    >
                      {feature.title}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
              
              {/* Right - Content */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full mb-6">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-purple-300 text-sm">Powered by AI + Love</span>
                </div>
                
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                  Mira Knows Your Pet
                </h2>
                
                <p className="text-white/60 text-lg mb-8">
                  Not just another chatbot. Mira learns your pet's personality, remembers their allergies, 
                  tracks their health, and becomes a true companion in your pet parenting journey.
                </p>
                
                <div className="space-y-4">
                  {features.map((feature, i) => (
                    <motion.div
                      key={i}
                      className={`flex items-start gap-4 p-4 rounded-xl transition-all duration-300 cursor-pointer ${
                        activeFeature === i ? 'bg-white/10' : 'hover:bg-white/5'
                      }`}
                      onClick={() => setActiveFeature(i)}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        activeFeature === i ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-white/10'
                      }`}>
                        <Check className={`w-4 h-4 ${activeFeature === i ? 'text-white' : 'text-white/50'}`} />
                      </div>
                      <div>
                        <h3 className={`font-medium ${activeFeature === i ? 'text-white' : 'text-white/70'}`}>
                          {feature.title}
                        </h3>
                        <p className={`text-sm ${activeFeature === i ? 'text-white/70' : 'text-white/40'}`}>
                          {feature.desc}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 5 Pillars Section - MOBILE OPTIMIZED */}
        <section className="py-12 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8 md:mb-16"
            >
              <h2 className="text-2xl md:text-4xl font-black text-white mb-2">
                One Place for <span className="text-pink-400">Everything</span>
              </h2>
              <p className="text-purple-200 text-sm md:text-lg">
                Five pillars. One app. <span className="text-amber-300">Unlimited possibilities.</span>
              </p>
            </motion.div>
            
            {/* Mobile: Horizontal scroll with large cards */}
            <div className="md:hidden">
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory -mx-4 px-4 scrollbar-hide">
                {pillars.map((pillar, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex-shrink-0 w-[280px] snap-center"
                  >
                    <div className={`relative bg-gradient-to-br ${pillar.color} rounded-3xl p-6 h-44 flex flex-col justify-between shadow-xl`}>
                      {/* Glow effect */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${pillar.color} rounded-3xl blur-xl opacity-40`} />
                      
                      <div className="relative">
                        <pillar.icon className="w-10 h-10 text-white mb-3" />
                        <h3 className="text-2xl font-bold text-white">{pillar.title}</h3>
                      </div>
                      <p className="relative text-white/90 text-sm leading-relaxed">{pillar.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              {/* Scroll hint */}
              <p className="text-center text-purple-400/60 text-xs mt-2">← Swipe to explore →</p>
            </div>
            
            {/* Desktop: Grid */}
            <div className="hidden md:grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {pillars.map((pillar, i) => (
                <PillarCard key={i} {...pillar} delay={i * 0.1} />
              ))}
            </div>
          </div>
        </section>

        {/* Pet Concierge Section */}
        <section className="py-24 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-900/10 to-transparent" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full mb-6">
                  <Crown className="w-4 h-4 text-green-400" />
                  <span className="text-green-300 text-sm">Your Pet Concierge®</span>
                </div>
                
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                  Real Humans Who Handle Everything
                </h2>
                
                <p className="text-white/60 text-lg mb-8">
                  Want to book a pet-friendly hotel in Paris? Need a vet appointment? Planning a birthday party? 
                  Just tell Mira what you want - our Concierge team makes it happen.
                </p>
                
                <ul className="space-y-4 mb-8">
                  {[
                    'Book hotels, restaurants, vets - anywhere in the world',
                    'Plan birthday parties and celebrations',
                    'Handle emergencies with priority support',
                    'Available 6:30 AM - 11:30 PM, every day'
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-white/80">
                      <Check className="w-5 h-5 text-green-400" />
                      {item}
                    </li>
                  ))}
                </ul>
                
                <div className="flex flex-wrap gap-4">
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    <Phone className="w-4 h-4 mr-2" /> WhatsApp Us
                  </Button>
                  <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                    <Mail className="w-4 h-4 mr-2" /> Email Concierge
                  </Button>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative flex items-center justify-center"
              >
                {/* Bulldog with transparent background - floating animation */}
                <motion.img 
                  src={BRAND_IMAGES.bulldog} 
                  alt="Happy pet with Concierge care" 
                  className="relative w-full max-w-md drop-shadow-2xl"
                  style={{ background: 'transparent' }}
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Loved by Pet Families
              </h2>
              <p className="text-white/60 text-lg">
                Join thousands of pet parents who've transformed their pet care journey
              </p>
            </motion.div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <TestimonialCard 
                quote="Mira remembered that Bruno has a chicken allergy when I was searching for treats. No other app does this!"
                name="Priya M."
                pet="Bruno the Labrador"
                image={BRAND_IMAGES.goldenRetriever}
              />
              <TestimonialCard 
                quote="Booked a pet-friendly hotel in Goa through the concierge. They even arranged a dog-sitter for our dinner date!"
                name="Rahul K."
                pet="Cookie the Beagle"
                image={BRAND_IMAGES.bulldog}
              />
              <TestimonialCard 
                quote="The health tracking alone is worth it. I get reminders for vaccinations, vet visits, everything!"
                name="Ananya S."
                pet="Max the German Shepherd"
                image={BRAND_IMAGES.happyPet}
              />
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/50 to-pink-900/50" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/30 rounded-full blur-3xl" />
          
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <MiraSoulOrb size="md" />
              
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mt-8 mb-6">
                Ready to give your pet the life they deserve?
              </h2>
              
              <p className="text-white/60 text-lg mb-8 max-w-2xl mx-auto">
                Join thousands of pet parents who've discovered a better way to care for their furry family members.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/join">
                  <Button size="lg" className="bg-white text-purple-900 hover:bg-white/90 px-8 py-6 text-lg rounded-xl">
                    Start Your Pet's Journey <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
              
              <p className="text-white/40 text-sm mt-6">
                Join 10,000+ pet families who chose extraordinary.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <PawPrint className="w-5 h-5 text-white" />
                </div>
                <span className="text-white font-bold">thedoggycompany</span>
              </div>
              
              <div className="flex items-center gap-6 text-white/50 text-sm">
                <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
                <a href="mailto:hello@thedoggycompany.in" className="hover:text-white transition-colors">Contact</a>
              </div>
              
              <p className="text-white/30 text-sm">
                © 2025 The Doggy Company. Made with <Heart className="w-4 h-4 inline text-pink-500" /> for pets everywhere.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Home;
