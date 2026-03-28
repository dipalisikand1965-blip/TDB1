/**
 * ServicesMobilePage.jsx — /services (mobile)
 * 7 expandable service group cards — mirrors desktop SERVICE_GROUPS
 * Each group fetches from /api/service-box/services?pillar=X lazily (on expand)
 */
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
import ServiceBookingModal, { guessServiceType } from '../components/ServiceBookingModal';
import '../styles/mobile-design-system.css';

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
};
const CSS = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
.svc{font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Inter',sans-serif;background:${G.cream};color:${G.dark};min-height:100vh;padding-bottom:calc(96px + env(safe-area-inset-bottom))}
.svc-cta{display:flex;align-items:center;justify-content:center;width:100%;min-height:48px;padding:13px 20px;border-radius:14px;border:none;background:linear-gradient(135deg,${G.navy},${G.navyL});color:#fff;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;transition:transform 0.15s}
.svc-cta:active{transform:scale(0.97)}`;

function vibe(t='light') { if(navigator?.vibrate) navigator.vibrate(t==='medium'?[12]:[6]); }

const SERVICE_GROUPS = [
  { id:"pamper",    label:"Pamper & Groom",       icon:"✨", colour:"#40916C", pillars:["care"],                        desc:"Grooming, spa, coat care — for every breed and comfort level" },
  { id:"health",    label:"Health & Vet",          icon:"🏥", colour:"#DC2626", pillars:["care","emergency"],            desc:"Vet consultations, emergency support, first aid" },
  { id:"learn",     label:"Train & Learn",         icon:"🎓", colour:"#7C3AED", pillars:["learn","play"],               desc:"Training, behaviour, enrichment, puppy foundations" },
  { id:"celebrate", label:"Celebrate",             icon:"🎉", colour:"#9B59B6", pillars:["celebrate"],                  desc:"Birthday parties, photography, special occasions" },
  { id:"fitness",   label:"Fitness & Walks",       icon:"🏃", colour:"#E76F51", pillars:["fit","play"],                 desc:"Dog walking, fitness plans, hydrotherapy" },
  { id:"travel",    label:"Travel & Paperwork",    icon:"✈️", colour:"#1ABC9C", pillars:["go","travel","paperwork"],    desc:"Pet passports, microchipping, travel docs, flight coordination" },
  { id:"life",      label:"Life Events",           icon:"🌷", colour:"#6366F1", pillars:["adopt","farewell","dine"],    desc:"Adoption support, farewell services, dining, social events" },
];

function ServiceGroupCard({ group, pet, token, onBook }) {
  const [expanded, setExpanded] = useState(false);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const toggle = () => {
    vibe();
    if (!expanded && !fetched) {
      setLoading(true);
      // Fetch from the first pillar in the group
      const pillar = group.pillars[0];
      fetch(`${API_URL}/api/service-box/services?pillar=${pillar}&limit=12&is_active=true`, {
        headers: token ? { Authorization:`Bearer ${token}` } : {}
      })
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          setServices(d?.services || []);
          setLoading(false);
          setFetched(true);
        })
        .catch(() => { setLoading(false); setFetched(true); });
    }
    setExpanded(e => !e);
  };

  const petName = pet?.name || 'your dog';

  return (
    <div style={{ background:'#fff', borderRadius:18, border:`1.5px solid ${G.border}`, overflow:'hidden', marginBottom:12 }}
      data-testid={`service-group-${group.id}`}>
      {/* Group Header */}
      <button onClick={toggle}
        style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'16px', background:'none', border:'none', cursor:'pointer', textAlign:'left' }}>
        <div style={{ width:44, height:44, borderRadius:14, background:`${group.colour}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
          {group.icon}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:16, fontWeight:700, color:G.dark, marginBottom:2 }}>{group.label}</div>
          <div style={{ fontSize:14, color:G.taupe }}>{group.desc}</div>
        </div>
        <div style={{ fontSize:20, color:G.taupe, transform:expanded?'rotate(180deg)':'rotate(0deg)', transition:'transform 0.2s', flexShrink:0 }}>
          ›
        </div>
      </button>

      {/* Expanded Services */}
      {expanded && (
        <div style={{ borderTop:`1px solid ${G.border}`, padding:'0 16px 16px' }}>
          {loading && (
            <div style={{ textAlign:'center', padding:'24px 0', color:'#888' }}>
              <div style={{ fontSize:24, marginBottom:8 }}>{group.icon}</div>
              <div style={{ fontSize:14 }}>Loading {group.label} services…</div>
            </div>
          )}

          {!loading && services.length === 0 && fetched && (
            <div style={{ padding:'16px 0' }}>
              <div style={{ fontSize:14, color:G.taupe, marginBottom:12, fontStyle:'italic' }}>
                {group.label} services available via Concierge®
              </div>
              <button onClick={() => onBook({ name:group.label, icon:group.icon, colour:group.colour })}
                style={{ width:'100%', minHeight:44, borderRadius:12, border:'none', background:`linear-gradient(135deg,${group.colour},${G.navyL})`, color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }}>
                Book {group.label} via Concierge® →
              </button>
            </div>
          )}

          {!loading && services.length > 0 && (
            <div style={{ marginTop:12 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {services.map((svc, i) => {
                  const img = svc.watercolour_image || svc.watercolor_image || svc.image_url || svc.image || null;
                  return (
                    <div key={svc.id || svc._id || i}
                      onClick={() => onBook(svc)}
                      data-testid={`svc-card-${group.id}-${i}`}
                      style={{ background:'#fff', borderRadius:14, border:`1px solid ${group.colour}20`, overflow:'hidden', cursor:'pointer', boxShadow:`0 2px 8px ${group.colour}10` }}>
                      {/* Watercolour image */}
                      <div style={{ position:'relative', width:'100%', aspectRatio:'4/3', background:`${group.colour}10`, overflow:'hidden' }}>
                        {img
                          ? <img src={img} alt={svc.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} loading="lazy" />
                          : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, background:`linear-gradient(135deg,${group.colour}15,${group.colour}25)` }}>
                              {group.icon}
                            </div>
                        }
                        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:40, background:`linear-gradient(transparent,rgba(255,255,255,0.95))` }} />
                      </div>
                      {/* Info */}
                      <div style={{ padding:'10px 10px 12px' }}>
                        <div style={{ fontSize:12, fontWeight:700, color:G.dark, lineHeight:1.3, marginBottom:3, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{svc.name}</div>
                        <div style={{ fontSize:10, fontWeight:600, color:group.colour, letterSpacing:'0.05em', marginBottom:8 }}>PRICE ON REQUEST</div>
                        <button onClick={e => { e.stopPropagation(); onBook(svc); }}
                          style={{ width:'100%', padding:'7px', borderRadius:20, border:'none', background:`linear-gradient(135deg,${group.colour},${G.navyL})`, color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                          Book via Concierge® →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button onClick={() => onBook({ name:`${group.label} — All Services`, icon:group.icon, colour:group.colour })}
                style={{ marginTop:12, width:'100%', minHeight:44, borderRadius:12, border:`1.5px solid ${group.colour}`, background:'#fff', fontSize:14, fontWeight:600, color:group.colour, cursor:'pointer' }}>
                Explore all {group.label} via Concierge® →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ServicesMobilePage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { currentPet, setCurrentPet, pets: contextPets } = usePillarContext();
  usePlatformTracking({ pillar:'services', pet:currentPet });
  const { request } = useConcierge({ pet:currentPet, pillar:'services' });

  const [loading, setLoading] = useState(true);
  const [svcBooking, setSvcBooking] = useState({ isOpen: false, serviceType: 'grooming' });
  const [selectedSvc, setSelectedSvc] = useState(null);
  const [showSvcPlan, setShowSvcPlan] = useState(false);

  useEffect(() => {
    if (contextPets !== undefined) setLoading(false);
    if (contextPets?.length > 0 && !currentPet) setCurrentPet(contextPets[0]);
  }, [contextPets, currentPet, setCurrentPet]);

  const handleBook = useCallback((svc) => {
    vibe('medium');
    tdc.book({ service:svc.name || svc.label, pillar:'services', pet:currentPet, channel:'services_group_card' });
    setSelectedSvc(svc);
    setSvcBooking({ isOpen: true, serviceType: guessServiceType(svc) });
  }, [currentPet]);

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
        <div style={{ background:`linear-gradient(160deg,${G.dark} 0%,${G.navy} 50%,${G.navyL} 100%)`, padding:'32px 16px 24px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.5)', letterSpacing:'0.1em', marginBottom:2 }}>THE DOGGY COMPANY</div>
              <div style={{ fontSize:22, fontWeight:700, color:'#fff' }}>🤝 Services</div>
            </div>
            {contextPets?.length > 1 && (
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {contextPets.map(p => (
                  <button key={p.id} onClick={() => { vibe(); setCurrentPet(p); }}
                    style={{ padding:'6px 16px', borderRadius:999, fontSize:13, fontWeight:700,
                      border: currentPet?.id===p.id ? '2px solid rgba(255,255,255,0.9)' : '2px solid rgba(255,255,255,0.3)',
                      background: currentPet?.id===p.id ? 'rgba(255,255,255,0.22)' : 'transparent',
                      color:'#fff', cursor:'pointer', transition:'all 0.15s' }}>
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div style={{ fontSize:20, fontWeight:700, color:'#fff', marginBottom:4 }}>Expert Services for {petName}</div>
          <div style={{ fontSize:15, color:'rgba(255,255,255,0.7)' }}>Every service arranged by Concierge® · Matched to {petName}'s soul</div>
        </div>

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
          <button className="svc-cta" onClick={() => { vibe('medium'); request(`Services for ${petName}`, { channel:'services_mira_cta' }); }}>
            See Mira's Service Picks →
          </button>
        </div>

        {/* Service Group Cards */}
        <div style={{ padding:'0 16px 8px' }}>
          <div style={{ fontSize:20, fontWeight:700, marginBottom:4 }}>Concierge® Services for {petName}</div>
          <div style={{ fontSize:14, color:G.taupe, marginBottom:16 }}>Mira's handpicked experts. One message and it's arranged.</div>
          {SERVICE_GROUPS.map(group => (
            <ServiceGroupCard
              key={group.id}
              group={group}
              pet={currentPet}
              token={token}
              onBook={handleBook}
            />
          ))}
        </div>

        <div style={{ padding:'0 16px 24px' }}>
          <PersonalisedBreedSection pet={currentPet} pillar="services" token={token} entityType="service" />
        </div>

        {/* Concierge® CTA */}
        <div style={{ margin:'0 16px 24px', background:G.dark, borderRadius:24, padding:20 }}>
          <div style={{ display:'inline-flex', background:'rgba(91,127,212,0.2)', border:'1px solid rgba(91,127,212,0.4)', borderRadius:999, padding:'5px 14px', color:G.navyXL, fontSize:14, fontWeight:600, marginBottom:12 }}>🤝 Concierge®</div>
          <div style={{ fontSize:22, fontWeight:700, color:'#fff', lineHeight:1.2, marginBottom:10, fontFamily:'Georgia,serif' }}>Every service arranged by your Concierge®.</div>
          <div style={{ fontSize:14, color:'rgba(255,255,255,0.6)', lineHeight:1.7, marginBottom:16 }}>Vets, groomers, trainers, nutritionists. One message and it's done.</div>
          <button onClick={() => { vibe('medium'); setSvcBooking({ isOpen: true, serviceType: 'grooming' }); }}
            style={{ width:'100%', minHeight:48, borderRadius:14, border:'none', background:`linear-gradient(135deg,${G.navyL},${G.navyXL})`, color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer' }}>
            Book via Concierge® →
          </button>
        </div>
      </div>

      {/* Service Booking Modal — full 4-step flow */}
      <ServiceBookingModal
        isOpen={svcBooking.isOpen}
        onClose={() => setSvcBooking(p => ({ ...p, isOpen: false }))}
        serviceType={svcBooking.serviceType}
        onBookingComplete={() => { setSvcBooking(p => ({ ...p, isOpen: false })); }}
      />
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
