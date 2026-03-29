/**
 * useMiraShell.js
 * ===============
 * Single source of truth for Mira OS shell state.
 * 
 * Owns:
 * - Active tab
 * - Active thread/ticket
 * - Footer mode (0-4)
 * - Quick reply context
 * - Modal suppression
 * - Measured header/footer heights
 * 
 * Tabs do NOT directly render fixed composer or quick replies.
 * They emit intents, and MiraAppShell decides what to render.
 */

import { useReducer, useCallback, useEffect, useRef } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS (as JSDoc for JavaScript)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @typedef {'today' | 'picks' | 'services' | 'learn' | 'concierge'} MiraTab
 * @typedef {0 | 1 | 2 | 3 | 4} FooterMode
 * 0 = hidden
 * 1 = light prompt
 * 2 = active guided response (quick replies + composer)
 * 3 = full concierge thread (quick replies + composer + new messages pill)
 * 4 = modal active (suppress footer interactions)
 * 
 * @typedef {'none' | 'pending' | 'answered' | 'expired'} PendingQuestionStatus
 */

// ═══════════════════════════════════════════════════════════════════════════
// INITIAL STATE
// ═══════════════════════════════════════════════════════════════════════════

const initialQuickReplyContext = {
  activeTicketId: null,
  activeThreadId: null,
  activeQuestionId: null,
  activeQuestionType: null,
  questionStatus: 'none',
  options: [],
  source: null,
  generatedAt: null,
};

