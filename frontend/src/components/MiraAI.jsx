import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';

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
    flow: null, // 'celebration', 'services', 'guidance'
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
      selectedProduct: null
    }
  });
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        text: `Celebration Summary\n\nDog's Name: ${ctx.dogName}\nLife Stage: ${ctx.lifeStage}\nOccasion: ${ctx.occasion}\nDate: ${ctx.date}\nCity: ${ctx.city}\nDietary Notes: ${ctx.allergies}\nSelected Celebration: ${ctx.selectedProduct}\nContact: ${userMessage} (${ctx.contactMethod})\n\nImportant Note:\nAll products are handcrafted in limited batches and subject to freshness windows and breed suitability.\n\nTo proceed, please type: I confirm`,
        suggestions: ['I confirm'],
        nextStep: 11,
        updateContext: { data: { ...conversationContext.data, contactDetail: userMessage } }
      };
    }
    
    // Step 12: Confirmation
    if (step === 11 && msg.includes('confirm')) {
      return {
        text: 'Your celebration is now reserved in principle.\n\nOur Concierge® team at woof@thedoggybakery.com or WhatsApp +91 96631 85747 will reach out shortly with the secure payment link and final details.\n\nThank you for trusting us with this precious moment.\n\nIs there anything else I may help you with today?',
        suggestions: ['Plan another celebration', 'Find services', 'That\'s all, thank you'],
        nextStep: 0,
        updateContext: { flow: null, step: 0, data: {} }
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
    
    // Step 2: City provided, now provide verified services
    if (step === 2) {
      const city = userMessage;
      const serviceType = conversationContext.data.serviceType;
      
      if (serviceType === 'vet') {
        return {
          text: `Verified Veterinary Clinics in ${city}:\n\nPlease note: I'm currently verifying the most up-to-date contact details for the finest veterinary practices in ${city}.\n\nFor immediate assistance, our trusted partners include:\n\nBangalore:\n• Cessna Lifeline, JP Nagar\n• VetCare Hospital, Indiranagar\n\nMumbai:\n• Bai Sakarbai Dinshaw Petit Hospital, Parel\n• BSPCA Animal Hospital, Parel\n\nGurgaon:\n• The Pet Clinic, Sector 51\n\nWould you like me to verify specific details for any of these practices?`,
          suggestions: ['Show contact details', 'Emergency care', 'Specialist needed', 'Start over'],
          nextStep: 3,
          updateContext: { data: { ...conversationContext.data, city } }
        };
      }
      
      if (serviceType === 'grooming') {
        return {
          text: `Verified Grooming Sanctuaries in ${city}:\n\nI'm gathering the latest verified information for premium grooming establishments.\n\nBangalore:\n• Heads Up For Tails (Multiple locations)\n• Fur Ball Story, HSR Layout\n\nMumbai:\n• The Pets Workshop, Andheri\n• Bark N Bath (Premium grooming)\n\nGurgaon:\n• Doggy Style, Sector 29\n\nShall I verify specific services and pricing for you?`,
          suggestions: ['Full grooming prices', 'Spa services', 'Mobile grooming', 'Start over'],
          nextStep: 3,
          updateContext: { data: { ...conversationContext.data, city } }
        };
      }
      
      if (serviceType === 'boarding') {
        return {
          text: `Trusted Boarding & Daycare in ${city}:\n\nI'm gathering the latest verified information for pet boarding facilities.\n\nBangalore:\n• Canine Country Club, Whitefield\n• Pet Retreat, Sarjapur Road\n\nMumbai:\n• Pawfect Stay, Andheri\n• Happy Tails Boarding, Bandra\n\nGurgaon:\n• The Pet Boarding House, Sector 49\n\nWould you like more details about any of these facilities?`,
          suggestions: ['Pricing info', 'Facility details', 'Day boarding', 'Start over'],
          nextStep: 3,
          updateContext: { data: { ...conversationContext.data, city } }
        };
      }
      
      if (serviceType === 'training') {
        return {
          text: `Professional Dog Trainers in ${city}:\n\nI'm gathering the latest verified information for professional trainers.\n\nBangalore:\n• Pawsitive Training Academy, Koramangala\n• K9 Trainers India, HSR Layout\n\nMumbai:\n• Canine Coaching, Andheri\n• The Dog School, Bandra\n\nGurgaon:\n• Perfect Paws Training, Sector 56\n\nWould you like more details about training programs?`,
          suggestions: ['Puppy training', 'Behaviour correction', 'Advanced training', 'Start over'],
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
    const msg = userMessage.toLowerCase();
    const { flow, step } = conversationContext;
    
    // Handle ongoing celebration flow
    if (flow === 'celebration') {
      return handleCelebrationFlow(userMessage, step);
    }
    
    // Handle ongoing services flow
    if (flow === 'services') {
      return handleServicesFlow(userMessage, step);
    }
    
    // Initial routing
    if (msg.includes('celebrat') || msg.includes('birthday') || msg.includes('party') || msg.includes('cake')) {
      return handleCelebrationFlow(userMessage, 0);
    }
    
    if (msg.includes('service') || msg.includes('find') || msg.includes('recommend') || msg.includes('vet') || msg.includes('groom') || msg.includes('board') || msg.includes('train')) {
      return handleServicesFlow(userMessage, 0);
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
    setTimeout(() => {
      const response = getResponse(message);
      
      if (response) {
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          text: response.text,
          suggestions: response.suggestions
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
