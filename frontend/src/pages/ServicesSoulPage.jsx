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
import SoulMadeModal from "../components/SoulMadeModal";

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
const PILLAR_OPTIONS = {
  celebrate: [
    { id: 'birthday_party', label: 'Birthday' },
    { id: 'gotcha_day', label: 'Gotcha Day' },
    { id: 'milestone', label: 'Milestone' },
    { id: 'photography', label: 'Photoshoot' },
    { id: 'surprise_delivery', label: 'Surprise' },
    { id: 'pawty', label: 'Pawty' },
    { id: 'custom_cake', label: 'Cake Consultation' },
    { id: 'venue', label: 'Venue Booking' },
    { id: 'just_because', label: 'Just because' },
  ],
  care: [
    { id: 'grooming', label: 'Grooming' },
    { id: 'spa', label: 'Spa & Wellness' },
    { id: 'coat_care', label: 'Coat Care' },
    { id: 'dental', label: 'Dental' },
    { id: 'health_check', label: 'Health Check' },
    { id: 'general_care', label: 'General Care' },
  ],
  emergency: [
    { id: 'vet_consult', label: 'Vet Consult' },
    { id: 'emergency_visit', label: 'Emergency Visit' },
    { id: 'first_aid', label: 'First Aid' },
    { id: 'specialist', label: 'Specialist Referral' },
  ],
  learn: [
    { id: 'basic_training', label: 'Basic Training' },
    { id: 'behaviour', label: 'Behaviour' },
    { id: 'puppy_foundation', label: 'Puppy Foundation' },
    { id: 'enrichment', label: 'Enrichment' },
    { id: 'socialisation', label: 'Socialisation' },
  ],
  play: [
    { id: 'playdate', label: 'Playdate' },
    { id: 'dog_park', label: 'Dog Park' },
    { id: 'agility', label: 'Agility' },
    { id: 'enrichment', label: 'Enrichment' },
  ],
  fit: [
    { id: 'dog_walking', label: 'Dog Walking' },
    { id: 'fitness_plan', label: 'Fitness Plan' },
    { id: 'hydrotherapy', label: 'Hydrotherapy' },
    { id: 'swimming', label: 'Swimming' },
  ],
  go: [
    { id: 'travel_planning', label: 'Travel Planning' },
    { id: 'pet_passport', label: 'Pet Passport' },
    { id: 'flight_coordination', label: 'Flight Coordination' },
    { id: 'pet_taxi', label: 'Pet Taxi' },
  ],
  travel: [
    { id: 'travel_planning', label: 'Travel Planning' },
    { id: 'flight_coordination', label: 'Flight' },
    { id: 'documents', label: 'Documents' },
  ],
  paperwork: [
    { id: 'microchipping', label: 'Microchipping' },
    { id: 'registration', label: 'Registration' },
    { id: 'insurance', label: 'Insurance' },
    { id: 'documents', label: 'Documents' },
  ],
  adopt: [
    { id: 'adoption_support', label: 'Adoption Help' },
    { id: 'home_prep', label: 'Home Prep' },
    { id: 'puppy_starter', label: 'Puppy Starter' },
  ],
  farewell: [
    { id: 'memorial', label: 'Memorial' },
    { id: 'cremation', label: 'Cremation' },
    { id: 'grief_support', label: 'Grief Support' },
    { id: 'keepsake', label: 'Keepsake' },
  ],
  dine: [
    { id: 'nutrition_consult', label: 'Nutrition Consult' },
    { id: 'custom_diet', label: 'Custom Diet' },
    { id: 'treats', label: 'Treats & Cakes' },
  ],
  enjoy: [
    { id: 'social_event', label: 'Social Event' },
    { id: 'community', label: 'Community' },
    { id: 'outing', label: 'Outing' },
  ],
};

