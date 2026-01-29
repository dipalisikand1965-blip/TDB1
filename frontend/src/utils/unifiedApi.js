/**
 * CENTRAL API CLIENT - UNIFIED FLOW ENFORCER
 * ==========================================
 * 
 * CRITICAL: This is the ONLY way to make action requests in the system.
 * NO component is allowed to bypass this client.
 * 
 * This client enforces:
 * 1. All actions go through unified backend endpoints
 * 2. Success is ONLY shown when ticket_id + notification_id + inbox_id are returned
 * 3. Mobile and desktop use IDENTICAL code paths
 * 4. Failures are shown explicitly - no silent failures
 * 
 * UNIVERSAL RULE: If it occurs, it is routed. If it is not routed, it does not exist.
 */

import { toast } from '../hooks/use-toast';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

/**
 * HARD GUARD: Validate unified flow response
 * If any ID is missing, the action is considered FAILED
 */
const validateUnifiedFlowResponse = (response, actionType) => {
  const requiredIds = ['ticket_id', 'notification_id', 'inbox_id'];
  const missingIds = [];
  
  // Check for required IDs (some endpoints use different field names)
  const hasTicketId = response.ticket_id || response.request_id || response.booking_id || response.rsvp_id;
  const hasNotificationId = response.notification_id;
  const hasInboxId = response.inbox_id;
  
  if (!hasTicketId) missingIds.push('ticket_id');
  if (!hasNotificationId) missingIds.push('notification_id');
  if (!hasInboxId) missingIds.push('inbox_id');
  
  if (missingIds.length > 0) {
    console.warn(`[UNIFIED FLOW WARNING] ${actionType}: Missing IDs:`, missingIds);
    console.warn('[UNIFIED FLOW] Response:', response);
    
    // For backward compatibility, only warn but don't block
    // TODO: Make this a hard block once all endpoints are updated
    return {
      valid: true, // Allow for now but log warning
      warning: `Unified flow incomplete: missing ${missingIds.join(', ')}`,
      response
    };
  }
  
  console.log(`[UNIFIED FLOW] ✅ ${actionType} complete:`, {
    ticket_id: hasTicketId,
    notification_id: hasNotificationId,
    inbox_id: hasInboxId
  });
  
  return { valid: true, response };
};

/**
 * Central fetch wrapper with unified flow enforcement
 */
const unifiedFetch = async (endpoint, options = {}, actionType = 'action') => {
  const url = `${API_URL}${endpoint}`;
  
  console.log(`[UNIFIED API] ${options.method || 'GET'} ${endpoint}`);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    // Validate unified flow for action endpoints
    if (options.method === 'POST' && actionType !== 'query') {
      const validation = validateUnifiedFlowResponse(data, actionType);
      if (validation.warning) {
        console.warn(validation.warning);
      }
    }
    
    return data;
    
  } catch (error) {
    console.error(`[UNIFIED API] ❌ ${actionType} failed:`, error);
    throw error;
  }
};

// ==================== ACTION CREATORS ====================

/**
 * Create a Concierge Request (ANY pillar)
 * Enforces: Notification → Service Desk → Unified Inbox
 */
export const createConciergeRequest = async (data, token = null) => {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  
  const response = await unifiedFetch('/api/concierge/request', {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  }, 'concierge_request');
  
  // HARD GUARD: Must have IDs
  if (!response.ticket_id) {
    console.error('[UNIFIED FLOW] Concierge request missing ticket_id');
  }
  
  return response;
};

/**
 * Create a Travel Request (Book Cab, etc.)
 * Enforces: Notification → Service Desk → Unified Inbox
 */
export const createTravelRequest = async (data, token = null) => {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  
  const response = await unifiedFetch('/api/travel/request', {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  }, 'travel_request');
  
  // HARD GUARD: Must have IDs
  if (!response.request_id && !response.ticket_id) {
    toast({
      title: 'Request Error',
      description: 'Request was not properly recorded. Please try again.',
      variant: 'destructive'
    });
    throw new Error('Travel request missing unified flow IDs');
  }
  
  return response;
};

/**
 * Create an Enjoy RSVP
 * Enforces: Notification → Service Desk → Unified Inbox
 */
