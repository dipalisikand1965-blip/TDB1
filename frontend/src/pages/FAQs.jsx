import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Search, Sparkles } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { getApiUrl } from '../utils/api';
import Navbar from '../components/Navbar';

// Default FAQs (used if API fails or for seeding)
const defaultFaqs = [
  {
    category: 'Concierge® & Mira AI',
    icon: '✨',
    questions: [
      { q: 'What is The Doggy Company Concierge®?', a: 'Our Concierge® is your dedicated pet lifestyle assistant. Powered by Mira AI, it provides personalized recommendations, coordinates bookings across all our services, and remembers your pet\'s preferences through our Pet Soul™ technology for a truly tailored experience.' },
      { q: 'How does Mira AI help me?', a: 'Mira AI is your 24/7 Super Concierge®! She can book pet-friendly restaurants, arrange travel, schedule grooming appointments, recommend products based on your pet\'s profile, and even remind you of important dates.' },
      { q: 'What is Pet Soul™?', a: 'Pet Soul™ is our intelligent pet profile system that remembers everything about your furry friend — dietary preferences, allergies, favorite treats, health records, and more.' }
    ]
  },
  {
    category: 'Membership & Club',
    icon: '👑',
    questions: [
      { q: 'What are the membership benefits?', a: 'Members enjoy exclusive discounts, priority booking, access to VIP events, free delivery, personalized Pet Soul™ profiles, and 24/7 Mira AI Concierge® support.' },
      { q: 'How do I become a member?', a: 'Visit our Membership page and choose the tier that suits your needs. You can sign up online or through WhatsApp.' },
      { q: 'Can I cancel my membership?', a: 'Yes, memberships can be cancelled anytime. Your benefits continue until the end of your billing cycle.' }
    ]
  },
  {
    category: 'Celebrate (Cakes & Treats)',
    icon: '🎂',
    questions: [
      { q: 'Are your products safe for dogs?', a: 'Absolutely! All our celebration products are made with 100% dog-safe, human-grade ingredients. We never use sugar, salt, xylitol, chocolate, or any harmful ingredients.' },
      { q: 'What flavors do you offer?', a: 'We offer Chicken & Oats, Peanut Butter, Banana & Honey, Mutton & Veggies, and seasonal specials.' },
      { q: 'Do you deliver pan-India?', a: 'Fresh cakes are available for same-day delivery in Bangalore, Mumbai, and Gurgaon. Treats are shipped pan-India with 3-5 day delivery.' }
    ]
  },
  {
    category: 'Dine (Pet-Friendly Restaurants)',
    icon: '🍽️',
    questions: [
      { q: 'How do I book a pet-friendly restaurant?', a: 'Simply ask Mira AI or browse our Dine section. We partner with verified pet-friendly restaurants across major cities.' },
      { q: 'Do restaurants have pet menus?', a: 'Many of our partner restaurants offer special pet menus! Look for the "Pet Menu Available" badge when browsing.' }
    ]
  },
  {
    category: 'Care (Health & Grooming)',
    icon: '💊',
    questions: [
      { q: 'Do you provide vet services?', a: 'We coordinate vet appointments through our partner network. Mira AI can help you find specialists and book appointments.' },
      { q: 'How do I book grooming?', a: 'Ask Mira or browse the Care section. We partner with professional groomers for at-home and salon services.' }
    ]
  },
  {
    category: 'Orders & Delivery',
    icon: '📦',
    questions: [
      { q: 'What are your delivery timings?', a: 'We deliver between 10 AM to 8 PM. Same-day delivery is available in Bangalore, Mumbai, and Gurgaon for orders placed before 2 PM.' },
      { q: 'What is the delivery charge?', a: 'Delivery is FREE for members and for orders above ₹499 in metro cities.' },
      { q: 'Can I track my order?', a: 'Yes! Once dispatched, you\'ll receive a WhatsApp message with tracking details.' }
    ]
  },
  {
    category: 'Payments & Refunds',
    icon: '💳',
    questions: [
      { q: 'What payment methods do you accept?', a: 'We accept UPI, Credit/Debit cards, Net Banking, and Cash on Delivery (in select areas).' },
      { q: 'What is your refund policy?', a: 'Contact us within 24 hours with photos for issues. We offer replacements or refunds for genuine concerns.' }
    ]
  },
  {
    category: 'Emergency Support',
    icon: '🚨',
    questions: [
      { q: 'What emergency services do you offer?', a: 'Our Emergency pillar provides 24/7 support for lost pets, medical emergencies, and urgent coordination.' },
      { q: 'How do I report a lost pet?', a: 'Immediately contact Mira AI or use the Emergency section. We\'ll activate a lost pet alert across our network.' }
    ]
  }
];

