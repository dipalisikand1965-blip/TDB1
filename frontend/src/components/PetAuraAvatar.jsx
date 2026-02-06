/**
 * PetAuraAvatar.jsx
 * A magical, glowing avatar that shows the pet's soul/personality
 * Creates emotional connection by visualizing the pet's "soul energy"
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, Heart, Star, Crown, Zap, Coffee, Smile, Sun, Moon } from 'lucide-react';

// Soul personality types and their visual properties
const SOUL_PERSONALITIES = {
  energetic: {
    gradient: 'from-amber-400 via-orange-500 to-red-500',
    glowColor: 'rgba(251, 146, 60, 0.6)',
    pulseSpeed: '1.5s',
    icon: Zap,
    emoji: '⚡',
    message: 'Full of energy!'
  },
  calm: {
    gradient: 'from-blue-400 via-cyan-500 to-teal-500',
    glowColor: 'rgba(34, 211, 238, 0.5)',
    pulseSpeed: '3s',
    icon: Coffee,
    emoji: '🧘',
    message: 'Peaceful soul'
  },
  loving: {
    gradient: 'from-pink-400 via-rose-500 to-red-400',
    glowColor: 'rgba(244, 114, 182, 0.6)',
    pulseSpeed: '2s',
    icon: Heart,
    emoji: '💕',
    message: 'So much love!'
  },
  playful: {
    gradient: 'from-violet-400 via-purple-500 to-fuchsia-500',
    glowColor: 'rgba(192, 132, 252, 0.6)',
    pulseSpeed: '1.8s',
    icon: Smile,
    emoji: '🎾',
    message: 'Ready to play!'
  },
  royal: {
    gradient: 'from-amber-300 via-yellow-400 to-amber-500',
    glowColor: 'rgba(251, 191, 36, 0.6)',
    pulseSpeed: '2.5s',
    icon: Crown,
    emoji: '👑',
    message: 'Royal treatment'
  },
  wise: {
    gradient: 'from-indigo-400 via-purple-500 to-violet-600',
    glowColor: 'rgba(139, 92, 246, 0.5)',
    pulseSpeed: '3.5s',
    icon: Star,
    emoji: '🌟',
    message: 'Old soul'
  },
  sunny: {
    gradient: 'from-yellow-300 via-amber-400 to-orange-400',
    glowColor: 'rgba(252, 211, 77, 0.6)',
    pulseSpeed: '2s',
    icon: Sun,
    emoji: '☀️',
    message: 'Brings sunshine'
  },
  dreamy: {
    gradient: 'from-purple-400 via-pink-400 to-indigo-400',
    glowColor: 'rgba(196, 181, 253, 0.5)',
    pulseSpeed: '4s',
    icon: Moon,
    emoji: '🌙',
    message: 'Dreamer'
  }
};

// Determine personality from pet data
const getPersonality = (pet) => {
  if (!pet) return 'loving';
  
  const traits = (pet.soul_traits || []).map(t => t.toLowerCase());
  const breed = (pet.breed || '').toLowerCase();
  const age = pet.age_years || 3;
  
  // Check traits
  if (traits.some(t => t.includes('energy') || t.includes('active') || t.includes('playful'))) return 'energetic';
  if (traits.some(t => t.includes('calm') || t.includes('gentle') || t.includes('relax'))) return 'calm';
  if (traits.some(t => t.includes('love') || t.includes('cuddle') || t.includes('affection'))) return 'loving';
  if (traits.some(t => t.includes('play') || t.includes('fun') || t.includes('happy'))) return 'playful';
  if (traits.some(t => t.includes('royal') || t.includes('regal') || t.includes('elegant'))) return 'royal';
  
  // Check breed associations
  if (breed.includes('retriever') || breed.includes('lab')) return 'energetic';
  if (breed.includes('shih') || breed.includes('maltese')) return 'royal';
  if (breed.includes('pug') || breed.includes('bulldog')) return 'calm';
  if (breed.includes('beagle') || breed.includes('terrier')) return 'playful';
  if (breed.includes('german') || breed.includes('husky')) return 'wise';
  
  // Check age
  if (age < 2) return 'playful';
  if (age > 8) return 'wise';
  
  return 'loving';
};

const PetAuraAvatar = ({ 
  pet, 
  size = 'md', 
  showName = true,
  showMessage = true,
  showGlow = true,
  animate = true,
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [sparklePositions, setSparklePositions] = useState([]);
  
  const personality = useMemo(() => getPersonality(pet), [pet]);
  const config = SOUL_PERSONALITIES[personality];
  const Icon = config.icon;
  
  // Size configurations
  const sizes = {
    sm: { container: 'w-12 h-12', image: 'w-10 h-10', glow: '60px', name: 'text-xs', icon: 'w-3 h-3' },
    md: { container: 'w-20 h-20', image: 'w-16 h-16', glow: '100px', name: 'text-sm', icon: 'w-4 h-4' },
    lg: { container: 'w-28 h-28', image: 'w-24 h-24', glow: '140px', name: 'text-base', icon: 'w-5 h-5' },
    xl: { container: 'w-36 h-36', image: 'w-32 h-32', glow: '180px', name: 'text-lg', icon: 'w-6 h-6' },
    hero: { container: 'w-48 h-48', image: 'w-44 h-44', glow: '240px', name: 'text-xl', icon: 'w-8 h-8' }
  };
  
  const sizeConfig = sizes[size] || sizes.md;
  
  // Generate random sparkle positions
  useEffect(() => {
    if (!animate) return;
    
    const generateSparkles = () => {
      const positions = [];
      for (let i = 0; i < 5; i++) {
        positions.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          delay: Math.random() * 2,
          duration: 1 + Math.random() * 2
        });
      }
      setSparklePositions(positions);
    };
    
    generateSparkles();
    const interval = setInterval(generateSparkles, 4000);
    return () => clearInterval(interval);
  }, [animate]);
  
  const petImage = pet?.image || pet?.photo || `https://api.dicebear.com/7.x/thumbs/svg?seed=${pet?.name || 'pet'}&backgroundColor=transparent`;
  
  return (
    <div 
      className={`relative flex flex-col items-center ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid="pet-aura-avatar"
    >
      {/* Outer Glow Ring */}
      {showGlow && (
        <div 
          className={`absolute rounded-full transition-all duration-500 ${animate ? 'animate-pulse' : ''}`}
          style={{
            width: sizeConfig.glow,
            height: sizeConfig.glow,
            background: `radial-gradient(circle, ${config.glowColor} 0%, transparent 70%)`,
            filter: 'blur(10px)',
            transform: isHovered ? 'scale(1.2)' : 'scale(1)',
            animationDuration: config.pulseSpeed,
            zIndex: 0
          }}
        />
      )}
      
      {/* Animated Sparkles */}
      {animate && sparklePositions.map(sparkle => (
        <Sparkles
          key={sparkle.id}
          className="absolute text-white/80 pointer-events-none"
          style={{
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
            width: '12px',
            height: '12px',
            animation: `twinkle ${sparkle.duration}s ease-in-out infinite`,
            animationDelay: `${sparkle.delay}s`,
            zIndex: 10
          }}
        />
      ))}
      
      {/* Avatar Container with Gradient Border */}
      <div 
        className={`relative ${sizeConfig.container} rounded-full p-1 bg-gradient-to-br ${config.gradient} shadow-lg transition-transform duration-300 ${isHovered ? 'scale-110' : 'scale-100'}`}
        style={{ zIndex: 5 }}
      >
        {/* Inner Avatar */}
        <div className={`${sizeConfig.image} rounded-full overflow-hidden bg-white ring-2 ring-white shadow-inner`}>
          <img 
            src={petImage}
            alt={pet?.name || 'Pet'}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://api.dicebear.com/7.x/thumbs/svg?seed=${pet?.name || 'pet'}&backgroundColor=transparent`;
            }}
          />
        </div>
        
        {/* Personality Icon Badge */}
        <div 
          className={`absolute -bottom-1 -right-1 p-1.5 rounded-full bg-gradient-to-br ${config.gradient} shadow-md border-2 border-white`}
        >
          <Icon className={`${sizeConfig.icon} text-white`} />
        </div>
      </div>
      
      {/* Pet Name */}
      {showName && pet?.name && (
        <div className={`mt-2 font-bold ${sizeConfig.name} text-gray-900 flex items-center gap-1`}>
          <span>{pet.name}</span>
          <span>{config.emoji}</span>
        </div>
      )}
      
      {/* Soul Message */}
      {showMessage && (
        <p className="text-xs text-gray-500 mt-0.5">{config.message}</p>
      )}
      
      {/* CSS for sparkle animation */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default PetAuraAvatar;
