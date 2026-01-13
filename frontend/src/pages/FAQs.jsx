import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';

const faqs = [
  {
    category: 'Orders & Delivery',
    questions: [
      {
        q: 'What are your delivery timings?',
        a: 'We deliver between 10 AM to 8 PM. Same-day delivery is available in Bangalore, Mumbai, and Gurgaon for orders placed before 2 PM.'
      },
      {
        q: 'Do you deliver across India?',
        a: 'Yes! We have Pan India delivery for our treats and biscuits. Fresh cakes are available for same-day delivery in Bangalore, Mumbai, and Gurgaon only.'
      },
      {
        q: 'What is the delivery charge?',
        a: 'Delivery is FREE for orders above ₹499 in metro cities. For other locations, delivery charges vary based on pincode.'
      },
      {
        q: 'Can I track my order?',
        a: 'Yes, once your order is dispatched, you will receive a WhatsApp message with tracking details.'
      }
    ]
  },
  {
    category: 'Products & Ingredients',
    questions: [
      {
        q: 'Are your products safe for dogs?',
        a: 'Absolutely! All our products are made with 100% dog-safe, human-grade ingredients. We never use sugar, salt, xylitol, chocolate, or any harmful ingredients.'
      },
      {
        q: 'What ingredients do you use?',
        a: 'We use wholesome ingredients like whole wheat flour, peanut butter, carrots, pumpkin, chicken, fish, and fresh fruits. All ingredients are sourced from quality suppliers.'
      },
      {
        q: 'Are your cakes suitable for puppies?',
        a: 'Our cakes are suitable for dogs 6 months and above. For younger puppies, please consult your vet first.'
      },
      {
        q: 'Do you have options for dogs with allergies?',
        a: 'Yes! We have grain-free, gluten-free, and single-protein options. Please mention any allergies in the order notes.'
      }
    ]
  },
  {
    category: 'Customization',
    questions: [
      {
        q: 'Can I customize my cake?',
        a: 'Yes! You can customize the flavor, size, and design. Use our Custom Cake Designer or WhatsApp us for special requests.'
      },
      {
        q: 'Can you add my pet\'s photo on the cake?',
        a: 'Yes! We offer edible photo prints on cakes. Just upload a clear photo when ordering.'
      },
      {
        q: 'How early should I order for custom cakes?',
        a: 'For custom cakes, we recommend ordering at least 24-48 hours in advance. For elaborate designs, 3-4 days notice is preferred.'
      }
    ]
  },
  {
    category: 'Payments & Refunds',
    questions: [
      {
        q: 'What payment methods do you accept?',
        a: 'We accept all UPI apps, Credit/Debit cards, Net Banking, and Cash on Delivery (in select areas).'
      },
      {
        q: 'What is your refund policy?',
        a: 'If there\'s any issue with your order, please contact us within 24 hours with photos. We offer replacements or refunds for genuine concerns.'
      },
      {
        q: 'Can I cancel my order?',
        a: 'Orders can be cancelled within 2 hours of placing. After that, cancellation may not be possible as preparation begins.'
      }
    ]
  }
];

const FAQs = () => {
  const [openItems, setOpenItems] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

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
  })).filter(category => category.questions.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-gray-900 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Everything you need to know about The Doggy Bakery
          </p>
          
          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {filteredFaqs.map((category, catIdx) => (
            <Card key={catIdx} className="overflow-hidden">
              <div className="bg-purple-600 text-white px-6 py-4">
                <h2 className="text-xl font-bold">{category.category}</h2>
              </div>
              <div className="divide-y">
                {category.questions.map((item, qIdx) => {
                  const isOpen = openItems[`${catIdx}-${qIdx}`];
                  return (
                    <div key={qIdx} className="border-b last:border-b-0">
                      <button
                        onClick={() => toggleItem(catIdx, qIdx)}
                        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
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

        {/* Still have questions */}
        <Card className="mt-12 p-8 text-center bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <h3 className="text-2xl font-bold mb-4">Still have questions?</h3>
          <p className="mb-6">Our team is happy to help!</p>
          <a
            href="https://wa.me/919663185747?text=Hi! I have a question about The Doggy Bakery"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-purple-600 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
          >
            WhatsApp Us
          </a>
        </Card>
      </div>
    </div>
  );
};

export default FAQs;
