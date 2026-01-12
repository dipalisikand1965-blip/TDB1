import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, MessageCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';

const MiraAI = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: '👋 Hi! I\'m Mira, your Pet Celebration Concierge! I\'m here to help you plan the perfect celebration for your furry friend. What can I help you with today?',
      suggestions: [
        'Plan a birthday party',
        'Recommend a cake',
        'Dietary restrictions',
        'Party ideas'
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const celebrationResponses = {
    'birthday': {
      text: '🎉 How exciting! Let\'s plan an amazing birthday celebration! Here\'s what I recommend:\n\n1. Pawsome 2.0 Cake (₹699) - Our bestseller, perfect for 1-2 dogs\n2. Dog Cake Party Box (₹999) - Complete with treats and decorations\n3. Custom Breed Cake - We can make it look like your pup!\n\nHow many furry guests will be joining?',
      suggestions: ['Just my dog', '2-4 dogs', '5+ dogs', 'Custom cake design']
    },
    'cake': {
      text: '🎂 I\'d love to help you find the perfect cake! Tell me about your pup:\n\n• What\'s their favorite flavor?\n• Any dietary restrictions?\n• Size needed?\n\nOur most popular options are:\n- Chicken & Oats - Classic favorite\n- Peanut Butter - Irresistible!\n- Banana & Honey - Sweet & healthy',
      suggestions: ['Chicken lover', 'Peanut butter fan', 'Grain-free needed', 'Custom flavor']
    },
    'dietary': {
      text: '💚 I completely understand! We take dietary needs seriously. Let me know:\n\n• Grain allergies? We have grain-free options\n• Chicken sensitivity? Try fish or mutton\n• Vegetarian? Our paneer & veggies meals\n\nAll our products are FSSAI approved and made with natural ingredients. What\'s your pup\'s restriction?',
      suggestions: ['Grain-free', 'No chicken', 'Vegetarian', 'Multiple allergies']
    },
    'party': {
      text: '🎈 Let\'s make this party unforgettable! Here are my favorite celebration ideas:\n\nFor Intimate Celebrations (1-3 dogs):\n• Pupcakes & matching bandana\n• Custom breed cake\n• Photo booth setup\n\nFor Bigger Pawties (4+ dogs):\n• Party Box with multiple treats\n• Dognut tower\n• Treat bags for guests\n\nWhat type of celebration are you planning?',
      suggestions: ['Small & intimate', 'Big pawty', 'First birthday', 'Adoption day']
    },
    'recommend': {
      text: '✨ Based on thousands of happy celebrations, here are my top picks:\n\nMost Popular:\n1. Dog Cake Party Box (₹999) - 5⭐ rated\n2. Pawsome 2.0 (₹699) - Customer favorite\n3. Woof Dognuts (₹450) - Perfect for sharing\n\nPremium Options:\n• Custom Breed Cake (₹950+)\n• Floral Fido with decoration (₹649)\n\nWant me to suggest based on your dog\'s size or preferences?',
      suggestions: ['Small dog', 'Large dog', 'Multiple dogs', 'Budget-friendly']
    },
    'vet': {
      text: '🏥 Here are trusted veterinarians in your area:\n\nBangalore:\n• Cessna Lifeline - JP Nagar (080-2659-4444)\n• VetCare Hospital - Indiranagar (080-4112-5566)\n• Bangalore Pet Hospital - Koramangala (080-4178-9999)\n\nMumbai:\n• Bai Sakarbai Dinshaw Petit Hospital - Parel (022-2416-1460)\n• BSPCA Animal Hospital - Parel (022-2413-8485)\n• PetCare Clinic - Bandra (022-2640-3366)\n\nGurgaon:\n• The Pet Clinic - Sector 51 (0124-423-5555)\n• Dogtors Veterinary Clinic - DLF Phase 3 (098-1044-4567)\n\nWould you like more details about any specific clinic?',
      suggestions: ['Tell me more', 'Emergency vet', 'Specialist needed', 'Go back']
    },
    'grooming': {
      text: '✂️ Top-rated professional groomers:\n\nBangalore:\n• Heads Up For Tails - Multiple locations\n  📞 080-4112-3344\n• Fur Ball Story - HSR Layout\n  📞 080-4178-5566\n• Pawfect Grooming - Whitefield\n  📞 098-8077-1122\n\nMumbai:\n• The Pets Workshop - Andheri, Bandra\n  📞 022-6741-8899\n• Bark N Bath - Multiple locations\n  📞 098-2088-7766\n• Furry Tails - Juhu\n  📞 022-2660-5544\n\nGurgaon:\n• Doggy Style - Sector 29\n  📞 0124-402-3344\n• Pampered Pets - Golf Course Road\n  📞 098-1166-7788\n\nServices include: Full grooming, spa, nail trimming, dental care\n\nNeed help booking?',
      suggestions: ['Show prices', 'Book appointment', 'Mobile grooming', 'Go back']
    },
    'photographer': {
      text: '📸 Professional pet photographers for your special moments:\n\nBangalore:\n• Pawtraits by Nikita - ₹8,000-15,000\n  📱 098-8044-5566 | Instagram: @pawtraits_blr\n• The Dog Studio - ₹10,000-20,000\n  📱 080-4112-7788\n\nMumbai:\n• Woofster Photography - ₹12,000-25,000\n  📱 098-2077-8899 | Instagram: @woofster_mumbai\n• Paws & Claws Studio - ₹9,000-18,000\n  📱 022-2640-5566\n\nGurgaon:\n• Pet Portraits India - ₹10,000-22,000\n  📱 098-1133-6677\n\nPackages include: Birthday shoots, family portraits, outdoor sessions\n\nShall I help you choose?',
      suggestions: ['Compare packages', 'See portfolios', 'Book session', 'Go back']
    },
    'petstore': {
      text: '🏪 Premium pet stores near you:\n\nBangalore:\n• Heads Up For Tails - Indiranagar, HSR, Whitefield\n• Just Dogs - Cunningham Road\n• Wiggles - Multiple locations\n\nMumbai:\n• Pets World - Bandra, Andheri\n• The Pet Shop - Multiple locations  \n• Fur Ball Story - Lokhandwala\n\nGurgaon:\n• Whiskers N Paws - Cyber Hub\n• Pet Fed - DLF Phase 2\n• Zigly - Multiple locations\n\nThey offer: Premium food, toys, accessories, grooming products\n\nLooking for something specific?',
      suggestions: ['Food brands', 'Toys & accessories', 'Store locations', 'Go back']
    },
    'default': {
      text: 'I\'m here to help with:\n\n🎂 Cake Selection - Find the perfect cake\n🎉 Party Planning - Celebration ideas & tips\n🥗 Dietary Needs - Allergies & special requirements\n💝 Gift Ideas - Surprise your pup\n📍 Referrals - Vet, grooming, pet stores\n\nWhat would you like to know?',
      suggestions: ['Cake recommendations', 'Plan a party', 'Dietary help', 'Local referrals']
    }
  };

  const getResponse = (userMessage) => {
    const msg = userMessage.toLowerCase();
    
    if (msg.includes('birthday') || msg.includes('bday') || msg.includes('celebration')) {
      return celebrationResponses.birthday;
    } else if (msg.includes('cake') || msg.includes('recommend') || msg.includes('suggest')) {
      return celebrationResponses.cake;
    } else if (msg.includes('allerg') || msg.includes('dietary') || msg.includes('grain') || msg.includes('restrict')) {
      return celebrationResponses.dietary;
    } else if (msg.includes('party') || msg.includes('event') || msg.includes('pawty')) {
      return celebrationResponses.party;
    } else if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
      return {
        text: '👋 Hello! I\'m Mira, your personal Pet Celebration Concierge! I\'m here to make your pup\'s special day unforgettable. How can I help you today?',
        suggestions: ['Plan birthday', 'Recommend cake', 'Party ideas', 'Dietary needs']
      };
    } else if (msg.includes('referral') || msg.includes('vet') || msg.includes('grooming') || msg.includes('recommend')) {
      return {
        text: '📍 I can help you find trusted pet services in your area!\n\n**Available Referrals:**\n• 🏥 Veterinarians (Bangalore, Mumbai, Gurgaon)\n• ✂️ Professional Groomers\n• 🏪 Premium Pet Stores\n• 📸 Pet Photographers\n• 🏨 Pet-friendly Hotels\n\nWhich service are you looking for?',
        suggestions: ['Vet nearby', 'Grooming salon', 'Pet photographer', 'Pet store']
      };
    }
    
    return celebrationResponses.default;
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

    // Simulate AI thinking
    setTimeout(() => {
      const response = getResponse(message);
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: response.text,
        suggestions: response.suggestions
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
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
                  <h3 className="font-bold text-lg">Mira AI</h3>
                  <p className="text-xs text-white/80">Pet Celebration Concierge</p>
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
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.type === 'user'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                        : 'bg-white shadow-md text-gray-800'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line leading-relaxed">{message.text}</p>
                  </div>
                </div>
                {message.suggestions && (
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
                placeholder="Ask Mira anything..."
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