const FAQs = () => {
  const [faqData, setFaqData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openItems, setOpenItems] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);

  // Fetch FAQs from backend
  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        // Use public endpoint, not admin endpoint
        const response = await fetch(`${getApiUrl()}/api/faqs`);
        if (response.ok) {
          const data = await response.json();
          const faqs = data.faqs || [];
          
          if (faqs.length > 0) {
            // Group FAQs by category
            const grouped = faqs.reduce((acc, faq) => {
              const category = faq.category || 'General';
              if (!acc[category]) {
                acc[category] = {
                  category,
                  icon: faq.icon || getCategoryIcon(category),
                  questions: []
                };
              }
              acc[category].questions.push({
                q: faq.question,
                a: faq.answer,
                id: faq.id,
                link_to: faq.link_to,
                link_text: faq.link_text,
                is_featured: faq.is_featured
              });
              return acc;
            }, {});
            
            setFaqData(Object.values(grouped));
          } else {
            // Use defaults if no FAQs in database
            setFaqData(defaultFaqs);
          }
        } else {
          setFaqData(defaultFaqs);
        }
      } catch (error) {
        console.error('Error fetching FAQs:', error);
        setFaqData(defaultFaqs);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFaqs();
  }, []);

  // Get icon for category
  const getCategoryIcon = (category) => {
    const iconMap = {
      'Concierge® & Mira AI': '✨',
      'Mira AI': '🤖',
      'Membership & Club': '👑',
      'Membership': '👑',
      'Pet Soul': '💜',
      'Rewards': '🐾',
      'Paw Points': '🐾',
      'Celebrate': '🎂',
      'Dine': '🍽️',
      'Stay': '🏨',
      'Travel': '✈️',
      'Care': '💊',
      'Enjoy': '🎾',
      'Fit': '🏃',
      'Learn': '🎓',
      'Advisory': '📋',
      'Paperwork': '📄',
      'Emergency': '🚨',
      'Farewell': '🌈',
      'Adopt': '🐾',
      'Shop': '🛒',
      'Services': '🏛️',
      'App & Technology': '📱',
      'Orders & Delivery': '📦',
      'Payments & Refunds': '💳',
      'General': '❓'
    };
    
    for (const [key, icon] of Object.entries(iconMap)) {
      if (category.toLowerCase().includes(key.toLowerCase())) {
        return icon;
      }
    }
    return '❓';
  };

  const toggleItem = (categoryIdx, questionIdx) => {
    const key = `${categoryIdx}-${questionIdx}`;
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredFaqs = faqData.map(category => ({
    ...category,
    questions: category.questions.filter(q => 
      q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  const displayFaqs = activeCategory
    ? filteredFaqs.filter(c => c.category === activeCategory)
    : filteredFaqs;

  // Open Mira AI
  const handleOpenMira = () => {
    window.dispatchEvent(new CustomEvent('openMiraAI'));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" data-testid="faqs-page">
      <Navbar />
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800 text-white py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-purple-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-pink-400 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">How can we help?</h1>
          <p className="text-xl text-white/80 mb-8">Find answers to common questions about The Doggy Company</p>
          
          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search FAQs or type to search the whole site..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  // If no FAQ results, redirect to global search
                  const hasResults = displayFaqs.some(cat => 
                    cat.faqs.some(faq => 
                      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      faq.a.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                  );
                  if (!hasResults) {
                    window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
                  }
                }
              }}
              className="w-full pl-12 pr-4 py-4 text-lg bg-white text-gray-900 rounded-xl border-0 shadow-lg"
            />
            {searchQuery && (
              <p className="text-xs text-white/60 mt-2">
                Press Enter to search the whole site if no FAQs match
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          <Button
            variant={activeCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveCategory(null)}
            className={activeCategory === null ? 'bg-purple-600' : ''}
          >
            All Categories
          </Button>
          {faqData.map((category) => (
            <Button
              key={category.category}
              variant={activeCategory === category.category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(category.category)}
              className={activeCategory === category.category ? 'bg-purple-600' : ''}
            >
              {category.icon} {category.category}
            </Button>
          ))}
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-6">
          {displayFaqs.map((category, categoryIdx) => (
            <Card key={category.category} className="overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-2xl">{category.icon}</span>
                  {category.category}
                </h2>
              </div>
              
              <div className="divide-y">
                {category.questions.map((item, questionIdx) => {
                  const key = `${categoryIdx}-${questionIdx}`;
                  const isOpen = openItems[key];
                  
                  return (
                    <div key={questionIdx} className="border-b last:border-b-0">
                      <button
                        onClick={() => toggleItem(categoryIdx, questionIdx)}
                        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-medium text-gray-900 pr-4">{item.q}</span>
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-purple-500 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                      </button>
                      
                      {isOpen && (
                        <div className="px-6 pb-4 text-gray-600 animate-in slide-in-from-top-2">
                          <p className="leading-relaxed whitespace-pre-line">{item.a}</p>
                          {item.link_to && (
                            <a 
                              href={item.link_to}
                              className="inline-flex items-center gap-1 mt-3 text-purple-600 hover:text-purple-700 font-medium"
                            >
                              {item.link_text || 'Learn more'} →
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>

        {/* Still need help? */}
        <Card className="mt-10 p-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-yellow-300" />
          <h3 className="text-2xl font-bold mb-2">Still have questions?</h3>
          <p className="text-white/80 mb-6">
            Ask Mira AI — she knows everything about The Doggy Company and can help with personalized answers.
          </p>
          <Button 
            onClick={handleOpenMira}
            className="bg-white text-purple-600 hover:bg-purple-50 px-8 py-3 text-lg"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Chat with Mira
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default FAQs;
