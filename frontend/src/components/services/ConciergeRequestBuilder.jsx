/**
 * ConciergeRequestBuilder.jsx
 * The Concierge® Request Builder — TDC's most premium mobile experience
 * 7 service categories → 2 taps → WhatsApp + ticket to Concierge® team
 * Dipali Sikand © The Doggy Company — Concierge® is a registered trademark
 */
import { tdc } from '../../utils/tdc_intent';
import { useConcierge } from '../../hooks/useConcierge';
import { useState, useEffect } from 'react';

const SERVICES = [
  {
    id: 'emergency',
    icon: '🚨',
    label: 'Emergency Coordination',
    tagline: 'We find the vet, confirm, guide you there, stay with you.',
    colour: '#DC2626',
    bg: '#FEF2F2',
    urgency: 'critical',
    questions: [
      { id: 'situation', label: "What's happening?", options: ['Injury or accident', 'Sudden illness', 'Poisoning / ingestion', 'Lost pet', 'Post-surgery concern'] },
      { id: 'timing',    label: 'How urgent?',        options: ['Right now — emergency', 'In the next few hours', 'Today'] },
    ],
  },
  {
    id: 'travel',
    icon: '✈️',
    label: 'Travel End-to-End',
    tagline: 'Airlines, crates, paperwork, destination vet — all handled.',
    colour: '#0369A1',
    bg: '#EFF6FF',
    urgency: 'high',
    questions: [
      { id: 'destination', label: 'Where are you going?', options: ['Within India', 'International', 'Relocation (permanent)', 'Not sure yet'] },
      { id: 'timing',      label: 'When do you travel?',  options: ['Within 2 weeks', 'This month', 'Next 3 months', 'Just planning'] },
    ],
  },
  {
    id: 'sourcing',
    icon: '📦',
    label: 'Product Sourcing',
    tagline: "Can't find it? We source it — from any city, any brand.",
    colour: '#7C3AED',
    bg: '#F5F3FF',
    urgency: 'normal',
    questions: [
      { id: 'category', label: 'What do you need?', options: ['Food / diet', 'Supplement / medication', 'Grooming product', 'Equipment / gear', 'Something specific'] },
      { id: 'urgency',  label: 'How soon?',          options: ['Urgently — running out', 'This week', 'No rush'] },
    ],
  },
  {
    id: 'trainer',
    icon: '🧠',
    label: 'Trainer Matchmaking',
    tagline: 'We understand the problem, find the right trainer, book the first session.',
    colour: '#D97706',
    bg: '#FFFBEB',
    urgency: 'normal',
    questions: [
      { id: 'problem', label: "What's the behaviour?", options: ['Pulling on leash', 'Barking / aggression', 'Anxiety / fear', 'Basic obedience', 'Advanced training'] },
      { id: 'format',  label: 'Preferred format?',     options: ['Home visits', 'Training centre', 'Online sessions', 'Whatever works best'] },
    ],
  },
  {
    id: 'lifestage',
    icon: '🐾',
    label: 'Life Stage Support',
    tagline: 'New puppy, rescue, senior, post-surgery — step-by-step plan + products.',
    colour: '#059669',
    bg: '#ECFDF5',
    urgency: 'normal',
    questions: [
      { id: 'stage',   label: "What's the situation?", options: ['New puppy arriving', 'Rescue dog settling in', 'Senior dog changes', 'Post-surgery recovery', 'First dog ever'] },
      { id: 'support', label: 'What do you need most?', options: ['What to buy', 'Daily routine plan', 'Vet coordination', 'Emotional support', 'All of the above'] },
    ],
  },
  {
    id: 'celebrate',
    icon: '🎂',
    label: 'Celebration Planning',
    tagline: 'Birthday, gotcha day, milestone — we handle every detail.',
    colour: '#9B59B6',
    bg: '#F5F0FF',
    urgency: 'normal',
    questions: [
      { id: 'occasion', label: "What are we celebrating?", options: ['Birthday', 'Gotcha day', 'Adoption anniversary', 'Milestone / recovery', 'Just because'] },
      { id: 'scale',    label: 'How big?',                 options: ['Intimate — just family', 'Small group of friends', 'Full party with guests', 'Surprise me'] },
    ],
  },
  {
    id: 'ongoing',
    icon: '💙',
    label: 'Ongoing Care Companion',
    tagline: 'Reminders, check-ins, seasonal advice — someone always thinking of Mojo.',
    colour: '#2563EB',
    bg: '#EFF6FF',
    urgency: 'normal',
    questions: [
      { id: 'need',      label: 'What would help most?', options: ['Vaccine & vet reminders', 'Grooming schedule', 'Medication reminders', 'Seasonal health advice', 'All check-ins'] },
      { id: 'frequency', label: 'How often?',            options: ['Weekly check-ins', 'Monthly summary', 'Only when due', 'As needed'] },
    ],
  },
];

