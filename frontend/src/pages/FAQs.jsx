import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search, Sparkles } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import Navbar from '../components/Navbar';

const G = {
  navy:   '#1A0A2E',
  amber:  '#FF8C42',
  sage:   '#40916C',
  cream:  '#FFF8F0',
  muted:  '#6B5E7A',
};

const defaultFaqs = [
  {
    category: 'Mira & Soul Profile',
    icon: '🐾',
    questions: [
      {
        q: 'What is a Soul Profile?',
        a: 'A 51-question assessment that helps Mira understand your dog as a soul — their personality, allergies, fears, loves, and life vision. Not a form. A conversation.',
      },
      {
        q: 'What is Mira?',
        a: 'Mira is your dog\'s AI concierge, named after our founder\'s mother. She remembers everything about your dog and personalises every recommendation, product, and service accordingly.',
      },
      {
        q: 'Is my dog\'s data safe?',
        a: 'Your dog\'s soul profile belongs to you. We never sell it, share it, or use it for advertising. Ever. You can request full deletion at any time by writing to concierge@thedoggycompany.com.',
      },
      {
        q: 'What does Soul Score mean?',
        a: 'It shows how well Mira knows your dog. 100% means Mira has everything she needs to personalise your experience completely — from product recommendations to service care notes.',
      },
      {
        q: 'Can I update my dog\'s Soul Profile?',
        a: 'Yes, anytime. Go to My Pets and edit any section. Mira updates her understanding immediately — so if your dog develops a new allergy or preference, tell us and we filter everything accordingly from that moment on.',
      },
    ],
  },
  {
    category: 'Concierge®',
    icon: '✨',
    questions: [
      {
        q: 'What is Concierge®?',
        a: 'Our team handles everything you\'d rather not do alone — vet appointments, birthday planning, grooming bookings, travel arrangements. You describe what you need. We do it.',
      },
      {
        q: 'How quickly does Concierge® respond?',
        a: 'Within 2 hours on WhatsApp for all service requests. For emergency care requests, within 5 minutes.',
      },
      {
        q: 'Is Concierge® included in my membership?',
        a: 'Yes. Concierge® access is part of every TDC membership — no extra charge for coordination, planning, or follow-up.',
      },
      {
        q: 'What can I ask Concierge® to arrange?',
        a: 'Anything your dog needs: grooming, vet appointments, birthday celebrations, pet-friendly travel, boarding, nutrition planning, emergency care coordination. Think of us as your dog\'s personal assistant.',
      },
    ],
  },
  {
    category: 'Orders & Products',
    icon: '🛒',
    questions: [
      {
        q: 'Where do the products come from?',
        a: 'From The Doggy Bakery (our own brand) and carefully curated partners. Every product is dog-safe and allergy-checked. Mira cross-references your dog\'s allergens before showing you anything.',
      },
      {
        q: 'Can Mira recommend products for my dog\'s allergies?',
        a: 'Yes. Once you complete the Soul Profile, Mira automatically filters out anything containing your dog\'s allergens — across all 12 pillars. Forever. You will never see a chicken product if Mojo is allergic to chicken.',
      },
      {
        q: 'How long does delivery take?',
        a: 'Physical products from The Doggy Bakery are delivered within 3–5 business days across India. Fresh and frozen products are delivered within your city only. Custom birthday cakes require 48 hours notice.',
      },
      {
        q: 'Can I track my order?',
        a: 'Yes. Once dispatched, you\'ll receive a WhatsApp update with tracking details from your Concierge® team.',
      },
      {
        q: 'Are all products dog-safe?',
        a: 'Absolutely. Everything on TDC is formulated without sugar, salt, xylitol, chocolate, or any ingredient harmful to dogs. Our team reviews every product in the catalogue.',
      },
    ],
  },
  {
    category: 'Membership',
    icon: '🌷',
    questions: [
      {
        q: 'What does a TDC membership include?',
        a: 'Membership gives you full access to all 12 pillars, Mira AI personalisation, Concierge® service coordination, your dog\'s complete Soul Profile, and priority WhatsApp support.',
      },
      {
        q: 'Can I add multiple dogs?',
        a: 'Yes. Each dog gets their own Soul Profile, their own Mira context, and their own set of personalised recommendations. Mira knows the difference between Mojo and Mahi.',
      },
      {
        q: 'Can I cancel?',
        a: 'Yes. Write to us at concierge@thedoggycompany.com and we\'ll find a fair solution. We don\'t hide cancellation behind forms.',
      },
    ],
  },
];

