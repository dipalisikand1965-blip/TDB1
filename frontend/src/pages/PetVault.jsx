/**
 * PetVault.jsx — The Doggy Company
 * The physical health record layer of the dog's OS.
 * Lives under the Care pillar (/care → /pet-vault/:petId).
 *
 * FULLY WIRED to Concierge® service flow:
 * Every health record a parent adds creates an enriched ticket.
 * Mira learns. Admin is notified. Nothing is ever silent.
 *
 * Sections:
 *  1. Mira Alert Bar (vaccine due alerts)
 *  2. Allergies & Conditions (CRITICAL — red, at top)
 *  3. Vaccinations
 *  4. Medications
 *  5. Vet Visits
 *  6. Saved Vets
 *  7. Weight Tracker
 *  8. Identity & Insurance
 *  9. Documents
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useConcierge } from '../hooks/useConcierge';
import { usePlatformTracking } from '../hooks/usePlatformTracking';
import { toast } from 'sonner';
import {
  Syringe, Pill, Stethoscope, UserCircle, FileText,
  Scale, Calendar, Plus, AlertCircle, CheckCircle,
  Phone, MapPin, ChevronLeft, Loader2, Bell, Shield,
  AlertTriangle, Heart, FileCheck, ClipboardList, X
} from 'lucide-react';
import { API_URL } from '../utils/api';

// ── Ideal weight by breed ──────────────────────────────────────────────────
const IDEAL_WEIGHTS = {
  'golden retriever': { min: 25, max: 34 },
  'labrador':         { min: 25, max: 36 },
  'indie':            { min: 15, max: 30 },
  'shih tzu':         { min: 4,  max: 7  },
  'poodle':           { min: 20, max: 32 },
  'beagle':           { min: 9,  max: 14 },
  'german shepherd':  { min: 22, max: 40 },
  'dachshund':        { min: 7,  max: 14 },
  'pomeranian':       { min: 1.5,max: 3.5},
  'default':          { min: 5,  max: 45 },
};
function getIdealWeight(breed) {
  const b = (breed || '').toLowerCase();
  for (const [key, val] of Object.entries(IDEAL_WEIGHTS)) {
    if (key !== 'default' && b.includes(key)) return val;
  }
  return IDEAL_WEIGHTS.default;
}

// ── Save soul answer helper ───────────────────────────────────────────────
async function saveSoulAnswer(petId, questionId, answer, token) {
  try {
    await fetch(`${API_URL}/api/pet-soul/profile/${petId}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ question_id: questionId, answer }),
    });
  } catch (e) {
    console.error('[saveSoulAnswer]', e);
  }
}

// ── Styles ────────────────────────────────────────────────────────────────
const G = {
  bg:      '#0F0F0F',
  surface: 'rgba(255,255,255,0.04)',
  border:  'rgba(255,255,255,0.08)',
  cream:   '#F5F0E8',
  muted:   'rgba(245,240,232,0.5)',
  green:   '#40916C',
  greenMuted: 'rgba(64,145,108,0.12)',
  greenBorder:'rgba(64,145,108,0.25)',
  red:     '#EF4444',
  redMuted:'rgba(220,38,38,0.1)',
  redBorder:'rgba(220,38,38,0.3)',
  gold:    '#C9973A',
  blue:    '#3B82F6',
  blueMuted:'rgba(59,130,246,0.1)',
};

const card = {
  background: G.surface,
  border: `1px solid ${G.border}`,
  borderRadius: 14,
  padding: '16px',
  marginBottom: 12,
};

// ── Main Component ─────────────────────────────────────────────────────────
const PetVault = () => {
  const { petId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  // ── Data state ───────────────────────────────────────────────────────
  const [loading, setLoading]       = useState(true);
  const [summary, setSummary]       = useState(null);
  const [vaccines, setVaccines]     = useState([]);
  const [medications, setMedications] = useState([]);
  const [visits, setVisits]         = useState([]);
  const [vets, setVets]             = useState([]);
  const [allergies, setAllergies]   = useState([]);
  const [documents, setDocuments]   = useState([]);
  const [activeTab, setActiveTab]   = useState('overview');
  const [saving, setSaving]         = useState(false);

  // ── Modal state ──────────────────────────────────────────────────────
  const [showAddVaccine,    setShowAddVaccine]    = useState(false);
  const [showAddMedication, setShowAddMedication] = useState(false);
  const [showAddVet,        setShowAddVet]        = useState(false);
  const [showAddVisit,      setShowAddVisit]      = useState(false);
  const [showAddWeight,     setShowAddWeight]     = useState(false);
  const [showAddAllergy,    setShowAddAllergy]    = useState(false);

  // ── Form state ───────────────────────────────────────────────────────
  const [vaccineForm,  setVaccineForm]  = useState({ vaccine_name: '', date_given: '', next_due_date: '', vet_name: '', notes: '', reminder_enabled: true });
  const [medForm,      setMedForm]      = useState({ medication_name: '', dosage: '', frequency: '', start_date: '', reason: '' });
  const [vetForm,      setVetForm]      = useState({ name: '', clinic_name: '', phone: '', address: '', is_primary: false });
  const [visitForm,    setVisitForm]    = useState({ visit_date: '', vet_name: '', reason: '', diagnosis: '', treatment: '', cost: '' });
  const [weightForm,   setWeightForm]   = useState({ date: '', weight_kg: '' });
  const [allergyForm,  setAllergyForm]  = useState({ name: '', allergy_type: 'food', confirmed_by: '', severity: 'moderate', notes: '' });

  // ── Build pet object for useConcierge ─────────────────────────────────
  const petObj = useMemo(() => ({
    id:    petId,
    name:  summary?.pet_name,
    breed: summary?.pet_breed,
  }), [petId, summary]);

  const { request, urgent } = useConcierge({ pet: petObj, pillar: 'care' });
  usePlatformTracking({ pillar: 'care', pet: petObj, channel: 'health_vault' });

  const petName = summary?.pet_name || 'your dog';
  const petBreed = summary?.pet_breed || '';

  // ── Upcoming vaccines (for Mira Alert Bar) ────────────────────────────
  const upcomingVaccines = useMemo(() => {
    const today = new Date();
    return vaccines.filter(v => {
      if (!v.next_due_date) return false;
      const days = Math.ceil((new Date(v.next_due_date) - today) / 86400000);
      return days > 0 && days <= 14;
    }).map(v => ({
      ...v,
      daysUntil: Math.ceil((new Date(v.next_due_date) - today) / 86400000),
    }));
  }, [vaccines]);

  // ── Auto-alert for upcoming vaccines ─────────────────────────────────
  useEffect(() => {
    if (!upcomingVaccines.length || !summary) return;
    upcomingVaccines.forEach(v => {
      urgent(
        `${v.vaccine_name} vaccine due in ${v.daysUntil} days for ${petName}. Concierge® can book vet.`,
        { channel: 'vault_vaccine_due', metadata: { vaccine: v.vaccine_name, due_date: v.next_due_date, days_until: v.daysUntil } }
      );
    });
  }, [upcomingVaccines.length, summary?.pet_id]); // eslint-disable-line

  // ── Fetch data ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!petId) return;
    fetchAll();
  }, [petId]); // eslint-disable-line

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchSummary(), fetchVaccines(), fetchMedications(), fetchVisits(), fetchVets(), fetchAllergies(), fetchDocuments()]);
    setLoading(false);
  };

  const fetchSummary = async () => {
    try {
      const res = await fetch(`${API_URL}/api/pet-vault/${petId}/summary`);
      if (res.ok) setSummary(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchVaccines = async () => {
    try {
      const res = await fetch(`${API_URL}/api/pet-vault/${petId}/vaccines`);
      if (res.ok) setVaccines((await res.json()).vaccines || []);
    } catch (e) { console.error(e); }
  };

  const fetchMedications = async () => {
    try {
      const res = await fetch(`${API_URL}/api/pet-vault/${petId}/medications`);
      if (res.ok) setMedications((await res.json()).medications || []);
    } catch (e) { console.error(e); }
  };

  const fetchVisits = async () => {
    try {
      const res = await fetch(`${API_URL}/api/pet-vault/${petId}/visits`);
      if (res.ok) setVisits((await res.json()).visits || []);
    } catch (e) { console.error(e); }
  };

  const fetchVets = async () => {
    try {
      const res = await fetch(`${API_URL}/api/pet-vault/${petId}/vets`);
      if (res.ok) setVets((await res.json()).vets || []);
    } catch (e) { console.error(e); }
  };

  const fetchAllergies = async () => {
    try {
      const res = await fetch(`${API_URL}/api/pet-vault/${petId}/allergies`);
      if (res.ok) setAllergies((await res.json()).allergies || []);
    } catch (e) { console.error(e); }
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${API_URL}/api/pet-vault/${petId}/documents`);
      if (res.ok) setDocuments((await res.json()).documents || []);
    } catch (e) { console.error(e); }
  };

  const formatDate = (d) => {
    if (!d) return 'N/A';
    try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return d; }
  };

  const getDaysUntil = (dateStr) => {
    if (!dateStr) return null;
    try {
      const due = new Date(dateStr); const today = new Date();
      today.setHours(0,0,0,0); due.setHours(0,0,0,0);
      return Math.ceil((due - today) / 86400000);
    } catch { return null; }
  };

  // ── Handlers (wired) ──────────────────────────────────────────────────
  const handleAddVaccine = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/pet-vault/${petId}/vaccines`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vaccineForm),
      });
      if (res.ok) {
        setShowAddVaccine(false);
        setVaccineForm({ vaccine_name: '', date_given: '', next_due_date: '', vet_name: '', notes: '', reminder_enabled: true });
        await request(`Vaccine recorded: ${vaccineForm.vaccine_name} for ${petName} on ${vaccineForm.date_given}`, {
          channel: 'vault_vaccine_add', metadata: { vaccine: vaccineForm.vaccine_name, date: vaccineForm.date_given, vet: vaccineForm.vet_name },
        });
        await saveSoulAnswer(petId, 'vaccination_status', 'up_to_date', token);
        toast.success(`Vaccine recorded. Concierge® has been notified.`);
        fetchVaccines(); fetchSummary();
      }
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleAddMedication = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/pet-vault/${petId}/medications`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(medForm),
      });
      if (res.ok) {
        setShowAddMedication(false);
        setMedForm({ medication_name: '', dosage: '', frequency: '', start_date: '', reason: '' });
        await request(`Medication added: ${medForm.medication_name} (${medForm.frequency}) for ${petName}`, {
          channel: 'vault_medication_add', metadata: { medication: medForm.medication_name, frequency: medForm.frequency },
        });
        toast.success('Medication saved. Mira has been updated.');
        fetchMedications(); fetchSummary();
      }
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleAddVet = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/pet-vault/${petId}/vets`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vetForm),
      });
      if (res.ok) {
        setShowAddVet(false);
        setVetForm({ name: '', clinic_name: '', phone: '', address: '', is_primary: false });
        await request(`New vet saved: ${vetForm.name} — ${vetForm.clinic_name} for ${petName}`, {
          channel: 'vault_vet_saved',
        });
        await saveSoulAnswer(petId, 'has_regular_vet', 'yes', token);
        toast.success('Vet saved to vault.');
        fetchVets(); fetchSummary();
      }
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleAddVisit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/pet-vault/${petId}/visits`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...visitForm, cost: visitForm.cost ? parseFloat(visitForm.cost) : null }),
      });
      if (res.ok) {
        setShowAddVisit(false);
        setVisitForm({ visit_date: '', vet_name: '', reason: '', diagnosis: '', treatment: '', cost: '' });
        await request(`Vet visit logged: ${visitForm.reason} — ${visitForm.vet_name} on ${visitForm.visit_date}`, {
          channel: 'vault_vet_visit', metadata: { reason: visitForm.reason, vet: visitForm.vet_name, outcome: visitForm.diagnosis },
        });
        toast.success('Visit logged. Mira knows.');
        fetchVisits(); fetchSummary();
      }
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleAddWeight = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/pet-vault/${petId}/weight`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...weightForm, weight_kg: parseFloat(weightForm.weight_kg) }),
      });
      if (res.ok) {
        setShowAddWeight(false);
        const kg = parseFloat(weightForm.weight_kg);
        await request(`Weight logged: ${petName} is ${kg}kg on ${weightForm.date}`, {
          channel: 'vault_weight_log', metadata: { weight_kg: kg, date: weightForm.date },
        });
        const ideal = getIdealWeight(petBreed);
        if (kg < ideal.min || kg > ideal.max) {
          await request(
            `Weight alert: ${petName} is ${kg}kg — ideal for ${petBreed || 'this breed'} is ${ideal.min}–${ideal.max}kg`,
            { channel: 'vault_weight_alert', urgency: 'normal' }
          );
          toast.warning(`Weight logged. Note: ideal range is ${ideal.min}–${ideal.max}kg. Mira has been notified.`);
        } else {
          toast.success('Weight logged.');
        }
        setWeightForm({ date: '', weight_kg: '' });
        fetchSummary();
      }
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleAddAllergy = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/pet-vault/${petId}/allergies`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(allergyForm),
      });
      if (res.ok) {
        const data = await res.json();
        setAllergies(prev => [...prev, data.allergy]);
        setShowAddAllergy(false);
        setAllergyForm({ name: '', allergy_type: 'food', confirmed_by: '', severity: 'moderate', notes: '' });
        // Fire URGENT — admin + Mira must know immediately
        await urgent(
          `NEW ALLERGY ADDED: ${petName} is allergic to ${allergyForm.name} — update ALL recommendations immediately`,
          { channel: 'vault_allergy_add', metadata: { allergy: allergyForm.name, confirmed_by: allergyForm.confirmed_by, severity: allergyForm.severity } }
        );
        toast.success(`Allergy saved. Mira will never suggest ${allergyForm.name} for ${petName} again.`);
      }
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  // ── Tabs config ───────────────────────────────────────────────────────
  const tabs = [
    { id: 'overview',   label: 'Overview',    icon: ClipboardList },
    { id: 'allergies',  label: 'Allergies',   icon: AlertTriangle, alert: allergies.length > 0 },
    { id: 'vaccines',   label: 'Vaccines',    icon: Syringe,  alert: upcomingVaccines.length > 0 },
    { id: 'medications',label: 'Meds',        icon: Pill },
    { id: 'visits',     label: 'Visits',      icon: Stethoscope },
    { id: 'vets',       label: 'Vets',        icon: UserCircle },
    { id: 'identity',   label: 'Identity',    icon: Shield },
    { id: 'documents',  label: 'Documents',   icon: FileText },
  ];

  if (loading) return (
    <div style={{ minHeight: '100vh', background: G.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <Loader2 style={{ width: 40, height: 40, color: G.green, margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: G.muted, fontSize: 14 }}>Loading Health Vault…</p>
      </div>
    </div>
  );

  if (!summary) return (
    <div style={{ minHeight: '100vh', background: G.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: G.muted }}>Pet not found</p>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: G.bg, fontFamily: 'inherit' }}>

      {/* ── Header ── */}
      <div style={{ background: 'rgba(0,0,0,0.6)', borderBottom: `1px solid ${G.border}`, position: 'sticky', top: 0, zIndex: 30, backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            data-testid="vault-back-btn"
            onClick={() => navigate(-1)}
            style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 8, padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <ChevronLeft style={{ width: 18, height: 18, color: G.cream }} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Heart style={{ width: 16, height: 16, color: G.green }} />
              <span style={{ fontSize: 16, fontWeight: 700, color: G.cream }}>{petName}'s Health Vault</span>
            </div>
            {petBreed && <p style={{ fontSize: 11, color: G.muted, marginTop: 2 }}>{petBreed} · Care Record</p>}
          </div>
          {summary.current_weight_kg && (
            <div style={{ background: G.greenMuted, border: `1px solid ${G.greenBorder}`, borderRadius: 8, padding: '4px 10px', fontSize: 12, color: G.green, fontWeight: 600 }}>
              {summary.current_weight_kg}kg
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '16px 16px 80px' }}>

        {/* ── Mira Alert Bar ── */}
        {upcomingVaccines.length > 0 && (
          <div style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 14, padding: '14px 16px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <AlertTriangle style={{ width: 18, height: 18, color: '#EF4444', marginTop: 1, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#EF4444', marginBottom: 3 }}>
                {upcomingVaccines[0].vaccine_name} due in {upcomingVaccines[0].daysUntil} day{upcomingVaccines[0].daysUntil !== 1 ? 's' : ''}
              </p>
              <p style={{ fontSize: 12, color: G.muted }}>
                Mira can book a vet appointment for {petName} →{' '}
                <button
                  data-testid="vault-book-vaccine-btn"
                  onClick={() => request(`Book vet appointment for ${upcomingVaccines[0].vaccine_name} vaccine for ${petName}`, { channel: 'vault_book_vaccine_vet', urgency: 'normal' })}
                  style={{ background: 'none', border: 'none', color: G.gold, fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}
                >
                  Book via Concierge®
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ── Quick Stats ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
          {[
            { icon: Syringe,     count: summary.summary.total_vaccines,    label: 'Vaccines',    tab: 'vaccines',    color: '#3B82F6', alert: upcomingVaccines.length > 0 },
            { icon: Pill,        count: summary.summary.active_medications, label: 'Active Meds', tab: 'medications', color: '#10B981' },
            { icon: Stethoscope, count: summary.summary.total_vet_visits,   label: 'Vet Visits',  tab: 'visits',      color: '#8B5CF6' },
            { icon: AlertTriangle,count: allergies.length,                  label: 'Allergies',   tab: 'allergies',   color: '#EF4444', alert: allergies.length > 0 },
          ].map(({ icon: Icon, count, label, tab, color, alert }) => (
            <div
              key={tab}
              data-testid={`vault-stat-${tab}`}
              onClick={() => setActiveTab(tab)}
              style={{ ...card, padding: '12px 8px', textAlign: 'center', cursor: 'pointer', border: `1px solid ${alert ? 'rgba(239,68,68,0.3)' : G.border}` }}
            >
              <Icon style={{ width: 22, height: 22, color, margin: '0 auto 6px' }} />
              <div style={{ fontSize: 20, fontWeight: 700, color: G.cream }}>{count}</div>
              <div style={{ fontSize: 10, color: G.muted }}>{label}</div>
            </div>
          ))}
        </div>

        {/* ── Tab Nav ── */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 20, paddingBottom: 4 }}>
          {tabs.map(({ id, label, icon: Icon, alert }) => (
            <button
              key={id}
              data-testid={`vault-tab-${id}`}
              onClick={() => setActiveTab(id)}
              style={{
                flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5,
                padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', border: 'none', fontFamily: 'inherit',
                background: activeTab === id ? G.green : G.surface,
                color: activeTab === id ? '#fff' : G.muted,
                position: 'relative',
              }}
            >
              <Icon style={{ width: 13, height: 13 }} />
              {label}
              {alert && (
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444', position: 'absolute', top: 4, right: 4 }} />
              )}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════
            TAB: OVERVIEW
        ═══════════════════════════════════════════════*/}
        {activeTab === 'overview' && (
          <div>
            {/* Active Meds */}
            {summary.active_medications?.length > 0 && (
              <div style={card}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#10B981', letterSpacing: '0.1em', marginBottom: 10 }}>ACTIVE MEDICATIONS</p>
                {summary.active_medications.map((med, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < summary.active_medications.length - 1 ? `1px solid ${G.border}` : 'none' }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: G.cream }}>{med.medication_name}</p>
                      <p style={{ fontSize: 12, color: G.muted }}>{med.dosage} · {med.frequency}</p>
                    </div>
                    <CheckCircle style={{ width: 16, height: 16, color: '#10B981' }} />
                  </div>
                ))}
              </div>
            )}

            {/* Last Visit */}
            {summary.last_visit && (
              <div style={card}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#8B5CF6', letterSpacing: '0.1em', marginBottom: 10 }}>LAST VET VISIT</p>
                <p style={{ fontSize: 15, fontWeight: 600, color: G.cream, marginBottom: 4 }}>{summary.last_visit.reason}</p>
                <p style={{ fontSize: 12, color: G.muted }}>{summary.last_visit.vet_name} · {formatDate(summary.last_visit.visit_date)}</p>
                {summary.last_visit.diagnosis && <p style={{ fontSize: 12, color: G.muted, marginTop: 4 }}>Diagnosis: {summary.last_visit.diagnosis}</p>}
              </div>
            )}

            {/* Weight */}
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: G.gold, letterSpacing: '0.1em' }}>WEIGHT TRACKER</p>
                <button data-testid="vault-log-weight-btn" onClick={() => setShowAddWeight(true)} style={{ background: 'rgba(201,151,58,0.1)', border: '1px solid rgba(201,151,58,0.25)', borderRadius: 6, padding: '5px 10px', fontSize: 11, color: G.gold, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Plus style={{ width: 12, height: 12 }} /> Log
                </button>
              </div>
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <span style={{ fontSize: 36, fontWeight: 700, color: G.cream }}>{summary.current_weight_kg || '--'}</span>
                <span style={{ fontSize: 16, color: G.muted }}> kg</span>
                {summary.last_weight_record && <p style={{ fontSize: 11, color: G.muted, marginTop: 4 }}>Logged {formatDate(summary.last_weight_record.date)}</p>}
              </div>
              {petBreed && (() => {
                const ideal = getIdealWeight(petBreed);
                const kg = summary.current_weight_kg;
                if (!kg) return null;
                const ok = kg >= ideal.min && kg <= ideal.max;
                return (
                  <p style={{ fontSize: 11, color: ok ? '#10B981' : '#EF4444', textAlign: 'center', marginTop: 4 }}>
                    {ok ? `Ideal for ${petBreed} (${ideal.min}–${ideal.max}kg)` : `Outside ideal for ${petBreed} (${ideal.min}–${ideal.max}kg)`}
                  </p>
                );
              })()}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            TAB: ALLERGIES
        ═══════════════════════════════════════════════*/}
        {activeTab === 'allergies' && (
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: G.red, letterSpacing: '0.1em', marginBottom: 14 }}>
              ALLERGIES & CONDITIONS — CRITICAL HEALTH DATA
            </p>
            <p style={{ fontSize: 12, color: G.muted, marginBottom: 16, lineHeight: 1.6 }}>
              Every allergy you record here is immediately saved to {petName}'s soul profile. Mira will never suggest that ingredient again.
            </p>

            {allergies.length > 0 ? allergies.map((a, i) => (
              <div key={i} style={{ background: G.redMuted, border: `1px solid ${G.redBorder}`, borderRadius: 12, padding: '12px 14px', marginBottom: 8 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#F87171', marginBottom: 3 }}>
                  {a.allergy_type === 'food' ? 'FOOD ALLERGY — CRITICAL' : (a.allergy_type || 'ALLERGY').toUpperCase()}
                </p>
                <p style={{ fontSize: 16, color: '#FCA5A5', fontWeight: 700 }}>No {a.name} — ever</p>
                {a.severity && <p style={{ fontSize: 11, color: 'rgba(245,240,232,0.4)', marginTop: 4 }}>Severity: {a.severity}</p>}
                {a.confirmed_by && <p style={{ fontSize: 11, color: 'rgba(245,240,232,0.4)', marginTop: 2 }}>Confirmed by {a.confirmed_by}{a.date ? ` · ${formatDate(a.date)}` : ''}</p>}
              </div>
            )) : (
              <div style={{ background: G.surface, border: `1px dashed ${G.border}`, borderRadius: 12, padding: '16px', marginBottom: 12, textAlign: 'center' }}>
                <AlertTriangle style={{ width: 28, height: 28, color: 'rgba(239,68,68,0.3)', margin: '0 auto 8px' }} />
                <p style={{ fontSize: 13, color: G.muted }}>No allergies recorded yet.</p>
                <p style={{ fontSize: 11, color: 'rgba(245,240,232,0.3)', marginTop: 4 }}>Add any known allergies — Mira will never suggest them.</p>
              </div>
            )}

            <button
              data-testid="vault-add-allergy-btn"
              onClick={() => setShowAddAllergy(true)}
              style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px dashed rgba(220,38,38,0.25)', background: 'rgba(220,38,38,0.05)', color: '#F87171', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 }}
            >
              + Add allergy or condition
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            TAB: VACCINES
        ═══════════════════════════════════════════════*/}
        {activeTab === 'vaccines' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: G.blue, letterSpacing: '0.1em' }}>VACCINATION RECORDS</p>
              <button data-testid="vault-add-vaccine-btn" onClick={() => setShowAddVaccine(true)} style={{ background: G.blueMuted, border: '1px solid rgba(59,130,246,0.25)', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: G.blue, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Plus style={{ width: 13, height: 13 }} /> Add Vaccine
              </button>
            </div>
            {vaccines.length === 0 ? (
              <div style={{ ...card, textAlign: 'center', padding: '32px 16px' }}>
                <Syringe style={{ width: 36, height: 36, color: 'rgba(59,130,246,0.3)', margin: '0 auto 10px' }} />
                <p style={{ fontSize: 13, color: G.muted }}>No vaccine records yet</p>
              </div>
            ) : vaccines.map((vax, i) => {
              const daysUntil = getDaysUntil(vax.next_due_date);
              const overdue   = daysUntil !== null && daysUntil < 0;
              const dueSoon   = daysUntil !== null && daysUntil >= 0 && daysUntil <= 14;
              return (
                <div key={i} style={{ ...card, border: `1px solid ${overdue ? 'rgba(239,68,68,0.3)' : dueSoon ? 'rgba(234,179,8,0.3)' : G.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <Syringe style={{ width: 16, height: 16, color: overdue ? G.red : dueSoon ? '#EAB308' : G.blue }} />
                        <span style={{ fontSize: 14, fontWeight: 600, color: G.cream }}>{vax.vaccine_name}</span>
                        {vax.reminder_enabled && (
                          <span style={{ fontSize: 10, color: '#10B981', background: 'rgba(16,185,129,0.1)', borderRadius: 4, padding: '2px 6px' }}>
                            <Bell style={{ width: 10, height: 10, display: 'inline', marginRight: 2 }} />Reminder On
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 12, color: G.muted }}>Given: {formatDate(vax.date_given)}{vax.vet_name ? ` · ${vax.vet_name}` : ''}</p>
                      {vax.next_due_date && <p style={{ fontSize: 12, color: overdue ? G.red : dueSoon ? '#EAB308' : G.muted, marginTop: 2 }}>Next due: {formatDate(vax.next_due_date)}</p>}
                    </div>
                    {daysUntil !== null && (
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: overdue ? G.redMuted : dueSoon ? 'rgba(234,179,8,0.1)' : G.blueMuted, color: overdue ? G.red : dueSoon ? '#EAB308' : G.blue }}>
                        {overdue ? `${Math.abs(daysUntil)}d overdue` : daysUntil === 0 ? 'Today!' : `${daysUntil}d`}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══════════════════════════════════════════════
            TAB: MEDICATIONS
        ═══════════════════════════════════════════════*/}
        {activeTab === 'medications' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#10B981', letterSpacing: '0.1em' }}>MEDICATIONS</p>
              <button data-testid="vault-add-medication-btn" onClick={() => setShowAddMedication(true)} style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: '#10B981', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Plus style={{ width: 13, height: 13 }} /> Add Medication
              </button>
            </div>
            {medications.length === 0 && summary.active_medications?.length === 0 ? (
              <div style={{ ...card, textAlign: 'center', padding: '32px 16px' }}>
                <Pill style={{ width: 36, height: 36, color: 'rgba(16,185,129,0.3)', margin: '0 auto 10px' }} />
                <p style={{ fontSize: 13, color: G.muted }}>No medications recorded</p>
              </div>
            ) : (summary.active_medications || []).map((med, i) => (
              <div key={i} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: G.cream }}>{med.medication_name}</p>
                    <p style={{ fontSize: 12, color: G.muted }}>{med.dosage} · {med.frequency}</p>
                    {med.reason && <p style={{ fontSize: 11, color: 'rgba(245,240,232,0.35)', marginTop: 2 }}>{med.reason}</p>}
                  </div>
                  <CheckCircle style={{ width: 18, height: 18, color: '#10B981' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════════════
            TAB: VET VISITS
        ═══════════════════════════════════════════════*/}
        {activeTab === 'visits' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#8B5CF6', letterSpacing: '0.1em' }}>VET VISITS</p>
              <button data-testid="vault-add-visit-btn" onClick={() => setShowAddVisit(true)} style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: '#8B5CF6', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Plus style={{ width: 13, height: 13 }} /> Log Visit
              </button>
            </div>
            {visits.length === 0 ? (
              <div style={{ ...card, textAlign: 'center', padding: '32px 16px' }}>
                <Stethoscope style={{ width: 36, height: 36, color: 'rgba(139,92,246,0.3)', margin: '0 auto 10px' }} />
                <p style={{ fontSize: 13, color: G.muted }}>No vet visits recorded</p>
              </div>
            ) : visits.map((v, i) => (
              <div key={i} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: G.cream }}>{v.reason}</p>
                  <span style={{ fontSize: 11, color: G.muted }}>{formatDate(v.visit_date)}</span>
                </div>
                <p style={{ fontSize: 12, color: G.muted }}>{v.vet_name}{v.clinic_name ? ` · ${v.clinic_name}` : ''}</p>
                {v.diagnosis && <p style={{ fontSize: 12, color: G.muted, marginTop: 4 }}>Diagnosis: {v.diagnosis}</p>}
                {v.cost && <p style={{ fontSize: 12, color: G.gold, marginTop: 4 }}>Cost: ₹{v.cost}</p>}
              </div>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════════════
            TAB: SAVED VETS
        ═══════════════════════════════════════════════*/}
        {activeTab === 'vets' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: G.gold, letterSpacing: '0.1em' }}>SAVED VETS & GROOMERS</p>
              <button data-testid="vault-add-vet-btn" onClick={() => setShowAddVet(true)} style={{ background: 'rgba(201,151,58,0.1)', border: '1px solid rgba(201,151,58,0.25)', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: G.gold, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Plus style={{ width: 13, height: 13 }} /> Add Vet
              </button>
            </div>
            {vets.length === 0 ? (
              <div style={{ ...card, textAlign: 'center', padding: '32px 16px' }}>
                <UserCircle style={{ width: 36, height: 36, color: 'rgba(201,151,58,0.3)', margin: '0 auto 10px' }} />
                <p style={{ fontSize: 13, color: G.muted }}>No vets saved yet</p>
              </div>
            ) : vets.map((v, i) => (
              <div key={i} style={{ ...card, border: v.is_primary ? `1px solid ${G.greenBorder}` : `1px solid ${G.border}` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: G.greenMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <UserCircle style={{ width: 22, height: 22, color: G.green }} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: G.cream }}>{v.name}</p>
                      {v.is_primary && <span style={{ fontSize: 10, background: G.greenMuted, color: G.green, borderRadius: 4, padding: '2px 6px', fontWeight: 700 }}>Primary</span>}
                    </div>
                    {v.clinic_name && <p style={{ fontSize: 12, color: G.muted, marginTop: 2 }}>{v.clinic_name}</p>}
                    {v.phone && <a href={`tel:${v.phone}`} style={{ fontSize: 12, color: G.green, display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}><Phone style={{ width: 11, height: 11 }} />{v.phone}</a>}
                    {v.address && <p style={{ fontSize: 11, color: 'rgba(245,240,232,0.35)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}><MapPin style={{ width: 11, height: 11 }} />{v.address}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════════════
            TAB: IDENTITY & INSURANCE
        ═══════════════════════════════════════════════*/}
        {activeTab === 'identity' && (
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#3498DB', letterSpacing: '0.1em', marginBottom: 14 }}>IDENTITY & INSURANCE</p>

            {/* Microchip */}
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: G.muted }}>Microchip</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: G.cream }}>{summary.microchip || 'Not recorded'}</span>
              </div>
              {!summary.microchip && (
                <button
                  data-testid="vault-microchip-concierge-btn"
                  onClick={() => request(`Help getting microchip for ${petName}`, { channel: 'vault_microchip_enquiry' })}
                  style={{ background: 'none', border: 'none', color: G.gold, fontSize: 11, cursor: 'pointer', padding: '6px 0 0', fontFamily: 'inherit' }}
                >
                  Concierge® can help register a microchip →
                </button>
              )}
            </div>

            {/* Insurance */}
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: summary.insurance?.provider ? 6 : 0 }}>
                <span style={{ fontSize: 13, color: G.muted }}>Insurance</span>
                <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: summary.insurance?.active ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: summary.insurance?.active ? '#6EE7B7' : '#FCD34D' }}>
                  {summary.insurance?.active ? 'Active' : 'Not active'}
                </span>
              </div>
              {summary.insurance?.provider && (
                <p style={{ fontSize: 12, color: G.muted }}>{summary.insurance.provider}{summary.insurance.renewal_date ? ` · Renews ${formatDate(summary.insurance.renewal_date)}` : ''}</p>
              )}
              {!summary.insurance?.active && (
                <button
                  data-testid="vault-insurance-concierge-btn"
                  onClick={() => request(`Help getting pet insurance for ${petName}`, { channel: 'vault_insurance_enquiry' })}
                  style={{ background: 'none', border: 'none', color: G.gold, fontSize: 11, cursor: 'pointer', padding: '6px 0 0', fontFamily: 'inherit' }}
                >
                  Concierge® can help you get insured →
                </button>
              )}
            </div>

            {/* Pet Passport */}
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: G.muted }}>Pet Passport</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: G.cream }}>
                  {summary.passport === 'yes' ? 'Has passport' : summary.passport === 'pending' ? 'In progress' : 'Not yet'}
                </span>
              </div>
              {summary.passport !== 'yes' && (
                <button
                  data-testid="vault-passport-concierge-btn"
                  onClick={() => request(`Help applying for pet passport for ${petName}`, { channel: 'vault_passport_enquiry' })}
                  style={{ background: 'none', border: 'none', color: G.gold, fontSize: 11, cursor: 'pointer', padding: '6px 0 0', fontFamily: 'inherit' }}
                >
                  Concierge® can help apply →
                </button>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            TAB: DOCUMENTS
        ═══════════════════════════════════════════════*/}
        {activeTab === 'documents' && (
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#8B5CF6', letterSpacing: '0.1em', marginBottom: 14 }}>DOCUMENTS</p>
            {documents.length === 0 ? (
              <div style={{ ...card, textAlign: 'center', padding: '32px 16px' }}>
                <FileText style={{ width: 36, height: 36, color: 'rgba(139,92,246,0.3)', margin: '0 auto 10px' }} />
                <p style={{ fontSize: 13, color: G.muted }}>No documents uploaded yet</p>
                <p style={{ fontSize: 11, color: 'rgba(245,240,232,0.25)', marginTop: 4 }}>Adoption certificate, vaccination card, insurance — all in one place</p>
              </div>
            ) : documents.map((doc, i) => (
              <div key={i} style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FileCheck style={{ width: 18, height: 18, color: '#8B5CF6' }} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: G.cream }}>{doc.name}</p>
                    {doc.document_type && <p style={{ fontSize: 11, color: G.muted, textTransform: 'capitalize' }}>{doc.document_type.replace('_', ' ')}</p>}
                  </div>
                </div>
                {doc.file_url && (
                  <a href={doc.file_url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#9B59B6', textDecoration: 'none' }}>View →</a>
                )}
              </div>
            ))}
            <button
              data-testid="vault-upload-document-btn"
              onClick={() => request(`Document upload request for ${petName}`, { channel: 'vault_document_upload' })}
              style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px dashed rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.03)', color: G.muted, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 }}
            >
              + Upload document (PDF or image) — Concierge® will assist
            </button>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════
          MODALS
      ═══════════════════════════════════════════════*/}

      {/* Add Vaccine Modal */}
      {showAddVaccine && <Modal title="Add Vaccine Record" onClose={() => setShowAddVaccine(false)}>
        <form onSubmit={handleAddVaccine}>
          <Field label="Vaccine Name *"><input data-testid="vaccine-name-input" required value={vaccineForm.vaccine_name} onChange={e => setVaccineForm({...vaccineForm, vaccine_name: e.target.value})} placeholder="e.g., Rabies, DHPP" style={inputStyle} /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Date Given *"><input data-testid="vaccine-date-input" type="date" required value={vaccineForm.date_given} onChange={e => setVaccineForm({...vaccineForm, date_given: e.target.value})} style={inputStyle} /></Field>
            <Field label="Next Due Date"><input data-testid="vaccine-due-input" type="date" value={vaccineForm.next_due_date} onChange={e => setVaccineForm({...vaccineForm, next_due_date: e.target.value})} style={inputStyle} /></Field>
          </div>
          <Field label="Vet Name"><input value={vaccineForm.vet_name} onChange={e => setVaccineForm({...vaccineForm, vet_name: e.target.value})} placeholder="Dr. Smith" style={inputStyle} /></Field>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 0', borderTop: `1px solid ${G.border}` }}>
            <Bell style={{ width: 15, height: 15, color: G.green }} />
            <span style={{ flex: 1, fontSize: 13, color: G.cream }}>Set reminder (7 days before due date)</span>
            <input type="checkbox" checked={vaccineForm.reminder_enabled} onChange={e => setVaccineForm({...vaccineForm, reminder_enabled: e.target.checked})} />
          </label>
          <ModalButtons saving={saving} onClose={() => setShowAddVaccine(false)} />
        </form>
      </Modal>}

      {/* Add Medication Modal */}
      {showAddMedication && <Modal title="Add Medication" onClose={() => setShowAddMedication(false)}>
        <form onSubmit={handleAddMedication}>
          <Field label="Medication Name *"><input data-testid="med-name-input" required value={medForm.medication_name} onChange={e => setMedForm({...medForm, medication_name: e.target.value})} placeholder="e.g., Nexgard, Apoquel" style={inputStyle} /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Dosage *"><input required value={medForm.dosage} onChange={e => setMedForm({...medForm, dosage: e.target.value})} placeholder="68mg" style={inputStyle} /></Field>
            <Field label="Frequency *"><input required value={medForm.frequency} onChange={e => setMedForm({...medForm, frequency: e.target.value})} placeholder="once daily" style={inputStyle} /></Field>
          </div>
          <Field label="Start Date *"><input type="date" required value={medForm.start_date} onChange={e => setMedForm({...medForm, start_date: e.target.value})} style={inputStyle} /></Field>
          <Field label="Reason"><input value={medForm.reason} onChange={e => setMedForm({...medForm, reason: e.target.value})} placeholder="Flea prevention" style={inputStyle} /></Field>
          <ModalButtons saving={saving} onClose={() => setShowAddMedication(false)} />
        </form>
      </Modal>}

      {/* Add Vet Modal */}
      {showAddVet && <Modal title="Add Veterinarian" onClose={() => setShowAddVet(false)}>
        <form onSubmit={handleAddVet}>
          <Field label="Vet Name *"><input data-testid="vet-name-input" required value={vetForm.name} onChange={e => setVetForm({...vetForm, name: e.target.value})} placeholder="Dr. Smith" style={inputStyle} /></Field>
          <Field label="Clinic Name"><input value={vetForm.clinic_name} onChange={e => setVetForm({...vetForm, clinic_name: e.target.value})} placeholder="Happy Paws Clinic" style={inputStyle} /></Field>
          <Field label="Phone"><input value={vetForm.phone} onChange={e => setVetForm({...vetForm, phone: e.target.value})} placeholder="9876543210" style={inputStyle} /></Field>
          <Field label="Address"><input value={vetForm.address} onChange={e => setVetForm({...vetForm, address: e.target.value})} placeholder="123 Pet Street" style={inputStyle} /></Field>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 0', fontSize: 13, color: G.cream }}>
            <input type="checkbox" checked={vetForm.is_primary} onChange={e => setVetForm({...vetForm, is_primary: e.target.checked})} />
            Set as primary vet
          </label>
          <ModalButtons saving={saving} onClose={() => setShowAddVet(false)} />
        </form>
      </Modal>}

      {/* Add Visit Modal */}
      {showAddVisit && <Modal title="Log Vet Visit" onClose={() => setShowAddVisit(false)}>
        <form onSubmit={handleAddVisit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Visit Date *"><input data-testid="visit-date-input" type="date" required value={visitForm.visit_date} onChange={e => setVisitForm({...visitForm, visit_date: e.target.value})} style={inputStyle} /></Field>
            <Field label="Vet Name *"><input required value={visitForm.vet_name} onChange={e => setVisitForm({...visitForm, vet_name: e.target.value})} placeholder="Dr. Smith" style={inputStyle} /></Field>
          </div>
          <Field label="Reason *"><input required value={visitForm.reason} onChange={e => setVisitForm({...visitForm, reason: e.target.value})} placeholder="Annual checkup" style={inputStyle} /></Field>
          <Field label="Diagnosis"><input value={visitForm.diagnosis} onChange={e => setVisitForm({...visitForm, diagnosis: e.target.value})} placeholder="What did the vet find?" style={inputStyle} /></Field>
          <Field label="Treatment"><input value={visitForm.treatment} onChange={e => setVisitForm({...visitForm, treatment: e.target.value})} placeholder="Prescribed medications…" style={inputStyle} /></Field>
          <Field label="Cost (₹)"><input type="number" value={visitForm.cost} onChange={e => setVisitForm({...visitForm, cost: e.target.value})} placeholder="2500" style={inputStyle} /></Field>
          <ModalButtons saving={saving} onClose={() => setShowAddVisit(false)} />
        </form>
      </Modal>}

      {/* Add Weight Modal */}
      {showAddWeight && <Modal title="Log Weight" onClose={() => setShowAddWeight(false)}>
        <form onSubmit={handleAddWeight}>
          <Field label="Date *"><input data-testid="weight-date-input" type="date" required value={weightForm.date} onChange={e => setWeightForm({...weightForm, date: e.target.value})} style={inputStyle} /></Field>
          <Field label="Weight (kg) *"><input data-testid="weight-kg-input" type="number" step="0.1" required value={weightForm.weight_kg} onChange={e => setWeightForm({...weightForm, weight_kg: e.target.value})} placeholder="15.5" style={inputStyle} /></Field>
          {petBreed && (() => {
            const ideal = getIdealWeight(petBreed);
            return <p style={{ fontSize: 11, color: G.muted, marginTop: 4 }}>Ideal for {petBreed}: {ideal.min}–{ideal.max}kg</p>;
          })()}
          <ModalButtons saving={saving} onClose={() => setShowAddWeight(false)} />
        </form>
      </Modal>}

      {/* Add Allergy Modal */}
      {showAddAllergy && <Modal title="Add Allergy or Condition" onClose={() => setShowAddAllergy(false)}>
        <div style={{ background: G.redMuted, border: `1px solid ${G.redBorder}`, borderRadius: 10, padding: '10px 12px', marginBottom: 14 }}>
          <p style={{ fontSize: 12, color: '#FCA5A5', fontWeight: 600 }}>This will immediately update {petName}'s soul profile. Mira will never suggest this allergen again.</p>
        </div>
        <form onSubmit={handleAddAllergy}>
          <Field label="Allergen / Condition *"><input data-testid="allergy-name-input" required value={allergyForm.name} onChange={e => setAllergyForm({...allergyForm, name: e.target.value})} placeholder="e.g., Chicken, Pollen, Penicillin" style={inputStyle} /></Field>
          <Field label="Type">
            <select value={allergyForm.allergy_type} onChange={e => setAllergyForm({...allergyForm, allergy_type: e.target.value})} style={inputStyle}>
              <option value="food">Food Allergy</option>
              <option value="environmental">Environmental</option>
              <option value="medication">Medication</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Severity">
            <select value={allergyForm.severity} onChange={e => setAllergyForm({...allergyForm, severity: e.target.value})} style={inputStyle}>
              <option value="mild">Mild</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
            </select>
          </Field>
          <Field label="Confirmed by (vet name)"><input value={allergyForm.confirmed_by} onChange={e => setAllergyForm({...allergyForm, confirmed_by: e.target.value})} placeholder="Dr. Smith" style={inputStyle} /></Field>
          <ModalButtons saving={saving} onClose={() => setShowAddAllergy(false)} label="Save & Alert Mira" />
        </form>
      </Modal>}

    </div>
  );
};

// ── Small reusable pieces ─────────────────────────────────────────────────
const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13, color: '#F5F0E8',
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
};

const Field = ({ label, children }) => (
  <div style={{ marginBottom: 12 }}>
    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'rgba(245,240,232,0.5)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
    {children}
  </div>
);

const Modal = ({ title, onClose, children }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
    <div style={{ background: '#1C1C1E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 20, width: '100%', maxWidth: 440, maxHeight: '90vh', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#F5F0E8', margin: 0 }}>{title}</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(245,240,232,0.4)', padding: 4 }}><X style={{ width: 18, height: 18 }} /></button>
      </div>
      {children}
    </div>
  </div>
);

const ModalButtons = ({ saving, onClose, label = 'Save' }) => (
  <div style={{ display: 'flex', gap: 10, marginTop: 18, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
    <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'none', color: 'rgba(245,240,232,0.5)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
    <button type="submit" disabled={saving} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: '#40916C', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
      {saving && <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />}
      {saving ? 'Saving…' : label}
    </button>
  </div>
);

export default PetVault;
