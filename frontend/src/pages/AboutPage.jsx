import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { 
  Brain, Heart, Sparkles, Users, PawPrint, Quote, Crown,
  Target, Globe, MessageCircle, Lightbulb, Shield, ArrowRight
} from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-white" data-testid="about-page">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-purple-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-pink-400 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm mb-8">
            <Heart className="w-4 h-4 text-pink-400" />
            <span>About The Doggy Company®</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Where a pet's life is
            <span className="block mt-2 bg-gradient-to-r from-pink-300 via-purple-300 to-yellow-300 bg-clip-text text-transparent">
              remembered, not just served.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-white/80 leading-relaxed max-w-3xl mx-auto">
            The Doggy Company® is India's Pet Life Operating System — a unified system built to understand, anticipate, and care for pets over the long term, not just in individual moments.
          </p>
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
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium mb-4">
              <Crown className="w-4 h-4" />
              Our Foundation
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Where We Come From — A Heritage of Care
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our foundation is rooted in lived experience and deep emotional understanding.
            </p>
          </div>

          {/* Heritage Table */}
          <div className="overflow-hidden rounded-xl border border-gray-200 mb-8">
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
                    <div className="text-sm text-purple-600">Concierge Excellence</div>
                  </td>
                  <td className="px-6 py-5 text-gray-600">
                    Decades of concierge expertise — service defined by <strong className="text-gray-900">memory</strong>, <strong className="text-gray-900">anticipation</strong>, and <strong className="text-gray-900">quiet judgement</strong>. The same discipline that underpins experiences for premium members in elite lifestyle ecosystems.
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="font-semibold text-gray-900">The Doggy Bakery®</div>
                    <div className="text-sm text-amber-600">45,000+ Pets Served</div>
                  </td>
                  <td className="px-6 py-5 text-gray-600">
                    A real, on-ground understanding of what pet parents truly care about — built through <strong className="text-gray-900">birthdays</strong>, <strong className="text-gray-900">adoption milestones</strong>, and <strong className="text-gray-900">everyday joy moments</strong>.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-gradient-to-r from-slate-800 to-purple-900 rounded-xl p-8 text-center text-white">
            <p className="text-lg leading-relaxed">
              These two worlds — <strong>concierge</strong> and <strong>lived pet experience</strong> — converge in The Doggy Company®.
            </p>
          </div>
        </div>
      </section>

      {/* Why We Exist */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
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
            <Card className="p-8 bg-white border-2 border-purple-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">The Truth About Pets</h3>
              <p className="text-gray-600 leading-relaxed">
                Pets are more than dependents.<br />
                They are <strong className="text-purple-700">family</strong>, <strong className="text-purple-700">identity</strong>, and <strong className="text-purple-700">daily engagement</strong>.
              </p>
            </Card>
            
            <Card className="p-8 bg-white border-2 border-red-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Today's Problem</h3>
              <p className="text-gray-600 leading-relaxed">
                Yet today's pet ecosystem is <strong className="text-red-600">fragmented</strong>, <strong className="text-red-600">transactional</strong>, <strong className="text-red-600">repetitive</strong>, and <strong className="text-red-600">memory-less</strong>.
              </p>
            </Card>
          </div>

          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-8 text-center text-white">
            <p className="text-xl font-medium mb-4">
              We created The Doggy Company® to change that.
            </p>
            <p className="text-white/90 leading-relaxed">
              Here, care isn't a one-off service.<br />
              It is a <strong>relationship built on memory, context, and continuity</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              Our Difference
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Makes Us Different
            </h2>
          </div>

          {/* Differentiators Table */}
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full" data-testid="differentiators-table">
              <thead className="bg-gradient-to-r from-emerald-50 to-teal-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 w-1/3">Differentiator</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">What It Means</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
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
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
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
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                        <Heart className="w-5 h-5 text-pink-600" />
                      </div>
                      <div className="font-semibold text-gray-900">Celebration as Culture</div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-gray-600">
                    Celebration sits at the heart of pet life. From birthdays to adoption anniversaries, we treat moments with <strong className="text-gray-900">intention and meaning</strong> — not as transactions or add-ons.
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
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
            <Card className="inline-block p-6 bg-slate-900 text-white">
              <p className="text-lg">
                This is not a service that transacts.<br />
                <strong className="text-purple-300">This is a system that remembers and nurtures.</strong>
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Concierge */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
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
              At the heart of The Doggy Company® is a human-led concierge team trained not just to respond, but to <strong className="text-gray-900">understand</strong>.
            </p>
            <p>
              Our concierges are chosen for <strong className="text-gray-900">judgement</strong>, <strong className="text-gray-900">empathy</strong>, and <strong className="text-gray-900">calm decision-making</strong> — the qualities that matter most when care is personal and situations are unpredictable. They don't work from scripts. They work from context, memory, and responsibility.
            </p>
            <p>
              Each interaction they handle enriches a pet's living profile, ensuring continuity while helping the system learn.
            </p>
          </div>

          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-white">
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
      </section>

      {/* Our Team (And Their Dogs) */}
      <section className="py-20 bg-white">
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
            <Card className="inline-block px-8 py-4 bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
              <p className="text-lg font-semibold text-gray-900">
                Our dogs are not mascots.<br />
                <span className="text-orange-600">They are co-creators.</span>
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* The People Behind the Philosophy */}
      <section className="py-20 bg-gradient-to-b from-purple-50 to-white">
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

          {/* Leaders Table */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full" data-testid="leaders-table">
              <thead className="bg-gradient-to-r from-purple-50 to-pink-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 w-1/4">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 w-1/4">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Philosophy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
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
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center">
                        <Crown className="w-6 h-6 text-white" />
                      </div>
                      <span className="font-bold text-gray-900 text-lg">Dipali</span>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <span className="text-indigo-600 font-semibold">The Concierge Mind</span>
                  </td>
                  <td className="px-6 py-6 text-gray-600">
                    Brings decades of experience designing concierge ecosystems where relationships matter more than transactions. As the force behind <strong className="text-gray-900">Les Concierges®</strong> and <strong className="text-gray-900">Club Concierge®</strong>, she shaped service models built on memory, judgement, and anticipation. Her work is grounded in one truth: the best service is never reactive — it <strong className="text-gray-900">listens</strong>, <strong className="text-gray-900">remembers</strong>, and <strong className="text-gray-900">acts before the question is fully formed</strong>.
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
                        <PawPrint className="w-6 h-6 text-white" />
                      </div>
                      <span className="font-bold text-gray-900 text-lg">Aditya</span>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <span className="text-amber-600 font-semibold">The Pet Parent's Lens</span>
                  </td>
                  <td className="px-6 py-6 text-gray-600">
                    Brings a lived understanding of pet parents and their emotional rhythms. Through <strong className="text-gray-900">The Doggy Bakery®</strong>, he has served over <strong className="text-gray-900">45,000 pets</strong> across birthdays, adoption milestones, and everyday moments that matter. His experience shaped a simple belief: pets are cared for through <strong className="text-gray-900">presence</strong>, <strong className="text-gray-900">timing</strong>, and <strong className="text-gray-900">feeling seen</strong> — not transactions.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600 text-lg">
              Together, these perspectives shape a platform built not around services, but around <strong className="text-purple-700">relationships</strong> — with pets at the centre.
            </p>
          </div>
        </div>
      </section>

      {/* Where We Are Today & Where We're Headed */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Where We Are Today */}
            <Card className="p-8 bg-gradient-to-br from-slate-50 to-gray-100 border-0">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-4">
                <Globe className="w-4 h-4" />
                Present
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Where We Are Today</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Founded in <strong className="text-gray-900">2020</strong>, The Doggy Company® has served thousands of pet parents and been part of tens of thousands of pet moments — from everyday care to life celebrations.
              </p>
              <p className="text-gray-600 leading-relaxed">
                We are building not just experiences, but <strong className="text-purple-700">long-term relationships</strong> between pet, parent, and platform.
              </p>
            </Card>

            {/* Where We're Headed */}
            <Card className="p-8 bg-gradient-to-br from-purple-50 to-indigo-100 border-0">
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
      </section>

      {/* Our Core Belief */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-sm font-medium mb-8">
            <Shield className="w-4 h-4 text-purple-400" />
            Our Core Belief
          </div>
          
          <Quote className="w-10 h-10 mx-auto text-purple-400 mb-6" />
          
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
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to Experience Care That Remembers?
          </h2>
          <p className="text-white/80 mb-8">
            Join thousands of pet parents who've chosen a better way.
          </p>
          <Link to="/membership">
            <Button className="bg-white text-purple-700 hover:bg-gray-100 px-8 py-6 text-lg font-semibold" data-testid="about-cta-button">
              <PawPrint className="w-5 h-5 mr-2" />
              Explore Pet Life Pass
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <PawPrint className="w-6 h-6 text-purple-400" />
            <span className="text-xl font-bold text-white">The Doggy Company®</span>
          </div>
          <p className="mb-2">India's Pet Life Operating System</p>
          <p className="text-sm text-gray-500 mb-4">
            A convergence of Les Concierges®, Club Concierge® & The Doggy Bakery®
          </p>
          <p className="text-sm">© 2025 The Doggy Company®. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default AboutPage;
