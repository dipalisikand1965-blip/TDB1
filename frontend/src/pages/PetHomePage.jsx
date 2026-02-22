/**
 * PetHomePage.jsx
 * 
 * THE DEFAULT LANDING PAGE AFTER LOGIN/ONBOARDING
 * As specified in MIRA_OS_SSOT.md (Screen 20)
 * 
 * Architecture:
 * - Tab Bar: [Pet Home] [Dashboard] [My Pets]
 * - Pet Hero (photo, name, breed, soul ring, 3 traits)
 * - "What would you like to do for {Pet}?" + pillar shortcuts  
 * - Picks for {Pet} button (sticky)
 * - Proactive alerts (birthday, vaccines, etc.)
 * - Open requests strip
 * - Talk to Mira FAB
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Sparkles,
  Heart,
  Cake,
  Stethoscope,
  Utensils,
  Plane,
  Home,
  Scissors,
  GraduationCap,
  ShoppingBag,
  Bell,
  ChevronRight,
  MessageCircle,
  Calendar,
  Shield,
  Activity,
  Loader2,
  Settings,
  Plus,
  Star,
  AlertCircle,
  Clock,
  PawPrint,
  LayoutDashboard,
  Users,
  Dog
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Life Pillars with icons (9 main pillars)
const PILLARS = [
  { id: 'celebrate', name: 'Celebrate', icon: Cake, color: 'from-pink-500 to-rose-500', path: '/celebrate' },
  { id: 'care', name: 'Care', icon: Stethoscope, color: 'from-emerald-500 to-teal-500', path: '/care' },
  { id: 'dine', name: 'Dine', icon: Utensils, color: 'from-amber-500 to-orange-500', path: '/dine' },
  { id: 'stay', name: 'Stay', icon: Home, color: 'from-blue-500 to-indigo-500', path: '/stay' },
  { id: 'travel', name: 'Travel', icon: Plane, color: 'from-purple-500 to-violet-500', path: '/travel' },
  { id: 'enjoy', name: 'Enjoy', icon: Heart, color: 'from-red-500 to-pink-500', path: '/enjoy' },
  { id: 'fit', name: 'Fit', icon: Activity, color: 'from-green-500 to-emerald-500', path: '/fit' },
  { id: 'learn', name: 'Learn', icon: GraduationCap, color: 'from-indigo-500 to-blue-500', path: '/learn' },
  { id: 'shop', name: 'Shop', icon: ShoppingBag, color: 'from-fuchsia-500 to-pink-500', path: '/shop' },
];

// Soul Ring Component
const SoulRing = ({ percentage, size = 100, strokeWidth = 6 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#soulGradientHome)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
        />
        <defs>
          <linearGradient id="soulGradientHome" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-white">{percentage}%</span>
        <span className="text-xs text-slate-400">Soul</span>
      </div>
    </div>
  );
};

// Tab Navigation Component
const TabNavigation = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'home', label: 'Pet Home', icon: Home },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'my-pets', label: 'My Pets', icon: PawPrint },
  ];
  
  return (
    <div className="flex border-b border-slate-700">
      {tabs.map(tab => {
        const TabIcon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            data-testid={`tab-${tab.id}`}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium transition-all border-b-2 ${
              isActive 
                ? 'text-white border-pink-500 bg-pink-500/10' 
                : 'text-slate-400 border-transparent hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <TabIcon className="w-4 h-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

// Pet Selector Component (for multi-pet)
const PetSelector = ({ pets, selectedPet, onPetChange }) => {
  if (!pets || pets.length <= 1) return null;
  
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 px-4 -mx-4 scrollbar-hide">
      {pets.map(pet => {
        const isSelected = selectedPet?.id === pet.id;
        return (
          <button
            key={pet.id}
            onClick={() => onPetChange(pet)}
            className={`flex items-center gap-2 px-3 py-2 rounded-full whitespace-nowrap transition-all ${
              isSelected 
                ? 'bg-pink-500/20 border border-pink-500 text-white' 
                : 'bg-slate-800 border border-slate-700 text-slate-300 hover:border-slate-600'
            }`}
          >
            {pet.photo ? (
              <img src={pet.photo} alt={pet.name} className="w-6 h-6 rounded-full object-cover" />
            ) : (
              <PawPrint className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">{pet.name}</span>
          </button>
        );
      })}
      <button
        onClick={() => window.location.href = '/join'}
        className="flex items-center gap-2 px-3 py-2 rounded-full bg-slate-800 border border-dashed border-slate-600 text-slate-400 hover:border-pink-500 hover:text-pink-400 whitespace-nowrap"
      >
        <Plus className="w-4 h-4" />
        <span className="text-sm">Add Pet</span>
      </button>
    </div>
  );
};

const PetHomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine initial tab from URL or default to 'home'
  const getInitialTab = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'dashboard';
    if (path === '/my-pets') return 'my-pets';
    return 'home';
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [loading, setLoading] = useState(true);
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [user, setUser] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [openRequests, setOpenRequests] = useState([]);
  const [soulScore, setSoulScore] = useState(0);
  const [traits, setTraits] = useState([]);
  
  // Handle tab change - navigate to appropriate route
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'dashboard') {
      navigate('/dashboard');
    } else if (tabId === 'my-pets') {
      navigate('/my-pets');
    } else {
      navigate('/pet-home');
    }
  };
  
  // Fetch pet and user data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('tdb_auth_token');
        if (!token) {
          navigate('/login');
          return;
        }
        
        // Fetch user data
        const userRes = await fetch(`${API_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!userRes.ok) {
          localStorage.removeItem('tdb_auth_token');
          navigate('/login');
          return;
        }
        
        const userData = await userRes.json();
        setUser(userData);
        
        // Fetch pets
        const petsRes = await fetch(`${API_URL}/api/pets/my-pets`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (petsRes.ok) {
          const petsResponse = await petsRes.json();
          // API returns {pets: [...]} so extract the array
          const petsData = Array.isArray(petsResponse) ? petsResponse : (petsResponse.pets || []);
          setPets(petsData);
          
          if (petsData.length > 0) {
            const primaryPet = petsData[0];
            setSelectedPet(primaryPet);
            updatePetContext(primaryPet);
          }
        }
        
        // Fetch open tickets/requests (gracefully handle if endpoint doesn't exist)
        try {
          const ticketsRes = await fetch(`${API_URL}/api/tickets/my-tickets?status=open`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (ticketsRes.ok) {
            const ticketsResponse = await ticketsRes.json();
            // Handle both array and {tickets: [...]} response formats
            const ticketsData = Array.isArray(ticketsResponse) ? ticketsResponse : (ticketsResponse.tickets || []);
            setOpenRequests(ticketsData.slice(0, 3));
          }
        } catch (ticketErr) {
          // Tickets endpoint may not exist, that's okay
          console.debug('Tickets fetch skipped:', ticketErr);
        }
        
      } catch (err) {
        console.error('Error fetching data:', err);
        toast.error('Failed to load your pet\'s home');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [navigate]);
  
  // Update context when pet changes
  const updatePetContext = useCallback((pet) => {
    // Calculate soul score from answers
    const soulAnswers = pet.doggy_soul_answers || {};
    const answeredCount = Object.keys(soulAnswers).filter(k => soulAnswers[k]).length;
    const calculatedScore = Math.min(Math.round((answeredCount / 51) * 100), 100);
    setSoulScore(calculatedScore || Math.round(pet.overall_score || 30));
    
    // Extract traits
    const extractedTraits = [];
    if (soulAnswers.temperament) extractedTraits.push(soulAnswers.temperament);
    if (soulAnswers.exercise_needs) extractedTraits.push(`${soulAnswers.exercise_needs} energy`);
    if (soulAnswers.stranger_reaction) extractedTraits.push(`${soulAnswers.stranger_reaction} with strangers`);
    setTraits(extractedTraits.slice(0, 3));
    
    // Generate alerts
    generateAlerts(pet);
  }, []);
  
  // Handle pet selection change
  const handlePetChange = (pet) => {
    setSelectedPet(pet);
    updatePetContext(pet);
  };
  
  // Generate proactive alerts based on pet data
  const generateAlerts = useCallback((petData) => {
    const newAlerts = [];
    
    // Birthday alert
    if (petData.birth_date) {
      const birthDate = new Date(petData.birth_date);
      const today = new Date();
      const nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
      if (nextBirthday < today) {
        nextBirthday.setFullYear(today.getFullYear() + 1);
      }
      const daysUntil = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
      
      if (daysUntil <= 30) {
        newAlerts.push({
          id: 'birthday',
          type: 'celebration',
          icon: Cake,
          title: daysUntil === 0 ? `Happy Birthday ${petData.name}!` : `${petData.name}'s birthday is in ${daysUntil} days`,
          action: 'Plan celebration',
          path: '/celebrate'
        });
      }
    }
    
    // Gotcha day alert
    if (petData.gotcha_date) {
      const gotchaDate = new Date(petData.gotcha_date);
      const today = new Date();
      const nextGotcha = new Date(today.getFullYear(), gotchaDate.getMonth(), gotchaDate.getDate());
      if (nextGotcha < today) {
        nextGotcha.setFullYear(today.getFullYear() + 1);
      }
      const daysUntil = Math.ceil((nextGotcha - today) / (1000 * 60 * 60 * 24));
      
      if (daysUntil <= 30) {
        newAlerts.push({
          id: 'gotcha',
          type: 'celebration',
          icon: Heart,
          title: `${petData.name}'s Gotcha Day is in ${daysUntil} days`,
          action: 'Celebrate',
          path: '/celebrate'
        });
      }
    }
    
    // Health check reminder for seniors
    const soulAnswers = petData.doggy_soul_answers || {};
    if (soulAnswers.life_stage === 'senior') {
      newAlerts.push({
        id: 'health',
        type: 'care',
        icon: Stethoscope,
        title: 'Senior wellness check recommended',
        action: 'Book checkup',
        path: '/care'
      });
    }
    
    // Soul completion prompt
    const answeredCount = Object.keys(soulAnswers).filter(k => soulAnswers[k]).length;
    if (answeredCount < 20) {
      newAlerts.push({
        id: 'soul',
        type: 'soul',
        icon: Sparkles,
        title: `Help Mira understand ${petData.name} better`,
        action: 'Answer questions',
        path: '/soul-builder'
      });
    }
    
    setAlerts(newAlerts);
  }, []);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-purple-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-pink-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading your pet's home...</p>
        </div>
      </div>
    );
  }
  
  if (!selectedPet && pets.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-purple-950 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <PawPrint className="w-16 h-16 text-pink-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">No pets found</h2>
          <p className="text-slate-400 mb-6">Let's add your first pet to get started!</p>
          <button
            onClick={() => navigate('/join')}
            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-medium"
            data-testid="add-first-pet-btn"
          >
            Add Your Pet
          </button>
        </div>
      </div>
    );
  }
  
  const pet = selectedPet;
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-purple-950">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
        {/* Top bar with logo and actions */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Mira</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/notifications')}
              className="relative p-2 rounded-full bg-slate-800 hover:bg-slate-700"
              data-testid="notifications-btn"
            >
              <Bell className="w-5 h-5 text-slate-400" />
              {alerts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 rounded-full text-xs text-white flex items-center justify-center">
                  {alerts.length}
                </span>
              )}
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="p-2 rounded-full bg-slate-800 hover:bg-slate-700"
              data-testid="settings-btn"
            >
              <Settings className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
      
      {/* Main Content */}
      <div className="p-4 md:p-6">
        {/* Pet Selector (multi-pet) */}
        <PetSelector 
          pets={pets} 
          selectedPet={selectedPet} 
          onPetChange={handlePetChange} 
        />
        
        {/* Pet Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mt-4"
        >
          {/* Glow effect */}
          <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-pink-500/20 to-purple-600/20 rounded-3xl" />
          
          <div className="relative bg-slate-800/50 rounded-3xl border border-slate-700 p-6" data-testid="pet-hero">
            <div className="flex items-start gap-4">
              {/* Pet Photo */}
              <div className="relative">
                <div className="absolute inset-0 blur-xl bg-gradient-to-r from-pink-500/30 to-purple-600/30 rounded-full" />
                <div className="relative">
                  {pet?.photo ? (
                    <img
                      src={pet.photo}
                      alt={pet.name}
                      className="w-24 h-24 rounded-full object-cover border-4 border-pink-500/50"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                      <PawPrint className="w-10 h-10 text-white" />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Pet Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-white">{pet?.name}</h1>
                  {pet?.gender === 'boy' && <span className="text-blue-400">♂️</span>}
                  {pet?.gender === 'girl' && <span className="text-pink-400">♀️</span>}
                </div>
                <p className="text-slate-400 text-sm mb-3">{pet?.breed || 'Good Boy/Girl'}</p>
                
                {/* Traits */}
                <div className="flex flex-wrap gap-2">
                  {traits.map((trait, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-slate-700/50 rounded-full text-xs text-slate-300 capitalize"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Soul Ring */}
              <SoulRing percentage={soulScore} size={70} strokeWidth={5} />
            </div>
            
            {/* Teach Mira More */}
            {soulScore < 50 && (
              <button
                onClick={() => navigate('/soul-builder')}
                className="mt-4 w-full py-2 bg-gradient-to-r from-pink-500/20 to-purple-600/20 border border-pink-500/30 rounded-xl text-pink-400 text-sm font-medium flex items-center justify-center gap-2 hover:bg-pink-500/30 transition-all"
                data-testid="teach-mira-btn"
              >
                <Sparkles className="w-4 h-4" />
                Teach Mira more about {pet?.name}
              </button>
            )}
          </div>
        </motion.div>
        
        {/* Picks Button - Primary CTA */}
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => navigate('/mira-demo')}
          className="mt-6 w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-pink-500/30 flex items-center justify-center gap-2 hover:shadow-pink-500/50 transition-all"
          data-testid="see-picks-btn"
        >
          <Star className="w-5 h-5" />
          See Picks for {pet?.name}
        </motion.button>
        
        {/* Proactive Alerts */}
        {alerts.length > 0 && (
          <div className="mt-6">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-pink-500" />
              For {pet?.name}
            </h3>
            <div className="space-y-2">
              {alerts.map((alert) => {
                const AlertIcon = alert.icon;
                return (
                  <motion.button
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate(alert.path)}
                    className="w-full p-4 bg-slate-800/50 border border-slate-700 rounded-xl flex items-center gap-3 text-left hover:border-pink-500/50 transition-all"
                    data-testid={`alert-${alert.id}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                      <AlertIcon className="w-5 h-5 text-pink-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm">{alert.title}</p>
                      <p className="text-pink-400 text-xs">{alert.action} →</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Open Requests */}
        {openRequests.length > 0 && (
          <div className="mt-6">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Open Requests
            </h3>
            <div className="space-y-2">
              {openRequests.map((request) => (
                <button
                  key={request._id || request.id}
                  onClick={() => navigate(`/tickets/${request._id || request.id}`)}
                  className="w-full p-4 bg-slate-800/50 border border-slate-700 rounded-xl flex items-center gap-3 text-left hover:border-amber-500/50 transition-all"
                  data-testid={`request-${request._id || request.id}`}
                >
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm line-clamp-1">
                      {request.subject || request.title || 'Request'}
                    </p>
                    <p className="text-slate-400 text-xs">
                      {request.status || 'Pending'} • {request.pillar || 'General'}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500" />
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* What would you like to do? - Pillar Shortcuts */}
        <div className="mt-6">
          <h3 className="text-white font-semibold mb-4">
            What would you like to do for {pet?.name}?
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {PILLARS.map((pillar, index) => {
              const PillarIcon = pillar.icon;
              return (
                <motion.button
                  key={pillar.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => navigate(pillar.path)}
                  className="flex flex-col items-center p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-pink-500/50 transition-all"
                  data-testid={`pillar-${pillar.id}`}
                >
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${pillar.color} flex items-center justify-center mb-2`}>
                    <PillarIcon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-white text-sm font-medium">{pillar.name}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Talk to Mira FAB */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/mira-demo')}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg shadow-pink-500/50 flex items-center justify-center"
          data-testid="talk-to-mira-fab"
        >
          <MessageCircle className="w-7 h-7 text-white" />
        </motion.button>
      </div>
      
      {/* Bottom padding for FAB */}
      <div className="h-24" />
    </div>
  );
};

export default PetHomePage;
