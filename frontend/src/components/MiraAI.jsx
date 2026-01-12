import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';

import { conciergeServices } from '../mockData';

const MiraAI = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: 'Good day. I\'m Mira, The Doggy Bakery Concierge®.\n\nI\'m here not to sell, but to help you honour the heartbeat that changed your life.\n\nWhether it\'s a milestone celebration, finding the perfect grooming sanctuary, or planning your first journey together—I\'m here to guide you with care.\n\nHow may I be of service today?',
      suggestions: [
        'Plan a celebration',
        'Find trusted services',
        'Seasonal care guidance',
        'Memory-making experiences'
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationContext, setConversationContext] = useState({
    flow: null, 
    step: 0,
    data: {
      dogName: null,
      lifeStage: null,
      breed: null,
      occasion: null,
      date: null,
      city: null,
      allergies: null,
      contactMethod: null,
      contactDetail: null,
      selectedProduct: null,
      serviceType: null // Added for concierge
    }
  });
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen for custom event to open Mira AI
  useEffect(() => {
    const handleOpenMira = (event) => {
      setIsOpen(true);
      
      // Handle specific context if provided (e.g., from Concierge page)
      if (event.detail && event.detail.mode) {
        const mode = event.detail.mode;
        
        if (mode === 'general') {
           // Default greeting is fine
           return;
        }

        let initialText = '';
        let initialFlow = 'services';
        let initialStep = 1;
        let serviceType = null;

        switch (mode) {
          case 'vet':
            initialText = "I understand you're looking for veterinary care.\n\nTo help me find the best professionals near you, which city are you in?";
            serviceType = 'vet';
            initialStep = 2; // Skip asking "what service"
            break;
          case 'travel':
            initialText = "Planning a journey with your companion? I can help with travel rules and relocation experts.\n\nAre you looking for:\n1. Train Travel Rules\n2. Flight Travel Rules\n3. Relocation Agents";
            initialFlow = 'concierge_travel';
            initialStep = 1;
            break;
          case 'grooming':
            initialText = "Let's find a pampering session for your pup.\n\nWhich city are you located in?";
            serviceType = 'grooming';
            initialStep = 2;
            break;
          case 'boarding':
            initialText = "Finding a safe home-away-from-home is priority.\n\nWhich city do you need boarding in?";
            serviceType = 'boarding';
            initialStep = 2;
            break;
          default:
            initialText = "How may I assist with your Concierge request today?";
            initialStep = 0;
        }

        const newMessage = {
          id: Date.now(),
          type: 'bot',
          text: initialText,
          suggestions: mode === 'travel' ? ['Train Rules', 'Flight Rules', 'Agents'] : ['Bangalore', 'Mumbai', 'Gurgaon', 'Other']
        };

        setMessages(prev => [...prev, newMessage]);
        setConversationContext({
          flow: initialFlow,
          step: initialStep,
          data: { serviceType }
        });
      }
    };
    
    window.addEventListener('openMiraAI', handleOpenMira);
    return () => window.removeEventListener('openMiraAI', handleOpenMira);
  }, []);

  // Celebration Flow Handler
  const handleCelebrationFlow = (userMessage, step) => {
    const msg = userMessage.toLowerCase();
    
    // Step 1: Understand the moment (grounding narrative)
    if (step === 0) {
      return {
        text: 'How wonderful.\n\nEvery celebration is a chapter in the story of love you share.\n\nBefore I curate something truly meaningful, may I know a bit more?\n\nWhat is your dog\'s name?',
        suggestions: [],
        nextStep: 1,
        updateContext: { flow: 'celebration', step: 1 }
      };
    }
    
    // Step 2: Dog's name captured
    if (step === 1 && !conversationContext.data.dogName) {
      return {
        text: `${userMessage} — what a lovely name.\n\nHow old is ${userMessage}, and would you describe them as a puppy, adult, or a cherished senior?`,
        suggestions: ['Puppy (under 1 year)', 'Adult (1-7 years)', 'Senior (7+ years)'],
        nextStep: 2,
        updateContext: { data: { ...conversationContext.data, dogName: userMessage } }
      };
    }
    
    // Step 3: Life stage captured
    if (step === 2 && !conversationContext.data.lifeStage) {
      return {
        text: 'Thank you.\n\nWhat is the occasion we\'re celebrating?\n\nIs it a birthday, a Gotcha Day, perhaps a first festival, or simply a moment of gratitude?',
        suggestions: ['Birthday', 'Gotcha Day', 'First Festival', 'Just Because'],
        nextStep: 3,
        updateContext: { data: { ...conversationContext.data, lifeStage: userMessage } }
      };
    }
    
    // Step 4: Occasion captured
    if (step === 3 && !conversationContext.data.occasion) {
      return {
        text: 'How special.\n\nWhen is this celebration taking place?\n\nPlease share the date so I may ensure everything is crafted with care and delivered in time.',
        suggestions: [],
        nextStep: 4,
        updateContext: { data: { ...conversationContext.data, occasion: userMessage } }
      };
    }
    
    // Step 5: Date captured
    if (step === 4 && !conversationContext.data.date) {
      return {
        text: 'Noted.\n\nWhich city are you in?\n\nThis helps me recommend the most suitable delivery options and trusted local services.',
        suggestions: ['Bangalore', 'Mumbai', 'Gurgaon', 'Other'],
        nextStep: 5,
        updateContext: { data: { ...conversationContext.data, date: userMessage } }
      };
    }
    
    // Step 6: City captured
    if (step === 5 && !conversationContext.data.city) {
      return {
        text: 'Perfect.\n\nDoes your companion have any dietary sensitivities or allergies I should be mindful of?\n\nGrain allergies, chicken sensitivity, or perhaps they prefer vegetarian options?',
        suggestions: ['No allergies', 'Grain-free needed', 'No chicken', 'Vegetarian'],
        nextStep: 6,
        updateContext: { data: { ...conversationContext.data, city: userMessage } }
      };
    }
    
    // Step 7: Allergies captured - Now curate options
    if (step === 6 && !conversationContext.data.allergies) {
      const dogName = conversationContext.data.dogName;
      const occasion = conversationContext.data.occasion;
      
      return {
        text: `Thank you for trusting me with ${dogName}'s details.\n\nBased on what you've shared, I would suggest three celebration rituals:\n\n1. The Pawsome Celebration\nOur signature cake crafted with care — perfect for intimate moments with 1-2 companions. Fresh chicken & oats or peanut butter. (₹699)\n\n2. The Grand Pawty Box\nA complete celebration including cake, treats, and decorative touches for gatherings of 3-5 furry guests. (₹999)\n\n3. The Bespoke Portrait Cake\nA custom creation shaped to honour ${dogName}'s breed — a true work of art and love. (₹950+)\n\nWhich ritual speaks to you?`,
        suggestions: ['The Pawsome', 'The Grand Pawty', 'The Bespoke Portrait', 'Tell me more'],
        nextStep: 7,
        updateContext: { data: { ...conversationContext.data, allergies: userMessage } }
      };
    }
    
    // Step 8: Product selected - Enhancement gate
    if (step === 7 && !conversationContext.data.selectedProduct) {
      return {
        text: 'A beautiful choice.\n\nWould you like to enhance this celebration with:\n\n• A matching birthday bandana\n• Pupcakes for sharing with friends\n• A personalised message plaque\n\nShall I add any of these touches?',
        suggestions: ['Yes, add bandana', 'Yes, add pupcakes', 'Yes, add plaque', 'No, continue'],
        nextStep: 8,
        updateContext: { data: { ...conversationContext.data, selectedProduct: userMessage } }
      };
    }
    
    // Step 9: Enhancement decided - Contact method
    if (step === 8 && !conversationContext.data.contactMethod) {
      return {
        text: 'May I confirm your preferred method of contact — WhatsApp, email, or a personal call back?',
        suggestions: ['WhatsApp', 'Email', 'Call back'],
        nextStep: 9,
        updateContext: { data: { ...conversationContext.data, enhancement: userMessage } }
      };
    }
    
    // Step 10: Contact method selected - Get contact detail
    if (step === 9 && !conversationContext.data.contactDetail) {
      if (msg.includes('whatsapp')) {
        return {
          text: 'Wonderful. Please share your WhatsApp number.',
          suggestions: [],
          nextStep: 10,
          updateContext: { data: { ...conversationContext.data, contactMethod: 'WhatsApp' } }
        };
      } else if (msg.includes('email')) {
        return {
          text: 'Of course. Please share your email address.',
          suggestions: [],
          nextStep: 10,
          updateContext: { data: { ...conversationContext.data, contactMethod: 'Email' } }
        };
      } else {
        return {
          text: 'I shall arrange a call back. Please share your phone number.',
          suggestions: [],
          nextStep: 10,
          updateContext: { data: { ...conversationContext.data, contactMethod: 'Call back' } }
        };
      }
    }
    
    // Step 11: Contact detail captured - Show summary
    if (step === 10) {
      const ctx = conversationContext.data;
      return {
        text: `Celebration Summary\n\nDog's Name: ${ctx.dogName}\nLife Stage: ${ctx.lifeStage}\nOccasion: ${ctx.occasion}\nDate: ${ctx.date}\nCity: ${ctx.city}\nDietary Notes: ${ctx.allergies}\nSelected Celebration: ${ctx.selectedProduct}\nContact: ${userMessage} (${ctx.contactMethod})\n\nImportant Note:\nAll products are handcrafted in limited batches and subject to freshness windows and breed suitability.\n\nTo proceed, please confirm below:`,
        suggestions: ['✓ Confirm & Send to WhatsApp'],
        nextStep: 11,
        updateContext: { data: { ...conversationContext.data, contactDetail: userMessage } }
      };
    }
    
    // Step 12: Confirmation - Open WhatsApp with order details
    if (step === 11 && (msg.includes('confirm') || msg.includes('whatsapp'))) {
      const ctx = conversationContext.data;
      
      // Generate WhatsApp message with all order details
      const whatsappMessage = `🐕 *New Mira AI Celebration Order*

*Customer Contact:*
${ctx.contactMethod}: ${ctx.contactDetail}

*Pet Details:*
Dog's Name: ${ctx.dogName}
Life Stage: ${ctx.lifeStage}

*Celebration Details:*
Occasion: ${ctx.occasion}
Date: ${ctx.date}
City: ${ctx.city}
Dietary Notes: ${ctx.allergies}

*Selected Package:*
${ctx.selectedProduct}
${ctx.enhancement && ctx.enhancement !== 'No, continue' ? `Enhancement: ${ctx.enhancement}` : ''}

_Order placed via Mira AI Concierge_`;

      // Generate WhatsApp URL for clickable link
      const encodedMessage = encodeURIComponent(whatsappMessage);
      const whatsappUrl = `https://wa.me/919663185747?text=${encodedMessage}`;
      
      return {
        text: '🎉 Wonderful! Your celebration order is ready to be sent.\n\nClick the button below to send your order details via WhatsApp. Our Concierge® team will respond within minutes to confirm availability and arrange payment.',
        suggestions: ['Plan another celebration', 'Find services', 'That\'s all, thank you'],
        whatsappLink: whatsappUrl,
        nextStep: 0,
        updateContext: { flow: null, step: 0, data: {} }
      };
    }
    
    return null;
  };

  // Medical & Illegal Safety Filter
  const checkSafety = (text) => {
    const lower = text.toLowerCase();
    const medicalKeywords = ['vomit', 'blood', 'sick', 'pain', 'dying', 'poison', 'emergency', 'fracture', 'broken leg', 'swallowed', 'fever'];
    const illegalKeywords = ['buy dog', 'sell dog', 'fight', 'drug', 'illegal', 'smuggle'];

    if (medicalKeywords.some(k => lower.includes(k))) {
      return {
        isUnsafe: true,
        response: {
          text: "⚠️ Medical Disclaimer: I am an AI concierge, not a veterinarian.\n\nYour message suggests a potential medical concern. Please contact a qualified vet immediately.\n\nWould you like me to show you a list of emergency veterinary clinics in your area?",
          suggestions: ['Yes, find vet', 'No, return to menu'],
          nextStep: 2, // Jump to city selection for vets
          updateContext: { flow: 'services', step: 2, data: { serviceType: 'vet' } }
        }
      };
    }

    if (illegalKeywords.some(k => lower.includes(k))) {
      return {
        isUnsafe: true,
        response: {
          text: "I cannot assist with this request. Mira Concierge strictly adheres to all animal welfare laws and ethical guidelines. We do not support the trading of dogs or any illegal activities.\n\nHow else may I help you with responsible pet care?",
          suggestions: ['Find trusted services', 'Plan a celebration'],
          nextStep: 0,
          updateContext: { flow: null, step: 0 }
        }
      };
    }

    return { isUnsafe: false };
  };

  // Concierge Travel Flow
  const handleTravelFlow = (userMessage, step) => {
    const msg = userMessage.toLowerCase();
    
    if (step === 1) {
      if (msg.includes('train')) {
        const info = conciergeServices.documentation.find(d => d.topic === 'train');
        return {
          text: `${info.title}\n\n${info.content}\n\nWould you like to know about flight rules too?`,
          suggestions: ['Show Flight Rules', 'Back to Menu'],
          nextStep: 1,
          updateContext: { flow: 'concierge_travel', step: 1 }
        };
      }
      if (msg.includes('flight') || msg.includes('air')) {
        const info = conciergeServices.documentation.find(d => d.topic === 'flight');
        return {
          text: `${info.title}\n\n${info.content}\n\nWould you like to know about train rules too?`,
          suggestions: ['Show Train Rules', 'Back to Menu'],
          nextStep: 1,
          updateContext: { flow: 'concierge_travel', step: 1 }
        };
      }
      if (msg.includes('agent')) {
        const agents = conciergeServices.travel;
        const agentList = agents.map(a => `• ${a.name} (${a.desc})`).join('\n');
        return {
          text: `Trusted Relocation Agents:\n\n${agentList}\n\nShall I connect you with one of them?`,
          suggestions: ['Connect via WhatsApp', 'Back to Menu'],
          nextStep: 2,
          updateContext: { flow: 'concierge_travel', step: 2 }
        };
      }
      // Default fallback
      return {
        text: "Are you looking for:\n1. Train Travel Rules\n2. Flight Travel Rules\n3. Relocation Agents",
        suggestions: ['Train Rules', 'Flight Rules', 'Agents'],
        nextStep: 1,
        updateContext: { flow: 'concierge_travel', step: 1 }
      };
    }

    if (step === 2 && (msg.includes('connect') || msg.includes('whatsapp'))) {
       return {
        text: 'I have noted your request. Please click below to send a WhatsApp message to our Concierge Team, and they will personally introduce you to the relocation expert.',
        whatsappLink: 'https://wa.me/919663185747?text=I%20need%20help%20with%20Pet%20Relocation',
        suggestions: ['Back to Menu'],
        nextStep: 0,
        updateContext: { flow: null, step: 0 }
       };
    }

    if (msg.includes('back')) {
        return {
          text: 'How else may I be of service?',
          suggestions: ['Find Services', 'Plan Celebration'],
          nextStep: 0,
          updateContext: { flow: null, step: 0 }
        };
    }

    return null;
  };

  // Services Flow Handler
  const handleServicesFlow = (userMessage, step) => {
    const msg = userMessage.toLowerCase();
    
    // Step 0: Ask what service type they need
    if (step === 0) {
      return {
        text: 'I would be delighted to help you find trusted services.\n\nWhat are you looking for?',
        suggestions: ['Veterinary care', 'Grooming & spa', 'Boarding & daycare', 'Training guidance', 'Go back'],
        nextStep: 1,
        updateContext: { flow: 'services', step: 1 }
      };
    }
    
    // Step 1: Service type selected, now ask for city
    if (step === 1) {
      let serviceType = null;
      if (msg.includes('vet') || msg.includes('veterinary') || msg.includes('doctor') || msg.includes('clinic')) {
        serviceType = 'vet';
      } else if (msg.includes('groom') || msg.includes('spa') || msg.includes('bath')) {
        serviceType = 'grooming';
      } else if (msg.includes('board') || msg.includes('daycare') || msg.includes('stay')) {
        serviceType = 'boarding';
      } else if (msg.includes('train') || msg.includes('behavio')) {
        serviceType = 'training';
      } else if (msg.includes('back') || msg.includes('go back')) {
        return {
          text: 'No problem. How else may I assist you today?',
          suggestions: ['Plan a celebration', 'Find trusted services', 'Seasonal care guidance', 'Memory-making experiences'],
          nextStep: 0,
          updateContext: { flow: null, step: 0, data: {} }
        };
      }
      
      if (serviceType) {
        return {
          text: 'Which city are you in?\n\nThis helps me provide the most accurate and verified recommendations.',
          suggestions: ['Bangalore', 'Mumbai', 'Gurgaon', 'Delhi', 'Other'],
          nextStep: 2,
          updateContext: { flow: 'services', step: 2, data: { ...conversationContext.data, serviceType } }
        };
      }
    }
    
    // Step 2: City provided, now provide verified services from MOCK DB
    if (step === 2) {
      let city = 'all';
      if (msg.includes('bangalore') || msg.includes('bengaluru')) city = 'bangalore';
      else if (msg.includes('mumbai') || msg.includes('bombay')) city = 'mumbai';
      else if (msg.includes('gurgaon') || msg.includes('gurugram')) city = 'gurgaon';
      else city = 'other';

      const serviceType = conversationContext.data.serviceType;
      
      // Fetch from Mock DB
      let results = [];
      if (serviceType === 'vet' && conciergeServices.vets) {
         results = conciergeServices.vets.filter(s => s.city === city);
      } else if (serviceType === 'grooming' && conciergeServices.grooming) {
         results = conciergeServices.grooming.filter(s => s.city === city);
      }

      // Generic response generation
      if (results.length > 0) {
        const list = results.map(r => `• ${r.name}, ${r.location} (${r.rating}★)`).join('\n');
        return {
          text: `Here are our verified partners in ${userMessage}:\n\n${list}\n\nWould you like contact details for any of these?`,
          suggestions: ['Yes, contact details', 'Search another city', 'Back to Menu'],
          nextStep: 3,
          updateContext: { data: { ...conversationContext.data, city, searchResults: results } }
        };
      } else {
         // Fallback for "Other" or no data
         return {
           text: `I'm currently expanding my network in ${userMessage}. \n\nHowever, I can connect you with our Concierge Team who can personally find a trusted ${serviceType} for you.\n\nShall I connect you?`,
           suggestions: ['Yes, connect me', 'Try another city'],
           nextStep: 3,
           updateContext: { data: { ...conversationContext.data, city } }
         };
      }
    }
    
    // Step 3: Follow-up questions or start over
    if (step === 3) {
      if (msg.includes('start over') || msg.includes('back')) {
        return {
          text: 'Of course. How else may I assist you today?',
          suggestions: ['Plan a celebration', 'Find trusted services', 'Seasonal care guidance', 'Memory-making experiences'],
          nextStep: 0,
          updateContext: { flow: null, step: 0, data: {} }
        };
      }
      
      return {
        text: 'I appreciate your interest. For the most accurate and up-to-date information, I recommend:\n\n1. Our concierge team can provide verified details\n2. Contact us at woof@thedoggybakery.com\n3. WhatsApp us at +91 96631 85747\n\nIs there anything else I can help you with?',
        suggestions: ['Plan a celebration', 'Find other services', 'That\'s all, thank you'],
        nextStep: 0,
        updateContext: { flow: null, step: 0, data: {} }
      };
    }
    
    return null;
  };

  // Main response handler
  const getResponse = (userMessage) => {
    // 1. Check Safety First
    const safetyCheck = checkSafety(userMessage);
    if (safetyCheck.isUnsafe) {
      return safetyCheck.response;
    }

    const msg = userMessage.toLowerCase();
    const { flow, step } = conversationContext;
    
    // Handle ongoing flows
    if (flow === 'celebration') return handleCelebrationFlow(userMessage, step);
    if (flow === 'services') return handleServicesFlow(userMessage, step);
    if (flow === 'concierge_travel') return handleTravelFlow(userMessage, step);
    
    // Initial routing
    if (msg.includes('celebrat') || msg.includes('birthday') || msg.includes('party') || msg.includes('cake')) {
      return handleCelebrationFlow(userMessage, 0);
    }
    
    if (msg.includes('service') || msg.includes('find') || msg.includes('recommend') || msg.includes('vet') || msg.includes('groom') || msg.includes('board') || msg.includes('train')) {
      return handleServicesFlow(userMessage, 0);
    }

    if (msg.includes('travel') || msg.includes('fly') || msg.includes('rail')) {
       return handleTravelFlow(userMessage, 1); // Jump to travel
    }
    
    if (msg.includes('seasonal') || msg.includes('festival') || msg.includes('diwali') || msg.includes('christmas')) {
      return {
        text: 'Festivals can be both joyful and anxious for our companions.\n\nWhich seasonal care are you seeking?\n\n• Diwali anxiety care\n• Monsoon wellness\n• Winter warmth rituals\n• Christmas celebrations',
        suggestions: ['Diwali care', 'Monsoon care', 'Winter care', 'Christmas'],
        updateContext: { flow: 'seasonal', step: 0 }
      };
    }
    
    // Default thoughtful response
    return {
      text: 'I\'m here to help you honour the bond you share.\n\nHow may I be of service?\n\n• Plan a meaningful celebration\n• Find trusted pet-life services\n• Seasonal care guidance\n• Memory-making experiences',
      suggestions: ['Plan celebration', 'Find services', 'Seasonal care', 'Memory experiences']
    };
  };
  const getAiResponse = async (userMessage) => {
    // 1. Check Safety First (Client Side)
    const safetyCheck = checkSafety(userMessage);
    if (safetyCheck.isUnsafe) {
      return safetyCheck.response;
    }

    // 2. Try rule-based logic first (e.g. for flow continuation)
    const ruleBasedResponse = getResponse(userMessage);
    if (ruleBasedResponse) return ruleBasedResponse;

    // 3. Fallback to LLM + Web Search
    try {
      const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const res = await fetch(`${API_URL}/api/mira/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });
      
      const data = await res.json();
      return {
        text: data.response || "I apologize, I'm having trouble connecting right now.",
        suggestions: ['Ask another question', 'Plan a celebration', 'Find services']
      };
    } catch (e) {
      return {
        text: "I seem to be having trouble reaching my knowledge base. Please try again in a moment.",
        suggestions: ['Try again']
      };
    }
  };


  const handleSend = async (message = inputValue) => {
    if (!message.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: message
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate thoughtful pause
    setTimeout(async () => {
      // Use getAiResponse instead of getResponse
      const response = await getAiResponse(message);
      
      if (response) {
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          text: response.text,
          suggestions: response.suggestions,
          whatsappLink: response.whatsappLink || null
        };
        
        setMessages(prev => [...prev, botMessage]);
        
        // Update conversation context
        if (response.updateContext) {
          setConversationContext(prev => ({
            ...prev,
            ...response.updateContext,
            step: response.nextStep !== undefined ? response.nextStep : prev.step,
            data: response.updateContext.data || prev.data
          }));
        }
      }
      
      setIsTyping(false);
    }, 2000);
  };

  const handleSuggestionClick = (suggestion) => {
    handleSend(suggestion);
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-purple-600 via-pink-600 to-purple-700 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform duration-300 group"
        >
          <div className="relative">
            <Sparkles className="w-7 h-7 text-white animate-pulse" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
          </div>
          <div className="absolute -top-2 -left-2 w-20 h-20 bg-purple-400 rounded-full opacity-20 animate-ping"></div>
        </button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 z-50 w-96 h-[600px] shadow-2xl flex flex-col overflow-hidden border-2 border-purple-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                </div>
                <div>
                  <h3 className="font-bold text-lg">Mira</h3>
                  <p className="text-xs text-white/80">The Doggy Bakery Concierge®</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div key={message.id}>
                <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.type === 'user'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                        : 'bg-white shadow-md text-gray-800'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line leading-relaxed">{message.text}</p>
                    {/* WhatsApp Send Order Button */}
                    {message.whatsappLink && (
                      <a
                        href={message.whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold transition-colors"
                        data-testid="mira-whatsapp-order-btn"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        Send Order via WhatsApp
                      </a>
                    )}
                  </div>
                </div>
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 ml-2">
                    {message.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="px-3 py-1.5 text-xs bg-white border-2 border-purple-200 text-purple-600 rounded-full hover:bg-purple-50 hover:border-purple-400 transition-all font-medium"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white shadow-md rounded-2xl px-4 py-3">
                  <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Share your thoughts..."
                className="flex-1"
              />
              <Button
                onClick={() => handleSend()}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
};

export default MiraAI;