const initialShellState = {
  // Navigation / context
  activeTab: 'today',
  activePetId: null,

  // Header measurement
  header: {
    measuredHeight: 0,
    hasSubnavRow: false,
    subnavKey: null,
  },

  // Layout measurements
  layout: {
    headerHeight: 0,
    interactionFooterHeight: 0,
    safeAreaBottom: 0,
  },

  // Active thread/ticket state
  thread: {
    activeTicketId: null,
    activeThreadId: null,
    pillar: null,
    subPillar: null,
    status: 'idle', // 'idle' | 'active' | 'waiting_user' | 'waiting_concierge' | 'closed'
    entryPoint: null,
  },

  // Modal state
  modal: {
    isOpen: false,
    modalType: null,
    modalId: null,
  },

  // Interaction footer (single owner)
  interactionFooter: {
    mode: 1, // Default to light prompt
    promptPlaceholder: 'Ask Mira anything...',

    composer: {
      isVisible: true,
      placeholder: 'Ask Mira anything...',
      value: '',
      isSending: false,
      isDisabled: false,
      draftKey: null,
      attachmentsEnabled: true,
      voiceEnabled: false, // Default OFF - voice should be opt-in
    },

    quickReplies: { ...initialQuickReplyContext },

    newMessages: {
      isVisible: false,
      count: 0,
      anchor: 'above_composer',
    },

    isSuppressedByModal: false,
    isKeyboardOpen: false,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Clear quick replies to initial state
 */
const clearQuickReplies = () => ({ ...initialQuickReplyContext });

/**
 * Resolve footer mode based on tab and thread state
 * @param {MiraTab} tab 
 * @param {Object} thread 
 * @param {Object} modal 
 * @returns {FooterMode}
 */
const resolveFooterModeForTab = (tab, thread, modal) => {
  if (modal?.isOpen) return 4;

  const hasActiveThread = !!thread?.activeTicketId;

  switch (tab) {
    case 'concierge':
      return hasActiveThread ? 3 : 1;
    case 'picks':
      return hasActiveThread ? 2 : 1;
    case 'services':
      return hasActiveThread ? 2 : 0;
    case 'learn':
      return hasActiveThread ? 2 : 1;
    case 'today':
      return hasActiveThread ? 2 : 1;
    default:
      return 0;
  }
};

/**
 * Sync CSS variables for layout measurements
 */
const syncLayoutVars = (headerHeight, footerHeight) => {
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--mira-header-h', `${headerHeight}px`);
    document.documentElement.style.setProperty('--header-height', `${headerHeight}px`); // canonical token
    document.documentElement.style.setProperty('--mira-interaction-footer-h', `${footerHeight}px`);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// REDUCER
// ═══════════════════════════════════════════════════════════════════════════

const miraShellReducer = (state, action) => {
  switch (action.type) {
    // ─────────────────────────────────────────────────────────────────────────
    // TAB_CHANGED - Clear stale state, update mode
    // ─────────────────────────────────────────────────────────────────────────
    case 'TAB_CHANGED': {
      const nextTab = action.tab;
      const newMode = resolveFooterModeForTab(nextTab, state.thread, state.modal);
      
      return {
        ...state,
        activeTab: nextTab,
        interactionFooter: {
          ...state.interactionFooter,
          mode: newMode,
          // Clear quick replies on tab change (prevent stale chips)
          quickReplies: clearQuickReplies(),
          newMessages: { 
            ...state.interactionFooter.newMessages, 
            isVisible: false, 
            count: 0 
          },
          composer: {
            ...state.interactionFooter.composer,
            placeholder: nextTab === 'concierge' 
              ? 'Message Concierge...' 
              : 'Ask Mira anything...',
          },
        },
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // THREAD_ACTIVATED - Open a request/ticket thread
    // ─────────────────────────────────────────────────────────────────────────
    case 'THREAD_ACTIVATED': {
      const { ticketId, threadId, pillar, subPillar, entryPoint } = action.payload;
      const newMode = resolveFooterModeForTab(state.activeTab, { activeTicketId: ticketId }, state.modal);
      
      return {
        ...state,
        thread: {
          activeTicketId: ticketId,
          activeThreadId: threadId || ticketId,
          pillar: pillar || null,
          subPillar: subPillar || null,
          status: 'active',
          entryPoint: entryPoint || state.activeTab,
        },
        interactionFooter: {
          ...state.interactionFooter,
          mode: newMode,
          composer: {
            ...state.interactionFooter.composer,
            isVisible: true,
            draftKey: `${state.activeTab}:${ticketId || 'none'}`,
          },
        },
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // THREAD_CLEARED - Clear active thread
    // ─────────────────────────────────────────────────────────────────────────
    case 'THREAD_CLEARED': {
      const newMode = resolveFooterModeForTab(state.activeTab, { activeTicketId: null }, state.modal);
      
      return {
        ...state,
        thread: {
          activeTicketId: null,
          activeThreadId: null,
          pillar: null,
          subPillar: null,
          status: 'idle',
          entryPoint: null,
        },
        interactionFooter: {
          ...state.interactionFooter,
          mode: newMode,
          quickReplies: clearQuickReplies(),
        },
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PENDING_QUESTION_SET - Mira is waiting for user input
    // ─────────────────────────────────────────────────────────────────────────
    case 'PENDING_QUESTION_SET': {
      const { ticketId, threadId, questionId, questionType, options, source } = action.payload;
      
      // Only set if matches current thread (prevents cross-thread contamination)
      if (ticketId && state.thread.activeTicketId && ticketId !== state.thread.activeTicketId) {
        console.warn('[MIRA SHELL] Ignoring pending question for different ticket:', ticketId);
        return state;
      }

      return {
        ...state,
        thread: {
          ...state.thread,
          status: 'waiting_user',
        },
        interactionFooter: {
          ...state.interactionFooter,
          mode: state.activeTab === 'concierge' ? 3 : 2,
          quickReplies: {
            activeTicketId: ticketId || state.thread.activeTicketId,
            activeThreadId: threadId || state.thread.activeThreadId,
            activeQuestionId: questionId,
            activeQuestionType: questionType,
            questionStatus: 'pending',
            options: options || [],
            source: source || 'backend',
            generatedAt: Date.now(),
          },
        },
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // QUICK_REPLY_SELECTED - User tapped a chip
    // ─────────────────────────────────────────────────────────────────────────
    case 'QUICK_REPLY_SELECTED': {
      return {
        ...state,
        interactionFooter: {
          ...state.interactionFooter,
          quickReplies: {
            ...state.interactionFooter.quickReplies,
            questionStatus: 'answered',
            options: [], // Clear options immediately
          },
        },
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // QUESTION_ADVANCED - Backend returns next question
    // ─────────────────────────────────────────────────────────────────────────
    case 'QUESTION_ADVANCED': {
      const { questionId, questionType, options, source } = action.payload;
      
      return {
        ...state,
        interactionFooter: {
          ...state.interactionFooter,
          quickReplies: {
            ...state.interactionFooter.quickReplies,
            activeQuestionId: questionId,
            activeQuestionType: questionType,
            questionStatus: 'pending',
            options: options || [],
            source: source || 'backend',
            generatedAt: Date.now(),
          },
        },
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // QUICK_REPLIES_CLEARED - Explicitly clear quick replies
    // ─────────────────────────────────────────────────────────────────────────
    case 'QUICK_REPLIES_CLEARED': {
      return {
        ...state,
        interactionFooter: {
          ...state.interactionFooter,
          quickReplies: clearQuickReplies(),
        },
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MODAL_OPENED - Suppress footer interactions
    // ─────────────────────────────────────────────────────────────────────────
    case 'MODAL_OPENED': {
      const { modalType, modalId } = action.payload;
      
      return {
        ...state,
        modal: {
          isOpen: true,
          modalType,
          modalId: modalId || null,
        },
        interactionFooter: {
          ...state.interactionFooter,
          mode: 4,
          isSuppressedByModal: true,
          newMessages: {
            ...state.interactionFooter.newMessages,
            isVisible: false,
          },
        },
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MODAL_CLOSED - Restore footer mode
    // ─────────────────────────────────────────────────────────────────────────
    case 'MODAL_CLOSED': {
      const newMode = resolveFooterModeForTab(state.activeTab, state.thread, { isOpen: false });
      
      return {
        ...state,
        modal: {
          isOpen: false,
          modalType: null,
          modalId: null,
        },
        interactionFooter: {
          ...state.interactionFooter,
          mode: newMode,
          isSuppressedByModal: false,
        },
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // KEYBOARD_OPENED / KEYBOARD_CLOSED (mobile)
    // ─────────────────────────────────────────────────────────────────────────
    case 'KEYBOARD_OPENED': {
      return {
        ...state,
        interactionFooter: {
          ...state.interactionFooter,
          isKeyboardOpen: true,
        },
      };
    }

    case 'KEYBOARD_CLOSED': {
      return {
        ...state,
        interactionFooter: {
          ...state.interactionFooter,
          isKeyboardOpen: false,
        },
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MEASUREMENTS_UPDATED - From ResizeObserver
    // ─────────────────────────────────────────────────────────────────────────
    case 'MEASUREMENTS_UPDATED': {
      const { headerHeight, footerHeight } = action.payload;
      const newLayout = { ...state.layout };
      
      if (headerHeight !== undefined) {
        newLayout.headerHeight = headerHeight;
      }
      if (footerHeight !== undefined) {
        newLayout.interactionFooterHeight = footerHeight;
      }

      // Sync CSS variables
      syncLayoutVars(newLayout.headerHeight, newLayout.interactionFooterHeight);

      return {
        ...state,
        layout: newLayout,
        header: {
          ...state.header,
          measuredHeight: newLayout.headerHeight,
        },
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // COMPOSER_VALUE_CHANGED
    // ─────────────────────────────────────────────────────────────────────────
    case 'COMPOSER_VALUE_CHANGED': {
      return {
        ...state,
        interactionFooter: {
          ...state.interactionFooter,
          composer: {
            ...state.interactionFooter.composer,
            value: action.value,
          },
        },
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // COMPOSER_SEND_STARTED / FINISHED
    // ─────────────────────────────────────────────────────────────────────────
    case 'COMPOSER_SEND_STARTED': {
      return {
        ...state,
        interactionFooter: {
          ...state.interactionFooter,
          composer: {
            ...state.interactionFooter.composer,
            isSending: true,
          },
        },
      };
    }

    case 'COMPOSER_SEND_FINISHED': {
      return {
        ...state,
        interactionFooter: {
          ...state.interactionFooter,
          composer: {
            ...state.interactionFooter.composer,
            isSending: false,
            value: '',
          },
        },
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // NEW_MESSAGES_RECEIVED
    // ─────────────────────────────────────────────────────────────────────────
    case 'NEW_MESSAGES_RECEIVED': {
      const { count } = action.payload;
      return {
        ...state,
        interactionFooter: {
          ...state.interactionFooter,
          newMessages: {
            ...state.interactionFooter.newMessages,
            isVisible: count > 0,
            count,
          },
        },
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SET_ACTIVE_PET
    // ─────────────────────────────────────────────────────────────────────────
    case 'SET_ACTIVE_PET': {
      return {
        ...state,
        activePetId: action.petId,
      };
    }

    default:
      return state;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// SELECTORS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Should quick replies be visible?
 */
export const shouldShowQuickReplies = (state) => {
  const { interactionFooter, thread } = state;
  const q = interactionFooter.quickReplies;

  if (interactionFooter.isSuppressedByModal) return false;
  if (interactionFooter.mode !== 2 && interactionFooter.mode !== 3) return false;

  return Boolean(
    q.activeQuestionId &&
    q.questionStatus === 'pending' &&
    q.options?.length > 0 &&
    (q.activeTicketId === thread.activeTicketId || !thread.activeTicketId)
  );
};

/**
 * Should composer be visible?
 */
export const shouldShowComposer = (state) => {
  const { interactionFooter, modal } = state;
  
  if (modal.isOpen) return false;
  if (interactionFooter.isSuppressedByModal) return false;
  if (interactionFooter.mode === 0 || interactionFooter.mode === 4) return false;
  
  return interactionFooter.composer.isVisible;
};

/**
 * Should site footer be visible?
 */
export const shouldShowSiteFooter = (state) => {
  const { activeTab, interactionFooter, modal } = state;
  
  // Hide in active concierge thread
  if (activeTab === 'concierge' && (interactionFooter.mode === 2 || interactionFooter.mode === 3)) {
    return false;
  }
  if (modal.isOpen) return false;
  
  return true;
};

/**
 * Get footer mode label for debugging
 */
export const getFooterModeLabel = (mode) => {
  const labels = {
    0: 'Hidden',
    1: 'Light Prompt',
    2: 'Active Guided',
    3: 'Full Concierge',
    4: 'Modal Active',
  };
  return labels[mode] || 'Unknown';
};

// ═══════════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════════

export const useMiraShell = (initialTab = 'today') => {
  const [state, dispatch] = useReducer(miraShellReducer, {
    ...initialShellState,
    activeTab: initialTab,
  });

  // Refs for ResizeObserver
  const headerRef = useRef(null);
  const footerRef = useRef(null);

  // ─────────────────────────────────────────────────────────────────────────
  // ResizeObserver for header
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!headerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height;
        dispatch({ 
          type: 'MEASUREMENTS_UPDATED', 
          payload: { headerHeight: height } 
        });
      }
    });

    observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // ResizeObserver for footer
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!footerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height;
        dispatch({ 
          type: 'MEASUREMENTS_UPDATED', 
          payload: { footerHeight: height } 
        });
      }
    });

    observer.observe(footerRef.current);
    return () => observer.disconnect();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Action dispatchers
  // ─────────────────────────────────────────────────────────────────────────
  const actions = {
    setTab: useCallback((tab) => {
      dispatch({ type: 'TAB_CHANGED', tab });
    }, []),

    activateThread: useCallback((payload) => {
      dispatch({ type: 'THREAD_ACTIVATED', payload });
    }, []),

    clearThread: useCallback(() => {
      dispatch({ type: 'THREAD_CLEARED' });
    }, []),

    setPendingQuestion: useCallback((payload) => {
      dispatch({ type: 'PENDING_QUESTION_SET', payload });
    }, []),

    selectQuickReply: useCallback((optionId, value) => {
      dispatch({ type: 'QUICK_REPLY_SELECTED', payload: { optionId, value } });
    }, []),

    advanceQuestion: useCallback((payload) => {
      dispatch({ type: 'QUESTION_ADVANCED', payload });
    }, []),

    clearQuickReplies: useCallback(() => {
      dispatch({ type: 'QUICK_REPLIES_CLEARED' });
    }, []),

    openModal: useCallback((modalType, modalId) => {
      dispatch({ type: 'MODAL_OPENED', payload: { modalType, modalId } });
    }, []),

    closeModal: useCallback(() => {
      dispatch({ type: 'MODAL_CLOSED' });
    }, []),

    setKeyboardOpen: useCallback((isOpen) => {
      dispatch({ type: isOpen ? 'KEYBOARD_OPENED' : 'KEYBOARD_CLOSED' });
    }, []),

    updateMeasurements: useCallback((payload) => {
      dispatch({ type: 'MEASUREMENTS_UPDATED', payload });
    }, []),

    setComposerValue: useCallback((value) => {
      dispatch({ type: 'COMPOSER_VALUE_CHANGED', value });
    }, []),

    startSend: useCallback(() => {
      dispatch({ type: 'COMPOSER_SEND_STARTED' });
    }, []),

    finishSend: useCallback(() => {
      dispatch({ type: 'COMPOSER_SEND_FINISHED' });
    }, []),

    setNewMessages: useCallback((count) => {
      dispatch({ type: 'NEW_MESSAGES_RECEIVED', payload: { count } });
    }, []),

    setActivePet: useCallback((petId) => {
      dispatch({ type: 'SET_ACTIVE_PET', petId });
    }, []),
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Computed selectors
  // ─────────────────────────────────────────────────────────────────────────
  const selectors = {
    showQuickReplies: shouldShowQuickReplies(state),
    showComposer: shouldShowComposer(state),
    showSiteFooter: shouldShowSiteFooter(state),
    footerModeLabel: getFooterModeLabel(state.interactionFooter.mode),
  };

  return {
    state,
    actions,
    selectors,
    refs: {
      headerRef,
      footerRef,
    },
    dispatch, // For advanced use cases
  };
};

export default useMiraShell;
