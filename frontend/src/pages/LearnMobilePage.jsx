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
import { applyMiraFilter } from '../hooks/useMiraFilter';
import PillarPageLayout from '../components/PillarPageLayout';
import PillarSoulProfile from '../components/PillarSoulProfile';
import GuidedLearnPaths from '../components/learn/GuidedLearnPaths';
import PersonalisedBreedSection from '../components/common/PersonalisedBreedSection';
import MiraImaginesBreed from '../components/common/MiraImaginesBreed';
import MiraImaginesCard from '../components/common/MiraImaginesCard';
import SoulMadeModal from '../components/SoulMadeModal';
import SharedProductCard, { ProductDetailModal } from '../components/ProductCard';
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

const KNOWN_BREEDS = ['american bully','beagle','border collie','boxer','cavalier','chihuahua','chow chow','dachshund','dalmatian','doberman','english bulldog','french bulldog','german shepherd','golden retriever','husky','indie','jack russell','labrador','lhasa apso','maltese','pomeranian','poodle','pug','rottweiler','shih tzu','yorkshire'];
function filterBreedProducts(products, petBreed) {
  const pl=(petBreed||'').toLowerCase(); const pw=pl.split(/\s+/).filter(w=>w.length>2);
  return products.filter(p=>{const n=(p.name||'').toLowerCase();for(const b of KNOWN_BREEDS){if(n.includes(b)){if(!pl)return false;if(n.includes(pl))return true;if(pw.some(w=>b.includes(w)))return true;return false;}}return true;});
}

const LEARN_DIMS = [
  { id:"foundations", icon:"🎓", label:"Foundations",    dbCategory:"training",     ytQuery:"puppy training basics",         accent:"#7C3AED", bg:"#EDE9FE" },
  { id:"behaviour",   icon:"🧠", label:"Behaviour",      dbCategory:"behavior",     ytQuery:"dog behaviour training",        accent:"#F57C00", bg:"#FFF3E0" },
  { id:"training",    icon:"🏆", label:"Training",       dbCategory:"training",     ytQuery:"dog obedience training",        accent:"#1565C0", bg:"#E3F2FD" },
  { id:"tricks",      icon:"✨", label:"Tricks & Fun",   dbCategory:"tricks",       ytQuery:"fun dog tricks",                accent:"#C2185B", bg:"#FCE4EC" },
  { id:"social",      icon:"🐕", label:"Socialisation",  dbCategory:"behavior",     ytQuery:"dog socialisation tips",        accent:"#2E7D32", bg:"#E8F5E9" },
  { id:"soul",        icon:"🌟", label:"Soul Learn",     dbCategory:"accessories",  ytQuery:null,                            accent:"#7B1FA2", bg:"#F3E5F5" },
  { id:"mira",        icon:"✦",  label:"Mira's Picks",   dbCategory:null,           ytQuery:"dog training tips",             accent:"#3949AB", bg:"#E8EAF6" },
];

const LEARN_SERVICES = {
  foundations: [
    { id:"puppy_basics",  icon:"🐾", name:"Puppy Foundations (8 weeks)", price:"₹4,999", desc:"Complete puppy foundations — sit, stay, leave, loose leash, crate — certified trainer, 8 sessions." },
    { id:"basic_ob",      icon:"🏆", name:"Basic Obedience Course",      price:"₹2,999", desc:"4-week course — sit, stay, come, heel — certified positive reinforcement trainer." },
  ],
  behaviour: [
    { id:"behaviour_consult", icon:"🧠", name:"Behaviour Consultation",     price:"₹1,999", desc:"1-hour one-on-one with a certified behaviourist — identify root cause and build a correction plan." },
    { id:"reactivity",        icon:"😤", name:"Reactivity & Aggression",    price:"₹3,499", desc:"6-session programme for reactive dogs — desensitisation and counter-conditioning." },
  ],
  training: [
    { id:"adv_ob",   icon:"🏅", name:"Advanced Obedience",  price:"₹3,999", desc:"6-week advanced programme — off-leash recall, stay 60s+, heel with distractions." },
    { id:"k9_sport", icon:"🏃", name:"K9 Sports Foundations", price:"₹5,999", desc:"Agility, nose work, dock diving foundations — for high-energy working breeds." },
  ],
};

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

