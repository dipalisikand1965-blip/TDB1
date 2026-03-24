/**
 * GuidedLearnPaths.jsx — /learn pillar
 * The Doggy Company
 *
 * LOCKED — DO NOT TOUCH — AUDITED Mar 24, 2026
 * Exports: buildPaths, PathFlowModal (used by LearnSoulPage content modal footer CTA)
 *
 * 6 guided learning paths · step-by-step selection modal
 * Mirrors GuidedCarePaths.jsx exactly — indigo colour world
 *
 * HOW TO USE:
 *   import GuidedLearnPaths from '../components/learn/GuidedLearnPaths';
 *   <GuidedLearnPaths pet={pet} />
 *
 * WIRING:
 *   POST /api/service_desk/attach_or_create_ticket
 */
import { useState } from 'react';
import { API_URL } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { tdc } from '../../utils/tdc_intent';

// ── Colour system ────────────────────────────────────────────
const G = {
  deep:'#1A1363', mid:'#3730A3', violet:'#7C3AED',
  pale:'#EDE9FE', cream:'#F5F3FF',
  darkText:'#1A1363', mutedText:'#5B21B6',
  border:'rgba(124,58,237,0.15)',
};

// ── buildPaths(pet) ───────────────────────────────────────────
export function buildPaths(pet) {
  const name  = pet?.name  || 'your dog';
  const breed = pet?.breed || '';
  const age   = parseInt(pet?.doggy_soul_answers?.age_years || pet?.age || '0') || 0;
  const level = pet?.doggy_soul_answers?.learn_level || '';
  const senior = age >= 7;
  const puppy  = age < 1;

  return [
    {
      id:'new_puppy',
      icon:'🐶',
      title:'New Puppy Start',
      desc:`Build ${name}'s confidence and first skills — the right foundation shapes everything.`,
      badge: puppy ? '★ Mira Pick' : null,
      badgeBg:'#7C3AED',
      accentColor:'#7C3AED',
      iconBg:'#EDE9FE',
      miraPick: puppy,
      stepLabels:['Age & Stage','First Skills','Schedule'],
      steps:[
        {
          title:`How old is ${name}?`,
          desc:'This shapes everything — foundations differ hugely by age.',
          type:'select_one',
          options:[
            {icon:'🐶',name:'Under 3 months',desc:'Prime socialisation window — act fast',mira:age<3},
            {icon:'🐾',name:'3–6 months',desc:'Learning fastest right now',mira:age>=3&&age<=6},
            {icon:'📚',name:'6–12 months',desc:'Adolescent stage — needs structure',mira:age>6&&age<=12},
            {icon:'🎓',name:'Over 12 months',desc:'Adult foundations — never too late',mira:false},
          ],
        },
        {
          title:`What's the priority for ${name}?`,
          type:'multi_select',
          options:[
            {icon:'🛁',name:'Toilet training',desc:'Clean home habits'},
            {icon:'😴',name:'Sleep routine',desc:'Good nights from day one'},
            {icon:'🤝',name:'Socialisation',desc:'Confident around people and dogs'},
            {icon:'👂',name:'Basic commands',desc:'Sit, stay, come, leave it'},
            {icon:'🎾',name:'Play & bonding',desc:'Building the connection'},
          ],
        },
        {
          title:'When works best for sessions?',
          type:'select_one',
          options:[
            {icon:'🌅',name:'Weekday mornings',desc:''},
            {icon:'🌆',name:'Weekday evenings',desc:''},
            {icon:'☀️',name:'Weekend mornings',desc:''},
            {icon:'🌤️',name:'Weekend afternoons',desc:''},
            {icon:'📅',name:'Flexible',desc:'Concierge will find a slot'},
          ],
        },
      ],
    },
    {
      id:'new_rescue',
      icon:'🏠',
      title:'New Rescue & Rehome',
      desc:`Help ${name} settle in safely — every rescue dog needs a unique transition plan.`,
      badge:'Specialist',
      badgeBg:'#DC2626',
      accentColor:'#DC2626',
      iconBg:'#FEE2E2',
      miraPick: false,
      stepLabels:['Challenges','Priorities','Schedule'],
      steps:[
        {
          title:`What's ${name}'s biggest settling-in challenge?`,
          desc:'Pre-filled from soul profile. Add any others Mira should know.',
          type:'multi_select',
          options:[
            {icon:'😰',name:'Fear and anxiety',desc:'Scared of new environments'},
            {icon:'🚪',name:'Being left alone',desc:'Separation distress'},
            {icon:'🐕',name:'Reacting to other dogs',desc:'Lunging, barking, hiding'},
            {icon:'👥',name:'Nervous around people',desc:'Slow to trust new faces'},
            {icon:'🔊',name:'Noise sensitivity',desc:'Startles or hides at sounds'},
            {icon:'🏠',name:'Exploring the new home',desc:'Hiding, not eating, unsettled'},
          ],
        },
        {
          title:'What does success look like in 30 days?',
          type:'select_one',
          options:[
            {icon:'😌',name:'Calm and relaxed at home',desc:''},
            {icon:'🤝',name:'Trusting people',desc:''},
            {icon:'🐾',name:'Comfortable on walks',desc:''},
            {icon:'😴',name:'Sleeping through the night',desc:''},
          ],
        },
        {
          title:'When works best for sessions?',
          type:'select_one',
          options:[
            {icon:'🌅',name:'Weekday mornings',desc:''},
            {icon:'🌆',name:'Weekday evenings',desc:''},
            {icon:'☀️',name:'Weekend mornings',desc:''},
            {icon:'📅',name:'Flexible',desc:''},
          ],
        },
      ],
    },
    {
      id:'basic_training',
      icon:'🏆',
      title:'Basic Training',
      desc:`The building blocks every dog needs — sit, stay, recall and leash manners for ${name}.`,
      badge: level==='No training yet' ? '★ Start Here' : null,
      badgeBg:'#1565C0',
      accentColor:'#1565C0',
      iconBg:'#E3F2FD',
      miraPick: !level || level==='No training yet',
      stepLabels:['Current Level','Focus','Schedule'],
      steps:[
        {
          title:`Where is ${name} right now?`,
          desc:'Mira will start from here and build the right programme.',
          type:'select_one',
          options:[
            {icon:'🌱',name:'No training yet',desc:'Starting completely fresh',mira:!level},
            {icon:'🐾',name:'Knows sit and stay',desc:'Basic commands only'},
            {icon:'🎓',name:'Multiple commands',desc:'Solid basics, ready for more'},
            {icon:'⭐',name:'Well trained',desc:'Advanced — wants to go further'},
          ],
        },
        {
          title:'What should we focus on first?',
          type:'multi_select',
          options:[
            {icon:'👂',name:'Sit, stay, come',desc:'Core obedience'},
            {icon:'🦮',name:'Leash manners',desc:'Calm on walks'},
            {icon:'📢',name:'Recall',desc:'Coming when called'},
            {icon:'🤲',name:'Drop / leave it',desc:'Safety commands'},
            {icon:'🚗',name:'Car manners',desc:'Safe travel behaviour'},
          ],
        },
        {
          title:'Preferred session format?',
          type:'select_one',
          options:[
            {icon:'🏠',name:'In-home sessions',desc:'Mira-approved trainer comes to you'},
            {icon:'🏫',name:'Group class',desc:'Socialise while learning'},
            {icon:'💻',name:'Online coaching',desc:'Video sessions with a trainer'},
            {icon:'📅',name:'Flexible',desc:'Concierge recommends the best fit'},
          ],
        },
      ],
    },
    {
      id:'behaviour',
      icon:'🧠',
      title:'Behaviour & Impulse',
      desc:`Address ${name}'s reactive, anxious or difficult behaviours with specialist guidance.`,
      badge:'Specialist',
      badgeBg:'#F57C00',
      accentColor:'#F57C00',
      iconBg:'#FFF3E0',
      miraPick: false,
      stepLabels:['Behaviour','Triggers','Format'],
      steps:[
        {
          title:`What behaviour does ${name} show?`,
          type:'multi_select',
          options:[
            {icon:'😤',name:'Reactivity',desc:'Barking, lunging at triggers'},
            {icon:'😰',name:'Anxiety / fear',desc:'Scared, hiding, trembling'},
            {icon:'🏃',name:'Pulling on lead',desc:'Can\'t walk calmly'},
            {icon:'🦷',name:'Mouthing / nipping',desc:'Biting, play biting'},
            {icon:'🔊',name:'Excessive barking',desc:'Barks at everything'},
            {icon:'🛋️',name:'Destructive behaviour',desc:'Chewing, digging'},
          ],
        },
        {
          title:'What triggers the behaviour most?',
          type:'multi_select',
          options:[
            {icon:'🐕',name:'Other dogs',desc:''},
            {icon:'👥',name:'Strangers',desc:''},
            {icon:'🚗',name:'Traffic / vehicles',desc:''},
            {icon:'🔔',name:'Sounds / noises',desc:''},
            {icon:'🚪',name:'Being left alone',desc:''},
          ],
        },
        {
          title:'When works best for sessions?',
          type:'select_one',
          options:[
            {icon:'🌅',name:'Weekday mornings',desc:''},
            {icon:'🌆',name:'Weekday evenings',desc:''},
            {icon:'☀️',name:'Weekend mornings',desc:''},
            {icon:'📅',name:'Flexible',desc:''},
          ],
        },
      ],
    },
    {
      id:'enrichment',
      icon:'🧩',
      title:'Mental Enrichment',
      desc:`Keep ${name}'s mind sharp — puzzles, nose work and brain games tailored to their energy.`,
      badge: breed ? `For ${breed}s` : null,
      badgeBg:'#2E7D32',
      accentColor:'#2E7D32',
      iconBg:'#E8F5E9',
      miraPick: false,
      stepLabels:['Activity Level','Interests','Format'],
      steps:[
        {
          title:`How active is ${name} mentally right now?`,
          type:'select_one',
          options:[
            {icon:'😴',name:'Under-stimulated',desc:'Bored, destructive, restless'},
            {icon:'⚡',name:'High energy',desc:'Needs lots of mental outlets'},
            {icon:'😌',name:'Well-balanced',desc:'Looking to add variety'},
            {icon:'🧓',name:'Senior dog',desc:'Gentle enrichment to keep sharp',mira:senior},
          ],
        },
        {
          title:'What does ${name} love?',
          desc:'We\'ll build a programme around their natural drives.',
          type:'multi_select',
          options:[
            {icon:'👃',name:'Sniffing & nose work',desc:''},
            {icon:'🧩',name:'Puzzle feeders',desc:''},
            {icon:'🎾',name:'Fetch & retrieve',desc:''},
            {icon:'🤸',name:'Agility / movement',desc:''},
            {icon:'🤝',name:'Human interaction',desc:''},
          ],
        },
        {
          title:'How would you like to receive it?',
          type:'select_one',
          options:[
            {icon:'📦',name:'Enrichment kit delivered',desc:'Box of curated games & tools'},
            {icon:'🏠',name:'In-home enrichment session',desc:'Trainer designs your setup'},
            {icon:'💻',name:'Online enrichment plan',desc:'DIY with Mira-guided plan'},
          ],
        },
      ],
    },
    {
      id:'senior',
      icon:'🐕',
      title:'Senior Dog Care',
      desc:`Gentle, adapted learning for ${name} — keep their mind and body active as they age.`,
      badge: senior ? '★ Mira Pick' : null,
      badgeBg:'#6B21A8',
      accentColor:'#6B21A8',
      iconBg:'#F5F3FF',
      miraPick: senior,
      stepLabels:['Mobility','Goals','Format'],
      steps:[
        {
          title:`How is ${name}'s mobility?`,
          type:'select_one',
          options:[
            {icon:'🏃',name:'Still very active',desc:'Just slower than before'},
            {icon:'🚶',name:'Moderate — short walks',desc:'Tires more easily'},
            {icon:'🛋️',name:'Limited mobility',desc:'Joint issues or pain'},
            {icon:'💊',name:'On medication',desc:'Vet-supervised activity'},
          ],
        },
        {
          title:'What matters most for ${name} now?',
          type:'multi_select',
          options:[
            {icon:'🧠',name:'Mental stimulation',desc:'Keep the mind sharp'},
            {icon:'🤝',name:'Bonding time',desc:'Quality connection'},
            {icon:'😌',name:'Anxiety management',desc:'Calm and settled'},
            {icon:'🏥',name:'Vet-aligned routines',desc:'Support health needs'},
          ],
        },
        {
          title:'Preferred format?',
          type:'select_one',
          options:[
            {icon:'🏠',name:'In-home sessions',desc:'Gentle, no travel stress'},
            {icon:'💻',name:'Online coaching',desc:'Video guidance from home'},
            {icon:'📦',name:'Senior enrichment kit',desc:'Delivered to your door'},
          ],
        },
      ],
    },
  ];
}

