import React, { useState } from 'react';
import { 
  Sparkles, MessageCircle, Gift, Search, Calendar, 
  Heart, Star, ChevronRight, PawPrint, Zap, Clock,
  MapPin, ShoppingBag, HelpCircle
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

// Import the chat component
import MiraChat from './MiraEmbed';

const MiraLandingEmbed = () => {
  const [showChat, setShowChat] = useState(false);

  const features = [
    {
      icon: Search,
      title: "Find Perfect Treats",
      description: "Tell Mira about your pet and get personalized treat recommendations",
      color: "text-purple-600",
      bg: "bg-purple-100"
    },
    {
      icon: Gift,
      title: "Gift Ideas",
      description: "Get curated gift suggestions for any occasion - birthdays, gotcha days & more",
      color: "text-pink-600",
      bg: "bg-pink-100"
    },
    {
      icon: Calendar,
      title: "Plan Celebrations",
      description: "Let Mira help you plan the perfect party for your furry friend",
      color: "text-amber-600",
      bg: "bg-amber-100"
    },
    {
      icon: HelpCircle,
      title: "Answer Questions",
      description: "Ask about ingredients, allergies, delivery, or anything else!",
      color: "text-blue-600",
      bg: "bg-blue-100"
    },
    {
      icon: MapPin,
      title: "Delivery Info",
      description: "Check if we deliver to your area and estimated delivery times",
      color: "text-green-600",
      bg: "bg-green-100"
    },
    {
      icon: ShoppingBag,
      title: "Order Assistance",
      description: "Get help with your order, tracking, or any shopping queries",
      color: "text-orange-600",
      bg: "bg-orange-100"
    }
  ];

  const testimonials = [
    {
      text: "Mira helped me find the perfect allergy-friendly cake for my pup!",
      author: "Priya S.",
      pet: "Bruno's Mom 🐕"
    },
    {
      text: "Love how Mira remembers my preferences. Best shopping assistant!",
      author: "Rahul M.",
      pet: "Cookie's Dad 🐾"
    },
    {
      text: "Got amazing birthday party ideas from Mira. Highly recommend!",
      author: "Sneha K.",
      pet: "Simba's Mom 🦁"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Left: Content */}
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 mb-4">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">AI-Powered Pet Concierge</span>
              </div>
              
              <h1 className="text-3xl md:text-5xl font-black mb-4">
                Meet Mira 🐾
              </h1>
              <p className="text-lg md:text-xl text-purple-100 mb-6 max-w-lg">
                Your personal pet shopping assistant! Ask anything about treats, 
                cakes, gifts, or get help planning your fur baby's next celebration.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <Button 
                  onClick={() => setShowChat(true)}
                  className="bg-white text-purple-600 hover:bg-purple-50 font-semibold px-6 py-3 text-lg"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Chat with Mira
                </Button>
                <a href="https://thedoggybakery.com/collections/all" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="border-white/50 text-white hover:bg-white/10 px-6 py-3">
                    Browse Shop
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </a>
              </div>
            </div>
            
            {/* Right: Decorative */}
            <div className="hidden md:block">
              <div className="w-48 h-48 bg-white/10 rounded-full flex items-center justify-center">
                <div className="w-36 h-36 bg-white/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-16 h-16 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            What Can Mira Help You With?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Mira is trained on everything about The Doggy Bakery - from our 400+ products 
            to delivery areas, ingredients, and more!
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, idx) => (
            <Card 
              key={idx} 
              className="p-5 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setShowChat(true)}
            >
              <div className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center mb-4`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Chat Section */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 md:p-8">
          <div className="flex flex-col lg:flex-row gap-8 items-center">
            {/* Left: CTA */}
            <div className="flex-1 text-center lg:text-left">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                Ready to Chat? 💬
              </h2>
              <p className="text-gray-600 mb-4">
                Mira is available 24/7 to help you find the perfect treats, 
                answer questions, and make your pet shopping experience delightful!
              </p>
              <div className="flex items-center gap-4 justify-center lg:justify-start text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span>Instant Replies</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-green-500" />
                  <span>24/7 Available</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4 text-pink-500" />
                  <span>Pet Expert</span>
                </div>
              </div>
            </div>
            
            {/* Right: Chat Embed */}
            <div className="w-full lg:w-[400px] h-[500px] bg-white rounded-2xl shadow-xl overflow-hidden">
              <MiraChat />
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          Pet Parents Love Mira 💜
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((testimonial, idx) => (
            <Card key={idx} className="p-5">
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">"{testimonial.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <PawPrint className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{testimonial.author}</p>
                  <p className="text-xs text-gray-500">{testimonial.pet}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Start Chatting with Mira Now! 🐾
          </h2>
          <p className="text-purple-100 mb-6">
            No app download needed. Just click and start getting personalized pet recommendations.
          </p>
          <Button 
            onClick={() => {
              setShowChat(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="bg-white text-purple-600 hover:bg-purple-50 font-semibold px-8 py-3 text-lg"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Chat with Mira
          </Button>
        </div>
      </div>

      {/* Floating Chat Button (Mobile) */}
      {!showChat && (
        <button
          onClick={() => setShowChat(true)}
          className="fixed bottom-6 right-6 lg:hidden bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-full shadow-lg z-50"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Full Screen Chat Modal (Mobile) */}
      {showChat && (
        <div className="fixed inset-0 z-50 lg:hidden bg-white">
          <div className="h-full flex flex-col">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6" />
                <span className="font-bold">Mira - Pet Concierge</span>
              </div>
              <button 
                onClick={() => setShowChat(false)}
                className="text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="flex-1">
              <MiraChat />
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="bg-gray-900 text-white py-6">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">
            🐾 Mira is powered by The Doggy Bakery | India's #1 Dog Bakery
          </p>
        </div>
      </div>
    </div>
  );
};

export default MiraLandingEmbed;
