import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  RefreshCw, Gift, Calendar, Shield, Truck, Heart,
  ChevronDown, ChevronRight, Check, Sparkles
} from 'lucide-react';

const Autoship = () => {
  const [openFaq, setOpenFaq] = React.useState(null);

  const faqs = [
    {
      question: "What is Autoship?",
      answer: "Autoship is our subscription service that automatically delivers your dog's favourite treats, cakes, and essentials on a schedule you choose. It's the easiest way to ensure you never run out of what your furry friend loves — while saving money with exclusive discounts!"
    },
    {
      question: "How do I start Autoship?",
      answer: "Starting is simple! When you're on a product page, select the 'Autoship & Save' option instead of 'One-time purchase'. Choose your preferred delivery frequency (every 2, 4, or 6 weeks), add to cart, and checkout. Your subscription will begin automatically!"
    },
    {
      question: "What discount do I get?",
      answer: "Autoship members enjoy incredible savings:\n• 25% off your first Autoship order (max ₹300 discount)\n• 40% off on your 4th and 5th deliveries\n• 50% off on your 6th and 7th deliveries\n\nEvery dog deserves at least 7 celebrations a year — one for each dog year!"
    },
    {
      question: "Can I change my delivery date or frequency?",
      answer: "Absolutely! You have full control over your Autoship. Log into your account, go to 'My Autoship' section, and you can:\n• Change your next shipment date\n• Update delivery frequency (2, 4, or 6 weeks)\n• Add or remove products\n\nChanges take effect immediately."
    },
    {
      question: "Can I skip or cancel anytime?",
      answer: "Yes! There's no commitment or minimum orders required. You can skip a shipment, pause your subscription, or cancel entirely — all from your account dashboard. We believe in making Autoship work for YOU, not the other way around."
    },
    {
      question: "Which products support Autoship?",
      answer: "Many of our popular products support Autoship, including treats, biscuits, nut butters, and select cakes. Look for the Autoship option on the product page — if you see it, that product is eligible! We're constantly adding more products to the Autoship program."
    },
    {
      question: "When will I be charged?",
      answer: "You'll be charged automatically before each shipment based on your chosen frequency. We'll send you a reminder email and WhatsApp message 3 days before processing, giving you time to make any changes if needed."
    },
    {
      question: "What if a product is out of stock?",
      answer: "If an item in your Autoship is temporarily unavailable, we'll notify you immediately and give you the option to substitute, skip that item, or delay your shipment until it's back in stock."
    }
  ];

  const promoLines = [
    "Never forget your dog's favourites again — Autoship makes it effortless.",
    "Celebrate your dog all year with Autoship rewards.",
    "Your dog's treats, delivered on time — every time.",
    "Because one year is seven dog years — celebrate often with Autoship.",
    "Set it once. Spoil them always."
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <RefreshCw className="w-4 h-4" />
            Subscribe & Save
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Autoship at The Doggy Company
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Autoship makes repeat deliveries simple and rewarding — so you never run out of your dog's favourite treats, cakes and essentials.
          </p>
          <Link to="/autoship-products">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Sparkles className="w-5 h-5 mr-2" />
              Browse Autoship Products
            </Button>
          </Link>
        </div>
      </section>

      {/* Savings Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <div className="text-center mb-8">
              <Gift className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Autoship Savings</h2>
              <p className="text-gray-600">The more you celebrate, the more you save!</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-green-100">
                <div className="text-4xl font-bold text-green-600 mb-2">25%</div>
                <div className="text-sm font-semibold text-gray-900 mb-1">First Order</div>
                <div className="text-xs text-gray-500">Discount capped at ₹300</div>
              </div>
              <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-green-100">
                <div className="text-4xl font-bold text-green-600 mb-2">40%</div>
                <div className="text-sm font-semibold text-gray-900 mb-1">4th & 5th Orders</div>
                <div className="text-xs text-gray-500">Bigger celebrations, bigger savings</div>
              </div>
              <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-green-100">
                <div className="text-4xl font-bold text-green-600 mb-2">50%</div>
                <div className="text-sm font-semibold text-gray-900 mb-1">6th & 7th Orders</div>
                <div className="text-xs text-gray-500">Maximum rewards unlocked!</div>
              </div>
            </div>

            <p className="text-center mt-8 text-gray-600 italic">
              🐕 Every dog deserves at least seven celebrations a year — one for each dog year.
            </p>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">How Autoship Works</h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Choose Products</h3>
              <p className="text-sm text-gray-600">Select Autoship-enabled products your dog loves</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Set Frequency</h3>
              <p className="text-sm text-gray-600">Pick every 2, 4, or 6 weeks delivery</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Save & Relax</h3>
              <p className="text-sm text-gray-600">Enjoy automatic discounts on every order</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-pink-600">4</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Manage Anytime</h3>
              <p className="text-sm text-gray-600">Skip, pause, or cancel with one click</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">Why Choose Autoship?</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Gift className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Exclusive Savings</h3>
                  <p className="text-sm text-gray-600">Up to 50% off on your deliveries — savings you won't find anywhere else!</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Never Run Out</h3>
                  <p className="text-sm text-gray-600">Automatic deliveries mean your pup's favourites are always stocked.</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Full Control</h3>
                  <p className="text-sm text-gray-600">Change dates, skip deliveries, or cancel anytime — no strings attached.</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Truck className="w-6 h-6 text-pink-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Priority Processing</h3>
                  <p className="text-sm text-gray-600">Autoship orders are processed first, ensuring timely delivery.</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Frequently Asked Questions</h2>
          
          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <Card 
                key={idx} 
                className={`overflow-hidden transition-all ${openFaq === idx ? 'ring-2 ring-purple-200' : ''}`}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50"
                >
                  <span className="font-medium text-gray-900">{faq.question}</span>
                  {openFaq === idx ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="px-4 pb-4 text-gray-600 text-sm whitespace-pre-line">
                    {faq.answer}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <Heart className="w-12 h-12 text-pink-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {promoLines[Math.floor(Math.random() * promoLines.length)]}
          </h2>
          <p className="text-gray-600 mb-8">
            Join thousands of happy pet parents who've made treat time effortless.
          </p>
          <Link to="/autoship-products">
            <Button size="lg" className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700">
              Start Your Autoship Today
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Autoship;
