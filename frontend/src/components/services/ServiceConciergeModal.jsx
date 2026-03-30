/**
 * ServiceConciergeModal.jsx
 * ─────────────────────────
 * Shared intake-style concierge modal used on both:
 *   - ServicesSoulPage (desktop)
 *   - ServicesMobilePage (mobile)
 *
 * NO prices. Three questions: What / When / Notes.
 * Submits to /api/service_desk/attach_or_create_ticket.
 */
import { useState } from 'react';
import { API_URL } from '../../utils/api';
import { buildMasterBriefing, buildMasterMetadata, getAllergiesFromPet } from '../../utils/masterBriefing';

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
  services: [
    { id: 'grooming', label: 'Grooming' },
    { id: 'vet', label: 'Vet Consultation' },
    { id: 'training', label: 'Training' },
    { id: 'photography', label: 'Photography' },
    { id: 'celebration', label: 'Celebration' },
    { id: 'other', label: 'Other' },
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
  services:  "What service are we arranging for {pet}?",
  enjoy:     "What experience for {pet}?",
};

export default function ServiceConciergeModal({ service, pet, user, onClose, onBooked }) {
  const [selectedType, setSelectedType] = useState(service?.sub_category || '');
  const [serviceDate, setServiceDate] = useState('');
  const [notSureDate, setNotSureDate] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const petName = pet?.name || 'your dog';
  const pillar = service?.pillar || 'services';
  const hasSpecificService = service?.name && service.name !== 'General Inquiry';
  const options = hasSpecificService ? [] : (PILLAR_OPTIONS[pillar] || PILLAR_OPTIONS.services);
  const question = hasSpecificService
    ? `Booking: ${service.name}`
    : (PILLAR_QUESTIONS[pillar] || "What does {pet} need?").replace('{pet}', petName);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('tdb_auth_token');
      const serviceDesc = selectedType || service?.name || 'a service';

      const details = {
        service_name:  service?.name || serviceDesc,
        pillar,
        channel:       'services_concierge_modal',
        delivery_date: !notSureDate && serviceDate ? serviceDate : undefined,
        notes:         notes.trim() || undefined,
        urgency:       'high',
      };
      const briefingText = buildMasterBriefing(pet, user, 'service_booking', details);
      const metadata     = buildMasterMetadata(pet, user, details, {
        service_type: selectedType,
        service_name_raw: service?.name || serviceDesc,
      });

      await fetch(`${API_URL}/api/service_desk/attach_or_create_ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          parent_id:     user?.id || user?.email || 'guest',
          parent_email:  user?.email || '',
          parent_name:   user?.name || user?.full_name || '',
          parent_phone:  user?.phone || user?.whatsapp || '',
          pet_id:        pet?.id || pet?._id || 'unknown',
          pet_name:      petName,
          pet_breed:     pet?.breed || '',
          pet_allergies: getAllergiesFromPet(pet),
          pillar,
          intent_primary: 'service_booking',
          channel:        'services_concierge_modal',
          urgency:        'high',
          status:         'open',
          force_new:      true,
          subject:        `Service Booking: ${service?.name || serviceDesc} for ${petName}`,
          initial_message: {
            sender: 'parent',
            text:   briefingText,
          },
          metadata,
        }),
      });
    } catch { /* graceful */ }
    setSubmitted(true);
    setLoading(false);
    onBooked?.(service?.name);
  };

  const handleClose = () => {
    setSubmitted(false); setSelectedType(''); setServiceDate(''); setNotSureDate(false); setNotes('');
    onClose();
  };

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.50)',
               zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onClick={e => e.target === e.currentTarget && handleClose()}
      data-testid="service-concierge-modal-overlay">
      <div
        style={{ background:'#fff', borderRadius:20, padding:28,
                 maxWidth:480, width:'100%', maxHeight:'90vh', overflowY:'auto',
                 position:'relative', boxShadow:'0 24px 64px rgba(0,0,0,0.20)' }}
        onClick={e => e.stopPropagation()}
        data-testid="service-concierge-modal">

        {submitted ? (
          <div style={{ textAlign:'center', padding:'16px 0' }}>
            <div style={{ width:64, height:64, borderRadius:'50%', background:'rgba(201,151,58,0.15)',
                          border:'2px solid rgba(201,151,58,0.40)', display:'flex', alignItems:'center',
                          justifyContent:'center', fontSize:28, margin:'0 auto 16px' }}>♥</div>
            <h3 style={{ fontSize:18, fontWeight:800, color:'#1A0030', marginBottom:10 }}>
              {petName}'s request is in good hands.
            </h3>
            <p style={{ fontSize:14, color:'#666', lineHeight:1.6, marginBottom:24 }}>
              Your Concierge® has everything they need. Expect a message within 48 hours. ♥
            </p>
            <button onClick={handleClose}
              style={{ background:'linear-gradient(135deg,#C9973A,#F0C060)', color:'#1A0A00',
                       border:'none', borderRadius:12, padding:'12px 32px',
                       fontSize:14, fontWeight:800, cursor:'pointer', width:'100%' }}
              data-testid="service-modal-close-btn">Close</button>
          </div>
        ) : (
          <>
            <button onClick={handleClose}
              style={{ position:'absolute', top:16, right:16, background:'none',
                       border:'none', cursor:'pointer', fontSize:20, color:'#888' }}>✕</button>

            <div style={{ display:'inline-flex', alignItems:'center', gap:6,
                          background:'rgba(201,151,58,0.15)', border:'1px solid rgba(201,151,58,0.40)',
                          borderRadius:9999, padding:'4px 14px',
                          fontSize:12, fontWeight:600, color:'#F0C060', marginBottom:16 }}>
              <span style={{ color:'#C9973A' }}>★</span> {petName}'s Concierge®
            </div>

            <h2 style={{ fontSize:'1.2rem', fontFamily:'Georgia,serif', fontWeight:800,
                         color:'#1A0030', marginBottom:6, lineHeight:1.3 }}>
              {question}
            </h2>
            <p style={{ fontSize:13, color:'#888', marginBottom:10, lineHeight:1.5 }}>
              Three questions. Then your Concierge® takes over.
            </p>

            {hasSpecificService && (
              <div style={{ background:'#F8F7F4', borderRadius:10, padding:'10px 14px',
                            marginBottom:20, fontSize:13, fontWeight:600, color:'#1A0030' }}>
                {service?.name}
              </div>
            )}

            {options.length > 0 && (
              <div style={{ marginBottom:24 }}>
                <p style={{ fontSize:13, fontWeight:700, color:'#1A0030', marginBottom:12 }}>What exactly do you need?</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {options.map(opt => (
                    <button key={opt.id} onClick={() => setSelectedType(opt.id)}
                      style={{ padding:'8px 16px', borderRadius:9999, fontSize:13, cursor:'pointer',
                               fontWeight: selectedType===opt.id ? 700 : 500,
                               background: selectedType===opt.id
                                 ? 'linear-gradient(135deg,#C9973A,#F0C060)' : 'rgba(0,0,0,0.04)',
                               border: selectedType===opt.id
                                 ? '1px solid transparent' : '1px solid rgba(0,0,0,0.10)',
                               color: selectedType===opt.id ? '#1A0A00' : '#444' }}
                      data-testid={`svc-option-${opt.id}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom:24 }}>
              <p style={{ fontSize:13, fontWeight:700, color:'#1A0030', marginBottom:12 }}>When?</p>
              <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
                <input type="date" value={serviceDate}
                  onChange={e => { setServiceDate(e.target.value); setNotSureDate(false); }}
                  disabled={notSureDate}
                  style={{ padding:'10px 14px', borderRadius:10, border:'1px solid rgba(0,0,0,0.15)',
                           fontSize:13, color: notSureDate ? '#aaa' : '#1A0030',
                           background: notSureDate ? '#f5f5f5' : '#fff', flex:1, minWidth:140 }}
                  data-testid="svc-date-input"/>
                <button onClick={() => { setNotSureDate(!notSureDate); if(!notSureDate) setServiceDate(''); }}
                  style={{ padding:'10px 16px', borderRadius:10, fontSize:13, cursor:'pointer',
                           fontWeight: notSureDate ? 700 : 500, whiteSpace:'nowrap',
                           background: notSureDate ? 'rgba(201,151,58,0.15)' : 'rgba(0,0,0,0.04)',
                           border: notSureDate ? '1px solid rgba(201,151,58,0.40)' : '1px solid rgba(0,0,0,0.10)',
                           color: notSureDate ? '#C9973A' : '#444' }}
                  data-testid="svc-not-sure-date">
                  Not sure yet
                </button>
              </div>
            </div>

            <div style={{ marginBottom:28 }}>
              <p style={{ fontSize:13, fontWeight:700, color:'#1A0030', marginBottom:8 }}>
                Anything else we should know about <span style={{ color:'#C9973A' }}>{petName}</span>?{' '}
                <span style={{ fontSize:12, color:'#aaa', fontWeight:400 }}>Optional</span>
              </p>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder={`Allergies, preferences, what makes ${petName}'s tail go fastest...`}
                style={{ width:'100%', minHeight:80, padding:'12px 14px', borderRadius:10,
                         border:'1px solid rgba(0,0,0,0.12)', fontSize:13, color:'#1A0030',
                         lineHeight:1.5, resize:'vertical', boxSizing:'border-box', fontFamily:'inherit' }}
                data-testid="svc-notes-input"/>
            </div>

            <button onClick={handleSubmit} disabled={loading}
              style={{ width:'100%', background:'linear-gradient(135deg,#C9973A,#F0C060)',
                       color:'#1A0A00', border:'none', borderRadius:12, padding:'14px',
                       fontSize:15, fontWeight:800, cursor: loading ? 'not-allowed' : 'pointer',
                       opacity: loading ? 0.7 : 1 }}
              data-testid="svc-submit-btn">
              {loading ? 'Sending...' : 'Send to my Concierge® →'}
            </button>
            <p style={{ fontSize:11, color:'#aaa', textAlign:'center', marginTop:12, lineHeight:1.5 }}>
              We already have your contact details. Your Concierge® will reach out — you don't need to chase.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