const FAQs = () => {
  const [openItems, setOpenItems]       = useState({});
  const [searchQuery, setSearchQuery]   = useState('');
  const [activeCategory, setActiveCategory] = useState(null);

  const toggleItem = (cIdx, qIdx) => {
    const key = `${cIdx}-${qIdx}`;
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filtered = defaultFaqs
    .map(cat => ({
      ...cat,
      questions: cat.questions.filter(q =>
        !searchQuery ||
        q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.a.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter(cat => cat.questions.length > 0);

  const display = activeCategory ? filtered.filter(c => c.category === activeCategory) : filtered;

  return (
    <div style={{ minHeight: '100vh', background: G.cream, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }} data-testid="faqs-page">
      <Navbar />

      {/* Hero */}
      <section style={{ background: G.navy, color: '#fff', padding: '60px 24px 48px', textAlign: 'center' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <p style={{ fontSize: 12, letterSpacing: '0.14em', color: '#FF8C4299', fontWeight: 700, marginBottom: 12, textTransform: 'uppercase' }}>
            The Doggy Company
          </p>
          <h1 style={{ fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 800, fontFamily: 'Georgia,serif', marginBottom: 12, lineHeight: 1.15 }}>
            How can we help?
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.68)', marginBottom: 32, lineHeight: 1.6 }}>
            Questions about Mira, your Soul Profile, Concierge®, or our products — answered.
          </p>
          <div style={{ position: 'relative', maxWidth: 480, margin: '0 auto' }}>
            <Search style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#888' }} />
            <input
              type="text"
              placeholder="Search FAQs…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%', paddingLeft: 48, paddingRight: 16, paddingTop: 14, paddingBottom: 14,
                borderRadius: 14, border: 'none', fontSize: 15, background: '#fff', color: G.navy,
                boxShadow: '0 4px 24px rgba(0,0,0,0.18)', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 16px 80px' }}>
        {/* Category pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 32 }}>
          {[null, ...defaultFaqs.map(c => c.category)].map(cat => (
            <button
              key={cat || 'all'}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '7px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                border: `1.5px solid ${activeCategory === cat ? G.navy : 'rgba(26,10,46,0.15)'}`,
                background: activeCategory === cat ? G.navy : '#fff',
                color: activeCategory === cat ? '#fff' : G.navy,
                transition: 'all 0.15s',
              }}
            >
              {cat === null ? 'All' : `${defaultFaqs.find(c => c.category === cat)?.icon} ${cat}`}
            </button>
          ))}
        </div>

        {/* Accordion */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {display.map((cat, cIdx) => (
            <div key={cat.category} style={{ background: '#fff', borderRadius: 18, border: '1.5px solid rgba(26,10,46,0.08)', overflow: 'hidden', boxShadow: '0 2px 16px rgba(26,10,46,0.05)' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(26,10,46,0.07)', background: 'linear-gradient(135deg,rgba(255,140,66,0.06),rgba(255,140,66,0.02))' }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: G.navy, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{cat.icon}</span>
                  {cat.category}
                </h2>
              </div>
              {cat.questions.map((item, qIdx) => {
                const key = `${cIdx}-${qIdx}`;
                const isOpen = openItems[key];
                return (
                  <div key={qIdx} style={{ borderBottom: qIdx < cat.questions.length - 1 ? '1px solid rgba(26,10,46,0.06)' : 'none' }}>
                    <button
                      onClick={() => toggleItem(cIdx, qIdx)}
                      data-testid={`faq-q-${cIdx}-${qIdx}`}
                      style={{
                        width: '100%', padding: '16px 24px', display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between', textAlign: 'left', cursor: 'pointer',
                        background: 'transparent', border: 'none', gap: 12,
                      }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 600, color: G.navy, lineHeight: 1.5 }}>{item.q}</span>
                      {isOpen
                        ? <ChevronUp style={{ width: 18, height: 18, color: G.amber, flexShrink: 0 }} />
                        : <ChevronDown style={{ width: 18, height: 18, color: '#aaa', flexShrink: 0 }} />
                      }
                    </button>
                    {isOpen && (
                      <div style={{ padding: '0 24px 20px', paddingLeft: 24 }}>
                        <p style={{ fontSize: 14, color: G.muted, lineHeight: 1.75, margin: 0 }}>{item.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Still need help */}
        <div style={{ marginTop: 48, background: G.navy, borderRadius: 20, padding: '36px 32px', textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>🐾</div>
          <h3 style={{ fontSize: 20, fontWeight: 800, fontFamily: 'Georgia,serif', marginBottom: 8 }}>Still need help?</h3>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', marginBottom: 20, lineHeight: 1.7 }}>
            Ask Mira — she knows everything about your dog and every service we offer.
          </p>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('openMiraAI'))}
            data-testid="faq-ask-mira-btn"
            style={{
              background: G.amber, color: '#fff', border: 'none', borderRadius: 12,
              padding: '13px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Ask Mira anything →
          </button>
          <p style={{ marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            Or email us at{' '}
            <a href="mailto:concierge@thedoggycompany.com" style={{ color: G.amber }}>
              concierge@thedoggycompany.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default FAQs;
