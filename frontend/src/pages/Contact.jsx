import React, { useState } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Phone, Mail, MapPin, Clock, MessageCircle, Send, CheckCircle } from 'lucide-react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // In production, this would submit to an API
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
            Contact Us
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Have questions? We'd love to hear from you! Reach out and we'll respond as soon as we can.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-8">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Phone className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Call Us</h3>
                  <p className="text-gray-600">9739982582</p>
                  <p className="text-gray-600">9663185747</p>
                  <p className="text-sm text-gray-500 mt-1">Mon-Sun: 10AM - 8PM</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <MessageCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">WhatsApp</h3>
                  <p className="text-gray-600">+91 96631 85747</p>
                  <a 
                    href="https://wa.me/919663185747?text=Hi! I have a question about The Doggy Bakery"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-green-600 font-medium mt-2 hover:underline"
                  >
                    Chat Now <Send className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Email Us</h3>
                  <p className="text-gray-600">woof@thedoggybakery.in</p>
                  <p className="text-sm text-gray-500 mt-1">We reply within 24 hours</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-pink-100 rounded-lg">
                  <MapPin className="w-6 h-6 text-pink-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Our Locations</h3>
                  <div className="space-y-2 text-gray-600">
                    <p><strong>Bengaluru:</strong> Indiranagar, Koramangala</p>
                    <p><strong>Mumbai:</strong> Bandra, Andheri</p>
                    <p><strong>Gurgaon:</strong> DLF Phase 1</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow bg-gradient-to-r from-purple-600 to-pink-600 text-white">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold mb-2">Business Hours</h3>
                  <p>Monday - Sunday</p>
                  <p className="text-2xl font-bold">10:00 AM - 8:00 PM</p>
                  <p className="text-sm opacity-80 mt-1">Same-day delivery orders accepted until 2PM</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Contact Form */}
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send Us a Message</h2>
            
            {submitted ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                <p className="text-gray-600">Thank you for reaching out. We'll get back to you soon!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Name *</label>
                    <Input
                      required
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <Input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                    <select
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      value={formData.subject}
                      onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    >
                      <option value="">Select a subject</option>
                      <option value="order">Order Inquiry</option>
                      <option value="custom">Custom Cake Request</option>
                      <option value="delivery">Delivery Question</option>
                      <option value="feedback">Feedback</option>
                      <option value="partnership">Business Partnership</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
                  <textarea
                    rows={5}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="How can we help you?"
                  />
                </div>

                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 py-3">
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Contact;
