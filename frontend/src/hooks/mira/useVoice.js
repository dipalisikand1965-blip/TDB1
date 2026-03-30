/**
 * useVoice - Voice Input/Output Hook for Mira
 * ============================================
 * Handles:
 * - Voice input (speech recognition)
 * - Voice output (TTS via ElevenLabs)
 * - iOS/mobile compatibility
 * 
 * Extracted from MiraDemoPage.jsx - Stage 1 Refactoring
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { API_URL } from '../../utils/api';
import hapticFeedback from '../../utils/haptic';

/**
 * Detect voice personality from response content
 */
const detectVoicePersonality = (text) => {
  const lowerText = (text || '').toLowerCase();
  
  // EMERGENCY - Urgent, clear, professional
  if (lowerText.includes('emergency') || lowerText.includes('immediately') || 
      lowerText.includes('urgent') || lowerText.includes('vet right away')) {
    return 'emergency';
  }
  
  // COMFORT - Soft, gentle, reassuring
  if (lowerText.includes('sorry') || lowerText.includes('understand') ||
      lowerText.includes('difficult') || lowerText.includes('here for you') ||
      lowerText.includes('grief') || lowerText.includes('loss')) {
    return 'comfort';
  }
  
  // CELEBRATION - Warm, excited, joyful
  if (lowerText.includes('birthday') || lowerText.includes('congratulations') ||
      lowerText.includes('celebrate') || lowerText.includes('party') ||
      lowerText.includes('gotcha day') || lowerText.includes('anniversary')) {
    return 'celebration';
  }
  
  // INFORMATIVE - Clear, helpful, professional
  if (lowerText.includes('here\'s what') || lowerText.includes('you should') ||
      lowerText.includes('recommend') || lowerText.includes('tip')) {
    return 'informative';
  }
  
  // Default - Friendly, warm Mira voice
  return 'friendly';
};

/**
 * useVoice Hook
 * 
 * @param {Object} options
 * @param {Function} options.onTranscript - Called when voice input produces text
 * @param {Function} options.onSubmit - Called to submit the transcript
 * @returns {Object} Voice state and controls
 */
