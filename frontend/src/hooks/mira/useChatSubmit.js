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
    
    // Training Videos
    setHasNewVideos,
    setNewVideosCount,
    
    // Pillar
    setPillar,
    
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
      
      // STEP 3: Get Mira's response
      const response = await fetch(`${API_URL}/api/mira/os/understand-with-products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          input: inputQuery,
          pet_id: pet.id,
          pet_context: {
            name: pet.name,
            breed: pet.breed,
            age: pet.age,
            traits: pet.traits,
            sensitivities: pet.sensitivities,
            favorites: pet.favorites,
            city: pet?.city || pet?.location?.city || userCity || 'Mumbai',
            location: { city: pet?.city || pet?.location?.city || userCity || 'Mumbai' }
          },
          page_context: 'mira-demo',
          session_id: sessionId,
          include_products: true,
          pillar: pillar,
          conversation_stage: conversationStage,
          ticket_id: ticketId,
          completed_steps: completedSteps,
          step_history: stepHistory.map(s => ({ step_id: s.step_id, answer: s.answer })),
          conversation_history: conversationHistory.slice(-10).map(m => ({
            role: m.type === 'user' ? 'user' : 'assistant',
            content: m.content
          })),
          user_asking_for_more_info: askingForMoreInfo,
          current_step: currentStep?.step_id || null,
          last_shown_items: lastShownProducts,
          last_search_context: lastSearchContext
        })
      });
      
      const data = await response.json();
      
      // UI ACTION HANDLER
      if (data.ui_action?.type === 'open_picks_vault') {
        console.log('[UI ACTION] Opening Personalized Picks Panel for:', data.ui_action.pet_name);
        setShowTopPicksPanel(true);
        setIsProcessing(false);
        return;
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
      
      let miraResponseText = data.response?.message || "I'm here to help!";
      
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
      
      // Extract contextual quick replies
      const quickReplies = extractQuickReplies(data);
      
      // Check if Mira's response has a new clarifying question
      let miraStepId = data.response?.step_id || detectStepId(miraResponseText);
      
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
      let shouldShowProducts = data.response?.products?.length > 0;
      
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
      
      console.log(`[MODE SYSTEM] Mode: ${miraMode} | Clarify only: ${clarifyOnly} | Show products: ${shouldShowProductsFromBackend}`);
      
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
      } else if ((shouldShowProductsFromBackend && (newProducts.length > 0 || newServices.length > 0 || newExperiences.length > 0)) || 
          (!clarifyOnly && ['party_planning', 'cake_shopping', 'celebration'].includes(celebrationSubIntent))) {
        setMiraPicks({
          products: clarifyOnly ? [] : newProducts,
          services: clarifyOnly ? [] : [...newServices, ...newExperiences],
          context: updatedPickContext,
          subIntent: celebrationSubIntent,
          mode: miraMode,
          clarifyOnly: clarifyOnly,
          showConcierge: shouldShowConcierge,
          hasNew: !clarifyOnly && (newProducts.length > 0 || newServices.length > 0)
        });
        
        // PICKS NOTIFICATION
        if (!clarifyOnly && (newProducts.length > 0 || newServices.length > 0)) {
          setActiveVaultData(data.response || data);
          setVaultUserMessage(inputQuery);
          console.log(`[PICKS READY] ${newProducts.length} products, ${newServices.length} services curated`);
          notificationSounds.picks();
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
        setMiraPicks(prev => ({
          ...prev,
          products: [],
          services: [],
          mode: miraMode,
          clarifyOnly: true,
          showConcierge: false,
          hasNew: false
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
      }
      
      // QUICK REPLIES
      const hasProducts = newProducts.length > 0 || (picksEngineData?.filter(p => p.pick_type === 'product').length > 0);
      const hasServices = newServices.length > 0 || (picksEngineData?.filter(p => ['booking', 'concierge'].includes(p.pick_type)).length > 0);
      const isAdvisory = !hasProducts && !hasServices && miraResponseText.length > 100;
      const currentPillarForReplies = data.current_pillar || data.pillar || 'general';
      
      // UPDATE PILLAR STATE
      if (currentPillarForReplies && currentPillarForReplies !== 'general') {
        setPillar(currentPillarForReplies);
        console.log(`[PILLAR] Updated currentPillar to: ${currentPillarForReplies}`);
      }
      
      // MIRA OS CONTEXT
      if (data.os_context) {
        const osContext = data.os_context;
        console.log('[MIRA OS] Context received:', osContext);
        
        // 1. Auto-refresh Picks
        if (osContext.picks_update?.should_refresh && osContext.picks_update?.pillar) {
          console.log(`[MIRA OS] Silently refreshing Picks for pillar: ${osContext.picks_update.pillar}`);
          if (setMiraPicks) {
            setMiraPicks(prev => ({
              ...prev,
              activePillar: osContext.picks_update.pillar,
              needsRefresh: true,
              refreshContext: osContext.picks_update.context || 'general'
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
      }
      
      const newQuickReplies = generateQuickReplies({
        pillar: currentPillarForReplies,
        hasProducts,
        hasServices,
        intent: data.understanding?.intent,
        isAdvisory,
        petName: pet?.name || 'your pet'
      });
      setQuickReplies(newQuickReplies);
      console.log(`[QUICK REPLIES] Generated ${newQuickReplies.length} suggestions for pillar: ${currentPillarForReplies}`);
      
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
          chips_offered: quickReplies.map(r => r.text),
          product_suggestions: shouldShowProducts ? 
            data.response?.products?.slice(0, 5).map(p => ({ sku: p.id, name: p.name })) : [],
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
    setIsProcessing, setShowSkeleton, setMiraMode, setCurrentTicket, setCurrentStep,
    setClarifyingQuestionCount, setQuickReplies, setMiraPicks, setActiveVaultData, setVaultUserMessage,
    setShowVault, setShowTopPicksPanel, setShowInsightsPanel, setLastShownProducts, setLastSearchContext,
    setActiveMemoryContext, setSoulScoreUpdated, setPet, setProactiveAlerts, setShowConversationEndBanner,
    setConversationComplete, setConciergeConfirmation, setHasNewVideos, setNewVideosCount, setPillar,
    setConversationContext, setConversationStage, setIsTyping, voiceTimeoutRef
  ]);

  return { handleSubmit };
};

export default useChatSubmit;
