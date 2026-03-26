/**
 * CareMobilePage.jsx — /care mobile — Session 89 Desktop-Parity Fix
 *
 * DESKTOP IS THE SINGLE SOURCE OF TRUTH. This file reuses the exact same
 * components as CareSoulPage.jsx. DO NOT REBUILD what desktop already has.
 *
 * Components reused from desktop:
 *  - CareCategoryStrip   → the 9 circular/rounded-square category icons (Pic 3)
 *                          manages its own CareContentModal internally
 *  - WellnessProfile     → "Coco's Grooming Profile" bar → full wellness modal (Pic 1)
 *                          with Vaccines/Medications/Allergies/Vet visits tabs
 *  - PillarSoulProfile   → soul profile card
 *  - Health Vault card   → navigates to /pet-vault/{id} (same as desktop)
 *  - MiraPicksSection    → Mira's AI picks (same as desktop)
 *  - GuidedCarePaths     → guided paths (same as desktop)
 *  - CareConciergeSection → concierge service cards
 *  - CareNearMe          → find care near me
 *
 * Service booking uses CARE_SERVICES array + ServiceBookingModal (same as desktop)
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePillarContext } from '../context/PillarContext';
import { usePlatformTracking } from '../hooks/usePlatformTracking';
import { tdc } from '../utils/tdc_intent';
import PillarPageLayout from '../components/PillarPageLayout';
import PillarSoulProfile from '../components/PillarSoulProfile';
import CareCategoryStrip from '../components/care/CareCategoryStrip';
import CareConciergeSection from '../components/care/CareConciergeSection';
import CareNearMe from '../components/care/CareNearMe';
import GuidedCarePaths from '../components/care/GuidedCarePaths';
import SoulMadeModal from '../components/SoulMadeModal';
import ServiceBookingModal, { guessServiceType } from '../components/ServiceBookingModal';
import { PawrentFirstStepsTab } from '../components/pawrent/PawrentJourney';
import { WellnessProfile, MiraPicksSection, getCareDims, DimExpanded } from './CareSoulPage';
import '../styles/mobile-design-system.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const G = {
  sage:'#40916C', deepMid:'#1B4332', mid:'#2D6A4F',
  pale:'#D8F3DC', cream:'#F0FDF4',
  greenBorder:'rgba(64,145,108,0.2)', dark:'#0A1F13',
  darkText:'#1B4332', mutedText:'#40916C',
};

function vibe(t='light') { if(navigator?.vibrate) navigator.vibrate(t==='medium'?[12]:[6]); }

export default function CareMobilePage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { currentPet, setCurrentPet, pets: contextPets } = usePillarContext();
  usePlatformTracking({ pillar:'care', pet:currentPet });

  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState('care');
  const [soulMadeOpen, setSoulMadeOpen] = useState(false);
  const [svcBooking, setSvcBooking] = useState({ isOpen:false, serviceType:'grooming' });
  const [openDim, setOpenDim]       = useState(null);
  const [apiProducts, setApiProducts] = useState({});
  const dimExpandedRef               = useRef(null);

  // Auto-scroll into expanded dim panel whenever a dim is opened
  useEffect(() => {
    if (openDim && dimExpandedRef.current) {
      setTimeout(() => {
        dimExpandedRef.current?.scrollIntoView({ behavior:'smooth', block:'nearest' });
      }, 80);
    }
  }, [openDim]);

  useEffect(() => {
    if (contextPets !== undefined) setLoading(false);
    if (contextPets?.length > 0 && !currentPet) setCurrentPet(contextPets[0]);
  }, [contextPets, currentPet, setCurrentPet]);

  // Fetch all care products — same logic as desktop CareSoulPage
  useEffect(() => {
    if (!currentPet) return;
    const petBreed = (currentPet?.breed || 'indie').toLowerCase().trim();
    fetch(`${API_URL}/api/admin/pillar-products?pillar=care&limit=600`)
      .then(r => r.ok ? r.json() : null)
      .then(async data => {
        if (!data?.products?.length) return;
        const grouped = {};
        data.products.forEach(p => {
          const productBreeds = (p.breed_tags || []).map(b => b.toLowerCase().trim());
          if (productBreeds.length > 0 && !productBreeds.includes(petBreed)) return;
          // Map dimension → category name that DimExpanded expects
          const DIM_TO_CAT = {
            grooming:    "Grooming",
            dental:      "Dental & Paw",
            coat:        "Coat & Skin",
            wellness:    "Wellness Visits",
            senior:      "Senior Care",
            supplements: "Supplements",
            soul:        "Soul Care Products",
            mira:        "Mira's Care Picks",
          };
          const dimRaw = (p.dimension || p.pillar_category || p.sub_category || '').toLowerCase().trim();
          const categoryKey = DIM_TO_CAT[dimRaw] || p.dimension || '';
          const sub = p.sub_category || 'Other';
          if (!categoryKey) return;
          if (!grouped[categoryKey]) grouped[categoryKey] = {};
          if (!grouped[categoryKey][sub]) grouped[categoryKey][sub] = [];
          grouped[categoryKey][sub].push(p);
        });
        try {
          const breedRes = await fetch(`${API_URL}/api/breed-catalogue/products?pillar=care&breed=${encodeURIComponent(currentPet.breed)}&limit=30`);
          if (breedRes.ok) {
            const breedData = await breedRes.json();
            (breedData.products || []).forEach(p => {
              const dimKey = 'Soul Care Products';
              if (!grouped[dimKey]) grouped[dimKey] = {};
              if (!grouped[dimKey]['soul']) grouped[dimKey]['soul'] = [];
              if (!grouped[dimKey]['soul'].find(x => x.name === p.name)) {
                grouped[dimKey]['soul'].push({ ...p, sub_category: 'soul', pillar: 'care' });
              }
            });
          }
        } catch (e) { /* non-critical */ }
        setApiProducts(grouped);
      }).catch(() => {});
  }, [currentPet]);

  if (loading) return (
    <PillarPageLayout pillar="care" hideHero hideNavigation>
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center' }}><div style={{ fontSize:36, marginBottom:12 }}>🌿</div><div>Loading…</div></div>
      </div>
    </PillarPageLayout>
  );

  const petName = currentPet?.name || 'your dog';

  return (
    <PillarPageLayout pillar="care" hideHero hideNavigation>
      <div data-testid="care-mobile" style={{ backgroundColor:G.cream, minHeight:'100vh' }}>

        {/* SoulMade Modal */}
        {soulMadeOpen && <SoulMadeModal pet={currentPet} pillar="care" pillarColor={G.sage} pillarLabel="Care" onClose={() => setSoulMadeOpen(false)} />}

        {/* ── Mobile Hero ── */}
        <div style={{ background:`linear-gradient(160deg,${G.dark} 0%,${G.deepMid} 55%,${G.mid} 100%)`, padding:'40px 20px 20px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.55)', letterSpacing:'0.14em', marginBottom:4 }}>THE DOGGY COMPANY</div>
              <div style={{ fontSize:28, fontWeight:900, color:'#fff', letterSpacing:'-0.5px' }}>🌿 Care</div>
            </div>
            {/* Pet selector */}
            {contextPets?.length > 1 && (
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', justifyContent:'flex-end' }}>
                {contextPets.map(p => (
                  <button key={p.id} onClick={() => { vibe(); setCurrentPet(p); }}
                    style={{ padding:'5px 13px', borderRadius:999, fontSize:12, fontWeight:700, cursor:'pointer',
                      border: currentPet?.id===p.id ? '2px solid rgba(255,255,255,0.9)' : '2px solid rgba(255,255,255,0.3)',
                      background: currentPet?.id===p.id ? 'rgba(255,255,255,0.2)' : 'transparent',
                      color:'#fff' }}>
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:4 }}>Care & Wellness for {petName}</div>
          <div style={{ fontSize:14, color:'rgba(255,255,255,0.65)' }}>Grooming, health, dental, coat — all personalised.</div>
        </div>

        {/* ── CareCategoryStrip — EXACT DESKTOP COMPONENT ── */}
        {/* This is Pic 3 — 9 rounded icon squares, each opens CareContentModal */}
        {currentPet && (
          <CareCategoryStrip
            pet={currentPet}
            onDimSelect={() => {}}
            activeDim={null}
            onSoulMade={() => setSoulMadeOpen(true)}
          />
        )}

        {/* ── Tab Bar ── */}
        <div className="ios-tab-bar" style={{ borderColor:G.greenBorder }}>
          {[
            { id:'care',      label:'🌿 Care' },
            { id:'services',  label:'✂️ Services' },
            { id:'find-care', label:'📍 Find Care' },
          ].map(tab => (
            <button key={tab.id}
              className={`ios-tab${activeTab===tab.id?' active':''}`}
              style={activeTab===tab.id ? { backgroundColor:G.dark, color:'#fff' } : {}}
              data-testid={`care-tab-${tab.id}`}
              onClick={() => { vibe(); setActiveTab(tab.id); }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ══════════ TAB 1: Care ══════════ */}
        {activeTab === 'care' && currentPet && (
          <div style={{ padding:'16px' }}>

            {/* WellnessProfile — EXACT DESKTOP COMPONENT */}
            <WellnessProfile pet={currentPet} token={token} />

            {/* PillarSoulProfile */}
            <PillarSoulProfile pet={currentPet} token={token} pillar="care" />

            {/* Health Vault card — navigates to /pet-vault/{id} exactly like desktop */}
            <div
              data-testid="health-vault-card"
              onClick={() => navigate(`/pet-vault/${currentPet.id}`)}
              style={{ background:'#fff', border:`2px solid ${G.pale}`, borderRadius:16,
                padding:'14px 18px', cursor:'pointer', display:'flex', alignItems:'center', gap:14,
                boxShadow:'0 2px 12px rgba(45,106,79,0.08)', margin:'0 0 20px', transition:'all 0.15s' }}>
              <div style={{ width:44, height:44, borderRadius:12, flexShrink:0,
                background:'linear-gradient(135deg,#E8F5E9,#A5D6A7)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🏥</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:700, color:G.darkText }}>{petName}'s Health Vault</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:4 }}>
                  <span style={{ fontSize:10, fontWeight:600, color:'#00695C', background:'#E0F2F1', border:'1px solid #80CBC4', borderRadius:20, padding:'2px 8px' }}>💉 Vaccines</span>
                  <span style={{ fontSize:10, fontWeight:600, color:'#1565C0', background:'#E3F2FD', border:'1px solid #90CAF9', borderRadius:20, padding:'2px 8px' }}>💊 Medications</span>
                  <span style={{ fontSize:10, fontWeight:600, color:'#AD1457', background:'#FCE4EC', border:'1px solid #F48FB1', borderRadius:20, padding:'2px 8px' }}>⚕ Allergies</span>
                  <span style={{ fontSize:10, fontWeight:600, color:'#1B4332', background:'#D8F3DC', border:'1px solid #74C69D', borderRadius:20, padding:'2px 8px' }}>🩺 Vet visits</span>
                </div>
              </div>
              <span style={{ fontSize:11, color:G.sage, fontWeight:700, whiteSpace:'nowrap', flexShrink:0 }}>open →</span>
            </div>

            {/* Section header */}
            <div style={{ marginBottom:16 }}>
              <h2 style={{ fontSize:22, fontWeight:800, color:G.darkText, marginBottom:6, lineHeight:1.2 }}>
                How would <span style={{ color:G.sage }}>{petName}</span> love to be cared for?
              </h2>
              <p style={{ fontSize:13, color:G.mutedText, lineHeight:1.6 }}>
                Choose a dimension above — everything is personalised to {petName}'s wellness profile.{' '}
                <span style={{ color:G.deepMid, fontWeight:600 }}>Glowing ones match what {petName} needs most.</span>
              </p>
            </div>

            {/* MiraPicksSection — EXACT DESKTOP COMPONENT */}
            <MiraPicksSection pet={currentPet} />

            {/* ── "Care for [pet]" + 9 Dim Cards — EXACT DESKTOP SECTION ── */}
            {(() => {
              const careDims = getCareDims(currentPet);
              const activeDim = careDims.find(d => d.id === openDim);
              return (
                <>
                  <div style={{ fontSize:20, fontWeight:800, color:G.darkText, marginBottom:4, fontFamily:'Georgia,serif' }}>
                    Care for <span style={{ color:G.sage }}>{petName}</span>
                  </div>
                  <div style={{ fontSize:12, color:'#888', marginBottom:16 }}>
                    {careDims.length} dimensions, matched to {petName}'s coat and health
                  </div>

                  <style>{`
                    .care-dims-grid-mobile{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:8px;}
                    @media(min-width:480px){.care-dims-grid-mobile{grid-template-columns:repeat(3,1fr);}}
                    @keyframes care-dim-spin{to{transform:rotate(360deg)}}
                  `}</style>
                  <div className="care-dims-grid-mobile">
                    {careDims.map(dim => {
                      const isOpen = openDim === dim.id;
                      return (
                        <div
                          key={dim.id}
                          onClick={() => {
                            if (dim.id === 'soul_made') { setSoulMadeOpen(true); return; }
                            setOpenDim(isOpen ? null : dim.id);
                          }}
                          data-testid={`care-dim-${dim.id}`}
                          style={{
                            background: dim.glow ? G.cream : '#fff',
                            border: isOpen ? `2px solid ${G.sage}` : '2px solid transparent',
                            borderRadius:12, padding:'14px 10px', cursor:'pointer',
                            textAlign:'center', transition:'all 0.15s', minHeight:130,
                            boxShadow: dim.glow && !isOpen ? `0 4px 20px ${dim.glowColor}` : 'none',
                            position:'relative', opacity: dim.glow ? 1 : 0.72,
                          }}>
                          {dim.glow && !isOpen && (
                            <div style={{ position:'absolute', top:8, right:8, width:8, height:8, borderRadius:'50%', background:G.sage, boxShadow:`0 0 6px ${G.sage}` }} />
                          )}
                          <div style={{ fontSize:24, marginBottom:8 }}>{dim.icon}</div>
                          <div style={{ fontSize:13, fontWeight:800, color:G.darkText, marginBottom:3 }}>{dim.label}</div>
                          <div style={{ fontSize:10, color:G.mutedText, lineHeight:1.3 }}>{typeof dim.sub === 'string' ? dim.sub.replace(/{name}/g, petName) : ''}</div>
                          {dim.badge && (
                            <div style={{ display:'inline-flex', alignItems:'center', background:dim.badgeBg, color:'#fff', borderRadius:20, padding:'2px 7px', fontSize:9, fontWeight:700, marginTop:6 }}>
                              {typeof dim.badge === 'string' ? dim.badge.replace(/{name}/g, petName) : dim.badge}
                            </div>
                          )}
                          <span style={{ position:'absolute', bottom:6, right:8, fontSize:12, color:'rgba(0,0,0,0.25)', transition:'transform 0.2s', transform:isOpen?'rotate(90deg)':'none' }}>›</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Expanded dim panel — full width, below grid, auto-scrolls into view */}
                  {activeDim && activeDim.id !== 'soul_made' && (
                    <div ref={dimExpandedRef} style={{ marginBottom:16, scrollMarginTop:72 }}>
                      <DimExpanded
                        dim={activeDim}
                        pet={currentPet}
                        onClose={() => setOpenDim(null)}
                        apiProducts={apiProducts}
                      />
                    </div>
                  )}
                </>
              );
            })()}

            {/* PawrentFirstStepsTab — after the dims, same as desktop order */}
            <div style={{ marginTop:16 }}>
              <PawrentFirstStepsTab pet={currentPet} token={token} currentPillar="care" />
            </div>

            {/* GuidedCarePaths — EXACT DESKTOP COMPONENT */}
            <div style={{ marginTop:16 }}>
              <GuidedCarePaths pet={currentPet} />
            </div>

            {/* Concierge section */}
            <CareConciergeSection pet={currentPet} />

            {/* Soul Made CTA */}
            <div style={{ marginTop:16, background:G.dark, borderRadius:24, padding:24, cursor:'pointer' }}
              onClick={() => setSoulMadeOpen(true)}>
              <div style={{ fontSize:13, letterSpacing:'0.14em', color:'rgba(116,198,157,0.9)', fontWeight:700, marginBottom:10 }}>✦ SOUL MADE™ · MADE ONLY FOR {petName.toUpperCase()}</div>
              <div style={{ fontSize:20, fontWeight:800, color:'#fff', marginBottom:16 }}>{petName}'s breed-specific care, curated by Mira.</div>
              <button className="ios-btn-primary" style={{ background:`linear-gradient(135deg,${G.mid},${G.sage})`, fontSize:14 }}>Explore Soul Made →</button>
            </div>
          </div>
        )}

        {/* ══════════ TAB 2: Services ══════════ */}
        {activeTab === 'services' && (
          <div style={{ padding:'16px' }}>
            <div style={{ fontSize:22, fontWeight:800, color:G.darkText, marginBottom:4 }}>
              Care Services for <span style={{ color:G.sage }}>{petName}</span>
            </div>
            <div style={{ fontSize:13, color:G.mutedText, marginBottom:20, lineHeight:1.6 }}>
              Grooming, vet, boarding, behaviour — arranged through Concierge®.
            </div>

            {/* Mobile-native vertical service cards */}
            {[
              { id:'grooming',   icon:'✂️', name:'Grooming',              tagline:'Coat care, bath, nail trim & styling',          accentColor:'#C2185B' },
              { id:'vet',        icon:'🏥', name:'Vet Visits',             tagline:'Clinic discovery, booking & follow-up',          accentColor:'#1565C0' },
              { id:'boarding',   icon:'🏡', name:'Boarding & Daycare',     tagline:'Overnight boarding & daytime supervision',        accentColor:'#2D6A4F' },
              { id:'sitting',    icon:'🏠', name:'Pet Sitting',            tagline:'In-home care, feeding & companionship',           accentColor:'#E65100' },
              { id:'behaviour',  icon:'💜', name:'Behaviour Support',      tagline:'Anxiety, fear & stress coaching',                 accentColor:'#6A1B9A' },
              { id:'senior',     icon:'🌸', name:'Senior & Special Care',  tagline:'Comfort, mobility & special handling',            accentColor:'#AD1457' },
              { id:'nutrition',  icon:'🥗', name:'Nutrition Consults',     tagline:'Diet plan, allergy support & vet-approved picks', accentColor:'#E65100' },
              { id:'emergency',  icon:'🚨', name:'Emergency Help',         tagline:'Urgent care routing & 24/7 coordination',         accentColor:'#C62828', urgent:true },
            ].map(svc => (
              <div key={svc.id}
                data-testid={`care-service-card-${svc.id}`}
                style={{ background:'#fff', borderRadius:16, padding:'16px 18px', marginBottom:12,
                  border:`1.5px solid ${svc.urgent ? '#FFCDD2' : G.pale}`,
                  boxShadow: svc.urgent ? '0 2px 12px rgba(198,40,40,0.08)' : '0 2px 8px rgba(45,106,79,0.06)',
                  display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:48, height:48, borderRadius:14, flexShrink:0,
                  background:`${svc.accentColor}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>
                  {svc.icon}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:15, fontWeight:800, color:G.darkText, marginBottom:2 }}>{svc.name}</div>
                  <div style={{ fontSize:12, color:'#666', lineHeight:1.4 }}>{svc.tagline}</div>
                </div>
                <button
                  onClick={() => {
                    vibe('medium');
                    tdc.book({ service:svc.name, pillar:'care', pet:currentPet, channel:'care_services_tab' });
                    setSvcBooking({ isOpen:true, serviceType:svc.id });
                  }}
                  style={{ flexShrink:0, padding:'9px 14px', borderRadius:12, border:'none', fontSize:13, fontWeight:700, cursor:'pointer',
                    background: svc.urgent ? '#C62828' : G.deepMid, color:'#fff', whiteSpace:'nowrap' }}>
                  Book →
                </button>
              </div>
            ))}

            {/* Concierge illustrated cards below */}
            <div style={{ marginTop:8 }}>
              <CareConciergeSection pet={currentPet} />
            </div>
          </div>
        )}

        {/* ══════════ TAB 3: Find Care ══════════ */}
        {activeTab === 'find-care' && (
          <div style={{ padding:'16px' }}>
            <CareNearMe pet={currentPet} token={token} onBook={svc => {
              tdc.book({ service:svc, pillar:'care', pet:currentPet, channel:'care_nearme' });
              setSvcBooking({ isOpen:true, serviceType:guessServiceType(svc) });
            }} />
          </div>
        )}

      </div>

      {/* Service Booking Modal */}
      <ServiceBookingModal
        isOpen={svcBooking.isOpen}
        onClose={() => setSvcBooking(p => ({ ...p, isOpen:false }))}
        serviceType={svcBooking.serviceType}
        pet={currentPet}
        onBookingComplete={() => setSvcBooking(p => ({ ...p, isOpen:false }))}
      />
    </PillarPageLayout>
  );
}
