/**
 * useUniversalServiceCommand.js
 * 
 * UNIVERSAL SERVICE COMMAND SPINE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * The SINGLE source of truth for ALL user intent capture across Mira OS.
 * Every request, from ANY entry point, flows through this hook.
 * 
 * CANONICAL LIFECYCLE:
 * 1. User Intent (from anywhere) → 
 * 2. Service Desk Ticket created →
 * 3. Admin notification (service desk queue) →
 * 4. Member notification (inbox + toast) →
 * 5. Ticket thread opens →
 * 6. Pillar Request view (contextual intake + updates) →
 * 7. Channel intake (WhatsApp/email/call) only if needed
 * 
 * ENTRY POINTS SUPPORTED:
 * - Card CTA (product/service cards)
 * - Top CTA (page-level action buttons)
 * - Ask Mira (chat interface)
 * - Search bar
 * - Product cards
 * - Free text input
 * - Concierge button
 * - FlowModal submission
 * 
 * USAGE:
 *   const { submitRequest, isSubmitting, lastTicket } = useUniversalServiceCommand();
 *   
 *   // From any component:
 *   await submitRequest({
 *     type: 'fresh_meal_inquiry',
 *     pillar: 'dine',
 *     source: 'card_cta',
 *     customer: { name, email, phone },
 *     details: { ... },
 *     pet: activePet,
 *     entryPoint: 'canonical_card'
 *   });
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';

// ═══════════════════════════════════════════════════════════════════════════════
// ENTRY POINT TYPES - Canonical list of all entry points
// ═══════════════════════════════════════════════════════════════════════════════
export const ENTRY_POINTS = {
  CARD_CTA: 'card_cta',
  TOP_CTA: 'top_cta',
  ASK_MIRA: 'ask_mira',
  SEARCH: 'search',
  PRODUCT_CARD: 'product_card',
  FREE_TEXT: 'free_text',
  CONCIERGE_BUTTON: 'concierge_button',
  FLOW_MODAL: 'flow_modal',
  QUICK_ACTION: 'quick_action',
  INLINE_FORM: 'inline_form'
};

// ═══════════════════════════════════════════════════════════════════════════════
// REQUEST TYPES - Canonical list of request types
// ═══════════════════════════════════════════════════════════════════════════════
export const REQUEST_TYPES = {
  // Dine pillar
  FRESH_MEALS_TRIAL: 'fresh_meals_trial',
  FRESH_MEALS_WEEKLY: 'fresh_meals_weekly',
  FRESH_MEALS_ALLERGY: 'fresh_meals_allergy_safe',
  DINING_RESERVATION: 'dining_reservation',
  MEAL_SUBSCRIPTION: 'meal_subscription',
  
  // General
  GENERAL_INQUIRY: 'general_inquiry',
  HELP_REQUEST: 'help_request',
  FEEDBACK: 'feedback',
  
  // Celebrate pillar
  BIRTHDAY_PARTY: 'birthday_party',
  CELEBRATION_EVENT: 'celebration_event',
  
  // Care pillar
  VET_APPOINTMENT: 'vet_appointment',
  GROOMING_REQUEST: 'grooming_request',
  
  // Other
  CUSTOM: 'custom'
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════════════════════════════════════════════

const useUniversalServiceCommand = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  
  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastTicket, setLastTicket] = useState(null);
  const [error, setError] = useState(null);
  
  /**
   * SUBMIT REQUEST - The universal entry point for all service requests
   * 
   * @param {Object} params - Request parameters
   * @param {string} params.type - Request type (from REQUEST_TYPES or custom)
   * @param {string} params.pillar - Which pillar (dine, celebrate, care, etc.)
   * @param {string} params.source - Entry point source
   * @param {Object} params.customer - Customer info { name, email, phone }
   * @param {Object} params.details - Request-specific details
   * @param {Object} params.pet - Pet context (optional)
   * @param {string} params.entryPoint - Entry point type (from ENTRY_POINTS)
   * @param {string} params.priority - Priority level (low, normal, high)
   * @param {string} params.intent - User intent description
   * @param {boolean} params.navigateToInbox - Whether to navigate to inbox after submission
   * @param {boolean} params.showToast - Whether to show success toast
   */
  const submitRequest = useCallback(async ({
    type,
    pillar,
    source,
    customer,
    details = {},
    pet = null,
    entryPoint = ENTRY_POINTS.CARD_CTA,
    priority = 'normal',
    intent = null,
    navigateToInbox = true,
    showToast = true
  }) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Build customer object from user if not provided
      const customerData = customer || {
        name: user?.name || user?.email?.split('@')[0] || 'Member',
        email: user?.email || '',
        phone: user?.phone || user?.whatsapp || ''
      };
      
      // Enhance details with pet context if available
      const enhancedDetails = {
        ...details,
        // Pet context
        ...(pet && {
          pet_id: pet.id,
          pet_name: pet.name,
          pet_breed: pet.breed,
          pet_allergies: pet.allergies || pet.soul_data?.allergies || []
        }),
        // Entry point tracking
        entry_point: entryPoint,
        submitted_at: new Date().toISOString(),
        // Device info for debugging
        device_type: window.innerWidth < 768 ? 'mobile' : 'desktop',
        user_agent: navigator.userAgent.substring(0, 100)
      };
      
      // Build the unified payload
      const payload = {
        type: type || REQUEST_TYPES.GENERAL_INQUIRY,
        pillar: pillar || 'general',
        source: source || entryPoint,
        customer: customerData,
        details: enhancedDetails,
        priority: priority,
        intent: intent || `${type} request via ${entryPoint}`
      };
      
      console.log('[USC] Submitting request:', {
        type: payload.type,
        pillar: payload.pillar,
        source: payload.source,
        entryPoint
      });
      
      // POST to service-requests endpoint
      const response = await fetch(`${API_URL}/api/service-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to submit request');
      }
      
      const data = await response.json();
      
      // Store the ticket info
      const ticketInfo = {
        ticketId: data.ticket_id,
        inboxId: data.inbox_id,
        requestId: data.request_id,
        notificationId: data.notification_id,
        createdAt: new Date().toISOString()
      };
      setLastTicket(ticketInfo);
      
      console.log('[USC] Request submitted successfully:', ticketInfo);
      
      // Show success toast with action
      if (showToast) {
        toast.success('Request sent to Concierge®', {
          description: `Your ${pillar} request has been received`,
          action: {
            label: 'View in inbox',
            onClick: () => navigate(`/mira-search?openConcierge=true&ticket=${data.ticket_id}`)
          },
          duration: 5000
        });
      }
      
      // Navigate to Mira OS Concierge (unified inbox)
      if (navigateToInbox) {
        setTimeout(() => {
          navigate(`/mira-search?openConcierge=true&ticket=${data.ticket_id}`);
        }, 1500);
      }
      
      return {
        success: true,
        ticketId: data.ticket_id,
        inboxId: data.inbox_id,
        data
      };
      
    } catch (err) {
      console.error('[USC] Submit error:', err);
      setError(err.message);
      
      toast.error('Failed to submit request', {
        description: err.message || 'Please try again'
      });
      
      return {
        success: false,
        error: err.message
      };
      
    } finally {
      setIsSubmitting(false);
    }
  }, [user, token, navigate]);
  
  /**
   * QUICK INQUIRY - Simplified submission for text-based inquiries
   */
  const quickInquiry = useCallback(async ({
    message,
    pillar = 'general',
    pet = null,
    entryPoint = ENTRY_POINTS.FREE_TEXT
  }) => {
    return submitRequest({
      type: REQUEST_TYPES.GENERAL_INQUIRY,
      pillar,
      source: entryPoint,
      details: {
        message,
        inquiry_type: 'quick_question'
      },
      pet,
      entryPoint,
      intent: message.substring(0, 100)
    });
  }, [submitRequest]);
  
  /**
   * ASK MIRA - Submit from Mira chat interface
   */
  const askMira = useCallback(async ({
    question,
    context = {},
    pillar = 'general',
    pet = null
  }) => {
    return submitRequest({
      type: REQUEST_TYPES.HELP_REQUEST,
      pillar,
      source: 'mira_chat',
      details: {
        question,
        mira_context: context,
        conversation_source: 'ask_mira'
      },
      pet,
      entryPoint: ENTRY_POINTS.ASK_MIRA,
      intent: `Ask Mira: ${question.substring(0, 80)}`
    });
  }, [submitRequest]);
  
  /**
   * SEARCH INTENT - Submit from search bar
   */
  const searchIntent = useCallback(async ({
    query,
    pillar = 'general',
    pet = null
  }) => {
    return submitRequest({
      type: REQUEST_TYPES.GENERAL_INQUIRY,
      pillar,
      source: 'search',
      details: {
        search_query: query,
        search_timestamp: new Date().toISOString()
      },
      pet,
      entryPoint: ENTRY_POINTS.SEARCH,
      intent: `Search: ${query}`
    });
  }, [submitRequest]);
  
  /**
   * CONCIERGE REQUEST - Submit from Concierge button
   */
  const conciergeRequest = useCallback(async ({
    message,
    pillar = 'general',
    pet = null,
    threadId = null
  }) => {
    return submitRequest({
      type: REQUEST_TYPES.HELP_REQUEST,
      pillar,
      source: 'concierge_button',
      details: {
        message,
        thread_id: threadId,
        channel: 'concierge_chat'
      },
      pet,
      entryPoint: ENTRY_POINTS.CONCIERGE_BUTTON,
      priority: 'normal',
      intent: `Concierge: ${message.substring(0, 80)}`
    });
  }, [submitRequest]);
  
  return {
    // Main submission function
    submitRequest,
    
    // Specialized submission functions
    quickInquiry,
    askMira,
    searchIntent,
    conciergeRequest,
    
    // State
    isSubmitting,
    lastTicket,
    error,
    
    // Constants for external use
    ENTRY_POINTS,
    REQUEST_TYPES
  };
};

export default useUniversalServiceCommand;

// ═══════════════════════════════════════════════════════════════════════════════
// STANDALONE FUNCTION (for non-hook usage)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * submitServiceRequest - Standalone function for submitting service requests
 * Use this when you can't use the hook (e.g., in utility functions)
 */
export const submitServiceRequest = async ({
  type,
  pillar,
  source,
  customer,
  details,
  priority = 'normal',
  intent = null,
  token = null
}) => {
  try {
    const response = await fetch(`${typeof window !== 'undefined' ? '' : ''}/api/service-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify({
        type,
        pillar,
        source,
        customer,
        details,
        priority,
        intent
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to submit request');
    }
    
    return await response.json();
  } catch (error) {
    console.error('[USC Standalone] Error:', error);
    throw error;
  }
};
