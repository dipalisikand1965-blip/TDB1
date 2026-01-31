import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { 
  Brain, Heart, Sparkles, Users, PawPrint, Quote, Crown,
  Target, Globe, MessageCircle, Lightbulb, Shield, ArrowRight,
  ChevronDown, Calendar, Award, Cake, Building2, Cpu
} from 'lucide-react';

// Timeline data for the heritage journey
const timelineData = [
  {
    year: '1990s',
    title: 'Les Concierges® Founded',
    description: 'Dipali establishes the foundation of concierge excellence — service defined by memory, anticipation, and quiet judgement.',
    icon: Crown,
    color: 'from-indigo-500 to-blue-600'
  },
  {
    year: '2010s',
    title: '1 Million+ Customers Served',
    description: 'Les Concierges® and Club Concierge® expand globally, serving over 1 million customers with premium concierge excellence.',
    icon: Globe,
    color: 'from-purple-500 to-indigo-600'
  },
  {
    year: '2015',
    title: 'The Doggy Bakery® Born',
    description: 'Aditya launches a handcrafted pet bakery celebrating birthdays, adoption milestones, and everyday joy moments.',
    icon: Cake,
    color: 'from-amber-500 to-orange-600'
  },
  {
    year: '2024',
    title: '45,000+ Pets Fed',
    description: 'The Doggy Bakery® becomes synonymous with celebrating pets across India — not just with products, but with meaning.',
    icon: Heart,
    color: 'from-pink-500 to-rose-600'
  },
  {
    year: '2026',
    title: 'The Doggy Company® Launches',
    description: 'Concierge expertise and lived pet experience converge into India\'s first Pet Life Operating System.',
    icon: Building2,
    color: 'from-violet-500 to-purple-600'
  },
  {
    year: '2026',
    title: 'Pet Soul™ & Mira® AI Go Live',
    description: 'Revolutionary pet intelligence technology that remembers, learns, and anticipates — bringing Mira\'s spirit to life.',
    icon: Cpu,
    color: 'from-emerald-500 to-teal-600'
  }
];

// Custom hook for scroll animations
const useScrollAnimation = () => {
  const [visibleSections, setVisibleSections] = useState(new Set());
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const sections = document.querySelectorAll('[data-animate]');
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  return visibleSections;
};