function LearnDimPanel({ dim, pet, token, addToCart, onProductClick, onBook }) {
  const { request } = useConcierge({ pet, pillar:'learn' });
  const [dimTab, setDimTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [videos, setVideos] = useState([]);
  const [videoLoading, setVideoLoading] = useState(false);
  const [playing, setPlaying] = useState(null);

  useEffect(() => {
    if (!dim.dbCategory) return;
    fetch(`${API_URL}/api/admin/pillar-products?pillar=learn&sub_category=${encodeURIComponent(dim.dbCategory)}&limit=40`, {
      headers: token ? { Authorization:`Bearer ${token}` } : {}
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.products) setProducts(applyMiraFilter(filterBreedProducts(d.products, pet?.breed), pet)); })
      .catch(() => {});
  }, [dim.id, dim.dbCategory, pet?.breed, token]);

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
  const tabs = [
    { id:'products', label:'📦 Products' },
    ...(dim.ytQuery ? [{ id:'videos', label:'🎬 Videos' }] : []),
    { id:'book', label:'📚 Book' },
  ];
  const svcList = LEARN_SERVICES[dim.id] || LEARN_SERVICES.foundations;

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
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {svcList.map(svc => (
              <div key={svc.id} style={{ background:G.pale, borderRadius:14, padding:'12px 14px' }}>
                <div style={{ display:'flex', gap:10, marginBottom:8 }}>
                  <span style={{ fontSize:22 }}>{svc.icon}</span>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:G.darkText }}>{svc.name}</div>
                    <div style={{ fontSize:14, color:G.mutedText }}>{svc.price}</div>
                  </div>
                </div>
                <div style={{ fontSize:14, color:'#555', lineHeight:1.5, marginBottom:10 }}>{svc.desc}</div>
                <button onClick={() => { vibe('medium'); tdc.book({ service:svc.name, pillar:'learn', pet, channel:'learn_dim_book' }); if (onBook) onBook(svc.name); }}
                  style={{ width:'100%', minHeight:40, borderRadius:12, border:'none', background:`linear-gradient(135deg,${G.mid},${G.purple})`, color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }}>
                  Book via Concierge® →
                </button>
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
  const [soulMadeOpen, setSoulMadeOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [svcBooking, setSvcBooking] = useState({ isOpen: false, serviceType: 'training' });

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
              <select value={currentPet?.id} onChange={e => { vibe(); setCurrentPet(contextPets.find(p => p.id === e.target.value)); }}
                style={{ background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:999, padding:'7px 14px', color:'#fff', fontSize:14 }}>
                {contextPets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
          </div>
          <div style={{ fontSize:20, fontWeight:700, color:'#fff', marginBottom:4 }}>Learn & Train with {petName}</div>
          <div style={{ fontSize:15, color:'rgba(255,255,255,0.7)' }}>Foundations, behaviour, tricks, soul learning</div>
        </div>

        {currentPet && <div style={{ padding:'0 16px 8px' }}><PillarSoulProfile pet={currentPet} pillar="learn" token={token} /></div>}

        {/* Mira Bar */}
        <div style={{ margin:'16px 16px 0', background:G.dark, borderRadius:20, padding:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:`rgba(221,214,254,0.9)`, letterSpacing:'0.1em', marginBottom:8 }}>✦ MIRA ON {petName.toUpperCase()}'S LEARNING</div>
          <div style={{ fontSize:14, color:'rgba(255,255,255,0.75)', lineHeight:1.6, marginBottom:14, fontStyle:'italic' }}>
            "A well-trained dog is a happy dog. Choose a dimension to explore products, videos, and book sessions."
          </div>
          <button className="learn-cta" onClick={() => { vibe('medium'); request('Learning plan', { channel:'learn_mira_cta' }); }}>
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
      </div>

      <ServiceBookingModal
        isOpen={svcBooking.isOpen}
        onClose={() => setSvcBooking(p => ({ ...p, isOpen: false }))}
        serviceType={svcBooking.serviceType}
        onBookingComplete={() => setSvcBooking(p => ({ ...p, isOpen: false }))}
      />
    </PillarPageLayout>
  );
}
