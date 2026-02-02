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
  FileText
} from 'lucide-react';

const MemberMobileNav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Close sidebar on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);
  
  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

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
        { path: '/dine', label: 'Dine', icon: UtensilsCrossed },
        { path: '/care', label: 'Care', icon: Heart },
        { path: '/stay', label: 'Stay', icon: Hotel },
        { path: '/travel', label: 'Travel', icon: Plane },
        { path: '/celebrate', label: 'Celebrate', icon: PartyPopper },
        { path: '/fit', label: 'Fit', icon: Dumbbell },
        { path: '/learn', label: 'Learn', icon: GraduationCap },
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
      teal: isActive ? 'bg-teal-600 text-white' : 'hover:bg-teal-50',
      blue: isActive ? 'bg-blue-600 text-white' : 'hover:bg-blue-50',
      gray: isActive ? 'bg-gray-700 text-white' : 'hover:bg-gray-100',
    };
    return colors[color] || colors.gray;
  };

  const getTitleColorClass = (color) => {
    const colors = {
      purple: 'text-purple-700',
      teal: 'text-teal-700',
      blue: 'text-blue-700',
      gray: 'text-gray-600',
    };
    return colors[color] || colors.gray;
  };

  const getBgColorClass = (color) => {
    const colors = {
      purple: 'bg-purple-50',
      teal: 'bg-teal-50',
      blue: 'bg-blue-50',
      gray: 'bg-gray-50',
    };
    return colors[color] || colors.gray;
  };

  return (
    <>
      {/* Paw Print Toggle Button - Fixed on left side, only visible on mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`md:hidden fixed left-0 top-1/2 -translate-y-1/2 z-[9998] p-2.5 rounded-r-xl shadow-lg transition-all duration-300 ${
          isOpen 
            ? 'bg-gray-800' 
            : 'bg-gradient-to-r from-teal-600 to-teal-700'
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
          className="md:hidden fixed inset-0 bg-black/40 z-[9997] backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
          data-testid="member-nav-overlay"
        />
      )}

      {/* Slide-out Navigation Drawer */}
      <div 
        className={`md:hidden fixed left-0 top-0 bottom-0 z-[9998] bg-white shadow-2xl transition-all duration-300 ease-in-out overflow-y-auto ${
          isOpen ? 'translate-x-0 w-72' : '-translate-x-full w-0'
        }`}
        data-testid="member-nav-drawer"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-teal-700 p-4 flex items-center justify-between">
          <span className="font-bold text-white flex items-center gap-2">
            <PawPrint className="w-5 h-5" />
            Quick Nav
          </span>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-white/20 rounded-lg text-white transition-colors"
            data-testid="member-nav-close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="p-3 space-y-3 pb-24">
          {navSections.map((section) => (
            <div 
              key={section.title} 
              className={`${getBgColorClass(section.color)} rounded-xl p-3`}
            >
              <p className={`text-xs font-bold ${getTitleColorClass(section.color)} uppercase mb-2 tracking-wide`}>
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavigate(item.path)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all touch-manipulation ${
                        getColorClasses(section.color, isActive)
                      }`}
                      data-testid={`mobile-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Ask Mira CTA */}
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-4">
            <p className="text-xs font-bold text-purple-700 uppercase mb-2">Need Help?</p>
            <button
              onClick={() => {
                handleNavigate('/mira');
              }}
              className="w-full flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all touch-manipulation"
              data-testid="nav-ask-mira"
            >
              <Sparkles className="w-4 h-4" />
              Ask Mira AI
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MemberMobileNav;