const useVoice = ({ onTranscript, onSubmit } = {}) => {
  // Voice OUTPUT state (TTS) - Load from localStorage for persistence
  const [voiceEnabled, setVoiceEnabledState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mira_voice_enabled');
      // Default to TRUE (on) — ElevenLabs Eloise, opt-out instead of opt-in
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });
  
  // Wrapper to persist voice preference
  const setVoiceEnabled = useCallback((enabled) => {
    setVoiceEnabledState(enabled);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mira_voice_enabled', String(enabled));
    }
  }, []);
  
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef(null);
  const voiceTimeoutRef = useRef(null);
  const skipVoiceOnNextResponseRef = useRef(false);
  
  // Voice INPUT state (Speech Recognition)
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState(null);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const recognitionRef = useRef(null);
  
  // Refs for callbacks
  const onTranscriptRef = useRef(onTranscript);
  const onSubmitRef = useRef(onSubmit);
  
  // Keep refs updated
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
    onSubmitRef.current = onSubmit;
  }, [onTranscript, onSubmit]);
  
  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setVoiceSupported(false);
      console.log('[useVoice] Speech recognition not supported');
      return;
    }
    
    try {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.maxAlternatives = 1;
      
      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Show interim results while speaking
        if (interimTranscript && onTranscriptRef.current) {
          onTranscriptRef.current(interimTranscript);
        }
        
        // Submit on final result
        if (finalTranscript) {
          if (onTranscriptRef.current) {
            onTranscriptRef.current(finalTranscript);
          }
          setIsListening(false);
          setVoiceError(null);
          
          if (onSubmitRef.current) {
            setTimeout(() => {
              onSubmitRef.current(finalTranscript);
            }, 300);
          }
        }
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('[useVoice] Speech recognition error:', event.error);
        setIsListening(false);
        
        switch (event.error) {
          case 'not-allowed':
          case 'permission-denied':
            setVoiceError('Microphone access denied. Please allow microphone in your browser settings.');
            break;
          case 'no-speech':
            setVoiceError('No speech detected. Please try again.');
            break;
          case 'audio-capture':
            setVoiceError('No microphone found. Please connect a microphone.');
            break;
          case 'network':
            setVoiceError('Network error. Please check your connection.');
            break;
          case 'aborted':
            // User aborted, no error needed
            break;
          default:
            setVoiceError(`Voice input error: ${event.error}`);
        }
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
      
    } catch (error) {
      console.error('[useVoice] Failed to initialize speech recognition:', error);
      setVoiceSupported(false);
    }
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore
        }
      }
    };
  }, []);
  
  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (voiceTimeoutRef.current) {
      clearTimeout(voiceTimeoutRef.current);
      voiceTimeoutRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);
  
  // ─── ElevenLabs Eloise voice (direct API, key rotation) ───────────────────
  // Eloise — AZnzlk1XvdvUeBnXmlld — user-confirmed canonical voice ID
  const ELOISE_VOICE_ID = 'AZnzlk1XvdvUeBnXmlld'; // Eloise (ElevenLabs)

  const ELEVEN_KEYS = [
    process.env.REACT_APP_ELEVEN_LABS_KEY_1,
    process.env.REACT_APP_ELEVEN_LABS_KEY_2,
    process.env.REACT_APP_ELEVEN_LABS_KEY_3,
    process.env.REACT_APP_ELEVEN_LABS_KEY_4,
    process.env.REACT_APP_ELEVEN_LABS_KEY_5,
    process.env.REACT_APP_ELEVEN_LABS_KEY_6,
    process.env.REACT_APP_ELEVEN_LABS_KEY_7,
    process.env.REACT_APP_ELEVEN_LABS_KEY_8,
    process.env.REACT_APP_ELEVEN_LABS_KEY_9,
    process.env.REACT_APP_ELEVEN_LABS_KEY_10,
    process.env.REACT_APP_ELEVEN_LABS_KEY_11,
  ].filter(Boolean); // drop undefined slots

  const elevenKeyIndexRef = useRef(0);
  const getNextElevenKey = () => {
    if (!ELEVEN_KEYS.length) return null;
    const key = ELEVEN_KEYS[elevenKeyIndexRef.current % ELEVEN_KEYS.length];
    elevenKeyIndexRef.current++;
    return key;
  };

  const speakWithElevenLabs = useCallback(async (cleanText) => {
    const key = getNextElevenKey();
    if (!key) throw new Error('No ElevenLabs keys configured');
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELOISE_VOICE_ID}/stream`,
      {
        method: 'POST',
        headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanText,
          model_id: 'eleven_turbo_v2',
          output_format: 'mp3_44100_128', // explicit — never let it default
          voice_settings: { stability: 0.35, similarity_boost: 0.75, style: 0.25, speed: 0.95 },
        }),
      }
    );
    if (!response.ok) throw new Error(`ElevenLabs ${response.status}`);
    const audioBlob = await response.blob();

    // Unified approach — works on iOS Safari + all browsers
    // iOS Safari needs audio.load() before .play() for blob URLs
    const blobUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(blobUrl);
    audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(blobUrl); };
    audio.onerror = () => { setIsSpeaking(false); URL.revokeObjectURL(blobUrl); };
    audioRef.current = audio;
    if (audio.paused) {
      audio.load(); // iOS Safari requires this before .play() on blob URLs
    }
    audio.play().catch(() => setIsSpeaking(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Speak text with Mira's voice (TTS)
  const speak = useCallback(async (text) => {
    if (!voiceEnabled || !text) return;
    
    // Skip if flagged
    if (skipVoiceOnNextResponseRef.current) {
      skipVoiceOnNextResponseRef.current = false;
      return;
    }
    
    // Stop any existing voice
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    
    try {
      setIsSpeaking(true);
      
      const personality = detectVoicePersonality(text);
      console.log('[useVoice] Speaking with personality:', personality);
      
      // Clean text for natural speech — strip greetings, emojis, markdown
      let cleanText = text
        .replace(/^Hey there[!,]?\s*/i, '')      // strip "Hey there!"
        .replace(/^Hi there[!,]?\s*/i, '')       // strip "Hi there!"
        .replace(/^Hello[!,]?\s*/i, '')          // strip "Hello!"
        .replace(/^Great question[!,]?\s*/i, '') // strip "Great question!"
        .replace(/\*\*(.*?)\*\*/g, '$1')         // strip bold markdown
        .replace(/\*(.*?)\*/g, '$1')             // strip italic markdown
        .replace(/[*#_~`]/g, '')
        .replace(/\[.*?\]/g, '')
        .replace(/\n/g, ' ')
        .replace(/®/g, '')
        .replace(/[^\w\s.,!?'"()-]/g, ' ')       // strip ALL non-speech chars (emojis, symbols, ✦ ™ etc)
        .replace(/\s+/g, ' ')                    // collapse multiple spaces
        .trim();
      
      // Smart truncation at sentence boundary (max 400 chars for natural delivery)
      if (cleanText.length > 400) {
        const truncated = cleanText.substring(0, 400);
        const lastSentenceEnd = Math.max(
          truncated.lastIndexOf('. '),
          truncated.lastIndexOf('? '),
          truncated.lastIndexOf('! ')
        );
        cleanText = lastSentenceEnd > 150
          ? truncated.substring(0, lastSentenceEnd + 1)
          : truncated;
      }
      
      // Try ElevenLabs first (Eloise voice, all devices), fallback to backend TTS
      try {
        await speakWithElevenLabs(cleanText);
      } catch (elevenErr) {
        console.log('[useVoice] ElevenLabs failed, falling back to backend TTS:', elevenErr.message);

        const response = await fetch(`${API_URL}/api/tts/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: cleanText, personality })
        });

        if (!response.ok) throw new Error('TTS request failed');

        const data = await response.json();
        const audio = new Audio();
        audio.preload = 'auto';
        audio.volume = 1.0;
        audio.onended = () => { console.log('[useVoice] Finished speaking'); setIsSpeaking(false); };
        audio.onerror = () => setIsSpeaking(false);
        audio.oncanplaythrough = () => {
          audio.play().catch((e) => { console.log('[useVoice] Playback blocked:', e.message); setIsSpeaking(false); });
        };
        audio.src = `data:audio/mpeg;base64,${data.audio_base64}`;
        audio.load();
        audioRef.current = audio;
      }
      
    } catch (error) {
      console.log('[useVoice] TTS Error:', error.message);
      setIsSpeaking(false);
    }
  }, [voiceEnabled]);
  
  // Toggle voice input (listening)
  const toggleListening = useCallback(async () => {
    setVoiceError(null);
    
    if (!recognitionRef.current) {
      setVoiceError('Voice input not available in this browser. Try Chrome or Safari.');
      return;
    }
    
    if (isListening) {
      hapticFeedback.voiceStop();
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
      setIsListening(false);
    } else {
      hapticFeedback.voiceStart();
      
      try {
        // Request microphone permission (iOS Safari)
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          await navigator.mediaDevices.getUserMedia({ audio: true });
        }
        
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('[useVoice] Microphone permission error:', error);
        setVoiceError('Please allow microphone access to use voice input.');
        setIsListening(false);
      }
    }
  }, [isListening]);
  
  // Toggle voice output (TTS enabled/disabled)
  const toggleVoiceOutput = useCallback(() => {
    hapticFeedback.toggle();
    if (isSpeaking && audioRef.current) {
      audioRef.current.pause();
      setIsSpeaking(false);
    }
    setVoiceEnabled(prev => !prev);
  }, [isSpeaking]);
  
  // Skip voice on next response (for tile clicks)
  const skipNextVoice = useCallback(() => {
    skipVoiceOnNextResponseRef.current = true;
  }, []);
  
  // Schedule voice with delay
  const scheduleVoice = useCallback((text, delay = 500) => {
    if (voiceTimeoutRef.current) {
      clearTimeout(voiceTimeoutRef.current);
    }
    voiceTimeoutRef.current = setTimeout(() => {
      speak(text);
    }, delay);
  }, [speak]);
  
  return {
    // Voice Output (TTS)
    voiceEnabled,
    setVoiceEnabled,
    isSpeaking,
    speak,
    stopSpeaking,
    toggleVoiceOutput,
    skipNextVoice,
    scheduleVoice,
    
    // Voice Input (Speech Recognition)
    isListening,
    setIsListening,  // CRITICAL: Export setter for voice state management
    voiceError,
    setVoiceError,   // CRITICAL: Export setter for error handling in parent component
    voiceSupported,
    toggleListening,
    
    // Refs (for advanced usage)
    audioRef,
    recognitionRef
  };
};

export default useVoice;