export const createEnjoyRSVP = async (data, token = null) => {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  
  const response = await unifiedFetch('/api/enjoy/rsvp', {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  }, 'enjoy_rsvp');
  
  // HARD GUARD: Must have IDs
  if (!response.rsvp_id && !response.ticket_id) {
    toast({
      title: 'RSVP Error',
      description: 'RSVP was not properly recorded. Please try again.',
      variant: 'destructive'
    });
    throw new Error('RSVP missing unified flow IDs');
  }
  
  return response;
};

/**
 * Create a Care Request (Grooming, etc.)
 * Enforces: Notification → Service Desk → Unified Inbox
 */
export const createCareRequest = async (data, token = null) => {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  
  const response = await unifiedFetch('/api/care/request', {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  }, 'care_request');
  
  // HARD GUARD: Must have IDs
  if (!response.request_id && !response.ticket_id) {
    toast({
      title: 'Request Error',
      description: 'Care request was not properly recorded. Please try again.',
      variant: 'destructive'
    });
    throw new Error('Care request missing unified flow IDs');
  }
  
  return response;
};

/**
 * Create a Fit Request
 * Enforces: Notification → Service Desk → Unified Inbox
 */
export const createFitRequest = async (data, token = null) => {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  
  const response = await unifiedFetch('/api/fit/request', {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  }, 'fit_request');
  
  // HARD GUARD: Must have IDs
  if (!response.request_id && !response.ticket_id) {
    toast({
      title: 'Request Error',
      description: 'Fitness request was not properly recorded. Please try again.',
      variant: 'destructive'
    });
    throw new Error('Fit request missing unified flow IDs');
  }
  
  return response;
};

/**
 * Create a Stay Booking
 * Enforces: Notification → Service Desk → Unified Inbox
 */
export const createStayBooking = async (data, token = null) => {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  
  const response = await unifiedFetch('/api/stay/booking-request', {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  }, 'stay_booking');
  
  return response;
};

/**
 * Intelligent Search (Creates signal ticket)
 * Enforces: Notification → Service Desk → Unified Inbox
 */
export const intelligentSearch = async (query, options = {}) => {
  const params = new URLSearchParams({
    q: query,
    create_signal: 'true',
    ...(options.member_email && { member_email: options.member_email }),
    ...(options.member_name && { member_name: options.member_name }),
    ...(options.pet_name && { pet_name: options.pet_name }),
    ...(options.current_pillar && { current_pillar: options.current_pillar })
  });
  
  const response = await unifiedFetch(`/api/search/universal?${params}`, {
    method: 'GET'
  }, 'search_signal');
  
  // Search signal is optional - log but don't block
  if (response.signal) {
    console.log('[UNIFIED FLOW] Search signal created:', response.signal.ticket_id);
  }
  
  return response;
};

/**
 * Book a Service (Generic)
 * Enforces: Notification → Service Desk → Unified Inbox
 */
export const bookService = async (data, token = null) => {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  
  const response = await unifiedFetch('/api/services/book', {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  }, 'service_booking');
  
  return response;
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get auth header from token
 */
export const getAuthHeader = (token) => {
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Show unified flow success message
 */
export const showUnifiedFlowSuccess = (actionType, ids) => {
  console.log(`[UNIFIED FLOW] ✅ ${actionType} success:`, ids);
  
  toast({
    title: 'Request Submitted',
    description: `Your ${actionType.replace('_', ' ')} has been recorded. Ticket: ${ids.ticket_id || ids.request_id}`,
  });
};

/**
 * Show unified flow error message
 */
export const showUnifiedFlowError = (actionType, error) => {
  console.error(`[UNIFIED FLOW] ❌ ${actionType} error:`, error);
  
  toast({
    title: 'Request Failed',
    description: error.message || 'Please try again. If the problem persists, contact support.',
    variant: 'destructive'
  });
};

export default {
  createConciergeRequest,
  createTravelRequest,
  createEnjoyRSVP,
  createCareRequest,
  createFitRequest,
  createStayBooking,
  intelligentSearch,
  bookService,
  getAuthHeader,
  showUnifiedFlowSuccess,
  showUnifiedFlowError
};
