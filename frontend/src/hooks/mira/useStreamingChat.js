/**
 * useStreamingChat.js
 * ====================
 * React hook for consuming Mira's streaming responses via SSE.
 * 
 * MIRA IS THE SOUL. Her words flow naturally, appearing one by one.
 */

import { useState, useCallback, useRef } from 'react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * Hook for streaming chat responses from Mira
 * 
 * @returns {Object} - { streamMessage, isStreaming, streamedText, products, tipCard, error, cancelStream }
 */
export const useStreamingChat = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [products, setProducts] = useState([]);
  const [tipCard, setTipCard] = useState(null);
  const [intelligence, setIntelligence] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [error, setError] = useState(null);
  
  const abortControllerRef = useRef(null);
  
  /**
   * Cancel an ongoing stream
   */
  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  }, []);
  
  /**
   * Stream a message from Mira
   * 
   * @param {Object} params - Request parameters
   * @param {string} params.input - User's message
   * @param {Object} params.petContext - Pet information
   * @param {Array} params.conversationHistory - Previous messages
   * @param {Array} params.lastShownItems - Products shown in last response (for pronoun resolution)
   * @param {Object} params.lastSearchContext - Previous search context (for follow-ups)
   * @param {Function} params.onToken - Callback for each token (optional)
   * @param {Function} params.onComplete - Callback when stream completes (optional)
   * @returns {Promise<Object>} - Full response when stream completes
   */
  const streamMessage = useCallback(async ({
    input,
    petContext,
    conversationHistory = [],
    sessionId = null,
    lastShownItems = [],
    lastSearchContext = null,
    onToken = null,
    onComplete = null
  }) => {
    // Cancel any existing stream
    cancelStream();
    
    // Reset state
    setIsStreaming(true);
    setStreamedText('');
    setProducts([]);
    setTipCard(null);
    setIntelligence(null);
    setMetadata(null);
    setError(null);
    
    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await fetch(`${API_URL}/api/mira/os/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({
          input,
          pet_context: petContext,
          conversation_history: conversationHistory,
          session_id: sessionId,
          last_shown_items: lastShownItems,
          last_search_context: lastSearchContext
        }),
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) {
        throw new Error(`Stream error: ${response.status}`);
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullMessage = '';
      let receivedProducts = [];
      let receivedTipCard = null;
      let receivedIntelligence = null;
      let receivedMetadata = null;
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete events in the buffer
        const events = buffer.split('\n\n');
        buffer = events.pop() || ''; // Keep incomplete event in buffer
        
        for (const event of events) {
          if (!event.trim()) continue;
          
          // Parse SSE event
          const lines = event.split('\n');
          let eventType = 'message';
          let eventData = '';
          
          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7);
            } else if (line.startsWith('data: ')) {
              eventData = line.slice(6);
            }
          }
          
          if (!eventData) continue;
          
          try {
            const data = JSON.parse(eventData);
            
            switch (eventType) {
              case 'token':
                // Update streamed text
                fullMessage = data.accumulated || fullMessage + data.token;
                setStreamedText(fullMessage);
                
                // Call onToken callback if provided
                if (onToken) {
                  onToken({
                    token: data.token,
                    accumulated: data.accumulated,
                    progress: data.progress
                  });
                }
                break;
                
              case 'message_complete':
                fullMessage = data.message;
                setStreamedText(fullMessage);
                break;
                
              case 'products':
                receivedProducts = data.products || [];
                setProducts(receivedProducts);
                break;
                
              case 'tip_card':
                receivedTipCard = data;
                setTipCard(receivedTipCard);
                break;
                
              case 'intelligence':
                receivedIntelligence = data;
                setIntelligence(receivedIntelligence);
                break;
                
              case 'metadata':
                receivedMetadata = data;
                setMetadata(receivedMetadata);
                break;
                
              case 'error':
                setError(data.error);
                break;
                
              case 'done':
                setIsStreaming(false);
                
                // Call onComplete callback if provided
                if (onComplete) {
                  onComplete({
                    message: fullMessage,
                    products: receivedProducts,
                    tipCard: receivedTipCard,
                    intelligence: receivedIntelligence,
                    metadata: receivedMetadata,
                    executionType: data.execution_type
                  });
                }
                break;
            }
          } catch (parseError) {
            console.warn('[STREAM] Failed to parse event data:', parseError);
          }
        }
      }
      
      // Return final state
      return {
        message: fullMessage,
        products: receivedProducts,
        tipCard: receivedTipCard,
        intelligence: receivedIntelligence,
        metadata: receivedMetadata
      };
      
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('[STREAM] Cancelled by user');
        return null;
      }
      
      console.error('[STREAM] Error:', err);
      setError(err.message);
      setIsStreaming(false);
      throw err;
      
    } finally {
      abortControllerRef.current = null;
    }
  }, [cancelStream]);
  
  return {
    streamMessage,
    isStreaming,
    streamedText,
    products,
    tipCard,
    intelligence,
    metadata,
    error,
    cancelStream
  };
};

export default useStreamingChat;
