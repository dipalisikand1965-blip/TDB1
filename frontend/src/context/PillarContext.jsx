/**
 * PillarContext.jsx
 * Shared context that carries personalization across Shop/Services
 * Makes the entire site feel like Meister's personal concierge
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { API_URL } from '../utils/api';

const PillarContext = createContext(null);

// Pillar-specific emotional messages for Mira
const PILLAR_MESSAGES = {
  celebrate: {
    messages: (name, breed) => [
      `Mira plans this the way ${name} would enjoy it`,
      `🎂 Is it almost ${name}'s birthday? Let's make it special!`,
      `🎉 Every day with ${name} is worth celebrating!`,
      `🎁 ${name} deserves the most pawsome party!`
    ],
    tagline: 'Mark the moments that matter to {name}'
  },
  dine: {
    messages: (name, breed) => [
      `I'll refine this as I learn what suits ${name}`,
      `🍖 ${name}'s tummy is ready for yummy!`,
      `🦴 We know ${name}'s favorite treats by heart`,
      `🥩 Premium nutrition for your precious ${name}`
    ],
    tagline: 'Chosen around {name}\'s taste, energy, and needs'
  },
  care: {
    messages: (name, breed) => [
      `Small details help ${name} feel at ease`,
      `✨ ${name}'s coat deserves the royal treatment`,
      `🛁 Spa day for ${name}? We're ready!`,
      `💕 Gentle care for your gentle ${name}`
    ],
    tagline: 'Support for health, comfort, and routine'
  },
  enjoy: {
    messages: (name, breed) => [
      `I notice what brings out ${name}'s spark`,
      `🎾 Playtime is ${name}'s favorite word!`,
      `🧸 New toys? ${name}'s tail is already wagging!`,
      `⚡ Burn that ${name} energy with the best toys`
    ],
    tagline: 'Play, enrichment, and little delights'
  },
  travel: {
    messages: (name, breed) => [
      `I'll flag what's worth planning ahead`,
      `✈️ Adventure awaits ${name}!`,
      `🚗 Road trip with ${name}? We've got you covered`,
      `🏖️ ${name}'s vacation essentials are here`
    ],
    tagline: 'Thought through so the journey feels easy'
  },
  stay: {
    messages: (name, breed) => [
      `Calm spaces make a big difference`,
      `🏠 ${name}'s cozy corner awaits`,
      `🛏️ Sweet dreams for sweet ${name}`,
      `☁️ Comfort fit for royalty like ${name}`
    ],
    tagline: 'Stays where {name} is welcome and comfortable'
  },
  fit: {
    messages: (name, breed) => [
      `Balance matters more than intensity`,
      `💪 Keep ${name} healthy & active!`,
      `🏃 Exercise time for energetic ${name}`,
      `❤️ ${name}'s wellness journey starts here`
    ],
    tagline: 'Activity that matches {name}\'s rhythm'
  },
  learn: {
    messages: (name, breed) => [
      `I adapt this to how ${name} responds`,
      `🎓 ${name} is ready to learn!`,
      `🧠 Smart ${name} deserves smart training`,
      `📚 Every dog can learn - especially ${name}!`
    ],
    tagline: 'Training and guidance that respects personality'
  },
  advisory: {
    messages: (name, breed) => [
      `I'll help you choose, not overwhelm you`,
      `💬 Expert advice for ${name}'s needs`,
      `🩺 ${name}'s health questions answered`,
      `📋 Personalized guidance for ${name}`
    ],
    tagline: 'When clarity helps before deciding'
  },
      `💡 Smart decisions for ${name}'s wellbeing`
    ],
    tagline: 'Expert guidance for {name}'
  },
  emergency: {
    messages: (name, breed) => [
      `I'll focus on what needs attention now`,
      `🚨 We're here for ${name}, always`,
      `❤️‍🩹 ${name}'s safety is our priority`,
      `🆘 24/7 support for ${name}`
    ],
    tagline: 'Immediate support when it matters most'
  },
  paperwork: {
    messages: (name, breed) => [
      `You shouldn't have to think about this`,
      `📄 ${name}'s documents, sorted!`,
      `✅ Keep ${name}'s records organized`,
      `📋 Hassle-free paperwork for ${name}`
    ],
    tagline: 'Handled quietly, without stress'
  },
  farewell: {
    messages: (name, breed) => [
      `I'll move at your pace here`,
      `🌈 Honoring ${name}'s beautiful journey`,
      `💕 ${name}'s memory lives forever`,
      `🕊️ Gentle support for difficult times`
    ],
    tagline: 'Support with dignity and care'
  },
  adopt: {
    messages: (name, breed) => [
      `The right fit matters for everyone`,
      `🐾 Ready to give another pup a home?`,
      `💕 ${name} might love a sibling!`,
      `🏠 Open your heart to another furry friend`
    ],
    tagline: 'Thoughtful matching, not impulse'
  },
  recommended: {
    messages: (name, breed) => [
      `Based on what I know so far`,
      `✨ Handpicked just for ${name}!`,
      `💕 We know what ${name} loves`,
      `🎯 Personalized picks for ${name}`
    ],
    tagline: 'Curated with love for {name}'
  },
  all: {
    messages: (name, breed) => [
      `Based on what I know so far`,
      `🛍️ Everything ${name} could ever need`,
      `✨ ${name}'s complete shopping destination`,
      `💕 Discover more for ${name}`
    ],
    tagline: 'Thoughtfully curated for how {name} lives and feels'
  },
  shop: {
    messages: (name, breed) => [
      `Based on what I know so far`,
      `🛍️ Everything ${name} could ever need`,
      `✨ ${name}'s complete shopping destination`,
      `💕 Discover more for ${name}`
    ],
    tagline: 'Thoughtfully curated for how {name} lives and feels'
  },
  services: {
    messages: (name, breed) => [
      `I'll guide you to the right support`,
      `🤝 Trusted help for ${name}`,
      `✨ Expert care for ${name}`,
      `💕 The best service providers for ${name}`
    ],
    tagline: 'Trusted help, when needed'
  }
};

// Get pillar message
export const getPillarMessage = (pillar, petName, breed) => {
  const pillarConfig = PILLAR_MESSAGES[pillar] || PILLAR_MESSAGES.all;
  const messages = pillarConfig.messages(petName || 'your pet', breed || '');
  const index = Math.floor(Date.now() / 60000) % messages.length;
  return messages[index];
};

// Get pillar tagline
export const getPillarTagline = (pillar, petName) => {
  const pillarConfig = PILLAR_MESSAGES[pillar] || PILLAR_MESSAGES.all;
  return pillarConfig.tagline.replace('{name}', petName || 'your pet');
};

export const PillarProvider = ({ children }) => {
  const { user, token } = useAuth();
  
  // State
  const [currentPet, setCurrentPet] = useState(null);
  const [pets, setPets] = useState([]);
  const [currentPillar, setCurrentPillar] = useState('recommended');
  const [viewMode, setViewMode] = useState('products'); // 'products' | 'services'
  const [shoppingForOther, setShoppingForOther] = useState(false);
  const [otherBreed, setOtherBreed] = useState(null);
  const [soulData, setSoulData] = useState(null);
  
  // Fetch pets
  useEffect(() => {
    const fetchPets = async () => {
      if (!user || !token) return;
      
      try {
        const response = await fetch(`${API_URL}/api/pets/my-pets`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          const petList = data.pets || [];
          setPets(petList);
          
          if (petList.length > 0 && !currentPet) {
            setCurrentPet(petList[0]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch pets:', err);
      }
    };
    
    fetchPets();
  }, [user, token]);
  
  // Fetch soul data for current pet
  useEffect(() => {
    const fetchSoulData = async () => {
      if (!currentPet || !token) return;
      
      try {
        const response = await fetch(`${API_URL}/api/pets/${currentPet.id}/soul`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setSoulData(data);
        }
      } catch (err) {
        console.debug('Soul data not available:', err);
      }
    };
    
    fetchSoulData();
  }, [currentPet, token]);
  
  // Computed values
  const petName = currentPet?.name || 'Your Pet';
  const petBreed = currentPet?.breed || '';
  const activePetForFiltering = shoppingForOther ? null : currentPet;
  const activeBreedForFiltering = shoppingForOther ? otherBreed : petBreed;
  
  // Pillar message
  const pillarMessage = useMemo(() => {
    return getPillarMessage(currentPillar, petName, petBreed);
  }, [currentPillar, petName, petBreed]);
  
  // Pillar tagline
  const pillarTagline = useMemo(() => {
    return getPillarTagline(currentPillar, petName);
  }, [currentPillar, petName]);
  
  const value = {
    // Pet data
    currentPet,
    setCurrentPet,
    pets,
    petName,
    petBreed,
    soulData,
    
    // Navigation
    currentPillar,
    setCurrentPillar,
    viewMode,
    setViewMode,
    
    // Other dog shopping
    shoppingForOther,
    setShoppingForOther,
    otherBreed,
    setOtherBreed,
    
    // Computed
    activePetForFiltering,
    activeBreedForFiltering,
    pillarMessage,
    pillarTagline,
    
    // Helpers
    getPillarMessage,
    getPillarTagline
  };
  
  return (
    <PillarContext.Provider value={value}>
      {children}
    </PillarContext.Provider>
  );
};

export const usePillarContext = () => {
  const context = useContext(PillarContext);
  if (!context) {
    throw new Error('usePillarContext must be used within a PillarProvider');
  }
  return context;
};

export default PillarContext;
