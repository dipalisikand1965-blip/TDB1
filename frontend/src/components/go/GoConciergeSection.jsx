/**
 * GoConciergeSection.jsx — /go pillar live services section
 * "Go, Personally" — mirrors CareConciergeSection.jsx exactly
 * Split into 2 sections: Travel Services + Stay & Board Services
 * WIRING: GET /api/service-box/services?pillar=go
 */

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "../../utils/api";
import GoConciergeModal from "./GoConciergeModal";

const G = { deep:"#0D3349", deepMid:"#1A5276", teal:"#1ABC9C", light:"#76D7C4", pale:"#D1F2EB", gold:"#C9973A", mutedText:"#5D6D7E", darkText:"#0D3349", border:"rgba(26,188,156,0.18)" };

function ServiceCard({ svc, petName, onClick }) {
  const accentColor = svc.accent_colour || G.deepMid;
  return (
    <div
      onClick={onClick}
      data-testid={`go-service-card-${svc.id}`}
      style={{ background:"#fff", borderRadius:14, overflow:"hidden", border:`1px solid ${G.border}`, cursor:"pointer", boxShadow:"0 2px 8px rgba(13,51,73,0.06)" }}>
      {/* Image — compact for 2-col mobile */}
      {(svc.cloudinary_image_url || svc.watercolor_image || svc.image_url) ? (
        <img src={svc.cloudinary_image_url || svc.watercolor_image || svc.image_url} alt={svc.name}
          style={{ width:"100%", height:120, objectFit:"cover", display:"block" }}
          onError={e => { e.target.style.display="none"; }} />
      ) : (
        <div style={{ height:120, background:`linear-gradient(135deg,${accentColor}22,${accentColor}44)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:40 }}>
          {svc.icon || "✈️"}
        </div>
      )}
      <div style={{ padding:"10px 12px 14px" }}>
        <span style={{ fontSize:9, fontWeight:700, background:`${accentColor}18`, color:accentColor, borderRadius:20, padding:"2px 7px", textTransform:"uppercase", display:"inline-block", marginBottom:5 }}>
          {svc.category === "stay" ? "Stay & Board" : "Travel"}
        </span>
        <div style={{ fontSize:13, fontWeight:700, color:G.darkText, marginBottom:4, lineHeight:1.3 }}>{svc.name}</div>
        {svc.tagline && (
          <div style={{ fontSize:11, color:G.mutedText, lineHeight:1.4, marginBottom:8, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
            {svc.tagline}
          </div>
        )}
        <button style={{ fontSize:11, fontWeight:700, color:accentColor, background:"none", border:"none", padding:0, cursor:"pointer" }} onClick={onClick}>
          Book {petName}'s {svc.name} →
        </button>
      </div>
    </div>
  );
}

// Section block — 2×2 grid initially, quiet Load more
function SectionBlock({ title, subtitle, icon, services: svcs, petName, accentGradient, onSelect }) {
  const [visible, setVisible] = useState(4);
  const shown = svcs.slice(0, visible);
  const hasMore = visible < svcs.length;

  return (
    <div style={{ marginBottom:32 }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:16, paddingBottom:14, borderBottom:`2px solid ${G.pale}` }}>
        <div style={{ width:40, height:40, borderRadius:10, background:accentGradient, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{icon}</div>
        <div>
          <div style={{ fontSize:15, fontWeight:800, color:G.darkText, lineHeight:1.2 }}>{title}</div>
          <div style={{ fontSize:12, color:G.mutedText, marginTop:3, lineHeight:1.4 }}>{subtitle}</div>
        </div>
      </div>

      {/* 2-col grid — always 2 columns on all screens */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        {shown.map((svc, i) => (
          <ServiceCard key={svc.id || i} svc={svc} petName={petName} onClick={() => onSelect(svc)} />
        ))}
      </div>

      {/* Quiet Load more */}
      {hasMore && (
        <button
          onClick={() => setVisible(v => v + 4)}
          style={{ display:"block", margin:"14px auto 0", background:"none", border:`1px solid ${G.border}`, borderRadius:20, padding:"7px 20px", fontSize:12, fontWeight:600, color:G.mutedText, cursor:"pointer" }}>
          + {Math.min(4, svcs.length - visible)} more services
        </button>
      )}
    </div>
  );
}

export default function GoConciergeSection({ pet }) {
  const [services, setServices] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modalSvc, setModalSvc] = useState(null);
  const { token } = useAuth();
  const petName = pet?.name || "your dog";

  useEffect(() => {
    fetch(`${API_URL}/api/service-box/services?pillar=go&limit=20`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.services?.length) setServices(data.services); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div style={{ textAlign:"center", padding:"40px 0", color:"#888" }}>
      <div style={{ width:20, height:20, border:`2px solid ${G.pale}`, borderTopColor:G.teal, borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 10px" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      Loading Go services…
    </div>
  );

  if (!services.length) return null;

  // Services may have pillar='go' without specific category/sub_pillar tags
  // Fallback: show all go services if category-specific filters return empty
  const travelServices = services.filter(s => s.category === "travel" || s.sub_pillar === "travel" || (s.pillar === "go" && !s.category?.includes("stay")));
  const stayServices = services.filter(s => s.category === "stay" || s.sub_pillar === "stay" || s.pillar_name === "Stay");
  
  // If both empty, show first 10 services as generic go services
  const allGoServices = (travelServices.length === 0 && stayServices.length === 0)
    ? services.slice(0, 10)
    : null;

  return (
    <>
      {modalSvc && <GoConciergeModal pet={pet} service={modalSvc} token={token} onClose={() => setModalSvc(null)} />}

      <div style={{ marginBottom:32 }}>
        {/* Section heading */}
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <h2 style={{ fontSize:"clamp(1.3rem,4vw,2rem)", fontWeight:800, color:G.darkText, fontFamily:"Georgia,serif", marginBottom:6 }}>
            Go, Personally
          </h2>
          <p style={{ fontSize:13, color:G.mutedText, maxWidth:540, margin:"0 auto", lineHeight:1.6 }}>
            Tell us what you want {petName}'s journey to feel like. We'll handle everything else.
          </p>
        </div>

        {travelServices.length > 0 && (
          <SectionBlock
            title="Go, Personally — Travel"
            subtitle={`Flight, road trips, pet taxi, relocation, and complete trip planning for ${petName}.`}
            icon="✈️"
            services={travelServices}
            petName={petName}
            accentGradient={`linear-gradient(135deg,#E3F2FD,#BBDEFB)`}
            onSelect={setModalSvc}
          />
        )}

        {stayServices.length > 0 && (
          <SectionBlock
            title="Go, Personally — Stay & Board"
            subtitle={`Boarding, daycare, and pet sitting arranged around ${petName}'s personality.`}
            icon="🏡"
            services={stayServices}
            petName={petName}
            accentGradient={`linear-gradient(135deg,${G.pale},${G.light})`}
            onSelect={setModalSvc}
          />
        )}

        {/* Fallback: show all go services if no category tags found */}
        {allGoServices && allGoServices.length > 0 && (
          <SectionBlock
            title="Go Services for Your Pet"
            subtitle={`All travel, boarding, and go-related services available for ${petName}.`}
            icon="✈️"
            services={allGoServices}
            petName={petName}
            accentGradient={`linear-gradient(135deg,${G.pale},${G.light})`}
            onSelect={setModalSvc}
          />
        )}

        {/* Bottom CTA */}
        <div style={{ textAlign:"center", marginTop:16 }}>
          <button
            style={{ background:`linear-gradient(135deg,${G.teal},${G.deepMid})`, color:"#fff", border:"none", borderRadius:12, padding:"13px 28px", fontSize:14, fontWeight:700, cursor:"pointer" }}
            data-testid="go-personally-cta"
            onClick={() => setModalSvc(services[0])}>
            Talk to your Go Concierge® →
          </button>
          <p style={{ fontSize:12, color:"#888", marginTop:8 }}>48h response promise · Emergency: within 5 minutes</p>
        </div>
      </div>
    </>
  );
}
