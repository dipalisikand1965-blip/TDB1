/**
 * Mira Hooks - Extracted from MiraDemoPage.jsx
 * =============================================
 * Stage 1 & 2 Refactoring
 * 
 * These hooks encapsulate reusable logic for:
 * - Voice input/output
 * - Pet management
 * - Vault/Picks management
 * - Conversation handling (future)
 * - Ticket management (future)
 */

export { default as useVoice } from './useVoice';
export { default as usePet, DEMO_PET, ALL_DEMO_PETS } from './usePet';
export { default as useVault } from './useVault';

// Placeholder for future hooks
// export { default as useConversation } from './useConversation';
// export { default as useTicket } from './useTicket';
