/**
 * useChatSubmit Hook - Main Chat Submission Logic
 * 
 * Extracted from MiraDemoPage.jsx to improve maintainability.
 * This hook handles the core chat flow: user input → API call → response processing
 * 
 * Dependencies:
 * - useChat.js for helper functions
 * - External state passed in via config object
 */

import { useCallback, useRef } from 'react';
import conversationIntelligence from '../../utils/conversationIntelligence';
import { correctSpelling } from '../../utils/spellCorrect';
import { triggerCelebrationConfetti } from '../../utils/confetti';
import { onPicksRefresh } from '../../utils/picksDelights';
import { generateQuickReplies } from '../../components/Mira/QuickReplies';
import {
  isConciergeLive,
  generateConciergeRequest,
  detectServiceIntent,
  getComfortModeServices,
  detectExperienceIntent
} from '../../utils/miraConstants';
import {
  detectMiraMode,
  isComfortMode,
  buildMiraMessage,
  detectStepId,
  isMeaningfulTopic,
  detectContextTopic,
  hasTrainingIntent,
  extractTrainingTopic,
  extractCityFromQuery,
  shouldFetchTravelData,
  isCelebrationQuery,
  calculateVoiceDelay,
  createTopicShiftIndicator,
  createErrorMessage
} from './useChat';

/**
 * Main chat submission hook
 * @param {Object} config - Configuration object with all required state and setters
 */
