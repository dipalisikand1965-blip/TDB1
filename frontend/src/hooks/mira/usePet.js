/**
 * usePet - Pet Management Hook for Mira
 * ======================================
 * Handles:
 * - Pet selection and switching
 * - Loading user's pets from API
 * - Multi-pet support
 * 
 * Extracted from MiraDemoPage.jsx - Stage 1 Refactoring
 */

import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '../../utils/api';

// Default demo pet for non-logged-in users
export const DEMO_PET = {
  id: 'demo-pet',
  name: 'Buddy',
  breed: 'Golden Retriever',
  age: '3 years',
  traits: ['Playful', 'Friendly', 'Energetic'],
  sensitivities: ['Chicken allergy'],
  favorites: ['Tennis balls', 'Peanut butter treats'],
  photo: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=200&h=200&fit=crop&crop=face',
  soulTraits: [
    { label: 'Playful spirit', icon: '⭐', color: '#f59e0b' },
    { label: 'Gentle paws', icon: '🎀', color: '#ec4899' },
    { label: 'Loyal friend', icon: '❤️', color: '#ef4444' },
  ],
  soulScore: 0
};

// Additional demo pets for multi-pet selector
export const ALL_DEMO_PETS = [
  DEMO_PET,
  {
    id: 'pet-2',
    name: 'Luna',
    breed: 'Labrador',
    age: '5 years',
    sensitivities: [],
    photo: null,
    soulTraits: [
      { label: 'Calm soul', icon: '🌙', color: '#8b5cf6' },
      { label: 'Wise eyes', icon: '👁️', color: '#06b6d4' },
    ],
    soulScore: 32
  }
];

/**
 * Transform API pet data to frontend format
 */
const transformPetData = (apiPet) => ({
  id: apiPet.id,
  name: apiPet.name || 'Pet',
  breed: apiPet.breed || apiPet.pet_type || 'Dog',
  age: apiPet.age_display || (apiPet.age ? `${apiPet.age} years` : 'Unknown'),
  photo: apiPet.photo || apiPet.image || null,
  sensitivities: apiPet.sensitivities || apiPet.allergies || [],
  traits: apiPet.traits || apiPet.personality_traits || [],
  favorites: apiPet.favorites || [],
  soulTraits: apiPet.soul_traits || apiPet.soulTraits || [],
  soulScore: apiPet.soul_score || apiPet.soulScore || 0,
  weight: apiPet.weight,
  gender: apiPet.gender,
  isNeutered: apiPet.is_neutered,
  microchipId: apiPet.microchip_id
});

/**
 * usePet Hook
 * 
 * @param {Object} options
 * @param {Object} options.user - Current authenticated user
 * @param {string} options.token - Auth token
 * @param {Function} options.onPetSwitch - Called when pet is switched
 * @returns {Object} Pet state and controls
 */
