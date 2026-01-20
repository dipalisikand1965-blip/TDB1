import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Sparkles, MessageCircle, Gift, Search, Calendar, 
  Heart, Star, ChevronRight, PawPrint, Zap, Clock,
  MapPin, ShoppingBag, HelpCircle, Send, Loader2,
  Cake, Truck, Shield, Award
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { API_URL } from '../utils/api';


const MiraPage = () => {
  // Chat state
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Woof! 🐾 I'm Mira, your Concierge®! I can help you find perfect treats, plan celebrations, check delivery, and more. What can I help you with today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [sessionId] = useState(() => `mira-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
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
          source: 'mira_page'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: "Oops! I'm having a little trouble right now. Please try again! 🐕" 
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Woof! Something went wrong. Please refresh and try again! 🐾" 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question) => {
    setInput(question);
    setTimeout(() => {
      sendMessage();
    }, 100);
  };

  const capabilities = [
    {
      icon: Search,
      title: "Product Recommendations",
      description: "Tell Mira about your pet's preferences, allergies, or occasion - she'll suggest the perfect treats and cakes.",
      examples: ["What treats are good for puppies?", "My dog is allergic to chicken", "Best cake for a 5-year-old Labrador"]
    },
    {
      icon: Gift,
      title: "Gift Ideas & Occasions",
      description: "Planning a birthday, gotcha day, or just want to spoil your furry friend? Mira has you covered.",
      examples: ["Gift ideas for a dog lover", "Birthday party package for my pug", "Gotcha day celebration ideas"]
    },
    {
      icon: Cake,
      title: "Custom Cake Guidance",
      description: "Need help designing the perfect cake? Mira can guide you through shapes, flavors, and customizations.",
      examples: ["How do I order a custom cake?", "What cake shapes do you have?", "Can I add my dog's photo on a cake?"]
    },
    {
      icon: Truck,
      title: "Delivery Information",
      description: "Check if we deliver to your area, delivery times, and shipping policies.",
      examples: ["Do you deliver to Delhi?", "How long does delivery take?", "Same day delivery available?"]
    },
    {
      icon: Shield,
      title: "Ingredients & Safety",
      description: "Ask about ingredients, allergens, nutritional info, and what's safe for your pet.",
      examples: ["Are your treats grain-free?", "What's in the peanut butter cake?", "Is it safe for diabetic dogs?"]
    },
    {
      icon: HelpCircle,
      title: "Order Support",
      description: "Questions about your order, returns, or any shopping queries - Mira is here to help.",
      examples: ["How do I track my order?", "Can I modify my order?", "What's your return policy?"]
    }
  ];

  const stats = [
    { value: "45,000+", label: "Happy Pet Parents" },
    { value: "400+", label: "Products" },
    { value: "24/7", label: "Available" },
    { value: "3 Cities", label: "Same-Day Delivery" }
  ];

  return (
    <>
      <Helmet>
        <title>Mira - AI Pet Concierge® | The Doggy Company</title>
        <meta name="description" content="Meet Mira, your AI-powered pet shopping assistant. Get personalized treat recommendations, plan celebrations, and get instant answers 24/7." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-purple-600 via-pink-600 to-purple-700 text-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-2 mb-6">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-medium">AI-Powered Concierge®</span>
                </div>
                
                <h1 className="text-4xl md:text-6xl font-black mb-6">
                  Meet Mira 🐾
                </h1>
                <p className="text-xl text-purple-100 mb-8 max-w-xl">
                  Your personal pet shopping assistant! Get instant recommendations, 
                  plan celebrations, and find the perfect treats for your furry friend.
                </p>
                
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-purple-200">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                  <a href="#chat-section">
                    <Button className="bg-white text-purple-600 hover:bg-purple-50 font-semibold px-6 py-3 text-lg">
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Start Chatting
                    </Button>
                  </a>
                </div>
              </div>
              
              {/* Right: Mira Illustration */}
              <div className="hidden lg:flex justify-center">
                <div className="relative">
                  <div className="w-80 h-80 bg-white/10 rounded-full flex items-center justify-center">
                    <div className="w-64 h-64 bg-white/15 rounded-full flex items-center justify-center">
                      <div className="w-48 h-48 bg-white/20 rounded-full flex items-center justify-center">
                        <Sparkles className="w-20 h-20 text-white" />
                      </div>
                    </div>
                  </div>
                  {/* Floating badges */}
                  <div className="absolute top-4 right-0 bg-white text-purple-600 rounded-full px-3 py-1 text-sm font-semibold shadow-lg">
                    🎂 Cakes
                  </div>
                  <div className="absolute bottom-4 left-0 bg-white text-pink-600 rounded-full px-3 py-1 text-sm font-semibold shadow-lg">
                    🍪 Treats
                  </div>
                  <div className="absolute top-1/2 -right-4 bg-white text-amber-600 rounded-full px-3 py-1 text-sm font-semibold shadow-lg">
                    🎁 Gifts
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What Mira Can Do */}
        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                How Mira Can Help You
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Mira is trained on everything about The Doggy Bakery - from our 400+ products 
                to ingredients, delivery areas, and pet care tips!
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {capabilities.map((cap, idx) => (
                <Card key={idx} className="p-6 hover:shadow-xl transition-all duration-300 group">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <cap.icon className="w-7 h-7 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{cap.title}</h3>
                  <p className="text-gray-600 mb-4">{cap.description}</p>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-purple-600 uppercase">Try asking:</p>
                    {cap.examples.map((ex, i) => (
                      <button
                        key={i}
                        onClick={() => handleQuickQuestion(ex)}
                        className="block w-full text-left text-sm text-gray-500 hover:text-purple-600 hover:bg-purple-50 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        "{ex}"
                      </button>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Chat Section */}
        <section id="chat-section" className="py-16 bg-gradient-to-r from-purple-100 via-pink-50 to-purple-100">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-8 items-start">
              {/* Left: Info */}
              <div className="lg:sticky lg:top-24">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Chat with Mira Now 💬
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  Ask anything! Mira is available 24/7 to help you find the perfect 
                  treats, answer questions, and make your pet shopping experience delightful.
                </p>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Zap className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Instant Responses</p>
                      <p className="text-sm text-gray-500">No waiting, get answers immediately</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Award className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Expert Knowledge</p>
                      <p className="text-sm text-gray-500">Trained on all our products & pet care</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                      <Heart className="w-5 h-5 text-pink-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Personalized Help</p>
                      <p className="text-sm text-gray-500">Recommendations based on your pet's needs</p>
                    </div>
                  </div>
                </div>

                {/* Quick Questions */}
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Popular Questions:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Best birthday cake?",
                      "Delivery to Mumbai?",
                      "Grain-free options?",
                      "Custom cake price?"
                    ].map((q, i) => (
                      <button
                        key={i}
                        onClick={() => handleQuickQuestion(q)}
                        className="text-sm bg-purple-50 hover:bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Right: Chat Widget */}
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden h-[600px] flex flex-col">
                {/* Chat Header */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold">Mira</h3>
                    <p className="text-xs text-purple-100">Concierge® • Online</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    <span className="text-xs">Active</span>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-2xl ${
                          msg.role === 'user'
                            ? 'bg-purple-600 text-white rounded-br-md'
                            : 'bg-gray-100 text-gray-800 rounded-bl-md'
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
                      <div className="bg-gray-100 p-3 rounded-2xl rounded-bl-md">
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
                <div className="p-4 border-t bg-gray-50">
                  <form onSubmit={sendMessage} className="flex gap-2">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask Mira anything..."
                      className="flex-1 bg-white"
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
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Pet Parents Love Mira 💜
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  text: "Mira helped me find the perfect allergy-friendly cake for Bruno's birthday. So helpful!",
                  author: "Priya S.",
                  pet: "Bruno's Mom"
                },
                {
                  text: "I was confused about which treats to buy. Mira asked about my dog's preferences and gave amazing suggestions!",
                  author: "Rahul M.",
                  pet: "Cookie's Dad"
                },
                {
                  text: "24/7 availability is a game changer. Got my questions answered at midnight before the party!",
                  author: "Sneha K.",
                  pet: "Simba's Mom"
                }
              ].map((t, idx) => (
                <Card key={idx} className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 italic">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <PawPrint className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{t.author}</p>
                      <p className="text-sm text-gray-500">{t.pet} 🐕</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-12">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Find the Perfect Treats? 🐾
            </h2>
            <p className="text-purple-100 mb-6">
              Mira is waiting to help you! Start chatting now or browse our shop.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#chat-section">
                <Button className="bg-white text-purple-600 hover:bg-purple-50 font-semibold px-6 py-3">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Chat with Mira
                </Button>
              </a>
              <a href="/cakes">
                <Button variant="outline" className="border-white text-white hover:bg-white/10 px-6 py-3">
                  Browse Cakes
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </a>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default MiraPage;
