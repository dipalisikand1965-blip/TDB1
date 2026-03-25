/**
 * VAULT MANAGER - Auto-detect and render appropriate vault
 * =========================================================
 * "Mira is the Brain, Concierge® is the Hands"
 * 
 * Detects vault type from Mira's response and renders:
 * - PicksVault for products
 * - TipCardVault for advice
 * - BookingVault for appointments
 * - PlacesVault for locations
 * - EmergencyVault for urgent help
 * - etc.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import { API_URL } from '../../utils/api';
import notificationSounds from '../../utils/notificationSounds';

// Direct imports to avoid circular dependency
import PicksVault from './PicksVault';
import PickDetail from './PickDetail';
import TipCardVault from './TipCardVault';
import BookingVault from './BookingVault';
import PlacesVault from './PlacesVault';
import CustomVault from './CustomVault';
import EmergencyVault from './EmergencyVault';
import MemorialVault from './MemorialVault';
import AdoptionVault from './AdoptionVault';
import { VAULT_TYPES, detectVaultType, getVaultConfig } from './vaultConfig';

/**
 * Detect vault type from Mira's response data
 */
function detectVaultTypeFromResponse(miraResponse, userMessage, pillar) {
  const lowerMessage = (userMessage || '').toLowerCase();
  
  // Emergency detection - ONLY explicit emergency keywords (not "help" alone)
  // "help" alone is too generic - users say "help me find" all the time
  const emergencyKeywords = ['emergency', 'urgent', 'poison', 'ate chocolate', 'swallowed', 'choking', 'bleeding', 'accident', 'injured', 'lost pet', 'missing dog', 'missing cat', 'can\'t breathe', 'unconscious', 'seizure', 'not breathing'];
  const isEmergency = emergencyKeywords.some(kw => lowerMessage.includes(kw)) || 
                      pillar === 'emergency' ||
                      (lowerMessage.includes('help') && (lowerMessage.includes('emergency') || lowerMessage.includes('urgent')));
  
  if (isEmergency) {
    return VAULT_TYPES.EMERGENCY;
  }
  
  // Grief/Memorial detection
  const griefKeywords = ['passed away', 'died', 'lost my', 'grief', 'memorial', 'cremation', 'rainbow bridge', 'goodbye', 'farewell'];
  if (griefKeywords.some(kw => lowerMessage.includes(kw)) || pillar === 'farewell') {
    return VAULT_TYPES.MEMORIAL;
  }
  
  // Adoption detection - but NOT if user is asking for shelter/rescue locations
  const adoptionKeywords = ['adopt', 'foster', 'new pet', 'get a dog', 'get a cat', 'want a puppy', 'looking for a pet'];
  const isAdoptionQuery = adoptionKeywords.some(kw => lowerMessage.includes(kw)) || pillar === 'adopt';
  const isPlacesQuery = lowerMessage.includes('near') || lowerMessage.includes('find me') || lowerMessage.includes('where');
  
  if (isAdoptionQuery && !isPlacesQuery) {
    return VAULT_TYPES.ADOPTION;
  }
  
  // Places detection - check FIRST before other types (groomers, photographers, etc.)
  const placesKeywords = ['restaurant', 'cafe', 'hotel', 'park', 'beach', 'pet-friendly', 'where can i', 'places to', 
                          'groomer', 'grooming', 'photographer', 'photo', 'shelter', 'rescue',
                          'boarding', 'daycare', 'trainer', 'training', 'near me', 'find me'];
  if (placesKeywords.some(kw => lowerMessage.includes(kw))) {
    if (miraResponse?.places?.length > 0 || miraResponse?.nearby_places?.places?.length > 0) {
      return VAULT_TYPES.PLACES;
    }
  }
  
  // Products detection
  if (miraResponse?.products?.length > 0) {
    return VAULT_TYPES.PICKS;
  }
  
  // Booking detection
  const bookingKeywords = ['book', 'appointment', 'schedule', 'reserve', 'vet visit', 'training session'];
  if (bookingKeywords.some(kw => lowerMessage.includes(kw))) {
    // Check if response suggests booking
    if (miraResponse?.suggest_booking || miraResponse?.service_type) {
      return VAULT_TYPES.BOOKING;
    }
  }
  
  // Tip card detection - advice without products
  const adviceKeywords = ['meal plan', 'diet', 'routine', 'schedule', 'tips', 'guide', 'how to', 'advice', 'recommend', 'suggest', 'ritual', 'bonding'];
  if (adviceKeywords.some(kw => lowerMessage.includes(kw)) && !miraResponse?.products?.length) {
    if (miraResponse?.tip_card || miraResponse?.advice || miraResponse?.response) {
      return VAULT_TYPES.TIP_CARD;
    }
  }
  
  // Custom request detection
  const customKeywords = ['custom', 'special', 'bespoke', 'personalized', 'can you find', 'not in', 'don\'t have'];
  if (customKeywords.some(kw => lowerMessage.includes(kw))) {
    return VAULT_TYPES.CUSTOM;
  }
  
  // Default: If has products, show picks
  if (miraResponse?.products?.length > 0) {
    return VAULT_TYPES.PICKS;
  }
  
  return null; // No vault needed
}

