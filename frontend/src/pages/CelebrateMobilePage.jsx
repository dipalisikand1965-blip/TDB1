/**
 * CelebrateMobilePage.jsx
 * The Doggy Company — /celebrate (mobile)
 * Drop-in mobile wrapper for CelebratePageNew
 * 
 * Colour: Deep purple · #4A1B6D → #9B59B6
 */

import { useState, useEffect, useCallback } from 'react';
import { useScrollLock } from '../hooks/useScrollLock';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { usePillarContext } from '../context/PillarContext';
import { useConcierge } from '../hooks/useConcierge';
import { usePlatformTracking } from '../hooks/usePlatformTracking';
import { tdc } from '../utils/tdc_intent';
import { API_URL } from '../utils/api';
import { applyMiraFilter } from '../hooks/useMiraFilter';
import PillarPageLayout from '../components/PillarPageLayout';
import PillarSoulProfile from '../components/PillarSoulProfile';
import DesktopSoulCard from '../components/common/DesktopSoulCard';
import MiraImaginesBreed from '../components/common/MiraImaginesBreed';
import SharedProductCard, { ProductDetailModal } from '../components/ProductCard';
import PersonalisedBreedSection from '../components/common/PersonalisedBreedSection';
import CelebrateCategoryStrip from '../components/celebrate/CelebrateCategoryStrip';
import CelebrateContentModal from '../components/celebrate/CelebrateContentModal';
import DoggyBakeryCakeModal from '../components/celebrate/BreedCakeOrderModal';
import BirthdayCakeModal from '../components/celebrate/DoggyBakeryCakeModal';
import MiraBirthdayBox from '../components/celebrate/MiraBirthdayBox';
import { PawrentFirstStepsTab } from '../components/pawrent/PawrentJourney';
import BirthdayBoxBuilder from '../components/celebrate/BirthdayBoxBuilder';
import BirthdayBoxBrowseDrawer from '../components/celebrate/BirthdayBoxBrowseDrawer';
import GuidedCelebratePaths from '../components/celebrate/GuidedCelebrationPaths';
import CelebrateNearMe from '../components/celebrate/CelebrateNearMe';
import ConciergeIntakeModal from '../components/celebrate/ConciergeIntakeModal';
import CelebrateServiceGrid from '../components/celebrate/CelebrateServiceGrid';
import { SoulCelebrationPillars } from '../components/celebrate';
import BirthdayCountdown from '../components/celebrate/BirthdayCountdown';
import CelebrationMemoryWall from '../components/celebrate/CelebrationMemoryWall';
import MiraSoulNudge from '../components/celebrate/MiraSoulNudge';
import MiraPlanModal from '../components/mira/MiraPlanModal';
import ConciergeRequestBuilder from '../components/services/ConciergeRequestBuilder';
import PillarHero from '../components/PillarHero';
import '../styles/mobile-design-system.css';

