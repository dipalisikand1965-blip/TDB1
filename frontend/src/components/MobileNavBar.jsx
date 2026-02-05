/**
 * MobileNavBar - Premium Bottom Navigation
 * The heart of Pet Life OS mobile experience
 * 
 * Features:
 * - Glass morphism floating bar
 * - Center Mira FAB button (pillar-aware)
 * - "My Pet" link for pet-centric navigation
 * - Micro-animations & haptic feedback
 * - Touch-optimized for mobile devices
 */

import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Crown, Package, PawPrint, Sparkles, Cake, UtensilsCrossed, Hotel, Plane, Heart, Gamepad2, Dumbbell, GraduationCap, FileText, MessageCircle, AlertTriangle, Rainbow, Dog, ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Pillar-specific Mira configurations
const PILLAR_MIRA_CONFIG = {
  celebrate: { icon: '🎂', color: 'from-pink-500 to-rose-500', label: 'Party' },
  dine: { icon: '🍽️', color: 'from-orange-500 to-amber-500', label: 'Dine' },
  stay: { icon: '🏨', color: 'from-blue-500 to-indigo-500', label: 'Stay' },
  travel: { icon: '✈️', color: 'from-cyan-500 to-blue-500', label: 'Travel' },
  care: { icon: '💊', color: 'from-green-500 to-emerald-500', label: 'Care' },
  enjoy: { icon: '🎾', color: 'from-yellow-500 to-orange-500', label: 'Play' },
  fit: { icon: '🏃', color: 'from-red-500 to-rose-500', label: 'Fit' },
  learn: { icon: '🎓', color: 'from-purple-500 to-violet-500', label: 'Learn' },
  paperwork: { icon: '📄', color: 'from-slate-500 to-gray-500', label: 'Docs' },
  advisory: { icon: '📋', color: 'from-teal-500 to-cyan-500', label: 'Advice' },
  emergency: { icon: '🚨', color: 'from-red-600 to-red-500', label: 'Help' },
  farewell: { icon: '🌈', color: 'from-indigo-500 to-purple-500', label: 'Memory' },
  adopt: { icon: '🐾', color: 'from-amber-500 to-yellow-500', label: 'Adopt' },
  shop: { icon: '🛒', color: 'from-emerald-500 to-green-500', label: 'Shop' },
  general: { icon: '✨', color: 'from-purple-500 to-pink-500', label: 'Mira' },
};

const MobileNavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  
  // Detect current pillar from URL path
  const currentPillar = useMemo(() => {
    const path = location.pathname;
    const pillarMap = {
      '/care': 'care',
      '/celebrate': 'celebrate',
      '/stay': 'stay',
      '/travel': 'travel',
      '/dine': 'dine',
      '/fit': 'fit',
      '/enjoy': 'enjoy',
      '/learn': 'learn',
      '/paperwork': 'paperwork',
      '/advisory': 'advisory',
      '/emergency': 'emergency',
      '/farewell': 'farewell',
      '/adopt': 'adopt',
      '/shop': 'shop',
      '/services': 'services',
    };
    
    for (const [pathPrefix, pillar] of Object.entries(pillarMap)) {
      if (path === pathPrefix || path.startsWith(pathPrefix + '/')) {
        return pillar;
      }
    }
    return 'general';
  }, [location.pathname]);
  
  // Get Mira config for current pillar
  const miraConfig = PILLAR_MIRA_CONFIG[currentPillar] || PILLAR_MIRA_CONFIG.general;
  
  const navItems = [
    { id: 'home', icon: Home, label: 'Home', path: '/' },
    { id: 'care', icon: Crown, label: 'Care', path: '/services' },
    { id: 'mira', icon: Sparkles, label: miraConfig.label, isMira: true },
    { id: 'orders', icon: Package, label: 'Orders', path: '/dashboard?tab=orders' },
    { 
      id: 'mypet', 
      icon: PawPrint, 
      label: 'My Pet', 
      // Goes to Pet Soul / Dashboard - the user's pet profile
      path: isAuthenticated ? '/dashboard' : '/membership',
      isPillarAware: true // This icon changes color per pillar
    },
  ];
  
  const isActive = (path) => {
    if (!path) return false;
    const basePath = path.split('?')[0];
    if (basePath === '/') {
      return location.pathname === '/';
    }
    return location.pathname === basePath || location.pathname.startsWith(basePath);
  };
  
  const handleNavClick = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Haptic feedback for all clicks
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
    
    if (item.isMira) {
      // Open Mira AI chat with current pillar context
      window.dispatchEvent(new CustomEvent('openMiraAI', { 
        detail: { pillar: currentPillar, source: 'mobile_nav' }
      }));
      return;
    }
    
    if (item.opensSidebar) {
      // Open the pet sidebar menu
      window.dispatchEvent(new CustomEvent('openPetSidebar'));
      return;
    }
    
    navigate(item.path);
  };
  
  return (
    <div className="mobile-nav-container md:hidden" style={{ touchAction: 'manipulation' }}>
      <nav className="mobile-nav-bar relative" role="navigation" aria-label="Mobile navigation">
        {navItems.map((item, index) => {
          if (item.isMira) {
            return (
              <button
                key={item.id}
                type="button"
                onClick={(e) => handleNavClick(e, item)}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  handleNavClick(e, item);
                }}
                className="mira-fab"
                aria-label={`Open Mira AI - ${miraConfig.label}`}
                data-testid="mobile-mira-fab"
                style={{
                  background: `linear-gradient(135deg, var(--tw-gradient-from) 0%, var(--tw-gradient-to) 100%)`,
                  boxShadow: `0 0 20px rgba(147, 51, 234, 0.5)`,
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {/* Show pillar-specific emoji icon */}
                <span className="text-xl">{miraConfig.icon}</span>
              </button>
            );
          }
          
          return (
            <button
              key={item.id}
              type="button"
              onClick={(e) => handleNavClick(e, item)}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleNavClick(e, item);
              }}
              className={`mobile-nav-item ${isActive(item.path) ? 'active' : ''} ${item.isPillarAware && currentPillar !== 'general' ? 'pillar-colored' : ''}`}
              style={{ 
                animationDelay: `${index * 50}ms`,
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                ...(item.isPillarAware && currentPillar !== 'general' ? {
                  '--pillar-color': miraConfig.color.includes('pink') ? '#EC4899' : 
                                   miraConfig.color.includes('orange') ? '#F97316' :
                                   miraConfig.color.includes('blue') ? '#3B82F6' :
                                   miraConfig.color.includes('green') ? '#10B981' :
                                   miraConfig.color.includes('red') ? '#EF4444' :
                                   miraConfig.color.includes('purple') ? '#8B5CF6' :
                                   miraConfig.color.includes('yellow') ? '#F59E0B' :
                                   miraConfig.color.includes('teal') ? '#14B8A6' :
                                   miraConfig.color.includes('cyan') ? '#06B6D4' :
                                   '#9333EA'
                } : {})
              }}
              data-testid={`mobile-nav-${item.id}`}
              aria-label={item.label}
            >
              <item.icon className={`nav-icon ${item.isPillarAware && currentPillar !== 'general' ? 'text-current' : ''}`} 
                style={item.isPillarAware && currentPillar !== 'general' ? { color: 'var(--pillar-color)' } : {}}
              />
              <span className="nav-label" style={item.isPillarAware && currentPillar !== 'general' ? { color: 'var(--pillar-color)' } : {}}>{item.label}</span>
            </button>
          );
        })}
      </nav>
      
      {/* Pillar indicator - subtle text below Mira FAB */}
      {currentPillar !== 'general' && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] text-purple-400 font-medium uppercase tracking-wider pointer-events-none">
          {currentPillar}
        </div>
      )}
    </div>
  );
};

export default MobileNavBar;
