import React from 'react';
import { PawPrint } from 'lucide-react';

// The Doggy Company Logo Component
// A modern, brand-aligned logo with customizable sizes

const Logo = ({ 
  size = 'default', 
  showText = true, 
  variant = 'full',
  className = '' 
}) => {
  // Size configurations
  const sizes = {
    xs: { icon: 'w-5 h-5', text: 'text-sm', container: 'gap-1.5' },
    sm: { icon: 'w-6 h-6', text: 'text-base', container: 'gap-2' },
    default: { icon: 'w-8 h-8', text: 'text-lg', container: 'gap-2' },
    lg: { icon: 'w-10 h-10', text: 'text-xl', container: 'gap-3' },
    xl: { icon: 'w-12 h-12', text: 'text-2xl', container: 'gap-3' },
  };

  const config = sizes[size] || sizes.default;

  // Icon only variant
  if (variant === 'icon') {
    return (
      <div className={`relative ${className}`}>
        <div className="relative">
          {/* Outer glow ring */}
          <div className={`absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl blur-sm opacity-50`}></div>
          {/* Main icon container */}
          <div className={`relative ${config.icon} bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg`}>
            <PawPrint className="w-2/3 h-2/3 text-white" strokeWidth={2.5} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center ${config.container} ${className}`} data-testid="logo">
      {/* Logo Icon */}
      <div className="relative flex-shrink-0">
        {/* Subtle glow effect */}
        <div className={`absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl blur-sm opacity-40`}></div>
        {/* Main icon */}
        <div className={`relative ${config.icon} bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md`}>
          <PawPrint className="w-2/3 h-2/3 text-white" strokeWidth={2.5} />
        </div>
      </div>
      
      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`${config.text} font-bold bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 bg-clip-text text-transparent`}>
            The Doggy
          </span>
          <span className={`${config.text} font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent -mt-0.5`}>
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
    xs: { icon: 'w-4 h-4', text: 'text-xs' },
    sm: { icon: 'w-5 h-5', text: 'text-sm' },
    default: { icon: 'w-6 h-6', text: 'text-base' },
    lg: { icon: 'w-7 h-7', text: 'text-lg' },
  };

  const config = sizes[size] || sizes.default;

  return (
    <div className={`flex items-center gap-2 ${className}`} data-testid="logo-compact">
      <div className={`${config.icon} bg-gradient-to-br from-purple-600 to-pink-500 rounded-lg flex items-center justify-center`}>
        <PawPrint className="w-2/3 h-2/3 text-white" strokeWidth={2.5} />
      </div>
      <span className={`${config.text} font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent`}>
        The Doggy Company<sup className="text-[0.6em]">®</sup>
      </span>
    </div>
  );
};

// White version for dark backgrounds
export const LogoWhite = ({ size = 'default', showText = true, className = '' }) => {
  const sizes = {
    xs: { icon: 'w-5 h-5', text: 'text-sm', container: 'gap-1.5' },
    sm: { icon: 'w-6 h-6', text: 'text-base', container: 'gap-2' },
    default: { icon: 'w-8 h-8', text: 'text-lg', container: 'gap-2' },
    lg: { icon: 'w-10 h-10', text: 'text-xl', container: 'gap-3' },
  };

  const config = sizes[size] || sizes.default;

  return (
    <div className={`flex items-center ${config.container} ${className}`} data-testid="logo-white">
      <div className={`${config.icon} bg-white/20 backdrop-blur rounded-xl flex items-center justify-center border border-white/30`}>
        <PawPrint className="w-2/3 h-2/3 text-white" strokeWidth={2.5} />
      </div>
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
