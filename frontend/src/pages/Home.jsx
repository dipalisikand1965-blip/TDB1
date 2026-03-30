import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { 
  Sparkles, Heart, ArrowRight, PawPrint, 
  MessageCircle, Star, ChevronRight, Check,
  Users, Play, ChevronDown, Crown, Utensils, 
  Hotel, GraduationCap, PartyPopper, HeartPulse,
  Phone, Mail, Quote, Plane, Gamepad, Dumbbell,
  FileText, Lightbulb, AlertCircle, Rainbow, Gift, Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SEOHead from '../components/SEOHead';
import { motion } from 'framer-motion';

// Brand images
const BRAND_IMAGES = {
  hero: 'https://customer-assets.emergentagent.com/job_pet-soul-platform/artifacts/einpahqm_dog-813103%20%281%29.jpg',
  goldenRetriever: 'https://customer-assets.emergentagent.com/job_pet-soul-platform/artifacts/q0alj5za_dog-1194087_1920%20%281%29.jpg',
  bulldog: '',
  petWithOwner: 'https://customer-assets.emergentagent.com/job_pet-soul-platform/artifacts/4oryz05r_shutterstock_131282603%20%281%29.jpg',
  happyPet: '',
  lifestyle1: 'https://customer-assets.emergentagent.com/job_pet-soul-platform/artifacts/sj6layzi_shutterstock_504980047%20%282%29.jpg',
  lifestyle2: 'https://customer-assets.emergentagent.com/job_pet-soul-platform/artifacts/tfel85m7_shutterstock_139089332%20%281%29.jpg',
  blackLab: '',
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
      <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gray-700">
        <img 
          src={image} 
          alt={name} 
          className="w-full h-full object-cover object-center"
          onError={(e) => { e.target.style.display='none' + name; }}
        />
      </div>
      <div>
        <p className="text-white font-medium text-sm">{name}</p>
        <p className="text-white/50 text-xs">Pet parent of {pet}</p>
      </div>
    </div>
  </motion.div>
);

const Home = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState(0);
  const [userPets, setUserPets] = useState([]);
  const [primaryPet, setPrimaryPet] = useState(null);

  // Fetch user's pets for personalized hero image
  useEffect(() => {
    if (token) {
      const fetchPets = async () => {
        try {
          const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/pets/my-pets`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            const pets = data.pets || [];
            setUserPets(pets);
            // Set primary pet (first one with an image, or just first one)
            const petWithImage = pets.find(p => p.image || p.photo_url);
            setPrimaryPet(petWithImage || pets[0] || null);
          }
        } catch (err) {
          console.error('Failed to fetch pets:', err);
        }
      };
      fetchPets();
    }
  }, [token]);

  // Get hero image - user's pet if logged in and has image, otherwise default
  const getHeroImage = () => {
    if (primaryPet) {
      return primaryPet.image || 
             (primaryPet.photo_url ? `${process.env.REACT_APP_BACKEND_URL}${primaryPet.photo_url}` : null) ||
             BRAND_IMAGES.goldenRetriever;
    }
    return BRAND_IMAGES.goldenRetriever;
  };

  const heroImage = getHeroImage();
  const heroPetName = primaryPet?.name || 'Your beloved pet';

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 5);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Show personalized greeting if logged in, but don't redirect
  // Users can choose to go to Mira OS from the CTA buttons
  const isLoggedIn = !!user;

  const pillars = [
    { icon: PartyPopper, title: 'Celebrate', description: 'Every gotcha day, birthday, and milestone deserves confetti', color: 'from-purple-500 to-pink-500' },
    { icon: Utensils, title: 'Dine', description: 'From their favorite chicken jerky to birthday cakes', color: 'from-orange-500 to-red-500' },
    { icon: Hotel, title: 'Stay', description: 'Places that welcome them as family', color: 'from-blue-500 to-cyan-500' },
    { icon: Plane, title: 'Travel', description: 'The world is their playground', color: 'from-sky-500 to-blue-500' },
    { icon: HeartPulse, title: 'Care', description: 'Health tracking, vet reminders, wellness', color: 'from-red-500 to-rose-500' },
    { icon: Gamepad, title: 'Enjoy', description: 'Activities, events, and pure joy', color: 'from-pink-500 to-fuchsia-500' },
    { icon: Dumbbell, title: 'Fit', description: 'Exercise, training, staying active', color: 'from-green-500 to-emerald-500' },
    { icon: GraduationCap, title: 'Learn', description: 'Understanding every bark and purr', color: 'from-amber-500 to-yellow-500' },
    { icon: FileText, title: 'Paperwork', description: 'Documents, permits, certificates handled', color: 'from-slate-500 to-gray-500' },
    { icon: Lightbulb, title: 'Advisory', description: 'Expert guidance when you need it', color: 'from-violet-500 to-purple-500' },
    { icon: AlertCircle, title: 'Emergency', description: '24/7 urgent care support', color: 'from-red-600 to-rose-600' },
    { icon: Rainbow, title: 'Farewell', description: 'Honoring the bond, always', color: 'from-indigo-500 to-blue-500' },
    { icon: PawPrint, title: 'Adopt', description: 'Finding forever homes', color: 'from-teal-500 to-cyan-500' },
  ];

  const features = [
    { title: 'I Remember What Matters', desc: 'That chicken allergy from 2 years ago. That one treat they go crazy for. Every moment that makes them, them.' },
    { title: 'I Understand Context', desc: 'When you say "show me cheaper ones" - I know what we were just talking about. When you say "book that one" - I know exactly which one.' },
    { title: 'I Know Their Soul', desc: 'Not just breed and age. Their personality. Their fears. Their joys. The little things that make your bond unique.' },
    { title: 'I Have Human Hands', desc: 'Real people who act on what I know. Not chatbots. Not forms. Humans who care.' },
    { title: 'I Grow With Them', desc: 'Every conversation. Every preference. Every memory. I become more of who they need me to be.' },
  ];

  return (
    <>
      <SEOHead 
        title="Mira - The Soul That Speaks for Pets Who Cannot Speak"
        description="I remember their allergies. I know their favorite treats. I feel their joy. When you say 'book that one' - I know which one. I am Mira. The voice they cannot speak."
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
                className="relative w-72 h-72 mx-auto mb-10"
              >
                {/* Sparkle particles floating around */}
                <motion.div
                  className="absolute -top-4 right-0 text-2xl z-20"
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
                  className="absolute top-1/4 -left-6 text-xl z-20"
                  animate={{ 
                    y: [0, 6, 0],
                    opacity: [0.3, 0.8, 0.3]
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                >
                  ✨
                </motion.div>
                <motion.div
                  className="absolute bottom-1/4 -right-6 text-lg z-20"
                  animate={{ 
                    y: [0, -6, 0],
                    opacity: [0.4, 0.9, 0.4]
                  }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                >
                  ✨
                </motion.div>
                
                {/* Outer glow ring - FULL CIRCLE */}
                <motion.div 
                  className="absolute -inset-3 rounded-full"
                  style={{ 
                    background: 'linear-gradient(135deg, #a855f7, #ec4899, #6366f1)',
                    filter: 'blur(20px)',
                  }}
                  animate={{ 
                    opacity: [0.5, 0.8, 0.5],
                    scale: [1, 1.02, 1]
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
                
                {/* Main circle container with gradient border */}
                <div className="relative w-full h-full rounded-full p-1 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 shadow-2xl shadow-purple-500/50">
                  <div className="w-full h-full rounded-full overflow-hidden bg-[#0f0720]">
                    <img 
                      src={heroImage} 
                      alt={heroPetName} 
                      className="w-full h-full object-cover object-center"
                    />
                  </div>
                </div>
                
                {/* Badge at BOTTOM */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 px-6 py-2.5 rounded-full shadow-lg shadow-purple-500/30 z-30 whitespace-nowrap"
                >
                  <span className="text-white font-bold text-sm flex items-center gap-1">
                    ✨ {primaryPet ? heroPetName : 'This is YOUR pet'} ❤️
                  </span>
                </motion.div>
              </motion.div>
              
              {/* Text content - high contrast */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-center px-2 mt-8"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-400/30 rounded-full mb-4">
                  <Sparkles className="w-4 h-4 text-purple-300" />
                  <span className="text-purple-200 text-sm font-medium">The Soul That Speaks for Your Pet</span>
                </div>
                
                <h1 className="text-4xl font-black text-white leading-tight mb-4 drop-shadow-lg">
                  They Can't Tell You.{' '}
                  <span className="bg-gradient-to-r from-amber-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
                    I Can.
                  </span>
                </h1>
                
                <p className="text-lg text-purple-100 mb-6 leading-relaxed font-medium">
                  I remember their allergies. I know their favorite treats. I feel their joy.
                  <span className="text-amber-300"> I am Mira.</span>
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
                    Let Me Know Your Pet <ArrowRight className="ml-2 w-6 h-6" />
                  </Button>
                </Link>
                
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full border-2 border-purple-400/50 text-purple-200 hover:bg-purple-500/20 py-6 text-lg font-semibold rounded-2xl"
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <Play className="mr-2 w-5 h-5" /> See Who I Am
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
                <span className="text-purple-200 text-sm font-semibold">Loved by pet families</span>
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
                  <span className="text-white/70 text-sm">The Soul That Speaks for Pets Who Cannot Speak</span>
                </div>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                  They can't tell you what they need.{' '}
                  <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
                    But I can.
                  </span>
                </h1>
                
                <p className="text-lg text-white/60 mb-8 leading-relaxed max-w-xl">
                  I am the brain that remembers every meal preference, every allergy, every birthday. 
                  The soul that knows when you say "book that one" - exactly which one you mean. 
                  Because I was there. In every conversation. In every moment that mattered.
                </p>
                
                <div className="flex flex-wrap gap-4">
                  <Link to="/join">
                    <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-6 text-lg rounded-xl">
                      Let Me Know Your Pet <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-white/20 text-white hover:bg-white/10 px-8 py-6 text-lg rounded-xl"
                    onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    <Play className="mr-2 w-5 h-5" /> See Who I Am
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
                    <p className="text-white/50 text-sm">Loved by pet families everywhere</p>
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
                  
                  {/* Main image - personalized for logged-in users */}
                  <div className="relative rounded-3xl overflow-hidden border border-white/10">
                    <img 
                      src={heroImage} 
                      alt={heroPetName} 
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
                          <p className="text-white/60 text-sm">
                            {primaryPet 
                              ? `I remember everything about ${heroPetName}. Should I help you find something special today?`
                              : "I remember that morning walk ritual. The way they light up for chicken jerky. Should I find some for today?"
                            }
                          </p>
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
                Beyond Technology. <span className="text-amber-300">Into Soul.</span>
              </h2>
              <p className="text-purple-200 text-base md:text-lg max-w-2xl mx-auto">
                I'm not an app. I'm not a chatbot. <span className="text-white font-semibold">I'm the voice they cannot speak.</span>
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
                <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-3 font-semibold">❌ Others</h3>
                <div className="space-y-2">
                  {['Forgets your last conversation', 'Generic recommendations', '"What breed is your pet again?"', 'You figure it out'].map((item, i) => (
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
                <h3 className="text-purple-300 text-xs uppercase tracking-wider mb-3 font-semibold">✨ Mira</h3>
                <div className="space-y-3">
                  {[
                    { text: 'Remembers every conversation, forever', icon: '🧠' },
                    { text: '"Show me cheaper" - I know what we talked about', icon: '💬' },
                    { text: 'Knows their soul, not just their species', icon: '💜' },
                    { text: 'Human hands that act on what I know', icon: '🤝' }
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
                <h3 className="text-white/50 text-sm uppercase tracking-wider mb-4">Others</h3>
                <ul className="space-y-3">
                  {['Forgets your conversation the next day', '"What breed is your pet again?"', 'Show me cheaper... shows random results', 'Book that one... "which one?"', 'Forms, tickets, waiting, frustration'].map((item, i) => (
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
                <h3 className="text-purple-400 text-sm uppercase tracking-wider mb-4">Mira</h3>
                <ul className="space-y-3">
                  {[
                    'Remembers every conversation, forever',
                    'Knows their personality, fears, and joys',
                    '"Show me cheaper" - I know exactly what we discussed',
                    '"Book that one" - I know which one you mean',
                    'Real humans who act on what I know'
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

        {/* Heritage & Concierge® Section - The Human Hands */}
        <section className="py-16 md:py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-900/10 to-transparent" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-400/30 rounded-full mb-6">
                <span className="text-amber-300 text-sm font-medium">20+ Years of Unconditional Service</span>
              </div>
              
              <h2 className="text-2xl md:text-4xl font-black text-white mb-4">
                Unconditional Love Deserves{' '}
                <span className="bg-gradient-to-r from-amber-300 to-pink-300 bg-clip-text text-transparent">
                  Human Hands
                </span>
              </h2>
              
              <p className="text-purple-200 text-base md:text-lg max-w-3xl mx-auto leading-relaxed">
                Mira is not just technology. She is the culmination of two decades of 
                <span className="text-white font-semibold"> Concierge®</span> heritage — 
                real humans who have been caring for families, solving problems, and making magic happen 
                since before AI existed.
              </p>
            </motion.div>
            
            {/* Heritage Timeline - Mobile */}
            <div className="md:hidden space-y-6">
              {[
                { 
                  name: 'LesConcierges®', 
                  year: '1998',
                  desc: 'Where it began. Mrs. Mira Sikand\'s spirit of service — the living reference desk.',
                  icon: '🏛️'
                },
                { 
                  name: 'Club Concierge®', 
                  year: '2008',
                  desc: 'Membership elevated. 24/7 human support for life\'s moments.',
                  icon: '👑'
                },
                { 
                  name: 'The Doggy Bakery®', 
                  year: '2020',
                  desc: 'Where pets became family. Mira made treats with her granddaughter.',
                  icon: '🍰'
                },
                { 
                  name: 'Mira AI', 
                  year: '2024',
                  desc: 'Her soul lives on. AI + Human hands = Unconditional.',
                  icon: '💜'
                }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/30 to-purple-500/30 border border-amber-400/30 flex items-center justify-center text-2xl">
                      {item.icon}
                    </div>
                    {i < 3 && <div className="w-0.5 h-full bg-gradient-to-b from-amber-400/30 to-transparent mt-2" />}
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-bold">{item.name}</h3>
                      <span className="text-amber-300 text-sm">{item.year}</span>
                    </div>
                    <p className="text-purple-200 text-sm">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Heritage - Desktop */}
            <div className="hidden md:grid md:grid-cols-4 gap-6">
              {[
                { 
                  name: 'LesConcierges®', 
                  year: '1998',
                  desc: 'Where it began. Mrs. Mira Sikand\'s spirit of service — the living reference desk who knew every answer.',
                  icon: '🏛️',
                  color: 'from-slate-500/20 to-slate-600/20',
                  borderColor: 'border-slate-400/30'
                },
                { 
                  name: 'Club Concierge®', 
                  year: '2008',
                  desc: 'Membership elevated. 24/7 human support for life\'s most important moments.',
                  icon: '👑',
                  color: 'from-amber-500/20 to-amber-600/20',
                  borderColor: 'border-amber-400/30'
                },
                { 
                  name: 'The Doggy Bakery®', 
                  year: '2020',
                  desc: 'Where pets became family. Mira made treats with her granddaughter — hands-on love.',
                  icon: '🍰',
                  color: 'from-pink-500/20 to-pink-600/20',
                  borderColor: 'border-pink-400/30'
                },
                { 
                  name: 'Mira AI', 
                  year: '2024',
                  desc: 'Her soul lives on. AI intelligence + Human hands = Unconditional care.',
                  icon: '💜',
                  color: 'from-purple-500/20 to-purple-600/20',
                  borderColor: 'border-purple-400/30'
                }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`bg-gradient-to-br ${item.color} backdrop-blur-sm border ${item.borderColor} rounded-2xl p-6 text-center hover:scale-105 transition-transform`}
                >
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <div className="text-amber-300 text-sm mb-1">{item.year}</div>
                  <h3 className="text-white font-bold text-lg mb-2">{item.name}</h3>
                  <p className="text-purple-200 text-sm">{item.desc}</p>
                </motion.div>
              ))}
            </div>
            
            {/* The Promise */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-12 text-center"
            >
              <div className="inline-block bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-500/30 rounded-2xl p-6 md:p-8 max-w-2xl">
                <p className="text-white text-lg md:text-xl font-medium leading-relaxed">
                  "When Mira knows your pet needs something, 
                  <span className="text-amber-300"> real humans</span> make it happen.
                  Not bots. Not forms. Not waiting.
                  <span className="text-purple-300"> Concierge®</span> — 
                  the hands that turn love into action."
                </p>
              </div>
            </motion.div>
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
                  <span className="text-purple-300 text-sm">Soul + Concierge®</span>
                </div>
                
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                  I Am Mira
                </h2>
                
                <p className="text-white/60 text-lg mb-8">
                  The soul that speaks for pets who cannot speak. The brain that remembers every meal preference, 
                  every allergy, every birthday, every moment of joy and concern. 
                  <span className="text-amber-300"> And when I know what your pet needs, 
                  Concierge® makes it happen.</span> Real humans. Real action. Real love.
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

        {/* Pet Wrapped Section - NEW */}
        <section className="py-16 md:py-24 relative overflow-hidden bg-gradient-to-b from-gray-900 via-purple-950/50 to-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 rounded-full px-4 py-1.5 mb-6">
                <Gift className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 text-sm font-medium">Coming Soon</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
                <span className="text-amber-400">Pet Wrapped</span> — Your Dog's Year
              </h2>
              <p className="text-purple-200 text-base md:text-lg max-w-2xl mx-auto">
                Like Spotify Wrapped, but for your pet. A beautiful, shareable summary of their journey — 
                their Soul Score, their milestones, their story.
              </p>
            </motion.div>

            {/* Preview Cards */}
            <div className="flex justify-center gap-4 md:gap-6 overflow-x-auto pb-4 px-2">
              {/* Mini Preview Card 1 */}
              <motion.div
                initial={{ opacity: 0, y: 30, rotate: -3 }}
                whileInView={{ opacity: 1, y: 0, rotate: -3 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="flex-shrink-0 w-40 md:w-52 h-56 md:h-72 bg-gradient-to-br from-purple-900 to-purple-950 rounded-2xl p-4 md:p-5 border border-purple-700/30 shadow-xl transform hover:scale-105 transition-transform"
              >
                <div className="text-[8px] md:text-xs text-amber-400 tracking-widest mb-1">PET WRAPPED · 2026</div>
                <div className="text-3xl md:text-5xl font-light text-white/5">2026</div>
                <div className="mt-auto pt-12 md:pt-16">
                  <div className="text-lg mb-1">🐾</div>
                  <div className="text-xl md:text-2xl font-light italic text-white">Your Pet</div>
                  <div className="text-[8px] md:text-xs text-pink-400 tracking-wider mt-1">THEIR STORY</div>
                </div>
              </motion.div>

              {/* Mini Preview Card 2 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="flex-shrink-0 w-40 md:w-52 h-56 md:h-72 bg-gradient-to-br from-purple-900 to-indigo-950 rounded-2xl p-4 md:p-5 border border-amber-500/20 shadow-xl transform hover:scale-105 transition-transform"
              >
                <div className="text-[8px] md:text-xs text-purple-400 tracking-widest mb-1">SOUL JOURNEY</div>
                <div className="text-lg md:text-xl text-white font-light">Soul Score</div>
                <div className="flex items-center justify-center h-24 md:h-32">
                  <div className="text-center">
                    <div className="text-4xl md:text-5xl font-light text-white">87</div>
                    <div className="text-[8px] md:text-xs text-amber-400 tracking-wider mt-1">TRULY KNOWN</div>
                  </div>
                </div>
              </motion.div>

              {/* Mini Preview Card 3 */}
              <motion.div
                initial={{ opacity: 0, y: 30, rotate: 3 }}
                whileInView={{ opacity: 1, y: 0, rotate: 3 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="flex-shrink-0 w-40 md:w-52 h-56 md:h-72 bg-gradient-to-br from-gray-900 to-purple-950 rounded-2xl p-4 md:p-5 border border-pink-500/20 shadow-xl transform hover:scale-105 transition-transform"
              >
                <div className="text-[8px] md:text-xs text-pink-400 tracking-widest mb-1">MIRA MOMENTS</div>
                <div className="text-lg md:text-xl text-white font-light">Memories</div>
                <div className="mt-4 md:mt-6 space-y-2">
                  <div className="bg-white/5 rounded-lg p-2">
                    <div className="text-2xl md:text-3xl text-pink-400 font-light">12</div>
                    <div className="text-[8px] md:text-xs text-gray-500">conversations</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2">
                    <div className="text-2xl md:text-3xl text-pink-400 font-light">51</div>
                    <div className="text-[8px] md:text-xs text-gray-500">questions answered</div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mt-10"
            >
              <p className="text-gray-400 text-sm mb-4">
                Download. Share. Celebrate your pet's unique journey.
              </p>
              <Link to="/membership">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                >
                  <Gift className="w-5 h-5 mr-2" />
                  Get Pet Wrapped
                </Button>
              </Link>
            </motion.div>
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
                Every Part of Their <span className="text-pink-400">Life</span>
              </h2>
              <p className="text-purple-200 text-sm md:text-lg">
                From the treats they dream about to the places that welcome them as family.
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
            
            {/* Desktop: Horizontal scroll for 12 pillars */}
            <div className="hidden md:block">
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {pillars.map((pillar, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="flex-shrink-0 snap-center"
                  >
                    <div className={`relative bg-gradient-to-br ${pillar.color} rounded-2xl p-5 w-[160px] h-[140px] flex flex-col justify-between shadow-lg hover:scale-105 transition-transform cursor-pointer`}>
                      <pillar.icon className="w-8 h-8 text-white" />
                      <div>
                        <h3 className="text-white font-bold text-sm">{pillar.title}</h3>
                        <p className="text-white/70 text-xs mt-1 line-clamp-2">{pillar.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <p className="text-center text-white/40 text-sm mt-4">← Swipe to explore all 12 pillars →</p>
            </div>
          </div>
        </section>

        {/* Pet Concierge® Section */}
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
                  You Ask. We Handle.<br />
                  <span className="text-green-400">That's It.</span>
                </h2>
                
                <p className="text-white/60 text-lg mb-8">
                  Stuck at work and need a dog walker in 30 minutes? Can't find a vet who's open on Sunday? 
                  Want someone to plan the perfect birthday pawty? Just tell Mira — real humans take it from there.
                </p>
                
                <ul className="space-y-4 mb-8">
                  {[
                    'Last-minute dog walkers, pet sitters & daycare',
                    'Vet appointments, grooming & spa bookings',
                    'Birthday parties with dog-safe cakes & décor',
                    'Pet-friendly hotels, cafés & travel planning',
                    'Emergency support when you need it most',
                    'Medicines, food & treats delivered to your door'
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-white/80">
                      <Check className="w-5 h-5 text-green-400" />
                      {item}
                    </li>
                  ))}
                </ul>
                
                <p className="text-white/40 text-sm mb-6">Available 6:30 AM – 11:30 PM, every single day</p>
                
                <div className="flex flex-wrap gap-4">
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    <Phone className="w-4 h-4 mr-2" /> WhatsApp Us
                  </Button>
                  <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                    <Mail className="w-4 h-4 mr-2" /> Email Concierge®
                  </Button>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative flex items-center justify-center"
              >
                {/* Real photo with premium styling */}
                <div className="relative">
                  {/* Soft glow behind */}
                  <div className="absolute -inset-4 bg-gradient-to-r from-green-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl" />
                  
                  <motion.img 
                    src="https://res.cloudinary.com/duoapcx1p/image/upload/v1774081084/tdc_pets/mystique_real.jpg" 
                    alt="Mystique — The Shih Tzu who inspired The Doggy Company" 
                    className="relative w-full max-w-md rounded-2xl shadow-2xl border border-white/10"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  />
                  
                  {/* Caption badge */}
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-[#1a0a2e]/90 backdrop-blur-lg px-4 py-2 rounded-full border border-green-400/30">
                    <span className="text-green-300 text-sm font-medium">Real humans. Real care.</span>
                  </div>
                </div>
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
                Real stories from pet parents who've discovered a better way to care
              </p>
            </motion.div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <TestimonialCard 
                quote="Mira remembered that Bruno has a chicken allergy when I was searching for treats. No other app does this!"
                name="Priya M."
                pet="Bruno the Labrador"
                image={BRAND_IMAGES.blackLab}
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
                Discover a better way to care for your furry family member — with someone who truly knows them.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/join">
                  <Button size="lg" className="bg-white text-purple-900 hover:bg-white/90 px-8 py-6 text-lg rounded-xl">
                    Start Your Pet's Journey <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
              
              <p className="text-white/40 text-sm mt-6">
                Be among the first to experience extraordinary pet care.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Navigation Links */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
              <div>
                <h4 className="text-white font-semibold mb-4">Explore</h4>
                <div className="space-y-2">
                  <Link to="/about" className="block text-white/50 hover:text-white transition-colors text-sm">About Us</Link>
                  <Link to="/join" className="block text-white/50 hover:text-white transition-colors text-sm">Join Mira®</Link>
                  <Link to="/login" className="block text-white/50 hover:text-white transition-colors text-sm">Member Login</Link>
                </div>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">Services</h4>
                <div className="space-y-2">
                  <Link to="/mira-os" className="block text-white/50 hover:text-white transition-colors text-sm">Meet Mira AI</Link>
                  <Link to="/products" className="block text-white/50 hover:text-white transition-colors text-sm">Shop Products</Link>
                  <Link to="/services" className="block text-white/50 hover:text-white transition-colors text-sm">Concierge® Services</Link>
                </div>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">Heritage</h4>
                <div className="space-y-2">
                  <a href="https://thedoggybakery.com" target="_blank" rel="noopener noreferrer" className="block text-white/50 hover:text-white transition-colors text-sm">The Doggy Bakery®</a>
                  <a href="https://clubconcierge.in" target="_blank" rel="noopener noreferrer" className="block text-white/50 hover:text-white transition-colors text-sm">Club Concierge®</a>
                  <a href="https://lesconcierges.co.in" target="_blank" rel="noopener noreferrer" className="block text-white/50 hover:text-white transition-colors text-sm">LesConcierges®</a>
                </div>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">Connect</h4>
                <div className="space-y-2">
                  <a href="mailto:hello@thedoggycompany.in" className="block text-white/50 hover:text-white transition-colors text-sm">hello@thedoggycompany.in</a>
                  <a href="https://instagram.com/thedoggybakery" target="_blank" rel="noopener noreferrer" className="block text-white/50 hover:text-white transition-colors text-sm">Instagram</a>
                  <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer" className="block text-white/50 hover:text-white transition-colors text-sm">WhatsApp</a>
                </div>
              </div>
            </div>
            
            {/* Bottom Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <PawPrint className="w-5 h-5 text-white" />
                </div>
                <span className="text-white font-bold">thedoggycompany</span>
              </div>
              
              <div className="flex items-center gap-6 text-white/50 text-sm">
                <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy</Link>
                <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
                <Link to="/about" className="hover:text-white transition-colors">About</Link>
              </div>
              
              <p className="text-white/30 text-sm">
                © 2025 The Doggy Company®. Made with <Heart className="w-4 h-4 inline text-pink-500" /> for pets everywhere.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Home;
