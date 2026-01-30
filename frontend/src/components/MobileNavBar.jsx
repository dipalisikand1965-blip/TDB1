/**
 * MobileNavBar - Premium Bottom Navigation
 * The heart of Pet Life OS mobile experience
 * 
 * Features:
 * - Glass morphism floating bar
 * - Center Mira FAB button (replaced Pulse)
 * - Micro-animations & haptic feedback
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Crown, Package, User, Sparkles } from 'lucide-react';

const MobileNavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const navItems = [
    { id: 'home', icon: Home, label: 'Home', path: '/dashboard' },
    { id: 'services', icon: Crown, label: 'Services', path: '/care' },
    { id: 'mira', icon: Sparkles, label: 'Mira', isMira: true },
    { id: 'orders', icon: Package, label: 'Orders', path: '/dashboard?tab=orders' },
    { id: 'profile', icon: User, label: 'Profile', path: '/dashboard?tab=settings' },
  ];
  
  const isActive = (path) => {
    if (!path) return false;
    const basePath = path.split('?')[0];
    return location.pathname === basePath;
  };
  
  const handleNavClick = (item) => {
    if (item.isMira) {
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      // Open Mira AI chat
      window.dispatchEvent(new CustomEvent('openMiraAI'));
      return;
    }
    navigate(item.path);
  };
  
  return (
    <div className="mobile-nav-container md:hidden">
      <nav className="mobile-nav-bar relative">
        {navItems.map((item, index) => {
          if (item.isMira) {
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                className="mira-fab"
                aria-label="Open Mira AI"
                style={{
                  background: 'linear-gradient(135deg, #9333EA 0%, #EC4899 100%)',
                  boxShadow: '0 0 20px rgba(147, 51, 234, 0.5)',
                }}
              >
                <Sparkles className="w-6 h-6 text-white" />
              </button>
            );
          }
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className={`mobile-nav-item ${isActive(item.path) ? 'active' : ''}`}
              style={{ animationDelay: `${index * 50}ms` }}
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
