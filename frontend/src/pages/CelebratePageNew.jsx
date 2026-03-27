/**
 * CelebratePageNew.jsx
 * 
 * SOUL-FIRST CELEBRATION ARCHITECTURE
 * Mobile-first, iOS/Android responsive
 * 
 * Page Spine (SINGLE HERO, NO DUPLICATES):
 * 1. THE ARRIVAL (Hero) → Pet, Soul Score, Soul Chips, Mira's Voice
 * 2. CATEGORY STRIP → Opens modals with products/bundles/services
 * 3. SOUL PILLARS → "How would {petName} love to celebrate?"
 * 4. MIRA'S BIRTHDAY BOX → Build it yourself
 * 5. CELEBRATE CONCIERGE® → Hand it over
 * 6. GUIDED PATHS → Birthday Party | Gotcha Day | Photoshoot
 * 7. CELEBRATION WALL → Community moments
 * 
 * IMPORTANT: Mira widget and Concierge® button remain visible throughout
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, SendHorizonal } from 'lucide-react';

// Context
import { useAuth } from '../context/AuthContext';
import { usePillarContext } from '../context/PillarContext';

// Layout - This includes the Mira widget
import PillarPageLayout from '../components/PillarPageLayout';

// New Soul-First Components
import {
  CelebrateHero,
  CelebrateCategoryStrip,
  SoulCelebrationPillars,
  MiraCuratedBox,
  CelebrateConcierge,
  CelebrateServiceGrid,
  GuidedCelebrationPaths,
  CelebrationMemoryWall
} from '../components/celebrate';
import ConciergeIntakeModal from '../components/celebrate/ConciergeIntakeModal';


import MiraSoulNudge from '../components/celebrate/MiraSoulNudge';
import MiraBirthdayBox from '../components/celebrate/MiraBirthdayBox';
import BirthdayBoxBuilder from '../components/celebrate/BirthdayBoxBuilder';
import BirthdayBoxBrowseDrawer from '../components/celebrate/BirthdayBoxBrowseDrawer';
import CelebrateNearMe from '../components/celebrate/CelebrateNearMe';
import CelebrateContentModal from '../components/celebrate/CelebrateContentModal';
import MiraImaginesCard from '../components/common/MiraImaginesCard';
import { useMiraIntelligence, getMiraIntelligenceSubtitle } from '../hooks/useMiraIntelligence';
import MiraImaginesBreed from '../components/common/MiraImaginesBreed';
import { ProductDetailModal } from '../components/ProductCard';
import DoggyBakeryCakeModal from '../components/celebrate/DoggyBakeryCakeModal';

// API utilities
import { getApiUrl, API_URL } from '../utils/api';
import { tdc } from '../utils/tdc_intent';
import { usePlatformTracking } from '../hooks/usePlatformTracking';
import PillarSoulProfile from '../components/PillarSoulProfile';
import CelebrateMobilePage from './CelebrateMobilePage';
import { filterBreedProducts } from '../hooks/useMiraFilter';

const CELEBRATE_SERVICE_BLACKLIST = [
  'pet loss', 'grief', 'memorial', 'euthanasia', 'farewell', 'aftercare', 'counseling', 'counselling', 'rainbow bridge'
];

const isCelebrateSafeService = (pick) => {
  const text = `${pick?.name || ''} ${pick?.description || ''} ${pick?.category || ''} ${pick?.sub_category || ''}`.toLowerCase();
  const pickPillar = String(pick?.pillar || '').toLowerCase();
  const pillarList = Array.isArray(pick?.pillars) ? pick.pillars.map((p) => String(p).toLowerCase()) : [];
  if (pickPillar && pickPillar !== 'celebrate') return false;
  if (pillarList.length > 0 && !pillarList.includes('celebrate')) return false;
  return !CELEBRATE_SERVICE_BLACKLIST.some((bad) => text.includes(bad));
};

// ─── KNOWN BREEDS (breed filter — PET FIRST, BREED NEXT) ────────────

// ─── MIRA PICKS SECTION ───────────────────────────────────────────────
function CelebrateMiraPicksSection({ pet, token, onOpenService }) {
  const [scoringPending, setScoringPending] = useState(false);
  const [picks, setPicks]         = useState([]);
  const [picksLoading, setPicksLoading] = useState(true);
  const [selPick,  setSelPick]    = useState(null);
  const { note, orderCount, topInterest } = useMiraIntelligence(pet?.id, token);
  const petName = pet?.name || "your dog";
  const breed   = (pet?.breed||"").split("(")[0].trim();
  const subtitle = getMiraIntelligenceSubtitle(petName, note, orderCount, topInterest);
  const imagines = [
    {id:"cel-1",emoji:"🎂",name:`${petName}'s Birthday Cake`,description:breed?`A custom ${breed} birthday cake from The Doggy Bakery — made for ${petName}'s breed.`:`A custom birthday cake made just for ${petName} — baked with love.`},
    {id:"cel-2",emoji:"🎁",name:`${petName}'s Celebration Box`,description:`Curated birthday box: cake, bandana, toy and treats — personalised for ${breed||petName}.`},
    {id:"cel-3",emoji:"📸",name:`${petName}'s Memory Portrait`,description:breed?`A watercolour portrait of ${petName} the ${breed} — capture this moment forever.`:`A personalised watercolour portrait of ${petName} to keep forever.`},
  ];
  useEffect(()=>{
    if(!pet?.id){setPicksLoading(false);return;}
    setPicks([]);setPicksLoading(true);
    const breedParam=encodeURIComponent((pet?.breed||"").toLowerCase().trim());
    Promise.all([
      fetch(`${API_URL}/api/mira/claude-picks/${pet.id}?pillar=celebrate&limit=12&min_score=60&entity_type=product&breed=${breedParam}`).then(r=>r.ok?r.json():null),
      fetch(`${API_URL}/api/mira/claude-picks/${pet.id}?pillar=celebrate&limit=6&min_score=60&entity_type=service`).then(r=>r.ok?r.json():null),
    ])
      .then(([pData, sData]) => {
        const prods = filterBreedProducts(pData?.picks || [], pet?.breed);
        const svcs = (sData?.picks || []).filter(isCelebrateSafeService);
        const merged = [];
        let pi = 0, si = 0;
        while (pi < prods.length || si < svcs.length) {
          if (pi < prods.length) merged.push(prods[pi++]);
          if (pi < prods.length) merged.push(prods[pi++]);
          if (si < svcs.length) merged.push(svcs[si++]);
        }
        if (merged.length) setPicks(merged.slice(0, 12));
        setPicksLoading(false);
      })
      .catch(()=>setPicksLoading(false));
  },[pet?.id,pet?.breed]);
  const productPicks = picks.filter(p => p.entity_type === 'product' || p.type === 'product' || (!p.entity_type && !p.type));
  const hasScoredProducts = productPicks.length > 0;
  return (
    <section style={{marginBottom:32}}>
      <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:4}}>
        <h3 style={{fontSize:"clamp(1.125rem,2.5vw,1.375rem)",fontWeight:800,color:"#1a0a2e",margin:0,fontFamily:"Georgia,serif"}}>
          Mira's Picks for <span style={{color:"#C44DFF"}}>{petName}</span>
        </h3>
        <span style={{fontSize:11,background:"linear-gradient(135deg,#C44DFF,#FF6B9D)",color:"#fff",borderRadius:20,padding:"2px 10px",fontWeight:700}}>{picks.length>0?(hasScoredProducts?"AI Scored":"Concierge® Curated"):"Pet Specific"}</span>
      </div>
      <p style={{fontSize:13,color:"#888",marginBottom:16,lineHeight:1.5}}>{subtitle}</p>
      {!picksLoading&&picks.length===0&&(
        <div style={{display:"flex",gap:12,overflowX:"auto",paddingBottom:8,scrollbarWidth:"none"}}>
          {imagines.map(item=><MiraImaginesCard key={item.id} item={item} pet={pet} token={token} pillar="celebrate"/>)}
        </div>
      )}
      {picksLoading&&(
        <div style={{display:"flex",gap:12,overflowX:"auto",paddingBottom:8,scrollbarWidth:"none"}}>
          {[1,2,3,4].map(i=>(
            <div key={i} style={{flexShrink:0,width:168,borderRadius:14,overflow:"hidden",background:"#FAF5FF",border:"1.5px solid rgba(196,77,255,0.1)"}}>
              <div style={{width:"100%",height:130,background:"linear-gradient(90deg,#F3E8FF 25%,#EDE1FF 50%,#F3E8FF 75%)",backgroundSize:"200% 100%",animation:"celebrate-shimmer 1.4s infinite"}}/>
              <div style={{padding:"10px 11px 12px"}}>
                <div style={{height:10,borderRadius:6,background:"linear-gradient(90deg,#F3E8FF 25%,#EDE1FF 50%,#F3E8FF 75%)",backgroundSize:"200% 100%",animation:"celebrate-shimmer 1.4s infinite",marginBottom:8,width:"80%"}}/>
                <div style={{height:8,borderRadius:6,background:"linear-gradient(90deg,#F3E8FF 25%,#EDE1FF 50%,#F3E8FF 75%)",backgroundSize:"200% 100%",animation:"celebrate-shimmer 1.4s infinite",width:"60%"}}/>
              </div>
            </div>
          ))}
          <style>{`@keyframes celebrate-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        </div>
      )}
      {!picksLoading&&picks.length>0&&(
        <div style={{display:"flex",gap:14,overflowX:"auto",paddingBottom:10,scrollbarWidth:"thin"}}>
          {picks.map((pick,i)=>{const isService=pick.entity_type==='service'||pick.type==='service';const score=pick.mira_score||0;const col=score>=80?"#16A34A":score>=70?"#C44DFF":"#6B7280";const img=[pick.image_url,pick.image].find(u=>u&&u.startsWith("http"))||null;return(
            <div key={pick.id||i} style={{flexShrink:0,width:168,background:"#fff",borderRadius:14,border:"1.5px solid rgba(196,77,255,0.15)",overflow:"hidden",cursor:"pointer",transition:"transform 0.15s"}}
              onClick={()=>isService?onOpenService?.(pick.name):setSelPick(pick)}
              onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={e=>e.currentTarget.style.transform=""}>
              <div style={{width:"100%",height:130,background:"#FAF5FF",overflow:"hidden",position:"relative"}}>{img?<img src={img} alt={pick.name||""} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>:<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#3B0764,#7C3AED)",color:"#fff",fontSize:12,fontWeight:700,padding:8,textAlign:"center"}}>{(pick.name||"").slice(0,18)}</div>}</div>
              <div style={{padding:"10px 11px 12px"}}><div style={{fontSize:12,fontWeight:700,color:"#1a0a2e",lineHeight:1.3,marginBottom:6,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{pick.name||"—"}</div>{!isService&&<div style={{display:"flex",alignItems:"center",gap:5,marginBottom:8}}><div style={{flex:1,height:4,background:"#FAF5FF",borderRadius:4,overflow:"hidden"}}><div style={{width:`${score}%`,height:"100%",background:col,borderRadius:4}}/></div><span style={{fontSize:10,fontWeight:800,color:col,minWidth:26}}>{score}</span></div>}{isService&&<p style={{fontSize:11,color:'#7C3AED',lineHeight:1.45,margin:'0 0 8px'}}>Concierge® planning for {petName}'s celebration.</p>}<button onClick={(e)=>{e.stopPropagation();isService?onOpenService?.(pick.name):setSelPick(pick);}} style={{width:'100%',background:'linear-gradient(135deg,#C44DFF,#FF6B9D)',color:'#fff',border:'none',borderRadius:10,padding:'8px 10px',fontSize:12,fontWeight:700,cursor:'pointer'}}>{isService?'Talk to Concierge® →':'View details →'}</button></div>
            </div>
          );})}
        </div>
      )}
      {selPick && <ProductDetailModal product={selPick} pillar="celebrate" selectedPet={pet} onClose={()=>setSelPick(null)}/>}

    </section>
  );
}

// Empty State when no pet
const NoPetState = ({ onAddPet }) => (
  <section 
    className="min-h-[60vh] flex flex-col items-center justify-center px-4"
    style={{
      background: 'linear-gradient(135deg, #1a0a2e 0%, #16082a 50%, #2d1b4e 100%)'
    }}
    data-testid="no-pet-state"
  >
    <div className="text-center max-w-md">
      <div className="text-6xl mb-6">🎉</div>
      <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
        Celebrations for your pet
      </h1>
      <p className="text-white/70 text-lg mb-8">
        Add your pet to unlock a personalised celebration experience.
      </p>
      <button
        onClick={onAddPet}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium shadow-lg shadow-purple-500/30 hover:shadow-xl transition-shadow"
        data-testid="add-pet-cta"
      >
        <span>✦</span>
        <span>Add your pet to begin</span>
      </button>
    </div>
  </section>
);

// Loading State
const LoadingState = () => (
  <div 
    className="min-h-[60vh] flex items-center justify-center" 
    style={{
      background: 'linear-gradient(135deg, #1a0a2e 0%, #16082a 50%, #2d1b4e 100%)'
    }}
    data-testid="loading-state"
  >
    <div className="text-center text-white">
      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-pink-400" />
      <p className="text-white/70">Loading celebrations...</p>
    </div>
  </div>
);

// Mira Ask Bar — minimal, just the input (no extra text)
const MiraAskBar = ({ petName }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  const openMira = (message) => {
    window.dispatchEvent(new CustomEvent('openMiraAI', {
      detail: {
        message: message || `Tell me how to celebrate ${petName}`,
        context: 'celebrate'
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      openMira(q);
      setQuery('');
    } else {
      openMira();
    }
  };

  return (
    <div className="px-6 mb-8" data-testid="celebrate-mira-ask-bar">
      <div className="max-w-2xl mx-auto">
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 rounded-full overflow-hidden"
          style={{
            background: 'rgba(196,77,255,0.06)',
            border: '1.5px solid rgba(196,77,255,0.25)',
            padding: '4px 4px 4px 18px',
            boxShadow: '0 2px 8px rgba(196,77,255,0.10)'
          }}
        >
          <span className="text-base flex-shrink-0" style={{ color: '#C44DFF' }}>✦</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Ask Mira about ${petName}'s celebrations...`}
            className="flex-1 bg-transparent outline-none"
            style={{ fontSize: 14, color: '#1A0A00', padding: '8px 0' }}
            onClick={() => !query.trim() && openMira()}
          />
          <button
            type="submit"
            className="rounded-full flex items-center justify-center text-white flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #C44DFF, #FF6B9D)',
              border: 'none',
              width: 36, height: 36,
              cursor: 'pointer'
            }}
          >
            <SendHorizonal className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

const CelebratePageNew = () => {
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  useEffect(() => { const fn = () => setIsDesktop(window.innerWidth >= 1024); window.addEventListener('resize', fn); return () => window.removeEventListener('resize', fn); }, []);
  const navigate = useNavigate();
  const { user, token, isAuthenticated } = useAuth();
  const { currentPet, setCurrentPet, pets: contextPets } = usePillarContext();
  const pet = currentPet; // alias for sub-components

  
  // ── Universal visit tracking ──────────────────────────────────
  usePlatformTracking({ pillar: "celebrate", pet: currentPet });

  // Use currentPet from context
  const selectedPet = currentPet;
  
  const [soulScore, setSoulScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [celebrateCatModal, setCelebrateCatModal] = useState(null);

  // Wait for pet data to load from context
  useEffect(() => {
    // If we have pets in context but no currentPet, select the first one
    if (contextPets?.length > 0 && !currentPet) {
      setCurrentPet(contextPets[0]);
    }
    // If context is loaded (pets checked), we're done loading
    if (contextPets !== undefined) {
      setLoading(false);
    }
  }, [contextPets, currentPet, setCurrentPet]);

  // Fetch soul score when pet changes
  useEffect(() => {
    const fetchSoulScore = async () => {
      if (!selectedPet?.id) return;

      try {
        const apiUrl = getApiUrl();
        const response = await fetch(`${apiUrl}/api/pet-soul/profile/${selectedPet.id}`);
        if (response.ok) {
          const data = await response.json();
          setSoulScore(data.soul_score || data.overall_score || data.scores?.overall || selectedPet.soul_score || 0);
        } else {
          setSoulScore(selectedPet?.soul_score || selectedPet?.overall_score || 0);
        }
      } catch (error) {
        console.error('[CelebratePageNew] Error fetching soul score:', error);
        setSoulScore(selectedPet?.soul_score || selectedPet?.overall_score || 0);
      }
    };

    fetchSoulScore();

    // Listen for live soul score updates from inline soul questions (in modals)
    const handleSoulScoreUpdated = (e) => {
      if (e.detail?.petId === selectedPet?.id && e.detail?.score !== undefined) {
        setSoulScore(e.detail.score);
      }
    };
    window.addEventListener('soulScoreUpdated', handleSoulScoreUpdated);
    return () => window.removeEventListener('soulScoreUpdated', handleSoulScoreUpdated);
  }, [selectedPet?.id]);

  // Handle add pet
  const handleAddPet = useCallback(() => {
    if (isAuthenticated) {
      navigate('/dashboard/pets?action=add');
    } else {
      navigate('/login?redirect=/celebrate-soul');
    }
  }, [isAuthenticated, navigate]);

  // Handle open soul builder for incomplete pillars
  const handleOpenSoulBuilder = useCallback((pillarId) => {
    if (selectedPet?.id) {
      navigate(`/pet-soul/${selectedPet.id}?section=${pillarId}`);
    } else {
      toast.info('Please add a pet first to build their soul profile');
      handleAddPet();
    }
  }, [selectedPet?.id, navigate, handleAddPet]);

  // Handle build box from Mira's curated box — open BirthdayBoxBuilder modal
  const handleBuildBox = useCallback((boxPreview) => {
    window.dispatchEvent(new CustomEvent('openOccasionBoxBuilder', {
      detail: {
        preset: boxPreview,
        petName: selectedPet?.name,
        petId: selectedPet?.id,
        userEmail: user?.email || '',
        userName: user?.name || user?.full_name || '',
        occasion: 'birthday'
      }
    }));
  }, [selectedPet?.name, selectedPet?.id, user]);

  // Handle open browse drawer from Birthday Box secondary button
  const handleOpenBrowseDrawer = useCallback((boxPreview) => {
    window.dispatchEvent(new CustomEvent('openBirthdayBoxBrowse', {
      detail: {
        boxPreview,
        petName: selectedPet?.name,
        petBreed: selectedPet?.breed || '',
      }
    }));
  }, [selectedPet?.name, selectedPet?.breed]);

  // Handle talk to concierge — fires canonical flow + opens intake modal
  const [showConciergeModal, setShowConciergeModal] = useState(false);
  const [celebrateServiceType, setCelebrateServiceType] = useState('');
  const [cakeModalOpen, setCakeModalOpen] = useState(false);
  const handleTalkToConcierge = useCallback(async () => {
    // Fire tdc tracking immediately
    tdc.book({ service: 'Celebration Concierge®', pillar: 'celebrate', pet: selectedPet, channel: 'celebrate_concierge_btn' });
    // Bulletproof delivery — works on mobile + desktop regardless of network
    const { sendToAdminInbox } = await import('../utils/sendToAdminInbox');
    sendToAdminInbox({
      service: `${selectedPet?.name || 'Your pet'}'s Celebration — Talk to Concierge®`,
      pillar: 'celebrate',
      pet: selectedPet,
      channel: 'celebrate_concierge_btn',
      urgency: 'high',
    });
    // Open ConciergeIntakeModal for full booking flow
    setShowConciergeModal(true);
  }, [selectedPet]);

  const handleOpenCelebrateService = useCallback((serviceName) => {
    const serviceMap = {
      'Birthday Party Planning': 'birthday_party',
      'Professional Pet Photography': 'photography',
      'Cake Consultation': 'custom_cake',
      'Venue Booking': 'venue',
      'Gotcha Day Planning': 'gotcha_day',
    };
    const mapped = serviceMap[serviceName] || 'birthday_party';
    tdc.book({ service: serviceName || 'Celebration concierge', pillar: 'celebrate', pet: selectedPet, channel: 'celebrate_mira_picks_service' });
    setCelebrateServiceType(mapped);
    setShowConciergeModal(true);
  }, [selectedPet]);

  // Handle select guided path
  const handleSelectPath = useCallback((path) => {
    window.dispatchEvent(new CustomEvent('openCelebrationPath', {
      detail: {
        path: path.id,
        petName: selectedPet?.name
      }
    }));
  }, [selectedPet?.name]);

  // Handle category selection from strip
  const handleCategorySelect = useCallback((categoryId, categoryObj) => {
    tdc.view({
      name: categoryObj?.label || categoryId,
      pillar: "celebrate",
      pet: selectedPet,
      channel: "celebrate_category_strip",
    });
    // birthday-cakes + breed-cakes → open new DoggyBakeryCakeModal via event
    if (categoryId === 'birthday-cakes' || categoryId === 'breed-cakes') {
      window.dispatchEvent(new CustomEvent('openBirthdayBoxBrowse', { detail: {
        pet: selectedPet,
        petName: selectedPet?.name || '',
        petBreed: selectedPet?.breed || '',
      } }));
      return;
    }
    setCelebrateCatModal({ id: categoryId, obj: categoryObj });
  }, [selectedPet]);

  // Show loading state
  if (loading) {
    return (
      <PillarPageLayout pillar="celebrate" hideMiraWidget={false} hideHero={true} hideNavigation={true}>
        <LoadingState />
      </PillarPageLayout>
    );
  }

  // Mobile detection — serve mobile page on small screens
  if (!isDesktop) return <CelebrateMobilePage />;

  // If no pet, show empty state
  if (!selectedPet) {
    return (
      <PillarPageLayout pillar="celebrate" hideMiraWidget={false} hideHero={true} hideNavigation={true}>
        <NoPetState onAddPet={handleAddPet} />
      </PillarPageLayout>
    );
  }

  // Main page with pet
  return (
    <PillarPageLayout 
      pillar="celebrate" 
      hideMiraWidget={false}  // Keep Mira chat visible
      hideHero={true}         // Use our custom CelebrateHero instead of UnifiedHero
      hideNavigation={true}   // Use our custom CelebrateCategoryStrip instead
    >
      {/* 1. THE ARRIVAL - Hero (SINGLE INSTANCE) */}
      <CelebrateHero 
        pet={selectedPet} 
        soulScore={soulScore}
      />

      {/* Main content area with consistent max-width + padding for centering */}
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        {/* Soul Profile bar — pet/breed info + questions */}
        <div style={{ paddingTop: 16 }}>
          <PillarSoulProfile pet={selectedPet} token={token} pillar="celebrate" color="#E11D48" />
        </div>

        {/* 2. CATEGORY STRIP - Opens modals on click */}
        <CelebrateCategoryStrip 
          pet={selectedPet}
          onCategorySelect={handleCategorySelect}
        />

        {/* MIRA'S CELEBRATION PICKS — imagines immediately + AI scored below */}
        <CelebrateMiraPicksSection pet={selectedPet} token={token} onOpenService={handleOpenCelebrateService}/>

        {/* Soul Made is handled inside CelebrateMiraPicksSection / CelebrateContentModal */}

        {/* 3. SOUL CELEBRATION PILLARS — "How would Mojo love to celebrate?" */}
        <SoulCelebrationPillars 
          pet={selectedPet}
          onOpenSoulBuilder={handleOpenSoulBuilder}
        />

        {/* 4. MIRA'S BIRTHDAY BOX */}
        <MiraBirthdayBox 
          pet={selectedPet}
          onBuildBox={handleBuildBox}
          onBrowseProducts={(boxPreview) => handleOpenBrowseDrawer(boxPreview)}
        />

        {/* DOGGY BAKERY — Breed Cake standalone banner */}
        <div
          data-testid="breed-cake-banner"
          onClick={() => setCakeModalOpen(true)}
          style={{
            margin: '8px 0 24px',
            padding: '18px 20px',
            background: 'linear-gradient(135deg, #0F0A1E 0%, #1a0a2e 100%)',
            border: '1px solid rgba(168,85,247,0.3)',
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'box-shadow 0.2s, transform 0.15s',
            boxShadow: '0 4px 20px rgba(168,85,247,0.12)',
          }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 28px rgba(168,85,247,0.25)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(168,85,247,0.12)'; e.currentTarget.style.transform = ''; }}
        >
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#A855F7', letterSpacing: '0.12em', marginBottom: 4 }}>
              DOGGY BAKERY™ · EXCLUSIVE
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#F5F0E8', marginBottom: 3 }}>
              A cake that looks like {selectedPet?.name || 'your dog'} 🎂
            </div>
            <div style={{ fontSize: 12, color: 'rgba(245,240,232,0.5)' }}>
              Breed-specific · {selectedPet?.breed || 'Indie'} illustration on every cake · From ₹950
            </div>
          </div>
          <div style={{
            flexShrink: 0, marginLeft: 16,
            background: 'linear-gradient(135deg,#A855F7,#9333EA)',
            borderRadius: 10, padding: '8px 14px',
            fontSize: 12, fontWeight: 700, color: '#fff',
            whiteSpace: 'nowrap',
          }}>
            Order →
          </div>
        </div>

        {/* 5. CELEBRATE CONCIERGE® */}
        <CelebrateConcierge 
          pet={selectedPet}
          onTalkToConcierge={handleTalkToConcierge}
        />

        {/* 5b. CELEBRATE PERSONALLY — Section header + service cards */}
        <div style={{ marginTop: 32, marginBottom: 8 }}>
          <CelebrateServiceGrid pet={selectedPet} />
        </div>

        {/* 6. GUIDED CELEBRATION PATHS */}
        <GuidedCelebrationPaths 
          pet={selectedPet}
          onSelectPath={handleSelectPath}
        />

        {/* FIND CELEBRATE — Google Places: venues, photographers, groomers */}
        <section style={{marginBottom:32}}>
          <h2 style={{fontSize:"clamp(1.25rem,3vw,1.5rem)",fontWeight:800,color:"#1a0a2e",marginBottom:4,fontFamily:"Georgia,serif"}}>
            Find celebration help for <span style={{color:"#C44DFF"}}>{selectedPet?.name||"your dog"}</span>
          </h2>
          <p style={{fontSize:13,color:"#888",marginBottom:16}}>Pet photographers, venues, groomers and boutiques near you — curated by Mira.</p>
          <CelebrateNearMe pet={selectedPet} token={token}/>
        </section>

        {/* 7. CELEBRATION WALL */}
        <CelebrationMemoryWall 
          pet={selectedPet}
        />
      </div>

      {/* BIRTHDAY BOX BUILDER MODAL — listens to openOccasionBoxBuilder event */}
      <BirthdayBoxBuilder
        onOpenBrowseDrawer={() => handleOpenBrowseDrawer(null)}
      />

      {/* BIRTHDAY BOX BROWSE DRAWER — replaced by DoggyBakeryCakeModal (event-driven) */}
      <DoggyBakeryCakeModal />

      {/* CATEGORY STRIP MODAL — rendered here (outside Framer Motion tree) to fix fixed positioning */}
      {celebrateCatModal && (
        <CelebrateContentModal
          isOpen={true}
          onClose={() => setCelebrateCatModal(null)}
          category={celebrateCatModal.id}
          pet={selectedPet}
        />
      )}

      {/* CONCIERGE INTAKE MODAL */}
      <ConciergeIntakeModal
        isOpen={showConciergeModal}
        onClose={() => setShowConciergeModal(false)}
        serviceType={celebrateServiceType}
        petId={selectedPet?.id || selectedPet?._id}
        petName={selectedPet?.name}
        token={token}
      />

      {/* DOGGY BAKERY BREED CAKE MODAL — removed, handled by DoggyBakeryCakeModal above */}

    </PillarPageLayout>
  );
};

export default CelebratePageNew;
