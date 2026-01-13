import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Truck, Clock, MapPin, Gift, Star, Heart, Sparkles, ArrowRight } from 'lucide-react';

const streaties = [
  {
    id: 1,
    name: 'Chicken Jerky Strips',
    description: '100% real chicken, slow-dried for maximum flavor. No preservatives.',
    price: 299,
    originalPrice: 349,
    image: 'https://thedoggybakery.com/cdn/shop/files/CHICKENCHIPS.png?v=1693304736&width=800',
    rating: 4.9,
    reviews: 234,
    badge: 'Bestseller'
  },
  {
    id: 2,
    name: 'Peanut Butter Biscuits',
    description: 'Crunchy biscuits made with natural peanut butter. Dogs go crazy for these!',
    price: 199,
    originalPrice: 249,
    image: 'https://thedoggybakery.com/cdn/shop/products/IMG-8036.png?v=1680145248&width=800',
    rating: 4.8,
    reviews: 189,
    badge: 'Fan Favorite'
  },
  {
    id: 3,
    name: 'Sweet Potato Chews',
    description: 'Natural sweet potato, dehydrated to perfection. Great for dental health.',
    price: 249,
    originalPrice: 299,
    image: 'https://thedoggybakery.com/cdn/shop/files/CHICKENMANGO.png?v=1693304736&width=800',
    rating: 4.7,
    reviews: 156,
    badge: 'Healthy Pick'
  },
  {
    id: 4,
    name: 'Mutton Munchies',
    description: 'Premium mutton treats for dogs who love rich, meaty flavors.',
    price: 349,
    originalPrice: 399,
    image: 'https://thedoggybakery.com/cdn/shop/files/12.png?v=1745221354&width=800',
    rating: 4.9,
    reviews: 198,
    badge: 'Premium'
  }
];

const Streaties = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-r from-orange-500 to-pink-500 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full"></div>
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-white rounded-full"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-white/20 rounded-full mb-6">
              <Sparkles className="w-5 h-5 mr-2" />
              <span className="font-semibold">Street Treats, Premium Quality</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-6">
              Streaties
            </h1>
            <p className="text-xl md:text-2xl max-w-2xl mx-auto opacity-90">
              Gourmet street-style treats that your dog will absolutely love. 
              Made fresh, delivered fast!
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3 justify-center">
              <Truck className="w-8 h-8 text-orange-500" />
              <span className="font-medium">Pan India Delivery</span>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <Clock className="w-8 h-8 text-orange-500" />
              <span className="font-medium">Fresh Daily</span>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <Heart className="w-8 h-8 text-orange-500" />
              <span className="font-medium">100% Natural</span>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <Gift className="w-8 h-8 text-orange-500" />
              <span className="font-medium">Gift Packaging</span>
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Our Streaties Collection
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {streaties.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  {item.badge && (
                    <span className="absolute top-3 left-3 bg-orange-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                      {item.badge}
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">{item.name}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < Math.floor(item.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">({item.reviews})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-gray-900">₹{item.price}</span>
                      <span className="text-sm text-gray-400 line-through">₹{item.originalPrice}</span>
                    </div>
                    <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                      Add
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/treats">
              <Button size="lg" className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600">
                View All Treats <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-orange-100 to-pink-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Want These Delivered Monthly?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Subscribe and save 15% on all Streaties. Plus, free delivery every month!
          </p>
          <Link to="/membership">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
              Join Our Membership
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Streaties;