const useChatSubmit = (config) => {
  const {
    // API Config
    API_URL,
    token,
    sessionId,
    
    // User & Pet
    user,
    pet,
    setPet,
    userCity,
    
    // Query State
    query,
    setQuery,
    
    // Conversation State
    conversationHistory,
    setConversationHistory,
    conversationContext,
    setConversationContext,
    conversationStage,
    setConversationStage,
    
    // Processing State
    isProcessing,  // Added to check if request is already in progress
    setIsProcessing,
    setShowSkeleton,
    setIsTyping,
    setMiraMode,
    
    // Ticket State
    currentTicket,
    setCurrentTicket,
    createOrAttachTicket,
    syncToServiceDesk,
    
    // Step State (Anti-loop)
    currentStep,
    setCurrentStep,
    completedSteps,
    setCompletedSteps,
    stepHistory,
    completeStep,
    isAskingForMoreInfo,
    clarifyingQuestionCount,
    setClarifyingQuestionCount,
    MAX_CLARIFYING_QUESTIONS,
    
    // Quick Replies
    setQuickReplies,
    extractQuickReplies,
    
    // Picks State
    miraPicks,
    setMiraPicks,
    setActiveVaultData,
    setVaultUserMessage,
    setShowVault,
    setShowTopPicksPanel,
    setShowInsightsPanel,
    
    // OS Tab State (for intelligent routing)
    setActiveOSTab,
    
    // FlowModal Triggers (for intelligent booking)
    setShowGroomingFlowModal,
    setShowVetVisitFlowModal,
    setShowCareServiceFlowModal,
    
    // Context Tracking
    lastShownProducts,
    setLastShownProducts,
    lastSearchContext,
    setLastSearchContext,
    
    // Memory State
    setActiveMemoryContext,
    
    // Soul Score
    setSoulScoreUpdated,
    
    // Proactive Alerts
    setProactiveAlerts,
    
    // Conversation End
    setShowConversationEndBanner,
    setConversationComplete,
    
    // Concierge
    setConciergeConfirmation,
    setShowConciergePanel,
    
    // Quick Send to Concierge (GLOW state trigger)
    setActionableSuggestion,
    
    // Training Videos
    setHasNewVideos,
    setNewVideosCount,
    
    // Pillar
    setPillar,
    
    // Services tab pulse (for highlighting after ticket creation)
    setServicesPulse,
    
    // Service launcher highlighting (for highlighting specific service like "Grooming")
    setHighlightedService,
    
    // Voice
    voiceEnabled,
    voiceTimeoutRef,
    speakWithMira,
    stopSpeaking,
    
    // Haptic & Sound
    hapticFeedback,
    notificationSounds,
    
    // Helper Functions (passed from useChat)
    fetchConversationMemory,
    fetchMoodContext,
    saveConversationMemory,
    routeIntent,
    fetchTrainingVideos,
    fetchTravelHotels,
    fetchTravelAttractions
  } = config;

  const handleSubmit = useCallback(async (e, voiceQuery = null) => {
    if (e) e.preventDefault();
    
    let inputQuery = voiceQuery || query;
    if (!inputQuery.trim()) return;
    
    // ═══════════════════════════════════════════════════════════════════
    // DUPLICATE REQUEST GUARD: Prevent multiple simultaneous submissions
    // This prevents the "I'm having a moment" error from double submissions
    // ═══════════════════════════════════════════════════════════════════
    if (isProcessing) {
      console.warn('[MIRA] Blocked duplicate submission - already processing');
      return;
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // VOICE SYNC FIX: Stop any playing voice when user sends new message
    // ═══════════════════════════════════════════════════════════════════
    if (voiceTimeoutRef?.current) {
      clearTimeout(voiceTimeoutRef.current);
      voiceTimeoutRef.current = null;
    }
    stopSpeaking();
    
    // HAPTIC: Send message feedback
    hapticFeedback.sendMessage();
    
    // INTELLIGENT SPELLING CORRECTION
    const { corrected, corrections, hasCorrections } = correctSpelling(inputQuery);
    if (hasCorrections) {
      console.log('[MIRA] Spelling corrected:', corrections);
      inputQuery = corrected;
    }
    
    // CONVERSATION INTELLIGENCE - Detect follow-ups and enrich query
    const intelligence = conversationIntelligence.enrichQueryWithContext(inputQuery, conversationContext);
    console.log('[MIRA Intelligence]', {
      isFollowUp: intelligence.followUp.isFollowUp,
      followUpType: intelligence.followUp.type,
      topic: intelligence.topic,
      contextUsed: intelligence.contextUsed
    });
    
    // If it's a selection follow-up, resolve the reference
    if (intelligence.followUp.isFollowUp && intelligence.followUp.type === 'select_item') {
      const resolved = conversationIntelligence.resolveReference(inputQuery, conversationContext.lastResults);
      if (resolved?.resolved) {
        console.log('[MIRA] Resolved reference:', resolved.item?.name || resolved.item);
        inputQuery = `${inputQuery} [RESOLVED: ${JSON.stringify(resolved.item)}]`;
      }
    }
    
    // Use enriched query if context was used
    if (intelligence.contextUsed.length > 0) {
      console.log('[MIRA] Using enriched query:', intelligence.enrichedQuery);
      inputQuery = intelligence.enrichedQuery;
    }
    
    // CRITICAL: Stop any existing voice when user sends new message
    stopSpeaking();
    
    // MIRA ENGINE MODE DETECTION
    setMiraMode(detectMiraMode(inputQuery));
    
    setIsProcessing(true);
    setQuery('');
    setQuickReplies([]);
    
    // Show skeleton loader after 800ms if still processing
    const skeletonTimer = setTimeout(() => {
      setShowSkeleton(true);
    }, 800);
    
    const userMessage = {
      type: 'user',
      content: corrected || inputQuery,
      timestamp: new Date()
    };
    setConversationHistory(prev => [...prev, userMessage]);
    
    try {
      // E033: Check for relevant past conversation memory
      const memoryContext = await fetchConversationMemory(pet?.id, inputQuery);
      
      // E025: Check for pet mood concerns
      const moodContext = pet?.id ? await fetchMoodContext(inputQuery, pet.name) : null;
      
      // STEP 1: Route intent (first call for first message)
      let pillar = currentTicket?.pillar || 'General';
      let intent = currentTicket?.intent || 'GENERAL_HELP';
      let lifeState = currentTicket?.lifeState || 'EXPLORE';
      let ticketId = currentTicket?.id;
      
      // Check if user is asking for more info
      const askingForMoreInfo = isAskingForMoreInfo(inputQuery);
      
      // ANTI-LOOP: If there's a current step waiting for answer, complete it
      if (currentStep && currentTicket?.id && !askingForMoreInfo) {
        await completeStep(currentTicket.id, currentStep.step_id, inputQuery);
        console.log('[STEP] Answered pending step:', currentStep.step_id, '-> Answer:', inputQuery);
      } else if (askingForMoreInfo) {
        console.log('[STEP] User asking for more info, NOT completing step:', currentStep?.step_id);
      }
      
      if (!currentTicket) {
        // First message - route intent and create ticket
        const intentData = await routeIntent({
          userId: user?.id,
          petId: pet.id,
          query: inputQuery,
          pet,
          token,
          userCity
        });
        
        pillar = intentData.pillar;
        intent = intentData.intent_primary;
        lifeState = intentData.life_state;
        
        // STEP 2: Create/attach ticket
        const ticketData = await createOrAttachTicket({
          userId: user?.id,
          petId: pet.id,
          pillar,
          intent,
          intentSecondary: intentData.intent_secondary,
          lifeState,
          query: inputQuery,
          token
        });
        
        ticketId = ticketData.ticket_id;
        
        setCurrentTicket({
          id: ticketId,
          status: ticketData.status,
          pillar: pillar,
          intent: intent,
          lifeState: lifeState
        });
        
        console.log('[TICKET] Created/attached:', ticketId, 'Pillar:', pillar);
      } else {
        // Not the first message - just sync the user message
        await syncToServiceDesk(currentTicket.id, userMessage);
      }
      
      // STEP 3: Get Mira's response — try streaming first, fall back to /api/mira/chat
      // Streaming gives word-by-word display (same as MiraChatWidget)

      let streamingSucceeded = false;
      try {
        const streamRes = await fetch(`${API_URL}/api/mira/os/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
          body: JSON.stringify({
            message: inputQuery,
            pet_id: pet?.id,
            pet_name: pet?.name,
            pet_breed: pet?.breed,
            soul_answers: pet?.doggy_soul_answers || {},
            history: conversationHistory?.slice(-10) || [],
          }),
          signal: AbortSignal.timeout(15000),
        });

        if (streamRes.ok && streamRes.body) {
          streamingSucceeded = true;
          const reader = streamRes.body.getReader();
          const decoder = new TextDecoder();
          let fullText = '';

          // Show a streaming placeholder message
          if (setIsTyping) setIsTyping(true);

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            for (const line of chunk.split('\n')) {
              if (!line.startsWith('data: ')) continue;
              const data = line.slice(6).trim();
              if (data === '[DONE]') break;
              try {
                const tok = JSON.parse(data).text || '';
                if (tok) {
                  fullText += tok;
                  // Update UI progressively via setIsTyping + response
                  if (setQuery) setQuery(''); // keep input clear
                }
              } catch {}
            }
          }

          if (setIsTyping) setIsTyping(false);

          // Inject the full response into the conversation as a Mira message
          const streamMiraMsg = {
            id: Date.now(),
            role: 'assistant',
            content: fullText,
            response: fullText,
            text: fullText,
            type: 'mira_stream',
            timestamp: new Date().toISOString(),
          };

          if (setConversationHistory) {
            setConversationHistory(prev => [...(prev || []), streamMiraMsg]);
          }

          // tdc.chat tracking
          try {
            const { tdc } = await import('../../utils/tdc_intent');
            tdc.chat({ message: inputQuery, reply: fullText, pillar: pillar || 'mira_os', pet, channel: 'mira_os_stream' });
          } catch {}

          return; // Don't fall through to /api/mira/chat
        }
      } catch (streamErr) {
        console.log('[MiraOS] Streaming failed, falling back to /api/mira/chat:', streamErr?.message);
      }

      // STEP 3b: Fallback — /api/mira/chat (original path)
      const response = await fetch(`${API_URL}/api/mira/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          message: inputQuery,
          session_id: sessionId,
          source: 'mira_demo',
          current_pillar: pillar || 'mira-demo',
          selected_pet_id: pet.id,
          // FULL PET CONTEXT - Critical for personalization!
          pet_context: {
            // Core identity
            id: pet.id,
            name: pet.name,
            breed: pet.breed || pet.identity?.breed,
            age: pet.age || pet.identity?.age,
            weight: pet.weight || pet.identity?.weight,
            birthday: pet.birthday || pet.identity?.birthday,
            gender: pet.gender || pet.identity?.gender,
            species: pet.species || 'dog',
            
            // Health & Allergies - CRITICAL for personalization
            allergies: pet.allergies || pet.health?.allergies || [],
            sensitivities: pet.sensitivities || pet.health?.sensitivities || [],
            medical_conditions: pet.medical_conditions || pet.health?.conditions || [],
            
            // Preferences & Favorites
            preferences: pet.preferences || pet.food_preferences || {},
            favorites: pet.favorites || {},
            favorite_treats: pet.favorite_treats || pet.preferences?.favorite_treats || [],
            dietary_restrictions: pet.dietary_restrictions || pet.food_preferences?.restrictions || [],
            
            // Personality & Behavior - For that personal touch
            personality: pet.personality || pet.behavior?.personality,
            traits: pet.traits || [],
            activity_level: pet.activity_level || pet.behavior?.activity_level,
            temperament: pet.temperament || pet.behavior?.temperament,
            
            // Soul data - The heart of personalization
            soul_score: pet.soul_score || pet.soulScore,
            soul_data: pet.soul_data || pet.soulData || {},
            doggy_soul_answers: pet.doggy_soul_answers || {},
            
            // Location
            city: pet?.city || pet?.location?.city || userCity || 'Mumbai',
            location: { city: pet?.city || pet?.location?.city || userCity || 'Mumbai' }
          },
          pet_name: pet.name,
          pet_breed: pet.breed || pet.identity?.breed,
          user_city: userCity || pet?.city || 'Mumbai',  // For location-based recommendations
          // Additional context for enhanced responses
          ticket_id: ticketId,
          conversation_history: conversationHistory.slice(-10).map(m => ({
            role: m.type === 'user' ? 'user' : 'assistant',
            content: m.content
          }))
        })
      });
      
      const data = await response.json();
      
      // Check if response is valid
      if (!response.ok) {
        console.error('[MIRA CHAT] Server error:', response.status, data);
        throw new Error(`Server error: ${response.status}`);
      }
      
      console.log('[MIRA CHAT] Response received:', data.success !== false ? 'success' : 'failed');
      
      // ═══════════════════════════════════════════════════════════════════════════
      // FLOW MODAL TRIGGERS - THE MAGIC OF INTELLIGENT ROUTING
      // When Mira detects booking intent, auto-open the right FlowModal wizard
      // This creates the unified OS experience - chat intent → UI action
      // ═══════════════════════════════════════════════════════════════════════════
      if (data.flow_modal?.trigger) {
        console.log('[FLOW MODAL] Triggering:', data.flow_modal.type, 'for pet:', data.flow_modal.pet_name);
        
        // Trigger the appropriate FlowModal based on type
        const modalType = data.flow_modal.type;
        
        if (modalType === 'grooming' && typeof setShowGroomingFlowModal === 'function') {
          setShowGroomingFlowModal(true);
          console.log('[FLOW MODAL] ✨ Opening GroomingFlowModal');
        } else if (modalType === 'vet_visit' && typeof setShowVetVisitFlowModal === 'function') {
          setShowVetVisitFlowModal(true);
          console.log('[FLOW MODAL] ✨ Opening VetVisitFlowModal');
        } else if (modalType === 'care_service' && typeof setShowCareServiceFlowModal === 'function') {
          setShowCareServiceFlowModal(true);
          console.log('[FLOW MODAL] ✨ Opening CareServiceFlowModal');
        }
        
        // Activate the corresponding OS tab for coherent experience
        if (data.active_tab && typeof setActiveOSTab === 'function') {
          setActiveOSTab(data.active_tab);
          console.log('[OS TAB] ✨ Activating tab:', data.active_tab);
        }
        
        // Still show Mira's response, but don't return early
      }
      
      // UI ACTION HANDLER (for backwards compatibility)
      if (data.ui_action?.type === 'open_picks_vault') {
        console.log('[UI ACTION] Opening Personalized Picks Panel for:', data.ui_action.pet_name);
        setShowTopPicksPanel(true);
        setIsProcessing(false);
        return;
      }
      
      // ═══════════════════════════════════════════════════════════════════════════
      // SOULFUL BRAIN HINTS - Tab highlighting and pillar context
      // When the soulful brain detects service/topic context, it provides hints
      // ═══════════════════════════════════════════════════════════════════════════
      
      // Highlight the relevant OS tab (e.g., SERVICES glows after ticket created)
      if (data.highlight_tab) {
        console.log('[SOULFUL] Highlighting tab:', data.highlight_tab);
        // Specifically handle services tab pulse
        if (data.highlight_tab === 'services' && typeof setServicesPulse === 'function') {
          setServicesPulse(true);
          // Auto-clear highlight after 5 seconds
          setTimeout(() => setServicesPulse(false), 5000);
        }
      }
      
      // Set suggested pillar for PICKS context (e.g., grooming → care pillar)
      if (data.suggested_pillar && typeof setPillar === 'function') {
        console.log('[SOULFUL] Auto-setting pillar from conversation:', data.suggested_pillar);
        setPillar(data.suggested_pillar);
      }
      
      // Highlight the relevant service launcher in SERVICES panel
      if (data.highlight_service && typeof setHighlightedService === 'function') {
        console.log('[SOULFUL] Highlighting service launcher:', data.highlight_service);
        setHighlightedService(data.highlight_service);
        // Auto-clear after 8 seconds
        setTimeout(() => setHighlightedService(null), 8000);
      }
      
      // REAL-TIME SOUL SCORE UPDATE
      if (data.pet_soul_score !== undefined && data.pet_soul_score !== null) {
        const newScore = Math.round(data.pet_soul_score);
        const oldScore = pet?.soulScore || 0;
        
        if (newScore > oldScore) {
          setSoulScoreUpdated(true);
          setTimeout(() => setSoulScoreUpdated(false), 2000);
          console.log(`[SOUL SCORE] Grew from ${oldScore}% to ${newScore}%!`);
        }
        
        setPet(prev => ({
          ...prev,
          soulScore: newScore
        }));
        console.log('[SOUL SCORE] Updated to:', newScore);
      }
      
      // Handle response - /api/mira/chat returns `response` directly as string
      // while /api/mira/os/understand-with-products returns `response.message`
      let miraResponseText = typeof data.response === 'string' 
        ? data.response 
        : (data.response?.message || data.message || "I'm here to help!");
      
      // MEMORY WHISPER
      if (memoryContext?.relevant_memory) {
        setActiveMemoryContext(memoryContext);
        console.log('[MEMORY WHISPER] Showing memory context as whisper:', memoryContext.relevant_memory.topic);
      }
      
      // E025: Handle mood detection
      if (moodContext?.mood_detected) {
        const moodResponse = moodContext.response;
        miraResponseText = `${moodResponse.intro} ${moodResponse.suggestion}\n\n${miraResponseText}`;
        console.log('[MOOD] Added mood-aware intro to response');
        
        if (moodContext.should_save_memory && pet?.id) {
          saveConversationMemory({
            petId: pet.id,
            topic: 'behavior',
            summary: `${pet.name} ${moodContext.matched_indicator}`,
            query: inputQuery,
            advice: moodResponse.suggestion
          });
        }
      }
      
      // Extract contextual quick replies - handle both response formats
      const quickReplies = extractQuickReplies(data);
      
      // Check if Mira's response has a new clarifying question
      let miraStepId = (typeof data.response === 'object' ? data.response?.step_id : null) || detectStepId(miraResponseText);
      
      if (miraStepId) {
        console.log('[STEP] Detected step_id:', miraStepId);
      }
      
      // Check if this step has already been completed (anti-loop)
      const isAlreadyCompleted = miraStepId && completedSteps.includes(miraStepId);
      const isNewClarifyingQuestion = miraStepId && !isAlreadyCompleted;
      
      if (isAlreadyCompleted) {
        console.log('[ANTI-LOOP] Step already completed, should not show:', miraStepId);
      }
      
      if (isNewClarifyingQuestion) {
        setCurrentStep({
          step_id: miraStepId,
          question: miraResponseText
        });
        console.log('[STEP] New clarifying question, step_id:', miraStepId);
      }
      
      // MIRA DOCTRINE: Show products when AI decides they're relevant
      // Handle both response formats
      const products = data.products || (typeof data.response === 'object' ? data.response?.products : null) || [];
      let shouldShowProducts = products.length > 0;
      
      // COMFORT MODE - Be the Great Mother, not a salesman
      const inComfortMode = isComfortMode(inputQuery, conversationHistory);
      
      if (inComfortMode) {
        console.log('[COMFORT_MODE] Detected emotional moment - suppressing products');
        shouldShowProducts = false;
      }
      
      // Detect service intent
      let detectedServices = [];
      if (inComfortMode) {
        detectedServices = getComfortModeServices(inputQuery);
      } else {
        detectedServices = detectServiceIntent(inputQuery);
      }
      const hasServiceIntent = detectedServices.length > 0;
      
      // Detect experience intent
      let detectedExperiences = [];
      if (!inComfortMode) {
        detectedExperiences = detectExperienceIntent(inputQuery);
      }
      const hasExperienceIntent = detectedExperiences.length > 0;
      
      // Dynamic concierge request
      const hasNoDirectMatch = !shouldShowProducts && !hasServiceIntent && !hasExperienceIntent;
      const dynamicConciergeRequest = hasNoDirectMatch ? generateConciergeRequest(inputQuery, pet.name) : null;
      
      const conciergeIsLive = isConciergeLive();
      
      // Build Mira message
      const miraMessage = buildMiraMessage({
        content: miraResponseText,
        data,
        quickReplies,
        shouldShowProducts,
        detectedServices,
        detectedExperiences,
        conciergeIsLive,
        inComfortMode,
        miraStepId,
        isNewClarifyingQuestion
      });
      
      // MIRA PICKS TRAY - Store products/services
      let newProducts = !inComfortMode ? (data.response?.products || []) : [];
      let newServices = (data.response?.services?.length > 0) 
        ? data.response.services 
        : (hasServiceIntent ? detectedServices : []);
      let newExperiences = hasExperienceIntent ? detectedExperiences : [];
      
      // CONVERSATION INTELLIGENCE - Track context
      if (newProducts.length > 0 || newServices.length > 0) {
        const itemsForTracking = [
          ...newProducts.map(p => ({ name: p.name, price: p.price, id: p.id, type: 'product' })),
          ...newServices.map(s => ({ name: s.name, price: s.price, id: s.id, type: 'service' }))
        ];
        setLastShownProducts(itemsForTracking);
        console.log('[INTELLIGENCE] Tracking', itemsForTracking.length, 'items for pronoun resolution');
      }
      
      // Save search context
      if (data.intelligence?.last_search_context) {
        setLastSearchContext(data.intelligence.last_search_context);
        console.log('[INTELLIGENCE] Tracking search context:', data.intelligence.last_search_context.pillar);
      }
      
      // Detect context from intent
      const { topic: detectedTopic, context: pickContext } = detectContextTopic(inputQuery, pet.name);
      const celebrationSubIntent = detectedTopic;
      
      // YOUTUBE TRAINING VIDEOS
      let trainingVideos = [];
      if (hasTrainingIntent(inputQuery) && pet?.id) {
        const videoTopic = extractTrainingTopic(inputQuery);
        trainingVideos = await fetchTrainingVideos(videoTopic, pet.breed || '');
        
        if (trainingVideos.length > 0) {
          setHasNewVideos(true);
          setNewVideosCount(prev => prev + trainingVideos.length);
          notificationSounds.tip();
          console.log(`[LEARN] ${trainingVideos.length} new training videos available!`);
        }
      }
      
      // AMADEUS TRAVEL
      let travelHotels = [];
      let travelAttractions = [];
      
      const detectedCity = extractCityFromQuery(inputQuery);
      const shouldFetchHotels = detectedCity && shouldFetchTravelData(
        inputQuery, 
        conversationHistory.length, 
        data
      );
      
      if (shouldFetchHotels) {
        console.log('[TRAVEL FLOW] Confirmed - fetching hotels for:', detectedCity);
        [travelHotels, travelAttractions] = await Promise.all([
          fetchTravelHotels(detectedCity),
          fetchTravelAttractions(detectedCity)
        ]);
      } else if (detectedCity) {
        console.log('[TRAVEL FLOW] City detected but waiting for confirmation. City:', detectedCity);
      }
      
      // Add YouTube, Amadeus, and Viator data to message
      miraMessage.data.training_videos = trainingVideos;
      miraMessage.data.travel_hotels = travelHotels;
      miraMessage.data.travel_attractions = travelAttractions;
      miraMessage.data.travel_city = detectedCity;
      
      // E032: SEMANTIC SEARCH - Enhance with intent-based recommendations
      let updatedPickContext = pickContext;
      if (!inComfortMode && pet?.id && (newProducts.length < 3 || newServices.length < 1)) {
        try {
          const semanticResponse = await fetch(`${API_URL}/api/mira/semantic-search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: inputQuery,
              pet_id: pet.id,
              pet_name: pet.name,
              limit: 6
            })
          });
          const semanticData = await semanticResponse.json();
          
          if (semanticData.success && semanticData.intent_detected) {
            console.log('[SEMANTIC] Intent detected:', semanticData.primary_intent, '| Results:', semanticData.total_results);
            
            const existingProductIds = new Set(newProducts.map(p => p.id));
            const semanticProducts = (semanticData.products || []).filter(p => !existingProductIds.has(p.id));
            newProducts = [...newProducts, ...semanticProducts].slice(0, 8);
            
            const existingServiceIds = new Set(newServices.map(s => s.id));
            const semanticServices = (semanticData.services || []).filter(s => !existingServiceIds.has(s.id));
            newServices = [...newServices, ...semanticServices].slice(0, 4);
            
            const semanticExperiences = semanticData.experiences || [];
            newExperiences = [...newExperiences, ...semanticExperiences].slice(0, 3);
            
            if (semanticData.tray_context && semanticData.total_results > 0 && !updatedPickContext) {
              updatedPickContext = semanticData.tray_context;
            }
          }
        } catch (e) {
          console.log('[SEMANTIC] Search failed:', e.message);
        }
      }
      
      // E033: Save meaningful conversations to memory
      if (pet?.id && isMeaningfulTopic(detectedTopic) && miraResponseText.length > 50) {
        saveConversationMemory({
          petId: pet.id,
          topic: detectedTopic,
          summary: inputQuery.substring(0, 100),
          query: inputQuery,
          advice: miraResponseText.substring(0, 200)
        });
      }
      
      // MODE SYSTEM
      const miraMode = data.mode || 'GENERAL';
      const clarifyOnly = data.clarify_only || false;
      const shouldShowProductsFromBackend = data.show_products !== false;
      const shouldShowServicesFromBackend = data.show_services !== false;
      const shouldShowConcierge = data.show_concierge !== false;
      
      // ═══════════════════════════════════════════════════════════════════════════
      // CONVERSATION CONTRACT (Bible Section 10.0) - Phase 5
      // Deterministic UI rendering based on contract mode
      // mode: "answer" | "clarify" | "places" | "learn" | "ticket" | "handoff"
      // Frontend MUST render based ONLY on this contract - no UI inference from text
      // ═══════════════════════════════════════════════════════════════════════════
      const conversationContract = data.conversation_contract || {};
      const contractMode = conversationContract.mode || 'answer';
      const contractQuickReplies = conversationContract.quick_replies || [];
      const contractActions = conversationContract.actions || [];
      const contractPlacesResults = conversationContract.places_results || [];
      const contractYoutubeResults = conversationContract.youtube_results || [];
      const contractSpine = conversationContract.spine || {};
      const contractDebug = conversationContract._debug || {};
      
      if (contractMode !== 'answer') {
        console.log(`[CONVERSATION CONTRACT] mode=${contractMode} intent=${contractDebug.detected_intent} places_allowed=${contractDebug.places_call_allowed} youtube_allowed=${contractDebug.youtube_call_allowed}`);
      }
      
      // ═══════════════════════════════════════════════════════════════════════════
      // PICKS FALLBACK CONTRACT (Bible Section 9.0)
      // Explicit, deterministic contract from backend
      // fallback_mode: "catalogue" | "concierge" | "clarify"
      // NEVER show generic popular items when no match/low confidence/blocked by safety
      // ═══════════════════════════════════════════════════════════════════════════
      const picksContract = data.picks_contract || {};
      const fallbackMode = picksContract.fallback_mode || (data.concierge_fallback ? 'concierge' : 'catalogue');
      const fallbackReason = picksContract.fallback_reason || data.concierge_fallback_reason || null;
      const matchCount = picksContract.match_count || 0;
      const topScore = picksContract.top_score || 0.0;
      const blockedBySafety = picksContract.blocked_by_safety || false;
      const conciergeCards = picksContract.concierge_cards || data.concierge_arranges || [];
      const clarifyingQuestions = picksContract.clarifying_questions || [];
      
      // Legacy field support
      const conciergeFallback = fallbackMode === 'concierge' || fallbackMode === 'clarify';
      const conciergeArranges = conciergeCards;
      
      if (fallbackMode !== 'catalogue') {
        console.log(`[PICKS CONTRACT] mode=${fallbackMode} reason=${fallbackReason} match_count=${matchCount} top_score=${topScore.toFixed(3)} blocked_by_safety=${blockedBySafety}`);
      }
      
      console.log(`[MODE SYSTEM] Mode: ${miraMode} | Clarify only: ${clarifyOnly} | Show products: ${shouldShowProductsFromBackend} | Fallback mode: ${fallbackMode}`);
      
      // NEARBY PLACES
      const nearbyPlaces = data.nearby_places?.places || [];
      const placesType = data.nearby_places?.type || 'places';
      
      if (nearbyPlaces.length > 0) {
        console.log(`[PLACES] ${nearbyPlaces.length} ${placesType} found`);
        setMiraPicks(prev => ({
          ...prev,
          places: nearbyPlaces,
          placesType: placesType,
          mode: miraMode,
          showConcierge: shouldShowConcierge,
          hasNew: true
        }));
        setActiveVaultData({
          ...data.response,
          places: nearbyPlaces,
          nearby_places: data.nearby_places
        });
        setVaultUserMessage(inputQuery);
      } else if (fallbackMode === 'clarify' && clarifyingQuestions.length > 0) {
        // ═══════════════════════════════════════════════════════════════════════════
        // CLARIFY MODE: Ask clarifying questions before showing picks
        // Preserve any concierge suggestions from backend
        // ═══════════════════════════════════════════════════════════════════════════
        console.log(`[CLARIFY MODE] Showing ${clarifyingQuestions.length} clarifying questions, conciergeCards: ${conciergeCards.length}`);
        setMiraPicks({
          products: [],
          services: [],
          conciergeArranges: conciergeCards, // Preserve dynamic suggestions
          clarifyingQuestions: clarifyingQuestions,
          picksContract: picksContract,
          conversationContract: conversationContract,
          contractMode: contractMode,
          quickReplies: contractQuickReplies,
          placesResults: contractPlacesResults,
          youtubeResults: contractYoutubeResults,
          fallbackMode: fallbackMode,
          fallbackReason: fallbackReason,
          context: updatedPickContext,
          mode: miraMode,
          clarifyOnly: true,
          showConcierge: false,
          hasNew: true
        });
      } else if (contractMode === 'places' && contractPlacesResults.length > 0) {
        // ═══════════════════════════════════════════════════════════════════════════
        // PLACES MODE (Phase 5): Show Google Places results
        // conversation_contract.mode === "places"
        // ═══════════════════════════════════════════════════════════════════════════
        console.log(`[CONVERSATION CONTRACT PLACES] Showing ${contractPlacesResults.length} places from contract`);
        setMiraPicks({
          products: [],
          services: [],
          places: contractPlacesResults,
          placesType: 'places',
          conciergeArranges: conciergeCards, // Preserve dynamic suggestions
          picksContract: picksContract,
          conversationContract: conversationContract,
          contractMode: contractMode,
          quickReplies: contractQuickReplies,
          placesResults: contractPlacesResults,
          youtubeResults: [],
          fallbackMode: fallbackMode,
          context: updatedPickContext,
          mode: miraMode,
          clarifyOnly: false,
          showConcierge: false,
          hasNew: true
        });
        notificationSounds.picks();
      } else if (contractMode === 'learn' && contractYoutubeResults.length > 0) {
        // ═══════════════════════════════════════════════════════════════════════════
        // LEARN MODE (Phase 5): Show YouTube learning videos
        // conversation_contract.mode === "learn"
        // ═══════════════════════════════════════════════════════════════════════════
        console.log(`[CONVERSATION CONTRACT LEARN] Showing ${contractYoutubeResults.length} YouTube videos from contract`);
        setMiraPicks({
          products: [],
          services: [],
          places: [],
          youtubeVideos: contractYoutubeResults,
          conciergeArranges: conciergeCards, // Preserve dynamic suggestions
          picksContract: picksContract,
          conversationContract: conversationContract,
          contractMode: contractMode,
          quickReplies: contractQuickReplies,
          placesResults: [],
          youtubeResults: contractYoutubeResults,
          fallbackMode: fallbackMode,
          context: updatedPickContext,
          mode: miraMode,
          clarifyOnly: false,
          showConcierge: false,
          hasNew: true
        });
        notificationSounds.picks();
      } else if (fallbackMode === 'concierge' && conciergeCards.length > 0) {
        // ═══════════════════════════════════════════════════════════════════════════
        // CONCIERGE FALLBACK: No catalogue match - show Concierge Arranges cards
        // Bible Section 9.0: Never show generic popular items as substitutes
        // ═══════════════════════════════════════════════════════════════════════════
        console.log(`[CONCIERGE FALLBACK] Showing ${conciergeCards.length} Concierge Arrange cards | reason: ${fallbackReason}`);
        setMiraPicks({
          products: [],  // No catalogue products
          services: [],
          conciergeArranges: conciergeCards,
          picksContract: picksContract,
          conversationContract: conversationContract,
          contractMode: contractMode,
          quickReplies: contractQuickReplies,
          fallbackMode: fallbackMode,
          fallbackReason: fallbackReason,
          conciergeFallback: true,
          conciergeFallbackReason: fallbackReason,
          context: updatedPickContext,
          subIntent: celebrationSubIntent,
          mode: miraMode,
          clarifyOnly: false,
          showConcierge: true,
          hasNew: true
        });
        setActiveVaultData({
          ...data.response,
          concierge_arranges: conciergeCards,
          concierge_fallback: true,
          picks_contract: picksContract,
          conversation_contract: conversationContract
        });
        setVaultUserMessage(inputQuery);
        notificationSounds.picks();
        
        // ═══════════════════════════════════════════════════════════════════
        // QUICK SEND TO CONCIERGE: Trigger C° GLOW state
        // When Mira has actionable suggestions, light up the C° button
        // ═══════════════════════════════════════════════════════════════════
        if (setActionableSuggestion && conciergeCards.length > 0) {
          setActionableSuggestion({
            type: 'concierge_suggestion',
            summary: conciergeCards[0]?.title || conciergeCards[0]?.name || 'Mira\'s suggestion',
            message: data.response?.text || inputQuery,
            originalMessage: inputQuery,
            pillar: picksContract.pillar || 'advisory',
            items: conciergeCards.slice(0, 5)
          });
        }
        
        // NOTE: Don't auto-show vault - let user click PICKS tab instead
        // The +badge notification will guide them
        // if (conciergeCards.length > 0) {
        //   setShowVault(true);
        // }
      } else if ((shouldShowProductsFromBackend && (newProducts.length > 0 || newServices.length > 0 || newExperiences.length > 0)) || 
          (!clarifyOnly && ['party_planning', 'cake_shopping', 'celebration'].includes(celebrationSubIntent))) {
        // ═══════════════════════════════════════════════════════════════════════════
        // CATALOGUE MODE: Normal product rendering
        // fallback_mode === "catalogue" - render products/services normally
        // CRITICAL FIX: Preserve conciergeArranges from backend even in catalogue mode
        // These are Mira's dynamic suggestions that should appear in PICKS panel
        // ═══════════════════════════════════════════════════════════════════════════
        console.log(`[CATALOGUE MODE] conciergeCards from backend: ${conciergeCards.length}`);
        setMiraPicks({
          products: clarifyOnly ? [] : newProducts,
          services: clarifyOnly ? [] : [...newServices, ...newExperiences],
          conciergeArranges: conciergeCards, // FIXED: Preserve dynamic suggestions
          picksContract: picksContract,  // Include contract for consistency
          conversationContract: conversationContract,
          contractMode: contractMode,
          quickReplies: contractQuickReplies,
          fallbackMode: 'catalogue',
          conciergeFallback: false,
          context: updatedPickContext,
          subIntent: celebrationSubIntent,
          mode: miraMode,
          clarifyOnly: clarifyOnly,
          showConcierge: shouldShowConcierge,
          hasNew: !clarifyOnly && (newProducts.length > 0 || newServices.length > 0 || conciergeCards.length > 0)
        });
        
        // PICKS NOTIFICATION
        if (!clarifyOnly && (newProducts.length > 0 || newServices.length > 0)) {
          setActiveVaultData(data.response || data);
          setVaultUserMessage(inputQuery);
          console.log(`[PICKS READY] ${newProducts.length} products, ${newServices.length} services curated`);
          notificationSounds.picks();
        }
        
        // ═══════════════════════════════════════════════════════════════════
        // QUICK SEND TO CONCIERGE: Trigger C° GLOW state in catalogue mode
        // When Mira has actionable suggestions alongside products, light up C°
        // ═══════════════════════════════════════════════════════════════════
        if (setActionableSuggestion && conciergeCards.length > 0) {
          setActionableSuggestion({
            type: 'catalogue_with_suggestion',
            summary: conciergeCards[0]?.title || conciergeCards[0]?.name || 'Mira\'s recommendation',
            message: data.response?.text || inputQuery,
            originalMessage: inputQuery,
            pillar: picksContract.pillar || 'advisory',
            items: conciergeCards.slice(0, 5)
          });
        }
        
        // Check for places
        if (data.nearby_places?.places?.length > 0) {
          setMiraPicks(prev => ({
            ...prev,
            places: data.nearby_places.places,
            placesType: data.nearby_places.type,
            hasNew: true
          }));
          console.log(`[PLACES READY] ${data.nearby_places.places.length} ${data.nearby_places.type} found`);
          notificationSounds.picks();
        }
        
        // TIP CARD
        const tipCard = data.response?.tip_card;
        if (tipCard) {
          console.log(`[TIP CARD] ${tipCard.type}: ${tipCard.title}`);
          setMiraPicks(prev => ({
            ...prev,
            tipCard: tipCard,
            hasNew: true,
            hasNewTip: true
          }));
          setActiveVaultData({
            ...data.response,
            advice: tipCard.content,
            tip_card: tipCard
          });
          notificationSounds.tip();
          setTimeout(() => setShowInsightsPanel(true), 500);
        }
      } else if (clarifyOnly) {
        // CLARIFY MODE: Clear products but preserve any existing suggestions
        setMiraPicks(prev => ({
          ...prev,
          products: [],
          services: [],
          // Preserve existing conciergeArranges OR use new ones from backend
          conciergeArranges: conciergeCards.length > 0 ? conciergeCards : prev.conciergeArranges || [],
          conciergeFallback: false,
          mode: miraMode,
          clarifyOnly: true,
          showConcierge: false,
          hasNew: conciergeCards.length > 0
        }));
      }
      
      // TOPIC SHIFT HANDLING
      const topicShiftDetected = data.topic_shift || false;
      const currentPillar = data.current_pillar || 'general';
      const previousPillar = data.previous_pillar || null;
      
      if (topicShiftDetected) {
        console.log(`[TOPIC SHIFT] ${previousPillar} → ${currentPillar}`);
        const shiftIndicator = createTopicShiftIndicator(previousPillar, currentPillar);
        setConversationHistory(prev => [...prev, shiftIndicator, miraMessage]);
      } else {
        setConversationHistory(prev => [...prev, miraMessage]);
      }
      
      // UPDATE CONVERSATION CONTEXT
      const resultsToStore = data.nearby_places?.places || data.products || data.services || [];
      const resultsType = data.nearby_places?.type || (data.products?.length ? 'products' : 'services');
      const detectedLocation = data.nearby_places?.city || intelligence.entities.locations[0] || conversationContext.lastLocation;
      
      setConversationContext(prev => conversationIntelligence.updateContext(prev, {
        topic: intelligence.topic,
        results: resultsToStore,
        resultsType: resultsType,
        location: detectedLocation,
        preferences: intelligence.entities.preferences,
      }));
      
      console.log('[MIRA Context Updated]', {
        topic: intelligence.topic,
        resultsCount: resultsToStore.length,
        location: detectedLocation
      });
      
      // HAPTIC: Mira response complete
      hapticFeedback.miraResponse();
      
      // CONCIERGE CONFIRMATION BANNER
      if (data.concierge_confirmation?.show_banner) {
        setConciergeConfirmation(data.concierge_confirmation);
        console.log('[CONCIERGE CONFIRM] Service request banner shown:', data.concierge_confirmation.ticket_id);
        
        // Trigger SERVICES tab pulse for 5 seconds to draw attention
        if (typeof setServicesPulse === 'function') {
          setServicesPulse(true);
          setTimeout(() => setServicesPulse(false), 5000);
        }
      }
      
      // Auto-set pillar based on conversation context (from soulful brain)
      if (data.suggested_pillar && typeof setPillar === 'function') {
        console.log('[SOULFUL] Auto-setting pillar from conversation:', data.suggested_pillar);
        setPillar(data.suggested_pillar);
      }
      
      // ═══════════════════════════════════════════════════════════════════════════
      // PICKS ENGINE AUTO-REFRESH (B6)
      // Every chat turn receives picks from the picks engine
      // These are taxonomy-driven, scored, and safety-gated picks
      // ═══════════════════════════════════════════════════════════════════════════
      const picksEngineData = data.picks; // Array from picks_engine.py
      const picksEngineConcierge = data.concierge; // Concierge prominence decision
      const safetyOverride = data.safety_override; // Emergency/caution mode
      const missingProfileFields = data.missing_profile_fields || [];
      
      if (picksEngineData && Array.isArray(picksEngineData) && picksEngineData.length > 0) {
        console.log(`[PICKS ENGINE] Received ${picksEngineData.length} picks for pillar: ${data.pillar || 'general'}`);
        
        // Transform picks engine format to frontend format
        const enginePicks = picksEngineData.map(pick => ({
          id: pick.pick_id,
          name: pick.title,
          type: pick.pick_type, // 'booking', 'product', 'guide', 'concierge', 'emergency'
          pillar: pick.pillar,
          cta: pick.cta,
          reason: pick.reason, // Why this pick for this pet
          score: pick.final_score,
          service_vertical: pick.service_vertical,
          service_modes: pick.service_modes,
          concierge_complexity: pick.concierge_complexity,
          safety_level: pick.safety_level,
          booking_fields: pick.booking_fields,
          doc_requirements: pick.doc_requirements,
          warnings: pick.warnings,
          // Mark as from engine for UI distinction
          source: 'picks_engine'
        }));
        
        // Separate into products (buy intent) vs services (book intent)
        const engineProducts = enginePicks.filter(p => p.type === 'product');
        const engineServices = enginePicks.filter(p => ['booking', 'concierge', 'emergency', 'guide'].includes(p.type));
        
        // Update miraPicks with engine-driven picks
        setMiraPicks(prev => ({
          ...prev,
          // Engine picks take precedence when available
          enginePicks: enginePicks,
          engineProducts: engineProducts,
          engineServices: engineServices,
          // Auto-switch pillar based on classification
          activePillar: data.pillar || prev.activePillar,
          // Concierge decision
          concierge: picksEngineConcierge,
          // Safety state
          safetyOverride: safetyOverride,
          // Missing profile fields for micro-questions
          missingProfileFields: missingProfileFields,
          // Mark as fresh
          hasNew: true,
          lastUpdated: new Date().toISOString()
        }));
        
        // Log safety override if active
        if (safetyOverride?.active) {
          console.log(`[PICKS ENGINE] Safety override ACTIVE: ${safetyOverride.level}`);
          if (safetyOverride.level === 'emergency') {
            hapticFeedback.error(); // Alert haptic for emergency
          } else if (safetyOverride.level === 'caution') {
            hapticFeedback.warning(); // Warning haptic for caution
          }
        }
        
        // Log concierge prominence
        if (picksEngineConcierge?.cta_prominence === 'primary') {
          console.log(`[PICKS ENGINE] Concierge CTA prominence: PRIMARY - reason: ${picksEngineConcierge.reason}`);
        }
        
        // ═══════════════════════════════════════════════════════════════════════════
        // PICKS MICRO-DELIGHTS (Phase 1) - Sound, haptic, visual feedback
        // Makes the OS feel alive and responsive
        // ═══════════════════════════════════════════════════════════════════════════
        const picksTabElement = document.querySelector('[data-testid="picks-tab"]');
        onPicksRefresh({
          pillar: data.pillar || 'care',
          urgency: safetyOverride?.active ? safetyOverride.level : 'normal',
          picksCount: picksEngineData.length,
          tabElement: picksTabElement,
          onBadgeUpdate: null // Badge handled by state
        });
      }
      
      // QUICK REPLIES
      const picksArray = Array.isArray(picksEngineData) ? picksEngineData : [];
      const hasProducts = newProducts.length > 0 || (picksArray.filter(p => p.pick_type === 'product').length > 0);
      const hasServices = newServices.length > 0 || (picksArray.filter(p => ['booking', 'concierge'].includes(p.pick_type)).length > 0);
      const isAdvisory = !hasProducts && !hasServices && miraResponseText.length > 100;
      const currentPillarForReplies = data.current_pillar || data.pillar || 'general';
      
      // UPDATE PILLAR STATE
      if (currentPillarForReplies && currentPillarForReplies !== 'general') {
        setPillar(currentPillarForReplies);
        console.log(`[PILLAR] Updated currentPillar to: ${currentPillarForReplies}`);
      }
      
      // ═══════════════════════════════════════════════════════════════════════════
      // INTELLIGENT PANEL ROUTING - THE MAGIC STITCHING
      // Based on detected pillar and content, auto-open the RIGHT panel
      // This makes Mira feel intelligent - she doesn't just answer, she GUIDES
      // ═══════════════════════════════════════════════════════════════════════════
      const shouldAutoOpenPanel = (
        currentPillarForReplies && 
        currentPillarForReplies !== 'general' && 
        currentPillarForReplies !== 'advisory'
      );
      
      if (shouldAutoOpenPanel) {
        // If we have products/services for a specific pillar, show PICKS panel
        if (hasProducts || hasServices || (Array.isArray(picksEngineData) && picksEngineData.length > 0)) {
          console.log(`[INTELLIGENT ROUTING] Opening PICKS panel for pillar: ${currentPillarForReplies}`);
          setShowTopPicksPanel(true);
          // Also set the OS tab to PICKS
          if (typeof setActiveOSTab === 'function') {
            setActiveOSTab('picks');
          }
        }
        // If it's a service request pillar (care, stay, travel), show SERVICES panel
        const serviceRequestPillars = ['care', 'stay', 'travel', 'celebrate', 'dine'];
        if (serviceRequestPillars.includes(currentPillarForReplies) && data.concierge?.cta_prominence === 'primary') {
          console.log(`[INTELLIGENT ROUTING] Service request detected for: ${currentPillarForReplies}`);
          // The concierge CTA is primary - user likely wants to book something
        }
        // If pillar is LEARN, suggest LEARN panel
        if (currentPillarForReplies === 'learn' || currentPillarForReplies === 'advisory') {
          console.log(`[INTELLIGENT ROUTING] Educational content - LEARN panel relevant`);
        }
      }
      
      // MIRA OS CONTEXT
      if (data.os_context) {
        const osContext = data.os_context;
        console.log('[MIRA OS] Context received:', osContext);
        
        // 1. Auto-refresh Picks AND merge pillar-specific picks from os_context
        // ═══════════════════════════════════════════════════════════════════════════
        // CRITICAL FIX: Backend generates picks in os_context.{pillar}_picks
        // We MUST merge these into miraPicks state, not just set needsRefresh
        // Bible Rule: PICKS is NEVER empty - use Concierge Arranges as fallback
        // ═══════════════════════════════════════════════════════════════════════════
        const pillarPicksMap = {
          care: osContext.care_picks,
          celebrate: osContext.celebrate_picks,
          dine: osContext.dine_picks,
          stay: osContext.stay_picks,
          travel: osContext.travel_picks,
          enjoy: osContext.enjoy_picks
        };
        
        const activePillar = osContext.picks_update?.pillar || 'general';
        const pillarPicks = pillarPicksMap[activePillar] || [];
        
        if (pillarPicks.length > 0) {
          console.log(`[MIRA OS] Found ${pillarPicks.length} picks for pillar: ${activePillar}`);
          
          // Transform pillar picks into service cards
          const pillarServices = pillarPicks.map((pick, idx) => ({
            id: `${activePillar}-pick-${idx}-${Date.now()}`,
            type: 'service',
            category: pick.service_type || activePillar,
            title: pick.title,
            subtitle: pick.why || pick.subtitle,
            reason: pick.why,
            cta: pick.cta || 'Get Started',
            service_type: pick.service_type,
            concierge_always: pick.concierge_always || false,
            profile_used: pick.profile_used || [],
            pillar: activePillar,
            source: 'os_context',
            is_personalized: true,
            pet_name: pet?.name || 'your pet'
          }));
          
          if (setMiraPicks) {
            setMiraPicks(prev => ({
              ...prev,
              services: [...pillarServices, ...(prev.services || []).filter(s => s.source !== 'os_context')],
              activePillar: activePillar,
              hasNew: true,
              lastUpdated: new Date().toISOString(),
              refreshContext: osContext.picks_update?.context || activePillar
            }));
          }
        } else if (osContext.picks_update?.should_refresh && osContext.picks_update?.pillar) {
          // No pillar picks but refresh requested - ensure Concierge Arranges fallback
          console.log(`[MIRA OS] No pillar picks for ${activePillar}, using Concierge Arranges fallback`);
          
          // Bible Rule: PICKS is NEVER empty
          const conciergeFallback = {
            id: `concierge-arranges-${activePillar}-${Date.now()}`,
            type: 'service',
            category: 'concierge',
            title: `Concierge Arranges: ${activePillar.charAt(0).toUpperCase() + activePillar.slice(1)} Request`,
            subtitle: `Tell Mira what you need for ${pet?.name || 'your pet'}`,
            reason: 'Your personal pet concierge will coordinate this',
            cta: 'Get Help',
            service_type: `concierge_${activePillar}`,
            concierge_always: true,
            pillar: activePillar,
            source: 'concierge_fallback',
            is_personalized: true,
            pet_name: pet?.name || 'your pet'
          };
          
          if (setMiraPicks) {
            setMiraPicks(prev => ({
              ...prev,
              services: [conciergeFallback, ...(prev.services || []).filter(s => s.source !== 'concierge_fallback')],
              activePillar: activePillar,
              conciergeFallback: true,
              conciergeFallbackReason: `No catalogue matches for ${activePillar}`,
              needsRefresh: false,
              refreshContext: osContext.picks_update?.context || 'general'
            }));
          }
        }
        
        // 2. TEMPORAL AWARENESS
        if (osContext.temporal_context) {
          console.log('[MIRA OS] Temporal awareness:', osContext.temporal_context);
          const { type, days_until, message } = osContext.temporal_context;
          
          if (type && days_until !== undefined && days_until <= 14) {
            const temporalAlert = {
              id: `temporal_${type}_${Date.now()}`,
              type: type === 'birthday' ? 'birthday' : 'health',
              urgency: days_until <= 3 ? 'high' : days_until <= 7 ? 'medium' : 'low',
              title: type === 'birthday' ? `${pet?.name}'s Birthday Coming Up!` : message,
              message: message || `${days_until} days away`,
              days_until: days_until,
              pet_name: pet?.name
            };
            
            setProactiveAlerts(prev => ({
              ...prev,
              smartAlerts: [temporalAlert, ...(prev.smartAlerts || []).filter(a => !a.id.startsWith('temporal_'))],
              hasUrgent: days_until <= 3
            }));
          }
        }
        
        // 3. SAFETY GATES
        if (osContext.safety_gates?.length > 0) {
          console.log('[MIRA OS] Safety gates active:', osContext.safety_gates);
        }
        
        // 4. PROACTIVE ALERTS
        if (osContext.proactive_alerts?.length > 0) {
          console.log('[MIRA OS] Proactive alerts:', osContext.proactive_alerts);
          const newAlerts = osContext.proactive_alerts.map((alert, idx) => ({
            id: `os_alert_${Date.now()}_${idx}`,
            type: alert.type || 'health',
            urgency: alert.urgency || 'high',
            title: alert.title,
            message: alert.message,
            days_until: alert.days_until,
            pet_name: alert.pet_name || pet?.name
          }));
          
          setProactiveAlerts(prev => ({
            ...prev,
            smartAlerts: [...newAlerts, ...(prev.smartAlerts || []).filter(a => !a.id.startsWith('os_alert_'))],
            criticalCount: newAlerts.filter(a => a.urgency === 'critical').length,
            hasUrgent: newAlerts.some(a => a.urgency === 'critical' || a.urgency === 'high')
          }));
        }
        
        // 5. MEMORY RECALL
        if (osContext.memory_recall) {
          console.log('[MIRA OS] Memory recall:', osContext.memory_recall);
          setActiveMemoryContext({
            memory: osContext.memory_recall.memory,
            relevance: osContext.memory_recall.relevance,
            timestamp: new Date().toISOString()
          });
        }
        
        // 6. CONVERSATION CONTEXT FOR PICKS - Extract topic/destination for context-aware picks
        if (osContext.conversation_context?.topic || osContext.picks_context) {
          const picksContext = osContext.picks_context || osContext.conversation_context;
          console.log('[MIRA OS] Picks context:', picksContext);
          setMiraPicks(prev => ({
            ...prev,
            conversationContext: {
              topic: picksContext.topic || picksContext.subject,
              destination: picksContext.destination || picksContext.location
            }
          }));
        }
      }
      
      // ═══════════════════════════════════════════════════════════════════════════
      // CONVERSATION CONTEXT EXTRACTION - For context-aware PICKS
      // Detect travel destinations, activities, etc. from user message
      // ═══════════════════════════════════════════════════════════════════════════
      const travelDestinations = ['goa', 'mumbai', 'bangalore', 'delhi', 'himachal', 'manali', 'kerala', 'rajasthan', 'pondicherry', 'lonavala', 'ooty', 'shimla', 'darjeeling', 'udaipur', 'jaipur'];
      const activityKeywords = ['beach', 'mountain', 'trip', 'vacation', 'hotel', 'travel', 'grooming', 'birthday', 'party', 'training'];
      
      const messageLower = (inputQuery || query || '').toLowerCase();
      
      // Check for destinations
      const foundDestination = travelDestinations.find(dest => messageLower.includes(dest));
      // Check for activities
      const foundActivity = activityKeywords.find(act => messageLower.includes(act));
      
      if (foundDestination || foundActivity) {
        const contextTopic = foundDestination 
          ? `${foundActivity || 'trip'} to ${foundDestination}` 
          : foundActivity;
        
        console.log(`[PICKS CONTEXT] Detected: ${contextTopic}${foundDestination ? ` (destination: ${foundDestination})` : ''}`);
        
        setMiraPicks(prev => ({
          ...prev,
          conversationContext: {
            topic: contextTopic,
            destination: foundDestination || null
          },
          hasNew: true
        }));
      }
      
      // CRITICAL FIX: Use contextual quick replies from API response FIRST
      // Only fall back to pillar-based generic replies if API didn't provide any
      // This matches MiraOSModal behavior for identical experience
      if (quickReplies && quickReplies.length > 0) {
        // Use contextual quick replies from the API response
        setQuickReplies(quickReplies);
        console.log(`[QUICK REPLIES] Using ${quickReplies.length} contextual replies from API response`);
      } else {
        // Fallback to pillar-based generic replies only when API doesn't provide any
        const fallbackReplies = generateQuickReplies({
          pillar: currentPillarForReplies,
          hasProducts,
          hasServices,
          intent: data.understanding?.intent,
          isAdvisory,
          petName: pet?.name || 'your pet'
        });
        setQuickReplies(fallbackReplies);
        console.log(`[QUICK REPLIES] Fallback: Generated ${fallbackReplies.length} pillar-based suggestions for: ${currentPillarForReplies}`);
      }
      
      // Clear skeleton loader
      clearTimeout(skeletonTimer);
      setShowSkeleton(false);
      
      // MICRO-DELIGHT: Confetti for celebrations
      const isCelebratingNow = isCelebrationQuery(inputQuery) && 
                               !inComfortMode && 
                               !inputQuery.toLowerCase().includes('plan') &&
                               !inputQuery.toLowerCase().includes('prepare') &&
                               !inputQuery.toLowerCase().includes('suggest');
      if (isCelebratingNow) {
        setTimeout(() => {
          triggerCelebrationConfetti();
        }, 800);
      }
      
      // VOICE OUTPUT
      if (voiceEnabled && miraResponseText) {
        console.log('[MIRA VOICE] Triggering voice for response, text length:', miraResponseText.length);
        if (voiceTimeoutRef?.current) {
          clearTimeout(voiceTimeoutRef.current);
        }
        
        const voiceDelay = calculateVoiceDelay(miraResponseText, miraMode);
        voiceTimeoutRef.current = setTimeout(() => {
          console.log('[MIRA VOICE] Triggering voice via hook');
          speakWithMira(miraResponseText);
          voiceTimeoutRef.current = null;
        }, voiceDelay);
      } else {
        console.log('[MIRA VOICE] Voice not triggered - voiceEnabled:', voiceEnabled, 'text:', !!miraResponseText);
      }
      
      // Sync Mira's response to service desk
      if (ticketId || currentTicket?.id) {
        await syncToServiceDesk(ticketId || currentTicket.id, {
          type: 'mira',
          content: miraResponseText
        }, {
          label: lifeState,
          chips_offered: quickReplies?.map(r => r?.text || r?.label || '').filter(Boolean) || [],
          product_suggestions: shouldShowProducts ? 
            (data.response?.products?.slice(0, 5).map(p => ({ sku: p.id, name: p.name })) || []) : [],
          step_id: miraStepId,
          is_clarifying_question: isNewClarifyingQuestion
        });
      }
      
      // CLARIFYING QUESTION LIMIT
      if (isNewClarifyingQuestion) {
        const newCount = clarifyingQuestionCount + 1;
        setClarifyingQuestionCount(newCount);
        console.log(`[CLARIFY LIMIT] Question ${newCount} of ${MAX_CLARIFYING_QUESTIONS}`);
        
        if (newCount >= MAX_CLARIFYING_QUESTIONS) {
          console.log('[CLARIFY LIMIT] Max questions reached - auto-transitioning');
          if ((newProducts.length > 0 || newServices.length > 0) && miraPicks.products?.length > 0) {
            setShowVault(true);
          } else if (data.response?.tip_card) {
            setShowInsightsPanel(true);
          } else {
            setShowConversationEndBanner(true);
            setConversationComplete(true);
            
            // ═══════════════════════════════════════════════════════════════════
            // UNIFORM SERVICE FLOW: Trigger handoff to Concierge® when conversation
            // auto-completes (max clarifying questions reached)
            // This ensures admin notification is sent per UNIFIED_SERVICE_FLOW.md
            // ═══════════════════════════════════════════════════════════════════
            if (ticketId || currentTicket?.id) {
              const handoffTicketId = ticketId || currentTicket.id;
              console.log('[HANDOFF] Auto-triggering handoff for ticket:', handoffTicketId);
              
              // Build conversation summary from history
              const recentMessages = conversationHistory.slice(-6);
              const conversationSummary = recentMessages
                .map(m => `${m.type === 'user' ? 'Parent' : 'Mira'}: ${m.content?.slice(0, 100)}`)
                .join('\n');
              
              // Trigger handoff to Concierge® - This creates admin notification
              fetch(`${API_URL}/api/service_desk/handoff_to_concierge`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(token && { Authorization: `Bearer ${token}` })
                },
                body: JSON.stringify({
                  ticket_id: handoffTicketId,
                  concierge_queue: (pillar || currentTicket?.pillar || 'GENERAL').toUpperCase(),
                  latest_mira_summary: conversationSummary || 'Conversation auto-completed after clarifying questions.',
                  pillar: pillar || currentTicket?.pillar
                })
              }).then(res => {
                if (res.ok) {
                  console.log('[HANDOFF] ✅ Ticket handed to Concierge:', handoffTicketId);
                  // Trigger services tab pulse to notify user
                  if (setServicesPulse) setServicesPulse(true);
                }
              }).catch(err => {
                console.error('[HANDOFF] Failed to handoff:', err);
              });
            }
          }
          setClarifyingQuestionCount(0);
        }
      }
      
      // Update conversation stage
      if (conversationStage === 'initial') {
        setConversationStage('clarifying');
      }
      
    } catch (error) {
      console.error('Mira error:', error);
      console.error('Mira error stack:', error.stack);
      console.error('Mira error name:', error.name);
      console.error('Mira error message:', error.message);
      clearTimeout(skeletonTimer);
      setShowSkeleton(false);
      setIsTyping(false);
      
      hapticFeedback.error();
      
      const errorMessage = createErrorMessage(query);
      setConversationHistory(prev => [...prev, errorMessage]);
    }
    
    setIsProcessing(false);
    setShowSkeleton(false);
  }, [
    query, token, user, pet, extractQuickReplies, currentTicket, syncToServiceDesk, 
    conversationStage, completedSteps, stepHistory, currentStep, completeStep, isAskingForMoreInfo,
    voiceEnabled, speakWithMira, stopSpeaking, API_URL, sessionId, conversationHistory,
    conversationContext, userCity, lastShownProducts, lastSearchContext, clarifyingQuestionCount,
    MAX_CLARIFYING_QUESTIONS, miraPicks, hapticFeedback, notificationSounds, createOrAttachTicket,
    routeIntent, fetchConversationMemory, fetchMoodContext, saveConversationMemory,
    fetchTrainingVideos, fetchTravelHotels, fetchTravelAttractions, setQuery, setConversationHistory,
    isProcessing, setIsProcessing, setShowSkeleton, setMiraMode, setCurrentTicket, setCurrentStep,
    setClarifyingQuestionCount, setQuickReplies, setMiraPicks, setActiveVaultData, setVaultUserMessage,
    setShowVault, setShowTopPicksPanel, setShowInsightsPanel, setLastShownProducts, setLastSearchContext,
    setActiveMemoryContext, setSoulScoreUpdated, setPet, setProactiveAlerts, setShowConversationEndBanner,
    setConversationComplete, setConciergeConfirmation, setHasNewVideos, setNewVideosCount, setPillar,
    setConversationContext, setConversationStage, setIsTyping, voiceTimeoutRef
  ]);

  return { handleSubmit };
};

export default useChatSubmit;
