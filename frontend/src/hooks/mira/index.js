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
 * - Chat helpers (input preprocessing, mode detection, step detection, API helpers)
 * - Streaming chat (SSE response streaming)
 * - Chat submission (main chat flow logic)
 * - Conversation state (Phase 2A)
 */

export { default as useVoice } from './useVoice';
export { default as usePet, DEMO_PET, ALL_DEMO_PETS } from './usePet';
export { default as useVault } from './useVault';
export { default as useSession } from './useSession';
export { default as useStreamingChat } from './useStreamingChat';
export { default as useChatSubmit } from './useChatSubmit';
export { default as useConversation } from './useConversation';
export { 
  default as useChat,
  // Detection helpers
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
  MEANINGFUL_TOPICS,
  // New helpers
  calculateVoiceDelay,
  isComfortMode,
  hasServiceIntent,
  extractQuickRepliesFromData,
  // Message builders
  createErrorMessage,
  createTopicShiftIndicator,
  createUserMessage,
  buildMiraMessage,
  // API helpers
  fetchConversationMemory,
  fetchMoodContext,
  routeIntent,
  createOrAttachTicket,
  fetchTrainingVideos,
  fetchTravelHotels,
  fetchTravelAttractions,
  saveConversationMemory,
  buildMemoryPrefix
} from './useChat';