const C = {
  cream:   '#FAF7FF',
  purple:  '#4A1B6D',
  purpleL: '#9B59B6',
  pink:    '#E91E8C',
  gold:    '#C9973A',
  border:  '#E8D5F5',
  chipBg:  '#F5EEFF',
  chipTxt: '#7B2D8B',
  card:    '#FFFFFF',
  taupe:   '#7A6890',
  dark:    '#1A0A2E',
};
const CTAGrad = 'linear-gradient(135deg,#4A1B6D,#9B59B6)';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
  .cp { font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Inter',sans-serif; background:${C.cream}; color:${C.dark}; min-height:100vh; padding-bottom:calc(96px + env(safe-area-inset-bottom)); }
  .cp-card { background:${C.card}; border:1px solid ${C.border}; border-radius:22px; }
  .cp-cta { display:flex; align-items:center; justify-content:center; width:100%; min-height:48px; padding:13px 20px; border-radius:14px; border:none; background:${CTAGrad}; color:#fff; font-size:15px; font-weight:600; cursor:pointer; transition:transform 0.15s; font-family:inherit; }
  .cp-cta:active { transform:scale(0.97); }
  .cp-chip { display:inline-flex; align-items:center; padding:7px 16px; border-radius:999px; background:${C.chipBg}; color:${C.chipTxt}; font-size:14px; font-weight:500; white-space:nowrap; flex-shrink:0; border:none; cursor:pointer; min-height:36px; }
  .cp-chip.on { background:${C.purpleL}; color:#fff; }
  .no-sb { overflow-x:auto; scrollbar-width:none; -ms-overflow-style:none; }
  .no-sb::-webkit-scrollbar { display:none; }
  @keyframes cp-sheet { from{transform:translateY(100%)} to{transform:translateY(0)} }
`;

function vibe(type = 'light') {
  if (!navigator?.vibrate) return;
  if (type === 'success') navigator.vibrate([8,40,10]);
  else if (type === 'medium') navigator.vibrate([12]);
  else navigator.vibrate([6]);
}

function getAllergies(pet) {
  const s = new Set();
  const add = v => {
    if (Array.isArray(v)) v.forEach(x => { if (x && !/^(none|no|unknown)$/i.test(String(x).trim())) s.add(String(x).trim()); });
    else if (v && !/^(none|no|unknown)$/i.test(String(v).trim())) s.add(String(v).trim());
  };
  add(pet?.preferences?.allergies);
  add(pet?.doggy_soul_answers?.food_allergies);
  add(pet?.allergies);
  return [...s];
}

function CelebrateLoadingState() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:C.cream }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:36, marginBottom:12 }}>🎂</div>
        <div style={{ fontSize:16, color:C.taupe }}>Loading {`celebrations`}…</div>
      </div>
    </div>
  );
}

function CelebrateEmptyState({ onAddPet }) {
  return (
    <div style={{ padding:'24px 16px', textAlign:'center' }}>
      <div className="cp-card" style={{ padding:'32px 20px' }}>
        <div style={{ fontSize:44, marginBottom:14 }}>🎉</div>
        <div style={{ fontSize:22, fontWeight:700, marginBottom:8 }}>Add your pet to unlock Celebrate</div>
        <div style={{ fontSize:15, color:C.taupe, lineHeight:1.7, marginBottom:20 }}>
          Mira will plan birthdays, anniversaries, and every milestone once she knows your dog.
        </div>
        <button className="cp-cta" onClick={onAddPet}>Add your pet →</button>
      </div>
    </div>
  );
}

function CelebratePetCard({ pet, onOpen }) {
  const name = pet?.name || 'your dog';
  const breed = pet?.breed || 'mixed breed';
  const score = Math.round(pet?.overall_score || pet?.soul_score || 0);
  return (
    <div onClick={() => { vibe('light'); onOpen(); }} className="cp-card"
      style={{ padding:16, margin:'0 16px 20px', cursor:'pointer', boxShadow:'0 4px 20px rgba(74,27,109,0.08)' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, flex:1, minWidth:0 }}>
          <div style={{ width:52, height:52, borderRadius:'50%', flexShrink:0, background:`linear-gradient(135deg,${C.purpleL},${C.pink})`, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
            {pet?.photo_url ? <img src={pet.photo_url} alt={name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : <span style={{ fontSize:22 }}>🐾</span>}
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:17, fontWeight:700, marginBottom:4 }}>{name}&apos;s Celebrations</div>
            <div style={{ display:'inline-flex', background:C.chipBg, borderRadius:999, padding:'3px 10px', marginBottom:4 }}>
              <span style={{ fontSize:14, color:C.chipTxt, fontWeight:500 }}>{breed}</span>
            </div>
            <div style={{ fontSize:14, color:C.taupe }}>Birthdays, milestones & more</div>
          </div>
        </div>
        <div style={{ textAlign:'right', flexShrink:0 }}>
          <div style={{ fontSize:24, fontWeight:700, color:C.purpleL }}>{score}%</div>
          <div style={{ fontSize:14, color:C.taupe, letterSpacing:'0.08em' }}>SOUL</div>
          <div style={{ fontSize:14, color:C.pink, marginTop:2 }}>Tap →</div>
        </div>
      </div>
    </div>
  );
}

function CelebrateMiraBar({ pet, onOpen, onPlan }) {
  const name = pet?.name || 'your dog';
  const allergies = getAllergies(pet);
  const text = allergies.length > 0
    ? `I've already removed everything containing ${allergies.join(' and ')} from ${name}'s celebration picks.`
    : `I know what makes ${name} feel special. Every pick here is chosen for who they are.`;
  return (
    <div style={{ margin:'0 16px 20px', background:C.dark, borderRadius:20, padding:16 }}>
      <div style={{ fontSize:14, fontWeight:700, color:'rgba(233,30,140,0.9)', letterSpacing:'0.1em', marginBottom:8 }}>✦ MIRA ON {name.toUpperCase()}&apos;S CELEBRATIONS</div>
      <div style={{ fontSize:14, color:'rgba(255,255,255,0.75)', lineHeight:1.6, marginBottom:14, fontStyle:'italic' }}>&quot;{text}&quot;</div>
      <button className="cp-cta" onClick={() => { vibe('medium'); onOpen(); }}>See Mira&apos;s Picks for {name} →</button>
      <button className="cp-cta" onClick={() => { vibe('medium'); onPlan?.(); }} style={{ marginTop:8, opacity:0.85 }}>Build {name}&apos;s Celebration Plan →</button>
    </div>
  );
}

function CelebrateConciergeCard({ pet, onOpen }) {
  const name = pet?.name || 'your dog';
  return (
    <div style={{ margin:'0 16px 24px', background:C.dark, borderRadius:24, padding:20 }}>
      <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:'rgba(201,151,58,0.2)', border:'1px solid rgba(201,151,58,0.4)', borderRadius:999, padding:'5px 14px', color:'#F0C060', fontSize:14, fontWeight:600, marginBottom:12 }}>🎉 Celebration Concierge®</div>
      <div style={{ fontSize:22, fontWeight:700, color:'#fff', lineHeight:1.2, marginBottom:10, fontFamily:'Georgia,serif' }}>Want us to plan {name}&apos;s perfect celebration?</div>
      <div style={{ fontSize:14, color:'rgba(255,255,255,0.6)', lineHeight:1.7, marginBottom:16 }}>We handle the cake, the venue, the photographer, and every detail. You just show up and celebrate.</div>
      <button onClick={() => { vibe('medium'); onOpen?.(); }} style={{ width:'100%', minHeight:48, borderRadius:14, border:'none', background:`linear-gradient(135deg,${C.gold},#E8B84B)`, color:C.dark, fontSize:15, fontWeight:700, cursor:'pointer' }}>
        🎉 Plan with Concierge®
      </button>
    </div>
  );
}

function CelebrateIntakeSheet({ pet, onClose, onSend }) {
  const [type, setType] = useState('Birthday Party');
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const name = pet?.name || 'your dog';
  const TYPES = ['Birthday Party','Gotcha Day','Adoption Anniversary','Milestone Celebration','Photo Session','Custom Cake Order','Party Planning','Surprise Party'];

  const handleSend = async () => {
    setSending(true);
    await onSend?.(type, notes);
    setSending(false);
    setSent(true);
  };

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:500, display:'flex', alignItems:'flex-end', touchAction:'none' }}>
      <div onClick={e => e.stopPropagation()} style={{ width:'100%', maxHeight:'88vh', overflowY:'auto', background:C.card, borderRadius:'24px 24px 0 0', padding:'12px 20px calc(32px + env(safe-area-inset-bottom))', paddingTop:'env(safe-area-inset-top, 0px)', animation:'cp-sheet 0.3s ease' }}>
        <div style={{ width:48, height:5, borderRadius:999, background:C.border, margin:'0 auto 20px' }} />
        {sent ? (
          <div style={{ textAlign:'center', padding:'24px 0' }}>
            <div style={{ fontSize:44, marginBottom:12 }}>🎉</div>
            <div style={{ fontSize:22, fontWeight:700, marginBottom:10 }}>Sent to Concierge®!</div>
            <div style={{ fontSize:15, color:C.taupe, marginBottom:24 }}>We&apos;ll reach out within 48 hours.</div>
            <button className="cp-cta" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
              <div>
                <div style={{ fontSize:24, fontWeight:700, marginBottom:4 }}>Celebration Concierge®</div>
                <div style={{ fontSize:15, color:C.taupe }}>Plan something special for {name}</div>
              </div>
              <button onClick={onClose} style={{ width:40, height:40, borderRadius:'50%', background:C.chipBg, border:'none', cursor:'pointer' }}>✕</button>
            </div>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:10 }}>What are we celebrating?</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:20 }}>
              {TYPES.map(t => <button key={t} onClick={() => setType(t)} className={`cp-chip${type === t ? ' on' : ''}`}>{t}</button>)}
            </div>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:8 }}>Any details?</div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={`e.g. ${name}'s 3rd birthday, 20 dogs expected, outdoor venue preferred…`}
              style={{ width:'100%', minHeight:88, border:`1px solid ${C.border}`, borderRadius:14, padding:'12px 14px', fontSize:15, color:C.dark, background:C.cream, lineHeight:1.6, resize:'none', outline:'none', marginBottom:20, fontFamily:'inherit' }} />
            <button className="cp-cta" onClick={handleSend} disabled={sending} style={{ opacity:sending ? 0.7 : 1 }}>
              {sending ? 'Sending…' : `Plan ${name}&apos;s celebration →`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function CelebrateSoulMadeCard({ pet, onOpen }) {
  const name = pet?.name || 'your dog';
  return (
    <div style={{ padding:'0 16px 24px' }}>
      <div className="cp-card" onClick={() => { vibe('medium'); onOpen?.(); }}
        style={{ position:'relative', overflow:'hidden', padding:'20px 18px', background:'linear-gradient(135deg,#1A0A2E,#3D1260)', color:'#fff', cursor:'pointer' }}>
        <div style={{ position:'absolute', top:-30, right:-20, width:120, height:120, borderRadius:'50%', background:'radial-gradient(circle,rgba(233,30,140,0.2) 0%,transparent 70%)' }} />
        <div style={{ fontSize:14, letterSpacing:'0.14em', color:'rgba(233,30,140,0.9)', fontWeight:700, marginBottom:10 }}>✦ SOUL MADE™ · MADE ONLY FOR {name.toUpperCase()}</div>
        <div style={{ fontSize:22, fontWeight:700, lineHeight:1.2, marginBottom:8 }}>{name}&apos;s face. On cake toppers, bandanas, frames and more.</div>
        <div style={{ fontSize:14, color:'rgba(255,255,255,0.62)', lineHeight:1.6, marginBottom:14 }}>One-of-one celebration pieces made just for {name}.</div>
        <button className="cp-cta" style={{ background:CTAGrad }}>Make something only {name} has →</button>
      </div>
    </div>
  );
}

export default function CelebrateMobilePage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Auto-open Concierge intake if navigated from PawrentJourney with ?plan=1
  useEffect(() => {
    if (searchParams.get('plan') === '1') {
      setIntakeOpen(true);
    }
  }, [searchParams]);
  const { addToCart } = useCart();
  const { currentPet, setCurrentPet, pets: contextPets } = usePillarContext();
  usePlatformTracking({ pillar:'celebrate', pet:currentPet });
  const { request, book } = useConcierge({ pet:currentPet, pillar:'celebrate' });

  const [loading, setLoading] = useState(true);
  const [showCelebratePlan, setShowCelebratePlan] = useState(false);
  const [conciergeBuilderOpen, setConciergeBuilderOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const [miraPicksOpen, setMiraPicksOpen] = useState(false);
  const [celebrateCatModal, setCelebrateCatModal] = useState(null);
  useScrollLock(miraPicksOpen || showCelebratePlan || !!celebrateCatModal);
  const [breedCakeOpen, setBreedCakeOpen] = useState(false);
  const [birthdayCakesOpen, setBirthdayCakesOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('celebrate');

  // Handle build box from Mira's curated box — open BirthdayBoxBuilder modal
  const handleBuildBox = useCallback((boxPreview) => {
    window.dispatchEvent(new CustomEvent('openOccasionBoxBuilder', {
      detail: {
        preset: boxPreview,
        petName: currentPet?.name,
        petId: currentPet?.id,
        userEmail: user?.email || '',
        userName: user?.name || user?.full_name || '',
        occasion: 'birthday'
      }
    }));
  }, [currentPet?.name, currentPet?.id, user]);

  const handleOpenBrowseDrawer = useCallback(() => {
    window.dispatchEvent(new CustomEvent('openBirthdayBoxBrowse', { detail: {
      pet: currentPet,
      petName: currentPet?.name || '',
      petBreed: currentPet?.breed || '',
    } }));
  }, [currentPet]);

  const handleCategorySelect = useCallback((categoryId, categoryObj) => {
    tdc.view({ product: categoryId, pillar: 'celebrate', pet: currentPet, channel: 'celebrate_category_strip' });
    // birthday-cakes → open new DoggyBakeryCakeModal (full product grid + order form)
    if (categoryId === 'birthday-cakes') {
      setBirthdayCakesOpen(true);
      return;
    }
    // breed-cakes → open BreedCakeOrderModal (the "A cake that looks like Bruno" builder)
    if (categoryId === 'breed-cakes') {
      setBreedCakeOpen(true);
      return;
    }
    setCelebrateCatModal({ id: categoryId, obj: categoryObj });
  }, [currentPet]);
  const [miraProducts, setMiraProducts] = useState([]);

  useEffect(() => {
    if (contextPets !== undefined) setLoading(false);
    if (contextPets?.length > 0 && !currentPet) setCurrentPet(contextPets[0]);
  }, [contextPets, currentPet, setCurrentPet]);

  useEffect(() => {
    const handler = () => { /* refresh on soul score update */ };
    window.addEventListener('soulScoreUpdated', handler);
    return () => window.removeEventListener('soulScoreUpdated', handler);
  }, []);

  useEffect(() => {
    if (!token || !currentPet?.id) return;
    fetch(`${API_URL}/api/mira/claude-picks/${currentPet.id}?pillar=celebrate&limit=6&min_score=60&entity_type=product`,
      { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const rawPicks = d?.picks || [];
        const filtered = applyMiraFilter(rawPicks, currentPet);
        setMiraProducts(filtered.map(p => ({
          id: p.id || p._id, name: p.name,
          desc: p.mira_hint || p.mira_reason || p.description || 'For the celebration',
          price: p.price ? `₹${p.price}` : 'Price on request',
          imageUrl: p.watercolor_image || p.media?.primary_image || p.cloudinary_url || p.image_url,
          mira_hint: p.mira_hint,
          miraPick: p.miraPick,
          _dimmed: p._dimmed,
          _loved: p._loved,
          raw: p,
        })));
      })
      .catch(() => {});
  }, [token, currentPet]);

  const showToast = msg => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 2400); };

  const handleConciergeRequest = useCallback(async (type, notes) => {
    await request(`Celebration concierge for ${currentPet?.name || 'your dog'}: ${type}${notes ? `. ${notes}` : ''}`,
      { channel:'celebrate_intake', metadata:{ type, notes } });
  }, [request, currentPet]);

  if (loading) return <PillarPageLayout pillar="celebrate" hideHero hideNavigation><CelebrateLoadingState />
      </PillarPageLayout>;

  if (!currentPet) return (
    <PillarPageLayout pillar="celebrate" hideHero hideNavigation>
      <style>{CSS}</style>
      <div className="cp mobile-page-container"><CelebrateEmptyState onAddPet={() => navigate('/join')} /></div>
      </PillarPageLayout>
  );

  const petName = currentPet.name;

  return (
    <PillarPageLayout pillar="celebrate" hideHero hideNavigation>
      <div className="cp mobile-page-container" data-testid="celebrate-mobile">
        <style>{CSS}</style>

        {intakeOpen && (
          <ConciergeIntakeModal
            isOpen={intakeOpen}
            onClose={() => setIntakeOpen(false)}
            petName={currentPet?.name || 'your dog'}
            petId={currentPet?.id || currentPet?._id}
            data-testid="celebrate-concierge-modal"
          />
        )}
        {selectedProduct && <ProductDetailModal product={selectedProduct.raw || selectedProduct} isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} petName={petName} pillarColor={C.purpleL} />}

        {toastMsg && (
          <div style={{ position:'fixed', left:'50%', bottom:'calc(92px + env(safe-area-inset-bottom))', transform:'translateX(-50%)', zIndex:9000, background:C.dark, color:'#fff', padding:'10px 16px', borderRadius:999, fontSize:14, fontWeight:600, whiteSpace:'nowrap' }}>
            {toastMsg}
          </div>
        )}

        {/* ── 1. Hero ── */}
        <PillarHero
          pillar="celebrate"
          pet={currentPet}
          allPets={contextPets || []}
          onSwitchPet={p => { vibe(); setCurrentPet(p); }}
          gradient="linear-gradient(160deg,#1A0A2E 0%,#4A1B6D 50%,#9B59B6 100%)"
          title="🎂 Celebrate"
          subtitle="Birthdays & Milestones"
          tagline={`for ${petName}`}
          allergies={getAllergies(currentPet)}
        />

        {/* ── 2. Category Strip (outside tabs, always visible) ── */}
        <CelebrateCategoryStrip pet={currentPet} onCategorySelect={handleCategorySelect} />

        {/* ── 3. Tab Bar: Celebrate | Services | Near Me ── */}
        <div className="ios-tab-bar">
          {[{ id:'celebrate', label:'🎉 Celebrate' }, { id:'services', label:'🐕 Services' }, { id:'nearme', label:'📍 Find Venues' }].map(t => (
            <button key={t.id}
              className={`ios-tab${activeTab===t.id?' active':''}`}
              style={activeTab===t.id ? { backgroundColor:'#1a1028', color:'#fff' } : {}}
              data-testid={`celebrate-tab-${t.id}`}
              onClick={() => setActiveTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── CELEBRATE TAB ── */}
        {activeTab === 'celebrate' && (<>

        {/* ── 4a. Celebrate Profile ── */}
        <div style={{ padding:'12px 16px 0' }}>
          <PillarSoulProfile pet={currentPet} pillar="celebrate" token={token} />
        </div>

        {/* ── 4a2. Soul Card — celebrations + loves ── */}
        {currentPet && (
          <div style={{ padding:'0 16px 4px' }}>
            <DesktopSoulCard pet={currentPet} pillarLabel="Celebrate" pillar="celebrate" dataTestId="mobile-celebrate-soul-card" />
          </div>
        )}

        {/* ── 4b. Pawrent Journey — collapsible, starts CLOSED ── */}
        {currentPet && (
          <div style={{ padding:'8px 16px 0' }}>
            <PawrentFirstStepsTab pet={currentPet} token={token} currentPillar="celebrate" defaultCollapsed={true} />
          </div>
        )}

        {/* Birthday Countdown — emotional anticipation */}
        {currentPet && (
          <div style={{ padding:'12px 16px 0' }}>
            <BirthdayCountdown
              pet={currentPet}
              onPlanParty={() => setIntakeOpen(true)}
              onViewCakes={() => setBreedCakeOpen(true)}
            />
          </div>
        )}

        {/* Soul Celebration Pillars — "How would Mojo love to celebrate?" */}
        <SoulCelebrationPillars pet={currentPet} />

        {/* Mira bar */}
        <CelebrateMiraBar pet={currentPet} onOpen={() => setMiraPicksOpen(true)} onPlan={() => setShowCelebratePlan(true)} />

        {/* Mira's Birthday Box */}
        {currentPet && (
          <div style={{ padding:'0 16px 16px' }}>
            <MiraBirthdayBox
              pet={currentPet}
              onBuildBox={handleBuildBox}
              onBrowseProducts={handleOpenBrowseDrawer}
            />
          </div>
        )}
        </>)}

        {/* ── SERVICES TAB ── */}
        {activeTab === 'services' && (
          <div style={{ padding:'16px 16px 24px' }}>
            <div style={{ background:'#0A0A14', borderRadius:20, padding:16, marginBottom:20 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'rgba(201,151,58,0.9)', letterSpacing:'0.1em', marginBottom:8 }}>✦ CELEBRATE CONCIERGE®</div>
              <div style={{ fontSize:15, color:'rgba(255,255,255,0.75)', lineHeight:1.6, marginBottom:14 }}>
                Birthday cakes, party planning, gifting, venue booking — all arranged for {petName}.
              </div>
              <button onClick={() => setConciergeBuilderOpen(true)}
                style={{ width:'100%', padding:'13px 20px', borderRadius:14, border:'none',
                  background:'linear-gradient(135deg,#9B59B6,#C084FC)', color:'#fff',
                  fontSize:15, fontWeight:700, cursor:'pointer' }}>
                Book Celebrate Concierge® →
              </button>
            </div>
            {/* Celebrate service cards from Service Box */}
            <CelebrateServiceGrid pet={currentPet} />
          </div>
        )}

        {/* ── NEAR ME TAB ── */}
        {activeTab === 'nearme' && (
          <div style={{ padding:'12px 16px 0' }}>
            <CelebrateNearMe pet={currentPet} />
          </div>
        )}
        {miraPicksOpen && miraProducts.length > 0 && (
          <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'flex-end', touchAction:'none' }} onClick={() => setMiraPicksOpen(false)}>
            <div style={{ background:'#1a1028', borderRadius:'24px 24px 0 0', width:'100%', maxHeight:'85vh', overflow:'auto', padding:'24px 16px 40px', paddingTop:'env(safe-area-inset-top, 0px)' }} onClick={e => e.stopPropagation()}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <div style={{ fontSize:18, fontWeight:700, color:'#fff' }}>Celebrate Picks for {petName}</div>
                <button onClick={() => setMiraPicksOpen(false)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.6)', fontSize:24, cursor:'pointer' }}>✕</button>
              </div>
              {/* Mira's pick callout */}
              {miraProducts[0]?.miraPick && miraProducts[0]?.mira_hint && (
                <div style={{ background:'linear-gradient(135deg,rgba(255,140,66,0.15),rgba(196,77,255,0.10))', border:'1px solid rgba(255,140,66,0.35)', borderRadius:12, padding:'10px 14px', display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                  <div style={{ width:26, height:26, borderRadius:'50%', background:'linear-gradient(135deg,#FF8C42,#C44DFF)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:'#fff', flexShrink:0 }}>✦</div>
                  <div style={{ fontSize:14, color:'#FFD9B0', lineHeight:1.4 }}>
                    <strong style={{ color:'#FFA45B' }}>Mira's pick:</strong> {miraProducts[0].name}
                    <span style={{ color:'rgba(255,255,255,0.6)', marginLeft:5 }}>— {miraProducts[0].mira_hint}</span>
                  </div>
                </div>
              )}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {miraProducts.map(p => (
                  <div key={p.id||p.name} style={{ opacity: p._dimmed ? 0.55 : 1 }}>
                    <SharedProductCard product={p.raw||p} pillar="celebrate" selectedPet={currentPet} onAddToCart={() => { addToCart({ id:p.id, name:p.name, price:p.raw?.price||0, image:p.imageUrl, pillar:'celebrate', quantity:1 }); showToast(`${p.name} added`); }} onClick={() => { vibe(); setSelectedProduct(p); setMiraPicksOpen(false); }} />
                  </div>
                ))}
              </div>
              {/* Footer */}
              <div style={{ borderTop:'1px solid rgba(255,255,255,0.1)', paddingTop:10, marginTop:12, fontSize:14, color:'rgba(255,255,255,0.45)', textAlign:'center' }}>
                Curated for {petName} by Mira
              </div>
            </div>
          </div>
        )}

        {/* ── CELEBRATE TAB CONTENT (below birthday box) ── */}
        {activeTab === 'celebrate' && (<>

        {/* MiraImaginesBreed — restored on mobile, fires tickets + tdc.imagine() internally */}
        <MiraImaginesBreed
          pet={currentPet}
          pillar="celebrate"
          colour="#9B59B6"
          token={token}
          onConcierge={() => setIntakeOpen(true)}
        />

        <div style={{ padding:'0 16px 24px' }}><PersonalisedBreedSection pet={currentPet} pillar="celebrate" /></div>

        {/* Mira Soul Nudge — surface unanswered soul questions in celebration context */}
        {currentPet && (
          <div style={{ padding:'0 16px 12px' }}>
            <MiraSoulNudge pet={currentPet} token={token} context="celebrate" limit={3} />
          </div>
        )}

        {/* Guided paths */}
        <div style={{ padding:'0 16px 24px' }}>
          <GuidedCelebratePaths pet={currentPet} />
        </div>

        {/* Portraits & Memory Books — two dim cards */}
        {currentPet && (
          <div style={{ padding:'0 16px 16px' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#9B59B6', letterSpacing:'0.08em', marginBottom:10 }}>
              CELEBRATE &amp; PRESERVE
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {[
                { id:'portraits', emoji:'📸', label:'Portraits &amp; Photoshoots', sub:'Capture this milestone beautifully' },
                { id:'memory_books', emoji:'📖', label:'Memory Books', sub:"A lifetime in one beautiful book" },
              ].map(dim => (
                <div key={dim.id}
                  data-testid={`celebrate-dim-${dim.id}`}
                  onClick={() => { vibe('light'); setCelebrateCatModal({ id: dim.id }); }}
                  style={{ background:'linear-gradient(135deg,rgba(155,89,182,0.08),rgba(233,30,140,0.05))', border:'1px solid rgba(155,89,182,0.2)', borderRadius:14, padding:'14px 12px', cursor:'pointer', textAlign:'center' }}>
                  <div style={{ fontSize:24, marginBottom:8 }}>{dim.emoji}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:'#1A1A2E', lineHeight:1.3, marginBottom:4 }}>{dim.label}</div>
                  <div style={{ fontSize:10, color:'#888', lineHeight:1.4 }}>{dim.sub}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Celebrate Personally — Service Grid */}
        <div style={{ padding:'0 16px 24px' }}>
          <CelebrateServiceGrid pet={currentPet} />
        </div>

        {/* Concierge® CTA */}
        <CelebrateConciergeCard pet={currentPet} onOpen={() => setIntakeOpen(true)} />

        {/* Celebration Memory Wall — bottom of page */}
        <div style={{ padding:'0 0 24px' }}>
          <CelebrationMemoryWall pet={currentPet} />
        </div>
        </>)}

        {/* Category content modal — same as desktop */}
        {celebrateCatModal && (
          <CelebrateContentModal
            isOpen={true}
            onClose={() => setCelebrateCatModal(null)}
            category={celebrateCatModal.id}
            pet={currentPet}
            onConciergeRequest={async (msg) => {
              await request(msg, {
                channel: 'celebrate_empty_category',
                metadata: {
                  petName: currentPet?.name,
                  breed: currentPet?.breed,
                  lifeStage: currentPet?.life_stage,
                  allergies: currentPet?.allergies || [],
                  category: celebrateCatModal?.id,
                },
              });
            }}
          />
        )}

        {/* Birthday Cakes — DoggyBakeryCakeModal (product grid + order form) */}
        {birthdayCakesOpen && (
          <BirthdayCakeModal pet={currentPet} onClose={() => setBirthdayCakesOpen(false)} />
        )}

        {/* Breed Cake Builder — "A cake that looks like [petName]" */}
        {breedCakeOpen && (
          <DoggyBakeryCakeModal pet={currentPet} onClose={() => setBreedCakeOpen(false)} />
        )}

        {/* Birthday Box Builder — listens to openOccasionBoxBuilder */}
        <BirthdayBoxBuilder onOpenBrowseDrawer={() =>
          window.dispatchEvent(new CustomEvent('openBirthdayBoxBrowse', { detail: { petName: currentPet?.name, petBreed: currentPet?.breed || '', pet: currentPet } }))
        } />

        {/* Birthday Box Browse Drawer — listens to openBirthdayBoxBrowse */}
        <BirthdayBoxBrowseDrawer onOpenBuilder={(box) =>
          window.dispatchEvent(new CustomEvent('openOccasionBoxBuilder', { detail: { preset: box, petName: currentPet?.name, petId: currentPet?.id, occasion: 'birthday' } }))
        } />

      </div>
      
      <MiraPlanModal
        isOpen={showCelebratePlan}
        onClose={() => setShowCelebratePlan(false)}
        pet={currentPet}
        pillar="celebrate"
        token={token}
      />
      <ConciergeRequestBuilder
        pet={currentPet}
        token={token}
        isOpen={conciergeBuilderOpen}
        onClose={() => setConciergeBuilderOpen(false)}
      />
    </PillarPageLayout>
  );
}
