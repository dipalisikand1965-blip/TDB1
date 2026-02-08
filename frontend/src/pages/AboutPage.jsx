import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { 
  Heart, Sparkles, PawPrint, Crown, ArrowRight,
  Globe, Cake, Building2, Cpu, Users, Quote,
  Calendar, Target, Shield
} from 'lucide-react';
import { motion } from 'framer-motion';
import SEOHead from '../components/SEOHead';

// Brand images
const BRAND_IMAGES = {
  founder1: 'https://customer-assets.emergentagent.com/job_pet-soul-platform/artifacts/4oryz05r_shutterstock_131282603%20%281%29.jpg',
  founder2: 'https://customer-assets.emergentagent.com/job_pet-soul-platform/artifacts/s4qmsach_shutterstock_199063937.jpg',
  mira: 'https://customer-assets.emergentagent.com/job_pet-soul-platform/artifacts/einpahqm_dog-813103%20%281%29.jpg',
  team: 'https://customer-assets.emergentagent.com/job_pet-soul-platform/artifacts/q0alj5za_dog-1194087_1920%20%281%29.jpg',
};

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
    description: 'Concierge® expertise and lived pet experience converge into India\'s first Pet Life Operating System.',
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

// Values
const values = [
  {
    icon: Heart,
    title: 'Love First',
    description: 'Every decision starts with what\'s best for the pet. Not the business. Not the convenience. The pet.',
    color: 'from-pink-500 to-rose-500'
  },
  {
    icon: Shield,
    title: 'Trust Always',
    description: 'We handle your pet\'s care like they\'re our own. Because in many ways, they are.',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: Sparkles,
    title: 'Magic in Details',
    description: 'We remember the small things. The favorite treat. The quirky habit. The special date.',
    color: 'from-purple-500 to-indigo-500'
  },
  {
    icon: Users,
    title: 'Human + AI',
    description: 'Technology amplifies care, never replaces it. Real humans, real Concierges®, real love.',
    color: 'from-green-500 to-emerald-500'
  }
];

