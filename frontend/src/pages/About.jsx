import React from 'react';
import { Award, Heart, Leaf, Users, Clock, Shield } from 'lucide-react';
import { Card } from '../components/ui/card';

const About = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Made with Love for Your
              <span className="block mt-2 bg-gradient-to-r from-purple-600 via-pink-600 to-yellow-500 bg-clip-text text-transparent">
                Furry Family Members
              </span>
            </h1>
            <p className="text-xl text-gray-700 leading-relaxed">
              At The Doggy Bakery, we believe every pup deserves the best. That's why we bake fresh, healthy treats using only the finest ingredients.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  The Doggy Bakery was founded in 2020 with a simple mission: to provide dogs with treats that are as healthy as they are delicious. What started as a small home kitchen operation has grown into a beloved brand trusted by over 45,000 pet parents across India.
                </p>
                <p>
                  We understand that your pets are family. That's why every cake, treat, and meal we create is made with the same care and quality you'd expect for any family member. From farm-fresh ingredients to FSSAI-approved recipes, we never compromise on quality.
                </p>
                <p>
                  Today, we're proud to serve pet parents in Bengaluru, Mumbai, and Gurgaon, with plans to expand across India. Our commitment remains the same: fresh, healthy, and delicious treats that make tails wag!
                </p>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.pexels.com/photos/230785/pexels-photo-230785.jpeg"
                alt="Happy dogs"
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-xl text-gray-600">What makes us different</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-8 text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Leaf className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">100% Natural</h3>
              <p className="text-gray-600">
                We use only natural, wholesome ingredients with no artificial preservatives, colors, or flavors.
              </p>
            </Card>
            <Card className="p-8 text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-pink-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Freshly Baked</h3>
              <p className="text-gray-600">
                Every order is prepared fresh on the day of delivery. No mass production, no sitting in warehouses.
              </p>
            </Card>
            <Card className="p-8 text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">FSSAI Approved</h3>
              <p className="text-gray-600">
                All our recipes are FSSAI-approved and meet the highest standards of pet food safety.
              </p>
            </Card>
            <Card className="p-8 text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Made with Love</h3>
              <p className="text-gray-600">
                We're pet parents too! Every treat is made with the love and care we'd give our own furry friends.
              </p>
            </Card>
            <Card className="p-8 text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Community First</h3>
              <p className="text-gray-600">
                We're building a community of pet parents who care about their dogs' health and happiness.
              </p>
            </Card>
            <Card className="p-8 text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Quality First</h3>
              <p className="text-gray-600">
                We source ingredients from trusted farms and never compromise on quality or freshness.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-purple-600 via-pink-600 to-yellow-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center text-white">
            <div>
              <p className="text-5xl font-bold mb-2">45,000+</p>
              <p className="text-xl opacity-90">Happy Customers</p>
            </div>
            <div>
              <p className="text-5xl font-bold mb-2">100%</p>
              <p className="text-xl opacity-90">Natural Ingredients</p>
            </div>
            <div>
              <p className="text-5xl font-bold mb-2">3</p>
              <p className="text-xl opacity-90">Cities Served</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