/**
 * Detect service type from message
 */
function detectServiceType(message) {
  const lowerMessage = (message || '').toLowerCase();
  
  if (lowerMessage.includes('groom')) return 'grooming';
  if (lowerMessage.includes('vet') || lowerMessage.includes('doctor')) return 'vet';
  if (lowerMessage.includes('train')) return 'training';
  if (lowerMessage.includes('board') || lowerMessage.includes('overnight')) return 'boarding';
  if (lowerMessage.includes('daycare')) return 'daycare';
  if (lowerMessage.includes('walk')) return 'walking';
  if (lowerMessage.includes('sit')) return 'sitting';
  if (lowerMessage.includes('photo')) return 'photoshoot';
  
  return 'grooming'; // default
}

/**
 * Detect place type from message
 */
function detectPlaceType(message) {
  const lowerMessage = (message || '').toLowerCase();
  
  // New place types first (more specific)
  if (lowerMessage.includes('groomer') || lowerMessage.includes('grooming') || lowerMessage.includes('haircut') || lowerMessage.includes('trim')) return 'groomers';
  if (lowerMessage.includes('photographer') || lowerMessage.includes('photo')) return 'photographers';
  if (lowerMessage.includes('shelter') || lowerMessage.includes('rescue') || lowerMessage.includes('adopt')) return 'shelters';
  if (lowerMessage.includes('boarding') || lowerMessage.includes('daycare') || lowerMessage.includes('hostel')) return 'boarding';
  if (lowerMessage.includes('trainer') || lowerMessage.includes('training') || lowerMessage.includes('obedience')) return 'trainers';
  
  // Original place types
  if (lowerMessage.includes('restaurant') || lowerMessage.includes('eat') || lowerMessage.includes('dine')) return 'restaurants';
  if (lowerMessage.includes('cafe') || lowerMessage.includes('coffee')) return 'cafe';
  if (lowerMessage.includes('hotel') || lowerMessage.includes('stay')) return 'hotels';
  if (lowerMessage.includes('park')) return 'parks';
  if (lowerMessage.includes('beach')) return 'beach';
  
  return 'places'; // default
}

/**
 * Detect tip card type from message
 */
function detectTipCardType(message) {
  const lowerMessage = (message || '').toLowerCase();
  
  if (lowerMessage.includes('meal') || lowerMessage.includes('food') || lowerMessage.includes('diet')) return 'meal_plan';
  if (lowerMessage.includes('travel')) return 'travel_tips';
  if (lowerMessage.includes('groom')) return 'grooming_routine';
  if (lowerMessage.includes('train')) return 'training_tips';
  if (lowerMessage.includes('health') || lowerMessage.includes('medical')) return 'health_advice';
  if (lowerMessage.includes('exercise') || lowerMessage.includes('fitness')) return 'exercise_routine';
  if (lowerMessage.includes('checklist')) return 'checklist';
  
  return 'general';
}

/**
 * Detect emergency type from message
 */
function detectEmergencyType(message) {
  const lowerMessage = (message || '').toLowerCase();
  
  if (lowerMessage.includes('poison') || lowerMessage.includes('ate') || lowerMessage.includes('swallow')) return 'poisoning';
  if (lowerMessage.includes('hurt') || lowerMessage.includes('injur') || lowerMessage.includes('accident')) return 'injury';
  if (lowerMessage.includes('breath')) return 'breathing';
  if (lowerMessage.includes('lost') || lowerMessage.includes('missing')) return 'lost_pet';
  if (lowerMessage.includes('seizure')) return 'seizure';
  
  return 'other';
}

/**
 * VaultManager Component
 */
