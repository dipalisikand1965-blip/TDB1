import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { products, testimonials, faqs, categories } from '../mockData';
import ProductCard from '../components/ProductCard';
import InstagramFeed from '../components/InstagramFeed';
import VideoSection from '../components/VideoSection';
import { Button } from '../components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { Card } from '../components/ui/card';
import { Star, Award, Leaf, Clock, Shield, ArrowRight, Sparkles, Heart, Users, Check, TrendingUp, Play, Instagram } from 'lucide-react';
import { useInView, useCountUp } from '../hooks/useAnimations';

const Home = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const featuredProducts = products.filter(p => p.featured);
  const [statsRef, statsInView] = useInView({ threshold: 0.3 });
  
  const customersCount = useCountUp(45000, 2000, statsInView);
  const productsCount = useCountUp(500, 2000, statsInView);
  const citiesCount = useCountUp(3, 1500, statsInView);

  const heroSlides = [
    {
      title: 'Unconditional Love',
      subtitle: 'Deserves Exceptional Treats',
      description: 'Premium, freshly baked treats crafted with love for your furry family',
      image: 'https://images.unsplash.com/flagged/photo-1553802922-28e2f719977d?w=1200',
      cta: 'Explore Cakes'
    },
    {
      title: 'Meet Mira AI',
      subtitle: 'Your Pet Celebration Concierge',
      description: 'Get personalized recommendations, party ideas, and expert guidance',
      image: 'https://images.unsplash.com/photo-1537204696486-967f1b7198c8?w=1200',
      cta: 'Chat with Mira'
    },
    {
      title: 'Custom Celebrations',
      subtitle: 'Designed Just for Your Pup',
      description: 'Create the perfect cake with our interactive designer tool',
      image: 'https://images.unsplash.com/photo-1679067652135-324b9535d288?w=1200',
      cta: 'Design Now'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section - Ultra Modern */}
      <section className="relative h-screen overflow-hidden bg-black">
        {/* Background Slides */}
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === activeSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
          </div>
        ))}

        {/* Content */}
        <div className="relative h-full flex items-center z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="max-w-3xl">
              {heroSlides.map((slide, index) => (
                <div
                  key={index}
                  className={`transition-all duration-700 ${
                    index === activeSlide
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-10 absolute'
                  }`}
                >
                  <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-md rounded-full mb-6 border border-white/20">
                    <Sparkles className="w-4 h-4 text-yellow-400 mr-2" />
                    <span className="text-white text-sm font-medium">45,000+ Happy Pet Parents</span>
                  </div>
                  
                  <h1 className="text-6xl lg:text-7xl font-black text-white mb-4 leading-tight">
                    {slide.title}
                  </h1>
                  <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent mb-6">
                    {slide.subtitle}
                  </h2>
                  <p className="text-xl text-gray-200 mb-8 leading-relaxed">
                    {slide.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-4">
                    <Link to="/cakes">
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-purple-600 via-pink-600 to-yellow-500 hover:from-purple-700 hover:via-pink-700 hover:to-yellow-600 text-white text-lg px-8 py-7 shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105"
                      >
                        {slide.cta}
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </Link>
                    <Link to="/custom-cake">
                      <Button
                        size="lg"
                        variant="outline"
                        className="border-2 border-white text-white hover:bg-white/10 backdrop-blur-sm text-lg px-8 py-7"
                      >
                        Design Custom Cake
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3 z-20">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveSlide(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === activeSlide ? 'w-12 bg-white' : 'w-6 bg-white/40'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Trust Bar */}
      <section className="bg-gradient-to-r from-purple-600 via-pink-600 to-yellow-500 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-white text-center">
            <div className="flex items-center justify-center gap-3">
              <Award className="w-6 h-6" />
              <div>
                <p className="font-bold text-lg">45K+</p>
                <p className="text-sm opacity-90">Happy Customers</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Leaf className="w-6 h-6" />
              <div>
                <p className="font-bold text-lg">100%</p>
                <p className="text-sm opacity-90">Natural</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Clock className="w-6 h-6" />
              <div>
                <p className="font-bold text-lg">Same Day</p>
                <p className="text-sm opacity-90">Delivery</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Shield className="w-6 h-6" />
              <div>
                <p className="font-bold text-lg">FSSAI</p>
                <p className="text-sm opacity-90">Certified</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mira AI Spotlight */}
      <section className="py-24 bg-gradient-to-br from-purple-50 via-pink-50 to-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-200 rounded-full opacity-20 blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-2 bg-purple-100 rounded-full mb-6">
                <Sparkles className="w-5 h-5 text-purple-600 mr-2" />
                <span className="text-purple-600 text-sm font-semibold">Introducing Mira AI</span>
              </div>
              <h2 className="text-5xl font-black text-gray-900 mb-6">
                Your Personal Pet
                <span className="block bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Celebration Concierge
                </span>
              </h2>
              <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                Mira is your AI-powered assistant that helps you plan perfect celebrations, recommends products based on your dog's needs, and provides expert guidance 24/7.
              </p>
              
              <div className="space-y-4 mb-8">
                {[
                  'Personalized cake & treat recommendations',
                  'Birthday party planning & ideas',
                  'Dietary guidance & allergy support',
                  'Trusted referrals (vets, groomers, photographers)'
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-gray-700 font-medium">{feature}</p>
                  </div>
                ))}
              </div>

              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg px-8 py-6 shadow-xl"
                onClick={() => window.dispatchEvent(new CustomEvent('openMiraAI'))}
                data-testid="chat-with-mira-btn"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Chat with Mira Now
              </Button>
            </div>

            <div className="relative">
              <div className="absolute -top-6 -right-6 w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl opacity-10 transform rotate-3"></div>
              <Card className="relative p-8 shadow-2xl">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-t-2xl -mx-8 -mt-8 mb-6">
                  <div className="flex items-center gap-3 text-white">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Mira AI</h3>
                      <p className="text-sm opacity-90">Online now</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white border-2 border-purple-100 rounded-2xl p-4 shadow-sm">
                    <p className="text-sm text-gray-700">
                      👋 Hi! I'm Mira! Planning a birthday for your pup? I can help you find the perfect cake!
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl p-4 shadow-sm max-w-[80%]">
                      <p className="text-sm">
                        Yes! My dog loves peanut butter. What do you recommend?
                      </p>
                    </div>
                  </div>
                  <div className="bg-white border-2 border-purple-100 rounded-2xl p-4 shadow-sm">
                    <p className="text-sm text-gray-700">
                      🎂 Perfect! I recommend our Pawsome 2.0 in Peanut Butter flavor - it's a customer favorite!
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-yellow-100 rounded-full mb-6">
              <TrendingUp className="w-5 h-5 text-yellow-600 mr-2" />
              <span className="text-yellow-600 text-sm font-semibold">Customer Favorites</span>
            </div>
            <h2 className="text-5xl font-black text-gray-900 mb-4">
              Bestselling Treats
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Loved by thousands of dogs and trusted by pet parents across India
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product, idx) => (
              <div
                key={product.id}
                className="transform transition-all duration-300 hover:-translate-y-2"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/cakes">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-purple-600 text-purple-600 hover:bg-purple-50 text-lg px-8 py-6"
              >
                View All Products
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-gray-900 mb-4">Shop by Category</h2>
            <p className="text-xl text-gray-600">Find exactly what your pup needs</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {categories.map((category) => (
              <Link key={category.id} to={`/${category.id}`}>
                <Card className="group overflow-hidden hover:shadow-2xl transition-all duration-500 cursor-pointer h-full transform hover:scale-105">
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                    <div className="absolute bottom-6 left-6 right-6">
                      <h3 className="text-white font-bold text-2xl mb-2">{category.name}</h3>
                      <p className="text-white/90 text-sm">{category.description}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - Premium Design */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-pink-100 rounded-full mb-6">
              <Heart className="w-5 h-5 text-pink-600 mr-2" />
              <span className="text-pink-600 text-sm font-semibold">Pet Parent Reviews</span>
            </div>
            <h2 className="text-5xl font-black text-gray-900 mb-4">
              Loved by Pet Parents
            </h2>
            <p className="text-xl text-gray-600">Real stories from our community</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="p-8 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full border-2 border-purple-200"
                  />
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500">{testimonial.location}</p>
                    <p className="text-xs text-purple-600 font-medium">Pet: {testimonial.petName}</p>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed">{testimonial.text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">Everything you need to know</p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id} className="bg-white border-2 border-gray-100 rounded-xl px-6 hover:border-purple-200 transition-colors">
                <AccordionTrigger className="text-left font-bold text-lg hover:text-purple-600">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">Still have questions?</p>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Sparkles className="w-4 h-4 mr-2" />
              Ask Mira AI
            </Button>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-purple-100 rounded-full mb-6">
              <Play className="w-5 h-5 text-purple-600 mr-2" />
              <span className="text-purple-600 text-sm font-semibold">Behind the Scenes</span>
            </div>
            <h2 className="text-5xl font-black text-gray-900 mb-4">
              See How We Bake with Love
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Every cake tells a story. Watch our journey from kitchen to celebration
            </p>
          </div>

          <VideoSection />

          <div className="text-center mt-12">
            <a
              href="https://www.instagram.com/the_doggy_bakery/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
            >
              <Instagram className="w-5 h-5" />
              Follow us for more videos
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Instagram Feed */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-pink-100 rounded-full mb-6">
              <Instagram className="w-5 h-5 text-pink-600 mr-2" />
              <span className="text-pink-600 text-sm font-semibold">@the_doggy_bakery</span>
            </div>
            <h2 className="text-5xl font-black text-gray-900 mb-4">
              Celebrations We've Crafted
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Real moments, real joy. See how we've helped pet parents celebrate their companions
            </p>
          </div>

          <InstagramFeed />

          <div className="text-center mt-12">
            <a
              href="https://www.instagram.com/the_doggy_bakery/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Instagram className="w-5 h-5 mr-2" />
                Follow on Instagram
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1679067652135-324b9535d288?w=1600"
          alt="Happy dog"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 via-pink-900/90 to-purple-900/90"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
            Ready to Make Your Pup's Day?
          </h2>
          <p className="text-2xl text-white/90 mb-12">
            Order fresh, premium treats made with love. Same-day delivery available!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link to="/cakes">
              <Button
                size="lg"
                className="bg-white text-purple-600 hover:bg-gray-100 text-xl px-10 py-8 shadow-2xl transform hover:scale-105 transition-all"
              >
                Shop Now
                <ArrowRight className="w-6 h-6 ml-2" />
              </Button>
            </Link>
            <Link to="/custom-cake">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white/10 backdrop-blur-sm text-xl px-10 py-8"
              >
                Design Custom Cake
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
