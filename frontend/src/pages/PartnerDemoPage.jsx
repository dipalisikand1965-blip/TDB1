/**
 * PartnerDemoPage.jsx — /proposal/:partnerSlug
 * 
 * AI-generated, config-driven B2B proposal page. Soft-gated by email.
 * Each unlock fires a lead-tracking alert email to Dipali.
 *
 * Config comes from GET /api/partner-demos/{slug}/meta (pre-gate)
 * and POST /api/partner-demos/{slug}/unlock (post-gate, returns full demo).
 */
import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Heart, Shield, Brain, Send, Mail, Calendar, Lock,
  PawPrint, CreditCard, TrendingUp, Building2, Star, Check, Clock,
} from 'lucide-react';
import { Button } from '../components/ui/button';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// ─── Inline markdown renderer (mirrors DreamfolksDemo) ────────────
const formatInline = (text) =>
  text
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-pink-400 font-semibold">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em class="text-purple-300">$1</em>');

const renderMarkdown = (text) => {
  if (!text) return null;
  const lines = text.split('\n');
  const out = [];
  let k = 0;
  for (const line of lines) {
    if (!line.trim()) { out.push(<div key={k++} className="h-2" />); continue; }
    if (line.match(/^\*\*[^*]+\*\*:?$/)) {
      out.push(<div key={k++} className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mt-3 mb-1 text-base">{line.replace(/\*\*/g, '').replace(/:$/, '')}</div>);
      continue;
    }
    if (line.match(/^[•·-]\s/)) {
      out.push(<div key={k++} className="flex items-start gap-2 my-0.5 ml-2"><span className="text-purple-400 mt-1">•</span><span className="text-white/70" dangerouslySetInnerHTML={{ __html: formatInline(line.slice(2)) }} /></div>);
      continue;
    }
    if (line.match(/^\d+\.\s/)) {
      const num = line.match(/^(\d+)\./)[1];
      out.push(<div key={k++} className="flex items-start gap-2 my-0.5 ml-2"><span className="text-purple-400 font-medium w-4">{num}.</span><span className="text-white/70" dangerouslySetInnerHTML={{ __html: formatInline(line.replace(/^\d+\.\s/, '')) }} /></div>);
      continue;
    }
    out.push(<p key={k++} className="text-white/80 my-1" dangerouslySetInnerHTML={{ __html: formatInline(line) }} />);
  }
  return <div>{out}</div>;
};

// ─── Email gate (soft auth) ──────────────────────────────────────
const EmailGate = ({ meta, onUnlock }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!email.includes('@')) { setError('Enter a valid email'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_URL}/api/partner-demos/${meta.slug}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ viewer_email: email.trim(), viewer_name: name.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Unable to unlock');
      onUnlock(data.demo, email);
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#1a0a2e] to-[#0a1a2e] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
          {meta.partner_logo ? (
            <img src={meta.partner_logo} alt={meta.partner_name} className="h-12 mx-auto mb-6 object-contain" />
          ) : (
            <div className="w-14 h-14 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Lock className="w-7 h-7 text-white" />
            </div>
          )}
          <h1 className="text-2xl font-bold text-white text-center mb-2" data-testid="gate-headline">
            Proposal for <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{meta.partner_name}</span>
          </h1>
          <p className="text-white/60 text-sm text-center mb-6">
            This is a private proposal from The Doggy Company. Enter your email to view it.
          </p>
          <form onSubmit={submit} className="space-y-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name (optional)"
              data-testid="gate-name-input"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
            />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              data-testid="gate-email-input"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
            />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <Button
              type="submit"
              disabled={loading}
              data-testid="gate-unlock-btn"
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-6 text-base"
            >
              {loading ? 'Unlocking…' : 'View the proposal →'}
            </Button>
          </form>
          <p className="text-white/30 text-[11px] text-center mt-5">
            We'll email a copy to your inbox. No spam, ever.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Main demo content (post-unlock) ─────────────────────────────
const PartnerDemoContent = ({ demo, viewerEmail }) => {
  const g = demo.generated;
  const pet = g.demo_pet;
  const [chatMessages, setChatMessages] = useState([
    { role: 'mira', content: `Hey! I'm Mira 👋\n\nI already know **${pet.name}** — your ${pet.age_years}-year-old ${pet.breed}${pet.allergy && pet.allergy !== 'None' ? ` who's allergic to ${pet.allergy.toLowerCase()}` : ''}${pet.favorite_treat ? ` and loves ${pet.favorite_treat.toLowerCase()}` : ''}.\n\nAsk me anything about ${pet.name}!` },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const messagesRef = useRef(null);

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [chatMessages, streamingText]);

  const callMira = async (userMessage) => {
    setIsTyping(true);
    setStreamingText('');
    try {
      const res = await fetch(`${API_URL}/api/mira/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          pet_id: `demo-${demo.slug}`,
          pet_name: pet.name,
          pet_context: {
            name: pet.name,
            breed: pet.breed,
            age_years: pet.age_years,
            allergies: pet.allergy && pet.allergy !== 'None' ? [pet.allergy.toLowerCase()] : [],
            preferences: { favorite_treats: [pet.favorite_treat] },
          },
          user_email: viewerEmail,
          session_id: `proposal-${demo.slug}-${Date.now()}`,
          demo_mode: true,
        }),
      });
      if (!res.ok || !res.body) throw new Error('Stream unavailable');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) { full += parsed.text; setStreamingText(full); }
          } catch { full += data; setStreamingText(full); }
        }
      }
      if (full) setChatMessages((prev) => [...prev, { role: 'mira', content: full }]);
      else throw new Error('Empty response');
    } catch {
      // Graceful fallback so demo never dies in front of a client
      setChatMessages((prev) => [...prev, {
        role: 'mira',
        content: `Great question! Here's how I'd handle this for ${pet.name}:\n\n**1.** I'd check ${pet.name}'s profile, allergies (${pet.allergy || 'none on file'}), and recent history.\n**2.** I'd surface 2-3 best options across our 12 pillars (Care, Shop, Travel, Celebrate…).\n**3.** Concierge® would handle execution end-to-end.\n\nIn production, this is a streaming AI response with live data. Try another scenario above!`,
      }]);
    } finally {
      setStreamingText('');
      setIsTyping(false);
    }
  };

  const send = (msg) => {
    const q = (msg ?? inputMessage).trim();
    if (!q) return;
    setChatMessages((prev) => [...prev, { role: 'user', content: q }]);
    setInputMessage('');
    callMira(q);
  };

  const PILLARS = ['Dine','Care','Go','Play','Learn','Services','Shop','Celebrate','Emergency','Adopt','Farewell','Paperwork'];
  const STAT_ICONS = [CreditCard, TrendingUp, Building2, Star];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#1a0a2e] to-[#0a1a2e] overflow-x-hidden">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <PawPrint className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-sm sm:text-base">thedoggycompany</span>
              <span className="text-purple-400 text-[10px] sm:text-xs block">Mira OS™ Proposal</span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
            <span className="text-white/60 text-xs">Prepared for</span>
            {demo.partner_logo ? (
              <img src={demo.partner_logo} alt={demo.partner_name} className="h-5 object-contain" />
            ) : (
              <span className="text-white text-xs font-semibold">{demo.partner_name}</span>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-12 sm:py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-500/20 border border-orange-500/30 rounded-full mb-5">
            <Sparkles className="w-3 h-3 text-orange-400" />
            <span className="text-orange-300 text-xs">Exclusive Partnership Proposal</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-white leading-tight mb-4">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              {g.hero_headline}
            </span>
          </h1>
          <p className="text-white/60 text-base sm:text-lg max-w-2xl mx-auto">{g.hero_subtext}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-10 max-w-4xl mx-auto">
            {g.stats.map((stat, i) => {
              const Icon = STAT_ICONS[i % STAT_ICONS.length];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4"
                >
                  <Icon className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                  <div className="text-xl sm:text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-white/50 text-[11px] sm:text-xs leading-tight">{stat.label}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Demo Pet Card */}
      <section className="py-4 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-4xl flex-shrink-0">
                🐶
              </div>
              <div className="text-center sm:text-left flex-1">
                <h3 className="text-2xl font-bold text-white">Meet {pet.name}</h3>
                <p className="text-white/60 text-sm">Your demo pet — tailored to {demo.partner_name}</p>
                <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">{pet.breed}</span>
                  <span className="px-3 py-1 bg-pink-500/20 text-pink-300 text-xs rounded-full">{pet.age_years} years</span>
                  {pet.allergy && pet.allergy !== 'None' && (
                    <span className="px-3 py-1 bg-red-500/20 text-red-300 text-xs rounded-full">🚫 {pet.allergy}</span>
                  )}
                  <span className="px-3 py-1 bg-green-500/20 text-green-300 text-xs rounded-full">Soul: {pet.soul_score}%</span>
                </div>
                {pet.personality?.length > 0 && (
                  <p className="text-white/50 text-xs mt-2">{pet.personality.join(' · ')}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Chat */}
      <section className="py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#1a0a2e]/50 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            {/* Chat header */}
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-4 border-b border-white/10 flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-white font-medium text-base">Mira AI</div>
                <div className="text-green-400 text-xs flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Chatting with {pet.name}
                </div>
              </div>
            </div>

            {/* Scenario tiles */}
            <div className="p-4 border-b border-white/10 bg-[#12061f]/50">
              <h3 className="text-white/60 text-xs mb-2">Try asking about:</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {g.demo_scenarios.map((s, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => send(s.text)}
                    data-testid={`scenario-tile-${i}`}
                    className="bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/30 rounded-lg p-2 text-left transition-all"
                  >
                    <div className="text-lg mb-0.5">{s.emoji}</div>
                    <div className="text-white/80 text-[11px] line-clamp-2">{s.text}</div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div ref={messagesRef} className="h-[45vh] sm:h-[380px] overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#12061f]">
              {chatMessages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'mira' && (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mr-2 flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[80%] ${msg.role === 'user' ? 'bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl rounded-br-sm px-4 py-3' : 'bg-purple-900/50 border border-purple-500/20 rounded-2xl rounded-bl-sm px-4 py-3'}`}>
                    {msg.role === 'user' ? (
                      <div className="text-white font-medium text-sm">{msg.content}</div>
                    ) : (
                      <div className="text-sm">{renderMarkdown(msg.content)}</div>
                    )}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mr-2 flex-shrink-0 animate-pulse">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-purple-900/50 border border-purple-500/20 rounded-2xl rounded-bl-sm px-4 py-3">
                    {streamingText ? (
                      <div className="text-sm">{renderMarkdown(streamingText)}<span className="animate-pulse text-pink-400">▊</span></div>
                    ) : (
                      <div className="flex items-center gap-2 text-purple-300 text-sm italic">
                        <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"></span>
                        Mira is thinking…
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10 bg-[#1a0a2e]/80">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && send()}
                  placeholder={`Ask Mira about ${pet.name}…`}
                  data-testid="chat-input"
                  className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
                />
                <Button
                  onClick={() => send()}
                  data-testid="chat-send-btn"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl px-4"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Heritage */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">The Soul, The Brains & The Hands</h2>
            <p className="text-white/60 max-w-2xl mx-auto text-sm">30 years of concierge heritage meets AI intelligence.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5 mb-10">
            {[
              { title: 'The Soul', sub: 'Mira AI', icon: Sparkles, desc: 'Named after the quiet force who shaped our philosophy. Judgment over listing, memory over forgetting.', color: 'from-purple-500/10 to-pink-500/10 border-purple-500/20' },
              { title: 'The Brains', sub: 'Pet Soul™ Technology', icon: Brain, desc: 'Context, memory, urgency, and emotion across 12 life pillars. The most intelligent pet AI in India.', color: 'from-purple-500/10 to-pink-500/10 border-purple-500/20' },
              { title: 'The Hands', sub: 'Human Concierge®', icon: Heart, desc: 'AI handles discovery. Humans handle execution. Available 6:30 AM – 11:30 PM.', color: 'from-green-500/10 to-emerald-500/10 border-green-500/20' },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className={`bg-gradient-to-br ${item.color} border rounded-2xl p-6 text-center`}>
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                  <item.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-purple-300">{item.title}</h3>
                <h4 className="text-white font-medium text-sm mb-2">{item.sub}</h4>
                <p className="text-white/60 text-xs leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-4 text-center">12 Life Pillars · One Intelligent System</h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
              {PILLARS.map((p, i) => (
                <div key={i} className="bg-white/5 rounded-lg py-2 text-white/70 text-xs">{p}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pitch Copy */}
      <section className="py-12 px-4 bg-gradient-to-b from-transparent to-purple-900/10">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 text-center">
            Why <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{demo.partner_name}</span>?
          </h2>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 space-y-4">
            {g.pitch_copy.split('\n\n').map((para, i) => (
              <p key={i} className="text-white/75 text-sm sm:text-base leading-relaxed">{para}</p>
            ))}
          </div>
          <div className="mt-6 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl p-5 text-center">
            <p className="text-amber-300 text-sm font-medium mb-1">Partnership angle</p>
            <p className="text-white text-base">{g.partnership_angle}</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-3xl p-8 md:p-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Ready to explore?</h2>
            <p className="text-white/60 mb-7 text-sm sm:text-base">
              Let's discuss how Mira OS can become a benefit for {demo.partner_name}'s {demo.target_audience.toLowerCase()}.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="tel:+919739908844">
                <Button data-testid="cta-call-btn" className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-6 text-base w-full">
                  <Calendar className="w-5 h-5 mr-2" /> Schedule a Call
                </Button>
              </a>
              <a href={`mailto:${demo.contact_email || 'dipali@clubconcierge.in'}`}>
                <Button variant="outline" data-testid="cta-email-btn" className="border-white/20 text-white hover:bg-white/10 px-8 py-6 text-base w-full">
                  <Mail className="w-5 h-5 mr-2" /> Email us
                </Button>
              </a>
            </div>
            <p className="text-white/40 text-xs mt-5">Or call directly: <a href="tel:+919739908844" className="hover:text-white/60">+91 97399 08844</a></p>
          </div>
        </div>
      </section>

      <footer className="py-6 px-4 border-t border-white/5">
        <div className="max-w-7xl mx-auto text-center text-white/40 text-xs">
          © 2026 The Doggy Company®. Mira™ is a trademark of The Doggy Company.
        </div>
      </footer>
    </div>
  );
};

// ─── Top-level page ──────────────────────────────────────────────
export default function PartnerDemoPage() {
  const { partnerSlug } = useParams();
  const [meta, setMeta] = useState(null);
  const [demo, setDemo] = useState(null);
  const [viewerEmail, setViewerEmail] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    fetch(`${API_URL}/api/partner-demos/${partnerSlug}/meta`)
      .then((r) => r.ok ? r.json() : Promise.reject(r))
      .then((data) => { if (alive) setMeta(data.meta); })
      .catch(async (r) => {
        if (!alive) return;
        try {
          const errBody = await r.json();
          setError(errBody.detail || 'Proposal not found');
        } catch {
          setError('Proposal not found');
        }
      });
    return () => { alive = false; };
  }, [partnerSlug]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Lock className="w-12 h-12 text-white/30 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Proposal not found</h1>
          <p className="text-white/50 text-sm">This proposal link is invalid or has been deactivated.</p>
        </div>
      </div>
    );
  }
  if (!meta) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <div className="animate-pulse w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
      </div>
    );
  }
  if (!demo) {
    return <EmailGate meta={meta} onUnlock={(d, email) => { setDemo(d); setViewerEmail(email); }} />;
  }
  return <PartnerDemoContent demo={demo} viewerEmail={viewerEmail} />;
}
