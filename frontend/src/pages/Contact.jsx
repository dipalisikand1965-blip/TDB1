import React, { useState } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Phone, Mail, MapPin, Clock, MessageCircle, Send, CheckCircle, Store, Truck, Navigation } from 'lucide-react';
import { API_URL } from '../utils/api';

// Store Locations with full details
const STORES = [
  {
    city: 'Mumbai',
    name: 'Mumbai Store',
    address: 'Shop 9, off Yari Road, Jeet Nagar, Versova, Andheri West, Mumbai, Maharashtra 400061',
    phone: '9663185747',
    mapUrl: 'https://maps.google.com/?q=Shop+9+off+Yari+Road+Versova+Andheri+West+Mumbai+400061',
    color: 'from-orange-500 to-red-500'
  },
  {
    city: 'Gurugram',
    name: 'Gurugram Store',
    address: 'Ground Floor, Wazirabad Rd, Wazirabad, Sector 52, Gurugram, Haryana 122003',
    phone: '9739982582',
    mapUrl: 'https://maps.google.com/?q=Ground+Floor+Wazirabad+Rd+Sector+52+Gurugram+122003',
    color: 'from-blue-500 to-indigo-500'
  },
  {
    city: 'Bangalore',
    name: 'Bangalore Store',
    address: '147, 8th Main Rd, 3rd Block, Koramangala 3 Block, Koramangala, Bengaluru, Karnataka 560034',
    phone: '9739982582',
    mapUrl: 'https://maps.google.com/?q=147+8th+Main+Rd+Koramangala+Bengaluru+560034',
    color: 'from-purple-500 to-pink-500'
  }
];

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Create a ticket for the contact form submission
      const response = await fetch(`${API_URL}/api/tickets/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            city: formData.city
          },
          category: 'shop',
          sub_category: 'contact_form',
          urgency: 'medium',
          source: 'website_contact',
          description: `**Subject:** ${formData.subject}\n\n**Message:**\n${formData.message}\n\n**City:** ${formData.city || 'Not specified'}`
        })
      });
      
      if (response.ok) {
        setSubmitted(true);
      }
    } catch (error) {
      console.error('Error submitting contact form:', error);
    }
    
    setSubmitting(false);
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

        {/* Store Locations - Featured Section */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
              <Store className="w-6 h-6 text-purple-600" />
              Store Pickup Locations
            </h2>
            <p className="text-gray-600 mt-2">Visit us for same-day cake pickups!</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {STORES.map((store, idx) => (
              <Card key={idx} className="overflow-hidden hover:shadow-xl transition-shadow">
                <div className={`bg-gradient-to-r ${store.color} p-4 text-white`}>
                  <h3 className="text-xl font-bold">{store.city}</h3>
                  <p className="text-sm opacity-90">{store.name}</p>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-600">{store.address}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <a href={`tel:${store.phone}`} className="text-sm text-purple-600 hover:underline">
                      {store.phone}
                    </a>
                  </div>
                  <a
                    href={store.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors w-full justify-center"
                  >
                    <Navigation className="w-4 h-4" />
                    Get Directions
                  </a>
                </div>
              </Card>
            ))}
          </div>
          
          {/* Pan India Delivery Banner */}
          <Card className="mt-6 p-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Truck className="w-8 h-8" />
              <div className="text-center">
                <h3 className="text-xl font-bold">Pan-India Delivery Available!</h3>
                <p className="text-sm opacity-90">We deliver fresh cakes and treats to any city across India. Just tell us your city and address!</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-6">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Phone className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Call Us</h3>
                  <p className="text-gray-600">9739982582 (Bangalore & Gurugram)</p>
                  <p className="text-gray-600">9663185747 (Mumbai)</p>
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
                    href="https://wa.me/919663185747?text=Hi! I have a question about The Doggy Company"
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
                  <p className="text-gray-600">woof@thedoggycompany.in</p>
                  <p className="text-sm text-gray-500 mt-1">We reply within 24 hours</p>
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
                <p className="text-gray-600">Thank you for reaching out. Our Concierge® team will get back to you soon!</p>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your City *</label>
                    <Input
                      required
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Mumbai, Bangalore, Delhi..."
                    />
                  </div>
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
                    <option value="pickup">Store Pickup</option>
                    <option value="feedback">Feedback</option>
                    <option value="partnership">Business Partnership</option>
                    <option value="other">Other</option>
                  </select>
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

                <Button 
                  type="submit" 
                  className="w-full bg-purple-600 hover:bg-purple-700 py-3"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>Sending...</>
                  ) : (
                    <><Send className="w-4 h-4 mr-2" /> Send Message</>
                  )}
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