// ── Step Indicator ────────────────────────────────────────────
function StepIndicator({ current, total, accentColor }) {
  return (
    <div style={{ display:'flex', gap:6, marginBottom:16 }}>
      {Array.from({ length:total }).map((_,i) => (
        <div key={i} style={{ flex:1, height:4, borderRadius:4,
          background: i < current ? accentColor : 'rgba(124,58,237,0.15)',
          transition:'background 0.3s' }}/>
      ))}
    </div>
  );
}

// ── Option Row ────────────────────────────────────────────────
function OptionRow({ option, selected, onToggle, accentColor }) {
  return (
    <div onClick={onToggle}
      style={{ background:selected?G.pale:'#fff',
        border:`1.5px solid ${selected?accentColor:'rgba(124,58,237,0.18)'}`,
        borderRadius:12, padding:'12px 16px', cursor:'pointer',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        marginBottom:8, transition:'all 0.12s' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:20 }}>{option.icon}</span>
        <div>
          <div style={{ fontSize:14, fontWeight:500, color:G.darkText }}>
            {option.name}
            {option.mira && <span style={{ fontSize:9, fontWeight:700, marginLeft:6,
              background:accentColor, color:'#fff', borderRadius:20,
              padding:'1px 7px', verticalAlign:'middle' }}>★ Mira</span>}
          </div>
          {option.desc && <div style={{ fontSize:11, color:'#888' }}>{option.desc}</div>}
        </div>
      </div>
      {selected && <span style={{ color:accentColor, fontWeight:700, fontSize:16 }}>✓</span>}
    </div>
  );
}

