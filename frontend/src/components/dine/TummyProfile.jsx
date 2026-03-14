/**
 * TummyProfile.jsx — The data spine of /dine
 *
 * Collapsed: 64px bar — Loves chips / Avoid chips / Goal chip / expand caret
 * Expanded:  4-cell grid (Loves · Avoid · Goal · Health Note) + Mira filter message
 *            Goal is editable (nutrition_goal field) — saves to pet profile on Update
 *
 * Build order: This is always built first. Everything else reads from TummyProfile.
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useResizeMobile } from '../../hooks/useResizeMobile';
import { getApiUrl } from '../../utils/api';

const GOAL_OPTIONS = [
  { value: 'maintenance', label: 'Healthy maintenance' },
  { value: 'weight_loss',  label: 'Gradual weight loss' },
  { value: 'weight_gain',  label: 'Healthy weight gain' },
  { value: 'muscle',       label: 'Muscle & strength' },
  { value: 'senior',       label: 'Senior wellness' },
  { value: 'puppy',        label: 'Puppy growth' },
];

// ── helpers ──────────────────────────────────────────────────────────────────

function mergeAllergies(pet) {
  const s = new Set();
  const add = (v) => {
    if (Array.isArray(v)) v.forEach(x => x && s.add(String(x)));
    else if (v) s.add(String(v));
  };
  add(pet?.preferences?.allergies);
  add(pet?.doggy_soul_answers?.food_allergies);
  add(pet?.doggy_soul_answers?.allergies);
  add(pet?.allergies);
  return [...s].filter(a => a.toLowerCase() !== 'none' && a.toLowerCase() !== 'unknown');
}

function getLoves(pet) {
  const flavors = pet?.preferences?.favorite_flavors || [];
  const treats = pet?.doggy_soul_answers?.favorite_treats;
  const treatsArr = Array.isArray(treats) ? treats : (treats ? [treats] : []);
  return [...new Set([...flavors, ...treatsArr])].filter(Boolean).slice(0, 6);
}

function getHealthNote(pet) {
  const note = (
    pet?.health?.medical_conditions ||
    pet?.doggy_soul_answers?.health_conditions ||
    pet?.doggy_soul_answers?.medical_history ||
    null
  );
  if (!note) return null;
  const str = Array.isArray(note) ? note.join(', ') : String(note);
  return str.toLowerCase() === 'none' || str.trim() === '' ? null : str;
}

function getGoalLabel(value) {
  return GOAL_OPTIONS.find(o => o.value === value)?.label || 'Healthy maintenance';
}

// ── sub-components ────────────────────────────────────────────────────────────

const Chip = ({ label, bg, color, border }) => (
  <span style={{
    background: bg, color, border: `1px solid ${border}`,
    borderRadius: 20, padding: '3px 10px',
    fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
  }}>{label}</span>
);

const Cell = ({ title, color, bg, children }) => (
  <div style={{
    background: bg, borderRadius: 14,
    border: `1.5px solid ${color}22`,
    padding: '16px 18px',
  }}>
    <p style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>{title}</p>
    {children}
  </div>
);

// ── main component ────────────────────────────────────────────────────────────

const TummyProfile = ({ pet, token, onUpdate }) => {
  const isMobile = useResizeMobile();
  const [isExpanded, setIsExpanded] = useState(false);
  const [nutritionGoal, setNutritionGoal] = useState(pet?.nutrition_goal || 'maintenance');
  const [saving, setSaving] = useState(false);

  const loves    = getLoves(pet);
  const avoid    = mergeAllergies(pet);
  const healthNote = getHealthNote(pet);
  const petName  = pet?.name || 'your dog';

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/pets/${pet.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nutrition_goal: nutritionGoal }),
      });
      if (!res.ok) throw new Error();
      onUpdate?.({ ...pet, nutrition_goal: nutritionGoal });
      toast.success('Tummy profile updated');
    } catch {
      toast.error('Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── COLLAPSED ────────────────────────────────────────────────────────────────
  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          width: '100%', textAlign: 'left',
          background: '#FFFFFF',
          border: '2px solid #FFE5CC',
          borderRadius: 14, padding: '12px 16px',
          cursor: 'pointer', marginBottom: 20,
          flexWrap: 'wrap',
        }}
        data-testid="tummy-profile-collapsed"
      >
        <span style={{ fontSize: 18 }}>🐾</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#3d1200', marginRight: 4 }}>
          {petName}'s Tummy Profile
        </span>

        {/* summary chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, flex: 1 }}>
          {loves.slice(0, 2).map(f => (
            <Chip key={f} label={`Loves ${f}`} bg="#F0FDF4" color="#166534" border="#BBF7D0" />
          ))}
          {avoid.slice(0, 2).map(a => (
            <Chip key={a} label={`No ${a}`} bg="#FEF2F2" color="#991B1B" border="#FECACA" />
          ))}
          <Chip
            label={getGoalLabel(pet?.nutrition_goal || 'maintenance')}
            bg="#FFF7ED" color="#9A3412" border="#FDBA74"
          />
        </div>

        <ChevronDown size={18} color="#C44400" style={{ flexShrink: 0 }} />
      </button>
    );
  }

  // ── EXPANDED ─────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '2px solid #FFE5CC',
        borderRadius: 20,
        padding: isMobile ? '20px 16px' : '28px 24px',
        marginBottom: 20,
      }}
      data-testid="tummy-profile-expanded"
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>🐾</span>
          <div>
            <p style={{ fontSize: 16, fontWeight: 800, color: '#3d1200', marginBottom: 2 }}>
              {petName}'s Tummy Profile
            </p>
            <p style={{ fontSize: 12, color: '#888' }}>How Mira filters everything on this page</p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
        >
          <ChevronUp size={20} color="#C44400" />
        </button>
      </div>

      {/* 4-cell grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: 12,
        marginBottom: 16,
      }}>
        {/* LOVES */}
        <Cell title="Loves" color="#15803D" bg="#F0FDF4">
          {loves.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {loves.map(f => (
                <Chip key={f} label={f} bg="#DCFCE7" color="#15803D" border="#86EFAC" />
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: '#888' }}>Add favourite flavours in {petName}'s profile</p>
          )}
        </Cell>

        {/* AVOID */}
        <Cell title="Avoid" color="#B91C1C" bg="#FEF2F2">
          {avoid.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {avoid.map(a => (
                <Chip key={a} label={a} bg="#FEE2E2" color="#B91C1C" border="#FECACA" />
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: '#888' }}>No known allergens — showing all options</p>
          )}
        </Cell>

        {/* GOAL (editable) */}
        <Cell title="Nutrition Goal" color="#C44400" bg="#FFF7ED">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select
              value={nutritionGoal}
              onChange={e => setNutritionGoal(e.target.value)}
              style={{
                flex: 1, border: '1.5px solid #FDBA74', borderRadius: 10,
                padding: '6px 10px', fontSize: 13, color: '#3d1200',
                background: '#FFFBF7', outline: 'none', cursor: 'pointer',
              }}
              data-testid="nutrition-goal-select"
            >
              {GOAL_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                background: '#C44400', color: '#fff',
                border: 'none', borderRadius: 10,
                padding: '7px 14px', fontSize: 13, fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                opacity: saving ? 0.7 : 1,
                flexShrink: 0,
              }}
              data-testid="tummy-profile-save"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              {saving ? 'Saving' : 'Update'}
            </button>
          </div>
        </Cell>

        {/* HEALTH NOTE */}
        <Cell title="Health Note" color="#1D4ED8" bg="#EFF6FF">
          {healthNote ? (
            <p style={{ fontSize: 13, color: '#1E40AF', lineHeight: 1.5 }}>
              {healthNote.length > 80 ? healthNote.substring(0, 80) + '…' : healthNote}
            </p>
          ) : (
            <p style={{ fontSize: 13, color: '#888' }}>No health notes added yet</p>
          )}
        </Cell>
      </div>

      {/* Mira filter message */}
      <div style={{
        background: 'rgba(196,68,0,0.06)',
        border: '1px solid rgba(196,68,0,0.15)',
        borderRadius: 12, padding: '12px 16px',
        display: 'flex', alignItems: 'flex-start', gap: 10,
      }}>
        <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>✦</span>
        <p style={{ fontSize: 13, color: '#7a2800', lineHeight: 1.5 }}>
          <strong>Mira filters every product on this page</strong> using the profile above —
          {avoid.length > 0 && ` hiding anything with ${avoid.slice(0, 2).join(' or ')},`}
          {loves.length > 0 && ` surfacing ${loves[0]}-based options first,`}
          {' '}and adjusting picks to {getGoalLabel(nutritionGoal).toLowerCase()}.
        </p>
      </div>
    </div>
  );
};

export default TummyProfile;
