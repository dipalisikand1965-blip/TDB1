import React, { useState } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Store, TrendingUp, Users, Heart, CheckCircle, MapPin, Phone, Mail, Building2, Sparkles } from 'lucide-react';

const benefits = [
  {
    icon: Store,
    title: 'Established Brand',
    description: 'Partner with a trusted brand loved by 45,000+ pet parents across India.'
  },
  {
    icon: TrendingUp,
    title: 'Growing Market',
    description: 'Pet industry is booming! Be part of the fastest-growing segment.'
  },
  {
    icon: Users,
    title: 'Full Support',
    description: 'Complete training, marketing support, and operational guidance.'
  },
  {
    icon: Heart,
    title: 'Passion Project',
    description: 'Turn your love for pets into a profitable business.'
  }
];

const steps = [
  { step: 1, title: 'Apply Online', description: 'Fill out our franchise inquiry form' },
  { step: 2, title: 'Discussion', description: 'Our team will contact you for detailed discussion' },
  { step: 3, title: 'Location Scout', description: 'We help you find the perfect location' },
  { step: 4, title: 'Training', description: 'Comprehensive training program for you and your team' },
  { step: 5, title: 'Launch', description: 'Grand opening with marketing support' }
];

const Franchise = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    investment: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const API_URL = process.env.REACT_APP_BACKEND_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const res = await fetch(`${API_URL}/api/franchise/inquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setSubmitted(true);
      }
    } catch (error) {
      console.error('Failed to submit inquiry:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-r from-purple-600 to-pink-600 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-40 h-40 bg-white rounded-full"></div>
          <div className="absolute bottom-10 right-20 w-60 h-60 bg-white rounded-full"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-white/20 rounded-full mb-6">
              <Sparkles className="w-5 h-5 mr-2" />
              <span className="font-semibold">Franchise Opportunity</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-6">
              Own A Doggy Bakery
            </h1>
            <p className="text-xl md:text-2xl max-w-2xl mx-auto opacity-90">
              Join India's leading pet bakery brand and be part of the pawsome journey!
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Why Partner With Us?
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, idx) => (
              <Card key={idx} className="p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600 text-sm">{benefit.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl font-black">45K+</p>
              <p className="text-purple-200">Happy Customers</p>
            </div>
            <div>
              <p className="text-4xl font-black">3</p>
              <p className="text-purple-200">Cities & Growing</p>
            </div>
            <div>
              <p className="text-4xl font-black">500+</p>
              <p className="text-purple-200">Products</p>
            </div>
            <div>
              <p className="text-4xl font-black">4.9</p>
              <p className="text-purple-200">Average Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            How It Works
          </h2>
          
          <div className="flex flex-col md:flex-row justify-center items-start gap-4 md:gap-8">
            {steps.map((step, idx) => (
              <div key={idx} className="flex-1 text-center relative">
                <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  {step.step}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.description}</p>
                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-[60%] w-[80%] h-0.5 bg-purple-200"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Inquiry Form */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="p-8 md:p-12">
            <div className="text-center mb-8">
              <Building2 className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Franchise Inquiry</h2>
              <p className="text-gray-600">Fill out the form and we'll get back to you within 48 hours</p>
            </div>

            {submitted ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Thank You!</h3>
                <p className="text-gray-600">We've received your inquiry. Our team will contact you soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                    <Input
                      required
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <Input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                    <Input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preferred City *</label>
                    <Input
                      required
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="City you want to open in"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Investment Capacity</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    value={formData.investment}
                    onChange={(e) => setFormData(prev => ({ ...prev, investment: e.target.value }))}
                  >
                    <option value="">Select range</option>
                    <option value="5-10">₹5 - 10 Lakhs</option>
                    <option value="10-20">₹10 - 20 Lakhs</option>
                    <option value="20-50">₹20 - 50 Lakhs</option>
                    <option value="50+">₹50 Lakhs+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Tell us about yourself and your interest in the franchise..."
                  />
                </div>
                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 py-3">
                  Submit Inquiry
                </Button>
              </form>
            )}
          </Card>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-12 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-center items-center gap-8 text-center md:text-left">
            <div className="flex items-center gap-3">
              <Mail className="w-6 h-6 text-purple-400" />
              <span>franchise@thedoggybakery.in</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-6 h-6 text-purple-400" />
              <span>+91 96631 85747</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-6 h-6 text-purple-400" />
              <span>Bengaluru, Mumbai, Gurgaon</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Franchise;
