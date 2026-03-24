/**
 * PlayConciergeSection.jsx — "Play, Personally"
 * Horizontal watercolour service cards — mirrors CareConciergeSection
 * GET /api/service-box/services?pillar=play
 */
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "../../utils/api";
import PlayConciergeModal from "./PlayConciergeModal";
import { tdc } from "../../utils/tdc_intent";

const G = { deep:"#7B2D00", mid:"#7B3F00", orange:"#E76F51", light:"#FFAD9B", pale:"#FFF0EA", cream:"#FFF8F5", darkText:"#7B2D00", mutedText:"#8B4513" };
const MIRA_ORB = "linear-gradient(135deg,#9B59B6,#E91E8C,#FF6EC7)";

const FALLBACK_SERVICES = [
  { name:"Dog Park Outing",      icon:"🌳", desc:"Private park session with a Mira-matched play companion.",    price:599  },
  { name:"Playdate Facilitation",icon:"🐾", desc:"Mira finds a matched play partner and arranges the date.",   price:799  },
  { name:"Adventure Walk",       icon:"🦮", desc:"Guided trail walk through parks and open green spaces.",      price:499  },
  { name:"Pool Swim Session",    icon:"🏊", desc:"Private pool session with a trained swim guide.",             price:999  },
  { name:"Agility Starter",      icon:"⚡", desc:"Intro agility — tunnels, jumps, and weave poles.",           price:899  },
  { name:"Fitness Assessment",   icon:"💪", desc:"Certified trainer assesses strength & energy profile.",      price:1299 },
  { name:"Trail Hike",           icon:"🏔️", desc:"Guided nature trail hike for dogs that love to explore.",    price:699  },
  { name:"Soul Play Session",    icon:"✨", desc:"Professional photo session capturing your dog's personality.", price:2499 },
];

export default function PlayConciergeSection({ pet, prefetchedServices }) {
  const [services, setServices] = useState(prefetchedServices || []);
  const [loading,  setLoading]  = useState(!prefetchedServices?.length);
  const [modalSvc, setModalSvc] = useState(null);
  const { token } = useAuth();
  const petName = pet?.name || "your dog";

  useEffect(() => {
    if (prefetchedServices?.length) { setServices(prefetchedServices); setLoading(false); return; }
    fetch(`${API_URL}/api/service-box/services?pillar=play`, {
      headers: token ? { Authorization:`Bearer ${token}` } : {},
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.services?.length) setServices(data.services.slice(0,8));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [prefetchedServices, token]);

  const displayServices = services.length > 0 ? services : FALLBACK_SERVICES;

  return (
    <>
      {modalSvc && (
        <PlayConciergeModal pet={pet} service={modalSvc} token={token} onClose={() => setModalSvc(null)} />
      )}

      <div style={{ marginBottom:40 }} data-testid="play-personally-section">
        {/* Header — matches Care/Dine "Play, Personally" style */}
        <div style={{ marginBottom:24 }}>
          <h2 style={{ fontSize:"clamp(1.3rem,5vw,2rem)", fontWeight:800, color:G.darkText, fontFamily:"Georgia,serif", marginBottom:6, lineHeight:1.2 }}>
            Play, Personally
          </h2>
          <p style={{ fontSize:14, color:G.mutedText, lineHeight:1.6 }}>
            Parks, playdates, agility, and swim sessions for <span style={{ color:G.orange, fontWeight:600 }}>{petName}</span> — all arranged by Mira.
          </p>
        </div>

        {/* Horizontal service cards */}
        <div style={{ overflowX:"auto", WebkitOverflowScrolling:"touch", marginLeft:-4, paddingLeft:4, marginRight:-4, paddingRight:4 }} className="play-svc-scroll">
          <style>{`.play-svc-scroll::-webkit-scrollbar{height:3px}.play-svc-scroll::-webkit-scrollbar-thumb{background:rgba(231,111,81,0.3);border-radius:3px}`}</style>
          <div style={{ display:"flex", gap:16, paddingBottom:8 }}>
            {displayServices.map((svc, i) => {
              const imgUrl = svc.cloudinary_image_url || svc.watercolor_image || svc.image_url;
              return (
                <div
                  key={svc.id || svc._id || i}
                  onClick={() => { tdc.view({ name: svc.name, pillar: "play", pet, channel: "play_concierge_service_view" }); setModalSvc(svc); }}
                  data-testid={`play-service-card-${i}`}
                  style={{ flexShrink:0, width:220, background:"#fff", borderRadius:18, overflow:"hidden", cursor:"pointer", border:"1px solid rgba(231,111,81,0.14)", transition:"transform 0.18s, box-shadow 0.18s", boxShadow:"0 2px 12px rgba(123,45,0,0.07)" }}
                  onMouseEnter={e => { e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.boxShadow="0 8px 24px rgba(123,45,0,0.14)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="0 2px 12px rgba(123,45,0,0.07)"; }}
                >
                  {/* Image / fallback */}
                  <div style={{ height:160, position:"relative", overflow:"hidden", flexShrink:0 }}>
                    {imgUrl
                      ? <img src={imgUrl} alt={svc.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>{e.target.style.display="none"; e.target.nextSibling.style.display="flex";}} />
                      : null}
                    <div style={{ display: imgUrl ? "none" : "flex", position: imgUrl ? "absolute" : "static", inset:0, background:`linear-gradient(135deg,${G.pale},${G.light})`, alignItems:"center", justifyContent:"center", fontSize:44, height: imgUrl ? "100%" : 160 }}>
                      {svc.icon || "🌳"}
                    </div>
                    {/* Price chip */}
                    {svc.price && Number(svc.price) > 0 && (
                      <div style={{ position:"absolute", bottom:8, right:8, background:"rgba(123,45,0,0.85)", color:"#fff", borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:700 }}>
                        From ₹{svc.price?.toLocaleString?.() ?? svc.price}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ padding:"14px 14px 16px" }}>
                    <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:5, lineHeight:1.3 }}>{svc.name}</div>
                    {(svc.description || svc.desc) && (
                      <div style={{ fontSize:13, color:G.mutedText, lineHeight:1.5, marginBottom:10, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
                        {svc.description || svc.desc}
                      </div>
                    )}
                    {svc.duration_minutes > 0 && (
                      <div style={{ fontSize:13, color:"#888", marginBottom:8 }}>⏱ {svc.duration_minutes} min session</div>
                    )}
                    <button style={{ width:"100%", padding:"8px 0", borderRadius:10, background:G.orange, border:"none", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                      Book for {pet?.name || "your dog"} →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
