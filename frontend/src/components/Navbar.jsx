import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X, Search, User, ChevronDown, ChevronUp, ChevronRight, Sparkles, PawPrint, LogOut, Mic, MicOff, Loader2, Package, Bell } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { intelligentSearch } from '../utils/unifiedApi';
import { API_URL } from '../utils/api';
import MiraSearchPanel from './MiraSearchPanel';
import NotificationBell from './Mira/NotificationBell';
import MobileMenu from './MobileMenu';

/**
 * Clean Navbar with all 14 Pillars
 * Search now routes through Mira OS for intelligent understanding
 */

const PILLARS = [
  {
    id: 'celebrate',
    name: 'Celebrate',
    icon: '🎂',
    path: '/celebrate'
  },
  {
    id: 'dine',
    name: 'Dine',
    icon: '🍽️',
    path: '/dine'
  },
  {
    id: 'go',
    name: 'Go',
    icon: '✈️',
    path: '/go'
  },
  {
    id: 'care',
    name: 'Care',
    icon: '💊',
    path: '/care'
  },
  {
    id: 'play',
    name: 'Play',
    icon: '🎾',
    path: '/play'
  },
  {
    id: 'learn',
    name: 'Learn',
    icon: '🎓',
    path: '/learn'
  },
  {
    id: 'paperwork',
    name: 'Paperwork',
    icon: '📄',
    path: '/paperwork'
  },
  {
    id: 'emergency',
    name: 'Emergency',
    icon: '🚨',
    path: '/emergency'
  },
  {
    id: 'farewell',
    name: 'Farewell',
    icon: '🌈',
    path: '/farewell'
  },
  {
    id: 'adopt',
    name: 'Adopt',
    icon: '🐾',
    path: '/adopt'
  },
  {
    id: 'shop',
    name: 'Shop',
    icon: '🛒',
    path: '/shop'
  },
  {
    id: 'services',
    name: 'Services',
    icon: '✨',
    path: '/services'
  },
];

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false); // New MobileMenu

  // Global trigger so any page can open the new mobile menu
  useEffect(() => {
    window.__openMobileMenu = () => setMenuOpen(true);
    return () => { delete window.__openMobileMenu; };
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [petSoulScore, setPetSoulScore] = useState(0);
  const [primaryPet, setPrimaryPet] = useState(null);
  const [allPets, setAllPets] = useState([]);
  const [showPetDropdown, setShowPetDropdown] = useState(false);
  const petDropdownRef = useRef(null);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showVoiceWizard, setShowVoiceWizard] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const dropdownTimeoutRef = useRef(null);
  const recognitionRef = useRef(null);
  const hamburgerRef = useRef(null);
  const userBtnRef = useRef(null);
  const cartBtnRef = useRef(null);
  const { getCartCount, setIsCartOpen } = useCart();
  const { user, token, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // iOS Safari: Attach native touch/click listeners to mobile buttons
  useEffect(() => {
    const hamburger = hamburgerRef.current;
    const userBtn = userBtnRef.current;
    const cartBtn = cartBtnRef.current;
    
    // Hamburger button handler
    const openSidebar = (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('[Navbar] Native hamburger event fired');
      setMenuOpen(true); // Open new MobileMenu
    };
    
    // User button handler - go to dashboard
    const handleUserClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('[Navbar] Native user button event fired');
      if (user) {
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
    };
    
    // Cart button handler
    const handleCartClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('[Navbar] Native cart button event fired');
      setIsCartOpen(true);
    };
    
    // Add event listeners
    if (hamburger) {
      hamburger.addEventListener('click', openSidebar, { passive: false });
      hamburger.addEventListener('touchend', openSidebar, { passive: false });
    }
    
    if (userBtn) {
      userBtn.addEventListener('click', handleUserClick, { passive: false });
      userBtn.addEventListener('touchend', handleUserClick, { passive: false });
    }
    
    if (cartBtn) {
      cartBtn.addEventListener('click', handleCartClick, { passive: false });
      cartBtn.addEventListener('touchend', handleCartClick, { passive: false });
    }
    
    return () => {
      if (hamburger) {
        hamburger.removeEventListener('click', openSidebar);
        hamburger.removeEventListener('touchend', openSidebar);
      }
      if (userBtn) {
        userBtn.removeEventListener('click', handleUserClick);
        userBtn.removeEventListener('touchend', handleUserClick);
      }
      if (cartBtn) {
        cartBtn.removeEventListener('click', handleCartClick);
        cartBtn.removeEventListener('touchend', handleCartClick);
      }
    };
  }, [user, navigate, setIsCartOpen]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setVoiceTranscript(transcript);
        
        // If final result, process the command
        if (event.results[event.results.length - 1].isFinal) {
          processVoiceCommand(transcript.trim());
        }
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        if (isListening) {
          recognitionRef.current.start(); // Keep listening
        }
      };
    }
  }, []);

  // Process voice commands - Service Wizard
  const processVoiceCommand = async (command) => {
    const lowerCommand = command.toLowerCase();
    
    // Service intent mapping - comprehensive coverage
    const serviceIntents = {
      // Care Services
      grooming: { pillar: 'care', path: '/care?type=grooming', keywords: ['groomer', 'grooming', 'haircut', 'bath', 'spa', 'nail trim'] },
      vet: { pillar: 'care', path: '/care?type=vet', keywords: ['vet', 'veterinary', 'doctor', 'checkup', 'vaccination', 'sick', 'health'] },
      walking: { pillar: 'care', path: '/care?type=walking', keywords: ['walker', 'walking', 'walk my dog', 'daily walk'] },
      sitting: { pillar: 'care', path: '/care?type=sitting', keywords: ['sitter', 'pet sitting', 'babysitter', 'day care'] },
      
      // Training
      training: { pillar: 'learn', path: '/learn', keywords: ['trainer', 'training', 'obedience', 'behavior', 'puppy class', 'learn', 'teach'] },
      
      // Go (merged Travel + Stay)
      travel: { pillar: 'go', path: '/go', keywords: ['travel', 'flight', 'taxi', 'cab', 'transport', 'trip', 'vacation', 'passport', 'relocate'] },
      boarding: { pillar: 'go', path: '/go?type=boarding', keywords: ['boarding', 'kennel', 'leave my pet', 'overnight'] },
      hotel: { pillar: 'go', path: '/go', keywords: ['hotel', 'pet hotel', 'staycation', 'vacation stay'] },
      
      // Celebrate
      cake: { pillar: 'celebrate', path: '/celebrate/cakes', keywords: ['cake', 'birthday cake', 'pupcake', 'treat'] },
      birthday: { pillar: 'celebrate', path: '/celebrate', keywords: ['birthday', 'party', 'celebration', 'celebrate', 'anniversary'] },
      
      // Dine
      food: { pillar: 'dine', path: '/dine', keywords: ['food', 'meal', 'restaurant', 'eat', 'feed', 'fresh meals', 'diet', 'nutrition'] },
      
      // Play (merged Enjoy events + Fit)
      event: { pillar: 'play', path: '/play', keywords: ['event', 'meetup', 'playdate', 'social', 'fun', 'play', 'enjoy'] },
      fitness: { pillar: 'play', path: '/play', keywords: ['fitness', 'exercise', 'weight', 'active', 'swim', 'gym', 'fit'] },
      
      // Farewell
      farewell: { pillar: 'farewell', path: '/farewell', keywords: ['farewell', 'memorial', 'cremation', 'end of life', 'rainbow bridge', 'loss'] },
      
      // Paperwork (merged Advisory)
      paperwork: { pillar: 'paperwork', path: '/paperwork', keywords: ['paperwork', 'document', 'license', 'registration', 'certificate', 'records', 'advice', 'advisory', 'consult', 'guidance'] },
      
      // Emergency
      emergency: { pillar: 'emergency', path: '/emergency', keywords: ['emergency', 'urgent', '24/7', 'ambulance', 'poison', 'accident'] },
      
      // Insure
      insurance: { pillar: 'insure', path: '/insure', keywords: ['insurance', 'insure', 'policy', 'claim', 'coverage'] },
      
      // Adopt
      adopt: { pillar: 'adopt', path: '/adopt', keywords: ['adopt', 'adoption', 'rescue', 'shelter', 'new pet', 'puppy'] },
      
      // ===== APP NAVIGATION INTENTS =====
      
      // Notifications / Bell
      notifications: { pillar: null, path: '/dashboard?tab=notifications', keywords: ['notification', 'notifications', 'bell', 'alerts', 'updates', 'remind'] },
      
      // Service Desk
      serviceDesk: { pillar: null, path: '/admin/service-desk', keywords: ['service desk', 'ticket', 'tickets', 'support', 'request', 'issue', 'complaint'] },
      
      // Unified Inbox
      inbox: { pillar: null, path: '/admin?tab=inbox', keywords: ['inbox', 'messages', 'unified inbox', 'communication', 'chat history'] },
      
      // Pet Parent / My Pets
      petParent: { pillar: null, path: '/my-pets', keywords: ['my pet', 'my pets', 'pet parent', 'pet profile', 'pet soul', 'meister', 'mojo', 'lola'] },
      
      // Dashboard
      dashboard: { pillar: null, path: '/dashboard', keywords: ['dashboard', 'my dashboard', 'home', 'account', 'profile'] },
      
      // Orders
      orders: { pillar: null, path: '/dashboard?tab=orders', keywords: ['order', 'orders', 'my orders', 'purchase', 'bought', 'tracking'] },
      
      // Cart
      cart: { pillar: null, path: '/cart', keywords: ['cart', 'basket', 'checkout', 'buy', 'purchase'] },
      
      // Shop
      shop: { pillar: null, path: '/shop', keywords: ['shop', 'store', 'product', 'products', 'buy', 'browse'] },
      
      // Celebrations
      celebrations: { pillar: null, path: '/dashboard?tab=celebrations', keywords: ['celebration', 'celebrations', 'upcoming', 'gotcha', 'anniversary'] },
      
      // Admin
      admin: { pillar: null, path: '/admin', keywords: ['admin', 'administration', 'manage', 'backend', 'control panel'] },
      
      // Mira AI
      mira: { pillar: null, path: '/mira', keywords: ['mira', 'ai', 'assistant', 'help me', 'concierge', 'talk to'] },
    };
    
    // Find matching intent
    for (const [service, config] of Object.entries(serviceIntents)) {
      for (const keyword of config.keywords) {
        if (lowerCommand.includes(keyword)) {
          // Navigate to the service page
          navigate(config.path);
          setShowVoiceWizard(false);
          setIsListening(false);
          setVoiceTranscript('');
          
          // Also send to Mira for context (only for pillar-based intents)
          if (config.pillar) {
            try {
              await fetch(`${API_URL}/api/mira/chat`, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({
                  message: command,
                  session_id: `voice-wizard-${Date.now()}`,
                  source: 'voice_wizard',
                  pillar: config.pillar
                })
              });
            } catch (err) {
              console.error('Failed to log voice command:', err);
            }
          }
          return;
        }
      }
    }
    
    // If no specific intent matched, navigate to Mira with context
    navigate(`/mira?context=${encodeURIComponent(command)}`);
    setShowVoiceWizard(false);
    setIsListening(false);
    setVoiceTranscript('');
  };

  // Toggle voice listening
  const toggleVoiceWizard = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setShowVoiceWizard(true);
      setVoiceTranscript('');
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start recognition:', err);
      }
    }
  };

  // Fetch Pet Soul score
  useEffect(() => {
    const fetchPetSoulScore = async () => {
      if (!user || !token) return;
      try {
        const res = await fetch(`${API_URL}/api/pets/my-pets`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const pets = data.pets || [];
          setAllPets(pets);
          if (pets.length > 0) {
            // Check if there's a previously selected pet
            const savedPetId = localStorage.getItem('selectedPetId');
            const savedPet = savedPetId ? pets.find(p => p?.id === savedPetId) : null;
            const selectedPet = savedPet || pets[0];
            // Null safety: ensure pet exists before accessing properties
            if (selectedPet) {
              setPrimaryPet(selectedPet);
              setPetSoulScore(Math.round(selectedPet?.overall_score || 0));
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch pet soul score:', error);
      }
    };
    fetchPetSoulScore();
  }, [user, token]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchSuggestions(false);
      }
      if (petDropdownRef.current && !petDropdownRef.current.contains(event.target)) {
        setShowPetDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch search suggestions - Universal Search (Google of the site) with ticket creation
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length < 2) {
        setSearchSuggestions([]);
        return;
      }
      try {
        // Use intelligentSearch from unified API client - creates ticket for every search
        const data = await intelligentSearch(searchQuery, {
          member_email: user?.email,
          member_name: user?.name
        });
        
        console.log('[UNIFIED FLOW] Navbar search:', {
          query: searchQuery,
          signal_ticket: data.signal?.ticket_id
        });
        
        // Combine all result types into unified suggestions
        const suggestions = [];
        
        // Add page matches first (highest priority for navigation queries)
        (data.pages || []).forEach(page => {
          suggestions.push({
            type: 'page',
            text: page.name,
            name: page.name,
            description: page.description,
            url: page.url,
            icon: page.icon,
            pilllarType: page.type
          });
        });
        
        // Add products
        (data.products || []).forEach(p => {
          suggestions.push({
            type: 'product',
            text: p.name || p.title,
            name: p.name || p.title,
            id: p.id,
            image: p.image || p.image_url || p.images?.[0],
            price: p.price || p.pricing?.base_price,
            url: p.url || `/product/${p.shopify_handle || p.handle || p.id}`,
            hasVariants: p.has_variants
          });
        });
        
        // Add events
        (data.events || []).forEach(e => {
          suggestions.push({
            type: 'event',
            text: e.name,
            name: e.name,
            description: `${e.venue_name || ''} • ${e.event_date ? new Date(e.event_date).toLocaleDateString() : ''}`,
            url: e.url,
            image: e.image,
            price: e.price
          });
        });
        
        // Add restaurants
        (data.restaurants || []).forEach(r => {
          suggestions.push({
            type: 'restaurant',
            text: r.name,
            name: r.name,
            description: `${r.cuisine || ''} • ${r.location || ''}`,
            url: r.url,
            image: r.image,
            rating: r.rating
          });
        });
        
        // Add adopt pets
        (data.adopt_pets || []).forEach(pet => {
          suggestions.push({
            type: 'adopt_pet',
            text: pet.name,
            name: pet.name,
            description: pet.description,
            url: pet.url,
            image: pet.image
          });
        });
        
        // Add FAQs
        (data.faqs || []).forEach(f => {
          suggestions.push({
            type: 'faq',
            text: f.name,
            name: f.name,
            description: f.description,
            url: f.url
          });
        });
        
        // Add Page Matches (navigation, pillars, app sections)
        (data.pages || []).forEach(p => {
          suggestions.push({
            type: p.type || 'page',
            text: p.name,
            name: p.name,
            description: p.description,
            url: p.url,
            icon: p.icon
          });
        });
        
        setSearchSuggestions(suggestions.slice(0, 10));
        setShowSearchSuggestions(suggestions.length > 0);
      } catch (error) {
        console.error('Universal search error:', error);
        setSearchSuggestions([]);
        setShowSearchSuggestions(false);
      }
    };
    const debounce = setTimeout(fetchSuggestions, 200);
    return () => clearTimeout(debounce);
  }, [searchQuery, user]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setShowSearchSuggestions(false);
    }
  };

  const openMiraAI = () => {
    // Navigate to Mira OS sandbox for full experience
    window.location.href = '/mira-os';
  };

  const handleMouseEnter = (pillarId) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setActiveDropdown(pillarId);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // ============================================
  // UPDATED: Search bar now visible on ALL pages including pillar pages
  // User requested unified search experience across the platform
  // ============================================
  // Hide "Ask Mira" navbar button on soul/pillar pages (widget FAB is shown instead)
  const isPillarPage = ['/go', '/play', '/care', '/dine', '/celebrate'].some(p => location.pathname === p || location.pathname.startsWith(p + '/'));

  // Get dropdown position class
  const getDropdownPosition = (index) => {
    if (index <= 1) return 'left-0'; // First 2 items align left
    if (index >= PILLARS.length - 2) return 'right-0'; // Last 2 items align right
    return 'left-1/2 -translate-x-1/2'; // Middle items center
  };

  return (
    <header className={`sticky top-0 bg-white shadow-sm ${isMenuOpen ? 'z-[10000]' : 'z-50'}`} style={{ WebkitOverflowScrolling: 'touch' }}>
      {/* Top Announcement Banner */}
      <div 
        className="text-center text-xs font-medium py-1.5 px-4 overflow-x-auto whitespace-nowrap"
        style={{ 
          background: 'linear-gradient(90deg, #1a0a2e, #3B0764)',
          color: 'rgba(255,255,255,0.75)',
          fontSize: '12px',
          letterSpacing: '0.05em',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        <span>✦ India's first Pet Life OS · Built in memory of Mystique · Now in early access</span>
      </div>

      {/* Main Header Row */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          {/* Mobile Layout: Hamburger | Logo (center) | Icons */}
          <div className="flex sm:hidden items-center justify-between h-14">
            {/* Left: Hamburger Menu - Opens Paw Sidebar on mobile */}
            {/* Using ref + native event listener for iOS Safari compatibility */}
            <div
              ref={hamburgerRef}
              role="button"
              tabIndex={0}
              className="p-3 -m-1 hover:bg-white/10 rounded-lg active:bg-white/20 cursor-pointer"
              style={{ 
                WebkitTapHighlightColor: 'rgba(255,255,255,0.3)',
                WebkitTouchCallout: 'none',
                WebkitUserSelect: 'none',
                touchAction: 'manipulation',
                minWidth: '48px',
                minHeight: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              data-testid="navbar-mobile-menu-btn"
              aria-label="Open navigation menu"
              onClick={() => setMenuOpen(true)}
            >
              <Menu className="w-6 h-6" style={{ pointerEvents: 'none' }} />
            </div>
            
            {/* Center: Logo + Company Name */}
            <Link to={user ? "/pet-home" : "/"} className="flex items-center gap-1.5" data-testid="navbar-logo">
              <div className="h-8 w-8 bg-white rounded-lg p-1 flex items-center justify-center">
                <img src="/logo-new.png" alt="The Doggy Company" className="h-6 w-6 object-contain" />
              </div>
              <div>
                <div className="text-xs font-bold leading-none">
                  <span className="text-teal-400">the</span>
                  <span className="text-purple-400">doggy</span>
                  <span className="text-pink-400">company</span>
                </div>
              </div>
            </Link>
            
            {/* Right: User + Cart */}
            <div className="flex items-center gap-1">
              {user ? (
                <div
                  ref={userBtnRef}
                  role="button"
                  tabIndex={0}
                  className="p-2 hover:bg-white/10 rounded-lg cursor-pointer"
                  style={{ 
                    WebkitTapHighlightColor: 'rgba(255,255,255,0.3)',
                    touchAction: 'manipulation',
                    minWidth: '44px',
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  data-testid="navbar-user-btn"
                >
                  <User className="w-5 h-5" style={{ pointerEvents: 'none' }} />
                </div>
              ) : (
                <Link 
                  to="/login" 
                  className="p-2 hover:bg-white/10 rounded-lg flex items-center justify-center"
                  style={{ 
                    WebkitTapHighlightColor: 'rgba(255,255,255,0.3)',
                    touchAction: 'manipulation',
                    minWidth: '44px',
                    minHeight: '44px'
                  }}
                  data-testid="navbar-login-btn"
                >
                  <User className="w-5 h-5" style={{ pointerEvents: 'none' }} />
                </Link>
              )}
              <div
                ref={cartBtnRef}
                role="button"
                tabIndex={0}
                className="relative p-2 hover:bg-white/10 rounded-lg cursor-pointer"
                style={{ 
                  WebkitTapHighlightColor: 'rgba(255,255,255,0.3)',
                  touchAction: 'manipulation',
                  minWidth: '44px',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                data-testid="navbar-cart-btn"
              >
                <ShoppingCart className="w-5 h-5" style={{ pointerEvents: 'none' }} />
                {getCartCount() > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-pink-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center" style={{ pointerEvents: 'none' }}>
                    {getCartCount()}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Mobile: Mira Search Bar Row — HIDDEN everywhere (Mira orb handles this) */}
          {false && !isPillarPage && (
            <div className="sm:hidden pb-3 relative z-10">
              <MiraSearchPanel 
                variant="hero"
                placeholder={primaryPet ? `Ask Mira for ${primaryPet.name}...` : "Ask Mira anything..."}
              />
            </div>
          )}
          
          {/* Desktop Layout: Logo | Search | Icons */}
          <div className="hidden sm:flex items-center h-14 gap-4">
            {/* Logo */}
            <Link to={user ? "/pet-home" : "/"} className="flex items-center gap-2 flex-shrink-0" data-testid="navbar-logo-desktop">
              <div className="h-9 w-9 bg-white rounded-lg p-1 flex items-center justify-center">
                <img src="/logo-new.png" alt="The Doggy Company" className="h-7 w-7 object-contain" />
              </div>
              <div>
                <div className="text-sm font-bold leading-none">
                  <span className="text-teal-400">the</span>
                  <span className="text-purple-400">doggy</span>
                  <span className="text-pink-400">company</span>
                </div>
                <div className="text-[10px] text-teal-400 tracking-wider">PET CONCIERGE®</div>
              </div>
            </Link>

            {/* Mira-Powered Search Bar — HIDDEN everywhere (Mira orb handles this) */}
            {false && !isPillarPage && (
              <div className="flex-1 max-w-xl">
                <MiraSearchPanel 
                  variant="navbar"
                  placeholder={primaryPet ? `Ask Mira anything for ${primaryPet.name}...` : "Ask Mira anything..."}
                />
              </div>
            )}

            {/* Legacy Voice Wizard Modal - Keep for backward compatibility */}
            <div className="hidden">
              {/* Voice Wizard Modal */}
              {showVoiceWizard && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-purple-200 p-6 z-50">
                  <div className="text-center">
                    <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 transition-all ${
                      isListening ? 'bg-red-100 animate-pulse' : 'bg-purple-100'
                    }`}>
                      {isListening ? (
                        <Mic className="w-10 h-10 text-red-500 animate-bounce" />
                      ) : (
                        <Mic className="w-10 h-10 text-purple-500" />
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {isListening ? 'Listening...' : 'Voice Service Wizard'}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {isListening ? 'Speak now: "I need a groomer" or "Book a vet"' : 'Click the mic and tell me what you need'}
                    </p>
                    
                    {/* Transcript */}
                    {voiceTranscript && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <p className="text-sm text-gray-700 italic">"{voiceTranscript}"</p>
                      </div>
                    )}
                    
                    {/* Quick Service Buttons */}
                    <div className="flex flex-wrap gap-2 justify-center">
                      <button onClick={() => processVoiceCommand('I need a groomer')} className="px-3 py-1.5 text-xs bg-pink-100 text-pink-700 rounded-full hover:bg-pink-200">Grooming</button>
                      <button onClick={() => processVoiceCommand('I need a vet')} className="px-3 py-1.5 text-xs bg-rose-100 text-rose-700 rounded-full hover:bg-rose-200">Vet Care</button>
                      <button onClick={() => processVoiceCommand('I need a trainer')} className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200">Training</button>
                      <button onClick={() => processVoiceCommand('I need boarding')} className="px-3 py-1.5 text-xs bg-emerald-100 text-emerald-700 rounded-full hover:bg-emerald-200">Boarding</button>
                      <button onClick={() => processVoiceCommand('I need a cake')} className="px-3 py-1.5 text-xs bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200">Birthday Cake</button>
                    </div>
                    
                    <button 
                      onClick={() => { setShowVoiceWizard(false); setIsListening(false); recognitionRef.current?.stop(); }}
                      className="mt-4 text-xs text-gray-500 hover:text-gray-700"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {/* Search Suggestions Dropdown - Universal Search Results */}
              {showSearchSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50 max-h-[70vh] overflow-y-auto">
                  {searchSuggestions.map((suggestion, idx) => (
                    <Link
                      key={idx}
                      to={suggestion.url || `/search?q=${encodeURIComponent(suggestion.text || suggestion.name)}`}
                      onClick={() => {
                        setShowSearchSuggestions(false);
                        setSearchQuery('');
                      }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-purple-50 border-b border-gray-100 last:border-0 group"
                    >
                      {/* Type Icon or Image */}
                      {suggestion.type === 'page' || suggestion.type === 'pillar' ? (
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          suggestion.type === 'pillar' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {suggestion.icon === 'info' && <span className="text-lg">ℹ️</span>}
                          {suggestion.icon === 'plane' && <span className="text-lg">✈️</span>}
                          {suggestion.icon === 'utensils' && <span className="text-lg">🍽️</span>}
                          {suggestion.icon === 'home' && <span className="text-lg">🏨</span>}
                          {suggestion.icon === 'heart' && <span className="text-lg">❤️</span>}
                          {suggestion.icon === 'scissors' && <span className="text-lg">✂️</span>}
                          {suggestion.icon === 'award' && <span className="text-lg">🏆</span>}
                          {suggestion.icon === 'gamepad' && <span className="text-lg">🎮</span>}
                          {suggestion.icon === 'calendar' && <span className="text-lg">📅</span>}
                          {suggestion.icon === 'star' && <span className="text-lg">⭐</span>}
                          {suggestion.icon === 'cake' && <span className="text-lg">🎂</span>}
                          {suggestion.icon === 'bowl' && <span className="text-lg">🍲</span>}
                          {suggestion.icon === 'shopping' && <span className="text-lg">🛒</span>}
                          {suggestion.icon === 'shield' && <span className="text-lg">🛡️</span>}
                          {suggestion.icon === 'book' && <span className="text-lg">📚</span>}
                          {suggestion.icon === 'lightbulb' && <span className="text-lg">💡</span>}
                          {suggestion.icon === 'alert' && <span className="text-lg">🚨</span>}
                          {suggestion.icon === 'file' && <span className="text-lg">📄</span>}
                          {suggestion.icon === 'activity' && <span className="text-lg">🏃</span>}
                          {suggestion.icon === 'stethoscope' && <span className="text-lg">🩺</span>}
                          {suggestion.icon === 'user' && <span className="text-lg">👤</span>}
                          {suggestion.icon === 'users' && <span className="text-lg">👥</span>}
                          {suggestion.icon === 'paw' && <span className="text-lg">🐾</span>}
                          {suggestion.icon === 'package' && <span className="text-lg">📦</span>}
                          {suggestion.icon === 'help' && <span className="text-lg">❓</span>}
                          {suggestion.icon === 'phone' && <span className="text-lg">📞</span>}
                          {!suggestion.icon && <span className="text-lg">📄</span>}
                        </div>
                      ) : suggestion.image ? (
                        <img src={suggestion.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          suggestion.type === 'event' ? 'bg-orange-100 text-orange-600' :
                          suggestion.type === 'restaurant' ? 'bg-red-100 text-red-600' :
                          suggestion.type === 'adopt_pet' ? 'bg-pink-100 text-pink-600' :
                          suggestion.type === 'faq' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {suggestion.type === 'event' && <span className="text-lg">📅</span>}
                          {suggestion.type === 'restaurant' && <span className="text-lg">🍽️</span>}
                          {suggestion.type === 'adopt_pet' && <span className="text-lg">🐕</span>}
                          {suggestion.type === 'faq' && <span className="text-lg">❓</span>}
                          {suggestion.type === 'product' && <span className="text-lg">🛍️</span>}
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {suggestion.name || suggestion.text}
                        </div>
                        {suggestion.description && (
                          <div className="text-xs text-gray-500 truncate">{suggestion.description}</div>
                        )}
                        {suggestion.category && !suggestion.description && (
                          <div className="text-xs text-gray-500">{suggestion.category}</div>
                        )}
                      </div>
                      
                      {/* Type badge */}
                      <div className="flex items-center gap-2">
                        {suggestion.price && suggestion.type === 'product' && (
                          <span className="text-sm font-bold text-purple-600">₹{suggestion.price.toLocaleString()}</span>
                        )}
                        {suggestion.rating && (
                          <span className="text-xs text-yellow-600 flex items-center gap-0.5">
                            ⭐ {suggestion.rating}
                          </span>
                        )}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          suggestion.type === 'page' ? 'bg-blue-100 text-blue-700' :
                          suggestion.type === 'pillar' ? 'bg-purple-100 text-purple-700' :
                          suggestion.type === 'event' ? 'bg-orange-100 text-orange-700' :
                          suggestion.type === 'restaurant' ? 'bg-red-100 text-red-700' :
                          suggestion.type === 'adopt_pet' ? 'bg-pink-100 text-pink-700' :
                          suggestion.type === 'faq' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {suggestion.type === 'page' ? 'Page' :
                           suggestion.type === 'pillar' ? 'Service' :
                           suggestion.type === 'event' ? 'Event' :
                           suggestion.type === 'restaurant' ? 'Dine' :
                           suggestion.type === 'adopt_pet' ? 'Adopt' :
                           suggestion.type === 'faq' ? 'FAQ' :
                           'Product'}
                        </span>
                      </div>
                    </Link>
                  ))}
                  
                  {/* "See all results" footer */}
                  <Link
                    to={`/search?q=${encodeURIComponent(searchQuery)}`}
                    onClick={() => {
                      setShowSearchSuggestions(false);
                      setSearchQuery('');
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 text-purple-600 font-medium text-sm hover:bg-purple-50"
                  >
                    See all results for "{searchQuery}"
                    <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
                  </Link>
                </div>
              )}
            </div>

            {/* Right Side Actions — pushed to right */}
            <div className="flex items-center gap-2 ml-auto">
              
              {/* My Requests — desktop quick link */}
              {user && (
                <Link to="/my-requests"
                  className="hidden sm:flex items-center gap-1.5 text-sm text-slate-700 hover:bg-amber-50 hover:text-amber-700 rounded-lg px-3 py-2 transition-colors border border-transparent hover:border-amber-200 cursor-pointer"
                  style={{ position: 'relative', zIndex: 10 }}
                  data-testid="navbar-my-requests">
                  <span>📋</span>
                  <span className="font-semibold">My Requests</span>
                </Link>
              )}

              {/* Account - Cleaner single-line design */}
              <Link 
                to={user ? "/dashboard" : "/login"}
                className="hidden sm:flex items-center gap-2 text-sm hover:bg-white/10 rounded-lg px-3 py-2 transition-colors"
                data-testid="navbar-account"
              >
                {user ? (
                  <>
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                      {user.name?.charAt(0) || '🐾'}
                    </div>
                    <span className="font-medium">{user.name?.split(' ')[0] || 'Dashboard'}</span>
                  </>
                ) : (
                  <>
                    <User className="w-5 h-5" />
                    <span className="font-medium">Sign In</span>
                  </>
                )}
              </Link>
              
              {/* Notification Bell - Only show for logged in users */}
              {user && (
                <NotificationBell 
                  userEmail={user?.email}
                  petId={primaryPet?.id}
                  petName={primaryPet?.name}
                  className="hidden sm:flex"
                />
              )}

              {/* Pet Soul Score - Multi-Pet Dropdown */}
              {user && allPets.length > 0 && (
                <div className="relative hidden lg:block" ref={petDropdownRef}>
                  <button 
                    onClick={() => setShowPetDropdown(!showPetDropdown)}
                    className="flex items-center gap-2 text-xs hover:bg-white/10 rounded px-2 py-1.5 transition-colors"
                    data-testid="navbar-pet-soul"
                  >
                    <div className="flex flex-col items-start">
                      <span className="text-gray-400 text-[10px]">My Pets</span>
                      <span className="font-semibold text-purple-400 flex items-center gap-1">
                        <PawPrint className="w-3 h-3" /> 
                        {primaryPet?.name || 'Select Pet'}
                      </span>
                    </div>
                    {showPetDropdown ? (
                      <ChevronUp className="w-3 h-3 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-400" />
                    )}
                  </button>
                  
                  {/* Pet Dropdown */}
                  {showPetDropdown && (
                    <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50 min-w-[200px]">
                      {/* Header */}
                      <div className="px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-100">
                        <span className="font-bold text-gray-900 text-sm">Switch Pet</span>
                      </div>
                      
                      {/* Pet List */}
                      <div className="py-1">
                        {allPets.map((pet) => (
                          <button
                            key={pet.id}
                            onClick={() => {
                              setPrimaryPet(pet);
                              setPetSoulScore(Math.round(pet?.overall_score || 0));
                              setShowPetDropdown(false);
                              // Store in localStorage for persistence
                              localStorage.setItem('selectedPetId', pet.id);
                              // Store pet name for header display
                              localStorage.setItem('selectedPetName', pet?.name || '');
                              localStorage.setItem('selectedPetBreed', pet?.breed || '');
                              // Dispatch custom event for same-window listeners (like Mira and header)
                              window.dispatchEvent(new CustomEvent('petSelectionChanged', { 
                                detail: { 
                                  petId: pet.id, 
                                  petName: pet?.name || '', 
                                  petBreed: pet?.breed || '',
                                  pet: pet 
                                } 
                              }));
                            }}
                            className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-purple-50 transition-colors ${
                              primaryPet?.id === pet.id ? 'bg-purple-50 border-l-2 border-purple-500' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-sm">
                                {pet.profile_image ? (
                                  <img src={pet.profile_image} alt={pet.name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  <PawPrint className="w-4 h-4" />
                                )}
                              </div>
                              <div className="text-left">
                                <p className="font-medium text-gray-900 text-sm">{pet.name}</p>
                                <p className="text-[10px] text-gray-500">{pet.breed || 'Pet'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 bg-purple-100 px-2 py-0.5 rounded-full">
                              <PawPrint className="w-3 h-3 text-purple-600" />
                              <span className="font-bold text-purple-600 text-xs">{Math.round(pet.overall_score || 0)}%</span>
                            </div>
                          </button>
                        ))}
                      </div>
                      
                      {/* Footer Link */}
                      <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                        <Link
                          to="/my-pets"
                          onClick={() => setShowPetDropdown(false)}
                          className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1"
                        >
                          Manage All Pets →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Ask Mira Button - HIDDEN on pillar pages (FAB is available) per doctrine */}
              {!isPillarPage && (
                <button
                  onClick={openMiraAI}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-xs font-semibold hover:from-purple-600 hover:to-pink-600 transition-all"
                  data-testid="navbar-mira-btn"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Ask Mira
                </button>
              )}

              {/* Cart - Desktop */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center gap-1 hover:bg-white/10 rounded-lg p-2"
                data-testid="navbar-cart-btn-desktop"
                aria-label="Shopping cart"
              >
                <ShoppingCart className="w-6 h-6" />
                {getCartCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {getCartCount()}
                  </span>
                )}
                <span className="text-xs font-semibold">Cart</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pillars Navigation Row - Clean text only */}
      <nav className="hidden lg:block bg-slate-800 text-white text-sm border-t border-slate-700" ref={dropdownRef}>
        <div className="max-w-7xl mx-auto px-2">
          <ul className="flex items-center justify-center">
            {PILLARS.map((pillar, index) => (
              <li 
                key={pillar.id} 
                className="relative"
              >
                <Link
                  to={pillar.path}
                  className={`flex items-center gap-1 px-3 py-2.5 font-medium ${
                    isActive(pillar.path) ? 'text-pink-400' : 'text-white/80 hover:text-pink-400'
                  }`}
                  style={{
                    borderBottom: isActive(pillar.path) ? '2px solid #f472b6' : '2px solid transparent',
                  }}
                  data-testid={`nav-${pillar.id}`}
                >
                  {pillar.name}
                </Link>

                {/* Dropdowns hidden — pillars use their own pages */}
                {false && pillar.dropdown && activeDropdown === pillar.id && (
                  <div 
                    data-testid={`dropdown-${pillar.id}`}
                    className={`absolute top-full ${getDropdownPosition(index)} w-52 shadow-2xl rounded-lg py-2 z-[9999]`}
                    style={{ 
                      minWidth: '200px',
                      backgroundColor: '#0f172a',  // slate-900 - very dark
                      border: '1px solid #334155', // slate-700
                      color: 'white'
                    }}
                    onMouseEnter={() => handleMouseEnter(pillar.id)}
                    onMouseLeave={handleMouseLeave}
                  >
                    {/* Header */}
                    <div 
                      className="px-4 py-2"
                      style={{ 
                        borderBottom: '1px solid #475569',
                        backgroundColor: 'rgba(51, 65, 85, 0.5)' // slate-700/50
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{pillar.icon}</span>
                        <span className="font-bold text-white">{pillar.name}</span>
                      </div>
                    </div>
                    {/* Items */}
                    {pillar.dropdown.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setActiveDropdown(null)}
                        className="block px-4 py-2.5 text-sm transition-colors"
                        style={{
                          color: item.highlight ? '#f9a8d4' : '#d1d5db',
                          backgroundColor: item.highlight ? 'rgba(147, 51, 234, 0.2)' : 'transparent',
                          borderLeft: item.highlight ? '2px solid #ec4899' : '2px solid transparent'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = item.highlight ? 'rgba(147, 51, 234, 0.3)' : '#334155';
                          e.target.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = item.highlight ? 'rgba(147, 51, 234, 0.2)' : 'transparent';
                          e.target.style.color = item.highlight ? '#f9a8d4' : '#d1d5db';
                        }}
                      >
                        {item.name}
                      </Link>
                    ))}
                    {/* View All Link */}
                    <div 
                      className="px-4 py-2 mt-1"
                      style={{ borderTop: '1px solid #475569' }}
                    >
                      <Link
                        to={pillar.path}
                        onClick={() => setActiveDropdown(null)}
                        className="text-xs font-semibold flex items-center gap-1"
                        style={{ color: '#f472b6' }}
                        onMouseEnter={(e) => e.target.style.color = '#fbcfe8'}
                        onMouseLeave={(e) => e.target.style.color = '#f472b6'}
                      >
                        View All {pillar.name} →
                      </Link>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Mobile Menu — NO Framer Motion (causes iOS wobble) */}
      {isMenuOpen && (
        <div
          className="lg:hidden bg-white border-t border-slate-100 shadow-xl"
          style={{ maxHeight: '85vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
        >
          <div className="px-4 py-4">

            {/* ── 1. ALL 12 PILLAR PILLS — top, always visible ─────────────── */}
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-3">Explore</p>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {PILLARS.map(pillar => (
                <Link
                  key={pillar.path}
                  to={pillar.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-colors active:scale-95 ${
                    isActive(pillar.path)
                      ? 'border-amber-400 bg-amber-50 text-amber-800'
                      : 'border-slate-100 bg-slate-50 text-slate-700 hover:bg-amber-50'
                  }`}
                  data-testid={`mobile-pillar-${pillar.id}`}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <span className="text-xl">{pillar.emoji || '🐾'}</span>
                  <span className="text-[10px] font-semibold leading-tight">{pillar.name}</span>
                </Link>
              ))}
            </div>

            {/* ── 2. ASK MIRA button ────────────────────────────────────────── */}
            <button
              onClick={() => { openMiraAI(); setIsMenuOpen(false); }}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl font-semibold text-white mb-4 active:opacity-80"
              style={{ background: 'linear-gradient(135deg,#9333EA,#EC4899)', WebkitTapHighlightColor: 'transparent' }}
            >
              <Sparkles className="w-4 h-4" />
              Ask Mira
            </button>

            <div className="border-t border-slate-100 mb-4" />

            {/* ── 3. MY PETS — expandable ────────────────────────────────────── */}
            {user ? (
              <div className="space-y-2">
                {/* Pet switcher */}
                {allPets.length > 0 && (
                  <details className="group">
                    <summary
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer list-none select-none active:bg-amber-50"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      <div className="flex items-center gap-2">
                        <PawPrint className="w-4 h-4 text-amber-600" />
                        <span className="font-bold text-slate-800 text-sm">My Pets</span>
                        {primaryPet && <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">{primaryPet.name}</span>}
                      </div>
                      <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="mt-1 space-y-1 pl-1">
                      {allPets.map((pet) => (
                        <Link
                          key={pet.id}
                          to="/pet-home"
                          onClick={() => { setCurrentPet?.(pet); setIsMenuOpen(false); }}
                          className="flex items-center justify-between px-3 py-2.5 bg-white rounded-lg border border-slate-100 hover:border-amber-300 hover:bg-amber-50 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white flex-shrink-0">
                              {pet.profile_image
                                ? <img src={pet.profile_image} alt={pet.name} className="w-full h-full object-cover" />
                                : <PawPrint className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800 text-sm">{pet.name}</p>
                              <p className="text-xs text-slate-500">{pet.breed || 'Pet'}</p>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{Math.round(pet.overall_score || 0)}%</span>
                        </Link>
                      ))}
                    </div>
                  </details>
                )}

                {/* My Requests */}
                <Link to="/my-requests" onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-amber-50 transition-colors"
                  data-testid="mobile-my-requests-link">
                  <span className="text-lg">📋</span>
                  <div>
                    <p className="font-medium text-slate-800 text-sm">My Requests</p>
                    <p className="text-xs text-slate-500">Bookings, orders & chats</p>
                  </div>
                </Link>

                {/* Sign Out */}
                <button
                  onClick={() => { logout(); setIsMenuOpen(false); navigate('/'); }}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 active:bg-slate-300"
                  data-testid="mobile-logout-btn"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link to="/login" onClick={() => setIsMenuOpen(false)}
                  className="flex-1 py-3 text-center bg-slate-900 text-white rounded-xl font-medium"
                  data-testid="mobile-signin-btn">Sign In</Link>
                <Link to="/membership" onClick={() => setIsMenuOpen(false)}
                  className="flex-1 py-3 text-center text-white rounded-xl font-medium"
                  style={{ background: 'linear-gradient(135deg,#9333EA,#EC4899)' }}
                  data-testid="mobile-join-btn">Join Now</Link>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ── New MobileMenu — glass orb, 4-col pillar grid, pet switcher ── */}
      <MobileMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        currentPet={primaryPet}
        pets={allPets}
        onPetSwitch={(pet) => { setCurrentPet?.(pet); setMenuOpen(false); }}
        userName={user?.name || user?.email}
      />

    </header>
  );
};

export default Navbar;
