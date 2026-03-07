/**
 * Pet Wrapped Welcome Landing Page
 * The conversion point: "Does your dog have a Soul Profile yet?"
 * Route: /wrapped-welcome
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Sparkles, Star, ArrowRight, Check } from 'lucide-react';

const WrappedWelcomePage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [petName, setPetName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleGetStarted = async (e) => {
    e.preventDefault();
    // Navigate to soul profile creation
    navigate(`/soul-profile?pet=${encodeURIComponent(petName)}&email=${encodeURIComponent(email)}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0618] overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-rose-500/15 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[150px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 py-6 px-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link to="/" className="font-serif text-xl text-amber-400">
            The Doggy Company
          </Link>
          <Link 
            to="/login" 
            className="text-purple-300 hover:text-white text-sm transition"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          {/* Pet Wrapped Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-900/50 border border-purple-500/30 rounded-full mb-8">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-purple-200 text-sm">From Pet Wrapped</span>
          </div>

          {/* Hero */}
          <h1 className="font-serif text-4xl md:text-6xl text-white mb-6 leading-tight">
            Does your dog have a{' '}
            <span className="text-amber-400 italic">Soul Profile</span> yet?
          </h1>
          
          <p className="text-purple-200 text-lg md:text-xl mb-12 max-w-xl mx-auto leading-relaxed">
            51 questions that transform how you see your dog. 
            Not what they eat. Not where they sleep. 
            <em className="text-rose-300"> Who they are.</em>
          </p>

          {/* Sample Questions */}
          <div className="grid md:grid-cols-2 gap-4 mb-12 text-left max-w-xl mx-auto">
            {[
              "What has your dog forgiven you for?",
              "What do they do when you cry?",
              "What makes their eyes light up?",
              "What have they seen you through?"
            ].map((question, i) => (
              <div 
                key={i}
                className="flex items-start gap-3 p-4 bg-white/5 border border-purple-500/20 rounded-xl"
              >
                <Heart className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
                <span className="text-purple-100 text-sm italic">"{question}"</span>
              </div>
            ))}
          </div>

          {/* CTA Form */}
          <div className="bg-gradient-to-br from-purple-900/50 to-rose-900/30 border border-purple-500/30 rounded-3xl p-8 max-w-md mx-auto">
            <h2 className="font-serif text-2xl text-white mb-2">
              Create Your Dog's Soul Profile
            </h2>
            <p className="text-purple-300 text-sm mb-6">
              Free forever. Takes 10 minutes. Changes everything.
            </p>
            
            <form onSubmit={handleGetStarted} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Your dog's name"
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-purple-500/30 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:border-amber-400 transition"
                />
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-purple-500/30 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:border-amber-400 transition"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-amber-500 hover:bg-amber-400 text-[#120826] font-semibold rounded-xl transition disabled:opacity-50"
              >
                {submitting ? (
                  'Creating...'
                ) : (
                  <>
                    🐾 Start {petName ? `${petName}'s` : 'Their'} Soul Profile
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Benefits */}
          <div className="mt-16 grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              {
                icon: Star,
                title: "Soul Score",
                desc: "See how deeply you know your dog, from 0-100%"
              },
              {
                icon: Sparkles,
                title: "Meet Mira",
                desc: "An AI companion who remembers everything about your dog"
              },
              {
                icon: Heart,
                title: "Pet Wrapped",
                desc: "Get your own beautiful year-in-review to share"
              }
            ].map((benefit, i) => (
              <div key={i} className="text-center p-6">
                <div className="w-12 h-12 mx-auto mb-4 bg-purple-900/50 border border-purple-500/30 rounded-xl flex items-center justify-center">
                  <benefit.icon className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">{benefit.title}</h3>
                <p className="text-purple-300 text-sm">{benefit.desc}</p>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="mt-16 max-w-lg mx-auto">
            <blockquote className="text-purple-200 italic text-lg leading-relaxed">
              "The Soul Profile questions made me cry. I thought I knew my dog. 
              I didn't know I could know them this deeply."
            </blockquote>
            <div className="mt-4 text-purple-400 text-sm">
              — A Doggy Bakery Customer
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-4 border-t border-purple-500/10">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-purple-400 text-sm mb-4">
            Built in memory of Mystique · For every dog who deserves to be truly known
          </p>
          <div className="flex justify-center gap-6 text-purple-500 text-xs">
            <Link to="/" className="hover:text-purple-300">Home</Link>
            <Link to="/about" className="hover:text-purple-300">About</Link>
            <Link to="/privacy" className="hover:text-purple-300">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WrappedWelcomePage;
