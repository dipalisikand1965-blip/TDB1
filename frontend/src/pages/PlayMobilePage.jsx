/**
 * PlayMobilePage.jsx — /play (mobile)
 * 3-tab layout: Play & Products | Services | Find Play
 * Products tab: dimTab (Products/Personalised) + sub-category pills
 * Colour: Orange #E76F51
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { usePillarContext } from '../context/PillarContext';
import { useConcierge } from '../hooks/useConcierge';
import { usePlatformTracking } from '../hooks/usePlatformTracking';
import { tdc } from '../utils/tdc_intent';
import { API_URL } from '../utils/api';
import ServiceBookingModal, { guessServiceType } from '../components/ServiceBookingModal';
import { applyMiraFilter, filterBreedProducts, excludeCakeProducts} from '../hooks/useMiraFilter';
import PillarPageLayout from '../components/PillarPageLayout';
import PillarSoulProfile from '../components/PillarSoulProfile';
import PlayConciergeSection from '../components/play/PlayConciergeSection';
import PlayNearMe from '../components/play/PlayNearMe';
import PlayCategoryStrip from '../components/play/PlayCategoryStrip';
import PlayContentModal from '../components/play/PlayContentModal';
import BuddyMeetup from '../components/play/BuddyMeetup';
import GuidedPlayPaths from '../components/play/GuidedPlayPaths';
import PersonalisedBreedSection from '../components/common/PersonalisedBreedSection';
import MiraImaginesBreed from '../components/common/MiraImaginesBreed';
import MiraImaginesCard from '../components/common/MiraImaginesCard';
import MiraPlanModal from '../components/mira/MiraPlanModal';
import SoulMadeModal from '../components/SoulMadeModal';
import SharedProductCard, { ProductDetailModal } from '../components/ProductCard';
import { PawrentFirstStepsTab } from '../components/pawrent/PawrentJourney';
import { getPlayDims, MiraPicksSection } from './PlaySoulPage';
import '../styles/mobile-design-system.css';

const G = {
  orange:'#E76F51', mid:'#C25B3D', deep:'#7A2E1A', light:'#FBD8CE',
  pale:'#FFF5F2', cream:'#FFF8F5', dark:'#1F0A04',
  darkText:'#7A2E1A', mutedText:'#C25B3D',
  border:'rgba(231,111,81,0.18)',
};
const CSS = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
.play-m{font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Inter',sans-serif;background:${G.cream};color:${G.dark};min-height:100vh;padding-bottom:calc(96px + env(safe-area-inset-bottom))}
.play-cta{display:flex;align-items:center;justify-content:center;width:100%;min-height:48px;padding:13px 20px;border-radius:14px;border:none;background:linear-gradient(135deg,${G.mid},${G.orange});color:#fff;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;transition:transform 0.15s}
.play-cta:active{transform:scale(0.97)}
.play-tab{flex:1;padding:12px 4px;background:none;border:none;border-bottom:2.5px solid transparent;font-size:14px;font-weight:500;color:#999;cursor:pointer;transition:all 0.15s;white-space:nowrap;font-family:inherit}
.play-tab.active{color:${G.orange};border-bottom-color:${G.orange};font-weight:700}`;

function vibe(t='light') { if(navigator?.vibrate) navigator.vibrate(t==='medium'?[12]:[6]); }

function getAllergies(pet) {
  const s = new Set();
  const add = v => {
    if (Array.isArray(v)) v.forEach(x => { if (x && !['none','no allergies','nil','n/a'].includes(String(x).toLowerCase().trim())) s.add(String(x).trim()); });
    else if (v && !['none','no allergies','nil','n/a'].includes(String(v).toLowerCase().trim())) { String(v).split(',').forEach(a => { const t = a.trim(); if (t) s.add(t); }); }
  };
  add(pet?.allergies);
  add(pet?.preferences?.allergies);
  add(pet?.doggy_soul_answers?.food_allergies);
  add(pet?.doggy_soul_answers?.allergies);
  return [...s];
}
function applyMiraIntelligence(products, allergies) {
  if (!allergies?.length) return products;
  return products.filter(p => {
    const text = `${p.name} ${p.description || ''}`.toLowerCase();
    for (const a of allergies) { if (text.includes(a.toLowerCase()) && !text.includes('free')) return false; }
    return true;
  });
}

const PLAY_IMAGINES = [
  { id:'p-1', emoji:'🎾', name:'Play Kit for your breed', description:'Toys matched to your breed\'s prey drive, jaw strength, and energy level — not just any ball.' },
  { id:'p-2', emoji:'🧩', name:'Enrichment Bundle', description:'Puzzle feeders, lick mats, snuffle mats — 30 minutes of mental enrichment per day.' },
  { id:'p-3', emoji:'🏅', name:'Agility Starter Set', description:'6-piece agility set — jumps, weave poles, tunnel — for high-energy breeds to run and win.' },
];

export default function PlayMobilePage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { currentPet, setCurrentPet, pets: contextPets } = usePillarContext();
  usePlatformTracking({ pillar:'play', pet:currentPet });
  const { request } = useConcierge({ pet:currentPet, pillar:'play' });
  const { addToCart } = useCart();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('play');
  const [dimTab, setDimTab] = useState('products');
  const [modalCategory, setModalCategory] = useState(null);
  const [showMiraPicks, setShowMiraPicks] = useState(false);
  const [soulMadeOpen, setSoulMadeOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [allRaw, setAllRaw] = useState([]);
  const [svcBooking, setSvcBooking] = useState({ isOpen: false, serviceType: 'training' });
  const [showPlayPlan, setShowPlayPlan] = useState(false);

  useEffect(() => {
    if (contextPets !== undefined) setLoading(false);
    if (contextPets?.length > 0 && !currentPet) setCurrentPet(contextPets[0]);
  }, [contextPets, currentPet, setCurrentPet]);

  useEffect(() => {
    if (!currentPet?.id) return;
    fetch(`${API_URL}/api/admin/pillar-products?pillar=play&limit=600&breed=${encodeURIComponent(currentPet?.breed||'')}`, { headers: token ? { Authorization:`Bearer ${token}` } : {} })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.products) setAllRaw(filterBreedProducts(excludeCakeProducts(d.products), currentPet?.breed)); })
      .catch(() => {});
  }, [currentPet?.id, token]);

  const handleAddToCart = useCallback(p => {
    addToCart({ id:p.id||p._id, name:p.name, price:p.price||0, image:p.image_url||p.images?.[0], pillar:'play', quantity:1 });
  }, [addToCart]);

  if (loading) return (
    <PillarPageLayout pillar="play" hideHero hideNavigation>
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center' }}><div style={{ fontSize:36, marginBottom:12 }}>🎾</div><div>Loading play products…</div></div>
      </div>
    </PillarPageLayout>
  );

  const petName = currentPet?.name || 'your dog';
  const allergies = getAllergies(currentPet);

  return (
    <PillarPageLayout pillar="play" hideHero hideNavigation>
      <div className="play-m mobile-page-container" data-testid="play-mobile">
        <style>{CSS}</style>

        {soulMadeOpen && <SoulMadeModal pet={currentPet} pillar="play" pillarColor={G.orange} pillarLabel="Play" onClose={() => setSoulMadeOpen(false)} />}
        {selectedProduct && <ProductDetailModal product={selectedProduct?.raw || selectedProduct} isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} petName={petName} pillarColor={G.orange} />}

        {/* PlayContentModal — same as desktop, opened by PlayCategoryStrip chip */}
        <PlayContentModal
          isOpen={!!modalCategory}
          category={modalCategory}
          pet={currentPet}
          onClose={() => setModalCategory(null)}
          onNavigateToNearMe={() => { setModalCategory(null); setActiveTab('find-play'); }}
        />

        {/* Mira Picks bottom-sheet — kept as fallback */}
        {showMiraPicks && (
          <div onClick={() => setShowMiraPicks(false)} style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.65)', display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
            <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:'20px 20px 0 0', maxHeight:'88vh', overflowY:'auto', padding:'8px 0 32px' }}>
              <div style={{ width:36, height:4, background:'#ddd', borderRadius:2, margin:'8px auto 16px' }} />
              <MiraPicksSection pet={currentPet} />
              <button onClick={() => setShowMiraPicks(false)} style={{ display:'block', margin:'16px auto 0', padding:'10px 32px', borderRadius:999, border:'none', background:G.orange, color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer' }}>Close</button>
            </div>
          </div>
        )}

        {/* Hero */}
        <div style={{ background:`linear-gradient(160deg,${G.dark} 0%,${G.deep} 55%,${G.mid} 100%)`, padding:'32px 16px 20px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.5)', letterSpacing:'0.1em', marginBottom:2 }}>THE DOGGY COMPANY</div>
              <div style={{ fontSize:22, fontWeight:700, color:'#fff' }}>🎾 Play</div>
            </div>
            {contextPets?.length > 1 && (
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', justifyContent:'flex-end' }}>
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
          <div style={{ fontSize:20, fontWeight:700, color:'#fff', marginBottom:4 }}>Play, Joy & Enrichment</div>
          <div style={{ fontSize:15, color:'rgba(255,255,255,0.7)' }}>Toys, enrichment, playgroups, dog walkers</div>
        </div>

        {/* PlayCategoryStrip — immediately after hero, same as Care */}
        {currentPet && (
          <PlayCategoryStrip
            pet={currentPet}
            openDim={modalCategory}
            onSelect={id => { vibe(); setModalCategory(id); setActiveTab('play'); }}
            onMiraPicks={() => { vibe(); setModalCategory('miras-picks'); setActiveTab('play'); }}
          />
        )}

        {/* Tab Bar */}
        <div className="ios-tab-bar">
          {[
            { id:'play',      label:'🎾 Play' },
            { id:'services',  label:'🐕 Services' },
            { id:'find-play', label:'📍 Find Play' },
          ].map(tab => (
            <button key={tab.id}
              className={`ios-tab${activeTab===tab.id?' active':''}`}
              style={activeTab===tab.id ? { backgroundColor:G.dark, color:'#fff' } : {}}
              data-testid={`play-tab-${tab.id}`}
              onClick={() => { vibe(); setActiveTab(tab.id); }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: Play & Products */}
        {activeTab === 'play' && (
          <div>
            {/* Soul Profile + CTA — inside tab, same as Care */}
            {currentPet && <div style={{ padding:'16px 16px 0' }}><PillarSoulProfile pet={currentPet} pillar="play" token={token} /></div>}
            {currentPet && (
              <div style={{ margin:'12px 16px 0', background:'linear-gradient(135deg,rgba(251,146,60,0.14),rgba(251,146,60,0.20))', border:'1px solid rgba(251,146,60,0.35)', borderRadius:18, padding:'16px' }}>
                <div style={{ fontSize:18, fontWeight:700, color:'#1A0A2E', lineHeight:1.25, marginBottom:4 }}>
                  How would <span style={{ color:'#C2410C' }}>{petName}</span> love to play?
                </div>
                <div style={{ fontSize:13, color:'#4B5563', lineHeight:1.5 }}>
                  Enrichment, activities, toys and services matched to {petName}'s soul profile.
                </div>
              </div>
            )}
            {currentPet && <div style={{ padding:'0 16px 8px' }}><PawrentFirstStepsTab pet={currentPet} token={token} currentPillar="play" /></div>}

            {/* Mira Bar */}
            <div style={{ margin:'16px 16px 0', background:G.dark, borderRadius:20, padding:16 }}>
              <div style={{ fontSize:14, fontWeight:700, color:`rgba(251,216,206,0.9)`, letterSpacing:'0.1em', marginBottom:8 }}>✦ MIRA ON {petName.toUpperCase()}'S JOY</div>
              <div style={{ fontSize:14, color:'rgba(255,255,255,0.75)', lineHeight:1.6, marginBottom:14, fontStyle:'italic' }}>
                "Play isn't optional — it's essential for {petName}'s mental health and happiness."
              </div>
              <button className="play-cta" onClick={() => { vibe('medium'); setShowPlayPlan(true); }}>
                Build {petName}'s Play Plan →
              </button>
            </div>

            {/* dimTab toggle */}
            <div style={{ display:'flex', margin:'12px 16px 0', background:G.pale, borderRadius:12, padding:4 }}>
              {[{ id:'products', label:'🎯 Dimensions' }, { id:'personalised', label:'✦ Personalised' }].map(t => (
                <button key={t.id} onClick={() => { setDimTab(t.id); }}
                  style={{ flex:1, padding:'9px', borderRadius:10, border:'none', fontSize:14, fontWeight:600, cursor:'pointer',
                    background:dimTab===t.id?G.orange:G.pale, color:dimTab===t.id?'#fff':G.mutedText }}>
                  {t.label}
                </button>
              ))}
            </div>

            {dimTab === 'personalised' ? (
              <div style={{ padding:'16px 16px 24px' }}>
                <PersonalisedBreedSection pet={currentPet} pillar="play" token={token} />
                {PLAY_IMAGINES.map(item => <MiraImaginesCard key={item.id} item={item} pet={currentPet} token={token} pillar="play" />)}
              </div>
            ) : (
              <div style={{ padding:'16px' }}>
                {/* Mira Picks section */}
                <MiraPicksSection pet={currentPet} />

                {/* 7 Play Dimensions grid — tapping any card opens PlayContentModal (same as desktop) */}
                {(() => {
                  const playDims = getPlayDims(currentPet);
                  return (
                    <>
                      <div style={{ marginBottom:4, marginTop:4 }}>
                        <span style={{ fontSize:20, fontWeight:900, color:G.darkText }}>Play </span>
                        <span style={{ fontSize:20, fontWeight:900, color:G.orange }}>for {petName}</span>
                      </div>
                      <div style={{ fontSize:13, color:G.mutedText, marginBottom:12 }}>
                        {playDims.length} dimensions matched to {petName}'s energy and play profile
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
                        {playDims.map(dim => (
                          <div key={dim.id}
                            data-testid={`play-dim-card-${dim.id}`}
                            onClick={() => { vibe(); setModalCategory(dim.id); }}
                            style={{ background: dim.glow ? G.pale : '#fff', border:`1.5px solid ${modalCategory===dim.id ? G.orange : G.border}`, borderRadius:14, padding:'14px 12px', cursor:'pointer', textAlign:'center', boxShadow: dim.glow ? `0 4px 16px rgba(231,111,81,0.15)` : 'none', position:'relative' }}>
                            {dim.glow && <div style={{ position:'absolute', top:8, right:8, width:7, height:7, borderRadius:'50%', background:G.orange, boxShadow:`0 0 6px ${G.orange}` }} />}
                            <div style={{ fontSize:26, marginBottom:6 }}>{dim.icon}</div>
                            <div style={{ fontSize:13, fontWeight:800, color:G.darkText, marginBottom:3 }}>{dim.label}</div>
                            <div style={{ fontSize:11, color:G.mutedText, lineHeight:1.3 }}>{typeof dim.sub==='string' ? dim.sub.replace(/{name}/g, petName) : ''}</div>
                            {dim.badge && <div style={{ display:'inline-flex', marginTop:6, background:dim.badgeBg, color:'#fff', borderRadius:20, padding:'2px 8px', fontSize:9, fontWeight:700 }}>{dim.badge}</div>}
                          </div>
                        ))}
                      </div>

                      <div style={{ marginTop:8 }}><GuidedPlayPaths pet={currentPet} /></div>

                      <div style={{ marginTop:16, background:G.dark, borderRadius:20, padding:18, cursor:'pointer' }} onClick={() => setSoulMadeOpen(true)}>
                        <div style={{ fontSize:14, letterSpacing:'0.14em', color:G.light, fontWeight:700, marginBottom:8 }}>✦ SOUL MADE™ · PLAY GEAR FOR {petName.toUpperCase()}</div>
                        <div style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:8 }}>Custom bandanas, toys and play accessories.</div>
                        <button className="play-cta">Explore Soul Made →</button>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Services */}
        {activeTab === 'services' && (
          <div style={{ padding:'16px' }}>
            <div style={{ fontSize:20, fontWeight:700, marginBottom:4, color:G.darkText }}>Play Services for {petName}</div>
            <div style={{ fontSize:14, color:G.mutedText, marginBottom:16 }}>Dog walkers, playgroups, training, hydrotherapy.</div>
            <BuddyMeetup pet={currentPet} />
            <div style={{ marginTop:16 }}>
              <PlayConciergeSection pet={currentPet} />
            </div>
          </div>
        )}

        {/* TAB 3: Find Play */}
        {activeTab === 'find-play' && (
          <div style={{ padding:'16px' }}>
            <div style={{ fontSize:20, fontWeight:700, marginBottom:4, color:G.darkText }}>Find Play Near You</div>
            <div style={{ fontSize:14, color:G.mutedText, marginBottom:16 }}>Dog parks, playgroups, and groomers near {petName}.</div>
            <PlayNearMe pet={currentPet} token={token} onBook={svc => {
              tdc.book({ service:svc, pillar:'play', pet:currentPet, channel:'play_nearme' });
              setSvcBooking({ isOpen: true, serviceType: guessServiceType(svc) });
            }} />
          </div>
        )}
      </div>

      <ServiceBookingModal
        isOpen={svcBooking.isOpen}
        onClose={() => setSvcBooking(p => ({ ...p, isOpen: false }))}
        serviceType={svcBooking.serviceType}
        onBookingComplete={() => setSvcBooking(p => ({ ...p, isOpen: false }))}
      />

      <MiraPlanModal
        isOpen={showPlayPlan}
        onClose={() => setShowPlayPlan(false)}
        pet={currentPet}
        pillar="play"
        token={token}
      />
    </PillarPageLayout>
  );
}
