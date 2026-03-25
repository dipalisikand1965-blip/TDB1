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
import PillarPageLayout from '../components/PillarPageLayout';
import PillarSoulProfile from '../components/PillarSoulProfile';
import PlayConciergeSection from '../components/play/PlayConciergeSection';
import PlayNearMe from '../components/play/PlayNearMe';
import BuddyMeetup from '../components/play/BuddyMeetup';
import GuidedPlayPaths from '../components/play/GuidedPlayPaths';
import PersonalisedBreedSection from '../components/common/PersonalisedBreedSection';
import MiraImaginesBreed from '../components/common/MiraImaginesBreed';
import MiraImaginesCard from '../components/common/MiraImaginesCard';
import SoulMadeModal from '../components/SoulMadeModal';
import SharedProductCard, { ProductDetailModal } from '../components/ProductCard';

const G = {
  orange:'#E76F51', mid:'#C25B3D', deep:'#7A2E1A', light:'#FBD8CE',
  pale:'#FFF5F2', cream:'#FFF8F5', dark:'#1F0A04',
  darkText:'#7A2E1A', mutedText:'#C25B3D',
  border:'rgba(231,111,81,0.18)',
};
const CSS = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
.play-m{font-family:'DM Sans',-apple-system,sans-serif;background:${G.cream};color:${G.dark};min-height:100vh;padding-bottom:calc(96px + env(safe-area-inset-bottom))}
.play-cta{display:flex;align-items:center;justify-content:center;width:100%;min-height:48px;padding:13px 20px;border-radius:14px;border:none;background:linear-gradient(135deg,${G.mid},${G.orange});color:#fff;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;transition:transform 0.15s}
.play-cta:active{transform:scale(0.97)}
.play-tab{flex:1;padding:12px 4px;background:none;border:none;border-bottom:2.5px solid transparent;font-size:13px;font-weight:500;color:#999;cursor:pointer;transition:all 0.15s;white-space:nowrap;font-family:inherit}
.play-tab.active{color:${G.orange};border-bottom-color:${G.orange};font-weight:700}`;

function vibe(t='light') { if(navigator?.vibrate) navigator.vibrate(t==='medium'?[12]:[6]); }

function getAllergies(pet) {
  const raw = pet?.allergies; let arr = [];
  if (Array.isArray(raw)) arr = raw;
  else if (typeof raw === 'string') arr = raw.split(',').map(s => s.trim());
  return arr.filter(a => a && !['none','no allergies','nil','n/a'].includes(a.toLowerCase()));
}
function applyMiraIntelligence(products, allergies) {
  if (!allergies?.length) return products;
  return products.filter(p => {
    const text = `${p.name} ${p.description || ''}`.toLowerCase();
    for (const a of allergies) { if (text.includes(a.toLowerCase()) && !text.includes('free')) return false; }
    return true;
  });
}
const KNOWN_BREEDS = ['american bully','beagle','border collie','boxer','cavalier','chihuahua','chow chow','dachshund','dalmatian','doberman','english bulldog','french bulldog','german shepherd','golden retriever','husky','indie','jack russell','labrador','lhasa apso','maltese','pomeranian','poodle','pug','rottweiler','shih tzu','yorkshire'];
function filterBreedProducts(products, petBreed) {
  const pl=(petBreed||'').toLowerCase(); const pw=pl.split(/\s+/).filter(w=>w.length>2);
  return products.filter(p=>{const n=(p.name||'').toLowerCase();for(const b of KNOWN_BREEDS){if(n.includes(b)){if(!pl)return false;if(n.includes(pl))return true;if(pw.some(w=>b.includes(w)))return true;return false;}}return true;});
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
  const [subCat, setSubCat] = useState('All');
  const [soulMadeOpen, setSoulMadeOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [allRaw, setAllRaw] = useState([]);

  useEffect(() => {
    if (contextPets !== undefined) setLoading(false);
    if (contextPets?.length > 0 && !currentPet) setCurrentPet(contextPets[0]);
  }, [contextPets, currentPet, setCurrentPet]);

  useEffect(() => {
    if (!currentPet?.id) return;
    fetch(`${API_URL}/api/admin/pillar-products?pillar=play&limit=200`, { headers: token ? { Authorization:`Bearer ${token}` } : {} })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.products) setAllRaw(filterBreedProducts(d.products, currentPet?.breed)); })
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
  const intelligent = applyMiraIntelligence(allRaw, allergies);
  const subCats = ['All', ...new Set(intelligent.map(p => p.sub_category).filter(Boolean))];
  const products = subCat === 'All' ? intelligent : intelligent.filter(p => p.sub_category === subCat);

  return (
    <PillarPageLayout pillar="play" hideHero hideNavigation>
      <div className="play-m" data-testid="play-mobile">
        <style>{CSS}</style>

        {soulMadeOpen && <SoulMadeModal pet={currentPet} pillar="play" pillarColor={G.orange} pillarLabel="Play" onClose={() => setSoulMadeOpen(false)} />}
        {selectedProduct && <ProductDetailModal product={selectedProduct?.raw || selectedProduct} isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} petName={petName} pillarColor={G.orange} />}

        {/* Hero */}
        <div style={{ background:`linear-gradient(160deg,${G.dark} 0%,${G.deep} 55%,${G.mid} 100%)`, padding:'32px 16px 20px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.5)', letterSpacing:'0.1em', marginBottom:2 }}>THE DOGGY COMPANY</div>
              <div style={{ fontSize:22, fontWeight:700, color:'#fff' }}>🎾 Play</div>
            </div>
            {contextPets?.length > 1 && (
              <select value={currentPet?.id} onChange={e => { vibe(); setCurrentPet(contextPets.find(p => p.id === e.target.value)); }}
                style={{ background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:999, padding:'7px 14px', color:'#fff', fontSize:13 }}>
                {contextPets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
          </div>
          <div style={{ fontSize:20, fontWeight:700, color:'#fff', marginBottom:4 }}>Play, Joy & Enrichment</div>
          <div style={{ fontSize:15, color:'rgba(255,255,255,0.7)' }}>Toys, enrichment, playgroups, dog walkers</div>
        </div>

        {currentPet && <div style={{ padding:'0 16px 8px' }}><PillarSoulProfile pet={currentPet} pillar="play" token={token} /></div>}

        {/* Tab Bar */}
        <div style={{ display:'flex', background:'#fff', borderBottom:`1px solid ${G.border}`, position:'sticky', top:0, zIndex:100 }}>
          {[
            { id:'play',      label:'🎾 Play & Products' },
            { id:'services',  label:'🐕 Services' },
            { id:'find-play', label:'📍 Find Play' },
          ].map(tab => (
            <button key={tab.id} className={`play-tab${activeTab===tab.id?' active':''}`}
              data-testid={`play-tab-${tab.id}`}
              onClick={() => { vibe(); setActiveTab(tab.id); setSubCat('All'); }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: Play & Products */}
        {activeTab === 'play' && (
          <div>
            {/* Mira Bar */}
            <div style={{ margin:'16px 16px 0', background:G.dark, borderRadius:20, padding:16 }}>
              <div style={{ fontSize:11, fontWeight:700, color:`rgba(251,216,206,0.9)`, letterSpacing:'0.1em', marginBottom:8 }}>✦ MIRA ON {petName.toUpperCase()}'S JOY</div>
              <div style={{ fontSize:14, color:'rgba(255,255,255,0.75)', lineHeight:1.6, marginBottom:14, fontStyle:'italic' }}>
                "Play isn't optional — it's essential for {petName}'s mental health and happiness."
              </div>
              <button className="play-cta" onClick={() => { vibe('medium'); request('Play and enrichment ideas', { channel:'play_mira_cta' }); }}>
                Build {petName}'s Play Plan →
              </button>
            </div>

            {/* dimTab */}
            <div style={{ display:'flex', margin:'16px 16px 0', background:G.pale, borderRadius:12, padding:4 }}>
              {[{ id:'products', label:'🎯 All Products' }, { id:'personalised', label:'✦ Personalised' }].map(t => (
                <button key={t.id} onClick={() => { setDimTab(t.id); setSubCat('All'); }}
                  style={{ flex:1, padding:'9px', borderRadius:10, border:'none', fontSize:13, fontWeight:600, cursor:'pointer',
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
                {/* Sub-category pills */}
                {subCats.length > 1 && (
                  <div style={{ display:'flex', gap:6, overflowX:'auto', marginBottom:12, paddingBottom:4 }}>
                    {subCats.map(cat => (
                      <button key={cat} onClick={() => setSubCat(cat)}
                        style={{ flexShrink:0, padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:600,
                          border:`1.5px solid ${subCat===cat?G.orange:G.border}`,
                          background:subCat===cat?G.orange:'#fff',
                          color:subCat===cat?'#fff':G.darkText, cursor:'pointer' }}>
                        {cat.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}
                      </button>
                    ))}
                  </div>
                )}

                {products.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'32px 0', color:'#888' }}>
                    <div style={{ fontSize:32, marginBottom:8 }}>🎾</div>
                    <div>Loading play products for {petName}…</div>
                  </div>
                ) : (
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    {products.slice(0, 40).map(p => (
                      <SharedProductCard key={p.id||p._id||p.name} product={p} pillar="play" selectedPet={currentPet}
                        onAddToCart={() => handleAddToCart(p)}
                        onClick={() => { vibe(); setSelectedProduct(p); }} />
                    ))}
                  </div>
                )}

                <div style={{ marginTop:16 }}><MiraImaginesBreed pet={currentPet} pillar="play" token={token} /></div>
                <div style={{ marginTop:16 }}><GuidedPlayPaths pet={currentPet} /></div>

                <div style={{ marginTop:16, background:G.dark, borderRadius:20, padding:18, cursor:'pointer' }} onClick={() => setSoulMadeOpen(true)}>
                  <div style={{ fontSize:10, letterSpacing:'0.14em', color:G.light, fontWeight:700, marginBottom:8 }}>✦ SOUL MADE™ · PLAY GEAR FOR {petName.toUpperCase()}</div>
                  <div style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:8 }}>Custom bandanas, toys and play accessories.</div>
                  <button className="play-cta">Explore Soul Made →</button>
                </div>
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
            }} />
          </div>
        )}
      </div>
    </PillarPageLayout>
  );
}
