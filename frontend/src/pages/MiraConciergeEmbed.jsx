import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { 
  Stethoscope, Plane, Scissors, Camera, Home, GraduationCap, 
  Sparkles, AlertCircle, Send, Loader2, PawPrint, MessageCircle
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const MiraConciergeEmbed = () => {
  // Chat state
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Woof! 🐾 I'm Mira, your Concierge®! I can help you find vets, groomers, pet sitters, travel info, and much more. What do you need help with today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [sessionId] = useState(() => `mira-concierge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (messageText) => {
    const userMessage = messageText || input.trim();
    if (!userMessage || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/mira/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          session_id: sessionId,
          source: 'shopify_concierge_embed'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: "Oops! I'm having trouble right now. Please try again! 🐕" 
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Woof! Something went wrong. Please try again! 🐾" 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  const handleServiceClick = (service) => {
    const prompts = {
      vet: "I need help finding a veterinarian near me",
      travel: "I need information about pet travel and documentation",
      grooming: "I'm looking for a grooming salon for my dog",
      boarding: "I need to find pet boarding or pet sitting services",
      photography: "I want to book a professional pet photography session",
      training: "I'm looking for dog training classes or a behaviourist"
    };
    sendMessage(prompts[service] || "I need help with pet services");
  };

  const services = [
    {
      id: 'vet',
      title: 'Vet Connect',
      icon: <Stethoscope className="w-8 h-8 text-blue-500" />,
      desc: 'Find trusted veterinarians and emergency clinics near you.',
      color: 'bg-blue-50 hover:bg-blue-100 border-blue-200'
    },
    {
      id: 'travel',
      title: 'Travel & Docs',
      icon: <Plane className="w-8 h-8 text-sky-500" />,
      desc: 'Pet passports, relocation agents, and travel documentation rules.',
      color: 'bg-sky-50 hover:bg-sky-100 border-sky-200'
    },
    {
      id: 'grooming',
      title: 'Grooming & Spa',
      icon: <Scissors className="w-8 h-8 text-pink-500" />,
      desc: 'Book hygiene sessions and spa days for your pampered pup.',
      color: 'bg-pink-50 hover:bg-pink-100 border-pink-200'
    },
    {
      id: 'boarding',
      title: 'Boarding & Sitting',
      icon: <Home className="w-8 h-8 text-amber-500" />,
      desc: 'Safe, loving stays for when you have to be away.',
      color: 'bg-amber-50 hover:bg-amber-100 border-amber-200'
    },
    {
      id: 'photography',
      title: 'Pet Photography',
      icon: <Camera className="w-8 h-8 text-purple-500" />,
      desc: 'Capture timeless memories with professional pet photographers.',
      color: 'bg-purple-50 hover:bg-purple-100 border-purple-200'
    },
    {
      id: 'training',
      title: 'Training & School',
      icon: <GraduationCap className="w-8 h-8 text-green-500" />,
      desc: 'Behaviourists and training schools for a well-mannered companion.',
      color: 'bg-green-50 hover:bg-green-100 border-green-200'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 pb-20">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-700 via-pink-600 to-purple-800 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-5 h-5 text-yellow-300" />
            <span className="font-semibold text-sm tracking-wide uppercase">The Doggy Bakery Concierge®</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Your 24/7 Pet Lifestyle Assistant
          </h1>
          <p className="text-lg md:text-xl text-purple-100 max-w-2xl mx-auto">
            "Everything pet, anytime, anywhere."<br/>
            We connect you to the right suppliers, services, and solutions.
          </p>
        </div>
      </div>

      {/* Services Grid */}
      <div className="max-w-7xl mx-auto px-4 -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <Card 
              key={service.id} 
              className={`cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg border-2 ${service.color}`}
              onClick={() => handleServiceClick(service.id)}
            >
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="mb-4 p-3 bg-white rounded-full shadow-sm">
                  {service.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{service.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {service.desc}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Chat Section */}
      <div className="max-w-4xl mx-auto mt-12 px-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            <MessageCircle className="w-6 h-6 inline mr-2 text-purple-600" />
            Chat with Mira
          </h2>
          <p className="text-gray-600">Click a service above or ask anything below</p>
        </div>

        <Card className="overflow-hidden shadow-xl border-2 border-purple-200">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold">Mira</h3>
              <p className="text-xs text-purple-100">Concierge® • Online 24/7</p>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-xs">Active</span>
            </div>
          </div>

          {/* Messages */}
          <div className="h-[400px] overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white rounded-br-md'
                      : 'bg-white shadow-sm border border-gray-100 rounded-bl-md'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-1">
                      <PawPrint className="w-3 h-3 text-purple-500" />
                      <span className="text-xs font-semibold text-purple-600">Mira</span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white shadow-sm border border-gray-100 p-3 rounded-2xl rounded-bl-md">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                    <span className="text-sm text-gray-500">Mira is typing...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t bg-white">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Mira anything about pet services..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                disabled={!input.trim() || isLoading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>

      {/* How it Works */}
      <div className="max-w-4xl mx-auto mt-16 px-4 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">How Your Concierge® Works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
            <h3 className="font-bold text-lg mb-2">Tell Us Your Need</h3>
            <p className="text-gray-600 text-sm">Whether it's a vet, a sitter, or travel rules, just ask Mira.</p>
          </div>
          <div>
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
            <h3 className="font-bold text-lg mb-2">We Scan Our Network</h3>
            <p className="text-gray-600 text-sm">Mira instantly searches our curated database of verified partners.</p>
          </div>
          <div>
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
            <h3 className="font-bold text-lg mb-2">Get Connected</h3>
            <p className="text-gray-600 text-sm">Receive contact details, booking links, or direct advice instantly.</p>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="max-w-3xl mx-auto mt-12 px-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex gap-4">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-bold mb-1">Important Disclaimer</p>
            <p>
              Your Concierge® is an AI assistant designed to connect you with services and provide general lifestyle advice. 
              <strong> Mira does not provide medical diagnoses or treatments.</strong> For any medical concerns, we will strictly refer you to qualified veterinarians.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiraConciergeEmbed;
