import React from 'react';

// The Doggy Company Logo Component
// Uses the official brand logo image with paw icon and "the doggy company" text

const LOGO_URL = '/doggy-logo-transparent.png';

const Logo = ({ 
  size = 'default', 
  showText = true, // Not used since logo image contains text
  variant = 'full',
  className = '' 
}) => {
  // Size configurations - height includes space for the text in the logo
  const sizes = {
    xs: { img: 'h-10' },
    sm: { img: 'h-12' },  // 48px - good for navbar
    default: { img: 'h-14' },  // 56px
    lg: { img: 'h-16' },  // 64px
    xl: { img: 'h-24' },  // 96px - for hero sections
  };

  const config = sizes[size] || sizes.default;

  // Icon only variant - just the logo image (same as full since image contains everything)
  if (variant === 'icon') {
    return (
      <div className={`relative ${className}`}>
        <img 
          src={LOGO_URL} 
          alt="The Doggy Company" 
          className={`${config.img} w-auto object-contain`}
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center ${className}`} data-testid="logo">
      {/* Logo Image - contains both paw icon and "the doggy company" text */}
      <img 
        src={LOGO_URL} 
        alt="The Doggy Company" 
        className={`${config.img} w-auto object-contain`}
      />
    </div>
  );
};

// Compact single-line version - same as main Logo since image has text
export const LogoCompact = ({ size = 'default', className = '' }) => {
  const sizes = {
    xs: { img: 'h-8' },
    sm: { img: 'h-10' },
    default: { img: 'h-12' },
    lg: { img: 'h-14' },
  };

  const config = sizes[size] || sizes.default;

  return (
    <div className={`flex items-center gap-2 ${className}`} data-testid="logo-compact">
      <img 
        src={LOGO_URL} 
        alt="The Doggy Company" 
        className={`${config.img} w-auto object-contain`}
      />
    </div>
  );
};

// White version for dark backgrounds - uses filter to make logo visible on dark backgrounds
export const LogoWhite = ({ size = 'default', showText = true, className = '' }) => {
  const sizes = {
    xs: { img: 'h-8' },
    sm: { img: 'h-10' },
    default: { img: 'h-12' },
    lg: { img: 'h-14' },
  };

  const config = sizes[size] || sizes.default;

  return (
    <div className={`flex items-center ${className}`} data-testid="logo-white">
      <img 
        src={LOGO_URL} 
        alt="The Doggy Company" 
        className={`${config.img} w-auto object-contain brightness-0 invert`}
      />
    </div>
  );
};

export default Logo;
