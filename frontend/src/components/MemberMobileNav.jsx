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
  FileText,
  Stethoscope,
  FileCheck,
  AlertTriangle,
  Music,
  HeartHandshake,
  Flower2,
  Dog
} from 'lucide-react';

const MemberMobileNav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Hide on admin, login, register pages - these have their own navigation
  const hiddenPaths = ['/admin', '/login', '/register', '/forgot-password', '/agent'];
  const shouldHide = hiddenPaths.some(path => location.pathname.startsWith(path));
  
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
        { path: '/care', label: 'Care', icon: Heart },
        { path: '/stay', label: 'Stay', icon: Hotel },
        { path: '/travel', label: 'Travel', icon: Plane },
        { path: '/fit', label: 'Fit', icon: Dumbbell },
        { path: '/learn', label: 'Learn', icon: GraduationCap },
        { path: '/enjoy', label: 'Enjoy', icon: Music },
        { path: '/advisory', label: 'Advisory', icon: Stethoscope },
        { path: '/paperwork', label: 'Paperwork', icon: FileCheck },
        { path: '/emergency', label: 'Emergency', icon: AlertTriangle },
        { path: '/adopt', label: 'Adopt', icon: Dog },
        { path: '/farewell', label: 'Farewell', icon: Flower2 },
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
        <div className="p-4 space-y-4 pb-24">
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
                      className={`w-full flex items-center gap-4 p-4 min-h-[52px] rounded-xl text-left transition-all touch-manipulation active:scale-95 ${
                        getColorClasses(section.color, isActive)
                      }`}
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
