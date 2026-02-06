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
      `🎂 Is it almost ${name}'s birthday? Let's make it special!`,
      `🎉 Every day with ${name} is worth celebrating!`,
      `🎁 ${name} deserves the most pawsome party!`,
      `🪔 Festival time? ${name} wants treats too!`,
      `🎈 Celebration mode: activated for ${name}!`
    ],
    tagline: 'Make every moment with {name} unforgettable'
  },
  dine: {
    messages: (name, breed) => [
      `🍖 ${name}'s tummy is ready for yummy!`,
      `🦴 We know ${name}'s favorite treats by heart`,
      `🥩 Premium nutrition for your precious ${name}`,
      `🍳 Mealtime is ${name}'s favorite time!`,
      `🥕 Healthy & delicious - just how ${name} likes it`
    ],
    tagline: 'Nourishment crafted for {name}'
  },
  care: {
    messages: (name, breed) => [
      `✨ ${name}'s coat deserves the royal treatment`,
      `🛁 Spa day for ${name}? We're ready!`,
      `💅 Keep ${name} looking absolutely gorgeous`,
      `🪥 ${name}'s health is our priority`,
      `💕 Gentle care for your gentle ${name}`
    ],
    tagline: 'Premium grooming & care for {name}'
  },
  enjoy: {
    messages: (name, breed) => [
      `🎾 Playtime is ${name}'s favorite word!`,
      `🧸 New toys? ${name}'s tail is already wagging!`,
      `🎮 Let's find ${name}'s new favorite toy`,
      `⚡ Burn that ${name} energy with the best toys`,
      `🎯 Mental stimulation for smart ${name}`
    ],
    tagline: 'Joy & entertainment for {name}'
  },
  travel: {
    messages: (name, breed) => [
      `✈️ Adventure awaits ${name}!`,
      `🚗 Road trip with ${name}? We've got you covered`,
      `🏖️ ${name}'s vacation essentials are here`,
      `🎒 Travel-ready gear for ${name}`,
      `🗺️ Explore the world with ${name} by your side`
    ],
    tagline: 'Travel essentials for {name}\'s adventures'
  },
  stay: {
    messages: (name, breed) => [
      `🏠 ${name}'s cozy corner awaits`,
      `🛏️ Sweet dreams for sweet ${name}`,
      `🏡 Make home perfect for ${name}`,
      `☁️ Comfort fit for royalty like ${name}`,
      `🧺 ${name}'s happy place starts here`
    ],
    tagline: 'Home comforts designed for {name}'
  },
  fit: {
    messages: (name, breed) => [
      `💪 Keep ${name} healthy & active!`,
      `🏃 Exercise time for energetic ${name}`,
      `❤️ ${name}'s wellness journey starts here`,
      `🌟 A healthy ${name} is a happy ${name}`,
      `🎯 Fitness goals for fabulous ${name}`
    ],
    tagline: 'Health & wellness for {name}'
  },
  learn: {
    messages: (name, breed) => [
      `🎓 ${name} is ready to learn!`,
      `🧠 Smart ${name} deserves smart training`,
      `📚 Every dog can learn - especially ${name}!`,
      `🌟 Watch ${name} grow & shine`,
      `🎯 Training that ${name} will actually enjoy`
    ],
    tagline: 'Training & education for {name}'
  },
  advisory: {
    messages: (name, breed) => [
      `💬 Expert advice for ${name}'s needs`,
      `🩺 ${name}'s health questions answered`,
      `📋 Personalized guidance for ${name}`,
      `🤝 We're here for you & ${name}`,
      `💡 Smart decisions for ${name}'s wellbeing`
    ],
    tagline: 'Expert guidance for {name}'
  },
  emergency: {
    messages: (name, breed) => [
      `🚨 We're here for ${name}, always`,
      `❤️‍🩹 ${name}'s safety is our priority`,
      `🆘 24/7 support for ${name}`,
      `🏥 Emergency care when ${name} needs it`,
      `💪 ${name} is in safe hands`
    ],
    tagline: 'Emergency support for {name}'
  },
  paperwork: {
    messages: (name, breed) => [
      `📄 ${name}'s documents, sorted!`,
      `✅ Keep ${name}'s records organized`,
      `🏆 ${name}'s certifications & more`,
      `📋 Hassle-free paperwork for ${name}`,
      `🎫 ${name}'s official business, handled`
    ],
    tagline: 'Documentation for {name}'
  },
  farewell: {
    messages: (name, breed) => [
      `🌈 Honoring ${name}'s beautiful journey`,
      `💕 ${name}'s memory lives forever`,
      `🕊️ Gentle support for difficult times`,
      `🌟 Celebrating ${name}'s life`,
      `💝 ${name} will always be loved`
    ],
    tagline: 'Compassionate support'
  },
  adopt: {
    messages: (name, breed) => [
      `🐾 Ready to give another pup a home?`,
      `💕 ${name} might love a sibling!`,
      `🏠 Open your heart to another furry friend`,
      `🤝 Adoption changes lives`,
      `🌟 Every dog deserves love like ${name} gets`
    ],
    tagline: 'Find a new family member'
  },
  recommended: {
    messages: (name, breed) => [
      `✨ Handpicked just for ${name}!`,
      `💕 We know what ${name} loves`,
      `🎯 Personalized picks for ${name}`,
      `🌟 ${name}'s favorites, curated`,
      `💝 Because ${name} deserves the best`
    ],
    tagline: 'Curated with love for {name}'
  },
  all: {
    messages: (name, breed) => [
      `🛍️ Everything ${name} could ever need`,
      `✨ ${name}'s complete shopping destination`,
      `💕 Discover more for ${name}`,
      `🌟 The full collection for ${name}`,
      `🎁 Browse all for amazing ${name}`
    ],
    tagline: 'Everything for {name}'
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
