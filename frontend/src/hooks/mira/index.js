/**
 * Mira Hooks - Extracted from MiraDemoPage.jsx
 * =============================================
 * Stage 1, 2, 3 & 6 Refactoring
 * 
 * These hooks encapsulate reusable logic for:
 * - Voice input/output
 * - Pet management
 * - Vault/Picks management
 * - Session management
 * - Chat helpers (input preprocessing, mode detection, step detection)
 */

export { default as useVoice } from './useVoice';
export { default as usePet, DEMO_PET, ALL_DEMO_PETS } from './usePet';
export { default as useVault } from './useVault';
export { default as useSession } from './useSession';
export { 
  default as useChat,
  detectMiraMode,
  preprocessInput,
  detectStepId,
  extractCityFromQuery,
  detectContextTopic,
  hasTrainingIntent,
  extractTrainingTopic,
  shouldFetchTravelData,
  isMeaningfulTopic,
  isCelebrationQuery,
  MEANINGFUL_TOPICS
} from './useChat';