const usePet = ({ user, token, onPetSwitch, autoLoad = false } = {}) => {
  const [pet, setPet] = useState(DEMO_PET);    // keeps codebase safe (no null crashes)
  const [allPets, setAllPets] = useState(ALL_DEMO_PETS);
  const [petLoaded, setPetLoaded] = useState(false); // true once REAL pet arrives from API
  const [showPetSelector, setShowPetSelector] = useState(false);
  const [isLoadingPets, setIsLoadingPets] = useState(false);
  
  // Load user's pets from API
  const loadUserPets = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoadingPets(true);
    try {
      const response = await fetch(`${API_URL}/api/pets/member/${user.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.pets && data.pets.length > 0) {
          const transformedPets = data.pets.map(transformPetData);
          setAllPets(transformedPets);
          
          // Set first pet as active if no real pet selected yet
          const DEMO_IDS = ['demo-pet', 'pet-2'];
          if (!pet || DEMO_IDS.includes(pet.id)) {
            setPet(transformedPets[0]);
          }
          
          setPetLoaded(true); // real pet is now available
          console.log('[usePet] Loaded', transformedPets.length, 'pets');
          return transformedPets;
        }
      }
    } catch (error) {
      console.error('[usePet] Error loading pets:', error);
    } finally {
      setIsLoadingPets(false);
    }
    return [];
  }, [user?.id, token, pet?.id]);
  
  // Fetch all pets (alternative endpoint)
  const fetchAllPets = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_URL}/api/pets/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.pets && data.pets.length > 0) {
          const formattedPets = data.pets.map(transformPetData);
          setAllPets(formattedPets);
          
          // Keep current pet or select first
          const currentPetExists = formattedPets.find(p => p.id === pet?.id);
          if (!currentPetExists && formattedPets.length > 0) {
            setPet(formattedPets[0]);
          }
          
          setPetLoaded(true);
          return formattedPets;
        }
      }
    } catch (error) {
      console.error('[usePet] Error fetching pets:', error);
    }
    return [];
  }, [token, pet?.id]);
  
  // Fetch specific pet details
  const fetchPetDetails = useCallback(async (petId) => {
    if (!petId || !token) return null;
    
    try {
      const response = await fetch(`${API_URL}/api/pets/${petId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        return transformPetData(data.pet || data);
      }
    } catch (error) {
      console.error('[usePet] Error fetching pet details:', error);
    }
    return null;
  }, [token]);
  
  // Switch to a different pet
  const switchPet = useCallback(async (newPet) => {
    if (pet && newPet.id === pet.id) {
      setShowPetSelector(false);
      return;
    }
    
    console.log('[usePet] Switching to:', newPet.name);
    setPet(newPet);
    setShowPetSelector(false);
    
    // Notify parent component
    if (onPetSwitch) {
      await onPetSwitch(newPet);
    }
  }, [pet?.id, onPetSwitch]);
  
  // Check if pet is a demo/fake pet
  const isRealPet = useCallback(() => {
    // Real pets: IDs like 'pet-mojo-7327ad56' (name + hash); demo: 'demo-pet', 'pet-2'
    const DEMO_IDS = ['demo-pet', 'pet-2'];
    return pet?.id && !DEMO_IDS.includes(pet.id);
  }, [pet?.id]);
  
  // Auto-mark petLoaded when pet switches from DEMO_PET to a real API pet
  // Real pet IDs: 'pet-mojo-7327ad56' (have name + hash suffix)
  // Demo pet IDs: 'demo-pet', 'pet-2' (short/synthetic, no hash)
  useEffect(() => {
    const DEMO_IDS = ['demo-pet', 'pet-2'];
    if (pet && pet.id && !DEMO_IDS.includes(pet.id)) {
      setPetLoaded(true);
    }
  }, [pet?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load pets on user change (only if autoLoad is enabled)
  // Note: MiraDemoPage has its own pet-loading logic, so autoLoad is disabled there
  useEffect(() => {
    if (autoLoad && user?.id) {
      loadUserPets();
    }
  }, [autoLoad, user?.id, loadUserPets]);

  // Safety fallback: after 4s with no user, mark as loaded so UI doesn't hang
  useEffect(() => {
    if (petLoaded) return;
    const timer = setTimeout(() => {
      if (!user?.id) {
        setPetLoaded(true); // guest/unauthenticated — show DEMO_PET
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, [petLoaded, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Find pet by ID
  const getPetById = useCallback((petId) => {
    return allPets.find(p => p.id === petId);
  }, [allPets]);
  
  return {
    // Current pet
    pet,
    setPet,
    
    // All pets
    allPets,
    setAllPets,
    
    // Pet selector UI
    showPetSelector,
    setShowPetSelector,
    
    // Loading state
    isLoadingPets,
    petLoaded,        // true once real pet arrives (use for render guard vs DEMO_PET)
    
    // Actions
    loadUserPets,
    fetchAllPets,
    fetchPetDetails,
    switchPet,
    getPetById,
    
    // Helpers
    isRealPet,
    
    // Constants
    DEMO_PET,
    ALL_DEMO_PETS
  };
};

export default usePet;
