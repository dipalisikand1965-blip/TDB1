/**
 * MobileNavBar - Premium Bottom Navigation
 * The heart of Pet Life OS mobile experience
 * 
 * Features:
 * - Glass morphism floating bar
 * - Center Mira FAB button (replaced Pulse)
 * - Micro-animations & haptic feedback
 * - Touch-optimized for mobile devices
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Crown, Package, User, Sparkles } from 'lucide-react';

const MobileNavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const navItems = [
    { id: 'home', icon: Home, label: 'Home', path: '/' },
    { id: 'services', icon: Crown, label: 'Services', path: '/services' },
    { id: 'mira', icon: Sparkles, label: 'Mira', isMira: true },
    { id: 'orders', icon: Package, label: 'Orders', path: '/dashboard?tab=orders' },
    { id: 'profile', icon: User, label: 'Profile', path: '/dashboard?tab=settings' },
  ];
  
  const isActive = (path) => {
    if (!path) return false;
    const basePath = path.split('?')[0];
    if (basePath === '/') {
      return location.pathname === '/';
    }
    return location.pathname === basePath || location.pathname.startsWith(basePath);
  };
  
  // Detect current pillar from URL path
  const detectPillar = () => {
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
      const currentPillar = detectPillar();
      window.dispatchEvent(new CustomEvent('openMiraAI', { 
        detail: { pillar: currentPillar, source: 'mobile_nav' }
      }));
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
                aria-label="Open Mira AI"
                data-testid="mobile-mira-fab"
                style={{
                  background: 'linear-gradient(135deg, #9333EA 0%, #EC4899 100%)',
                  boxShadow: '0 0 20px rgba(147, 51, 234, 0.5)',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <Sparkles className="w-6 h-6 text-white" />
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
              className={`mobile-nav-item ${isActive(item.path) ? 'active' : ''}`}
              style={{ 
                animationDelay: `${index * 50}ms`,
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
              }}
              data-testid={`mobile-nav-${item.id}`}
              aria-label={item.label}
            >
              <item.icon className="nav-icon" />
              <span className="nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default MobileNavBar;