const VaultManager = ({
  isOpen,
  onClose,
  miraResponse,
  userMessage,
  pet,
  pillar,
  sessionId,
  member,
  onVaultSent
}) => {
  const [activeVault, setActiveVault] = useState(null);
  const [showDetail, setShowDetail] = useState(null);
  const [selectedItems, setSelectedItems] = useState(new Set());

  // Detect vault type when response changes
  useEffect(() => {
    if (isOpen && miraResponse) {
      const vaultType = detectVaultTypeFromResponse(miraResponse, userMessage, pillar);
      setActiveVault(vaultType);
      setSelectedItems(new Set());
      setShowDetail(null);
    }
  }, [isOpen, miraResponse, userMessage, pillar]);

  // Send to Concierge® via unified endpoint
  const sendToConcierge = useCallback(async (vaultData) => {
    try {
      const response = await fetch(`${API_URL}/api/mira/vault/send-to-concierge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vault_type: activeVault,
          session_id: sessionId,
          member_id: member?.id,
          member_email: member?.email,
          member_phone: member?.phone,
          member_name: member?.name,
          pet: pet,
          pillar: pillar,
          data: vaultData
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Play concierge bell sound on successful send
        notificationSounds.concierge();
        
        if (onVaultSent) {
          onVaultSent(result);
        }
      }
      
      return result;
    } catch (error) {
      console.error('[VAULT] Failed to send to Concierge®:', error);
      throw error;
    }
  }, [activeVault, sessionId, member, pet, pillar, onVaultSent]);

  // Refresh picks
  const handleRefreshPicks = useCallback(async (excludeIds) => {
    try {
      const response = await fetch(`${API_URL}/api/mira/refresh-picks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pillar,
          pet_context: pet,
          exclude_ids: excludeIds,
          context: userMessage
        })
      });
      
      const result = await response.json();
      return result.picks || [];
    } catch (error) {
      console.error('[VAULT] Failed to refresh picks:', error);
      return [];
    }
  }, [pillar, pet, userMessage]);

  // Handle product detail view
  const handleViewDetail = useCallback((product) => {
    setShowDetail(product);
  }, []);

  // Handle select from detail view
  const handleSelectFromDetail = useCallback((product) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      const itemId = product.id || product.name;
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
    setShowDetail(null);
  }, []);

  // Handle ask Mira from detail view
  const handleAskMiraFromDetail = useCallback((product) => {
    setShowDetail(null);
    // Could emit an event to add a message to chat
    console.log('[VAULT] Ask Mira about:', product.name);
  }, []);

  if (!isOpen) return null;

  // Show product detail view
  if (showDetail) {
    return (
      <PickDetail
        product={showDetail}
        pet={pet}
        isSelected={selectedItems.has(showDetail.id || showDetail.name)}
        onBack={() => setShowDetail(null)}
        onSelect={handleSelectFromDetail}
        onAskMira={handleAskMiraFromDetail}
      />
    );
  }

  // Render appropriate vault based on detected type
  switch (activeVault) {
    case VAULT_TYPES.PICKS:
      return (
        <PicksVault
          picks={miraResponse?.products || []}
          pet={pet}
          pillar={pillar}
          context={userMessage}
          onSendToConcierge={(data) => sendToConcierge({
            picked_items: data.picked_items,
            shown_items: data.shown_items,
            context: data.context,
            user_action: data.user_action
          })}
          onRefresh={handleRefreshPicks}
          onClose={onClose}
          onViewDetails={handleViewDetail}
        />
      );

    case VAULT_TYPES.TIP_CARD:
      const cardType = detectTipCardType(userMessage);
      return (
        <TipCardVault
          tipCard={{
            type: cardType,
            title: `${cardType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} for ${pet?.name || 'Your Pet'}`,
            content: miraResponse?.response || miraResponse?.advice || ''
          }}
          pet={pet}
          pillar={pillar}
          conversationContext={userMessage}
          onSendToConcierge={(data) => sendToConcierge({
            card_type: data.card_type,
            card_title: data.card_title,
            card_content: data.card_content,
            request_formal_version: data.request_formal_version,
            additional_notes: data.additional_notes
          })}
          onClose={onClose}
        />
      );

    case VAULT_TYPES.BOOKING:
      const serviceType = detectServiceType(userMessage);
      return (
        <BookingVault
          serviceType={serviceType}
          pet={pet}
          pillar={pillar}
          suggestedProviders={miraResponse?.providers || []}
          onSendToConcierge={(data) => sendToConcierge({
            service_type: data.service_type,
            preferred_date: data.preferred_date,
            preferred_time: data.preferred_time,
            location: data.location,
            special_requirements: data.special_requirements
          })}
          onClose={onClose}
        />
      );

    case VAULT_TYPES.PLACES:
      const placeType = miraResponse?.nearby_places?.type || detectPlaceType(userMessage);
      return (
        <PlacesVault
          places={miraResponse?.places || miraResponse?.nearby_places?.places || []}
          placeType={placeType}
          location={miraResponse?.nearby_places?.city || miraResponse?.location || ''}
          pet={pet}
          pillar={pillar}
          onSendToConcierge={(data) => sendToConcierge({
            place_type: data.place_type,
            location: data.location,
            selected_places: data.selected_places,
            need_reservation: data.need_reservation,
            reservation_details: data.reservation_details
          })}
          onClose={onClose}
        />
      );

    case VAULT_TYPES.CUSTOM:
      return (
        <CustomVault
          pet={pet}
          pillar={pillar}
          initialRequest={userMessage}
          onSendToConcierge={(data) => sendToConcierge({
            description: data.description,
            requirements: data.requirements,
            budget: data.budget,
            timeline: data.timeline
          })}
          onClose={onClose}
        />
      );

    case VAULT_TYPES.EMERGENCY:
      const emergencyType = detectEmergencyType(userMessage);
      return (
        <EmergencyVault
          emergencyType={emergencyType}
          pet={pet}
          pillar="emergency"
          onSendToConcierge={(data) => sendToConcierge({
            emergency_type: data.emergency_type,
            symptoms: data.symptoms,
            action_taken: data.action_taken,
            location: data.location,
            is_urgent: true
          })}
          onClose={onClose}
        />
      );

    case VAULT_TYPES.MEMORIAL:
      return (
        <MemorialVault
          pet={pet}
          pillar="farewell"
          onSendToConcierge={(data) => sendToConcierge({
            selected_services: data.selected_services,
            special_wishes: data.special_wishes,
            is_sensitive: true
          })}
          onClose={onClose}
        />
      );

    case VAULT_TYPES.ADOPTION:
      return (
        <AdoptionVault
          pet={pet}
          pillar="adopt"
          onSendToConcierge={(data) => sendToConcierge({
            pet_type: data.pet_type,
            breed_preference: data.breed_preference,
            age_preference: data.age_preference,
            living_space: data.living_space,
            has_other_pets: data.has_other_pets,
            has_children: data.has_children,
            experience_level: data.experience_level,
            additional_info: data.additional_info
          })}
          onClose={onClose}
        />
      );

    default:
      // Fallback: If we have products, show picks vault
      if (miraResponse?.products?.length > 0) {
        return (
          <PicksVault
            picks={miraResponse.products}
            pet={pet}
            pillar={pillar}
            context={userMessage}
            onSendToConcierge={(data) => sendToConcierge({
              picked_items: data.picked_items,
              shown_items: data.shown_items,
              context: data.context,
              user_action: data.user_action
            })}
            onRefresh={handleRefreshPicks}
            onClose={onClose}
            onViewDetails={handleViewDetail}
          />
        );
      }
      
      // If we have a tip card, show tip card vault
      if (miraResponse?.tip_card) {
        return (
          <TipCardVault
            tipCard={miraResponse.tip_card}
            pet={pet}
            pillar={pillar}
            conversationContext={userMessage}
            onSendToConcierge={(data) => sendToConcierge({
              card_type: data.card_type,
              card_title: data.card_title,
              card_content: data.card_content,
              request_formal_version: data.request_formal_version,
              additional_notes: data.additional_notes
            })}
            onClose={onClose}
          />
        );
      }
      
      // Empty state - nothing to show
      return (
        <div className="pv-container" data-testid="vault-empty">
          <div className="pv-header">
            <div className="pv-header-text">
              <h2>Picks for {pet?.name || 'Your Pet'}</h2>
              <p>Ask Mira for recommendations!</p>
            </div>
            <button 
              className="pv-close-btn"
              onClick={onClose}
              aria-label="Close"
              data-testid="vault-close"
            >
              <X size={24} />
            </button>
          </div>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '60%',
            color: 'rgba(255,255,255,0.6)',
            textAlign: 'center',
            padding: '2rem'
          }}>
            <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎁</span>
            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No picks yet</p>
            <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>Ask Mira for recommendations and they'll appear here!</p>
          </div>
        </div>
      );
  }
};

export default VaultManager;
