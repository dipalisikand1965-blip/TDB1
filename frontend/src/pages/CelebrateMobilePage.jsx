/**
 * CelebrateMobilePage.jsx
 * The Doggy Company — /celebrate (mobile)
 * Drop-in mobile wrapper for CelebratePageNew
 * 
 * Colour: Deep purple · #4A1B6D → #9B59B6
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
import PillarPageLayout from '../components/PillarPageLayout';
import SoulMadeModal from '../components/SoulMadeModal';
import PillarSoulProfile from '../components/PillarSoulProfile';
import MiraImaginesBreed from '../components/common/MiraImaginesBreed';
import SharedProductCard, { ProductDetailModal } from '../components/ProductCard';
import PersonalisedBreedSection from '../components/common/PersonalisedBreedSection';
import CelebrateCategoryStrip from '../components/celebrate/CelebrateCategoryStrip';
import CelebrateContentModal from '../components/celebrate/CelebrateContentModal';
import GuidedCelebratePaths from '../components/celebrate/GuidedCelebrationPaths';
import CelebrateNearMe from '../components/celebrate/CelebrateNearMe';
import ConciergeIntakeModal from '../components/celebrate/ConciergeIntakeModal';

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

const CTAGrad = 'linear-gradient(135deg,#9B59B6,#E91E8C)';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
  .cp { font-family:'DM Sans',-apple-system,sans-serif; background:${C.cream}; color:${C.dark}; min-height:100vh; padding-bottom:calc(96px + env(safe-area-inset-bottom)); }
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
              <span style={{ fontSize:13, color:C.chipTxt, fontWeight:500 }}>{breed}</span>
            </div>
            <div style={{ fontSize:13, color:C.taupe }}>Birthdays, milestones & more</div>
          </div>
        </div>
        <div style={{ textAlign:'right', flexShrink:0 }}>
          <div style={{ fontSize:24, fontWeight:700, color:C.purpleL }}>{score}%</div>
          <div style={{ fontSize:10, color:C.taupe, letterSpacing:'0.08em' }}>SOUL</div>
          <div style={{ fontSize:11, color:C.pink, marginTop:2 }}>Tap →</div>
        </div>
      </div>
    </div>
  );
}

function CelebrateMiraBar({ pet, onOpen }) {
  const name = pet?.name || 'your dog';
  const allergies = getAllergies(pet);
  const text = allergies.length > 0
    ? `I've already removed everything containing ${allergies.join(' and ')} from ${name}'s celebration picks.`
    : `I know what makes ${name} feel special. Every pick here is chosen for who they are.`;
  return (
    <div style={{ margin:'0 16px 20px', background:C.dark, borderRadius:20, padding:16 }}>
      <div style={{ fontSize:11, fontWeight:700, color:'rgba(233,30,140,0.9)', letterSpacing:'0.1em', marginBottom:8 }}>✦ MIRA ON {name.toUpperCase()}&apos;S CELEBRATIONS</div>
      <div style={{ fontSize:14, color:'rgba(255,255,255,0.75)', lineHeight:1.6, marginBottom:14, fontStyle:'italic' }}>&quot;{text}&quot;</div>
      <button className="cp-cta" onClick={() => { vibe('medium'); onOpen(); }}>See Mira&apos;s Picks for {name} →</button>
    </div>
  );
}

function CelebrateConciergeCard({ pet, onOpen }) {
  const name = pet?.name || 'your dog';
  return (
    <div style={{ margin:'0 16px 24px', background:C.dark, borderRadius:24, padding:20 }}>
      <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:'rgba(201,151,58,0.2)', border:'1px solid rgba(201,151,58,0.4)', borderRadius:999, padding:'5px 14px', color:'#F0C060', fontSize:12, fontWeight:600, marginBottom:12 }}>🎉 Celebration Concierge®</div>
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
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:500, display:'flex', alignItems:'flex-end' }}>
      <div onClick={e => e.stopPropagation()} style={{ width:'100%', maxHeight:'88vh', overflowY:'auto', background:C.card, borderRadius:'24px 24px 0 0', padding:'12px 20px calc(32px + env(safe-area-inset-bottom))', animation:'cp-sheet 0.3s ease' }}>
        <div style={{ width:48, height:5, borderRadius:999, background:C.border, margin:'0 auto 20px' }} />
        {sent ? (
          <div style={{ textAlign:'center', padding:'24px 0' }}>
            <div style={{ fontSize:44, marginBottom:12 }}>🎉</div>
            <div style={{ fontSize:22, fontWeight:700, marginBottom:10 }}>Sent to Concierge!</div>
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
        <div style={{ fontSize:11, letterSpacing:'0.14em', color:'rgba(233,30,140,0.9)', fontWeight:700, marginBottom:10 }}>✦ SOUL MADE™ · MADE ONLY FOR {name.toUpperCase()}</div>
        <div style={{ fontSize:22, fontWeight:700, lineHeight:1.2, marginBottom:8 }}>{name}&apos;s face. On cake toppers, bandanas, frames and more.</div>
        <div style={{ fontSize:14, color:'rgba(255,255,255,0.62)', lineHeight:1.6, marginBottom:14 }}>One-of-one celebration pieces made just for {name}.</div>
        <button className="cp-cta" style={{ background:CTAGrad }}>Make something only {name} has →</button>
      </div>
    </div>
  );
}

export default function CelebrateMobilePage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { currentPet, setCurrentPet, pets: contextPets } = usePillarContext();
  usePlatformTracking({ pillar:'celebrate', pet:currentPet });
  const { request, book } = useConcierge({ pet:currentPet, pillar:'celebrate' });

  const [loading, setLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [soulMadeOpen, setSoulMadeOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const [miraPicksOpen, setMiraPicksOpen] = useState(false);
  const [celebrateCatModal, setCelebrateCatModal] = useState(null);

  const handleCategorySelect = useCallback((categoryId, categoryObj) => {
    tdc.view({ product: categoryId, pillar: 'celebrate', pet: currentPet, channel: 'celebrate_category_strip' });
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
      .then(d => setMiraProducts((d?.picks || []).map(p => ({
        id: p.id || p._id, name: p.name,
        desc: p.mira_reason || p.description || 'For the celebration',
        price: p.price ? `₹${p.price}` : 'Price on request',
        imageUrl: p.image_url || p.cloudinary_url,
        raw: p,
      }))))
      .catch(() => {});
  }, [token, currentPet]);

  const showToast = msg => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 2400); };

  const handleConciergeRequest = useCallback(async (type, notes) => {
    await request(`Celebration concierge for ${currentPet?.name || 'your dog'}: ${type}${notes ? `. ${notes}` : ''}`,
      { channel:'celebrate_intake', metadata:{ type, notes } });
  }, [request, currentPet]);

  if (loading) return <PillarPageLayout pillar="celebrate" hideHero hideNavigation><CelebrateLoadingState /></PillarPageLayout>;

  if (!currentPet) return (
    <PillarPageLayout pillar="celebrate" hideHero hideNavigation>
      <style>{CSS}</style>
      <div className="cp"><CelebrateEmptyState onAddPet={() => navigate('/join')} /></div>
    </PillarPageLayout>
  );

  const petName = currentPet.name;

  return (
    <PillarPageLayout pillar="celebrate" hideHero hideNavigation>
      <div className="cp" data-testid="celebrate-mobile">
        <style>{CSS}</style>

        {intakeOpen && <CelebrateIntakeSheet pet={currentPet} onClose={() => setIntakeOpen(false)} onSend={handleConciergeRequest} />}
        {soulMadeOpen && <SoulMadeModal pet={currentPet} pillar="celebrate" pillarColor="#9B59B6" pillarLabel="Celebrate" onClose={() => setSoulMadeOpen(false)} />}
        {selectedProduct && <ProductDetailModal product={selectedProduct.raw || selectedProduct} isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} petName={petName} pillarColor={C.purpleL} />}

        {toastMsg && (
          <div style={{ position:'fixed', left:'50%', bottom:'calc(92px + env(safe-area-inset-bottom))', transform:'translateX(-50%)', zIndex:9000, background:C.dark, color:'#fff', padding:'10px 16px', borderRadius:999, fontSize:13, fontWeight:600, whiteSpace:'nowrap' }}>
            {toastMsg}
          </div>
        )}

        {/* HERO */}
        <div style={{ background:'linear-gradient(160deg,#1A0A2E 0%,#4A1B6D 50%,#9B59B6 100%)', padding:'20px 16px 24px', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-60, right:-40, width:200, height:200, background:'radial-gradient(circle,rgba(233,30,140,0.2) 0%,transparent 70%)', borderRadius:'50%', pointerEvents:'none' }} />
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.5)', letterSpacing:'0.1em', marginBottom:2 }}>THE DOGGY COMPANY</div>
              <div style={{ fontSize:22, fontWeight:700, color:'#fff' }}>🎉 Celebrate</div>
            </div>
            {contextPets?.length > 1 && (
              <select value={currentPet?.id} onChange={e => { vibe('light'); setCurrentPet(contextPets.find(p => p.id === e.target.value)); }}
                style={{ background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:999, padding:'7px 14px', color:'#fff', fontSize:13 }}>
                {contextPets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
            <div style={{ width:52, height:52, borderRadius:'50%', flexShrink:0, background:'rgba(255,255,255,0.15)', border:'2px solid rgba(255,255,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
              {currentPet?.photo_url ? <img src={currentPet.photo_url} alt={petName} style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : <span style={{ fontSize:22 }}>🐾</span>}
            </div>
            <div>
              <div style={{ fontSize:20, fontWeight:700, color:'#fff', lineHeight:1.1 }}>Birthdays & Milestones</div>
              <div style={{ fontSize:15, color:'rgba(255,255,255,0.7)', marginTop:2 }}>for {petName}</div>
            </div>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {getAllergies(currentPet).map(a => (
              <div key={a} style={{ background:'rgba(255,107,100,0.15)', border:'1px solid rgba(255,107,100,0.3)', borderRadius:999, padding:'4px 10px', fontSize:11, color:'#FFB3B0' }}>⚠️ No {a}</div>
            ))}
          </div>
        </div>

        {/* Soul profile questions */}
        <div style={{ padding:'0 16px 8px' }}>
          <PillarSoulProfile pet={currentPet} pillar="celebrate" token={token} />
        </div>

        {/* Category strip */}
        <CelebrateCategoryStrip pet={currentPet} onCategorySelect={handleCategorySelect} />

        {/* Section heading */}
        <div style={{ padding:'0 16px 16px' }}>
          <div style={{ fontSize:26, fontWeight:700, lineHeight:1.1, marginBottom:6 }}>How would {petName} love to celebrate?</div>
          <div style={{ fontSize:15, color:C.taupe, lineHeight:1.5 }}>Birthdays, milestones, and every moment worth marking.</div>
        </div>

        {/* Mira bar */}
        <CelebrateMiraBar pet={currentPet} onOpen={() => setMiraPicksOpen(true)} />

        {/* ── Product Grid ── */}
        {miraProducts.length > 0 && (
          <div style={{ padding:'0 16px 24px' }}>
            <div style={{ fontSize:18, fontWeight:700, marginBottom:12 }}>Celebrate Picks for {petName}</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {miraProducts.map(p => (
                <SharedProductCard key={p.id||p.name} product={p.raw||p} pillar="celebrate" selectedPet={currentPet} onAddToCart={() => { addToCart({ id:p.id, name:p.name, price:p.raw?.price||0, image:p.imageUrl, pillar:'celebrate', quantity:1 }); showToast(`${p.name} added`); }} onClick={() => { vibe(); setSelectedProduct(p); }} />
              ))}
            </div>
          </div>
        )}

        {/* MiraImaginesBreed */}
        <div style={{ padding:'0 16px 24px' }}>
          <MiraImaginesBreed pet={currentPet} pillar="celebrate" token={token} />
        </div>

        <div style={{ padding:'0 16px 24px' }}><PersonalisedBreedSection pet={currentPet} pillar="celebrate" /></div>

        {/* Guided paths */}
        <div style={{ padding:'0 16px 24px' }}>
          <GuidedCelebratePaths pet={currentPet} />
        </div>

        {/* NearMe */}
        <div style={{ padding:'0 16px 24px' }}>
          <CelebrateNearMe pet={currentPet} onBook={venue => {
            tdc.request(`Book celebration venue for ${petName}: ${venue}`, { pillar:'celebrate', channel:'celebrate_nearme', pet:currentPet });
            setIntakeOpen(true);
          }} />
        </div>

        {/* Soul Made */}
        <CelebrateSoulMadeCard pet={currentPet} onOpen={() => setSoulMadeOpen(true)} />

        {/* Concierge CTA */}
        <CelebrateConciergeCard pet={currentPet} onOpen={() => setIntakeOpen(true)} />

        {/* Category content modal — same as desktop */}
        {celebrateCatModal && (
          <CelebrateContentModal
            isOpen={true}
            onClose={() => setCelebrateCatModal(null)}
            category={celebrateCatModal.id}
            pet={currentPet}
          />
        )}

      </div>
    </PillarPageLayout>
  );
}
