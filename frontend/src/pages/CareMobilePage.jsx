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
import PillarConciergeCards from '../components/common/PillarConciergeCards';
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
import { WellnessProfile, MiraPicksSection, getCareDims, DimExpanded, CARE_SERVICES, CareServiceFlowModal } from './CareSoulPage';
import MiraPlanModal from '../components/mira/MiraPlanModal';
import FirstTimePawrent from '../components/common/FirstTimePawrent';
import '../styles/mobile-design-system.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;

/* ─── Watch & Learn section ─────────────────────────────────────────────── */
const CARE_WATCH_QUERIES = [
  'dog grooming tips at home',
  'dog health wellness routine',
  'dog dental care how to',
  'dog skin coat care tips',
];

function WatchSection({ pet }) {
  const [videos, setVideos] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const breed = pet?.breed || 'dog';

  useEffect(() => {
    const q = `${breed} ${CARE_WATCH_QUERIES[0]}`;
    fetch(`${API_URL}/api/test/youtube?query=${encodeURIComponent(q)}&max_results=6`)
      .then(r => r.json())
      .then(d => {
        const list = (d?.videos || d?.items || d?.results || []).map(v => ({
          id: v.videoId || v.id?.videoId || v.id,
          title: v.title || v.snippet?.title || '',
          thumbnail: v.thumbnail || v.snippet?.thumbnails?.medium?.url || '',
          url: `https://www.youtube.com/watch?v=${v.videoId || v.id?.videoId || v.id}`,
        }));
        setVideos(list);
      })
      .catch(() => {});
  }, [breed]);

  if (!videos.length) return null;
  const shown = expanded ? videos : videos.slice(0, 4);

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <div style={{ fontSize:11, letterSpacing:'0.12em', fontWeight:700, color:'rgba(64,145,108,0.9)', textTransform:'uppercase' }}>
          ✦ Watch &amp; Learn
        </div>
        {videos.length > 4 && (
          <button onClick={() => setExpanded(e => !e)}
            style={{ fontSize:11, color:'#40916C', fontWeight:600, background:'none', border:'none', cursor:'pointer', padding:0 }}>
            {expanded ? 'Show less' : `+${videos.length - 4} more`}
          </button>
        )}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        {shown.map((v, i) => (
          <div key={v.id || i} onClick={() => window.open(v.url, '_blank')}
            style={{ cursor:'pointer', borderRadius:12, overflow:'hidden', border:'1px solid rgba(64,145,108,0.18)', background:'#fff', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ position:'relative', paddingTop:'56.25%', background:'#e8f5e9' }}>
              {v.thumbnail && <img src={v.thumbnail} alt={v.title} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />}
              <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.22)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <div style={{ width:32, height:32, borderRadius:'50%', background:'rgba(0,0,0,0.65)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ color:'#fff', fontSize:13, marginLeft:2 }}>▶</span>
                </div>
              </div>
            </div>
            <div style={{ padding:'8px 10px' }}>
              <div style={{ fontSize:11, fontWeight:600, color:'#1B4332', lineHeight:1.4 }}>
                {(v.title||'').slice(0, 55)}{v.title?.length > 55 ? '…' : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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
  const [showCarePlan, setShowCarePlan] = useState(false);
  const [activeTab, setActiveTab]   = useState('care');
  const [soulMadeOpen, setSoulMadeOpen] = useState(false);
  const [svcBooking, setSvcBooking] = useState({ isOpen:false, serviceType:'grooming' });
  const [openDim, setOpenDim]             = useState(null);
  const [apiProducts, setApiProducts]     = useState({});
  const [activeServicePath, setActiveSvcPath] = useState(null); // CareServiceFlowModal
  const dimExpandedRef                    = useRef(null);

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

        {/* First Time Pawrent — emotional centrepiece */}
        {currentPet && <div style={{ padding:'0 16px 0' }}><FirstTimePawrent pet={currentPet} token={token} accentColor="#40916C" /></div>}

        {/* ── Tab Bar ── */}
        <div className="ios-tab-bar" style={{ borderColor:G.greenBorder }}>
          {[
            { id:'care',      label:'🌿 Care' },
            { id:'services',  label:'🐕 Services' },
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

            {/* CareCategoryStrip — inside Care tab (moved from above tab bar) */}
            <div style={{ margin:'0 -16px 8px' }}>
              <CareCategoryStrip
                pet={currentPet}
                onDimSelect={() => {}}
                activeDim={null}
                onSoulMade={() => setSoulMadeOpen(true)}
              />
            </div>

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

            {/* Watch & Learn — YouTube section */}
            <WatchSection pet={currentPet} />

            {/* Soul Made CTA */}
            <div style={{ marginTop:16, background:G.dark, borderRadius:24, padding:24, cursor:'pointer' }}
              onClick={() => setSoulMadeOpen(true)}>
              <div style={{ fontSize:13, letterSpacing:'0.14em', color:'rgba(116,198,157,0.9)', fontWeight:700, marginBottom:10 }}>✦ SOUL MADE™ · MADE ONLY FOR {petName.toUpperCase()}</div>
              <div style={{ fontSize:20, fontWeight:800, color:'#fff', marginBottom:16 }}>{petName}'s breed-specific care, curated by Mira.</div>
              <button className="ios-btn-primary" style={{ background:`linear-gradient(135deg,${G.mid},${G.sage})`, fontSize:14 }}>Explore Soul Made →</button>
            </div>

            {/* Mira Care Plan CTA */}
            <div style={{ marginTop:12, background:`linear-gradient(135deg,rgba(116,198,157,0.12),rgba(116,198,157,0.06))`, border:`1px solid rgba(116,198,157,0.3)`, borderRadius:18, padding:'16px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:G.sage, marginBottom:2 }}>✦ MIRA'S CARE PLAN</div>
                <div style={{ fontSize:14, color:G.darkText, fontWeight:600 }}>Health & wellness tailored to {petName}</div>
              </div>
              <button onClick={() => { vibe('medium'); setShowCarePlan(true); }} style={{ flexShrink:0, padding:'10px 18px', borderRadius:14, border:'none', background:G.sage, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer' }}>Build Plan →</button>
            </div>
          </div>
        )}

        {/* ══════════ TAB 2: Services ══════════ */}
        {activeTab === 'services' && (
          <div style={{ padding:'16px' }}>
            <PillarConciergeCards pillar="care" pet={currentPet} token={token} />
            <div style={{ fontSize:22, fontWeight:800, color:G.darkText, marginBottom:4 }}>
              Care Services for <span style={{ color:G.sage }}>{petName}</span>
            </div>
            <div style={{ fontSize:13, color:G.mutedText, marginBottom:20, lineHeight:1.6 }}>
              Grooming, vet, boarding, behaviour — arranged through Concierge®.
            </div>

            {/* Mobile-native 2-col grid — exact visual match to desktop CareConcierge cards */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
              {CARE_SERVICES.map(svc => {
                const petN = currentPet?.name || 'your pet';
                const desc = (svc.desc || '').replace(/\{petName\}/g, petN);
                return (
                  <div key={svc.id}
                    data-testid={`care-service-card-${svc.id}`}
                    style={{ background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.07)',
                      border:'1px solid rgba(0,0,0,0.06)', display:'flex', flexDirection:'column', position:'relative' }}>
                    {/* Gradient header with emoji */}
                    <div style={{ background: svc.illustrationBg, height:90,
                      display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, flexShrink:0 }}>
                      {svc.icon}
                    </div>
                    {svc.urgent && (
                      <div style={{ position:'absolute', top:8, right:8, background:'#C62828', color:'#fff',
                        fontSize:9, fontWeight:800, borderRadius:6, padding:'2px 7px', letterSpacing:'0.05em' }}>
                        URGENT
                      </div>
                    )}
                    {svc.free && !svc.urgent && (
                      <div style={{ position:'absolute', top:8, right:8, background:'#E8F5E9', color:'#2D6A4F',
                        border:'1px solid #74C69D', fontSize:9, fontWeight:700, borderRadius:10, padding:'2px 8px' }}>
                        Complimentary
                      </div>
                    )}
                    {/* Card body */}
                    <div style={{ padding:'12px 12px 14px', flex:1, display:'flex', flexDirection:'column' }}>
                      <div style={{ fontSize:10, color:'#999', marginBottom:4, lineHeight:1.3 }}>{svc.tagline}</div>
                      <div style={{ fontSize:13, fontWeight:800, color:'#1a1a1a', marginBottom:5, lineHeight:1.3 }}>{svc.name}</div>
                      <div style={{ fontSize:11, color:'#555', lineHeight:1.4, flex:1, marginBottom:10 }}>{desc}</div>
                      <button
                        onClick={() => {
                          const svcObj = CARE_SERVICES.find(s => s.id === svc.id);
                          if (svcObj) setActiveSvcPath(svcObj);
                          else setSvcBooking({ isOpen:true, serviceType:svc.id });
                        }}
                        style={{ background:'none', border:'none', padding:0, cursor:'pointer', textAlign:'left',
                          fontSize:12, fontWeight:700, color: svc.urgent ? '#C62828' : '#2D6A4F' }}>
                        {svc.urgent ? 'Get help now →' : `Book ${svc.steps}-step flow →`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

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
      {/* CareServiceFlowModal — exact same Mira-powered modal as desktop (GroomingFlow/VetFlow etc.) */}
      {activeServicePath && currentPet && (
        <CareServiceFlowModal
          service={activeServicePath}
          pet={currentPet}
          onClose={() => setActiveSvcPath(null)}
        />
      )}

      <ServiceBookingModal
        isOpen={svcBooking.isOpen}
        onClose={() => setSvcBooking(p => ({ ...p, isOpen:false }))}
        serviceType={svcBooking.serviceType}
        pet={currentPet}
        onBookingComplete={() => setSvcBooking(p => ({ ...p, isOpen:false }))}
      />
      
      <MiraPlanModal
        isOpen={showCarePlan}
        onClose={() => setShowCarePlan(false)}
        pet={currentPet}
        pillar="care"
        token={token}
      />
    </PillarPageLayout>
  );
}