// Animated section wrapper component
const AnimatedSection = ({ id, children, className = '', delay = 0 }) => {
  const visibleSections = useScrollAnimation();
  const isVisible = visibleSections.has(id);
  
  return (
    <section
      id={id}
      data-animate
      className={`${className} transition-all duration-700 ease-out ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </section>
  );
};

// Timeline component
const HeritageTimeline = () => {
  const [activeIndex, setActiveIndex] = useState(null);
  const timelineRef = useRef(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.dataset.index);
            setActiveIndex((prev) => (prev === null || index > prev) ? index : prev);
          }
        });
      },
      { threshold: 0.5 }
    );

    const items = timelineRef.current?.querySelectorAll('[data-timeline-item]');
    items?.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={timelineRef} className="relative">
      {/* Vertical line */}
      <div className="absolute left-1/2 transform -translate-x-1/2 w-1 bg-gradient-to-b from-purple-200 via-pink-200 to-amber-200 h-full rounded-full hidden md:block" />
      
      {/* Timeline items */}
      <div className="space-y-8 md:space-y-0">
        {timelineData.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeIndex !== null && index <= activeIndex;
          const isEven = index % 2 === 0;
          
          return (
            <div
              key={index}
              data-timeline-item
              data-index={index}
              className={`relative flex flex-col md:flex-row items-center transition-all duration-700 ${
                isActive ? 'opacity-100' : 'opacity-40'
              }`}
            >
              {/* Left content (for even items on desktop) */}
              <div className={`w-full md:w-5/12 ${isEven ? 'md:pr-12 md:text-right' : 'md:order-3 md:pl-12'}`}>
                {(isEven || window.innerWidth < 768) && (
                  <Card 
                    className={`p-6 bg-white border-2 transition-all duration-500 hover:shadow-xl cursor-pointer ${
                      isActive ? 'border-purple-200 shadow-lg' : 'border-gray-100'
                    }`}
                    onClick={() => setActiveIndex(index)}
                  >
                    <div className="flex items-center gap-3 mb-3 md:justify-end">
                      <span className={`text-sm font-bold px-3 py-1 rounded-full bg-gradient-to-r ${item.color} text-white`}>
                        {item.year}
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                  </Card>
                )}
              </div>

              {/* Center icon */}
              <div className="relative z-10 md:w-2/12 flex justify-center my-4 md:my-8">
                <div 
                  className={`w-14 h-14 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg transition-all duration-500 ${
                    isActive ? 'scale-110 ring-4 ring-white ring-offset-2' : 'scale-100'
                  }`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Right content (for odd items on desktop) */}
              <div className={`w-full md:w-5/12 ${!isEven ? 'md:pl-12' : 'md:order-1 md:pr-12'} hidden md:block`}>
                {!isEven && (
                  <Card 
                    className={`p-6 bg-white border-2 transition-all duration-500 hover:shadow-xl cursor-pointer ${
                      isActive ? 'border-purple-200 shadow-lg' : 'border-gray-100'
                    }`}
                    onClick={() => setActiveIndex(index)}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`text-sm font-bold px-3 py-1 rounded-full bg-gradient-to-r ${item.color} text-white`}>
                        {item.year}
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                  </Card>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Navigation dots for smooth scrolling
const ScrollNav = () => {
  const sections = [
    { id: 'hero', label: 'Home' },
    { id: 'heritage', label: 'Heritage' },
    { id: 'timeline', label: 'Journey' },
    { id: 'purpose', label: 'Purpose' },
    { id: 'difference', label: 'Difference' },
    { id: 'concierge', label: 'Concierge' },
    { id: 'team', label: 'Team' },
    { id: 'leaders', label: 'Leaders' },
  ];

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="fixed right-6 top-1/2 transform -translate-y-1/2 z-50 hidden xl:flex flex-col gap-3">
      {sections.map((section) => (
        <button
          key={section.id}
          onClick={() => scrollToSection(section.id)}
          className="group flex items-center gap-2"
          title={section.label}
        >
          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium text-gray-600 bg-white px-2 py-1 rounded shadow-sm">
            {section.label}
          </span>
          <div className="w-3 h-3 rounded-full bg-purple-300 hover:bg-purple-600 hover:scale-125 transition-all duration-200 shadow-sm" />
        </button>
      ))}
    </div>
  );
};

const AboutPage = () => {
  // Smooth scroll behavior for the entire page
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <div className="min-h-screen bg-white" data-testid="about-page">
      <ScrollNav />
      
      {/* Hero Section */}
      <section id="hero" className="relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-purple-400 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-pink-400 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm mb-8 animate-fade-in">
            <Heart className="w-4 h-4 text-pink-400" />
            <span>About The Doggy Company®</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight animate-slide-up">
            Where a pet's life is
            <span className="block mt-2 bg-gradient-to-r from-pink-300 via-purple-300 to-yellow-300 bg-clip-text text-transparent">
              remembered, not just served.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-white/80 leading-relaxed max-w-3xl mx-auto animate-slide-up" style={{ animationDelay: '0.2s' }}>
            The Doggy Company® is India's Pet Life Operating System — a unified system built to understand, anticipate, and care for pets over the long term, not just in individual moments.
          </p>

          {/* Scroll indicator */}
          <button 
            onClick={() => document.getElementById('heritage')?.scrollIntoView({ behavior: 'smooth' })}
            className="mt-12 animate-bounce"
          >
            <ChevronDown className="w-8 h-8 text-white/50 hover:text-white transition-colors" />
          </button>
        </div>
      </section>

      {/* Core Belief Banner */}
      <section className="bg-purple-50 py-8 border-b border-purple-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-lg text-gray-700 leading-relaxed">
            We believe pet care should be <strong className="text-purple-700">continuous</strong>, <strong className="text-purple-700">intelligent</strong>, and <strong className="text-purple-700">emotionally resonant</strong> — not fragmented.
          </p>
        </div>
      </section>

      {/* Heritage Section */}
      <AnimatedSection id="heritage" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium mb-4">
              <Crown className="w-4 h-4" />
              Our Foundation
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Where We Come From — A Heritage of Care
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-sm md:text-base">
              Our foundation is rooted in lived experience and deep emotional understanding.
            </p>
          </div>

          {/* Heritage - Mobile Cards */}
          <div className="md:hidden space-y-4 mb-8">
            <Card className="p-5 bg-white border-2 border-purple-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Les Concierges® & Club Concierge®</h3>
                  <span className="text-purple-600 font-semibold text-xs">1 Million+ Customers Globally</span>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                Decades of concierge expertise — service defined by <strong className="text-gray-900">memory</strong>, <strong className="text-gray-900">anticipation</strong>, and <strong className="text-gray-900">quiet judgement</strong>.
              </p>
            </Card>
            <Card className="p-5 bg-white border-2 border-amber-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">The Doggy Bakery®</h3>
                  <span className="text-amber-600 font-semibold text-xs">45,000+ Pets Fed</span>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                A real, on-ground understanding of what pet parents truly care about — built through <strong className="text-gray-900">birthdays</strong>, <strong className="text-gray-900">adoption milestones</strong>, and <strong className="text-gray-900">everyday joy moments</strong>.
              </p>
            </Card>
          </div>

          {/* Heritage Table - Desktop Only */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 mb-8 transform hover:shadow-lg transition-shadow duration-300">
            <table className="w-full" data-testid="heritage-table">
              <thead className="bg-gradient-to-r from-purple-50 to-indigo-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 w-1/3">Heritage</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">What We Bring</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="font-semibold text-gray-900">Les Concierges® & Club Concierge®</div>
                    <div className="text-sm text-purple-600">1 Million+ Customers Globally</div>
                  </td>
                  <td className="px-6 py-5 text-gray-600">
                    Decades of concierge expertise — service defined by <strong className="text-gray-900">memory</strong>, <strong className="text-gray-900">anticipation</strong>, and <strong className="text-gray-900">quiet judgement</strong>. The same discipline that has served <strong className="text-gray-900">over 1 million customers</strong> across the globe in elite lifestyle ecosystems.
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="font-semibold text-gray-900">The Doggy Bakery®</div>
                    <div className="text-sm text-amber-600">45,000+ Pets Fed</div>
                  </td>
                  <td className="px-6 py-5 text-gray-600">
                    A real, on-ground understanding of what pet parents truly care about — built through <strong className="text-gray-900">birthdays</strong>, <strong className="text-gray-900">adoption milestones</strong>, and <strong className="text-gray-900">everyday joy moments</strong>.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-gradient-to-r from-slate-800 to-purple-900 rounded-xl p-6 md:p-8 text-center text-white transform hover:scale-[1.02] transition-transform duration-300">
            <p className="text-base md:text-lg leading-relaxed">
              These two worlds — <strong>concierge</strong> and <strong>lived pet experience</strong> — converge in The Doggy Company®.
            </p>
          </div>
        </div>
      </AnimatedSection>

      {/* Interactive Timeline Section */}
      <AnimatedSection id="timeline" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-4">
              <Calendar className="w-4 h-4" />
              Our Journey
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              The Heritage Timeline
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              From concierge excellence to pet life intelligence — trace the journey that led to The Doggy Company®.
            </p>
          </div>

          <HeritageTimeline />
        </div>
      </AnimatedSection>

      {/* Why We Exist */}
      <AnimatedSection id="purpose" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-medium mb-4">
              <Target className="w-4 h-4" />
              Our Purpose
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why We Exist
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="p-8 bg-white border-2 border-purple-100 transform hover:scale-105 hover:shadow-xl transition-all duration-300">
              <h3 className="text-xl font-bold text-gray-900 mb-4">The Truth About Pets</h3>
              <p className="text-gray-600 leading-relaxed">
                Pets are more than dependents.<br />
                They are <strong className="text-purple-700">family</strong>, <strong className="text-purple-700">identity</strong>, and <strong className="text-purple-700">daily engagement</strong>.
              </p>
            </Card>
            
            <Card className="p-8 bg-white border-2 border-red-100 transform hover:scale-105 hover:shadow-xl transition-all duration-300">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Today's Problem</h3>
              <p className="text-gray-600 leading-relaxed">
                Yet today's pet ecosystem is <strong className="text-red-600">fragmented</strong>, <strong className="text-red-600">transactional</strong>, <strong className="text-red-600">repetitive</strong>, and <strong className="text-red-600">memory-less</strong>.
              </p>
            </Card>
          </div>

          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-8 text-center text-white transform hover:shadow-2xl transition-shadow duration-300">
            <p className="text-xl font-medium mb-4">
              We created The Doggy Company® to change that.
            </p>
            <p className="text-white/90 leading-relaxed text-sm md:text-base">
              Here, care isn't a one-off service.<br />
              It is a <strong>relationship built on memory, context, and continuity</strong>.
            </p>
          </div>
        </div>
      </AnimatedSection>

      {/* What Makes Us Different */}
      <AnimatedSection id="difference" className="py-16 md:py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              Our Difference
            </div>
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">
              What Makes Us Different
            </h2>
          </div>

          {/* Differentiators - Mobile Cards */}
          <div className="md:hidden space-y-4">
            <Card className="p-5 bg-white border-2 border-purple-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Brain className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">A Living Profile</h3>
                  <span className="text-gray-500 text-xs">Not a Checklist</span>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                Every interaction builds a <strong className="text-purple-700">Pet Soul™</strong> profile that never forgets. Pet parents don't repeat themselves.
              </p>
            </Card>
            <Card className="p-5 bg-white border-2 border-blue-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Human-Led</h3>
                  <span className="text-gray-500 text-xs">Not Just Automated</span>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                Driven by people with <strong className="text-gray-900">judgement</strong>, <strong className="text-gray-900">empathy</strong>, and <strong className="text-gray-900">context</strong> — supported by technology, never replaced by it.
              </p>
            </Card>
            <Card className="p-5 bg-white border-2 border-pink-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Celebration as Culture</h3>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                From birthdays to adoption anniversaries, we treat moments with <strong className="text-gray-900">intention and meaning</strong> — not as transactions.
              </p>
            </Card>
            <Card className="p-5 bg-white border-2 border-amber-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Built by People Who've Lived It</h3>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                Inspired by the spirit of <strong className="text-purple-700">Mira</strong> — the quiet standard behind everything we build.
              </p>
            </Card>
          </div>

          {/* Differentiators Table - Desktop Only */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 transform hover:shadow-lg transition-shadow duration-300">
            <table className="w-full" data-testid="differentiators-table">
              <thead className="bg-gradient-to-r from-emerald-50 to-teal-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 w-1/3">Differentiator</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">What It Means</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Brain className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="font-semibold text-gray-900">A Living Profile</div>
                    </div>
                    <div className="text-sm text-gray-500 mt-1 ml-13">Not a Checklist</div>
                  </td>
                  <td className="px-6 py-5 text-gray-600">
                    Every interaction — grooming, celebration, travel planning, vet visits — builds a <strong className="text-purple-700">Pet Soul™</strong> profile that never forgets and always informs better care. Pet parents don't repeat themselves. Their pets are already understood.
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="font-semibold text-gray-900">Human-Led</div>
                    </div>
                    <div className="text-sm text-gray-500 mt-1 ml-13">Not Just Automated</div>
                  </td>
                  <td className="px-6 py-5 text-gray-600">
                    Our approach to care and concierge is driven by people with <strong className="text-gray-900">judgement</strong>, <strong className="text-gray-900">empathy</strong>, and <strong className="text-gray-900">context</strong> — supported by technology, never replaced by it.
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Heart className="w-5 h-5 text-pink-600" />
                      </div>
                      <div className="font-semibold text-gray-900">Celebration as Culture</div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-gray-600">
                    Celebration sits at the heart of pet life. From birthdays to adoption anniversaries, we treat moments with <strong className="text-gray-900">intention and meaning</strong> — not as transactions or add-ons.
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Lightbulb className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="font-semibold text-gray-900">Built by People Who've Lived It</div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-gray-600">
                    The Doggy Company® was inspired by the spirit of <strong className="text-purple-700">Mira</strong> — the quiet standard behind everything we build. Her influence shaped how we think about responsibility, noticing without being asked, and caring without condition.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-8 text-center">
            <Card className="inline-block p-6 bg-slate-900 text-white transform hover:scale-105 transition-transform duration-300">
              <p className="text-lg">
                This is not a service that transacts.<br />
                <strong className="text-purple-300">This is a system that remembers and nurtures.</strong>
              </p>
            </Card>
          </div>
        </div>
      </AnimatedSection>

      {/* Our Concierge */}
      <AnimatedSection id="concierge" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-4">
              <MessageCircle className="w-4 h-4" />
              Human-Led Care
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Concierge
            </h2>
          </div>

          <div className="prose prose-lg mx-auto text-gray-600 leading-relaxed mb-8">
            <p>
              At the heart of The Doggy Company® is a human-led concierge® team trained not just to respond, but to <strong className="text-gray-900">understand</strong>.
            </p>
            <p>
              Our concierges are chosen for <strong className="text-gray-900">judgement</strong>, <strong className="text-gray-900">empathy</strong>, and <strong className="text-gray-900">calm decision-making</strong> — the qualities that matter most when care is personal and situations are unpredictable. They don't work from scripts. They work from context, memory, and responsibility.
            </p>
            <p>
              Each interaction they handle enriches a pet's living profile, ensuring continuity while helping the system learn.
            </p>
          </div>

          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-white transform hover:shadow-2xl transition-shadow duration-300">
            <p className="text-center text-lg mb-4">
              This is concierge as it was always meant to be:<br />
              <strong>quietly present, deeply informed, and trusted over time.</strong>
            </p>
            <div className="flex items-center justify-center gap-2 text-indigo-200">
              <Brain className="w-5 h-5" />
              <p className="text-sm">Mira® learns from our concierges — and our concierges are empowered by Mira®.</p>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Our Team (And Their Dogs) */}
      <AnimatedSection id="team" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium mb-4">
              <PawPrint className="w-4 h-4" />
              Pet Parents First
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Team (And Their Dogs)
            </h2>
          </div>

          <div className="prose prose-lg mx-auto text-gray-600 leading-relaxed mb-12">
            <p>
              The Doggy Company® is built by a team that <strong className="text-gray-900">lives the life we design</strong>.
            </p>
            <p>
              Behind every line of code, every concierge interaction, and every celebration is a group of people who are, first and foremost, pet parents themselves. Our dogs sit in on meetings, shape decisions, test experiences, and remind us daily of why care must be thoughtful, patient, and real.
            </p>
            <p>
              Many of the insights that power Pet Soul™ and Mira® come not from theory, but from <strong className="text-gray-900">lived routines</strong> — morning walks, vet visits, anxious travel days, favourite treats, and quiet evenings at home.
            </p>
          </div>

          <div className="text-center">
            <Card className="inline-block px-8 py-4 bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200 transform hover:scale-105 transition-transform duration-300">
              <p className="text-lg font-semibold text-gray-900">
                Our dogs are not mascots.<br />
                <span className="text-orange-600">They are co-creators.</span>
              </p>
            </Card>
          </div>
        </div>
      </AnimatedSection>

      {/* The People Behind the Philosophy */}
      <AnimatedSection id="leaders" className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-4">
              <Users className="w-4 h-4" />
              Leadership
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              The People Behind the Philosophy
            </h2>
          </div>

          {/* Leaders - Mobile Cards */}
          <div className="md:hidden space-y-6" data-testid="leaders-mobile">
            {/* Mira Card */}
            <Card className="p-6 bg-white border-2 border-purple-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-xl">Mira</h3>
                  <span className="text-purple-600 font-semibold text-sm">The Spirit</span>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                The quiet spirit behind everything we build. She believed that care is shown not in grand gestures, but in <strong className="text-gray-900">noticing</strong>, <strong className="text-gray-900">remembering</strong>, and <strong className="text-gray-900">showing up without being asked</strong>. Mira is not just a name — she is the standard of care that guides The Doggy Company®.
              </p>
            </Card>

            {/* Dipali Card */}
            <Card className="p-6 bg-white border-2 border-indigo-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center flex-shrink-0">
                  <Crown className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-xl">Dipali</h3>
                  <span className="text-indigo-600 font-semibold text-sm">The Concierge Mind</span>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                Brings decades of experience designing concierge ecosystems where relationships matter more than transactions. As the force behind <strong className="text-gray-900">Les Concierges®</strong> and <strong className="text-gray-900">Club Concierge®</strong>, she has served <strong className="text-gray-900">over 1 million customers globally</strong>, shaping service models built on memory, judgement, and anticipation.
              </p>
            </Card>

            {/* Aditya Card */}
            <Card className="p-6 bg-white border-2 border-amber-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center flex-shrink-0">
                  <PawPrint className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-xl">Aditya</h3>
                  <span className="text-amber-600 font-semibold text-sm">The Pet Parent's Lens</span>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                Brings a lived understanding of pet parents and their emotional rhythms. Through <strong className="text-gray-900">The Doggy Bakery®</strong>, he has fed over <strong className="text-gray-900">45,000 pets</strong> across birthdays, adoption milestones, and everyday moments that matter.
              </p>
            </Card>
          </div>

          {/* Leaders Table - Desktop Only */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 bg-white transform hover:shadow-lg transition-shadow duration-300">
            <table className="w-full" data-testid="leaders-table">
              <thead className="bg-gradient-to-r from-purple-50 to-pink-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 w-1/4">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 w-1/4">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Philosophy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Heart className="w-6 h-6 text-white" />
                      </div>
                      <span className="font-bold text-gray-900 text-lg">Mira</span>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <span className="text-purple-600 font-semibold">The Spirit</span>
                  </td>
                  <td className="px-6 py-6 text-gray-600">
                    The quiet spirit behind everything we build. She believed that care is shown not in grand gestures, but in <strong className="text-gray-900">noticing</strong>, <strong className="text-gray-900">remembering</strong>, and <strong className="text-gray-900">showing up without being asked</strong>. Mira is not just a name — she is the standard of care that guides The Doggy Company®.
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Crown className="w-6 h-6 text-white" />
                      </div>
                      <span className="font-bold text-gray-900 text-lg">Dipali</span>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <span className="text-indigo-600 font-semibold">The Concierge Mind</span>
                  </td>
                  <td className="px-6 py-6 text-gray-600">
                    Brings decades of experience designing concierge ecosystems where relationships matter more than transactions. As the force behind <strong className="text-gray-900">Les Concierges®</strong> and <strong className="text-gray-900">Club Concierge®</strong>, she has served <strong className="text-gray-900">over 1 million customers globally</strong>, shaping service models built on memory, judgement, and anticipation. Her work is grounded in one truth: the best service is never reactive — it <strong className="text-gray-900">listens</strong>, <strong className="text-gray-900">remembers</strong>, and <strong className="text-gray-900">acts before the question is fully formed</strong>.
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <PawPrint className="w-6 h-6 text-white" />
                      </div>
                      <span className="font-bold text-gray-900 text-lg">Aditya</span>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <span className="text-amber-600 font-semibold">The Pet Parent's Lens</span>
                  </td>
                  <td className="px-6 py-6 text-gray-600">
                    Brings a lived understanding of pet parents and their emotional rhythms. Through <strong className="text-gray-900">The Doggy Bakery®</strong>, he has fed over <strong className="text-gray-900">45,000 pets</strong> across birthdays, adoption milestones, and everyday moments that matter. His experience shaped a simple belief: pets are cared for through <strong className="text-gray-900">presence</strong>, <strong className="text-gray-900">timing</strong>, and <strong className="text-gray-900">feeling seen</strong> — not transactions.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600 text-sm md:text-lg">
              Together, these perspectives shape a platform built not around services, but around <strong className="text-purple-700">relationships</strong> — with pets at the centre.
            </p>
          </div>
        </div>
      </AnimatedSection>

      {/* Where We Are Today & Where We're Headed */}
      <AnimatedSection id="future" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Where We Are Today */}
            <Card className="p-8 bg-gradient-to-br from-slate-50 to-gray-100 border-0 transform hover:scale-105 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-4">
                <Globe className="w-4 h-4" />
                Present
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Where We Are Today</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Launching in <strong className="text-gray-900">2026</strong>, The Doggy Company® brings together decades of experience — <strong className="text-gray-900">1 million+ customers served</strong> through our concierge heritage and <strong className="text-gray-900">45,000+ pets fed</strong> through The Doggy Bakery®.
              </p>
              <p className="text-gray-600 leading-relaxed">
                We are building not just experiences, but <strong className="text-purple-700">long-term relationships</strong> between pet, parent, and platform.
              </p>
            </Card>

            {/* Where We're Headed */}
            <Card className="p-8 bg-gradient-to-br from-purple-50 to-indigo-100 border-0 transform hover:scale-105 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-2 text-sm font-medium text-purple-600 mb-4">
                <ArrowRight className="w-4 h-4" />
                Future
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Where We're Headed</h3>
              <p className="text-gray-600 leading-relaxed">
                The Doggy Company® is becoming a <strong className="text-gray-900">platform partner of choice</strong> for forward-thinking ecosystems — from financial institutions to lifestyle brands — who understand that <strong className="text-purple-700">emotional relevance</strong> and <strong className="text-purple-700">daily engagement</strong> are the future of loyalty.
              </p>
            </Card>
          </div>
        </div>
      </AnimatedSection>

      {/* Our Core Belief */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-sm font-medium mb-8">
            <Shield className="w-4 h-4 text-purple-400" />
            Our Core Belief
          </div>
          
          <Quote className="w-10 h-10 mx-auto text-purple-400 mb-6 animate-pulse" />
          
          <div className="space-y-4 mb-8">
            <p className="text-2xl md:text-3xl font-medium leading-relaxed">
              <span className="text-purple-300">Great care remembers.</span>
            </p>
            <p className="text-2xl md:text-3xl font-medium leading-relaxed">
              <span className="text-gray-400">Good service reacts.</span>
            </p>
          </div>
          
          <p className="text-xl text-white/80 leading-relaxed">
            The Doggy Company® is built to do both —<br />
            <strong className="text-white">intelligently, personally, and over a lifetime.</strong>
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="max-w-3xl mx-auto px-4 text-center text-white">
          <h2 className="text-xl md:text-2xl font-bold mb-4">
            Ready to Experience Care That Remembers?
          </h2>
          <p className="text-white/80 mb-8 text-sm md:text-base">
            Join thousands of pet parents who've chosen a better way.
          </p>
          <Link to="/membership">
            <Button className="bg-white text-purple-700 hover:bg-gray-100 px-6 md:px-8 py-4 md:py-6 text-base md:text-lg font-semibold transform hover:scale-105 transition-transform duration-200" data-testid="about-cta-button">
              <PawPrint className="w-5 h-5 mr-2" />
              Explore Pet Life Pass
            </Button>
          </Link>
        </div>
      </section>

      {/* Global animations CSS */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slide-up {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
        
        .animate-slide-up {
          animation: slide-up 0.6s ease-out forwards;
          opacity: 0;
        }
        
        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
};

export default AboutPage;
