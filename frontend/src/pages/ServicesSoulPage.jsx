/**
 * ServicesSoulPage.jsx — /services nav page
 * The Doggy Company
 *
 * All 74 priced bookable services across all pillars — in one place.
 * Grouped by what you need, not by pillar.
 * Single unified Book button → POST /api/service_desk/attach_or_create_ticket
 * "Not sure? Ask Mira →" opens MiraOSModal.
 *
 * Groups:
 *   Pamper & Groom     — care grooming + spa
 *   Health & Vet       — vet, emergency, medical
 *   Train & Learn      — learn, play training
 *   Celebrate          — celebrate pillar services
 *   Fitness & Walks    — fit, dog walking
 *   Travel & Paperwork — go, travel, paperwork
 *   Life Events        — adopt, farewell, enjoy
 *
 * WIRING:
 *   Route:   <Route path="/services" element={<ServicesSoulPage/>}/>
 *   Services: GET /api/service-box/services?pillar=X
 *   Book:    POST /api/service_desk/attach_or_create_ticket
 */

import { useState, useEffect, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePillarContext } from "../context/PillarContext";
import PillarPageLayout from "../components/PillarPageLayout";
import ConciergeToast from "../components/common/ConciergeToast";
import { API_URL } from "../utils/api";
import { tdc } from "../utils/tdc_intent";
import { usePlatformTracking } from "../hooks/usePlatformTracking";
import PillarSoulProfile from "../components/PillarSoulProfile";
import PersonalisedBreedSection from "../components/common/PersonalisedBreedSection";
import ServicesMobilePage from './ServicesMobilePage';
import ServiceConciergeModal from '../components/services/ServiceConciergeModal';

// ── Colour — clean slate, every pillar's colour shows through ─
const G = {
  deep:     "#0F172A",
  mid:      "#1E293B",
  slate:    "#334155",
  light:    "#94A3B8",
  pale:     "#F8FAFC",
  cream:    "#F1F5F9",
  darkText: "#0F172A",
  mutedText:"#475569",
  border:   "rgba(15,23,42,0.10)",
};
const MIRA_ORB = "linear-gradient(135deg,#9B59B6,#E91E8C,#FF6EC7)";

// ── Service groups — by intent, not pillar ────────────────────
const SERVICE_GROUPS = [
  {
    id:      "pamper",
    label:   "Pamper & Groom",
    icon:    "✨",
    colour:  "#40916C",
    pillars: ["care"],
    desc:    "Grooming, spa, coat care — for every breed and comfort level",
  },
  {
    id:      "health",
    label:   "Health & Vet",
    icon:    "🏥",
    colour:  "#DC2626",
    pillars: ["care","emergency"],
    desc:    "Vet consultations, emergency support, first aid",
  },
  {
    id:      "learn",
    label:   "Train & Learn",
    icon:    "🎓",
    colour:  "#7C3AED",
    pillars: ["learn","play"],
    desc:    "Training, behaviour, enrichment, puppy foundations",
  },
  {
    id:      "celebrate",
    label:   "Celebrate",
    icon:    "🎉",
    colour:  "#9B59B6",
    pillars: ["celebrate"],
    desc:    "Birthday parties, photography, special occasions",
  },
  {
    id:      "fitness",
    label:   "Fitness & Walks",
    icon:    "🏃",
    colour:  "#E76F51",
    pillars: ["fit","play"],
    desc:    "Dog walking, fitness plans, hydrotherapy",
  },
  {
    id:      "travel",
    label:   "Travel & Paperwork",
    icon:    "✈️",
    colour:  "#1ABC9C",
    pillars: ["go","travel","paperwork"],
    desc:    "Pet passports, microchipping, travel docs, flight coordination",
  },
  {
    id:      "life",
    label:   "Life Events",
    icon:    "🌷",
    colour:  "#6366F1",
    pillars: ["adopt","farewell","enjoy","dine"],
    desc:    "Adoption support, farewell services, dining, social events",
  },
];

// ── Booking modal — uses same flow as ConciergeIntakeModal ───
// Adapts Q1 options based on service pillar.
// Uses bookViaConcierge() for ticket creation → admin notification + service desk.

export function BookingModal(props) {
  return <ServiceConciergeModal {...props} />;
}