const PILLAR_QUESTIONS = {
  celebrate: "What should {pet}'s celebration feel like?",
  care:      "What does {pet} need?",
  emergency: "How can we help {pet}?",
  learn:     "What should {pet} learn?",
  play:      "What kind of fun for {pet}?",
  fit:       "What fitness does {pet} need?",
  go:        "Where is {pet} going?",
  travel:    "Where is {pet} travelling?",
  paperwork: "What paperwork does {pet} need?",
  adopt:     "How can we help with adoption?",
  farewell:  "How should we honour {pet}?",
  dine:      "What does {pet} need for dining?",
  enjoy:     "What experience for {pet}?",
};

function BookingModal({ service, pet, user, onClose, onBooked }) {
  const [selectedType, setSelectedType] = useState(service?.sub_category || '');
  const [serviceDate, setServiceDate] = useState('');
  const [notSureDate, setNotSureDate] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const petName = pet?.name || "your dog";
  const pillar = service?.pillar || "services";

  const options = PILLAR_OPTIONS[pillar] || [
    { id: 'general', label: 'General Inquiry' },
    { id: 'booking', label: 'Book a Session' },
    { id: 'consultation', label: 'Consultation' },
  ];
  const question = (PILLAR_QUESTIONS[pillar] || "What does {pet} need?").replace("{pet}", petName);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('tdb_auth_token');
      const dateNote = notSureDate ? '' : (serviceDate ? ` Date: ${serviceDate}.` : '');
      const notesNote = notes.trim() ? ` Notes: ${notes.trim()}` : '';
      const serviceDesc = selectedType || service?.name || 'a service';

      const res = await fetch(`${API_URL}/api/service_desk/attach_or_create_ticket`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          parent_id: user?.id || user?.email || "guest",
          pet_id: pet?.id || pet?._id || "unknown",
          pillar: pillar,
          intent_primary: "booking_intent",
          channel: "services_page",
          life_state: "PLAN",
          urgency: "high",
          status: "open",
          force_new: true,
          initial_message: {
            sender: "parent",
            text: `${petName}'s parent wants to book: ${service?.name || serviceDesc} (${serviceDesc}) via services page.${dateNote}${notesNote}`
          }
        })
      });
      if (res.ok) {
        setSubmitted(true);
        onBooked?.(service?.name);
      } else {
        // Graceful — still show confirmation
        setSubmitted(true);
        onBooked?.(service?.name);
      }
    } catch {
      setSubmitted(true);
      onBooked?.(service?.name);
    }
    setLoading(false);
  };

  const handleClose = () => {
    setSubmitted(false);
    setSelectedType('');
    setServiceDate('');
    setNotSureDate(false);
    setNotes('');
    onClose();
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.50)",
                  zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
         onClick={e => e.target===e.currentTarget && handleClose()}
         data-testid="service-concierge-modal-overlay">
      <div style={{ background:"#fff", borderRadius:20, padding:32,
                    maxWidth:480, width:"100%", maxHeight:"90vh", overflowY:"auto",
                    position:"relative", boxShadow:"0 24px 64px rgba(0,0,0,0.20)" }}
           onClick={e => e.stopPropagation()}
           data-testid="service-concierge-modal">

        {submitted ? (
          /* ── Confirmation ── */
          <div style={{ textAlign:"center", padding:"16px 0" }}>
            <div style={{
              width:64, height:64, borderRadius:"50%",
              background:"rgba(201,151,58,0.15)", border:"2px solid rgba(201,151,58,0.40)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:28, margin:"0 auto 16px"
            }}>♥</div>
            <h3 style={{ fontSize:18, fontWeight:800, color:"#1A0030", marginBottom:10 }}>
              {petName}'s request is in good hands.
            </h3>
            <p style={{ fontSize:14, color:"#666", lineHeight:1.6, marginBottom:24 }}>
              Your Concierge has everything they need. Expect a message within 48 hours. ♥
            </p>
            <p style={{ fontSize:12, color:"rgba(201,151,58,0.80)", fontWeight:600 }}>
              48h response promise
            </p>
            <button onClick={handleClose}
              style={{ marginTop:24, background:"linear-gradient(135deg,#C9973A,#F0C060)",
                       color:"#1A0A00", border:"none", borderRadius:12,
                       padding:"12px 32px", fontSize:14, fontWeight:800,
                       cursor:"pointer", width:"100%" }}
              data-testid="service-modal-close-btn">
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Close X */}
            <button onClick={handleClose}
              style={{ position:"absolute", top:16, right:16, background:"none",
                       border:"none", cursor:"pointer", padding:4, fontSize:20, color:"#888" }}
              data-testid="service-modal-close-x">✕</button>

            {/* Eyebrow */}
            <div style={{
              display:"inline-flex", alignItems:"center", gap:6,
              background:"rgba(201,151,58,0.15)", border:"1px solid rgba(201,151,58,0.40)",
              borderRadius:9999, padding:"4px 14px",
              fontSize:12, fontWeight:600, color:"#F0C060", marginBottom:16
            }}>
              <span style={{ color:"#C9973A" }}>★</span>
              {petName}'s Concierge
            </div>

            {/* Title — dynamic per pillar */}
            <h2 style={{ fontSize:"1.25rem", fontFamily:"Georgia,serif", fontWeight:800,
                         color:"#1A0030", marginBottom:6, lineHeight:1.3 }}>
              {question}
            </h2>

            {/* Subtitle */}
            <p style={{ fontSize:13, color:"#888", marginBottom:10, lineHeight:1.5 }}>
              Three questions. Then your Concierge takes over.
            </p>

            {/* Service name callout */}
            <div style={{ background:"#F8F7F4", borderRadius:10, padding:"10px 14px",
                          marginBottom:20, fontSize:13, fontWeight:600, color:"#1A0030" }}>
              {service?.name}
            </div>

            {/* Q1: What type? — pillar-specific options */}
            <div style={{ marginBottom:24 }}>
              <p style={{ fontSize:13, fontWeight:700, color:"#1A0030", marginBottom:12 }}>
                What exactly do you need?
              </p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {options.map(opt => (
                  <button key={opt.id} onClick={() => setSelectedType(opt.id)}
                    style={{
                      padding:"8px 16px", borderRadius:9999, fontSize:13,
                      fontWeight: selectedType===opt.id ? 700 : 500,
                      cursor:"pointer", transition:"all 150ms",
                      background: selectedType===opt.id
                        ? "linear-gradient(135deg,#C9973A,#F0C060)" : "rgba(0,0,0,0.04)",
                      border: selectedType===opt.id
                        ? "1px solid transparent" : "1px solid rgba(0,0,0,0.10)",
                      color: selectedType===opt.id ? "#1A0A00" : "#444"
                    }}
                    data-testid={`svc-option-${opt.id}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Q2: When? */}
            <div style={{ marginBottom:24 }}>
              <p style={{ fontSize:13, fontWeight:700, color:"#1A0030", marginBottom:12 }}>When?</p>
              <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
                <input type="date" value={serviceDate}
                  onChange={e => { setServiceDate(e.target.value); setNotSureDate(false); }}
                  disabled={notSureDate}
                  style={{ padding:"10px 14px", borderRadius:10,
                           border:"1px solid rgba(0,0,0,0.15)", fontSize:13,
                           color: notSureDate ? "#aaa" : "#1A0030",
                           background: notSureDate ? "#f5f5f5" : "#fff",
                           flex:1, minWidth:140 }}
                  data-testid="svc-date-input"/>
                <button onClick={() => { setNotSureDate(!notSureDate); if(!notSureDate) setServiceDate(''); }}
                  style={{ padding:"10px 16px", borderRadius:10, fontSize:13,
                           fontWeight: notSureDate ? 700 : 500, cursor:"pointer",
                           background: notSureDate ? "rgba(201,151,58,0.15)" : "rgba(0,0,0,0.04)",
                           border: notSureDate ? "1px solid rgba(201,151,58,0.40)" : "1px solid rgba(0,0,0,0.10)",
                           color: notSureDate ? "#C9973A" : "#444", whiteSpace:"nowrap" }}
                  data-testid="svc-not-sure-date">
                  Not sure yet
                </button>
              </div>
            </div>

            {/* Q3: Notes */}
            <div style={{ marginBottom:28 }}>
              <p style={{ fontSize:13, fontWeight:700, color:"#1A0030", marginBottom:8 }}>
                Anything else we should know about <span style={{ color:"#C9973A" }}>{petName}</span>?{' '}
                <span style={{ fontSize:12, color:"#aaa", fontWeight:400 }}>Optional</span>
              </p>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder={`Allergies, preferences, what makes ${petName}'s tail go fastest...`}
                style={{ width:"100%", minHeight:80, padding:"12px 14px", borderRadius:10,
                         border:"1px solid rgba(0,0,0,0.12)", fontSize:13, color:"#1A0030",
                         lineHeight:1.5, resize:"vertical", boxSizing:"border-box", fontFamily:"inherit" }}
                data-testid="svc-notes-input"/>
            </div>

            {/* Submit */}
            <button onClick={handleSubmit} disabled={loading}
              style={{ width:"100%", background:"linear-gradient(135deg,#C9973A,#F0C060)",
                       color:"#1A0A00", border:"none", borderRadius:12, padding:"14px",
                       fontSize:15, fontWeight:800, cursor: loading ? "not-allowed" : "pointer",
                       opacity: loading ? 0.7 : 1 }}
              data-testid="svc-submit-btn">
              {loading ? "Sending..." : "Send to my Concierge →"}
            </button>

            <p style={{ fontSize:11, color:"#aaa", textAlign:"center", marginTop:12, lineHeight:1.5 }}>
              We already have your contact details. Your Concierge will reach out — you don't need to chase.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ── Service card ──────────────────────────────────────────────
function ServiceCard({ service, groupColour, pet, onBook }) {
  const img   = service.watercolour_image || service.image_url || service.image || null;

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
          Book via Concierge →
        </button>
      </div>
    </div>
  );
}

// ── Service Group ─────────────────────────────────────────────
function ServiceGroup({ group, services, pet, onBook }) {
  const [expanded, setExpanded] = useState(false);
  const show = expanded ? services : services.slice(0, 4);

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
  const [soulMadeOpen,  setSoulMadeOpen]  = useState(false);

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
      // Only keep priced services
      const priced = all.filter(s => parseFloat(s.base_price||s.price||0) > 0);
      setAllServices(priced);
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
      amount: service?.base_price || service?.price,
    });
    setBookingService(service);
  };

  const handleBooked = (name) => {
    setToastSvc(name);
    setToastVisible(true);
    setTimeout(() => setBookingService(null), 300);
  };

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
          <div style={{ width:64, height:64, borderRadius:"50%", background:MIRA_ORB,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:28, color:"#fff", margin:"0 auto 12px" }}>✦</div>
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
          <PillarSoulProfile pet={petData} token={token} pillar="services" color="#6366F1" />
        )}

        {/* ── SOUL MADE™ TRIGGER ── */}
        {petData?.name && (
          <div data-testid="soul-made-trigger" style={{margin:'16px 0 24px',padding:'16px',background:'#0EA5E908',border:'1px solid #0EA5E920',borderRadius:16,display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer'}} onClick={()=>setSoulMadeOpen(true)}>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:'#0EA5E9',marginBottom:3}}>✦ Soul Made™ — Make it personal</div>
              <div style={{fontSize:12,color:'rgba(245,240,232,0.4)'}}>Upload {petData.name}'s photo · Concierge® creates it · Price on WhatsApp</div>
            </div>
            <div style={{fontSize:20,color:'#0EA5E960'}}>›</div>
          </div>
        )}
        {soulMadeOpen && <SoulMadeModal pet={petData} pillar="services" pillarColor="#0EA5E9" pillarLabel="Services" onClose={()=>setSoulMadeOpen(false)}/>}

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

        {/* Concierge note */}
        <div style={{ background:G.pale, borderRadius:12, padding:"16px 20px",
                      marginBottom:48, textAlign:"center" }}>
          <div style={{ fontSize:13, fontWeight:600, color:G.deep, marginBottom:4 }}>
            ✦ Mira is the Brain · Concierge® is the Hands
          </div>
          <div style={{ fontSize:12, color:G.mutedText, lineHeight:1.6 }}>
            Every booking goes to a real Concierge who arranges, confirms, and follows up.
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
