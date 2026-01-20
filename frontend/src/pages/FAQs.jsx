import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search, Sparkles } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

const faqs = [
  {
    category: 'Concierge® & Mira AI',
    icon: '✨',
    questions: [
      {
        q: 'What is The Doggy Company Concierge®?',
        a: 'Our Concierge® is your dedicated pet lifestyle assistant. Powered by Mira AI, it provides personalized recommendations, coordinates bookings across all our services, and remembers your pet\'s preferences through our Pet Soul™ technology for a truly tailored experience.'
      },
      {
        q: 'How does Mira AI help me?',
        a: 'Mira AI is your 24/7 Super Concierge®! She can book pet-friendly restaurants, arrange travel, schedule grooming appointments, recommend products based on your pet\'s profile, and even remind you of important dates like vaccination schedules and birthdays.'
      },
      {
        q: 'What is Pet Soul™?',
        a: 'Pet Soul™ is our intelligent pet profile system that remembers everything about your furry friend — dietary preferences, allergies, favorite treats, health records, and more. Every interaction enriches this profile, enabling truly personalized recommendations across all our services.'
      }
    ]
  },
  {
    category: 'Membership & Club',
    icon: '👑',
    questions: [
      {
        q: 'What are the membership benefits?',
        a: 'Members enjoy exclusive discounts on all services, priority booking for restaurants and stays, access to VIP events, free delivery, personalized Pet Soul™ profiles, and 24/7 Mira AI Concierge® support. We offer Silver, Gold, and Platinum tiers with increasing benefits.'
      },
      {
        q: 'How do I become a member?',
        a: 'Visit our Membership page and choose the tier that suits your needs. You can sign up online or through WhatsApp. Membership starts immediately upon payment.'
      },
      {
        q: 'Can I cancel my membership?',
        a: 'Yes, memberships can be cancelled anytime. However, we don\'t offer pro-rata refunds for the remaining period. Your benefits continue until the end of your billing cycle.'
      }
    ]
  },
  {
    category: 'Celebrate (Cakes & Treats)',
    icon: '🎂',
    questions: [
      {
        q: 'Are your products safe for dogs?',
        a: 'Absolutely! All our celebration products are made with 100% dog-safe, human-grade ingredients. We never use sugar, salt, xylitol, chocolate, or any harmful ingredients. Our supplier, The Doggy Bakery, follows strict quality standards.'
      },
      {
        q: 'What flavors do you offer?',
        a: 'We offer Chicken & Oats, Peanut Butter, Banana & Honey, Mutton & Veggies, and seasonal specials. For cats, we have fish-based options. All flavors are naturally derived without artificial additives.'
      },
      {
        q: 'Can I customize my cake?',
        a: 'Yes! You can customize flavors, sizes, and designs. Use our Custom Cake Designer or chat with Mira for special requests. Breed-specific cakes are also available.'
      },
      {
        q: 'Do you deliver pan-India?',
        a: 'Fresh cakes are available for same-day delivery in Bangalore, Mumbai, and Gurgaon. Treats and biscuits are shipped pan-India with a 3-5 day delivery timeline.'
      }
    ]
  },
  {
    category: 'Dine (Pet-Friendly Restaurants)',
    icon: '🍽️',
    questions: [
      {
        q: 'How do I book a pet-friendly restaurant?',
        a: 'Simply ask Mira AI or browse our Dine section. We partner with verified pet-friendly restaurants across major cities. You can filter by location, cuisine, amenities (water bowls, outdoor seating, pet menu).'
      },
      {
        q: 'Do restaurants have pet menus?',
        a: 'Many of our partner restaurants offer special pet menus! Look for the "Pet Menu Available" badge when browsing. Mira can also recommend dishes based on your pet\'s preferences.'
      },
      {
        q: 'What cities do you cover for dining?',
        a: 'Currently, we have extensive listings in Bangalore, Mumbai, Delhi NCR, Hyderabad, Pune, and Chennai. We\'re rapidly expanding to more cities.'
      }
    ]
  },
  {
    category: 'Travel (Pet Relocation & Transport)',
    icon: '✈️',
    questions: [
      {
        q: 'Do you help with pet relocation?',
        a: 'Yes! Our Travel pillar covers domestic and international pet relocation, airline bookings, pet taxi services, and travel documentation. Mira AI coordinates everything from crate preparation to customs clearance.'
      },
      {
        q: 'Which airlines do you work with?',
        a: 'We work with all major pet-friendly airlines including Air India, Vistara, IndiGo (cargo), Emirates, Lufthansa, and KLM. We handle booking, documentation, and compliance.'
      },
      {
        q: 'What documents are needed for pet travel?',
        a: 'Requirements vary by destination. Typically: vaccination records, health certificate, microchip details, and import permits for international travel. Our Paperwork pillar helps you manage all these documents.'
      }
    ]
  },
  {
    category: 'Stay (Hotels & Boarding)',
    icon: '🏨',
    questions: [
      {
        q: 'How do I find pet-friendly hotels?',
        a: 'Browse our Stay section or ask Mira AI. We verify each property for genuine pet-friendliness, including policies on pet sizes, number of pets, and available amenities like pet beds and food bowls.'
      },
      {
        q: 'Do you offer pet boarding?',
        a: 'Yes! We partner with verified home boarders and professional pet hostels. All partners are background-checked and reviewed. You can see ratings, photos, and even take virtual tours.'
      },
      {
        q: 'Is daycare available?',
        a: 'Absolutely! We have daycare partners across cities for when you need someone to watch your pet during work hours or special occasions.'
      }
    ]
  },
  {
    category: 'Care (Health & Grooming)',
    icon: '💊',
    questions: [
      {
        q: 'Do you provide vet services?',
        a: 'We coordinate vet appointments through our partner network. While we don\'t directly provide medical services, Mira AI can help you find specialists, book appointments, and maintain health records in your Pet Soul™ profile.'
      },
      {
        q: 'How do I book grooming?',
        a: 'Ask Mira or browse the Care section. We partner with professional groomers for at-home and salon services. Members get priority booking and discounts.'
      },
      {
        q: 'Can you help with medication reminders?',
        a: 'Yes! Add medication schedules to your Pet Soul™ profile, and Mira will send you timely reminders via WhatsApp or the app.'
      }
    ]
  },
  {
    category: 'Enjoy (Events & Experiences)',
    icon: '🎾',
    questions: [
      {
        q: 'What kind of pet events do you organize?',
        a: 'We organize pet meetups, playdates, birthday parties, adoption drives, pet photography sessions, and seasonal events. Members get exclusive invites and early access.'
      },
      {
        q: 'Can I host a pawty through you?',
        a: 'Absolutely! We offer complete party planning — venue, decorations, cakes, treats, entertainment, and photography. Ask Mira for custom party packages.'
      }
    ]
  },
  {
    category: 'Fit (Fitness & Training)',
    icon: '🏃',
    questions: [
      {
        q: 'Do you offer dog training services?',
        a: 'We partner with certified trainers for obedience training, behavior correction, and agility. Sessions can be at-home or at training facilities.'
      },
      {
        q: 'How does weight management work?',
        a: 'Based on your pet\'s Pet Soul™ profile, we provide customized diet plans, exercise recommendations, and progress tracking. Our Advisory pillar offers nutrition consultations for complex cases.'
      }
    ]
  },
  {
    category: 'Advisory (Expert Consultations)',
    icon: '📋',
    questions: [
      {
        q: 'What expert consultations are available?',
        a: 'We offer behavior consultations, nutrition planning, senior pet care guidance, and new pet parent coaching. All advisors are certified professionals.'
      },
      {
        q: 'How do I book a consultation?',
        a: 'Ask Mira AI or browse the Advisory section. Select your consultation type, preferred time, and you\'ll be connected with a specialist.'
      }
    ]
  },
  {
    category: 'Paperwork (Documents & Records)',
    icon: '📄',
    questions: [
      {
        q: 'What is the Pet Vault?',
        a: 'Pet Vault is your secure digital storage for all pet documents — vaccination records, health certificates, insurance policies, and travel permits. Everything is linked to your Pet Soul™ profile and accessible anytime.'
      },
      {
        q: 'Can you help with microchipping?',
        a: 'Yes! We coordinate microchip registration and ensure your details are correctly recorded. This is essential for travel and identification.'
      }
    ]
  },
  {
    category: 'Emergency Support',
    icon: '🚨',
    questions: [
      {
        q: 'What emergency services do you offer?',
        a: 'Our Emergency pillar provides 24/7 support for lost pets, medical emergencies, and urgent coordination. We help connect you with emergency vets, mobilize lost pet alerts, and provide crisis guidance.'
      },
      {
        q: 'How do I report a lost pet?',
        a: 'Immediately contact Mira AI or use the Emergency section. We\'ll activate a lost pet alert across our network, help create and distribute flyers, and coordinate search efforts.'
      },
      {
        q: 'Is emergency support included in membership?',
        a: 'Basic emergency coordination is available to all users. Members get priority response and access to our emergency helpline.'
      }
    ]
  },
  {
    category: 'Orders & Delivery',
    icon: '📦',
    questions: [
      {
        q: 'What are your delivery timings?',
        a: 'We deliver between 10 AM to 8 PM. Same-day delivery is available in Bangalore, Mumbai, and Gurgaon for orders placed before 2 PM.'
      },
      {
        q: 'What is the delivery charge?',
        a: 'Delivery is FREE for members and for orders above ₹499 in metro cities. For other locations, delivery charges vary based on pincode.'
      },
      {
        q: 'Can I track my order?',
        a: 'Yes! Once your order is dispatched, you\'ll receive a WhatsApp message with tracking details. Mira can also provide real-time updates.'
      }
    ]
  },
  {
    category: 'Payments & Refunds',
    icon: '💳',
    questions: [
      {
        q: 'What payment methods do you accept?',
        a: 'We accept all UPI apps, Credit/Debit cards, Net Banking, and Cash on Delivery (in select areas). For memberships, we support auto-debit for renewals.'
      },
      {
        q: 'What is your refund policy?',
        a: 'If there\'s any issue with your order, please contact us within 24 hours with photos. We offer replacements or refunds for genuine concerns. Service bookings follow partner-specific cancellation policies.'
      },
      {
        q: 'Can I cancel my order?',
        a: 'Product orders can be cancelled within 2 hours of placing. For service bookings (restaurants, hotels, etc.), cancellation policies vary by partner — check your booking confirmation for details.'
      }
    ]
  }
];

