import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FileText, Shield, ScrollText, Truck, Sparkles } from 'lucide-react';

const G = {
  navy:   '#1A0A2E',
  amber:  '#FF8C42',
  sage:   '#40916C',
  cream:  '#FFF8F0',
  muted:  '#6B5E7A',
  border: 'rgba(26,10,46,0.10)',
};

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 32 }}>
    <h3 style={{ fontSize: 15, fontWeight: 700, color: G.navy, marginBottom: 10, paddingBottom: 6, borderBottom: `1px solid ${G.border}` }}>
      {title}
    </h3>
    {children}
  </div>
);

const Para = ({ children, style }) => (
  <p style={{ fontSize: 14, color: G.muted, lineHeight: 1.8, margin: '0 0 10px', ...style }}>{children}</p>
);

const Bullet = ({ items }) => (
  <ul style={{ paddingLeft: 20, margin: '6px 0 12px' }}>
    {items.map((item, i) => (
      <li key={i} style={{ fontSize: 14, color: G.muted, lineHeight: 1.8, marginBottom: 4 }}>{item}</li>
    ))}
  </ul>
);

const Notice = ({ bg, borderColor, children }) => (
  <div style={{ background: bg, borderLeft: `4px solid ${borderColor}`, borderRadius: '0 10px 10px 0', padding: '14px 18px', marginBottom: 24 }}>
    {children}
  </div>
);

// Route → default tab mapping
function useDefaultTab() {
  const loc = useLocation();
  if (loc.pathname.includes('privacy'))  return 'privacy';
  if (loc.pathname.includes('shipping')) return 'shipping';
  if (loc.pathname.includes('terms'))    return 'terms';
  if (loc.pathname.includes('refund'))   return 'refund';
  return 'refund';
}

