import React from 'react';

// The Doggy Company Logo Component
// Uses the official brand logo image

const LOGO_URL = '/doggy-logo.png';

const Logo = ({ 
  size = 'default', 
  showText = true, 
  variant = 'full',
  className = '' 
}) => {
  // Size configurations
  const sizes = {
    xs: { img: 'h-6', text: 'text-sm', container: 'gap-1.5' },
    sm: { img: 'h-8', text: 'text-base', container: 'gap-2' },
    default: { img: 'h-10', text: 'text-lg', container: 'gap-2' },
    lg: { img: 'h-12', text: 'text-xl', container: 'gap-3' },
    xl: { img: 'h-16', text: 'text-2xl', container: 'gap-3' },
  };

  const config = sizes[size] || sizes.default;

  // Icon only variant - just the logo image
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
    <div className={`flex items-center ${config.container} ${className}`} data-testid="logo">
      {/* Logo Image */}
      <img 
        src={LOGO_URL} 
        alt="The Doggy Company" 
        className={`${config.img} w-auto object-contain`}
      />
      
      {/* Logo Text - only show if needed and image is small */}
      {showText && size === 'xs' && (
        <div className="flex flex-col leading-none">
          <span className={`${config.text} font-bold text-cyan-500`}>
            The Doggy
          </span>
          <span className={`${config.text} font-bold text-purple-600 -mt-0.5`}>
            Company<sup className="text-[0.5em] ml-0.5">®</sup>
          </span>
        </div>
      )}
    </div>
  );
};

// Compact single-line version
export const LogoCompact = ({ size = 'default', className = '' }) => {
  const sizes = {
    xs: { img: 'h-5' },
    sm: { img: 'h-6' },
    default: { img: 'h-8' },
    lg: { img: 'h-10' },
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

// White version for dark backgrounds - uses filter to make logo visible
export const LogoWhite = ({ size = 'default', showText = true, className = '' }) => {
  const sizes = {
    xs: { img: 'h-6', text: 'text-sm', container: 'gap-1.5' },
    sm: { img: 'h-8', text: 'text-base', container: 'gap-2' },
    default: { img: 'h-10', text: 'text-lg', container: 'gap-2' },
    lg: { img: 'h-12', text: 'text-xl', container: 'gap-3' },
  };

  const config = sizes[size] || sizes.default;

  return (
    <div className={`flex items-center ${config.container} ${className}`} data-testid="logo-white">
      <img 
        src={LOGO_URL} 
        alt="The Doggy Company" 
        className={`${config.img} w-auto object-contain brightness-0 invert`}
      />
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`${config.text} font-bold text-white`}>
            The Doggy
          </span>
          <span className={`${config.text} font-bold text-white/90 -mt-0.5`}>
            Company<sup className="text-[0.5em] ml-0.5">®</sup>
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
