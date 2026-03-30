/**
 * ServicesMobilePage.jsx — /services (mobile)
 * Mirrors desktop ServicesSoulPage: watercolour illustrations + service groups
 * Rule: Desktop is always the source of truth. Mobile changes layout, never content.
 */
import PillarConciergeCards from '../components/common/PillarConciergeCards';
import ServiceConciergeModal from '../components/services/ServiceConciergeModal';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePillarContext } from '../context/PillarContext';
import { useConcierge } from '../hooks/useConcierge';
import { usePlatformTracking } from '../hooks/usePlatformTracking';
import { tdc } from '../utils/tdc_intent';
import { API_URL } from '../utils/api';
import PillarPageLayout from '../components/PillarPageLayout';
import PillarSoulProfile from '../components/PillarSoulProfile';
import PersonalisedBreedSection from '../components/common/PersonalisedBreedSection';
import { PawrentFirstStepsTab } from '../components/pawrent/PawrentJourney';
import PillarCategoryStrip from '../components/common/PillarCategoryStrip';
import MiraPlanModal from '../components/mira/MiraPlanModal';
import PillarHero from '../components/PillarHero';
import '../styles/mobile-design-system.css';

// ── Service groups — identical to desktop (source of truth) ──────────────────
const SERVICE_GROUPS = [
  { id:"pamper",    label:"Pamper & Groom",       icon:"✨", colour:"#40916C", pillars:["care"],                                          desc:"Grooming, spa, coat care — for every breed and comfort level" },
  { id:"health",    label:"Health & Vet",          icon:"🏥", colour:"#DC2626", pillars:["care","emergency"],                               desc:"Vet consultations, emergency support, first aid" },
  { id:"learn",     label:"Train & Learn",         icon:"🎓", colour:"#7C3AED", pillars:["learn","play"],                                   desc:"Training, behaviour, enrichment, puppy foundations" },
  { id:"celebrate", label:"Celebrate",             icon:"🎉", colour:"#9B59B6", pillars:["celebrate"],                                      desc:"Birthday parties, photography, special occasions" },
  { id:"fitness",   label:"Fitness & Walks",       icon:"🏃", colour:"#E76F51", pillars:["fit","play"],                                     desc:"Dog walking, fitness plans, hydrotherapy" },
  { id:"travel",    label:"Travel & Paperwork",    icon:"✈️",  colour:"#1ABC9C", pillars:["go","travel","paperwork"],                        desc:"Pet passports, microchipping, travel docs, flight coordination" },
  { id:"life",      label:"Life Events",           icon:"🌷", colour:"#6366F1", pillars:["adopt","farewell","enjoy","dine"],                desc:"Adoption support, farewell services, dining, social events" },
];

const SVC_STRIP_CATS = [
  { id:"pamper",    icon:"✨", label:"Pamper",       iconBg:"linear-gradient(135deg,#ECFDF5,#A7F3D0)" },
  { id:"health",    icon:"🏥", label:"Health & Vet", iconBg:"linear-gradient(135deg,#FEE2E2,#FECACA)" },
  { id:"learn",     icon:"🎓", label:"Train",        iconBg:"linear-gradient(135deg,#EDE9FE,#DDD6FE)" },
  { id:"celebrate", icon:"🎉", label:"Celebrate",    iconBg:"linear-gradient(135deg,#FDF2F8,#FBCFE8)" },
  { id:"fitness",   icon:"🏃", label:"Fitness",      iconBg:"linear-gradient(135deg,#FFF7ED,#FED7AA)" },
  { id:"travel",    icon:"✈️",  label:"Travel",       iconBg:"linear-gradient(135deg,#DCFCE7,#BBF7D0)" },
  { id:"life",      icon:"🌷", label:"Life Events",  iconBg:"linear-gradient(135deg,#EFF6FF,#BFDBFE)" },
];

