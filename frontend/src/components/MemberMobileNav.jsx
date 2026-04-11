/**
 * MemberMobileNav.jsx - Collapsible paw-print sidebar for member-facing pages
 * 
 * Features:
 * - Paw print toggle button on left side of screen (mobile only)
 * - Slides out navigation drawer with all pillar pages
 * - Easy one-tap navigation between pillars
 * - Mirrors the Admin panel sidebar pattern
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../utils/api';
import { 
  PawPrint, 
  X, 
  Home,
  UtensilsCrossed,
  Heart,
  Plane,
  Hotel,
  PartyPopper,
  Dumbbell,
  GraduationCap,
  ShoppingBag,
  Sparkles,
  User,
  Phone,
  HelpCircle,
  FileText,
  Stethoscope,
  FileCheck,
  AlertTriangle,
  Music,
  HeartHandshake,
  Flower2,
  Dog,
  ChevronRight,
  Check
} from 'lucide-react';

const MemberMobileNav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [pets, setPets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useAuth();
  
  // Debug: Log component mount
  console.log('[MemberMobileNav] Component rendering, pathname:', location.pathname);
  
  // Hide only on admin, login, register pages - these have their own navigation
  const hiddenPaths = ['/admin', '/login', '/register', '/forgot-password', '/agent'];
  const shouldHide = hiddenPaths.some(path => location.pathname.startsWith(path));
  
  // Fetch user's pets
  useEffect(() => {
    if (user && token) {
      const fetchPets = async () => {
        try {
          const res = await fetch(`${API_URL}/api/pets`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setPets(data.pets || []);
            // Get stored selected pet
            const storedPetId = localStorage.getItem('selectedPetId');
            if (storedPetId) {
              setSelectedPetId(storedPetId);
            } else if (data.pets?.length > 0) {
              setSelectedPetId(data.pets[0].id);
            }
          }
        } catch (e) {
          console.error('[MemberMobileNav] Failed to fetch pets:', e);
        }
      };
      fetchPets();
    }
  }, [user, token]);
  
  // Handle pet selection
  const handlePetSelect = (pet) => {
    setSelectedPetId(pet.id);
    localStorage.setItem('selectedPetId', pet.id);
    localStorage.setItem('selectedPetName', pet.name || '');
    localStorage.setItem('selectedPetBreed', pet.breed || '');
    
    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('petSelectionChanged', { 
      detail: { 
        petId: pet.id, 
        petName: pet.name || '', 
        petBreed: pet.breed || '',
        pet: pet 
      } 
    }));
    
    // Navigate to pet home with selected pet
    navigate(`/pet-home?pet=${pet.id}`);
    setIsOpen(false);
  };
  
  // Listen for global event to open sidebar (from MobileNavBar "My Pet" button or Navbar hamburger)
  useEffect(() => {
    // Skip if we should hide
    if (shouldHide) {
      console.log('[MemberMobileNav] shouldHide=true, skipping event listeners');
      return;
    }
    
    console.log('[MemberMobileNav] Setting up event listeners');
    
    const handleOpenSidebar = (e) => {
      console.log('[MemberMobileNav] openPetSidebar event received!');
      setIsOpen(true);
    };
    
    // Add listener
    window.addEventListener('openPetSidebar', handleOpenSidebar);
    
    // Also expose a global function for debugging
    window.__openMemberMobileNav = () => {
      console.log('[MemberMobileNav] __openMemberMobileNav called!');
      setIsOpen(true);
    };
    window.__closeMemberMobileNav = () => setIsOpen(false);
    
    return () => {
      window.removeEventListener('openPetSidebar', handleOpenSidebar);
      delete window.__openMemberMobileNav;
      delete window.__closeMemberMobileNav;
    };
  }, [shouldHide]);
  
  // Close sidebar on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);
  
  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen && !shouldHide) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, shouldHide]);
  
  // Don't render on hidden paths - must be after all hooks
  if (shouldHide) {
    return null;
  }

  const handleNavigate = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  // Navigation items organized by category
  const navSections = [
    {
      title: 'Main',
      color: 'purple',
      items: [
        { path: '/', label: 'Home', icon: Home },
        { path: '/shop', label: 'Shop', icon: ShoppingBag },
        { path: '/services', label: 'Services', icon: Sparkles },
      ]
    },
    {
      title: 'Life Pillars',
      color: 'teal',
      items: [
        { path: '/celebrate', label: 'Celebrate', icon: PartyPopper },
        { path: '/dine', label: 'Dine', icon: UtensilsCrossed },
        { path: '/go', label: 'Go', icon: Plane },
        { path: '/care', label: 'Care', icon: Heart },
        { path: '/play', label: 'Play', icon: Music },
        { path: '/learn', label: 'Learn', icon: GraduationCap },
        { path: '/paperwork', label: 'Paperwork', icon: FileCheck },
        { path: '/emergency', label: 'Emergency', icon: AlertTriangle },
        { path: '/adopt', label: 'Adopt', icon: Dog },
        { path: '/farewell', label: 'Farewell', icon: Flower2 },
        { path: '/shop', label: 'Shop', icon: PawPrint },
        { path: '/services', label: 'Services', icon: FileCheck },
      ]
    },
    {
      title: 'Account',
      color: 'blue',
      items: [
        { path: '/dashboard', label: 'My Dashboard', icon: User },
        { path: '/my-pets', label: 'My Pets', icon: PawPrint },
      ]
    },
    {
      title: 'Help',
      color: 'gray',
      items: [
        { path: '/faqs', label: 'FAQs', icon: HelpCircle },
        { path: '/contact', label: 'Contact', icon: Phone },
        { path: '/about', label: 'About', icon: FileText },
      ]
    }
  ];

  const getColorClasses = (color, isActive) => {
    const colors = {
      purple: isActive ? 'bg-purple-600 text-white' : 'hover:bg-purple-50',
      teal: isActive ? 'bg-amber-50 border-amber-400 text-amber-800' : 'hover:bg-slate-50 border-slate-200',
      blue: isActive ? 'bg-blue-600 text-white' : 'hover:bg-blue-50',
      gray: isActive ? 'bg-gray-700 text-white' : 'hover:bg-gray-100',
    };
    return colors[color] || colors.gray;
  };

  const getTitleColorClass = (color) => {
    const colors = {
      purple: 'text-purple-700',
      teal: 'text-amber-700',
      blue: 'text-blue-700',
      gray: 'text-gray-600',
    };
    return colors[color] || colors.gray;
  };

  const getBgColorClass = (color) => {
    const colors = {
      purple: 'bg-purple-50',
      teal: 'bg-amber-50',
      blue: 'bg-blue-50',
      gray: 'bg-gray-50',
    };
    return colors[color] || colors.gray;
  };

  return (
    <>
      {/* Floating Paw Toggle Button - Hidden on pages with bottom nav, shown elsewhere */}
      {/* This button is now replaced by the "My Pet" button in MobileNavBar */}
      {/* Keeping it only for tablet/intermediate sizes where bottom nav might not show */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`hidden fixed left-0 top-1/2 -translate-y-1/2 z-[9998] p-2.5 rounded-r-xl shadow-lg transition-all duration-300 ${
          isOpen 
            ? 'bg-gray-800' 
            : 'bg-gradient-to-r from-amber-600 to-amber-700'
        }`}
        data-testid="member-nav-toggle"
        aria-label="Toggle navigation menu"
      >
        <PawPrint 
          className={`w-6 h-6 text-white transition-transform duration-300 ${
            isOpen ? 'rotate-45' : ''
          }`} 
        />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-[9997] backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
          onTouchEnd={(e) => {
            e.preventDefault();
            setIsOpen(false);
          }}
          style={{ touchAction: 'manipulation' }}
          data-testid="member-nav-overlay"
        />
      )}

      {/* Slide-out Navigation Drawer */}
      <div 
        className={`fixed left-0 top-0 bottom-0 z-[9998] bg-white shadow-2xl transition-all duration-300 ease-in-out overflow-y-auto ${
          isOpen ? 'translate-x-0 w-72' : '-translate-x-full w-0'
        }`}
        style={{ WebkitOverflowScrolling: 'touch' }}
        data-testid="member-nav-drawer"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between safe-area-inset-top shadow-sm">
          <span className="font-bold text-slate-800 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:"linear-gradient(135deg,#C9973A,#1A1A2E)"}}>
              <PawPrint className="w-4 h-4 text-white" />
            </div>
            Quick Nav
          </span>
          <button
            onClick={() => setIsOpen(false)}
            onTouchEnd={(e) => {
              e.preventDefault();
              setIsOpen(false);
            }}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors touch-manipulation active:bg-slate-200"
            style={{ WebkitTapHighlightColor: 'transparent' }}
            data-testid="member-nav-close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pet Switcher Section - Only show if user has multiple pets */}
        {pets.length > 1 && (
          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
            <p className="text-xs font-bold text-purple-700 uppercase mb-3 tracking-wide flex items-center gap-2">
              <PawPrint className="w-4 h-4" />
              Switch Pet
            </p>
            <div className="space-y-2">
              {pets.map((pet) => {
                const isSelected = selectedPetId === pet.id;
                return (
                  <div
                    key={pet.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handlePetSelect(pet)}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      handlePetSelect(pet);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all touch-manipulation active:scale-95 ${
                      isSelected 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
                        : 'bg-white border border-purple-200 text-gray-800 hover:border-purple-400'
                    }`}
                    style={{ 
                      WebkitTapHighlightColor: 'transparent',
                      minHeight: '52px'
                    }}
                    data-testid={`switch-pet-${pet.name?.toLowerCase()}`}
                  >
                    <div className="flex items-center gap-3">
                      {(pet.photo || pet.photo_url) ? (
                        <img 
                          src={pet.photo || pet.photo_url} 
                          alt={pet.name} 
                          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                          style={{ pointerEvents: 'none' }}
                          onError={e => { e.target.style.display='none'; }}
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isSelected ? 'bg-white/20' : 'bg-purple-100'
                        }`}>
                          <PawPrint className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-purple-500'}`} style={{ pointerEvents: 'none' }} />
                        </div>
                      )}
                      <div style={{ pointerEvents: 'none' }}>
                        <p className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-gray-900'}`}>{pet.name}</p>
                        <p className={`text-xs ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>{pet.breed || 'Good Pet'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2" style={{ pointerEvents: 'none' }}>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {Math.round(pet.overall_score || 0)}%
                      </span>
                      {isSelected && <Check className="w-5 h-5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation Sections */}
        <div className="p-4 space-y-4 pb-24" style={{ paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))' }}>
          {navSections.map((section) => (
            <div 
              key={section.title} 
              className={`${getBgColorClass(section.color)} rounded-xl p-4`}
            >
              <p className={`text-xs font-bold ${getTitleColorClass(section.color)} uppercase mb-3 tracking-wide`}>
                {section.title}
              </p>
              <div className="space-y-2">
                {section.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavigate(item.path)}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        handleNavigate(item.path);
                      }}
                      className={`w-full flex items-center gap-4 p-4 min-h-[52px] rounded-xl text-left transition-all touch-manipulation active:scale-95 ${
                        getColorClasses(section.color, isActive)
                      }`}
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                      data-testid={`mobile-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="text-base font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Ask Mira CTA */}
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-4">
            <p className="text-xs font-bold text-purple-700 uppercase mb-3">Need Help?</p>
            <button
              onClick={() => {
                handleNavigate('/mira');
              }}
              className="w-full flex items-center justify-center gap-3 p-4 min-h-[56px] bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold text-base shadow-lg hover:shadow-xl transition-all touch-manipulation active:scale-95"
              data-testid="nav-ask-mira"
            >
              <Sparkles className="w-5 h-5" />
              Ask Mira AI
            </button>
            
            {/* WhatsApp Button */}
            <a
              href="https://wa.me/919152589172?text=Hi%20Doggy%20Company!"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-3 p-4 min-h-[56px] mt-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold text-base shadow-lg hover:shadow-xl transition-all touch-manipulation active:scale-95"
              data-testid="nav-whatsapp"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp Us
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default MemberMobileNav;
