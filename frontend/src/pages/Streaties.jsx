import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Heart, PawPrint, Gift, ShoppingBag, Users, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';

const Streaties = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-r from-orange-500 to-pink-500 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full"></div>
          <div className="absolute bottom-10 right-20 w-48 h-48 bg-white rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white rounded-full"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-white/20 rounded-full mb-6">
              <Heart className="w-5 h-5 mr-2 fill-white" />
              <span className="font-semibold">Taking Care of Street Animals</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-6">
              Streaties
            </h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto opacity-90">
              Taking care of the furry babies on the street! A program dedicated to feeding and caring for stray animals across India.
            </p>
          </div>
        </div>
      </section>

      {/* About Streaties */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                What is Streaties?
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Streaties is a program undertaken by The Doggy Bakery solely dedicated to taking care of stray animals all over the country.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                We, at The Doggy Bakery, understand the importance of taking care of animals that are not so fortunate to have pet parents like you. And so, for every product that we sell, a portion of the profits is utilised in taking care of stray animals.
              </p>
              <p className="text-lg text-gray-600">
                We are closely associated with NGOs, animal welfare and adoption centres throughout the country. By making regular donations, we ensure to reach out to the maximum number of stray animals.
              </p>
            </div>
            <div className="relative">
              <div 
                className="rounded-2xl shadow-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #1A0A2E 0%, #2D1B69 50%, #0D4F4F 100%)',
                  width: '100%',
                  height: '400px',
                  fontSize: 96
                }}
              >
                🐾
              </div>
              <div className="absolute -bottom-6 -left-6 bg-orange-500 text-white p-6 rounded-xl shadow-lg">
                <p className="text-3xl font-bold">10%</p>
                <p className="text-sm">of every sale goes to strays</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How You Can Contribute */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How You Can Contribute
            </h2>
            <p className="text-xl text-gray-600">
              Multiple ways to help our furry friends on the streets
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Contribution Method 1 */}
            <Card className="p-8 hover:shadow-xl transition-shadow border-l-4 border-l-orange-500">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <ShoppingBag className="w-8 h-8 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">1. Shop With Us</h3>
                  <p className="text-gray-600">
                    For every product that you purchase from our website, a minimum of <strong>10% of the sales</strong> is given away in feeding and taking care of street animals. So you can contribute by just buying from us!
                  </p>
                </div>
              </div>
            </Card>

            {/* Contribution Method 2 */}
            <Card className="p-8 hover:shadow-xl transition-shadow border-l-4 border-l-pink-500">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-pink-100 rounded-lg">
                  <Sparkles className="w-8 h-8 text-pink-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">2. Subscribe to Our Plans</h3>
                  <p className="text-gray-600">
                    The subscription to any of our plans will get you a box full of yummy and healthy treats enough for an entire month for your dog or cat, <strong>plus enough treats to feed stray animals</strong> around you for a month.
                  </p>
                </div>
              </div>
            </Card>

            {/* Contribution Method 3 */}
            <Card className="p-8 hover:shadow-xl transition-shadow border-l-4 border-l-purple-500">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <PawPrint className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">3. Get Treat Packets</h3>
                  <p className="text-gray-600">
                    You could get packets of treats yourself, which are <strong>perfect and convenient</strong> if you want to feed the stray animals on your own during your daily walks or commutes.
                  </p>
                </div>
              </div>
            </Card>

            {/* Contribution Method 4 */}
            <Card className="p-8 hover:shadow-xl transition-shadow border-l-4 border-l-green-500">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Gift className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">4. Donate on Our Behalf</h3>
                  <p className="text-gray-600">
                    Buy individual products and ask us to give them to animals in adoption centres or on the streets <strong>on your behalf</strong>. Just let us know after you order! We'll send you proof of the same!
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-16 bg-gradient-to-r from-orange-500 to-pink-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl md:text-5xl font-black">10K+</p>
              <p className="text-orange-100 mt-2">Strays Fed Monthly</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-black">50+</p>
              <p className="text-orange-100 mt-2">NGO Partners</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-black">20+</p>
              <p className="text-orange-100 mt-2">Cities Covered</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-black">₹5L+</p>
              <p className="text-orange-100 mt-2">Donated So Far</p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Promise */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Promise
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Transparency</h3>
              <p className="text-gray-600">We share regular updates and proof of our donations and feeding drives.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-pink-600 fill-pink-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Commitment</h3>
              <p className="text-gray-600">10% of every sale goes directly to helping street animals.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Community</h3>
              <p className="text-gray-600">Join thousands of pet parents making a difference.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Heart className="w-16 h-16 text-pink-500 mx-auto mb-6 fill-pink-500" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Every purchase you make helps feed a stray animal. Shop now and be a part of our mission!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/treats">
              <Button size="lg" className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 px-8">
                Shop Treats <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/membership">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900 px-8">
                View Subscription Plans
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Streaties;