// ── Service card ──────────────────────────────────────────────
function ServiceCard({ service, groupColour, pet, onBook }) {

  return (
    <div style={{ background:"#fff", border:`1px solid ${G.border}`, borderRadius:14,
                  overflow:"hidden", transition:"transform 0.15s, box-shadow 0.15s" }}
         onMouseEnter={e => { e.currentTarget.style.transform="translateY(-3px)";
                              e.currentTarget.style.boxShadow=`0 8px 24px rgba(0,0,0,0.08)`; }}
         onMouseLeave={e => { e.currentTarget.style.transform="none";
                              e.currentTarget.style.boxShadow="none"; }}>
      {/* Image / colour block */}
      <div style={{ height:110, background: img ? "transparent" : `linear-gradient(135deg,${groupColour}22,${groupColour}44)`,
                    display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden",
                    position:"relative" }}>
        {img
          ? <img src={img} alt={service.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
          : <div style={{ fontSize:36 }}>
              {service.icon || "✦"}
            </div>}
      </div>

      {/* Body */}
      <div style={{ padding:"12px 14px 14px" }}>
        <div style={{ fontSize:13, fontWeight:700, color:G.deep, marginBottom:4, lineHeight:1.3 }}>
          {service.name}
        </div>
        {service.description && (
          <div style={{ fontSize:11, color:G.mutedText, lineHeight:1.4, marginBottom:10,
                        display:"-webkit-box", WebkitLineClamp:2,
                        WebkitBoxOrient:"vertical", overflow:"hidden" }}>
            {service.description.slice(0,80)}
          </div>
        )}
        <button onClick={() => onBook(service)}
          data-testid={`service-card-book-${service._id || service.id}`}
          style={{ width:"100%", padding:"10px", borderRadius:10, fontSize:13, fontWeight:700,
                   background:`linear-gradient(135deg,#C9973A,#F0C060)`,
                   color:"#1A0A00", border:"none", cursor:"pointer" }}>
          Book via Concierge® →
        </button>
      </div>
    </div>
  );
}

// ── Service Group ─────────────────────────────────────────────
function ServiceGroup({ group, services, pet, onBook }) {
  const [expanded, setExpanded] = useState(false);
  const show = expanded ? services : services.slice(0, 6);

  if (!services.length) return null;

  return (
    <section style={{ marginBottom:32 }}>
      {/* Group header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
        <div style={{ width:40, height:40, borderRadius:10,
                      background:`${group.colour}18`,
                      display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>
          {group.icon}
        </div>
        <div style={{ flex:1 }}>
          <h2 style={{ fontSize:"clamp(1.1rem,2.5vw,1.3rem)", fontWeight:800,
                       color:G.deep, margin:0, fontFamily:"Georgia,serif" }}>
            {group.label}
          </h2>
          <div style={{ fontSize:12, color:G.mutedText, marginTop:2 }}>{group.desc}</div>
        </div>
        <span style={{ fontSize:11, fontWeight:700, background:`${group.colour}18`,
                       color:group.colour, borderRadius:20, padding:"3px 10px" }}>
          {services.length} services
        </span>
      </div>

      {/* Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(min(240px,100%),1fr))", gap:14 }}>
        {show.map((svc,i) => (
          <ServiceCard key={svc.id||svc._id||i} service={svc}
            groupColour={group.colour} pet={pet} onBook={onBook}/>
        ))}
      </div>

      {services.length > 4 && (
        <button onClick={() => setExpanded(!expanded)}
          style={{ marginTop:12, width:"100%", padding:"10px", borderRadius:10, fontSize:13,
                   fontWeight:600, background:G.pale, border:`1px solid ${G.border}`,
                   color:G.mutedText, cursor:"pointer" }}>
          {expanded ? "Show less" : `Show all ${services.length} ${group.label.toLowerCase()} services`}
        </button>
      )}
    </section>
  );
}

// ── Loading / No Pet ──────────────────────────────────────────
function LoadingState() {
  return (
    <div style={{ textAlign:"center", padding:"80px 20px" }}>
      <div style={{ width:48, height:48, borderRadius:"50%", background:MIRA_ORB,
                    margin:"0 auto 16px", display:"flex", alignItems:"center",
                    justifyContent:"center", fontSize:22, color:"#fff" }}>✦</div>
      <div style={{ fontSize:16, color:G.deep, fontWeight:600 }}>
        Loading <span style={{ color:"#9B59B6" }}>services…</span>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
const ServicesSoulPage = () => {
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  useEffect(() => { const fn = () => setIsDesktop(window.innerWidth >= 1024); window.addEventListener('resize', fn); return () => window.removeEventListener('resize', fn); }, []);
  const navigate   = useNavigate();
  const { token, isAuthenticated, user }                  = useAuth();
  const { currentPet, setCurrentPet, pets: contextPets }  = usePillarContext();
  const pet = currentPet; // alias for sub-components


  // ── Universal visit tracking ──────────────────────────────────
  usePlatformTracking({ pillar: "services", pet: currentPet });

  const [loading,       setLoading]       = useState(true);
  const [petData,       setPetData]       = useState(null);
  const [soulScore,     setSoulScore]     = useState(0);
  const [allServices,   setAllServices]   = useState([]);
  const [svcLoading,    setSvcLoading]    = useState(true);
  const [activeGroup,   setActiveGroup]   = useState(null);
  const [bookingService,setBookingService]= useState(null);
  const [selectedItem,  setSelectedItem]  = useState(null); // ProductModal
  const [toastVisible,  setToastVisible]  = useState(false);
  const [toastSvc,      setToastSvc]      = useState("");
  const [search,        setSearch]        = useState("");

  // Fetch all services from all real pillars
  useEffect(() => {
    const PILLARS = ["care","emergency","learn","play","celebrate","fit","go","travel","paperwork","adopt","farewell","enjoy","dine"];
    Promise.all(
      PILLARS.map(p =>
        fetch(`${API_URL}/api/service-box/services?pillar=${p}`)
          .then(r => r.ok ? r.json() : null)
          .then(data => (data?.services || []).map(s => ({ ...s, pillar:p })))
          .catch(() => [])
      )
    ).then(results => {
      const all = results.flat();
      setAllServices(all);
      setSvcLoading(false);
    });
  }, []);

  useEffect(() => {
    if (contextPets?.length>0 && !currentPet) setCurrentPet(contextPets[0]);
    if (contextPets !== undefined) setLoading(false);
  }, [contextPets, currentPet, setCurrentPet]);

  useEffect(() => {
    if (currentPet) {
      setPetData(currentPet);
      setSoulScore(currentPet.overall_score || currentPet.soul_score || 0);
    }
  }, [currentPet]);

  const handleAddPet = useCallback(() => {
    navigate(isAuthenticated ? "/dashboard/pets?action=add" : "/login?redirect=/services");
  }, [isAuthenticated, navigate]);

  const handleBook = (service) => {
    tdc.book({
      service: service?.name || service,
      product_id: service?._id || service?.id,
      pillar: service?.pillar || "services",
      pet: petData,
      channel: "services_page",
      amount: 0,
    });
    setBookingService(service);
  };

  const handleBooked = (name) => {
    setToastSvc(name);
    setToastVisible(true);
    setTimeout(() => setBookingService(null), 300);
  };

  // Mobile detection
  if (!isDesktop) return <ServicesMobilePage />;

  if (loading) return <PillarPageLayout pillar="services" hideHero hideNavigation><LoadingState/></PillarPageLayout>;

  const petName = petData?.name || "your dog";

  // Group services
  const grouped = SERVICE_GROUPS.map(group => ({
    ...group,
    services: allServices.filter(s => group.pillars.includes(s.pillar)),
  }));

  // Search filter
  const searchFiltered = search.trim()
    ? grouped.map(g => ({
        ...g,
        services: g.services.filter(s =>
          (s.name||"").toLowerCase().includes(search.toLowerCase()) ||
          (s.description||"").toLowerCase().includes(search.toLowerCase())
        )
      }))
    : grouped;

  const activeGroups = activeGroup
    ? searchFiltered.filter(g => g.id === activeGroup)
    : searchFiltered;

  const totalServices = allServices.length;

  return (
    <PillarPageLayout pillar="services" hideHero hideNavigation>
      <Helmet>
        <title>Services · The Doggy Company</title>
        <meta name="description" content="Book any service for your dog — grooming, training, vet, birthday parties and more."/>
      </Helmet>

      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8"
           style={{ background:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>

        {/* Hero */}
        <div style={{ textAlign:"center", padding:"32px 0 24px",
                      borderBottom:`1px solid ${G.border}`, marginBottom:24 }}>
          <div style={{ width:64, height:64, borderRadius:"50%", background: petData?.photo_url ? "transparent" : MIRA_ORB,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:28, color:"#fff", margin:"0 auto 12px", overflow:"hidden", border: "2px solid rgba(255,255,255,0.2)" }}>
            {petData?.photo_url
              ? <img src={petData.photo_url} alt={petName} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none";e.target.parentNode.innerHTML="✦";e.target.parentNode.style.background=MIRA_ORB;}}/>
              : "✦"}
          </div>
          <h1 style={{ fontSize:"clamp(1.875rem,4vw,2.5rem)", fontWeight:800,
                       color:G.deep, fontFamily:"Georgia,'Times New Roman',serif", margin:"0 0 6px" }}>
            {petData ? `Services for ${petName}` : "All Services"}
          </h1>
          <p style={{ fontSize:14, color:G.mutedText, margin:"0 0 16px" }}>
            {svcLoading ? "Loading…" : `${totalServices} bookable services · All arranged by Concierge®`}
          </p>
          {petData && (
            <div style={{ display:"inline-flex", alignItems:"center", gap:6,
                          background:`linear-gradient(135deg,#9B59B6,#6366F1)`,
                          borderRadius:20, padding:"4px 14px" }}>
              <span style={{ fontSize:11, fontWeight:700, color:"#fff" }}>✦ Soul Score</span>
              <span style={{ fontSize:13, fontWeight:900, color:"#fff" }}>{soulScore}%</span>
            </div>
          )}
          {!petData && (
            <button onClick={handleAddPet}
              style={{ background:G.deep, color:"#fff", border:"none", borderRadius:20,
                       padding:"10px 24px", fontSize:13, fontWeight:600, cursor:"pointer" }}>
              Add your dog for personalised services →
            </button>
          )}
        </div>

        {/* Soul Profile bar — pet/breed info + questions */}
        {petData && (
          <div style={{ paddingTop: 16 }}>
            <PillarSoulProfile pet={petData} token={token} pillar="services" color="#6366F1" />
          </div>
        )}

        {/* Search */}
        <div style={{ marginBottom:16 }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search services… e.g. grooming, training, photography"
            style={{ width:"100%", padding:"12px 16px", borderRadius:12, fontSize:14,
                     border:`1.5px solid ${G.border}`, outline:"none", color:G.deep,
                     boxSizing:"border-box" }}/>
        </div>

        {/* Group filter pills */}
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:24 }}>
          <button onClick={() => setActiveGroup(null)}
            style={{ padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:600,
                     border:`1px solid ${!activeGroup?G.deep:G.border}`,
                     background:!activeGroup?G.deep:G.pale,
                     color:!activeGroup?"#fff":G.mutedText, cursor:"pointer" }}>
            All Services
          </button>
          {SERVICE_GROUPS.map(g => (
            <button key={g.id} onClick={() => setActiveGroup(activeGroup===g.id?null:g.id)}
              style={{ padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:600,
                       border:`1px solid ${activeGroup===g.id?g.colour:G.border}`,
                       background:activeGroup===g.id?g.colour:G.pale,
                       color:activeGroup===g.id?"#fff":G.mutedText, cursor:"pointer" }}>
              {g.icon} {g.label}
            </button>
          ))}
        </div>

        {/* Ask Mira banner */}
        <div style={{ background:`linear-gradient(135deg,#1A0530,#2D1B69)`,
                      borderRadius:14, padding:"16px 20px", marginBottom:28,
                      display:"flex", gap:14, alignItems:"center" }}>
          <div style={{ width:40, height:40, borderRadius:"50%", background:MIRA_ORB,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:18, color:"#fff", flexShrink:0 }}>✦</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#fff", marginBottom:2 }}>
              Not sure what service you need?
            </div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.65)" }}>
              Tell Mira what's going on with {petName} — she'll recommend the right service and arrange it.
            </div>
          </div>
          <button
            onClick={() => navigate("/mira-os")}
            style={{ background:"rgba(255,255,255,0.15)", color:"#fff", border:"1px solid rgba(255,255,255,0.25)",
                     borderRadius:20, padding:"9px 18px", fontSize:12, fontWeight:700,
                     cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}>
            Ask Mira →
          </button>
        </div>

        {/* Service groups */}
        {svcLoading ? (
          <div style={{ textAlign:"center", padding:"48px 0", color:G.mutedText, fontSize:14 }}>
            <div style={{ fontSize:32, marginBottom:12 }}>✦</div>
            Loading all services…
          </div>
        ) : (
          activeGroups.map(group => (
            <ServiceGroup key={group.id} group={group} services={group.services}
              pet={petData} onBook={handleBook}/>
          ))
        )}

        {/* Concierge® note */}
        <div style={{ background:G.pale, borderRadius:12, padding:"16px 20px",
                      marginBottom:48, textAlign:"center" }}>
          <div style={{ fontSize:13, fontWeight:600, color:G.deep, marginBottom:4 }}>
            ✦ Mira is the Brain · Concierge® is the Hands
          </div>
          <div style={{ fontSize:12, color:G.mutedText, lineHeight:1.6 }}>
            Every booking goes to a real Concierge® who arranges, confirms, and follows up.
            No bots, no automated bookings — a person who knows your dog.
          </div>
        </div>
      </div>

      {/* Booking modal — same concierge intake flow as pillar pages */}
      {bookingService && (
        <BookingModal
          service={bookingService}
          pet={petData}
          user={user}
          onClose={() => setBookingService(null)}
          onBooked={handleBooked}
        />
      )}

      <ConciergeToast
        toast={toastVisible ? { name: toastSvc, pillar: "services" } : null}
        onClose={() => setToastVisible(false)}
      />
    </PillarPageLayout>
  );
};

export default ServicesSoulPage;
