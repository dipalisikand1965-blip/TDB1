/**
 * ProductModal.jsx — Shared modal for ALL product, service and venue cards
 * The Doggy Company
 *
 * Usage:
 *   import ProductModal from "../components/common/ProductModal";
 *   const [selectedItem, setSelectedItem] = useState(null);
 *   <div onClick={() => setSelectedItem(product)}>...</div>
 *   {selectedItem && <ProductModal item={selectedItem} pet={pet} pillar="care" colour={G.sage} onClose={()=>setSelectedItem(null)} onBook={handleBook}/>}
 *
 * Slides up from bottom — mobile first, desktop centered.
 */
import { useState } from "react";
import { API_URL } from "../../utils/api";
import { tdc } from "../../utils/tdc_intent";

export default function ProductModal({ item, pet, pillar, onClose, onBook, colour = "#9B59B6" }) {
  const [booked,  setBooked]  = useState(false);
  const [booking, setBooking] = useState(false);

  if (!item) return null;

  const isService = item.type === "service" || item.entity_type === "service" || item.bookable;
  const isFree    = item.price === 0 || item.price === "Free" || item.price === "₹0";
  const isQuote   = item.display_only || item.price === "Request a Quote";
  const miraBadge = (item.mira_score >= 60) || item.mira || item.isImagined;
  const petName   = pet?.name || "your dog";
  const img       = item.image_url || item.imageUrl || item.photo_url || item.mockup_url || item.cloudinary_url || null;

  const handleBook = async () => {
    if (booking || booked) return;
    setBooking(true);
    // Fire tdc tracking immediately — before async ops
    tdc.book({
      service: item.name,
      product_id: item._id || item.id,
      pillar: pillar || "platform",
      pet,
      channel: `${pillar || "platform"}_product_modal`,
      amount: item.price,
    });
    try {
      if (onBook) {
        await onBook(item);
      } else {
        // Direct concierge ticket
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        await fetch(`${API_URL}/api/service_desk/attach_or_create_ticket`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            parent_id:     user?.id || user?.email || "guest",
            pet_id:        pet?.id || "unknown",
            pillar,
            intent_primary: isService ? "service_booking" : "product_order",
            channel:        `${pillar}_product_modal`,
            life_state:     pillar,
            initial_message: {
              sender: "parent",
              text: `I'd like to ${isService ? "book" : "order"} "${item.name}" for ${petName}.${item.price && !isFree ? ` Price: ₹${item.price}.` : ""}`,
            },
          }),
        });
      }
      setBooked(true);
    } catch { setBooked(true); }
    finally { setBooking(false); }
  };

  const priceDisplay = isFree ? "Free" : isQuote ? "Request a Quote" : item.price ? `₹${String(item.price).replace("₹","")}` : null;

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:10010, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"#fff", borderRadius:"20px 20px 0 0", width:"100%", maxWidth:540, maxHeight:"90vh", overflowY:"auto", animation:"slideUp 0.25s ease" }}>
        <style>{`@keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>

        {/* Image */}
        <div style={{ height:220, background:item.bg||`${colour}18`, position:"relative", overflow:"hidden", borderRadius:"20px 20px 0 0", display:"flex", alignItems:"center", justifyContent:"center" }}>
          {img
            ? <img src={img} alt={item.name||""} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none";}}/>
            : <span style={{fontSize:56}}>{item.icon||item.emoji||"✦"}</span>}
          <button onClick={onClose} style={{position:"absolute",top:12,right:12,width:32,height:32,borderRadius:"50%",background:"rgba(0,0,0,0.45)",border:"none",color:"#fff",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
          {miraBadge && <div style={{position:"absolute",top:12,left:12,background:"linear-gradient(135deg,#9B59B6,#E91E8C)",borderRadius:20,padding:"3px 10px",fontSize:10,fontWeight:700,color:"#fff"}}>✦ Mira's pick</div>}
          {item.mira_score>0 && <div style={{position:"absolute",bottom:12,right:12,background:`${colour}EE`,borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:800,color:"#fff"}}>{item.mira_score}</div>}
        </div>

        {/* Body */}
        <div style={{padding:"20px 20px 32px"}}>
          {/* Badges */}
          <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
            {item.pillar&&<span style={{background:`${colour}18`,color:colour,borderRadius:20,padding:"3px 10px",fontSize:10,fontWeight:700}}>{item.pillar}</span>}
            {item.category&&<span style={{background:"#F1F5F9",color:"#64748B",borderRadius:20,padding:"3px 10px",fontSize:10,fontWeight:600}}>{String(item.category).replace(/_/g," ")}</span>}
            {isService&&<span style={{background:"#E0F2FE",color:"#0369A1",borderRadius:20,padding:"3px 10px",fontSize:10,fontWeight:700}}>Service</span>}
          </div>

          {/* Name + price */}
          <h2 style={{fontSize:20,fontWeight:800,color:"#1A1A2E",fontFamily:"Georgia,serif",margin:"0 0 8px",lineHeight:1.3}}>{item.name}</h2>
          {priceDisplay && <div style={{fontSize:22,fontWeight:800,color:colour,marginBottom:4}}>{priceDisplay}</div>}

          {/* Mira's reason */}
          {(item.mira_reason||item.reason||item.description) && (
            <div style={{background:`${colour}0F`,border:`1px solid ${colour}25`,borderRadius:10,padding:"12px 14px",margin:"16px 0"}}>
              <div style={{fontSize:10,fontWeight:700,color:colour,letterSpacing:"0.08em",marginBottom:6}}>✦ WHY MIRA CHOSE THIS FOR {petName.toUpperCase()}</div>
              <div style={{fontSize:13,color:"#1A1A2E",lineHeight:1.6,fontStyle:"italic"}}>"{item.mira_reason||item.reason||item.description}"</div>
              {item.mira_score>0&&<div style={{fontSize:11,color:colour,fontWeight:600,marginTop:6}}>Mira confidence: {item.mira_score}%</div>}
            </div>
          )}

          {/* Full description (if different from mira_reason) */}
          {item.description && item.description !== item.mira_reason && item.description !== item.reason && (
            <>
              <div style={{height:1,background:"rgba(0,0,0,0.06)",margin:"16px 0"}}/>
              <div style={{fontSize:13,color:"#475569",lineHeight:1.7}}>{item.description}</div>
            </>
          )}

          {/* Score bar */}
          {item.mira_score>0&&(
            <div style={{marginTop:16}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,fontWeight:600,marginBottom:6}}>
                <span style={{color:"#64748B"}}>Mira match</span>
                <span style={{color:colour}}>{item.mira_score}%</span>
              </div>
              <div style={{height:4,borderRadius:999,background:"rgba(0,0,0,0.08)",overflow:"hidden"}}>
                <div style={{height:"100%",borderRadius:999,width:`${item.mira_score}%`,background:`linear-gradient(90deg,${colour},#E91E8C)`}}/>
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{height:1,background:"rgba(0,0,0,0.06)",margin:"20px 0 16px"}}/>
          <div style={{display:"flex",gap:10}}>
            <button onClick={handleBook} disabled={booked||booking}
              style={{flex:1,padding:"14px",borderRadius:12,border:"none",background:booked?"#E8F5E9":`linear-gradient(135deg,${colour},#E91E8C)`,color:booked?"#16A34A":"#fff",fontSize:14,fontWeight:700,cursor:booked?"default":"pointer",opacity:booking?0.7:1}}>
              {booked?"✓ Concierge® is on it":booking?"Sending…":isService?"Book via Concierge® →":isQuote?"Request a Quote →":"Order via Concierge® →"}
            </button>
            <button title="Save to Pet Vault" style={{padding:"14px 16px",borderRadius:12,border:`1px solid ${colour}30`,background:"#fff",color:colour,fontSize:13,fontWeight:600,cursor:"pointer"}}>🔖</button>
          </div>
        </div>
      </div>
    </div>
  );
}
