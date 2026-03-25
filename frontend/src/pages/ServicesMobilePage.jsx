/**
 * ServicesMobilePage.jsx — /services (mobile)
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { usePillarContext } from '../context/PillarContext';
import { useConcierge } from '../hooks/useConcierge';
import { usePlatformTracking } from '../hooks/usePlatformTracking';
import { API_URL } from '../utils/api';
import PillarPageLayout from '../components/PillarPageLayout';
import PillarSoulProfile from '../components/PillarSoulProfile';
import PersonalisedBreedSection from '../components/common/PersonalisedBreedSection';
import SharedProductCard, { ProductDetailModal } from '../components/ProductCard';

const SV={navy:'#0F1A3D',navyL:'#2E4DA6',navyXL:'#5B7FD4',cream:'#F0F2FF',border:'#C5CFF0',dark:'#060D1E',taupe:'#4A557A'};
const CSS_SV=`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');.svc{font-family:'DM Sans',-apple-system,sans-serif;background:${SV.cream};color:${SV.dark};min-height:100vh;padding-bottom:calc(96px + env(safe-area-inset-bottom))}.svc-cta{display:flex;align-items:center;justify-content:center;width:100%;min-height:48px;padding:13px 20px;border-radius:14px;border:none;background:linear-gradient(135deg,${SV.navy},${SV.navyL});color:#fff;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;transition:transform 0.15s}.svc-cta:active{transform:scale(0.97)}`;
function vibe(t='light'){if(navigator?.vibrate)navigator.vibrate(t==='medium'?[12]:[6]);}

export default function ServicesMobilePage() {
  const{token}=useAuth();const navigate=useNavigate();
  const{currentPet,setCurrentPet,pets:contextPets}=usePillarContext();
  usePlatformTracking({pillar:'services',pet:currentPet});
  const{request}=useConcierge({pet:currentPet,pillar:'services'});
  const{addToCart}=useCart();
  const[loading,setLoading]=useState(true);
  const[selectedProduct,setSelectedProduct]=useState(null);
  const[products,setProducts]=useState([]);
  useEffect(()=>{if(contextPets!==undefined)setLoading(false);if(contextPets?.length>0&&!currentPet)setCurrentPet(contextPets[0]);},[contextPets,currentPet,setCurrentPet]);
  useEffect(()=>{
    if(!currentPet?.id)return;
    fetch(`${API_URL}/api/admin/pillar-products?pillar=services&limit=200`,{headers:token?{Authorization:`Bearer ${token}`}:{}})
      .then(r=>r.ok?r.json():null).then(d=>{if(d?.products)setProducts(d.products);}).catch(()=>{});
  },[currentPet?.id,token]);
  const handleAddToCart=useCallback(p=>{addToCart({id:p.id||p._id,name:p.name,price:p.price||0,image:p.image_url||p.images?.[0],pillar:'services',quantity:1});},[addToCart]);
  if(loading)return<PillarPageLayout pillar="services" hideHero hideNavigation><div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{textAlign:'center'}}><div style={{fontSize:36,marginBottom:12}}>🤝</div><div>Loading services…</div></div></div></PillarPageLayout>;
  if(!currentPet)return<PillarPageLayout pillar="services" hideHero hideNavigation><style>{CSS_SV}</style><div className="svc"><div style={{padding:'24px 16px',textAlign:'center'}}><div style={{background:'#fff',border:`1px solid ${SV.border}`,borderRadius:22,padding:'32px 20px'}}><div style={{fontSize:44,marginBottom:14}}>🤝</div><div style={{fontSize:22,fontWeight:700,marginBottom:8}}>Add your pet to unlock Services</div><button className="svc-cta" style={{marginTop:16}} onClick={()=>navigate('/join')}>Add your pet →</button></div></div></div></PillarPageLayout>;
  const petName=currentPet.name;
  return(
    <PillarPageLayout pillar="services" hideHero hideNavigation>
      <div className="svc" data-testid="services-mobile"><style>{CSS_SV}</style>
        {selectedProduct&&<ProductDetailModal product={selectedProduct?.raw||selectedProduct} isOpen={!!selectedProduct} onClose={()=>setSelectedProduct(null)} petName={petName} pillarColor={SV.navyL}/>}
        <div style={{background:`linear-gradient(160deg,${SV.dark} 0%,${SV.navy} 50%,${SV.navyL} 100%)`,padding:'20px 16px 24px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
            <div><div style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.5)',letterSpacing:'0.1em',marginBottom:2}}>THE DOGGY COMPANY</div><div style={{fontSize:22,fontWeight:700,color:'#fff'}}>🤝 Services</div></div>
            {contextPets?.length>1&&(<select value={currentPet?.id} onChange={e=>{vibe();setCurrentPet(contextPets.find(p=>p.id===e.target.value));}} style={{background:'rgba(255,255,255,0.12)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:999,padding:'7px 14px',color:'#fff',fontSize:13}}>{contextPets.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>)}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:52,height:52,borderRadius:'50%',flexShrink:0,background:'rgba(255,255,255,0.15)',border:'2px solid rgba(255,255,255,0.3)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>{currentPet?.photo_url?<img src={currentPet.photo_url} alt={petName} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<span style={{fontSize:22}}>🐾</span>}</div>
            <div><div style={{fontSize:20,fontWeight:700,color:'#fff'}}>Expert Services</div><div style={{fontSize:15,color:'rgba(255,255,255,0.7)'}}>for {petName} · All via Concierge®</div></div>
          </div>
        </div>
        <div style={{padding:'0 16px 8px'}}><PillarSoulProfile pet={currentPet} pillar="services" token={token}/></div>
        <div style={{padding:'0 16px 16px'}}><div style={{fontSize:26,fontWeight:700,marginBottom:6}}>Services for {petName}</div><div style={{fontSize:15,color:SV.taupe}}>1,025 services. All arranged by Concierge®. Price on WhatsApp.</div></div>
        <div style={{margin:'0 16px 20px',background:SV.dark,borderRadius:20,padding:16}}>
          <div style={{fontSize:11,fontWeight:700,color:'rgba(91,127,212,0.9)',letterSpacing:'0.1em',marginBottom:8}}>✦ MIRA ON {petName.toUpperCase()}'S SERVICES</div>
          <div style={{fontSize:14,color:'rgba(255,255,255,0.75)',lineHeight:1.6,marginBottom:14,fontStyle:'italic'}}>"I know {petName}'s breed and health history. Every service here is matched to what they actually need."</div>
          <button className="svc-cta">See Mira's Service Picks →</button>
        </div>
        <div style={{padding:'0 16px 24px'}}><PersonalisedBreedSection pet={currentPet} pillar="services" token={token}/></div>

        {products.length>0&&(<div style={{padding:'0 16px 24px'}}><div style={{fontSize:18,fontWeight:700,marginBottom:12}}>Service Products for {petName}</div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>{products.slice(0,20).map(p=><SharedProductCard key={p.id||p._id||p.name} product={p} pillar="services" selectedPet={currentPet} onAddToCart={()=>handleAddToCart(p)} onClick={()=>{vibe();setSelectedProduct(p);}} />)}</div></div>)}

        <div style={{margin:'0 16px 24px',background:SV.dark,borderRadius:24,padding:20}}>
          <div style={{display:'inline-flex',background:'rgba(91,127,212,0.2)',border:'1px solid rgba(91,127,212,0.4)',borderRadius:999,padding:'5px 14px',color:SV.navyXL,fontSize:12,fontWeight:600,marginBottom:12}}>🤝 Concierge®</div>
          <div style={{fontSize:22,fontWeight:700,color:'#fff',lineHeight:1.2,marginBottom:10,fontFamily:'Georgia,serif'}}>Every service is arranged by your Concierge.</div>
          <div style={{fontSize:14,color:'rgba(255,255,255,0.6)',lineHeight:1.7,marginBottom:16}}>Vets, groomers, trainers, nutritionists. One message and it&apos;s done.</div>
          <button onClick={()=>{vibe('medium');request(`Services for ${petName}`,{channel:'services_cta'});}} style={{width:'100%',minHeight:48,borderRadius:14,border:'none',background:`linear-gradient(135deg,${SV.navyL},${SV.navyXL})`,color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer'}}>🤝 Book via Concierge® →</button>
        </div>
      </div>
    </PillarPageLayout>
  );
}