const G = {
  dark: '#0A0A14', gold: '#C9973A', goldL: '#E8B84B',
  cream: '#FFFBF5', border: 'rgba(201,151,58,0.20)',
};

function vibe(t = 'light') { if (navigator?.vibrate) navigator.vibrate(t === 'medium' ? [12] : [6]); }

export default function ConciergeRequestBuilder({ pet, token, isOpen, onClose, preselect }) {
  const [step, setStep] = useState(0); // 0=select service, 1=q1, 2=q2, 3=sending, 4=done
  const [selectedService, setSelectedService] = useState(null);
  const [answers, setAnswers] = useState({});
  const { request } = useConcierge({ pet, pillar: 'services' });

  const petName = pet?.name || 'your dog';
  const breed = (pet?.breed || '').split('(')[0].trim();

  // Build allergy list from all possible soul profile storage formats
  // Handles both array fields AND "chicken, beef allergy" descriptive strings
  const parseAllergyString = (str) => {
    if (!str || typeof str !== 'string') return [];
    return str.toLowerCase().split(/[,\s&]+/)
      .map(w => w.replace(/allergy|allergic|to|and/g, '').trim())
      .filter(w => w.length > 2 && !['the', 'for', 'with', 'otherwise', 'healthy'].includes(w));
  };
  const allergies = [
    ...(pet?.allergies || []),
    ...(pet?.health?.allergies || []),
    ...(pet?.dsa?.food_allergies || []),
    // Fallback: parse health dimension description strings
    ...parseAllergyString(pet?.health?.description),
    ...parseAllergyString(pet?.health?.notes),
  ].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);
  const allergyLabel = allergies.length > 0 ? ` · allergic to ${allergies.join(', ')}` : '';

  // Auto-select service when preselect prop is provided
  useEffect(() => {
    if (isOpen && preselect) {
      const svc = SERVICES.find(s => s.id === preselect);
      if (svc) { setSelectedService(svc); setStep(1); }
    }
    if (!isOpen) { setStep(0); setSelectedService(null); setAnswers({}); }
  }, [isOpen, preselect]);

  const reset = () => { setStep(0); setSelectedService(null); setAnswers({}); };
  const handleClose = () => { reset(); onClose(); };

  const selectService = (svc) => {
    vibe('medium');
    setSelectedService(svc);
    setStep(1);
  };

  const answerQuestion = (qId, answer) => {
    vibe();
    const newAnswers = { ...answers, [qId]: answer };
    setAnswers(newAnswers);
    const svc = selectedService;
    if (step === 1 && svc.questions.length > 1) {
      setStep(2);
    } else {
      sendRequest(svc, newAnswers);
    }
  };

  const sendRequest = async (svc, finalAnswers) => {
    setStep(3);
    vibe('medium');
    const answerSummary = Object.entries(finalAnswers)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
    const profileContext = `${petName} (${breed || 'dog'}${allergyLabel})`;
    const message = `Concierge® Request — ${svc.label} for ${profileContext}. ${answerSummary}. Soul profile on file.`;
    try {
      await request(message, {
        channel: `concierge_builder_${svc.id}`,
        urgency: svc.urgency,
        metadata: { service: svc.id, petName, breed, answers: finalAnswers },
      });
      tdc.request(message, { pillar: 'services', pet, channel: `concierge_builder_${svc.id}` });
    } catch (e) { console.warn('Concierge request error', e); }
    setTimeout(() => setStep(4), 800);
  };

  if (!isOpen) return null;

  const svc = selectedService;
  const currentQ = svc?.questions?.[step - 1];

  // Desktop = centered dialog, mobile = bottom sheet
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', flexDirection: 'column',
        justifyContent: isDesktop ? 'center' : 'flex-end',
        alignItems: isDesktop ? 'center' : 'stretch',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: G.dark,
          borderRadius: isDesktop ? '24px' : '24px 24px 0 0',
          maxHeight: isDesktop ? '88vh' : '92vh',
          overflowY: 'auto',
          paddingBottom: isDesktop ? '24px' : 'calc(32px + env(safe-area-inset-bottom))',
          width: isDesktop ? '480px' : '100%',
          maxWidth: isDesktop ? '480px' : undefined,
          boxShadow: isDesktop ? '0 32px 64px rgba(0,0,0,0.6)' : undefined,
        }}
      >
        {/* Handle bar + Close */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px 0' }}>
          <div style={{ width:36, height:4, background:'rgba(255,255,255,0.15)', borderRadius:2, margin:'0 auto' }} />
          <button onClick={handleClose}
            style={{ position:'absolute', right:16, top:14, width:32, height:32, borderRadius:'50%', border:'1px solid rgba(255,255,255,0.15)', background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.6)', fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1 }}>
            ✕
          </button>
        </div>

        {/* STEP 0 — Select Service */}
        {step === 0 && (
          <div style={{ padding: '20px 20px 8px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(201,151,58,0.9)', letterSpacing: '0.14em', marginBottom: 6 }}>
              ✦ CONCIERGE® · REGISTERED TRADEMARK
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 6, fontFamily: 'Georgia,serif' }}>
              What does {petName} need?
            </div>
            {/* Soul profile pre-fill pill */}
            {(breed || allergies.length > 0) && (
              <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:999, background:'rgba(201,151,58,0.12)', border:'1px solid rgba(201,151,58,0.25)', marginBottom:14 }}>
                <span style={{ fontSize:11, color:'rgba(201,151,58,0.9)', fontWeight:600 }}>
                  {breed && <span>{breed}</span>}
                  {allergies.length > 0 && <span style={{ color:'rgba(255,255,255,0.45)' }}>{breed ? ' · ' : ''}allergic to {allergies.join(', ')}</span>}
                </span>
              </div>
            )}
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 20, lineHeight: 1.5 }}>
              Tell us once. We figure it out and get it done.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {SERVICES.map(s => (
                <button
                  key={s.id}
                  onClick={() => selectService(s)}
                  data-testid={`concierge-service-${s.id}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 16, border: `1.5px solid ${s.colour}30`, background: `${s.colour}12`, cursor: 'pointer', textAlign: 'left', width: '100%' }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                    {s.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{s.label}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>{s.tagline}</div>
                  </div>
                  <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>›</div>
                </button>
              ))}
            </div>
            <div style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)', paddingBottom: 8 }}>
              Concierge® responds within 2 hours · Emergency within 15 minutes
            </div>
          </div>
        )}

        {/* STEP 1 & 2 — Questions */}
        {(step === 1 || step === 2) && svc && currentQ && (
          <div style={{ padding: '20px 20px 8px' }}>
            <button onClick={() => { vibe(); step === 1 ? reset() : setStep(1); }}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 14, cursor: 'pointer', marginBottom: 16, padding: 0 }}>
              ← Back
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '12px 14px', background: `${svc.colour}18`, borderRadius: 14, border: `1px solid ${svc.colour}30` }}>
              <span style={{ fontSize: 24 }}>{svc.icon}</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{svc.label}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>for {petName} · {breed}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
              {svc.questions.map((_, i) => (
                <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < step ? svc.colour : 'rgba(255,255,255,0.1)' }} />
              ))}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 16, lineHeight: 1.3 }}>
              {currentQ.label}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {currentQ.options.map(opt => (
                <button key={opt} onClick={() => answerQuestion(currentQ.id, opt)}
                  style={{ padding: '14px 18px', borderRadius: 14, border: '1.5px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3 — Sending */}
        {step === 3 && (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✦</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Reaching Concierge®…</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Sending {petName}'s request to our team</div>
          </div>
        )}

        {/* STEP 4 — Done */}
        {step === 4 && svc && (
          <div style={{ padding: '32px 20px' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>{svc.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 8, fontFamily: 'Georgia,serif' }}>
                Request received ✓
              </div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                Your Concierge® has {petName}'s details and will reach you
                {svc.urgency === 'critical' ? ' within 15 minutes' : ' within 2 hours'}.
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: '16px 18px', marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: G.goldL, letterSpacing: '0.1em', marginBottom: 12 }}>WHAT HAPPENS NEXT</div>
              {[
                { icon: '📋', text: `Your ${svc.label.toLowerCase()} request is logged with ${petName}'s soul profile` },
                { icon: '📞', text: 'Your Concierge® reviews and contacts you directly' },
                { icon: '✅', text: 'We coordinate everything — you just show up' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: i < 2 ? 10 : 0 }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{item.text}</span>
                </div>
              ))}
            </div>
            <button onClick={handleClose}
              style={{ width: '100%', minHeight: 48, borderRadius: 14, border: 'none', background: `linear-gradient(135deg,${G.gold},${G.goldL})`, color: G.dark, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
              Done ✓
            </button>
            <button onClick={() => { reset(); }}
              style={{ width: '100%', marginTop: 10, minHeight: 44, borderRadius: 14, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: 14, cursor: 'pointer' }}>
              Make another request
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
