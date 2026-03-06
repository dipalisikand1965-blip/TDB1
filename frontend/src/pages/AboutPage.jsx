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
  mira: 'https://customer-assets.emergentagent.com/job_2dad3d7e-c3ab-4896-a445-d39e2953ce1d/artifacts/hfy5z95e_Mira%20Aunty.png',
  team: 'https://customer-assets.emergentagent.com/job_pet-soul-platform/artifacts/q0alj5za_dog-1194087_1920%20%281%29.jpg',
};

// Timeline data for the heritage journey
const timelineData = [
  {
    year: '1998',
    title: 'LesConcierges® Founded',
    description: 'Dipali Sikand builds LesConcierges® — with Mrs. Mira Sikand as the quiet force behind the philosophy of care.',
    icon: Crown,
    color: 'from-indigo-500 to-blue-600'
  },
  {
    year: '2008',
    title: 'Club Concierge® Expands',
    description: 'Dipali carries the legacy forward globally, serving over 1 million customers with premium Concierge® excellence.',
    icon: Globe,
    color: 'from-purple-500 to-indigo-600'
  },
  {
    year: '2020',
    title: 'The Doggy Bakery® Born',
    description: 'Aditya launches handcrafted pet treats — celebrating pets like family, milestone by milestone. Grandma Mira\'s hands in the early work.',
    icon: Cake,
    color: 'from-amber-500 to-orange-600'
  },
  {
    year: '2024',
    title: '45,000+ Pets Celebrated',
    description: 'The Doggy Bakery® becomes synonymous with celebrating pets across India — not just with products, but with meaning.',
    icon: Heart,
    color: 'from-pink-500 to-rose-600'
  },
  {
    year: '2025',
    title: 'The Doggy Company® Launches',
    description: 'Three decades of Concierge® expertise and lived pet experience converge into India\'s first Pet Life Operating System.',
    icon: Building2,
    color: 'from-violet-500 to-purple-600'
  },
  {
    year: '2025',
    title: 'Pet Soul™ & Mira AI Go Live',
    description: 'Dipali\'s concierge lineage meets pet parenting — with Mira\'s spirit inside it. Every recommendation remembered, not generated.',
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
                    Join Now
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
                    It started with <strong className="text-white">Dipali Sikand</strong> — and the 
                    concierge belief that real service means remembering, anticipating, and caring before being asked.
                  </p>
                  <p>
                    Behind her was <strong className="text-amber-300">Mrs. Mira Sikand</strong>: 
                    the spirit, the standard, and the quiet force that shaped how Dipali understood 
                    what care really looks like in practice.
                  </p>
                  <p>
                    <strong className="text-white">Dipali</strong> carried that legacy forward through 
                    LesConcierges® and Club Concierge® — three decades of service excellence, serving millions, 
                    with one non-negotiable principle: <em className="text-purple-300">every yes must feel personal.</em>
                  </p>
                  <p>
                    <strong className="text-white">Aditya</strong> built The Doggy Bakery®, celebrating 
                    45,000+ pets — not just baking treats, but baking meaning into milestones. 
                    And yes, Grandma Mira's hands were in those early batches.
                  </p>
                  <p>
                    When they looked at the pet industry, they saw what was missing: 
                    <em className="text-purple-300"> a system that truly knows your pet</em>. 
                    Not just sells to them. Knows them.
                  </p>
                  <p>
                    That's why <strong className="text-white">The Doggy Company®</strong> was born — 
                    to build a pet-first world where everything is personalised to the life you share: 
                    what your dog eats, loves, needs, fears, enjoys, and is growing into.
                  </p>
                  <p className="text-white font-medium">
                    And that's why we're building Mira AI — to bring concierge-grade memory and judgement 
                    into pet parenting, so every recommendation feels like it came from someone who 
                    genuinely understands your pet.
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

        {/* THE PHILOSOPHY - The Heart of Everything */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0612] via-purple-950/20 to-[#0a0612]" />
          
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <span className="inline-block px-4 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-300 text-sm mb-6">
                Our Philosophy
              </span>
              
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-8">
                A dog is not in your life.<br />
                <span className="bg-gradient-to-r from-amber-300 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                  You are in theirs.
                </span>
              </h2>
              
              <div className="space-y-6 text-white/70 leading-relaxed text-left">
                <p className="text-lg">
                  They don't experience ownership. They experience <em className="text-white">relationship</em>. 
                  They experience being known — or not known. Being seen — or not seen. 
                  Being loved with accuracy — or loved carelessly.
                </p>
                
                <p>
                  Every other pet company is built around the human's convenience. 
                  What <em>you</em> want to buy. When <em>you</em> want to book. How <em>you</em> want to be served.
                </p>
                
                <p className="text-white font-medium">
                  We built something different. Something built around your dog's inner life. 
                  What they prefer. What lights them up. What they have forgiven. 
                  Who they <em>are</em> — not what breed they are.
                </p>
                
                <div className="py-6 border-l-2 border-purple-500/50 pl-6 my-8 bg-white/5 rounded-r-lg">
                  <p className="text-white/80 italic">
                    "A dog cannot speak, but they can be known. Love without attention is just affection. 
                    And they don't live long enough — so know them better, while you have them."
                  </p>
                </div>
                
                <p className="text-center text-lg text-white">
                  They can't tell you what they need.<br />
                  <span className="text-purple-300">So we built something that remembers everything,</span><br />
                  <span className="text-pink-300">so you can love them the way they deserve.</span>
                </p>
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
                <div className="relative flex justify-center">
                  {/* Ethereal halo effect - outer glow */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-80 h-80 bg-gradient-to-r from-amber-400/40 via-purple-400/30 to-pink-400/40 rounded-full blur-3xl animate-pulse" />
                  </div>
                  {/* Secondary halo ring */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-72 h-72 bg-gradient-to-br from-amber-300/50 to-orange-400/30 rounded-full blur-2xl" />
                  </div>
                  {/* Inner warm glow */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-64 h-64 bg-amber-200/20 rounded-full blur-xl" />
                  </div>
                  
                  {/* Photo with ethereal border */}
                  <div className="relative">
                    <div className="absolute -inset-2 bg-gradient-to-r from-amber-400 via-purple-300 to-pink-400 rounded-full blur opacity-60" />
                    <div className="absolute -inset-1 bg-gradient-to-br from-amber-200/80 to-orange-300/60 rounded-full" />
                    <img 
                      src={BRAND_IMAGES.mira} 
                      alt="Mrs. Mira Sikand - The Soul Behind Mira AI" 
                      className="relative rounded-full w-64 h-64 object-cover border-4 border-amber-100/50 shadow-2xl"
                      style={{
                        filter: 'drop-shadow(0 0 30px rgba(251, 191, 36, 0.4)) drop-shadow(0 0 60px rgba(192, 132, 252, 0.2))'
                      }}
                    />
                  </div>
                  
                  {/* Floating quote below */}
                  <div className="absolute -bottom-8 left-4 right-4 bg-[#1a0a2e]/90 backdrop-blur-lg rounded-2xl p-4 border border-amber-400/30">
                    <Quote className="w-6 h-6 text-amber-400 mb-2" />
                    <p className="text-white/80 text-sm italic">
                      "The quiet force. The spirit behind the service."
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
                    Mira is <strong className="text-amber-300">Mrs. Mira Sikand</strong> — 
                    <span className="text-white">Dipali's mother</span> and 
                    <span className="text-pink-300"> Aditya and Diya's beloved grandmother</span>.
                  </p>
                  <p>
                    She wasn't the headline. She was the <em className="text-purple-300">quiet force</em> — 
                    the person whose instincts, standards, and way of looking after people shaped the kind 
                    of service that became LesConcierges® and Club Concierge®.
                  </p>
                  <p>
                    Long before search engines existed, she was a <em className="text-purple-300">living reference desk</em>: 
                    an encyclopedia, a solutionist, and the warm force behind every "yes" the Concierge® team delivered.
                    Her wisdom still guides every decision we make.
                  </p>
                  <p>
                    At <strong className="text-pink-300">The Doggy Bakery®</strong>, Grandma Mira's hands were 
                    right there in the early work — part of the care, the making, the doing. 
                    This wasn't just inspiration in theory.
                  </p>
                  <p>
                    That is why <strong className="text-white">Mira AI</strong> exists on The Doggy Company®: 
                    <span className="text-white font-medium"> to bring Dipali's concierge lineage into pet parenting — 
                    with Mira's spirit inside it — so every recommendation feels remembered, not generated.</span>
                  </p>
                  <p className="text-white font-medium border-l-4 border-amber-400 pl-4 mt-6">
                    "Mira was the spirit. Dipali was the builder."
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
            {/* Navigation Links */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
              <div>
                <h4 className="text-white font-semibold mb-4">Explore</h4>
                <div className="space-y-2">
                  <Link to="/" className="block text-white/50 hover:text-white transition-colors text-sm">Home</Link>
                  <Link to="/join" className="block text-white/50 hover:text-white transition-colors text-sm">Join Mira®</Link>
                  <Link to="/login" className="block text-white/50 hover:text-white transition-colors text-sm">Member Login</Link>
                </div>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">Services</h4>
                <div className="space-y-2">
                  <Link to="/mira-demo" className="block text-white/50 hover:text-white transition-colors text-sm">Meet Mira AI</Link>
                  <Link to="/products" className="block text-white/50 hover:text-white transition-colors text-sm">Shop Products</Link>
                  <Link to="/services" className="block text-white/50 hover:text-white transition-colors text-sm">Concierge® Services</Link>
                </div>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">Heritage</h4>
                <div className="space-y-2">
                  <a href="https://thedoggybakery.com" target="_blank" rel="noopener noreferrer" className="block text-white/50 hover:text-white transition-colors text-sm">The Doggy Bakery®</a>
                  <a href="https://clubconcierge.in" target="_blank" rel="noopener noreferrer" className="block text-white/50 hover:text-white transition-colors text-sm">Club Concierge®</a>
                  <a href="https://lesconcierges.co.in" target="_blank" rel="noopener noreferrer" className="block text-white/50 hover:text-white transition-colors text-sm">LesConcierges®</a>
                </div>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">Connect</h4>
                <div className="space-y-2">
                  <a href="mailto:hello@thedoggycompany.in" className="block text-white/50 hover:text-white transition-colors text-sm">hello@thedoggycompany.in</a>
                  <a href="https://instagram.com/thedoggybakery" target="_blank" rel="noopener noreferrer" className="block text-white/50 hover:text-white transition-colors text-sm">Instagram</a>
                  <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer" className="block text-white/50 hover:text-white transition-colors text-sm">WhatsApp</a>
                </div>
              </div>
            </div>
            
            {/* Bottom Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <PawPrint className="w-5 h-5 text-white" />
                </div>
                <span className="text-white font-bold">thedoggycompany</span>
              </div>
              
              <div className="flex items-center gap-6 text-white/50 text-sm">
                <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy</Link>
                <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
                <Link to="/about" className="hover:text-white transition-colors">About</Link>
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
