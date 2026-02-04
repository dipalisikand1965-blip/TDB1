import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Sparkles, Minimize2, Maximize2, Send, Loader2, User, Bot, PawPrint, Mic, MicOff, RotateCcw, History, ChevronRight, Upload, Volume2, VolumeX, ShoppingCart, Heart } from 'lucide-react';
import { Button } from './ui/button';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { getApiUrl } from '../utils/api';
import { resolvePetAvatar } from '../utils/petAvatar';
import MiraOrb from './MiraOrb';

// Markdown components for ReactMarkdown - defined outside component to avoid re-creation
const markdownComponents = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
  li: ({ children }) => <li className="mb-1">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
};

// Get appropriate image for the welcome card using centralized avatar resolver
const getWelcomeImage = (user, pets) => {
  const primaryPet = pets?.[0];
  
  if (primaryPet) {
    const { photoUrl, isBreedPhoto, uploadPrompt } = resolvePetAvatar(primaryPet);
    return { 
      url: photoUrl, 
      type: isBreedPhoto ? 'breed' : 'pet',
      needsUpload: isBreedPhoto,
      uploadPrompt
    };
  }
  
  // No pet - return default
  return { 
    url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop',
    type: 'default',
    needsUpload: false
  };
};

// Welcome Card Component - Enhanced with clickable links
const WelcomeCard = ({ user, pets, onLinkClick }) => {
  const imageInfo = getWelcomeImage(user, pets);
  const petName = pets?.[0]?.name;
  const userName = user?.name?.split(' ')[0] || 'Friend';
  const breed = pets?.[0]?.identity?.breed || pets?.[0]?.breed || '';
  const petScore = pets?.[0]?.overall_score || pets?.[0]?.soul_score || 0;
  const petAge = pets?.[0]?.identity?.age_years || pets?.[0]?.age || null;
  
  // More contextual, warmer quick actions
  const quickLinks = [
    { label: '🎙️ Voice Chat', href: '/voice-order', isExternal: true },
    { label: `What does ${petName || 'my pet'} need?`, query: `What might ${petName || 'my pet'} enjoy today?`, icon: '✨' },
    { label: 'Find Adventures', query: 'Suggest fun activities we can do together this week', icon: '🗺️' },
  ];
  
  // Generate a warm, personalized greeting
  const getWarmGreeting = () => {
    const hour = new Date().getHours();
    if (petName) {
      if (hour < 12) return `How is ${petName} feeling this morning?`;
      if (hour < 17) return `Is ${petName} having a lovely day?`;
      if (hour < 21) return `Evening cuddles with ${petName}?`;
      return `Quiet night with ${petName}?`;
    }
    return 'How can I make today special?';
  };
  
  return (
    <div className="rounded-xl overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 shadow-sm">
      {/* Image Section */}
      <div className="relative h-32 overflow-hidden">
        <img 
          src={imageInfo.url} 
          alt={petName || 'Welcome'} 
          className="w-full h-full object-cover"
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Overlay Text */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          {petName && (
            <div className="flex items-center gap-2">
              <PawPrint className="w-4 h-4 text-white/80" />
              <span className="text-white font-semibold text-sm">{petName}</span>
              {breed && <span className="text-white/70 text-xs">• {breed}</span>}
              {petAge && <span className="text-white/50 text-xs">• {petAge}y</span>}
            </div>
          )}
        </div>
        
        {/* Image type badge */}
        {imageInfo.type === 'pet' && (
          <div className="absolute top-2 right-2 bg-purple-600/80 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
            <Heart className="w-3 h-3" />
            {petName}&apos;s Photo
          </div>
        )}
        
        {/* Upload prompt for breed photos */}
        {imageInfo.needsUpload && petName && (
          <a 
            href="/my-pets" 
            className="absolute top-2 right-2 bg-purple-600/90 hover:bg-purple-700 text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Upload className="w-3 h-3" />
            Add {petName}&apos;s photo
          </a>
        )}
        
        {/* Soul Score badge with sparkle */}
        {petScore > 0 && (
          <div className="absolute top-2 left-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {Math.round(petScore)}% Soul
          </div>
        )}
      </div>
      
      {/* Welcome Message - Warmer */}
      <div className="p-3">
        <p className="text-sm text-gray-700">
          <span className="font-semibold text-purple-700">Welcome back, {userName}! ✨</span>
        </p>
        <p className="text-xs text-gray-600 mt-1 italic">
          {getWarmGreeting()}
        </p>
        
        {/* Quick Action Links */}
        <div className="flex flex-wrap gap-2 mt-3">
          {quickLinks.map((link, idx) => (
            link.href ? (
              <a
                key={idx}
                href={link.href}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 rounded-full text-white font-medium transition-colors cursor-pointer"
              >
                <span>{link.label}</span>
              </a>
            ) : (
              <button
                key={idx}
                onClick={() => onLinkClick && onLinkClick(link.query)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white hover:bg-purple-50 border border-purple-200 hover:border-purple-400 rounded-full text-purple-700 font-medium transition-colors cursor-pointer"
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </button>
            )
          ))}
        </div>
      </div>
    </div>
  );
};

// Generate unique session ID
const generateSessionId = () => {
  const stored = sessionStorage.getItem('mira_session_id');
  if (stored) return stored;
  const newId = `mira-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  sessionStorage.setItem('mira_session_id', newId);
  return newId;
};

// Detect pillar from pathname
const detectPillarFromPath = (pathname) => {
  const pathToPillar = {
    '/travel': 'travel',
    '/stay': 'stay',
    '/care': 'care',
    '/dine': 'dine',
    '/celebrate': 'celebrate',
    '/enjoy': 'enjoy',
    '/shop': 'shop',
    '/fit': 'fit',
    '/advisory': 'advisory',
    '/paperwork': 'paperwork',
    '/emergency': 'emergency',
    '/club': 'club'
  };
  return Object.entries(pathToPillar).find(([path]) => 
    pathname.toLowerCase().includes(path)
  )?.[1] || null;
};

const MiraAI = () => {
  const location = useLocation();
  const { user, token } = useAuth();
  
  // Hide MiraAI on admin/agent pages AND pillar pages (where MiraChatWidget is embedded)
  // But on mobile (< 768px), we need MiraAI available since the MobileNavBar FAB opens it
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const hiddenPaths = ['/admin', '/agent', '/login', '/mira'];
  const pillarPaths = ['/care', '/celebrate', '/advisory', '/dine', '/stay', '/travel', '/emergency', '/enjoy', '/fit', '/learn', '/farewell', '/adopt', '/paperwork', '/shop', '/all', '/product', '/services', '/cakes', '/treats'];
  
  // On mobile, only hide on admin/login paths - allow Mira on pillar pages via MobileNavBar FAB
  const shouldHide = isMobile 
    ? hiddenPaths.some(path => location.pathname.startsWith(path))
    : hiddenPaths.some(path => location.pathname.startsWith(path)) ||
      pillarPaths.some(path => location.pathname === path || location.pathname.startsWith(path + '/'));
  
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [userPets, setUserPets] = useState([]);
  const [petsLoaded, setPetsLoaded] = useState(false);
  const [welcomeGenerated, setWelcomeGenerated] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(generateSessionId);
  const [currentPillar, setCurrentPillar] = useState(null);
  const [previousPillar, setPreviousPillar] = useState(null);
  const [quickPrompts, setQuickPrompts] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  
  // Voice input/output state
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [useElevenLabs, setUseElevenLabs] = useState(true); // Prefer ElevenLabs TTS
  const recognitionRef = useRef(null);
  const synthRef = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null);
  const audioRef = useRef(null); // For ElevenLabs audio playback
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // iOS Audio Context - Needed to prime audio on iOS Safari
  const [audioContextPrimed, setAudioContextPrimed] = useState(false);
  const iosAudioRef = useRef(null);
  
  // Prime audio context on iOS - call this on user interaction (voice toggle)
  const primeAudioForIOS = useCallback(() => {
    if (audioContextPrimed) return;
    
    try {
      // Create a silent audio element and play it to unlock iOS audio
      const silentAudio = new Audio();
      // Short silent MP3 (base64 encoded)
      silentAudio.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7v/////////////////////////////////' + 
        '//////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYoRwmHAAAAAAD/+1DEAAAGAAGn9AAAIgAANP8AAAARERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERER';
      silentAudio.volume = 0.01;
      silentAudio.muted = false;
      
      const playPromise = silentAudio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('[Mira Voice] ✓ iOS Audio context primed successfully');
            setAudioContextPrimed(true);
            silentAudio.pause();
          })
          .catch((e) => {
            console.log('[Mira Voice] iOS Audio priming failed:', e.message);
          });
      }
      
      // Also try Web Audio API approach
      if (typeof AudioContext !== 'undefined' || typeof window.webkitAudioContext !== 'undefined') {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioCtx();
        const oscillator = audioCtx.createOscillator();
        oscillator.frequency.value = 0; // Silent
        oscillator.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.001);
        console.log('[Mira Voice] ✓ Web Audio API context primed');
      }
    } catch (error) {
      console.log('[Mira Voice] Audio priming error:', error);
    }
  }, [audioContextPrimed]);
  
  // ElevenLabs TTS - Premium voice for Mira (with iOS fix)
  const speakWithElevenLabs = useCallback(async (text) => {
    if (!voiceEnabled) return false;
    
    try {
      setIsSpeaking(true);
      console.log('[Mira Voice] Attempting ElevenLabs TTS...');
      
      // Clean text for speech
      let cleanText = text
        .replace(/[🎉🐕✨🦴💜🎂🏥☀️🌤️🌙🌟🐾🎒📅📋😊💝🎁🎤]/g, '')
        .replace(/\*\*/g, '')
        .replace(/[*#_~`]/g, '')
        .replace(/\[.*?\]/g, '')
        .replace(/\n/g, ' ')
        .substring(0, 500);
      
      const response = await fetch(`${getApiUrl()}/api/tts/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText })
      });
      
      if (!response.ok) {
        throw new Error('ElevenLabs TTS failed');
      }
      
      const data = await response.json();
      console.log('[Mira Voice] ✓ ElevenLabs audio received, playing...');
      
      // Create audio element with iOS-compatible approach
      const audio = new Audio();
      
      // Set properties BEFORE setting src (important for iOS)
      audio.preload = 'auto';
      audio.volume = 1.0;
      
      // Set up event handlers BEFORE loading
      audio.onended = () => {
        console.log('[Mira Voice] ✓ ElevenLabs audio playback complete');
        setIsSpeaking(false);
      };
      
      audio.onerror = (e) => {
        console.log('[Mira Voice] Audio element error:', e);
        setIsSpeaking(false);
      };
      
      // For iOS: oncanplaythrough is more reliable than just waiting for load
      return new Promise((resolve) => {
        audio.oncanplaythrough = () => {
          console.log('[Mira Voice] Audio ready to play, attempting playback...');
          const playPromise = audio.play();
          
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log('[Mira Voice] ✓ Audio playback started successfully');
                resolve(true);
              })
              .catch((playError) => {
                console.log('[Mira Voice] ❌ Playback blocked:', playError.message);
                // On iOS, if playback fails, show a toast to inform user
                if (playError.name === 'NotAllowedError') {
                  console.log('[Mira Voice] iOS audio blocked - needs user interaction');
                  // Fallback: Try Web Speech API
                  setIsSpeaking(false);
                  setUseElevenLabs(false);
                  resolve(false);
                } else {
                  setIsSpeaking(false);
                  resolve(false);
                }
              });
          } else {
            // Old browser without promise
            resolve(true);
          }
        };
        
        // Timeout fallback - if audio doesn't load in 10s, fail gracefully
        setTimeout(() => {
          if (!audio.readyState) {
            console.log('[Mira Voice] Audio load timeout');
            setIsSpeaking(false);
            resolve(false);
          }
        }, 10000);
        
        // Now set the source and load
        audio.src = `data:audio/mpeg;base64,${data.audio_base64}`;
        audio.load();
        audioRef.current = audio;
      });
      
    } catch (error) {
      console.log('[Mira Voice] ElevenLabs unavailable, using Web Speech:', error.message);
      setUseElevenLabs(false);
      setIsSpeaking(false);
      return false;
    }
  }, [voiceEnabled]);

  // Text-to-Speech function
  const speakText = useCallback(async (text) => {
    if (!voiceEnabled) return;
    
    // Try ElevenLabs first for premium voice
    if (useElevenLabs) {
      const success = await speakWithElevenLabs(text);
      if (success) return;
    }
    
    // Fallback to Web Speech API
    if (!synthRef.current) return;
    
    // Cancel any ongoing speech
    synthRef.current.cancel();
    
    // Clean text for speech
    let cleanText = text
      .replace(/[🎉🐕✨🦴💜🎂🏥🐾📋🎤]/g, '')  // Remove emojis
      .replace(/\*\*/g, '')  // Remove markdown bold
      .replace(/\n/g, ' ')   // Replace newlines with spaces
      .replace(/---/g, '')   // Remove horizontal rules
      .substring(0, 500);
    
    // Fix pronunciations for speech synthesis
    // "Mira" → "Meera" (phonetic)
    cleanText = cleanText.replace(/\bMira\b/gi, 'Meera');
    
    // "Concierge" → phonetic spelling for correct French pronunciation
    // Using "con-see-erzh" which TTS engines handle better
    cleanText = cleanText
      .replace(/Pet Concierge®?/gi, 'Pet con-see-erzh')
      .replace(/pet concierge®?/gi, 'pet con-see-erzh')
      .replace(/your concierge®?/gi, 'your con-see-erzh')
      .replace(/our concierge®?/gi, 'our con-see-erzh')
      .replace(/the concierge®?/gi, 'the con-see-erzh')
      .replace(/concierge®? team/gi, 'con-see-erzh team')
      .replace(/\bconcierge®?\b/gi, 'con-see-erzh');
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.90;  // Measured pace for British English
    utterance.volume = 0.95;
    
    // Get a BRITISH ENGLISH FEMALE voice for Mira - STRICT SELECTION
    const voices = synthRef.current.getVoices();
    
    // Debug: Log available voices to console
    console.log('[Mira] Available voices:', voices.map(v => `${v.name} (${v.lang})`));
    
    // STRICT list of CONFIRMED FEMALE voice names only
    // iOS Safari voices are named differently - prioritize them
    const confirmedFemaleVoices = [
      // iOS/Safari British English Female - TOP PRIORITY for iPhone
      'Stephanie', 'Karen', 'Samantha',  // Common iOS voices
      'Kate', 'Serena', 'Martha',        // iOS British voices
      'Fiona', 'Moira',                  // iOS Celtic voices
      // iOS Enhanced voices (downloaded)
      'Samantha (Enhanced)', 'Karen (Enhanced)',
      // Google British voices (Android/Chrome)
      'Google UK English Female',
      'Microsoft Hazel', 'Microsoft Susan', 'Hazel', 'Susan',
      'Amy', 'Emma',
      // American English Female - FALLBACK
      'Victoria', 'Tessa', 'Allison',
      'Google US English Female', 'Microsoft Zira',
      'Ava', 'Nicky',
      // Generic female identifiers
      'Female', 'female'
    ];
    
    // List of KNOWN MALE voice names to ALWAYS exclude
    const knownMaleVoices = [
      'Daniel', 'George', 'James', 'Oliver', 'Harry', 'Arthur',
      'David', 'Mark', 'Tom', 'Alex', 'Fred', 'Ralph', 'Albert',
      'Google US English', 'Google UK English Male', 'Microsoft David',
      'Microsoft Mark', 'Microsoft George', 'Aaron', 'Bruce'
    ];
    
    let selectedVoice = null;
    
    // Step 1: Try to find a British female voice by exact name match
    for (const femaleName of confirmedFemaleVoices.slice(0, 12)) { // British voices first
      selectedVoice = voices.find(v => 
        v.name === femaleName || 
        v.name.includes(femaleName)
      );
      if (selectedVoice) {
        console.log('[Mira] ✓ Found British female voice:', selectedVoice.name);
        break;
      }
    }
    
    // Step 2: Try en-GB voices but EXCLUDE known males
    if (!selectedVoice) {
      selectedVoice = voices.find(v => 
        v.lang === 'en-GB' && 
        !knownMaleVoices.some(male => v.name.toLowerCase().includes(male.toLowerCase()))
      );
      if (selectedVoice) console.log('[Mira] ✓ Using en-GB voice:', selectedVoice.name);
    }
    
    // Step 3: Try American female voices
    if (!selectedVoice) {
      for (const femaleName of confirmedFemaleVoices.slice(12)) {
        selectedVoice = voices.find(v => 
          v.name === femaleName || 
          v.name.includes(femaleName)
        );
        if (selectedVoice) {
          console.log('[Mira] ✓ Found American female voice:', selectedVoice.name);
          break;
        }
      }
    }
    
    // Step 4: Any voice with "female" in name
    if (!selectedVoice) {
      selectedVoice = voices.find(v => 
        v.name.toLowerCase().includes('female')
      );
      if (selectedVoice) console.log('[Mira] ✓ Using female voice:', selectedVoice.name);
    }
    
    // Step 5: Last resort - filter out ALL known male voices
    if (!selectedVoice) {
      selectedVoice = voices.find(v => 
        v.lang.startsWith('en') &&
        !knownMaleVoices.some(male => v.name.toLowerCase().includes(male.toLowerCase()))
      );
      if (selectedVoice) console.log('[Mira] ⚠ Fallback voice:', selectedVoice.name);
    }
    
    // Apply voice and FEMININE parameters
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      console.log('[Mira] Final selected voice:', selectedVoice.name);
    } else {
      console.log('[Mira] ⚠ No suitable voice found, using default with high pitch');
    }
    
    // FEMININE speech parameters - higher pitch makes voice sound more feminine
    utterance.rate = 0.92;   // Measured pace, British style
    utterance.pitch = 1.15;  // Higher pitch = more feminine sound
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
  }, [voiceEnabled, useElevenLabs, speakWithElevenLabs]);
  
  // Get time-aware greeting
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    const petName = userPets.length > 0 ? userPets[0].name : 'your pet';
    
    if (hour >= 5 && hour < 12) {
      return `Good morning! ☀️ How can I help ${petName} today?`;
    } else if (hour >= 12 && hour < 17) {
      return `Good afternoon! 🌤️ What does ${petName} need?`;
    } else if (hour >= 17 && hour < 21) {
      return `Good evening! 🌙 How can I assist ${petName}?`;
    } else {
      return `Hello! 🌟 I'm here to help ${petName} anytime.`;
    }
  };

  // Check for speech recognition support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-IN';
      
      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setInputValue(transcript);
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied. Please enable it in your browser settings.');
        }
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Toggle voice listening
  const toggleListening = () => {
    if (!speechSupported) {
      toast.error('Voice input is not supported in your browser');
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInputValue('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Track pillar changes for cross-pillar context
  useEffect(() => {
    const newPillar = detectPillarFromPath(location.pathname);
    if (newPillar && newPillar !== currentPillar) {
      if (currentPillar) {
        setPreviousPillar(currentPillar);
      }
      setCurrentPillar(newPillar);
      // Fetch quick prompts for new pillar
      fetchQuickPrompts(newPillar);
    }
  }, [location.pathname, currentPillar]);

  // Fetch pillar-specific quick prompts
  const fetchQuickPrompts = async (pillar) => {
    try {
      const response = await fetch(`${getApiUrl()}/api/mira/quick-prompts/${pillar}`);
      if (response.ok) {
        const data = await response.json();
        setQuickPrompts(data.prompts || []);
      }
    } catch (error) {
      console.debug('Quick prompts fetch failed:', error);
    }
  };

  // Fetch chat history
  const fetchChatHistory = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${getApiUrl()}/api/mira/history?limit=5`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setChatHistory(data.sessions || []);
      }
    } catch (error) {
      console.debug('Chat history fetch failed:', error);
    }
  };

  // Start new conversation
  const startNewConversation = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/mira/session/new`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Clear session storage
        sessionStorage.removeItem('mira_session_id');
        const newSessionId = data.session_id;
        sessionStorage.setItem('mira_session_id', newSessionId);
        setSessionId(newSessionId);
        
        // Reset messages with new welcome
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: generateWelcomeMessage()
        }]);
        setWelcomeGenerated(true);
        setShowHistory(false);
        
        toast.success('Started new conversation');
      }
    } catch (error) {
      console.error('Error starting new conversation:', error);
      toast.error('Failed to start new conversation');
    }
  };

  // Generate personalized welcome message based on user and pets with time-awareness
  // Mira is positioned as a warm, wise "guardian angel" for pets
  const generateWelcomeMessage = useCallback(() => {
    const hour = new Date().getHours();
    const day = new Date().getDay();
    const isWeekend = day === 0 || day === 6;
    
    // More poetic, warm time greetings
    let timeGreeting = '';
    let timeContext = '';
    
    if (hour >= 5 && hour < 9) {
      timeGreeting = 'Good morning, sunshine';
      timeContext = 'Early starts mean more time for morning walks and tail wags.';
    } else if (hour >= 9 && hour < 12) {
      timeGreeting = 'Good morning';
      timeContext = isWeekend ? 'Weekends are made for adventures together.' : '';
    } else if (hour >= 12 && hour < 15) {
      timeGreeting = 'Good afternoon';
      timeContext = 'The perfect time for a cozy nap together, don\'t you think?';
    } else if (hour >= 15 && hour < 18) {
      timeGreeting = 'Hello, lovely';
      timeContext = 'The golden hours are upon us — magical light for magical moments.';
    } else if (hour >= 18 && hour < 21) {
      timeGreeting = 'Good evening';
      timeContext = 'Evening cuddles are the best kind of therapy.';
    } else {
      timeGreeting = 'Hello, night owl';
      timeContext = 'Even in the quiet hours, I\'m here for you both.';
    }
    
    if (user && userPets.length > 0) {
      const firstName = (user.name || 'friend').split(' ')[0];
      const firstPet = userPets[0];
      const petName = firstPet.name;
      const breed = firstPet.identity?.breed || firstPet.breed || '';
      const age = firstPet.identity?.age_years || firstPet.age || null;
      const allergies = firstPet.health?.allergies?.join(', ') || '';
      const birthday = firstPet.identity?.birthday || firstPet.birthday || null;
      
      // Check if pet's birthday is coming up (within 30 days)
      let birthdayNote = '';
      if (birthday) {
        const bday = new Date(birthday);
        const today = new Date();
        const thisYearBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
        const daysUntilBirthday = Math.ceil((thisYearBday - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntilBirthday > 0 && daysUntilBirthday <= 30) {
          birthdayNote = `\n\n🎂 *I see ${petName}'s birthday is coming up in ${daysUntilBirthday} days! Shall we start planning something special?*`;
        } else if (daysUntilBirthday >= -1 && daysUntilBirthday <= 0) {
          birthdayNote = `\n\n🎉 **Happy Birthday to ${petName}!** What a special day! I hope you're celebrating this precious soul.`;
        }
      }
      
      // Build a warm, personal welcome
      let personalizedWelcome = `**${timeGreeting}, ${firstName}.** ✨\n\n`;
      
      if (userPets.length === 1) {
        personalizedWelcome += `I remember **${petName}** well — `;
        if (breed) {
          personalizedWelcome += `your beautiful ${breed}`;
          if (age) personalizedWelcome += ` who's ${age} years young`;
          personalizedWelcome += `. `;
        } else {
          personalizedWelcome += `every pet has a unique soul, and ${petName}'s shines bright. `;
        }
      } else {
        const petNames = userPets.map(p => p.name).join(', ');
        personalizedWelcome += `Your little pack — **${petNames}** — each one has a special place in my heart. `;
      }
      
      // Add contextual wisdom
      if (timeContext) {
        personalizedWelcome += `\n\n*${timeContext}*`;
      }
      
      // Add health considerations warmly
      if (allergies) {
        personalizedWelcome += `\n\nI remember ${petName}'s sensitivities. Every recommendation I make keeps their wellbeing at heart.`;
      }
      
      // Add birthday note if applicable
      personalizedWelcome += birthdayNote;
      
      personalizedWelcome += `\n\n🎤 **Speak or type — I'm all ears (and paws).**`;
      
      return personalizedWelcome;
    } else if (user) {
      const firstName = (user.name || 'friend').split(' ')[0];
      return `**${timeGreeting}, ${firstName}.** ✨\n\nI'm Mira — think of me as a wise friend who understands the language of paws and tail wags.\n\nI notice we haven't met your furry family member yet. Creating a **Pet Soul™** profile helps me understand their unique personality, preferences, and needs. It's like introducing me to a dear friend.\n\n*Every pet has a soul worth celebrating.*\n\n🎤 **Ready to introduce us?**`;
    } else {
      return `**${timeGreeting}.** ✨\n\nI'm Mira — your pet's guardian angel at The Doggy Company.\n\nI'm not just here to help with tasks. I'm here to understand, to remember, to celebrate every precious moment you share with your companion. From birthday cakes to travel adventures, from quiet cuddles to big milestones.\n\n*Because every pet has a soul, and every soul deserves to be cherished.*\n\n[**Begin Your Journey**](/membership) | [**Sign In**](/login)\n\n🎤 **Ask me anything — I'm listening with my whole heart.**`;
    }
  }, [user, userPets]);

  // Update welcome message when user/pets data is loaded
  useEffect(() => {
    if (petsLoaded && !welcomeGenerated) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: generateWelcomeMessage()
      }]);
      setWelcomeGenerated(true);
    }
  }, [petsLoaded, welcomeGenerated, generateWelcomeMessage]);

  // Set initial welcome for non-logged-in users
  useEffect(() => {
    if (!token && !welcomeGenerated) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: generateWelcomeMessage()
      }]);
      setWelcomeGenerated(true);
    }
  }, [token, welcomeGenerated, generateWelcomeMessage]);

  // Lock body scroll when Mira is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${window.scrollY}px`;
    } else {
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    };
  }, [isOpen]);

  // Auto-speak welcome message when it's first generated and Mira is open
  // IMPORTANT: On iOS, we only auto-speak if audio context has been primed by user interaction
  const [welcomeSpoken, setWelcomeSpoken] = useState(false);
  useEffect(() => {
    // Only auto-speak if:
    // 1. Mira is open
    // 2. Welcome message is generated
    // 3. Voice is enabled
    // 4. Welcome hasn't been spoken yet
    // 5. On iOS/Safari, audio context must be primed first (user clicked voice toggle)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome'));
    
    if (isOpen && welcomeGenerated && voiceEnabled && !welcomeSpoken && messages.length > 0) {
      // On iOS, only auto-speak if audio context is primed
      if (isIOS && !audioContextPrimed) {
        console.log('[Mira Voice] iOS detected - skipping auto-speak until user enables voice');
        return;
      }
      
      const welcomeMsg = messages.find(m => m.id === 'welcome');
      if (welcomeMsg && welcomeMsg.content) {
        // Extract first paragraph for speaking (don't read the whole thing)
        const firstPara = welcomeMsg.content.split('\n')[0].replace(/\*\*/g, '');  // Remove markdown bold
        setTimeout(() => speakText(firstPara), 500);
        setWelcomeSpoken(true);
      }
    }
  }, [isOpen, welcomeGenerated, voiceEnabled, welcomeSpoken, messages, speakText, audioContextPrimed]);

  // Scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Listen for custom event to open Mira (consolidated - handles both desktop and mobile with pillar context)
  // On pillar pages, let MiraChatWidget handle the event instead
  useEffect(() => {
    const handleOpenMira = (event) => {
      // If we're on a pillar page and this event has a pillar context,
      // let MiraChatWidget handle it (it's embedded in the pillar page)
      const pillarPaths = ['/care', '/celebrate', '/advisory', '/dine', '/stay', '/travel', '/emergency', '/enjoy', '/fit', '/learn', '/farewell', '/adopt', '/paperwork', '/shop'];
      const isOnPillarPage = pillarPaths.some(path => 
        location.pathname === path || location.pathname.startsWith(path + '/')
      );
      
      if (isOnPillarPage && event.detail?.source === 'mobile_nav') {
        // Let MiraChatWidget on the pillar page handle this
        console.log('[MiraAI] Deferring to MiraChatWidget for pillar page:', location.pathname);
        return;
      }
      
      setIsOpen(true);
      // If pillar context is passed (from MobileNavBar), update the current pillar
      if (event.detail?.pillar) {
        setCurrentPillar(event.detail.pillar);
        console.log('[MiraAI] Opened with pillar context:', event.detail.pillar);
      }
      // If a preset message is passed, set it
      if (event.detail?.message) {
        setInputValue(event.detail.message);
      }
    };
    window.addEventListener('openMiraAI', handleOpenMira);
    return () => window.removeEventListener('openMiraAI', handleOpenMira);
  }, [location.pathname]);

  // Fetch user's pets when logged in
  useEffect(() => {
    const fetchUserPets = async () => {
      if (token && !petsLoaded) {
        try {
          const response = await fetch(`${getApiUrl()}/api/pets/my-pets`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            setUserPets(data.pets || []);
          }
        } catch (error) {
          console.error('Error fetching pets for Mira:', error);
        } finally {
          setPetsLoaded(true);
        }
      }
    };
    fetchUserPets();
  }, [token, petsLoaded]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
      // Fetch chat history when opened
      fetchChatHistory();
      // Note: Welcome message auto-speak is handled by the dedicated effect above
    }
  }, [isOpen, isMinimized, token]);

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Build history from messages (excluding welcome)
      const history = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));
      
      const apiUrl = getApiUrl();
      console.log('[Mira] Sending chat to:', `${apiUrl}/api/mira/chat`);
      
      // Add timeout controller for LLM requests (60 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      
      const response = await fetch(`${apiUrl}/api/mira/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          message: userMessage.content,
          session_id: sessionId,
          source: 'web_widget',
          current_page: location.pathname,
          current_pillar: currentPillar,
          previous_pillar: previousPillar,
          selected_pet_id: userPets.length === 1 ? (userPets[0].id || userPets[0].name) : null,
          history: history
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      console.log('[Mira] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Mira] Error response:', errorText);
        throw new Error(`Failed to get response: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Mira] Response received:', data.response?.substring(0, 100));
      
      // Build response with ticket info if available
      let displayContent = data.response || "I'm sorry, I couldn't process that. Please try again.";
      
      // If a service desk ticket was created, show confirmation
      if (data.service_desk_ticket_id || data.concierge_action?.action_needed) {
        const ticketId = data.service_desk_ticket_id || data.ticket_id;
        displayContent += `\n\n---\n📋 **Request #${ticketId}** created. Our live concierge® will get back to you shortly!`;
        
        // Show toast notification
        toast.success(`Request #${ticketId} created!`, {
          description: 'Our concierge® team will contact you shortly.'
        });
      }
      
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: displayContent,
        researchMode: data.research_mode,
        products: data.products || null, // Product cards if backend returns them
        ticketId: data.ticket_id,
        serviceTicketId: data.service_desk_ticket_id,
        conciergeAction: data.concierge_action,
        kitAssembly: data.kit_assembly || null, // Kit assembly info
        handoff: data.handoff || null, // Concierge handoff info
        showQuickBookForm: data.concierge_action?.show_quick_book_form || false,
        serviceType: data.concierge_action?.service_type || data.concierge_action?.action_type || null
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Speak the response if voice is enabled
      if (voiceEnabled && data.response) {
        speakText(data.response);
      }
      
      // Update quick prompts if provided
      if (data.quick_prompts) {
        setQuickPrompts(data.quick_prompts);
      }
    } catch (error) {
      console.error('[Mira] Chat error:', error);
      let errorContent = "I apologise — I am experiencing a brief connection difficulty. Please try again in a moment, or reach us directly at woof@thedoggycompany.in";
      
      // More specific error for timeout
      if (error.name === 'AbortError') {
        errorContent = "I'm taking a bit longer to think about this one. Please try again — if this persists, our concierge team at woof@thedoggycompany.in is ready to help you!";
      }
      
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorContent
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  const handleQuickAction = (message) => {
    // Directly send the message instead of relying on state update
    if (!message.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Send the message directly
    const sendQuickMessage = async () => {
      try {
        const history = messages
          .filter(m => m.id !== 'welcome')
          .map(m => ({ role: m.role, content: m.content }));
        
        const apiUrl = getApiUrl();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);
        
        const response = await fetch(`${apiUrl}/api/mira/chat`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify({
            message: message.trim(),
            session_id: sessionId,
            source: 'web_widget',
            current_page: location.pathname,
            current_pillar: currentPillar,
            previous_pillar: previousPillar,
            selected_pet_id: userPets.length === 1 ? (userPets[0].id || userPets[0].name) : null,
            history: history
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error('Failed to send message');
        }

        const data = await response.json();

        if (data.pillar) {
          setPreviousPillar(currentPillar);
          setCurrentPillar(data.pillar);
        }

        const assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          products: data.products,
          researchMode: data.research_mode,
          conciergeAction: data.concierge_action
        };

        setMessages(prev => [...prev, assistantMessage]);
        
        if (voiceEnabled && data.response) {
          speakText(data.response);
        }
        
        if (data.quick_prompts) {
          setQuickPrompts(data.quick_prompts);
        }
      } catch (error) {
        console.error('[Mira] Quick action error:', error);
        const errorMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "I apologise — something went wrong. Please try again."
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    };

    sendQuickMessage();
  };

  // Don't render on hidden paths (admin, agent, login)
  if (shouldHide) {
    return null;
  }

  // Determine orb state based on current activity
  const getOrbState = () => {
    if (isListening) return 'listening';
    if (isSpeaking) return 'speaking';
    if (isLoading) return 'thinking';
    return 'idle';
  };

  if (!isOpen) {
    return (
      <div 
        className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-[9998] hidden md:block" 
        data-testid="mira-orb-container"
      >
        <MiraOrb 
          state={getOrbState()}
          onClick={() => setIsOpen(true)}
          size="md"
        />
      </div>
    );
  }

  return (
    <div 
      className={`fixed z-[9999] bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 flex flex-col ${
        isMinimized 
          ? 'bottom-20 right-4 sm:bottom-6 sm:right-6 w-72 h-14' 
          : 'bottom-0 right-0 left-0 top-[60px] sm:bottom-6 sm:right-6 sm:left-auto sm:top-auto sm:w-[400px] sm:h-[600px] sm:max-h-[calc(100vh-100px)] sm:rounded-2xl rounded-none'
      }`}
      data-testid="mira-chat-container"
    >
      {/* Header - Modern gradient theme */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 text-white p-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center ${isListening ? 'animate-pulse ring-2 ring-cyan-400' : ''}`}>
            <Sparkles className="w-5 h-5 text-yellow-300" />
          </div>
          <div>
            <h3 className="font-bold tracking-wide">Mira</h3>
            <p className="text-xs text-white/80">
              {isListening ? '🎤 Listening...' : isSpeaking ? '🔊 Speaking...' : 'Your Pet Concierge'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Voice Toggle Button - Also primes iOS audio on enable */}
          <button
            className={`h-9 w-9 rounded-full flex items-center justify-center transition-colors ${voiceEnabled ? 'bg-cyan-500/80 text-white' : 'bg-white/10 text-white/50'}`}
            onClick={() => {
              const newVoiceEnabled = !voiceEnabled;
              setVoiceEnabled(newVoiceEnabled);
              
              // Prime audio context when enabling voice (especially important for iOS)
              if (newVoiceEnabled) {
                primeAudioForIOS();
              }
              
              if (isSpeaking && synthRef.current) synthRef.current.cancel();
            }}
            title={voiceEnabled ? "Voice responses ON" : "Voice responses OFF"}
            data-testid="mira-voice-toggle"
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          {/* New Conversation Button */}
          <button
            className="text-white/70 hover:text-white hover:bg-white/20 h-9 w-9 rounded-full flex items-center justify-center transition-colors"
            onClick={startNewConversation}
            title="Start new conversation"
            data-testid="mira-new-chat-btn"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          {/* Chat History Button */}
          {token && (
            <button
              className="text-white/70 hover:text-white hover:bg-white/20 h-9 w-9 rounded-full flex items-center justify-center transition-colors"
              onClick={() => setShowHistory(!showHistory)}
              title="Chat history"
              data-testid="mira-history-btn"
            >
              <History className="w-4 h-4" />
            </button>
          )}
          <button
            className="text-white/70 hover:text-white hover:bg-white/20 h-9 w-9 rounded-full flex items-center justify-center transition-colors hidden sm:flex"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? "Expand" : "Minimize"}
            data-testid="mira-minimize-btn"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            className="text-white/70 hover:text-white hover:bg-white/20 h-9 w-9 rounded-full flex items-center justify-center transition-colors"
            onClick={() => setIsOpen(false)}
            title="Close Mira"
            data-testid="mira-close-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chat Area */}
      {!isMinimized && (
        <>
          {/* History Panel */}
          {showHistory && chatHistory.length > 0 && (
            <div className="bg-slate-50 border-b p-3 max-h-40 overflow-y-auto">
              <p className="text-xs font-medium text-gray-500 mb-2">Recent Conversations</p>
              {chatHistory.map((session) => (
                <div 
                  key={session.session_id}
                  className="p-2 bg-white rounded-lg border mb-2 cursor-pointer hover:bg-purple-50 transition-colors"
                  onClick={() => {
                    // Load this session
                    setShowHistory(false);
                    toast.info('Loading conversation...');
                  }}
                >
                  <p className="text-sm font-medium truncate">{session.preview || 'Conversation'}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(session.created_at).toLocaleDateString()} • {session.message_count} messages
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Show WelcomeCard for the welcome message when user is logged in */}
                {message.id === 'welcome' && user ? (
                  <div className="w-full">
                    <WelcomeCard 
                      user={user} 
                      pets={userPets} 
                      onLinkClick={(query) => {
                        // Use handleQuickAction for reliable message sending
                        handleQuickAction(query);
                      }}
                    />
                  </div>
                ) : (
                  <>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === 'user' 
                        ? 'bg-purple-100 text-purple-600' 
                        : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    }`}>
                      {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-purple-600 text-white rounded-br-md'
                        : 'bg-white shadow-sm border border-gray-100 rounded-bl-md'
                    }`}>
                      {message.researchMode && (
                        <div className="text-xs text-purple-600 font-medium mb-1 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Research Mode
                        </div>
                      )}
                      <div className={`text-sm prose prose-sm max-w-none ${
                        message.role === 'user' ? 'prose-invert' : ''
                      }`}>
                        <ReactMarkdown components={markdownComponents}>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                      
                      {/* Product Cards - if message contains products */}
                      {message.products && message.products.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {message.products.slice(0, 8).map((product, pIdx) => (
                            <div 
                              key={pIdx}
                              className={`rounded-xl p-2.5 border flex gap-2.5 transition-shadow ${
                                product.concierge_sourced 
                                  ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200' 
                                  : 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-100 cursor-pointer hover:shadow-md'
                              }`}
                              onClick={() => !product.concierge_sourced && (window.location.href = `/product/${product.id || product._id}`)}
                            >
                              {/* Product Image / Concierge Bell / Service Icon */}
                              {product.concierge_sourced ? (
                                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center flex-shrink-0">
                                  <span className="text-2xl">🔔</span>
                                </div>
                              ) : product.is_service ? (
                                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
                                  <span className="text-2xl">✨</span>
                                </div>
                              ) : (
                                <img 
                                  src={product.image || product.image_url || 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=100'} 
                                  alt={product.name || product.title}
                                  className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop';
                                  }}
                                />
                              )}
                              
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 text-xs leading-tight line-clamp-2">
                                  {product.name || product.title}
                                </h4>
                                
                                {product.concierge_sourced ? (
                                  <div className="mt-1">
                                    <span className="text-[10px] text-amber-700 font-medium">
                                      🔔 Sourced by Concierge®
                                    </span>
                                    <p className="text-[10px] text-amber-600 mt-0.5">
                                      Price & payment link sent separately
                                    </p>
                                  </div>
                                ) : product.is_service ? (
                                  <div className="mt-1">
                                    <span className="text-[10px] text-blue-600 font-medium">
                                      ✨ Service - Book Now
                                    </span>
                                    <button 
                                      className="mt-1.5 text-[10px] font-medium text-white bg-blue-500 hover:bg-blue-600 px-2.5 py-1 rounded-full transition-colors"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Show quick book form for this service
                                        setMessages(prev => [...prev, {
                                          id: Date.now().toString(),
                                          role: 'assistant',
                                          content: `Great choice! Let's book your ${product.name} session.`,
                                          showQuickBookForm: true,
                                          serviceType: product.service_type || product.name.toLowerCase()
                                        }]);
                                      }}
                                    >
                                      📅 Book
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="font-bold text-purple-600 text-sm">
                                        ₹{typeof product.price === 'number' ? product.price.toLocaleString('en-IN') : product.price || '---'}
                                      </span>
                                    </div>
                                    <button 
                                      className="mt-1.5 text-[10px] font-medium text-white bg-purple-500 hover:bg-purple-600 px-2.5 py-1 rounded-full transition-colors flex items-center gap-1"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.dispatchEvent(new CustomEvent('addToCart', { detail: product }));
                                        toast.success('Added to cart!');
                                      }}
                                    >
                                      <ShoppingCart className="w-3 h-3" /> Add
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                          
                          {/* Add All to Cart Button for Kit Assembly */}
                          {message.kitAssembly?.can_add_all_to_cart && message.products.length > 1 && (
                            <button
                              onClick={() => {
                                message.products.forEach(p => {
                                  window.dispatchEvent(new CustomEvent('addToCart', { detail: p }));
                                });
                                toast.success(`Added ${message.products.length} items to cart!`, {
                                  description: 'Your kit is ready to checkout'
                                });
                              }}
                              className="w-full mt-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-sm font-bold hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2 shadow-md"
                            >
                              <ShoppingCart className="w-4 h-4" />
                              Add All {message.products.length} Items to Cart
                            </button>
                          )}
                          
                          {/* Save Kit to Profile Button */}
                          {message.kitAssembly?.is_kit && message.products.length > 0 && token && (
                            <button
                              onClick={async () => {
                                const kitName = prompt('Name your kit:', `My ${message.kitAssembly?.kit_type?.replace('_', ' ') || 'Custom'} Kit`);
                                if (!kitName) return;
                                
                                try {
                                  const res = await fetch(`${getApiUrl()}/api/mira/kits/save`, {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'Authorization': `Bearer ${token}`
                                    },
                                    body: JSON.stringify({
                                      kit_name: kitName,
                                      kit_type: message.kitAssembly?.kit_type || 'custom',
                                      products: message.products,
                                      pet_id: userPets?.[0]?.id,
                                      occasion: message.kitAssembly?.gathered_info?.occasion
                                    })
                                  });
                                  const data = await res.json();
                                  if (data.success) {
                                    toast.success('Kit saved to your profile!', {
                                      description: 'Find it in My Account → My Kits'
                                    });
                                  } else {
                                    toast.error('Could not save kit');
                                  }
                                } catch (err) {
                                  toast.error('Failed to save kit');
                                }
                              }}
                              className="w-full mt-2 px-4 py-2 bg-white border-2 border-purple-300 text-purple-700 rounded-xl text-sm font-semibold hover:bg-purple-50 transition-all flex items-center justify-center gap-2"
                            >
                              <Heart className="w-4 h-4" />
                              Save Kit to My Profile
                            </button>
                          )}
                        </div>
                      )}
                      
                      {/* Quick Book Form for Service Requests */}
                      {message.showQuickBookForm && (
                        <div className="mt-3 p-3 bg-white rounded-xl border border-purple-200 shadow-sm">
                          <p className="text-xs font-bold text-purple-700 uppercase mb-2 flex items-center gap-1">
                            📅 Quick Book
                          </p>
                          <form onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            const bookingData = {
                              date: formData.get('date'),
                              time: formData.get('time'),
                              notes: formData.get('notes'),
                              serviceType: message.serviceType || 'service'
                            };
                            try {
                              const res = await fetch(`${getApiUrl()}/api/mira/quick-book`, {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  ...(token && { 'Authorization': `Bearer ${token}` })
                                },
                                body: JSON.stringify({
                                  ...bookingData,
                                  session_id: sessionId,
                                  pet_id: userPets?.[0]?.id
                                })
                              });
                              const data = await res.json();
                              // Use the service type from the API response for accurate display
                              const confirmedServiceType = data.service_type || bookingData.serviceType || 'service';
                              toast.success('Booking request submitted!', {
                                description: `Reference: ${data.booking_id || 'Pending'}`
                              });
                              setMessages(prev => [...prev, {
                                id: Date.now().toString(),
                                role: 'assistant',
                                content: `Great! I've submitted your ${confirmedServiceType.replace(/_/g, ' ')} booking request for ${bookingData.date} at ${bookingData.time}. Our team will confirm shortly! 🐾`
                              }]);
                            } catch (err) {
                              toast.error('Failed to submit booking');
                            }
                          }} className="space-y-2">
                            <div className="flex gap-2">
                              <input
                                type="date"
                                name="date"
                                required
                                min={new Date().toISOString().split('T')[0]}
                                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              />
                              <select
                                name="time"
                                required
                                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              >
                                <option value="">Time</option>
                                <option value="09:00">9:00 AM</option>
                                <option value="10:00">10:00 AM</option>
                                <option value="11:00">11:00 AM</option>
                                <option value="12:00">12:00 PM</option>
                                <option value="14:00">2:00 PM</option>
                                <option value="15:00">3:00 PM</option>
                                <option value="16:00">4:00 PM</option>
                                <option value="17:00">5:00 PM</option>
                              </select>
                            </div>
                            <input
                              type="text"
                              name="notes"
                              placeholder="Any special requests..."
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                            <button
                              type="submit"
                              className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-bold hover:from-purple-700 hover:to-pink-700 transition-all"
                            >
                              Confirm Booking
                            </button>
                          </form>
                        </div>
                      )}
                      
                      {/* Concierge Handoff Notice */}
                      {message.handoff?.needed && (
                        <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                          <p className="text-xs font-bold text-amber-700 flex items-center gap-1">
                            📦 Custom Kit Request Sent
                          </p>
                          <p className="text-xs text-amber-600 mt-1">
                            Our concierge® will curate your kit and send details via email/WhatsApp.
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white shadow-sm border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Mira is typing...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions - Context-aware based on pillar */}
          {messages.length === 1 && quickPrompts.length > 0 && (
            <div className="px-4 pb-2 flex gap-2 flex-wrap bg-gray-50">
              {quickPrompts.slice(0, 3).map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickAction(prompt.message)}
                  className="text-xs bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full hover:bg-purple-100 transition-colors"
                  data-testid={`mira-quick-prompt-${idx}`}
                >
                  {prompt.label}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 pb-safe border-t bg-white flex-shrink-0" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
            <form onSubmit={sendMessage} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isListening ? "Listening..." : "Type your message..."}
                className={`flex-1 px-4 py-2.5 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  isListening ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                }`}
                disabled={isLoading}
                data-testid="mira-input"
                enterKeyHint="send"
              />
              {/* Voice Input Button */}
              {speechSupported && (
                <Button
                  type="button"
                  onClick={toggleListening}
                  className={`rounded-full w-10 h-10 p-0 flex items-center justify-center ${
                    isListening 
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                  }`}
                  data-testid="mira-voice-btn"
                >
                  {isListening ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4" />}
                </Button>
              )}
              <Button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full w-10 h-10 p-0 flex items-center justify-center"
                data-testid="mira-send-btn"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
            <p className="text-xs text-gray-400 text-center mt-2">
              Powered by The Doggy Company AI
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default MiraAI;
