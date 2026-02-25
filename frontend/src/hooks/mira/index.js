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
 * - Layer navigation (Bible-compliant OS navigation)
 */

export { default as useVoice } from './useVoice';
export { default as usePet, DEMO_PET, ALL_DEMO_PETS } from './usePet';
export { default as useVault } from './useVault';
export { default as useSession } from './useSession';
export { default as useStreamingChat } from './useStreamingChat';
export { default as useChatSubmit } from './useChatSubmit';
export { default as useConversation } from './useConversation';
export { default as useMiraUI } from './useMiraUI';
export { default as useProactiveAlerts } from './useProactiveAlerts';
export { default as useLayerNavigation } from './useLayerNavigation';
export { default as useChatContinuity } from './useChatContinuity';
export { default as useDraft } from './useDraft';
export { default as useIconState, ICON_STATE, TAB_IDS } from './useIconState';
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

// Shell state management
export { 
  default as useMiraShell,
  shouldShowQuickReplies,
  shouldShowComposer,
  shouldShowSiteFooter,
  getFooterModeLabel
} from './useMiraShell';
