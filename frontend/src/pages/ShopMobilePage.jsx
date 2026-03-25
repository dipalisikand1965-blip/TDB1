/**
 * ShopMobilePage.jsx — /shop (mobile)
 * Colour: Gold #4A2800 → #C9973A
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
import { useCart } from '../context/CartContext';
import PersonalisedBreedSection from '../components/common/PersonalisedBreedSection';

const S={gold:'#4A2800',goldL:'#C9973A',goldXL:'#E8B84B',cream:'#FFFBF5',border:'#F5E6C8',dark:'#1A0E00',taupe:'#7A6A4A'};
const CSS=`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');.shop{font-family:'DM Sans',-apple-system,sans-serif;background:${S.cream};color:${S.dark};min-height:100vh;padding-bottom:calc(96px + env(safe-area-inset-bottom))}.shop-cta{display:flex;align-items:center;justify-content:center;width:100%;min-height:48px;padding:13px 20px;border-radius:14px;border:none;background:linear-gradient(135deg,${S.gold},${S.goldL});color:#fff;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;transition:transform 0.15s}.shop-cta:active{transform:scale(0.97)}.no-sb{overflow-x:auto;scrollbar-width:none;-ms-overflow-style:none}.no-sb::-webkit-scrollbar{display:none}`;
function vibe(t='light'){if(navigator?.vibrate)navigator.vibrate(t==='success'?[8,40,10]:t==='medium'?[12]:[6]);}

export default function ShopMobilePage() {
  const{token}=useAuth();const navigate=useNavigate();
  const{currentPet,setCurrentPet,pets:contextPets}=usePillarContext();
  usePlatformTracking({pillar:'shop',pet:currentPet});
  const{request}=useConcierge({pet:currentPet,pillar:'shop'});
  const{addToCart}=useCart();
  const[loading,setLoading]=useState(true);
  const[soulMadeOpen,setSoulMadeOpen]=useState(false);
  const[selectedProduct,setSelectedProduct]=useState(null);
  const[products,setProducts]=useState([]);

  useEffect(()=>{if(contextPets!==undefined)setLoading(false);if(contextPets?.length>0&&!currentPet)setCurrentPet(contextPets[0]);},[contextPets,currentPet,setCurrentPet]);

  useEffect(()=>{
    if(!currentPet?.id)return;
    fetch(`${API_URL}/api/admin/pillar-products?pillar=shop&limit=200`,{headers:token?{Authorization:`Bearer ${token}`}:{}})
      .then(r=>r.ok?r.json():null).then(d=>{if(d?.products)setProducts(d.products);}).catch(()=>{});
  },[currentPet?.id,token]);

  const handleAddToCart=useCallback(p=>{
    addToCart({id:p.id||p._id,name:p.name,price:p.price||0,image:p.image_url||p.images?.[0],pillar:'shop',quantity:1});
  },[addToCart]);

  if(loading)return<PillarPageLayout pillar="shop" hideHero hideNavigation><div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{textAlign:'center'}}><div style={{fontSize:36,marginBottom:12}}>🛍️</div><div>Loading your shop…</div></div></div></PillarPageLayout>;
  if(!currentPet)return<PillarPageLayout pillar="shop" hideHero hideNavigation><style>{CSS}</style><div className="shop"><div style={{padding:'24px 16px',textAlign:'center'}}><div style={{background:'#fff',border:`1px solid ${S.border}`,borderRadius:22,padding:'32px 20px'}}><div style={{fontSize:44,marginBottom:14}}>🛍️</div><div style={{fontSize:22,fontWeight:700,marginBottom:8}}>Add your pet to unlock Shop</div><button className="shop-cta" style={{marginTop:16}} onClick={()=>navigate('/join')}>Add your pet →</button></div></div></div></PillarPageLayout>;

  const petName=currentPet.name;
  return(
    <PillarPageLayout pillar="shop" hideHero hideNavigation>
      <div className="shop" data-testid="shop-mobile">
        <style>{CSS}</style>
        {soulMadeOpen&&<SoulMadeModal pet={currentPet} pillar="shop" pillarColor={S.goldL} pillarLabel="Shop" onClose={()=>setSoulMadeOpen(false)}/>}
        {selectedProduct&&<ProductDetailModal product={selectedProduct?.raw||selectedProduct} isOpen={!!selectedProduct} onClose={()=>setSelectedProduct(null)} petName={petName} pillarColor={S.goldL}/>}

        <div style={{background:`linear-gradient(160deg,${S.dark} 0%,${S.gold} 50%,${S.goldL} 100%)`,padding:'20px 16px 24px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
            <div><div style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.5)',letterSpacing:'0.1em',marginBottom:2}}>THE DOGGY COMPANY</div><div style={{fontSize:22,fontWeight:700,color:'#fff'}}>🛍️ Shop</div></div>
            {contextPets?.length>1&&(<select value={currentPet?.id} onChange={e=>{vibe();setCurrentPet(contextPets.find(p=>p.id===e.target.value));}} style={{background:'rgba(255,255,255,0.12)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:999,padding:'7px 14px',color:'#fff',fontSize:13}}>{contextPets.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>)}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:52,height:52,borderRadius:'50%',flexShrink:0,background:'rgba(255,255,255,0.15)',border:'2px solid rgba(255,255,255,0.3)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>{currentPet?.photo_url?<img src={currentPet.photo_url} alt={petName} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<span style={{fontSize:22}}>🐾</span>}</div>
            <div><div style={{fontSize:20,fontWeight:700,color:'#fff'}}>Shop for {petName}</div><div style={{fontSize:15,color:'rgba(255,255,255,0.7)'}}>5,358 breed-matched products</div></div>
          </div>
        </div>

        <div style={{padding:'0 16px 8px'}}><PillarSoulProfile pet={currentPet} pillar="shop" token={token}/></div>
        <div style={{padding:'0 16px 16px'}}><div style={{fontSize:26,fontWeight:700,marginBottom:6}}>Made for {petName}&apos;s breed</div><div style={{fontSize:15,color:S.taupe}}>Every product filtered and matched to who they are.</div></div>
        <div style={{margin:'0 16px 20px',background:S.dark,borderRadius:20,padding:16}}>
          <div style={{fontSize:11,fontWeight:700,color:`rgba(232,184,75,0.9)`,letterSpacing:'0.1em',marginBottom:8}}>✦ MIRA ON {petName.toUpperCase()}'S SHOP</div>
          <div style={{fontSize:14,color:'rgba(255,255,255,0.75)',lineHeight:1.6,marginBottom:14,fontStyle:'italic'}}>"Everything here is filtered for {petName}'s breed and allergen profile. The best picks are first."</div>
          <button className="shop-cta">See Mira's Shop Picks →</button>
        </div>
        <div style={{padding:'0 16px 24px'}}><MiraImaginesBreed pet={currentPet} pillar="shop" token={token}/></div>

        {products.length > 0 && (
          <div style={{padding:'0 16px 24px'}}>
            <div style={{fontSize:18,fontWeight:700,marginBottom:12}}>Shop Products for {petName}</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              {products.slice(0,20).map(p=><SharedProductCard key={p.id||p._id||p.name} product={p} pillar="shop" selectedPet={currentPet} onAddToCart={()=>handleAddToCart(p)} onClick={()=>{vibe();setSelectedProduct(p);}} />)}
            </div>
          </div>
        )}

        <div style={{padding:'0 16px 24px'}}><PersonalisedBreedSection pet={currentPet} pillar="shop" token={token}/></div>
        <div style={{margin:'0 16px 24px',background:S.dark,borderRadius:20,padding:18,cursor:'pointer'}} onClick={()=>setSoulMadeOpen(true)}>
          <div style={{fontSize:10,letterSpacing:'0.14em',color:S.goldXL,fontWeight:700,marginBottom:8}}>✦ SOUL MADE™ · MADE ONLY FOR {petName.toUpperCase()}</div>
          <div style={{fontSize:20,fontWeight:700,color:'#fff',marginBottom:8}}>{petName}&apos;s face. On bandanas, tote bags, ID tags and more.</div>
          <button className="shop-cta">Make something only {petName} has →</button>
        </div>
        <div style={{margin:'0 16px 24px',background:S.dark,borderRadius:24,padding:20}}>
          <div style={{display:'inline-flex',background:'rgba(232,184,75,0.2)',border:'1px solid rgba(232,184,75,0.4)',borderRadius:999,padding:'5px 14px',color:S.goldXL,fontSize:12,fontWeight:600,marginBottom:12}}>🛍️ Shop Concierge®</div>
          <div style={{fontSize:22,fontWeight:700,color:'#fff',lineHeight:1.2,marginBottom:10,fontFamily:'Georgia,serif'}}>Can&apos;t find what you need for {petName}?</div>
          <div style={{fontSize:14,color:'rgba(255,255,255,0.6)',lineHeight:1.7,marginBottom:16}}>Tell us what you&apos;re looking for. Concierge® will source it.</div>
          <button onClick={()=>{vibe('medium');request(`Shop concierge for ${petName}`,{channel:'shop_cta'});}} style={{width:'100%',minHeight:48,borderRadius:14,border:'none',background:`linear-gradient(135deg,${S.goldL},${S.goldXL})`,color:S.dark,fontSize:15,fontWeight:700,cursor:'pointer'}}>🛍️ Ask Concierge® →</button>
        </div>
      </div>
    </PillarPageLayout>
  );
}