// ── Path Flow Modal ────────────────────────────────────────────
export function PathFlowModal({ path, pet, onClose }) {
  const [step, setStep]       = useState(0);
  const [answers, setAnswers] = useState({});
  const [sent, setSent]       = useState(false);
  const [sending, setSending] = useState(false);
  const { token } = useAuth();

  const petName     = pet?.name || 'your dog';
  const currentStep = path.steps[step];
  const selections  = answers[step] || [];
  const canNext     = selections.length > 0;
  const isLast      = step === path.steps.length - 1;

  const toggle = (optName) => {
    setAnswers(prev => {
      const cur = prev[step] || [];
      if (currentStep.type === 'select_one') return { ...prev, [step]: [optName] };
      return { ...prev, [step]: cur.includes(optName) ? cur.filter(x=>x!==optName) : [...cur, optName] };
    });
  };

  const send = async () => {
    setSending(true);
    // Fire tdc immediately on path completion
    tdc.request({ text: `Completed guided path: ${path.title}`, name: path.title, pillar: "learn", pet, channel: "learn_guided_paths_complete" });
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const summary = path.steps.map((s,i) =>
        `${s.title?.replace(/{name}/g,petName)||'Step '+(i+1)}: ${(answers[i]||[]).join(', ')}`
      ).join(' | ');
      await fetch(`${API_URL}/api/service_desk/attach_or_create_ticket`, {
        method:'POST',
        headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},
        body:JSON.stringify({
          parent_id: storedUser?.id || storedUser?.email || 'guest',
          pet_id: pet?.id || 'unknown',
          pillar: 'learn',
          life_state: 'PLAN',
          force_new: true,
          intent_primary: 'guided_path_booking',
          channel: `learn_guided_${path.id}`,
          initial_message: {
            sender:'parent',
            text:`I'd like to start the "${path.title}" learning path for ${petName}. ${summary}`,
          },
        }),
      });
    } catch(e) { console.error('[GuidedLearnPaths]', e); }
    setSending(false);
    setSent(true);
  };

  if (sent) {
    return (
      <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:10010,
        background:'rgba(0,0,0,0.72)', display:'flex', alignItems:'center',
        justifyContent:'center', padding:16 }}>
        <div onClick={e=>e.stopPropagation()} style={{ width:'min(480px,100%)',
          borderRadius:20, background:'#fff', padding:'40px 32px', textAlign:'center' }}>
          <div style={{ width:72, height:72, borderRadius:'50%',
            background:`linear-gradient(135deg,${path.accentColor},#7C3AED)`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:32, margin:'0 auto 20px' }}>✦</div>
          <div style={{ fontSize:22, fontWeight:800, color:G.darkText,
            fontFamily:'Georgia,serif', marginBottom:8 }}>Path Started!</div>
          <div style={{ fontSize:14, color:G.mutedText, lineHeight:1.7, marginBottom:8 }}>
            Your {path.title.toLowerCase()} plan for {petName} has been sent to Concierge®.
          </div>
          <div style={{ fontSize:13, color:'#888', marginBottom:24 }}>
            Our team will contact you within 2 hours.
          </div>
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:G.pale,
            border:'1px solid rgba(124,58,237,0.25)', borderRadius:20, padding:'6px 16px',
            fontSize:13, color:G.violet, fontWeight:600, marginBottom:24 }}>
            📥 Added to your Inbox
          </div>
          <div>
            <button onClick={onClose} style={{ background:G.violet, color:'#fff', border:'none',
              borderRadius:12, padding:'12px 28px', fontSize:14, fontWeight:700, cursor:'pointer' }}>
              Done ✓
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:10010,
      background:'rgba(0,0,0,0.72)', display:'flex', alignItems:'center',
      justifyContent:'center', padding:16 }}>
      <div onClick={e=>e.stopPropagation()} style={{ width:'min(480px,100%)',
        maxHeight:'88vh', borderRadius:20, background:'#fff',
        boxShadow:'0 24px 80px rgba(0,0,0,0.45)',
        display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Header */}
        <div style={{ background:`linear-gradient(135deg,${path.accentColor},${path.accentColor}CC)`,
          padding:'20px 24px 16px', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:6,
              background:'rgba(255,255,255,0.20)', borderRadius:20, padding:'3px 10px' }}>
              <span style={{ fontSize:14 }}>{path.icon}</span>
              <span style={{ fontSize:12, color:'#fff', fontWeight:600 }}>{path.title}</span>
            </div>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.20)', border:'none',
              borderRadius:'50%', width:28, height:28, cursor:'pointer', color:'#fff',
              fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
          </div>
          <div style={{ fontSize:18, fontWeight:800, color:'#fff', fontFamily:'Georgia,serif', marginBottom:4 }}>
            {path.title} for {petName}
          </div>
          <StepIndicator current={step+1} total={path.steps.length} accentColor='rgba(255,255,255,0.90)'/>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.75)' }}>
            Step {step+1} of {path.steps.length}
          </div>
        </div>

        {/* Pet badge */}
        <div style={{ padding:'14px 24px 0', display:'flex', alignItems:'center', gap:10,
          borderBottom:'1px solid #EDE9FE', paddingBottom:12, flexShrink:0 }}>
          <div style={{ width:36, height:36, borderRadius:'50%',
            background:'linear-gradient(135deg,#EDE9FE,#A78BFA)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:18, overflow:'hidden', flexShrink:0 }}>
            {(pet?.photo_url||pet?.avatar_url)
              ? <img src={pet.photo_url||pet.avatar_url} alt={petName} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
              : <span>{pet?.avatar||'🐕'}</span>}
          </div>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText }}>For {petName}</div>
            {pet?.breed && <div style={{ fontSize:12, color:G.mutedText }}>{pet.breed}</div>}
          </div>
        </div>

        {/* Step content */}
        <div style={{ flex:1, overflowY:'auto', padding:'18px 24px' }}>
          <div style={{ fontSize:15, fontWeight:700, color:G.darkText, marginBottom:4 }}>
            {(currentStep.title||'').replace(/{name}/g, petName)}
          </div>
          {currentStep.desc && (
            <div style={{ fontSize:12, color:'#888', marginBottom:14 }}>
              {currentStep.desc.replace(/{name}/g, petName)}
            </div>
          )}
          {currentStep.options.map(opt => (
            <OptionRow key={opt.name} option={opt}
              selected={selections.includes(opt.name)}
              onToggle={() => toggle(opt.name)}
              accentColor={path.accentColor}/>
          ))}
          {currentStep.type==='multi_select' && selections.length>0 && (
            <div style={{ fontSize:11, color:G.mutedText, marginTop:4 }}>
              {selections.length} selected — tap to deselect
            </div>
          )}
        </div>

        {/* Nav buttons */}
        <div style={{ padding:'0 24px 20px', flexShrink:0,
          borderTop:'1px solid #EDE9FE' }}>
          <div style={{ display:'flex', gap:10, paddingTop:16 }}>
            {step > 0 && (
              <button onClick={()=>setStep(s=>s-1)}
                style={{ flex:1, background:'#fff',
                  border:'1.5px solid rgba(124,58,237,0.25)', borderRadius:12, padding:'12px',
                  fontSize:13, fontWeight:600, color:G.violet, cursor:'pointer' }}>
                ← Back
              </button>
            )}
            <button onClick={isLast ? send : ()=>setStep(s=>s+1)}
              disabled={!canNext||sending}
              style={{ flex:2, background: !canNext ? '#E0D8F0'
                : isLast ? `linear-gradient(135deg,${path.accentColor},#3730A3)`
                : `linear-gradient(135deg,${G.violet},#3730A3)`,
                color: !canNext ? '#999' : '#fff', border:'none', borderRadius:12,
                padding:'12px', fontSize:14, fontWeight:800,
                cursor: !canNext ? 'not-allowed' : 'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
              {sending ? 'Sending…' : isLast ? '✦ Send to Concierge®' : 'Continue →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Path Card ─────────────────────────────────────────────────
function PathCard({ path, pet, onOpen }) {
  const petName = pet?.name || 'your dog';
  return (
    <div onClick={onOpen}
      style={{ background:'#fff', borderRadius:16,
        border:`2px solid rgba(124,58,237,0.14)`,
        padding:'20px', cursor:'pointer', transition:'all 0.18s',
        ...(path.miraPick ? { boxShadow:`0 4px 20px ${path.accentColor}25` } : {}) }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = `0 8px 24px ${path.accentColor}20`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = path.miraPick ? `0 4px 20px ${path.accentColor}25` : 'none';
      }}>
      {/* Icon + badges row */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
        <div style={{ width:50, height:50, borderRadius:14,
          background: path.iconBg || '#EDE9FE',
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>
          {path.icon}
        </div>
        {path.badge && (
          <span style={{ fontSize:9, fontWeight:700, padding:'3px 9px', borderRadius:20,
            background: path.badgeBg || path.accentColor, color:'#fff', flexShrink:0 }}>
            {path.badge}
          </span>
        )}
      </div>

      {/* Title + desc */}
      <div style={{ fontSize:15, fontWeight:800, color:G.darkText, marginBottom:6, fontFamily:'Georgia,serif' }}>
        {path.title}
      </div>
      <div style={{ fontSize:13, color:'#888', lineHeight:1.6, marginBottom:14 }}>{path.desc}</div>

      {/* Step preview bars */}
      <div style={{ display:'flex', gap:5, marginBottom:12 }}>
        {(path.stepLabels||[]).map((label,i) => (
          <div key={i} style={{ flex:1 }}>
            <div style={{ height:3, borderRadius:3, marginBottom:3,
              background: i===0 ? path.accentColor : 'rgba(124,58,237,0.15)' }}/>
            <div style={{ fontSize:9, color:'#aaa', textAlign:'center', whiteSpace:'nowrap',
              overflow:'hidden', textOverflow:'ellipsis' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ fontSize:13, color:path.accentColor, fontWeight:700 }}>
        Start for {petName} →
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────
export default function GuidedLearnPaths({ pet }) {
  const [activePath, setActivePath] = useState(null);
  const paths = buildPaths(pet);
  const activePathData = paths.find(p => p.id === activePath);

  return (
    <section style={{ marginBottom:36 }}>
      <div style={{ display:'flex', alignItems:'baseline', gap:10, marginBottom:6 }}>
        <h3 style={{ fontSize:'clamp(1.125rem,2.5vw,1.375rem)', fontWeight:800,
          color:'#1A1363', margin:0, fontFamily:'Georgia,serif' }}>
          Guided Learning Paths
        </h3>
        <span style={{ fontSize:11, background:'linear-gradient(135deg,#7C3AED,#3730A3)',
          color:'#fff', borderRadius:20, padding:'2px 10px', fontWeight:700 }}>
          6 paths
        </span>
      </div>
      <p style={{ fontSize:13, color:'#888', marginBottom:20, lineHeight:1.5 }}>
        Step-by-step programmes arranged by Concierge® — each personalised for {pet?.name||'your dog'}.
      </p>

      <div style={{ display:'grid', gap:14 }} className="glp-grid">
        <style>{`
          .glp-grid { grid-template-columns: 1fr; }
          @media(min-width:560px){ .glp-grid { grid-template-columns: repeat(2,1fr); } }
          @media(min-width:900px){ .glp-grid { grid-template-columns: repeat(3,1fr); } }
        `}</style>
        {paths.map(path => (
          <PathCard key={path.id} path={path} pet={pet} onOpen={() => {
            tdc.request({ text: `Started guided path: ${path.title}`, name: path.title, pillar: "learn", pet, channel: "learn_guided_paths_start" });
            setActivePath(path.id);
          }}/>
        ))}
      </div>

      {activePath && activePathData && (
        <PathFlowModal path={activePathData} pet={pet} onClose={() => setActivePath(null)}/>
      )}
    </section>
  );
}
