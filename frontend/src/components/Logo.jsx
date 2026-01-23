import React from 'react';

// The Doggy Company Logo Component
// Paw icon with company name on the side

const LOGO_URL = '/doggy-logo-transparent.png';

const Logo = ({ 
  size = 'default', 
  showText = true,
  variant = 'full',
  className = '' 
}) => {
  // Size configurations
  const sizes = {
    xs: { img: 'h-6 w-6', text: 'text-xs', subtext: 'text-[10px]', container: 'gap-1.5' },
    sm: { img: 'h-8 w-8', text: 'text-sm', subtext: 'text-xs', container: 'gap-2' },
    default: { img: 'h-10 w-10', text: 'text-base', subtext: 'text-sm', container: 'gap-2' },
    lg: { img: 'h-12 w-12', text: 'text-lg', subtext: 'text-base', container: 'gap-3' },
    xl: { img: 'h-16 w-16', text: 'text-xl', subtext: 'text-lg', container: 'gap-3' },
  };

  const config = sizes[size] || sizes.default;

  // Icon only variant - just the paw
  if (variant === 'icon') {
    return (
      <div className={`relative ${className}`}>
        <img 
          src={LOGO_URL} 
          alt="The Doggy Company" 
          className={`${config.img} object-contain object-top`}
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center ${config.container} ${className}`} data-testid="logo">
      {/* Paw Icon */}
      <img 
        src={LOGO_URL} 
        alt="The Doggy Company" 
        className={`${config.img} object-contain object-top flex-shrink-0`}
      />
      
      {/* Company Name on the side */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={`${config.text} font-bold`}>
            <span className="text-cyan-500">the</span>
            <span className="text-amber-500">doggy</span>
          </span>
          <span className={`${config.subtext} font-bold text-purple-600 -mt-0.5`}>
            company<sup className="text-[0.6em] ml-0.5">®</sup>
          </span>
        </div>
      )}
    </div>
  );
};

// Compact single-line version
export const LogoCompact = ({ size = 'default', className = '' }) => {
  const sizes = {
    xs: { img: 'h-5 w-5', text: 'text-xs' },
    sm: { img: 'h-6 w-6', text: 'text-sm' },
    default: { img: 'h-8 w-8', text: 'text-base' },
    lg: { img: 'h-10 w-10', text: 'text-lg' },
  };

  const config = sizes[size] || sizes.default;

  return (
    <div className={`flex items-center gap-2 ${className}`} data-testid="logo-compact">
      <img 
        src={LOGO_URL} 
        alt="The Doggy Company" 
        className={`${config.img} object-contain object-top`}
      />
      <span className={`${config.text} font-bold`}>
        <span className="text-cyan-500">the</span>
        <span className="text-amber-500">doggy</span>
        <span className="text-purple-600"> company</span>
        <sup className="text-[0.6em] text-purple-600">®</sup>
      </span>
    </div>
  );
};

// White version for dark backgrounds
export const LogoWhite = ({ size = 'default', showText = true, className = '' }) => {
  const sizes = {
    xs: { img: 'h-6 w-6', text: 'text-xs', subtext: 'text-[10px]', container: 'gap-1.5' },
    sm: { img: 'h-8 w-8', text: 'text-sm', subtext: 'text-xs', container: 'gap-2' },
    default: { img: 'h-10 w-10', text: 'text-base', subtext: 'text-sm', container: 'gap-2' },
    lg: { img: 'h-12 w-12', text: 'text-lg', subtext: 'text-base', container: 'gap-3' },
  };

  const config = sizes[size] || sizes.default;

  return (
    <div className={`flex items-center ${config.container} ${className}`} data-testid="logo-white">
      <img 
        src={LOGO_URL} 
        alt="The Doggy Company" 
        className={`${config.img} object-contain object-top brightness-0 invert`}
      />
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={`${config.text} font-bold text-white`}>
            thedoggy
          </span>
          <span className={`${config.subtext} font-bold text-white/90 -mt-0.5`}>
            company<sup className="text-[0.6em] ml-0.5">®</sup>
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
