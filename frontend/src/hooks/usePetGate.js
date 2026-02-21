/**
 * usePetGate - Pet-First Gating Hook
 * 
 * THE DOCTRINE: "No member without a pet."
 * 
 * This hook enforces pet registration before key actions:
 * - Checkout
 * - Mira chat
 * - Bookings
 * - Service requests
 * 
 * Usage:
 * const { canProceed, showGate, pets, gateMessage } = usePetGate('checkout');
 * 
 * if (!canProceed) {
 *   // Show pet registration prompt
 * }
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../utils/api';

export const usePetGate = (action = 'default') => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [canProceed, setCanProceed] = useState(false);
  const [pets, setPets] = useState([]);
  const [gateMessage, setGateMessage] = useState(null);
  const [showGateModal, setShowGateModal] = useState(false);

  const checkPetGate = useCallback(async () => {
    if (!user) {
      setCanProceed(false);
      setGateMessage({
        title: 'Sign In Required',
        message: 'Please sign in to continue',
        actionRequired: 'login',
        cta: { text: 'Sign In', route: '/login' }
      });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${getApiUrl()}/api/pet-gate/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          user_email: user.email,
          user_id: user.id || user.user_id,
          action
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCanProceed(data.gate_open);
        setPets(data.pets || []);
        
        if (!data.gate_open) {
          setGateMessage({
            title: data.title,
            message: data.message,
            benefit: data.benefit,
            actionRequired: data.action_required,
            cta: data.cta
          });
        } else {
          setGateMessage(null);
        }
      }
    } catch (error) {
      console.error('Pet gate check failed:', error);
      // Fail open - allow proceeding
      setCanProceed(true);
    } finally {
      setLoading(false);
    }
  }, [user, token, action]);

  useEffect(() => {
    checkPetGate();
  }, [checkPetGate]);

  const openGate = () => setShowGateModal(true);
  const closeGate = () => setShowGateModal(false);
  const refreshGate = () => checkPetGate();

  return {
    loading,
    canProceed,
    pets,
    petCount: pets.length,
    hasPet: pets.length > 0,
    gateMessage,
    showGateModal,
    openGate,
    closeGate,
    refreshGate
  };
};

export default usePetGate;