const AboutPage = () => {
  return (
    <>
      <SEOHead 
        title="About Us - The Doggy Company | Our Story"
        description="Meet the team behind India's first Pet Life Operating System. Born from concierge heritage and deep pet love."
      />
      
      <div className="min-h-screen bg-gradient-to-b from-[#0f0720] via-[#1a0a2e] to-[#0f0720]">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0f0720]/80 backdrop-blur-lg border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <PawPrint className="w-5 h-5 text-white" />
                </div>
                <span className="text-white font-bold text-lg">thedoggycompany</span>
              </Link>
              <div className="flex items-center gap-3">
                <Link to="/login">
                  <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10">
                    Login
                  </Button>
                </Link>
                <Link to="/join">
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                    Join Free
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-6">
                <Heart className="w-4 h-4 text-pink-400" />
                <span className="text-white/70 text-sm">Our Story</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                Born from{' '}
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
                  Concierge® Heritage
                </span>
                <br />
                Built with{' '}
                <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                  Pet Love
                </span>
              </h1>
              
              <p className="text-lg text-white/60 max-w-3xl mx-auto leading-relaxed">
                We're not a pet startup that learned about service. We're a service family that fell in love with pets. 
                Three decades of Concierge® excellence meets a lifetime of pet parenting — 
                creating something the world hasn't seen before.
              </p>
            </motion.div>
          </div>
        </section>

        {/* The Origin Story */}
        <section className="py-20 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="grid lg:grid-cols-2 gap-12 items-center"
            >
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full mb-6">
                  <Crown className="w-4 h-4 text-purple-400" />
                  <span className="text-purple-300 text-sm">The Origin</span>
                </div>
                
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                  Why We Built This
                </h2>
                
                <div className="space-y-4 text-white/70 leading-relaxed">
                  <p>
                    <strong className="text-white">Dipali</strong> spent 30 years building Les Concierges® — 
                    a company that understood one truth: real service means remembering, anticipating, 
                    and caring before being asked.
                  </p>
                  <p>
                    <strong className="text-white">Aditya</strong> built The Doggy Bakery® celebrating 
                    45,000+ pets with handcrafted joy — not just baking treats, but baking meaning into 
                    every milestone.
                  </p>
                  <p>
                    When they looked at the pet industry, they saw something missing: 
                    <em className="text-purple-300"> a system that truly knows your pet</em>. 
                    Not just sells to them. Knows them.
                  </p>
                  <p className="text-white font-medium">
                    That's why The Doggy Company® was born.
                  </p>
                </div>
              </div>
              
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur-lg opacity-30" />
                <img 
                  src={BRAND_IMAGES.founder1} 
                  alt="Founders" 
                  className="relative rounded-3xl border border-white/10 w-full"
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-20 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-pink-900/20" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Our Heritage Journey
              </h2>
              <p className="text-white/60 text-lg max-w-2xl mx-auto">
                30 years of building relationships. Now, we're building them for pets.
              </p>
            </motion.div>
            
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-purple-500 via-pink-500 to-indigo-500 hidden lg:block" />
              
              <div className="space-y-12">
                {timelineData.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex flex-col lg:flex-row items-center gap-8 ${
                      index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                    }`}
                  >
                    <div className={`flex-1 ${index % 2 === 0 ? 'lg:text-right' : 'lg:text-left'}`}>
                      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                        <span className="text-sm text-purple-400 font-mono">{item.year}</span>
                        <h3 className="text-xl font-semibold text-white mt-2 mb-2">{item.title}</h3>
                        <p className="text-white/60 text-sm">{item.description}</p>
                      </div>
                    </div>
                    
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                      <item.icon className="w-8 h-8 text-white" />
                    </div>
                    
                    <div className="flex-1 hidden lg:block" />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Mira's Story */}
        <section className="py-20 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="order-2 lg:order-1"
              >
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl blur-lg opacity-30" />
                  <img 
                    src={BRAND_IMAGES.mira} 
                    alt="Mira" 
                    className="relative rounded-3xl border border-white/10 w-full"
                  />
                  
                  {/* Floating quote */}
                  <div className="absolute bottom-4 left-4 right-4 bg-[#1a0a2e]/90 backdrop-blur-lg rounded-2xl p-4 border border-white/10">
                    <Quote className="w-6 h-6 text-amber-400 mb-2" />
                    <p className="text-white/80 text-sm italic">
                      "Every pet has a soul. We just needed to build the technology to understand it."
                    </p>
                  </div>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="order-1 lg:order-2"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-full mb-6">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-300 text-sm">The Soul Behind the Name</span>
                </div>
                
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                  Who is Mira?
                </h2>
                
                <div className="space-y-4 text-white/70 leading-relaxed">
                  <p>
                    Mira was a real dog. <strong className="text-amber-300">A Golden Retriever who taught us 
                    what unconditional love looks like.</strong>
                  </p>
                  <p>
                    She had her quirks — a specific spot she loved to be scratched, a treat she'd do 
                    anything for, a particular way she'd greet us at the door.
                  </p>
                  <p>
                    When we built our AI, we didn't want a chatbot. We wanted something that understood 
                    pets the way Mira taught us to understand them — 
                    <em className="text-purple-300"> with patience, memory, and love</em>.
                  </p>
                  <p className="text-white font-medium">
                    Mira® AI carries her spirit forward. Every interaction is guided by one question: 
                    "What would Mira do?"
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Our Values */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                What We Believe
              </h2>
              <p className="text-white/60 text-lg max-w-2xl mx-auto">
                Four principles that guide every decision we make.
              </p>
            </motion.div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group"
                >
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 h-full hover:border-white/20 transition-all duration-300">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${value.color} flex items-center justify-center mb-4`}>
                      <value.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{value.title}</h3>
                    <p className="text-white/60 text-sm leading-relaxed">{value.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/50 to-pink-900/50" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/30 rounded-full blur-3xl" />
          
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                Ready to experience the difference?
              </h2>
              
              <p className="text-white/60 text-lg mb-8 max-w-2xl mx-auto">
                Join thousands of pet parents who've discovered what it means to have a true partner in pet care.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/join">
                  <Button size="lg" className="bg-white text-purple-900 hover:bg-white/90 px-8 py-6 text-lg rounded-xl">
                    Meet Mira® <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/">
                  <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 py-6 text-lg rounded-xl">
                    Back to Home
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <PawPrint className="w-5 h-5 text-white" />
                </div>
                <span className="text-white font-bold">thedoggycompany</span>
              </div>
              
              <div className="flex items-center gap-6 text-white/50 text-sm">
                <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
                <a href="mailto:hello@thedoggycompany.in" className="hover:text-white transition-colors">Contact</a>
              </div>
              
              <p className="text-white/30 text-sm">
                © 2025 The Doggy Company®. Made with <Heart className="w-4 h-4 inline text-pink-500" /> for pets everywhere.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default AboutPage;
