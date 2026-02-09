/**
 * Mira Hooks - Extracted from MiraDemoPage.jsx
 * =============================================
 * Stage 1, 2 & 3 Refactoring
 * 
 * These hooks encapsulate reusable logic for:
 * - Voice input/output
 * - Pet management
 * - Vault/Picks management
 * - Session management
 * - Conversation handling (future)
 */

export { default as useVoice } from './useVoice';
export { default as usePet, DEMO_PET, ALL_DEMO_PETS } from './usePet';
export { default as useVault } from './useVault';
export { default as useSession } from './useSession';

// Placeholder for future hooks
// export { default as useConversation } from './useConversation';
