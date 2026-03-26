/**
 * LearnMobilePage.jsx — /learn (mobile)
 * 7 dimension pills + dimTab (Products / Videos / Book) per dimension
 * Colour: Purple #7C3AED
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
import GuidedLearnPaths from '../components/learn/GuidedLearnPaths';
import PersonalisedBreedSection from '../components/common/PersonalisedBreedSection';
import MiraImaginesBreed from '../components/common/MiraImaginesBreed';
import MiraImaginesCard from '../components/common/MiraImaginesCard';
import SoulMadeModal from '../components/SoulMadeModal';
import SharedProductCard, { ProductDetailModal } from '../components/ProductCard';
import LearnNearMe from '../components/learn/LearnNearMe';
import '../styles/mobile-design-system.css';

const G = {
  purple:'#7C3AED', mid:'#5B21B6', deep:'#2E1065', light:'#DDD6FE',
  pale:'#EDE9FE', cream:'#F5F3FF', dark:'#0F0A23',
  darkText:'#2E1065', mutedText:'#7C3AED', border:'rgba(124,58,237,0.18)',
};
const CSS = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
.learn-m{font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Inter',sans-serif;background:${G.cream};color:${G.dark};min-height:100vh;padding-bottom:calc(96px + env(safe-area-inset-bottom))}
.learn-cta{display:flex;align-items:center;justify-content:center;width:100%;min-height:48px;padding:13px 20px;border-radius:14px;border:none;background:linear-gradient(135deg,${G.mid},${G.purple});color:#fff;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;transition:transform 0.15s}
.learn-cta:active{transform:scale(0.97)}`;

function vibe(t='light') { if(navigator?.vibrate) navigator.vibrate(t==='medium'?[12]:[6]); }


const LEARN_DIMS = [
  { id:"foundations", icon:"🎓", label:"Foundations",      dbCategory:"training",            ytQuery:"puppy training basics",                          accent:"#7C3AED", bg:"#EDE9FE" },
  { id:"behaviour",   icon:"🧠", label:"Behaviour",        dbCategory:"behavior",            ytQuery:"dog behaviour training",                         accent:"#F57C00", bg:"#FFF3E0" },
  { id:"training",    icon:"🏆", label:"Training",         dbCategory:"training",            ytQuery:"dog obedience training",                         accent:"#1565C0", bg:"#E3F2FD" },
  { id:"tricks",      icon:"✨", label:"Tricks & Fun",     dbCategory:"tricks",              ytQuery:"fun dog tricks",                                 accent:"#C2185B", bg:"#FCE4EC" },
  { id:"enrichment",  icon:"🧩", label:"Enrichment",       dbCategory:"enrichment",          ytQuery:"dog mental enrichment puzzle snuffle nose work",  accent:"#1565C0", bg:"#E3F2FD" },
  { id:"breed",       icon:"📚", label:"Know Your Breed",  dbCategory:"breed-training_logs", ytQuery:"dog breed specific training",                    accent:"#FF8F00", bg:"#FFF8E1" },
  { id:"soul",        icon:"🌟", label:"Soul Learn",       dbCategory:"breed-treat_pouchs",  ytQuery:null,                                             accent:"#7B1FA2", bg:"#F3E5F5" },
  { id:"bundles",     icon:"🎁", label:"Bundles",          dbCategory:"bundles",             ytQuery:"dog training bundle",                            accent:"#2E7D32", bg:"#E8F5E9" },
  { id:"mira",        icon:"✦",  label:"Mira's Picks",    dbCategory:null,                  ytQuery:"dog training tips",                              accent:"#3949AB", bg:"#E8EAF6" },
  { id:"soul_made",   icon:"✦",  label:"Soul Made™",      dbCategory:null,                  ytQuery:null,                                             accent:"#7C3AED", bg:"#F3E5F5" },
];

// Services are fetched from the Service Box API (/api/services?pillar=learn)
// NEVER show prices — services go through Concierge®

function getLearnPlanCards(pet) {
  const name = pet?.name || 'your dog';
  const breed = pet?.breed || 'Indie';
  const energy = (pet?.energy_level || pet?.doggy_soul_answers?.energy_level || 'medium').toLowerCase();
  const lifeStage = (pet?.life_stage || pet?.doggy_soul_answers?.life_stage || 'adult').toLowerCase();
  const isPuppy = lifeStage === 'puppy';
  const isHighEnergy = energy === 'high' || energy === 'very high';
  return [
    {
      id:'lp-1', emoji:'🎯', name:`${name}'s Foundation Skills`,
      description:`${breed} dogs learn best with ${isHighEnergy ? 'short, high-energy sessions of 10–15 mins' : 'calm, focused sessions of 15–20 mins'}. Start with sit, stay, come, and loose-leash walking.`,
    },
    {
      id:'lp-2', emoji:'🧠', name:'Breed-Specific Intelligence',
      description:`${breed} dogs are naturally ${breed.toLowerCase().includes('indie') ? 'street-smart and independent — focus on recall and trust-building' : 'eager to please — structured training works well'}. Play-based learning accelerates recall.`,
    },
    {
      id:'lp-3', emoji:'🎭', name:'Behaviour & Socialisation',
      description:`${isPuppy ? `Puppy socialisation window is open — expose ${name} to 100 new experiences in the first 16 weeks.` : `Adult ${breed} socialisation — regular dog park visits, puppy classes, and new environment exposure monthly.`}`,
    },
    {
      id:'lp-4', emoji:'🏅', name:'Advanced Skills Roadmap',
      description:`Once foundation is solid, ${name} is ready for ${isHighEnergy ? 'agility, nose work, or K9 sports' : 'tricks, off-leash reliability, and therapy dog prep'}. Mira recommends a 6-month progressive plan.`,
    },
  ];
}

function VideoCard({ video, onPlay }) {
  return (
    <div onClick={() => onPlay(video)} style={{ cursor:'pointer', borderRadius:14, overflow:'hidden', border:`1px solid ${G.border}` }}>
      <div style={{ position:'relative', aspectRatio:'16/9', background:'#000' }}>
        <img src={video.thumbnail} alt={video.title} style={{ width:'100%', height:'100%', objectFit:'cover', opacity:0.85 }} />
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width:44, height:44, borderRadius:'50%', background:'rgba(124,58,237,0.85)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontSize:18, marginLeft:3 }}>▶</span>
          </div>
        </div>
      </div>
      <div style={{ padding:'10px', background:'#fff' }}>
        <div style={{ fontSize:14, fontWeight:600, color:G.darkText, lineHeight:1.4 }}>{(video.title||'').slice(0, 60)}{video.title?.length > 60 ? '…' : ''}</div>
        {video.channel && <div style={{ fontSize:14, color:G.mutedText, marginTop:3 }}>{video.channel}</div>}
      </div>
    </div>
  );
}

function LearnDimPanel({ dim, pet, token, addToCart, onProductClick, onBook, allServices }) {
  const { request } = useConcierge({ pet, pillar:'learn' });
  const [dimTab, setDimTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [videos, setVideos] = useState([]);
  const [videoLoading, setVideoLoading] = useState(false);
  const [playing, setPlaying] = useState(null);

  useEffect(() => {
    // Mira's Picks dim: use claude-picks API — EXACT same as desktop
    if (dim.id === 'mira' && pet?.id) {
      fetch(`${API_URL}/api/mira/claude-picks/${pet.id}?pillar=learn`, {
        headers: token ? { Authorization:`Bearer ${token}` } : {}
      })
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.products) setProducts(filterBreedProducts(d.products, pet?.breed)); })
        .catch(() => {});
      return;
    }
    if (!dim.dbCategory) return;
    fetch(`${API_URL}/api/admin/pillar-products?pillar=learn&category=${encodeURIComponent(dim.dbCategory)}&limit=40&breed=${encodeURIComponent(pet?.breed||'')}`, {
      headers: token ? { Authorization:`Bearer ${token}` } : {}
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.products) setProducts(applyMiraFilter(filterBreedProducts(excludeCakeProducts(d.products), pet?.breed), pet)); })
      .catch(() => {});
  }, [dim.id, dim.dbCategory, pet?.id, pet?.breed, token]);

  const fetchVideos = useCallback(async () => {
    if (!dim.ytQuery || videos.length > 0) return;
    setVideoLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/test/youtube?query=${encodeURIComponent(`${pet?.breed||''} ${dim.ytQuery}`)}&max_results=6`);
      const d = r.ok ? await r.json() : null;
      setVideos((d?.videos || d?.items || d?.results || []).map(v => ({
        id: v.videoId || v.id?.videoId || v.id,
        title: v.title || v.snippet?.title || '',
        thumbnail: v.thumbnail || v.snippet?.thumbnails?.medium?.url || v.snippet?.thumbnails?.default?.url || '',
        channel: v.channelTitle || v.snippet?.channelTitle || '',
        url: `https://www.youtube.com/watch?v=${v.videoId || v.id?.videoId || v.id}`,
      })));
    } catch { setVideos([]); }
    setVideoLoading(false);
  }, [dim.ytQuery, dim.id, pet?.breed, videos.length]);

  useEffect(() => {
    if (dimTab === 'videos') fetchVideos();
  }, [dimTab, fetchVideos]);

  const petName = pet?.name || 'your dog';
  const petLifeStage = (pet?.life_stage || pet?.doggy_soul_answers?.life_stage || '').toLowerCase();
  const isPuppy = petLifeStage === 'puppy' || petLifeStage === 'pup';

  // Services from Service Box — filtered by dim, puppy filter for adult dogs
  const svcList = (allServices || []).filter(s => {
    const dimMatch = !s.dim || s.dim === dim.id || s.category === dim.id;
    const puppyFilter = isPuppy ? true : !(s.name || '').toLowerCase().includes('puppy');
    return dimMatch && puppyFilter;
  });

  const tabs = [
    { id:'products', label:'Products' },
    ...(dim.ytQuery ? [{ id:'videos', label:'🎬 Videos' }] : []),
    { id:'book', label:'📚 Book' },
  ];
  const svcList_unused = null; // replaced by allServices prop

  return (
    <div style={{ background:'#fff', borderRadius:18, border:`1.5px solid ${G.border}`, overflow:'hidden', marginTop:12 }}>
      {/* Dim header */}
      <div style={{ background:`linear-gradient(135deg,${dim.accent}15,${dim.bg})`, padding:'14px 16px', display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:40, height:40, borderRadius:12, background:dim.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{dim.icon}</div>
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:dim.accent }}>{dim.label}</div>
          <div style={{ fontSize:14, color:'#666' }}>for {petName}</div>
        </div>
      </div>

      {/* dimTab bar */}
      <div style={{ display:'flex', background:G.pale, padding:4 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setDimTab(t.id)}
            style={{ flex:1, padding:'8px', borderRadius:10, border:'none', fontSize:14, fontWeight:600, cursor:'pointer',
              background:dimTab===t.id?G.purple:G.pale, color:dimTab===t.id?'#fff':G.mutedText }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding:'12px' }}>
        {/* Products */}
        {dimTab === 'products' && (
          products.length === 0 ? (
            <div style={{ textAlign:'center', padding:'20px', color:'#888', fontSize:14 }}>Loading {dim.label} products for {petName}…</div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {products.slice(0, 10).map(p => (
                <SharedProductCard key={p.id||p._id} product={p} pillar="learn" selectedPet={pet}
                  onAddToCart={() => addToCart({ id:p.id||p._id, name:p.name, price:p.price||0, image:p.image_url||p.images?.[0], pillar:'learn', quantity:1 })}
                  onClick={() => onProductClick(p)} />
              ))}
            </div>
          )
        )}

        {/* Videos */}
        {dimTab === 'videos' && (
          videoLoading ? (
            <div style={{ textAlign:'center', padding:'20px', color:'#888', fontSize:14 }}>🎬 Loading {dim.label} videos…</div>
          ) : videos.length === 0 ? (
            <div style={{ textAlign:'center', padding:'20px', color:'#888', fontSize:14 }}>Videos loading or unavailable — try again.</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {videos.map((v, i) => <VideoCard key={v.id||i} video={v} onPlay={v => window.open(v.url, '_blank')} />)}
            </div>
          )
        )}

        {/* Book */}
        {dimTab === 'book' && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {svcList.length === 0 && (
              <div style={{ textAlign:'center', padding:'20px', color:'#888', fontSize:14 }}>No services available for this category.</div>
            )}
            {svcList.map(svc => (
              <div key={svc.id} style={{ background:'#fff', borderRadius:16, overflow:'hidden', border:`1px solid ${G.border}`, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
                {/* Watercolour illustration from Service Box */}
                {(svc.watercolor_image || svc.cloudinary_image_url || svc.image_url || svc.image) && (
                  <img src={svc.watercolor_image || svc.cloudinary_image_url || svc.image_url || svc.image}
                    alt={svc.name}
                    style={{ width:'100%', height:130, objectFit:'cover', display:'block' }}
                    onError={e => e.target.style.display='none'} />
                )}
                <div style={{ padding:'12px 14px' }}>
                  <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:4 }}>{svc.name}</div>
                  {/* NEVER show price — services go through Concierge® */}
                  <div style={{ fontSize:13, color:'#555', lineHeight:1.5, marginBottom:10 }}>{svc.description || svc.desc}</div>
                  <button onClick={() => { vibe('medium'); if (onBook) onBook(svc.name); }}
                    data-testid={`book-service-${svc.id}`}
                    style={{ width:'100%', minHeight:40, borderRadius:12, border:'none', background:`linear-gradient(135deg,${G.mid},${G.purple})`, color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }}>
                    Book via Concierge® →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LearnMobilePage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { currentPet, setCurrentPet, pets: contextPets } = usePillarContext();
  usePlatformTracking({ pillar:'learn', pet:currentPet });
  const { request } = useConcierge({ pet:currentPet, pillar:'learn' });
  const { addToCart } = useCart();

  const [loading, setLoading] = useState(true);
  const [activeDim, setActiveDim] = useState(LEARN_DIMS[0].id);
  const [mainTab, setMainTab] = useState('learn'); // 'learn' | 'nearme'
  const [soulMadeOpen, setSoulMadeOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [svcBooking, setSvcBooking] = useState({ isOpen: false, serviceType: 'training' });
  const [learnServices, setLearnServices] = useState([]);
  const [showLearnPlan, setShowLearnPlan] = useState(false);

  // Fetch services from Service Box — used by all dim Book tabs
  useEffect(() => {
    fetch(`${API_URL}/api/services?pillar=learn&limit=50`, {
      headers: token ? { Authorization:`Bearer ${token}` } : {}
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.services) setLearnServices(d.services); })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (contextPets !== undefined) setLoading(false);
    if (contextPets?.length > 0 && !currentPet) setCurrentPet(contextPets[0]);
  }, [contextPets, currentPet, setCurrentPet]);

  if (loading) return (
    <PillarPageLayout pillar="learn" hideHero hideNavigation>
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center' }}><div style={{ fontSize:36, marginBottom:12 }}>🎓</div><div>Loading learn…</div></div>
      </div>
    </PillarPageLayout>
  );

  const petName = currentPet?.name || 'your dog';
  const currentDim = LEARN_DIMS.find(d => d.id === activeDim) || LEARN_DIMS[0];

  return (
    <PillarPageLayout pillar="learn" hideHero hideNavigation>
      <div className="learn-m mobile-page-container" data-testid="learn-mobile">
        <style>{CSS}</style>

        {soulMadeOpen && <SoulMadeModal pet={currentPet} pillar="learn" pillarColor={G.purple} pillarLabel="Learn" onClose={() => setSoulMadeOpen(false)} />}
        {selectedProduct && <ProductDetailModal product={selectedProduct} isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} petName={petName} pillarColor={G.purple} />}

        {/* Hero */}
        <div style={{ background:`linear-gradient(160deg,${G.dark} 0%,${G.deep} 55%,${G.mid} 100%)`, padding:'32px 16px 20px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.5)', letterSpacing:'0.1em', marginBottom:2 }}>THE DOGGY COMPANY</div>
              <div style={{ fontSize:22, fontWeight:700, color:'#fff' }}>🎓 Learn</div>
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
          <div style={{ fontSize:20, fontWeight:700, color:'#fff', marginBottom:4 }}>Learn & Train with {petName}</div>
          <div style={{ fontSize:15, color:'rgba(255,255,255,0.7)' }}>Foundations, behaviour, tricks, soul learning</div>
        </div>

        {currentPet && <div style={{ padding:'0 16px 8px' }}><PillarSoulProfile pet={currentPet} pillar="learn" token={token} /></div>}

        {/* Soul Pillar CTA */}
        {currentPet && (
          <div style={{ margin:'0 16px 20px', background:'linear-gradient(135deg,rgba(167,139,250,0.14),rgba(167,139,250,0.20))', border:'1px solid rgba(167,139,250,0.35)', borderRadius:18, padding:'18px 16px' }}>
            <div style={{ fontSize:20, fontWeight:700, color:'#1A0A2E', lineHeight:1.25, marginBottom:5 }}>
              How would <span style={{ color:'#7C3AED' }}>{currentPet?.name || 'your dog'}</span> love to learn?
            </div>
            <div style={{ fontSize:13, color:'#4B5563', lineHeight:1.5 }}>
              Training, skills and enrichment tailored to {currentPet?.name || 'your dog'}'s intelligence and soul profile.
            </div>
          </div>
        )}

        {/* Main Tab Bar: Learn | Near Me */}
        <div style={{ display:'flex', margin:'8px 16px 0', background:'#F3F0FF', borderRadius:12, padding:4 }}>
          {[{id:'learn',label:'📚 Learn'},{id:'nearme',label:'📍 Near Me'}].map(t => (
            <button key={t.id} onClick={() => { vibe(); setMainTab(t.id); }}
              data-testid={`learn-tab-${t.id}`}
              style={{ flex:1, padding:'9px 0', borderRadius:9, fontSize:13, fontWeight:700, border:'none', cursor:'pointer',
                background: mainTab===t.id ? G.purple : 'transparent',
                color: mainTab===t.id ? '#fff' : G.darkText, transition:'all 0.15s' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Near Me content */}
        {mainTab === 'nearme' && (
          <div style={{ padding:'16px 16px 8px' }}>
            <LearnNearMe pet={currentPet} />
          </div>
        )}

        {mainTab === 'learn' && <>
        {/* Mira Bar */}
        <div style={{ margin:'16px 16px 0', background:G.dark, borderRadius:20, padding:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:`rgba(221,214,254,0.9)`, letterSpacing:'0.1em', marginBottom:8 }}>✦ MIRA ON {petName.toUpperCase()}'S LEARNING</div>
          <div style={{ fontSize:14, color:'rgba(255,255,255,0.75)', lineHeight:1.6, marginBottom:14, fontStyle:'italic' }}>
            "A well-trained dog is a happy dog. Choose a dimension to explore products, videos, and book sessions."
          </div>
          <button className="learn-cta" onClick={() => { vibe('medium'); setShowLearnPlan(true); }}>
            Build {petName}'s Learning Plan →
          </button>
        </div>

        {/* 7 Dimension Pills */}
        <div style={{ padding:'16px 16px 8px' }}>
          <div style={{ fontSize:15, fontWeight:700, color:G.darkText, marginBottom:10 }}>Choose a Learning Dimension</div>
          <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4 }}>
            {LEARN_DIMS.map(dim => (
              <button key={dim.id} onClick={() => { vibe(); setActiveDim(dim.id); }}
                data-testid={`learn-dim-${dim.id}`}
                style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                  padding:'10px 12px', borderRadius:16, minWidth:72,
                  border:`2px solid ${activeDim===dim.id?dim.accent:G.border}`,
                  background:activeDim===dim.id?dim.bg:'#fff', cursor:'pointer' }}>
                <span style={{ fontSize:20 }}>{dim.icon}</span>
                <span style={{ fontSize:14, fontWeight:700, color:activeDim===dim.id?dim.accent:G.darkText, textAlign:'center', lineHeight:1.2 }}>{dim.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Active Dimension Panel */}
        <div style={{ padding:'0 16px 16px' }}>
          <LearnDimPanel
            dim={currentDim}
            pet={currentPet}
            token={token}
            addToCart={addToCart}
            allServices={learnServices}
            onProductClick={p => { vibe(); setSelectedProduct(p); }}
            onBook={svcName => { setSvcBooking({ isOpen: true, serviceType: guessServiceType(svcName) }); }}
          />
        </div>

        {/* Guided Paths */}
        {currentPet && <div style={{ padding:'0 16px 16px' }}><GuidedLearnPaths pet={currentPet} /></div>}

        {/* PersonalisedBreedSection */}
        {currentPet && <div style={{ padding:'0 16px 16px' }}><PersonalisedBreedSection pet={currentPet} pillar="learn" token={token} /></div>}

        {/* Mira Imagines */}
        {currentPet && <div style={{ padding:'0 16px 16px' }}><MiraImaginesBreed pet={currentPet} pillar="learn" token={token} /></div>}

        {/* MiraImaginesCard */}
        {currentPet && (
          <div style={{ padding:'0 16px 24px' }}>
            {[
              { id:'l-1', emoji:'📚', name:'Training Handbook Bundle', description:`The complete training guide set for ${petName}'s breed — from puppy to senior.` },
              { id:'l-2', emoji:'🎬', name:'Video Masterclass Access', description:'12-month access to The Doggy Company training video library — 200+ sessions.' },
            ].map(item => <MiraImaginesCard key={item.id} item={item} pet={currentPet} token={token} pillar="learn" />)}
          </div>
        )}

        {/* SoulMade */}
        <div style={{ margin:'0 16px 24px', background:G.dark, borderRadius:20, padding:18, cursor:'pointer' }} onClick={() => setSoulMadeOpen(true)}>
          <div style={{ fontSize:14, letterSpacing:'0.14em', color:G.light, fontWeight:700, marginBottom:8 }}>✦ SOUL MADE™ · LEARNING TOOLS FOR {petName.toUpperCase()}</div>
          <div style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:8 }}>Personalised training materials for {petName}.</div>
          <button className="learn-cta">Explore Soul Made →</button>
        </div>
        </>}
      </div>

      <ServiceBookingModal
        isOpen={svcBooking.isOpen}
        onClose={() => setSvcBooking(p => ({ ...p, isOpen: false }))}
        serviceType={svcBooking.serviceType}
        onBookingComplete={() => setSvcBooking(p => ({ ...p, isOpen: false }))}
      />

      {/* Mira Learn Plan Modal — same dark bottom-sheet pattern as Care Plan */}
      {showLearnPlan && (() => {
        const learnPlanCards = getLearnPlanCards(currentPet);
        const petName = currentPet?.name || 'your dog';
        return (
          <div style={{ position:'fixed', inset:0, zIndex:999, background:'rgba(0,0,0,0.85)', display:'flex', flexDirection:'column', justifyContent:'flex-end' }}
            onClick={e => { if(e.target===e.currentTarget) setShowLearnPlan(false); }}>
            <div style={{ background:G.dark, borderRadius:'24px 24px 0 0', padding:'24px 16px 48px', maxHeight:'90vh', overflowY:'auto' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
                <div>
                  <div style={{ fontSize:10, letterSpacing:'0.14em', color:G.light, fontWeight:700, marginBottom:4 }}>✦ MIRA'S PERSONALISED LEARNING PLAN</div>
                  <div style={{ fontSize:22, fontWeight:800, color:'#fff', lineHeight:1.2 }}>Curated for {petName}</div>
                  <div style={{ fontSize:13, color:'rgba(255,255,255,0.5)', marginTop:4 }}>{currentPet?.breed || 'Indie'} · {(currentPet?.life_stage || 'Adult')} · {(currentPet?.energy_level || 'Medium')} Energy</div>
                </div>
                <button onClick={() => setShowLearnPlan(false)} style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:'50%', width:32, height:32, color:'#fff', fontSize:20, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>×</button>
              </div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginBottom:20, lineHeight:1.5 }}>
                Mira has analysed {petName}'s breed intelligence, energy level, and soul profile to build this learning roadmap.
              </div>
              {learnPlanCards.map(item => (
                <MiraImaginesCard key={item.id} item={item} pet={currentPet} token={token} pillar="learn" />
              ))}
              <button
                className="learn-cta"
                style={{ width:'100%', marginTop:8 }}
                onClick={() => { setShowLearnPlan(false); request(`Learning plan for ${petName}`, { channel:'learn_plan_book' }); }}>
                Book via Concierge® →
              </button>
            </div>
          </div>
        );
      })()}
    </PillarPageLayout>
  );
}
