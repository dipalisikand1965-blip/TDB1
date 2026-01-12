import React from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Stethoscope, Plane, Scissors, Camera, Home, GraduationCap, Sparkles, AlertCircle } from 'lucide-react';

const MiraConcierge = () => {
  const handleServiceClick = (mode) => {
    // Dispatch event to open Mira AI with specific context
    const event = new CustomEvent('openMiraAI', { detail: { mode } });
    window.dispatchEvent(event);
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
      <div className="bg-gradient-to-r from-purple-700 via-pink-600 to-purple-800 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-5 h-5 text-yellow-300" />
            <span className="font-semibold text-sm tracking-wide uppercase">The Doggy Bakery Concierge®</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Your 24/7 Pet Lifestyle Assistant
          </h1>
          <p className="text-xl md:text-2xl text-purple-100 max-w-2xl mx-auto mb-10">
            "Everything pet, anytime, anywhere."<br/>
            We connect you to the right suppliers, services, and solutions.
          </p>
          <Button 
            onClick={() => handleServiceClick('general')}
            size="lg" 
            className="bg-white text-purple-700 hover:bg-purple-50 text-lg px-8 py-6 rounded-full shadow-xl font-bold transition-all transform hover:scale-105"
          >
            Ask Mira Anything
          </Button>
        </div>
      </div>

      {/* Services Grid */}
      <div className="max-w-7xl mx-auto px-4 -mt-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card 
              key={service.id} 
              className={`cursor-pointer transition-all duration-300 transform hover:-translate-y-2 hover:shadow-xl border-2 ${service.color}`}
              onClick={() => handleServiceClick(service.id)}
            >
              <CardContent className="p-8 flex flex-col items-center text-center">
                <div className="mb-6 p-4 bg-white rounded-full shadow-sm">
                  {service.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{service.title}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {service.desc}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Info Section */}
      <div className="max-w-4xl mx-auto mt-20 px-4 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-12">How Mira Concierge Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
            <h3 className="font-bold text-lg mb-2">Tell Us Your Need</h3>
            <p className="text-gray-600">Whether it's a vet, a sitter, or travel rules, just ask Mira.</p>
          </div>
          <div>
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
            <h3 className="font-bold text-lg mb-2">We Scan Our Network</h3>
            <p className="text-gray-600">Mira instantly searches our curated database of verified partners.</p>
          </div>
          <div>
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
            <h3 className="font-bold text-lg mb-2">Get Connected</h3>
            <p className="text-gray-600">Receive contact details, booking links, or direct advice instantly.</p>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="max-w-3xl mx-auto mt-20 px-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex gap-4">
          <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
          <div className="text-sm text-amber-800">
            <p className="font-bold mb-1">Important Disclaimer</p>
            <p>
              Mira Concierge is an AI assistant designed to connect you with services and provide general lifestyle advice. 
              <strong> Mira does not provide medical diagnoses or treatments.</strong> For any medical concerns, we will strictly refer you to qualified veterinarians near you. 
              We also do not assist with any illegal activities or requests violating local animal welfare laws.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiraConcierge;
