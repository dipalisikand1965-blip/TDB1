/**
 * MobileNavBar - Premium Bottom Navigation
 * The heart of Pet Life OS mobile experience
 * 
 * Features:
 * - Glass morphism floating bar
 * - Center Pulse FAB button
 * - Micro-animations & haptic feedback
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Crown, Package, User, Zap, PawPrint, Sparkles } from 'lucide-react';

const MobileNavBar = ({ onPulseClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const navItems = [
    { id: 'home', icon: Home, label: 'Home', path: '/dashboard' },
    { id: 'services', icon: Crown, label: 'Services', path: '/care' },
    { id: 'pulse', icon: Zap, label: 'Pulse', isPulse: true },
    { id: 'orders', icon: Package, label: 'Orders', path: '/dashboard?tab=orders' },
    { id: 'profile', icon: User, label: 'Profile', path: '/dashboard?tab=settings' },
  ];
  
  const isActive = (path) => {
    if (!path) return false;
    const basePath = path.split('?')[0];
    return location.pathname === basePath;
  };
  
  const handleNavClick = (item) => {
    if (item.isPulse) {
      onPulseClick?.();
      return;
    }
    navigate(item.path);
  };
  
  return (
    <div className="mobile-nav-container md:hidden">
      <nav className="mobile-nav-bar relative">
        {navItems.map((item, index) => {
          if (item.isPulse) {
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                className="pulse-fab animate-pulse-glow"
                aria-label="Open Pulse Assistant"
              >
                <Zap className="w-7 h-7" strokeWidth={2.5} />
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
