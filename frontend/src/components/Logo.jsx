import React from 'react';

/**
 * Logo component for The Doggy Company
 * 
 * Features a teal serving cloche (concierge bell) with colorful paw print on top
 * Colors: Purple, Pink, Orange, Green paw pads on teal bell
 */
const Logo = ({ 
  size = 'md', 
  showText = true, 
  variant = 'default',
  className = '' 
}) => {
  // Size configurations
  const sizeConfig = {
    xs: { logo: 'h-6 w-6', text: 'text-sm', tagline: 'text-xs' },
    sm: { logo: 'h-8 w-8', text: 'text-base', tagline: 'text-xs' },
    md: { logo: 'h-12 w-12', text: 'text-xl', tagline: 'text-xs' },
    lg: { logo: 'h-16 w-16', text: 'text-2xl', tagline: 'text-sm' },
    xl: { logo: 'h-20 w-20', text: 'text-3xl', tagline: 'text-sm' }
  };
  
  const config = sizeConfig[size] || sizeConfig.md;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Icon - Teal cloche with colorful paw */}
      <img 
        src="/logo-new.png" 
        alt="The Doggy Company" 
        className={`${config.logo} object-contain`}
      />
      
      {/* Company Name - Gradient text matching logo colors */}
      {showText && (
        <div className="flex flex-col">
          <div className={`font-bold ${config.text} leading-tight tracking-tight`}>
            {variant === 'light' ? (
              <span className="text-white">thedoggycompany</span>
            ) : (
              <>
                <span className="text-orange-500">the</span>
                <span className="bg-gradient-to-r from-teal-500 to-purple-600 bg-clip-text text-transparent">doggy</span>
                <span className="text-purple-600">company</span>
              </>
            )}
          </div>
          <span className={`${config.tagline} font-medium tracking-wide ${variant === 'light' ? 'text-white/70' : 'text-gray-500'}`}>
            Pet Concierge
          </span>
        </div>
      )}
    </div>
  );
};

// Compact logo - just the icon, no text
export const LogoCompact = ({ size = 'md', className = '' }) => {
  const sizeConfig = {
    xs: 'h-6 w-6',
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };
  
  return (
    <img 
      src="/logo-new.png" 
      alt="The Doggy Company" 
      className={`${sizeConfig[size] || sizeConfig.md} object-contain ${className}`}
    />
  );
};

export default Logo;