const FAQs = () => {
  const [openItems, setOpenItems] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);

  const toggleItem = (categoryIdx, questionIdx) => {
    const key = `${categoryIdx}-${questionIdx}`;
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
           q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => {
    if (activeCategory && category.category !== activeCategory) return false;
    return category.questions.length > 0;
  });

  const openMiraAI = () => {
    window.dispatchEvent(new CustomEvent('openMiraAI'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-16" data-testid="faqs-page">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-gray-900 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Everything you need to know about The Doggy Company — Your Pet Life Operating System
          </p>
          
          {/* Search */}
          <div className="relative max-w-md mx-auto mb-8">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search FAQs across all pillars..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="faq-search-input"
            />
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === null
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              data-testid="faq-filter-all"
            >
              All Topics
            </button>
            {faqs.map((cat) => (
              <button
                key={cat.category}
                onClick={() => setActiveCategory(activeCategory === cat.category ? null : cat.category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat.category
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.icon} {cat.category.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {filteredFaqs.map((category, catIdx) => (
            <Card key={catIdx} className="overflow-hidden" data-testid={`faq-category-${catIdx}`}>
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span className="text-2xl">{category.icon}</span>
                  {category.category}
                </h2>
              </div>
              <div className="divide-y">
                {category.questions.map((item, qIdx) => {
                  const isOpen = openItems[`${catIdx}-${qIdx}`];
                  return (
                    <div key={qIdx} className="border-b last:border-b-0">
                      <button
                        onClick={() => toggleItem(catIdx, qIdx)}
                        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                        data-testid={`faq-question-${catIdx}-${qIdx}`}
                      >
                        <span className="font-medium text-gray-900 pr-4">{item.q}</span>
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-purple-600 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-4 text-gray-600 bg-gray-50">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredFaqs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No FAQs found matching your search.</p>
            <Button onClick={() => { setSearchQuery(''); setActiveCategory(null); }}>
              Clear Filters
            </Button>
          </div>
        )}

        {/* Still have questions */}
        <Card className="mt-12 p-8 text-center bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <h3 className="text-2xl font-bold mb-4">Still have questions?</h3>
          <p className="mb-6">Ask Mira, your Super Concierge® — available 24/7!</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={openMiraAI}
              className="bg-white text-purple-600 hover:bg-gray-100"
              data-testid="faq-ask-mira-btn"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Ask Mira AI
            </Button>
            <a
              href="https://wa.me/919663185747?text=Hi! I have a question about The Doggy Company"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-md font-medium transition-colors"
            >
              WhatsApp Us
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FAQs;