const Policies = () => {
  const defaultTab = useDefaultTab();
  const [active, setActive] = useState(defaultTab);

  const tabs = [
    { id: 'refund',   label: 'Refunds',  icon: FileText },
    { id: 'privacy',  label: 'Privacy',  icon: Shield },
    { id: 'terms',    label: 'Terms',    icon: ScrollText },
    { id: 'shipping', label: 'Shipping', icon: Truck },
    { id: 'ai',       label: 'Mira AI',  icon: Sparkles },
  ];

  return (
    <div style={{ minHeight: '100vh', background: G.cream, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      {/* Page header */}
      <div style={{ background: G.navy, padding: '48px 24px 36px', textAlign: 'center' }}>
        <p style={{ fontSize: 11, letterSpacing: '0.14em', color: '#FF8C4299', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase' }}>
          The Doggy Company
        </p>
        <h1 style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 800, fontFamily: 'Georgia,serif', color: '#fff', margin: '0 0 10px', lineHeight: 1.15 }}>
          Policies &amp; Terms
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', maxWidth: 480, margin: '0 auto' }}>
          Written for pet parents, not for lawyers.
        </p>
      </div>

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '32px 16px 80px' }}>
        {/* Tab nav */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 28 }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActive(tab.id)}
                data-testid={`policy-tab-${tab.id}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 18px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  border: `1.5px solid ${isActive ? G.navy : G.border}`,
                  background: isActive ? G.navy : '#fff',
                  color: isActive ? '#fff' : G.navy,
                  transition: 'all 0.15s',
                }}
              >
                <Icon style={{ width: 14, height: 14 }} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content card */}
        <div style={{ background: '#fff', borderRadius: 20, border: `1.5px solid ${G.border}`, padding: '32px 32px 40px', boxShadow: '0 4px 24px rgba(26,10,46,0.06)' }}>

          {/* ── REFUND ── */}
          {active === 'refund' && (
            <div data-testid="refund-policy">
              <h2 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Georgia,serif', color: G.navy, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileText style={{ width: 22, height: 22, color: G.amber }} />
                Refund Policy
              </h2>

              <Section title="Physical Products">
                <Para>If you receive a damaged or incorrect item, contact us within 24 hours at <a href="mailto:concierge@thedoggycompany.com" style={{ color: G.amber, fontWeight: 600 }}>concierge@thedoggycompany.com</a>. We will replace it, no questions asked.</Para>
              </Section>

              <Section title="Custom Products">
                <Para>Birthday cakes, portraits, and Soul Made™ items are non-refundable once production has begun. If you need to cancel, please contact us within 2 hours of ordering.</Para>
              </Section>

              <Section title="Concierge® Services">
                <Para>If a service cannot be fulfilled by our team or partner, you will receive a full credit to your account — no fees, no process.</Para>
              </Section>

              <Section title="Memberships">
                <Para>Please write to us at <a href="mailto:concierge@thedoggycompany.com" style={{ color: G.amber, fontWeight: 600 }}>concierge@thedoggycompany.com</a>. We will always find a fair solution. We do not hide cancellation behind forms.</Para>
              </Section>
            </div>
          )}

          {/* ── PRIVACY ── */}
          {active === 'privacy' && (
            <div data-testid="privacy-policy">
              <h2 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Georgia,serif', color: G.navy, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Shield style={{ width: 22, height: 22, color: G.sage }} />
                Privacy Policy
              </h2>

              {/* Hero blockquote */}
              <blockquote style={{
                background: G.navy, color: '#fff', borderRadius: 16, padding: '24px 28px',
                margin: '0 0 28px', borderLeft: 'none', fontFamily: 'Georgia,serif',
                fontSize: 'clamp(1.1rem,3vw,1.4rem)', fontWeight: 700, lineHeight: 1.4,
                letterSpacing: '-0.3px',
              }}>
                "Your dog's soul profile is yours. Always."
                <p style={{ fontSize: 13, fontWeight: 400, fontFamily: '-apple-system,sans-serif', color: 'rgba(255,255,255,0.6)', marginTop: 10, marginBottom: 0, lineHeight: 1.6 }}>
                  We collect soul profile data for one reason only — to help Mira know your dog better.
                  We do not sell it. We do not share it with advertisers. We do not use it for any purpose
                  other than personalising your experience on The Doggy Company.
                </p>
              </blockquote>

              <Section title="What we store">
                <Bullet items={[
                  "Your dog's name, breed, age, and life stage",
                  "Soul Profile answers — allergies, preferences, personality, fears, and life vision",
                  "Conversation history with Mira (so she remembers what she's promised)",
                  "Your contact details (name, email, phone) for service coordination",
                ]} />
              </Section>

              <Section title="What we never do">
                <Bullet items={[
                  "Sell your data — to anyone, ever",
                  "Share your dog's soul profile with advertisers",
                  "Use your data for any purpose other than your dog's experience on TDC",
                  "Store payment details — all payments are handled securely by Razorpay",
                ]} />
              </Section>

              <Section title="Your right to delete">
                <Para>You can delete your account and all associated data at any time by writing to <a href="mailto:concierge@thedoggycompany.com" style={{ color: G.amber, fontWeight: 600 }}>concierge@thedoggycompany.com</a>. We will process your request within 7 business days.</Para>
              </Section>
            </div>
          )}

          {/* ── TERMS ── */}
          {active === 'terms' && (
            <div data-testid="terms-policy">
              <h2 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Georgia,serif', color: G.navy, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                <ScrollText style={{ width: 22, height: 22, color: G.amber }} />
                Terms of Service
              </h2>

              <Para style={{ color: G.navy, fontWeight: 600, marginBottom: 20 }}>
                The Doggy Company is a membership platform. By joining you agree to the following.
              </Para>

              <Section title="Use of the platform">
                <Para>TDC is for your dog's wellbeing. You may not use the platform for commercial resale of our recommendations, products, or Concierge® arrangements.</Para>
              </Section>

              <Section title="Mira's recommendations">
                <Para>Mira's recommendations are personalised suggestions based on your dog's Soul Profile. They are not veterinary advice. Always consult your vet for medical decisions.</Para>
              </Section>

              <Section title="Soul Made™ products">
                <Para>Soul Made™ products are custom-created for your dog and are non-transferable. Production begins within 24 hours of order confirmation.</Para>
              </Section>

              <Section title="Trademarks">
                <Para>The Doggy Company®, Concierge®, Soul Profile™, and Soul Made™ are registered trademarks. Mira™ is named after our founder's mother.</Para>
              </Section>

              <Section title="Governing law">
                <Para>These terms are governed by the laws of India. For any disputes, please write to us first at <a href="mailto:concierge@thedoggycompany.com" style={{ color: G.amber, fontWeight: 600 }}>concierge@thedoggycompany.com</a>. We will always try to resolve directly.</Para>
              </Section>
            </div>
          )}

          {/* ── SHIPPING ── */}
          {active === 'shipping' && (
            <div data-testid="shipping-policy">
              <h2 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Georgia,serif', color: G.navy, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Truck style={{ width: 22, height: 22, color: G.sage }} />
                Shipping &amp; Delivery
              </h2>

              <Notice bg="#F0FFF4" borderColor={G.sage}>
                <p style={{ fontSize: 14, fontWeight: 600, color: G.sage, margin: 0, lineHeight: 1.7 }}>
                  The Doggy Company is a Concierge® platform. Most of what we do is arranged for you — not shipped to you. Your Concierge® team handles all logistics via WhatsApp.
                </p>
              </Notice>

              <Section title="Physical products from The Doggy Bakery">
                <Bullet items={[
                  "Delivered within 3–5 business days across India",
                  "Fresh and frozen products delivered within your city only",
                  "Custom birthday cakes require 48 hours notice",
                ]} />
              </Section>

              <Section title="Concierge® services">
                <Para>Our team will confirm timing, provider, and logistics via WhatsApp within 2 hours of your request. You don't need to track anything — we update you.</Para>
              </Section>

              <Section title="Questions about your order?">
                <Para>
                  Write to <a href="mailto:concierge@thedoggycompany.com" style={{ color: G.amber, fontWeight: 600 }}>concierge@thedoggycompany.com</a> or message us on WhatsApp. Our team responds within 2 hours.
                </Para>
              </Section>
            </div>
          )}

          {/* ── MIRA AI ── */}
          {active === 'ai' && (
            <div data-testid="ai-disclaimer">
              <h2 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Georgia,serif', color: G.navy, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Sparkles style={{ width: 22, height: 22, color: G.amber }} />
                Mira AI — What She Is &amp; Isn't
              </h2>

              <Notice bg="#FFF8F0" borderColor={G.amber}>
                <p style={{ fontSize: 14, color: '#8B4513', margin: 0, lineHeight: 1.7, fontWeight: 600 }}>
                  Mira is your dog's AI concierge — not a veterinarian. Her recommendations are personalised to your dog's Soul Profile, but they are not medical advice. Always consult your vet for health decisions.
                </p>
              </Notice>

              <Section title="What Mira is">
                <Para>Mira is an AI concierge powered by your dog's Soul Profile. She remembers your dog's allergies, loves, fears, and history — and uses that context to personalise every recommendation, service, and interaction. She is named after our founder's mother.</Para>
              </Section>

              <Section title="What Mira can do">
                <Bullet items={[
                  "Filter products by your dog's allergens — automatically, always",
                  "Recommend services based on your dog's breed, age, and health notes",
                  "Book and coordinate Concierge® services on your behalf",
                  "Remember what she's promised and follow up proactively",
                  "Answer questions about The Doggy Company's products and services",
                ]} />
              </Section>

              <Section title="What Mira cannot do">
                <Bullet items={[
                  "Diagnose illness or prescribe treatment — always call your vet for this",
                  "Guarantee specific health outcomes",
                  "Replace professional veterinary advice in emergencies",
                ]} />
              </Section>

              <Section title="Mira's memory &amp; your data">
                <Para>Mira stores your conversation history to improve her personalisation over time. This data is never shared or sold. See our Privacy Policy for full details.</Para>
              </Section>
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#aaa', marginTop: 24 }}>
          Last updated: April 2026 · Questions? <a href="mailto:concierge@thedoggycompany.com" style={{ color: G.amber }}>concierge@thedoggycompany.com</a>
        </p>
      </div>
    </div>
  );
};

export default Policies;