const G = {
  navy:'#0F1A3D', navyL:'#2E4DA6', navyXL:'#5B7FD4',
  cream:'#F0F2FF', border:'#C5CFF0', dark:'#060D1E', taupe:'#4A557A',
  deep:'#0F1A3D', mutedText:'#6B7280', pale:'#F8FAFC',
};
const CSS = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
.svc{font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Inter',sans-serif;background:${G.cream};color:${G.dark};min-height:100vh;padding-bottom:calc(96px + env(safe-area-inset-bottom))}
.svc-cta{display:flex;align-items:center;justify-content:center;width:100%;min-height:48px;padding:13px 20px;border-radius:14px;border:none;background:linear-gradient(135deg,${G.navy},${G.navyL});color:#fff;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;transition:transform 0.15s}
.svc-cta:active{transform:scale(0.97)}`;

function vibe(t='light') { if(navigator?.vibrate) navigator.vibrate(t==='medium'?[12]:[6]); }

// ── Mobile Service Card — exact same content as desktop, touch-optimized layout ──
function MobileServiceCard({ service, groupColour, onBook }) {
  const img = service.watercolour_image || service.image_url || service.image || null;
  return (
    <div
      onClick={() => onBook(service)}
      style={{ background:'#fff', border:`1px solid ${G.border}`, borderRadius:14,
                overflow:'hidden', marginBottom:10, cursor:'pointer', transition:'transform 0.15s' }}
      onTouchStart={e => e.currentTarget.style.transform='scale(0.98)'}
      onTouchEnd={e => e.currentTarget.style.transform=''}
      data-testid={`mobile-service-card-${service._id || service.id}`}>
      {/* Watercolour image — full card is tappable */}
      <div style={{ height:90, background: img ? 'transparent' : `linear-gradient(135deg,${groupColour}22,${groupColour}44)`,
                    display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
        {img
          ? <img src={img} alt={service.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          : <div style={{ fontSize:32 }}>{service.icon || '✦'}</div>}
      </div>
      <div style={{ padding:'10px 12px 12px' }}>
        <div style={{ fontSize:13, fontWeight:700, color:G.deep, marginBottom:3, lineHeight:1.3 }}>
          {service.name}
        </div>
        {service.description && (
          <div style={{ fontSize:11, color:G.mutedText, lineHeight:1.4, marginBottom:8,
                        display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
            {service.description.slice(0, 80)}
          </div>
        )}
        <div
          data-testid={`mobile-service-book-${service._id || service.id}`}
          style={{ width:'100%', padding:'9px', borderRadius:10, fontSize:13, fontWeight:700,
                   background:'linear-gradient(135deg,#C9973A,#F0C060)', textAlign:'center',
                   color:'#1A0A00' }}>
          Book via Concierge® →
        </div>
      </div>
    </div>
  );
}

// ── Mobile Service Group — accordion with watercolour cards ───────────────────
function MobileServiceGroup({ group, services, onBook }) {
  const [expanded, setExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);
  if (!services.length) return null;
  const visible = showAll ? services : services.slice(0, 4);
  return (
    <div style={{ marginBottom:4, borderRadius:16, overflow:'hidden',
                  border:`1px solid ${group.colour}30`, background:'#fff' }}
         data-testid={`service-group-${group.id}`}>
      {/* Group header — tap to expand */}
      <button onClick={() => { vibe(); setExpanded(e => !e); }}
        style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'14px 16px',
                 background:'transparent', border:'none', cursor:'pointer', textAlign:'left' }}>
        <div style={{ width:38, height:38, borderRadius:10, background:`${group.colour}18`,
                      display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
          {group.icon}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:800, color:G.deep, fontFamily:'Georgia,serif' }}>
            {group.label}
          </div>
          <div style={{ fontSize:11, color:G.mutedText, marginTop:1 }}>{group.desc}</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:11, fontWeight:700, background:`${group.colour}18`,
                         color:group.colour, borderRadius:20, padding:'3px 8px' }}>
            {services.length}
          </span>
          <span style={{ color:G.mutedText, fontSize:12, transform: expanded ? 'rotate(180deg)' : 'none', transition:'transform 0.2s' }}>▼</span>
        </div>
      </button>

      {expanded && (
        <div style={{ padding:'0 12px 12px' }}>
          {visible.map((svc, i) => (
            <MobileServiceCard key={svc._id || svc.id || i} service={svc}
              groupColour={group.colour} onBook={onBook} />
          ))}
          {services.length > 4 && (
            <button onClick={() => setShowAll(s => !s)}
              style={{ width:'100%', padding:'10px', borderRadius:10, fontSize:13,
                       fontWeight:600, background:G.pale, border:`1px solid ${G.border}`,
                       color:G.mutedText, cursor:'pointer', marginTop:4 }}>
              {showAll ? 'Show less' : `Show all ${services.length} ${group.label.toLowerCase()} services`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function ServicesMobilePage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { currentPet, setCurrentPet, pets: contextPets } = usePillarContext();
  usePlatformTracking({ pillar:'services', pet:currentPet });
  const { request } = useConcierge({ pet:currentPet, pillar:'services' });

  const [loading, setLoading] = useState(true);
  const [svcBooking, setSvcBooking] = useState(null); // null = closed; object = BookingModal open
  const [showSvcPlan, setShowSvcPlan] = useState(false);
  const [allServices, setAllServices] = useState([]);
  const [svcLoading, setSvcLoading] = useState(true);

  // Fetch all services — identical to desktop
  useEffect(() => {
    const PILLARS = ["care","emergency","learn","play","celebrate","fit","go","travel","paperwork","adopt","farewell","enjoy","dine"];
    Promise.all(
      PILLARS.map(p =>
        fetch(`${API_URL}/api/service-box/services?pillar=${p}`)
          .then(r => r.ok ? r.json() : null)
          .then(data => (data?.services || []).map(s => ({ ...s, pillar:p })))
          .catch(() => [])
      )
    ).then(results => {
      setAllServices(results.flat());
      setSvcLoading(false);
    });
  }, []);

  useEffect(() => {
    if (contextPets !== undefined) setLoading(false);
    if (contextPets?.length > 0 && !currentPet) setCurrentPet(contextPets[0]);
  }, [contextPets, currentPet, setCurrentPet]);

  const handleBook = useCallback((svc) => {
    vibe('medium');
    tdc.book({ service:svc.name || svc.label, pillar:'services', pet:currentPet, channel:'services_group_card' });
    setSvcBooking(svc);  // open BookingModal with this service
  }, [currentPet]);

  // Group services exactly like desktop
  const grouped = SERVICE_GROUPS.map(group => ({
    ...group,
    services: allServices.filter(s => group.pillars.includes(s.pillar)),
  }));

  if (loading) return (
    <PillarPageLayout pillar="services" hideHero hideNavigation>
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center' }}><div style={{ fontSize:36, marginBottom:12 }}>🤝</div><div>Loading services…</div></div>
      </div>
    </PillarPageLayout>
  );

  if (!currentPet) return (
    <PillarPageLayout pillar="services" hideHero hideNavigation>
      <div className="svc mobile-page-container"><style>{CSS}</style>
        <div style={{ padding:'24px 16px', textAlign:'center' }}>
          <div style={{ background:'#fff', border:`1px solid ${G.border}`, borderRadius:22, padding:'32px 20px' }}>
            <div style={{ fontSize:44, marginBottom:14 }}>🤝</div>
            <div style={{ fontSize:22, fontWeight:700, marginBottom:8 }}>Add your pet to unlock Services</div>
            <button className="svc-cta" style={{ marginTop:16 }} onClick={() => navigate('/join')}>Add your pet →</button>
          </div>
        </div>
      </div>
    </PillarPageLayout>
  );

  const petName = currentPet.name;

  return (
    <PillarPageLayout pillar="services" hideHero hideNavigation>
      <div className="svc mobile-page-container" data-testid="services-mobile">
        <style>{CSS}</style>

        {/* Hero */}
        <PillarHero
          pillar="services"
          pet={currentPet}
          allPets={contextPets || []}
          onSwitchPet={p => { vibe(); setCurrentPet(p); }}
          gradient={`linear-gradient(160deg,${G.dark} 0%,${G.navy} 50%,${G.navyL} 100%)`}
          title="🤝 Services"
          subtitle={`Expert Services for ${petName}`}
          tagline={`Every service arranged by Concierge® · Matched to ${petName}'s soul`}
        />

        {/* Services Category Strip — always visible above content */}
        <PillarCategoryStrip
          categories={SVC_STRIP_CATS}
          activeId={null}
          onSelect={id => {
            vibe();
            // Expand corresponding service group
            const el = document.querySelector(`[data-testid="service-group-${id}"] button`);
            if (el) { el.click(); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
          }}
          accentColor={G.navyL}
        />

        <div style={{ padding:'0 16px 8px' }}>
          <PillarConciergeCards
            pillar="services"
            pet={currentPet}
            token={token}
          />
          <PillarSoulProfile pet={currentPet} pillar="services" token={token} />
        </div>

        {/* Soul Pillar CTA */}
        <div style={{ margin:'0 16px 12px', background:'linear-gradient(135deg,rgba(91,127,212,0.08),rgba(91,127,212,0.14))', border:'1px solid rgba(91,127,212,0.25)', borderRadius:18, padding:'16px' }}>
          <div style={{ fontSize:18, fontWeight:700, color:G.dark, lineHeight:1.25, marginBottom:4 }}>
            What would <span style={{ color:G.navyL }}>{petName}</span> need?
          </div>
          <div style={{ fontSize:13, color:G.taupe, lineHeight:1.5 }}>
            Every service personally arranged by Concierge®. Matched to {petName}'s soul profile and health needs.
          </div>
        </div>

        {/* Pawrent Journey First Steps */}
        {currentPet && <div style={{ padding:'0 16px 8px' }}><PawrentFirstStepsTab pet={currentPet} token={token} currentPillar="services" /></div>}

        {/* Mira Bar */}
        <div style={{ margin:'0 16px 20px', background:G.dark, borderRadius:20, padding:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:'rgba(91,127,212,0.9)', letterSpacing:'0.1em', marginBottom:8 }}>✦ MIRA ON {petName.toUpperCase()}'S SERVICES</div>
          <div style={{ fontSize:14, color:'rgba(255,255,255,0.75)', lineHeight:1.6, marginBottom:14, fontStyle:'italic' }}>
            "I know {petName}'s breed and health history. Every service here is matched to what they actually need."
          </div>
          <button className="svc-cta" onClick={() => { vibe('medium'); setSvcBooking({ name:'General Inquiry', pillar:'services' }); }}>
            See Mira's Service Picks →
          </button>
        </div>

        {/* Service Group Cards — with watercolour illustrations (mirrors desktop exactly) */}
        <div style={{ padding:'0 16px 8px' }}>
          <div style={{ fontSize:20, fontWeight:700, marginBottom:4 }}>Concierge® Services for {petName}</div>
          <div style={{ fontSize:14, color:G.taupe, marginBottom:12 }}>Mira's handpicked experts. One message and it's arranged.</div>
        </div>

        {svcLoading ? (
          <div style={{ textAlign:'center', padding:'20px 16px', color:G.taupe, fontSize:14 }}>
            Loading services…
          </div>
        ) : (
          <div style={{ padding:'0 16px 8px' }}>
            {grouped.map(group => (
              <MobileServiceGroup key={group.id} group={group} services={group.services} onBook={handleBook} />
            ))}
          </div>
        )}

        <div style={{ padding:'0 16px 24px' }}>
          <PersonalisedBreedSection pet={currentPet} pillar="services" token={token} entityType="service" />
        </div>

        {/* Concierge® CTA */}
        <div style={{ margin:'0 16px 24px', background:G.dark, borderRadius:24, padding:20 }}>
          <div style={{ display:'inline-flex', background:'rgba(91,127,212,0.2)', border:'1px solid rgba(91,127,212,0.4)', borderRadius:999, padding:'5px 14px', color:G.navyXL, fontSize:14, fontWeight:600, marginBottom:12 }}>🤝 Concierge®</div>
          <div style={{ fontSize:22, fontWeight:700, color:'#fff', lineHeight:1.2, marginBottom:10, fontFamily:'Georgia,serif' }}>Every service arranged by your Concierge®.</div>
          <div style={{ fontSize:14, color:'rgba(255,255,255,0.6)', lineHeight:1.7, marginBottom:16 }}>Vets, groomers, trainers, nutritionists. One message and it's done.</div>
          <button onClick={() => { vibe('medium'); setSvcBooking({ name:'General Inquiry', pillar:'services' }); }}
            style={{ width:'100%', minHeight:48, borderRadius:14, border:'none', background:`linear-gradient(135deg,${G.navyL},${G.navyXL})`, color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer' }}>
            Book via Concierge® →
          </button>
        </div>
      </div>

      {/* BookingModal — intake style, no prices (same as desktop ServicesSoulPage) */}
      {svcBooking && (
        <ServiceConciergeModal
          service={svcBooking}
          pet={currentPet}
          user={user}
          onClose={() => setSvcBooking(null)}
          onBooked={() => setSvcBooking(null)}
        />
      )}
      <MiraPlanModal
        isOpen={showSvcPlan}
        onClose={() => setShowSvcPlan(false)}
        pet={currentPet}
        pillar="services"
        token={token}
      />
    </PillarPageLayout>
  );
}
