/**
 * BirthdayBoxOrdersAdmin.jsx
 * Service Desk — Birthday Box Orders (Full Phase 1 + 2 + 3)
 * Per ServiceDesk_BirthdayBoxOrders_SPEC.docx (Aditya's canonical spec)
 *
 * 3-column layout: Order List | 6-Slot Manifest | Action Panel (WhatsApp + Status + Log)
 * Mobile: single column with tap-to-open detail
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle, ShieldCheck, Clock, ChevronRight,
  RefreshCw, X, Package, Check, MessageCircle,
  Mail, Phone, ChevronDown, ChevronUp, Edit2, Save,
  FileText, Send, CheckCircle, Truck, Archive, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const API_BASE = process.env.REACT_APP_BACKEND_URL;

/* ─────────────────────────────────────────────────────────────────
   STATUS CONFIG
   ───────────────────────────────────────────────────────────────── */
const STATUS = {
  pending_concierge: { label: 'NEW',        color: '#DC2626', bg: '#FEF2F2', next: 'in_progress' },
  new:               { label: 'NEW',        color: '#DC2626', bg: '#FEF2F2', next: 'in_progress' },
  in_progress:       { label: 'IN PROGRESS',color: '#D97706', bg: '#FFFBEB', next: 'assembled'   },
  assembled:         { label: 'ASSEMBLED',  color: '#2563EB', bg: '#EFF6FF', next: 'dispatched'  },
  dispatched:        { label: 'DISPATCHED', color: '#7C3AED', bg: '#F5F3FF', next: 'delivered'   },
  delivered:         { label: 'DELIVERED',  color: '#16A34A', bg: '#F0FDF4', next: null          },
  cancelled:         { label: 'CANCELLED',  color: '#6B7280', bg: '#F9FAFB', next: null          },
};

const SLOT_LABELS = ['HERO', 'JOY', 'STYLE', 'MEMORY', 'HEALTH', 'SURPRISE'];

const timeAgo = (ts) => {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor(diff / 60000);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  return `${m}m ago`;
};

/* ─────────────────────────────────────────────────────────────────
   STATUS BADGE
   ───────────────────────────────────────────────────────────────── */
const StatusBadge = ({ status, small }) => {
  const s = STATUS[status] || STATUS['new'];
  return (
    <span style={{
      background: s.bg, color: s.color,
      border: `1px solid ${s.color}40`,
      borderRadius: '999px',
      padding: small ? '2px 8px' : '3px 10px',
      fontSize: small ? '10px' : '11px',
      fontWeight: 700, letterSpacing: '0.05em', whiteSpace: 'nowrap'
    }}>
      {s.label}
    </span>
  );
};

/* ─────────────────────────────────────────────────────────────────
   ORDER LIST ROW
   ───────────────────────────────────────────────────────────────── */
const OrderRow = ({ order, isSelected, onClick }) => {
  const isUrgent = order.birthday_urgency;
  const isToday = order.birthday_today;

  return (
    <div
      onClick={onClick}
      data-testid={`order-row-${order.id}`}
      className="cursor-pointer transition-all"
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid #f1f5f9',
        background: isSelected ? '#f0f9ff' : isToday ? '#FEF9C3' : 'white',
        borderLeft: isSelected ? '3px solid #2563EB' : '3px solid transparent',
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-semibold text-sm text-gray-900 truncate">
            {isUrgent && <span className="text-red-600 mr-1">🚨</span>}
            {order.pet_name || 'Pet'}
          </span>
          {order.hasAllergies && (
            <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
          )}
        </div>
        <StatusBadge status={order.status} small />
      </div>
      <p className="text-xs text-gray-500 truncate">{order.user_email || 'No email'}</p>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-xs text-gray-400 font-mono">{order.ticket_id?.slice(0, 12)}</span>
        <span className="text-xs text-gray-400">{timeAgo(order.created_at)}</span>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   ALLERGY ALERT BANNER
   ───────────────────────────────────────────────────────────────── */
const AllergyBanner = ({ petName, allergies, confirmed, orderId, onConfirmed }) => {
  const [confirming, setConfirming] = useState(false);
  if (!allergies?.length) return null;

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/birthday-box-orders/${orderId}/allergy-confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concierge_name: 'concierge' })
      });
      if (res.ok) {
        toast.success('Allergy check confirmed and logged');
        onConfirmed?.();
      }
    } catch { toast.error('Failed to confirm'); }
    finally { setConfirming(false); }
  };

  return (
    <div className="rounded-xl px-4 py-3 flex items-start gap-3 mb-4"
      style={{ background: '#FEF2F2', border: '2px solid #DC2626' }}>
      <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="font-extrabold text-red-800" style={{ fontSize: 15 }}>
          ALLERGY ALERT — {petName}
        </p>
        <p className="text-xs text-red-700 mt-1">
          Known allergens:{' '}
          {allergies.map(a => (
            <span key={a} className="inline-block font-bold uppercase mr-1 px-2 py-0.5 rounded-full"
              style={{ background: '#FCA5A5', color: '#7F1D1D', fontSize: 10 }}>
              {a}
            </span>
          ))}
        </p>
        <p className="text-xs text-red-600 mt-1">
          Do not include any products containing these ingredients. Check every label before packing.
        </p>
        {confirmed ? (
          <p className="text-xs text-green-700 mt-2 font-semibold flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Allergy check confirmed
          </p>
        ) : (
          <button onClick={handleConfirm} disabled={confirming}
            className="mt-2 text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-all"
            style={{ background: '#DC2626' }}
            data-testid="confirm-allergy-btn">
            {confirming ? 'Confirming…' : 'I have checked all items — confirm'}
          </button>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   6-SLOT MANIFEST WITH CHECKBOXES
   ───────────────────────────────────────────────────────────────── */
const SlotManifest = ({ orderId, slots, allergies, slotAssembly, onAssembled }) => {
  const [assemblyState, setAssemblyState] = useState(slotAssembly || {});
  const [saving, setSaving] = useState({});

  const assembledCount = Object.values(assemblyState).filter(v => v?.assembled).length;
  const totalSlots = slots?.length || 6;

  const toggleSlot = async (slotNum, current) => {
    setSaving(p => ({ ...p, [slotNum]: true }));
    try {
      const res = await fetch(`${API_BASE}/api/admin/birthday-box-orders/${orderId}/slot/${slotNum}/assemble`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assembled: !current, concierge_name: 'concierge' })
      });
      if (res.ok) {
        const data = await res.json();
        setAssemblyState(prev => ({
          ...prev,
          [slotNum]: { assembled: !current }
        }));
        if (data.all_assembled) {
          toast.success('All 6 slots assembled! Ready to mark as Assembled.');
          onAssembled?.();
        }
      }
    } catch { toast.error('Failed to update slot'); }
    finally { setSaving(p => ({ ...p, [slotNum]: false })); }
  };

  return (
    <div>
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">6-Slot Manifest</p>
        <span className="text-xs font-semibold" style={{ color: assembledCount === totalSlots ? '#16A34A' : '#D97706' }}>
          {assembledCount} / {totalSlots} assembled
        </span>
      </div>
      <div className="h-1.5 rounded-full mb-3" style={{ background: '#e2e8f0' }}>
        <div className="h-1.5 rounded-full transition-all" style={{
          width: `${(assembledCount / totalSlots) * 100}%`,
          background: assembledCount === totalSlots ? '#16A34A' : '#D97706'
        }} />
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
        {(slots || []).map((slot, i) => {
          const slotNum = slot.slotNumber || (i + 1);
          const slotName = SLOT_LABELS[slotNum - 1] || `SLOT ${slotNum}`;
          const isAssembled = assemblyState[slotNum]?.assembled;
          const isSaving = saving[slotNum];
          const hasAllergenRisk = slot.slotNumber === 5 && allergies?.length > 0;
          const isSafe = slot.isAllergySafe;
          const isConciergeSrc = slot.slotNumber === 4 || slot.slotNumber === 6;

          return (
            <div key={i} className="flex items-center gap-3 transition-colors"
              style={{
                padding: '10px 14px',
                background: isAssembled ? '#F0FDF4' : 'white',
                borderBottom: i < (slots.length - 1) ? '1px solid #f1f5f9' : 'none',
              }}>
              {/* Checkbox */}
              <button
                onClick={() => toggleSlot(slotNum, isAssembled)}
                disabled={isSaving}
                data-testid={`slot-checkbox-${slotNum}`}
                className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center transition-all"
                style={{
                  background: isAssembled ? '#16A34A' : '#fff',
                  border: `2px solid ${isAssembled ? '#16A34A' : '#E0D0C0'}`,
                }}>
                {isSaving
                  ? <RefreshCw className="w-3 h-3 animate-spin text-gray-400" />
                  : isAssembled && <Check className="w-3 h-3 text-white" strokeWidth={3} />
                }
              </button>

              {/* Slot icon */}
              <span className="text-xl flex-shrink-0">{slot.emoji || '📦'}</span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: 11, fontWeight: 700, color: '#7C3AED', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {slotName}
                </p>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }} className="truncate">
                  {slot.itemName || slot.chipLabel || '—'}
                </p>
                {slot.slotNumber === 3 && (
                  <p style={{ fontSize: 11, color: '#64748b' }}>Personalise: name on bandana — confirm spelling</p>
                )}
                {slot.slotNumber === 1 && (
                  <p style={{ fontSize: 11, color: '#64748b' }}>Cake message — confirm with customer</p>
                )}
                {slot.hiddenUntilDelivery && (
                  <span style={{ fontSize: 10, background: '#f5f3ff', color: '#7c3aed', padding: '1px 6px', borderRadius: 999 }}>Surprise</span>
                )}
              </div>

              {/* Safety flag */}
              {isSafe ? (
                <span className="flex-shrink-0 text-xs font-bold rounded-lg px-2 py-0.5"
                  style={{ background: '#dcfce7', color: '#166534' }}>Safe</span>
              ) : hasAllergenRisk ? (
                <span className="flex-shrink-0 text-xs font-bold rounded-lg px-2 py-0.5"
                  style={{ background: '#fef2f2', color: '#dc2626' }}>⚠ Check</span>
              ) : isConciergeSrc ? (
                <span className="flex-shrink-0 text-xs font-bold rounded-lg px-2 py-0.5"
                  style={{ background: '#FFF8E8', color: '#C9973A' }}>👑 Source</span>
              ) : (
                <span className="flex-shrink-0 text-xs text-gray-300">—</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   PERSONALISATION PANEL
   ───────────────────────────────────────────────────────────────── */
const PersonalisationPanel = ({ orderId, personalisation = {}, onSaved }) => {
  const [editing, setEditing] = useState(false);
  const [fields, setFields] = useState({
    bandana_name: personalisation.bandana_name || '',
    cake_message: personalisation.cake_message || '',
    delivery_date: personalisation.delivery_date || '',
    delivery_address: personalisation.delivery_address || '',
    special_requests: personalisation.special_requests || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/birthday-box-orders/${orderId}/personalisation`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      if (res.ok) {
        toast.success('Personalisation saved');
        setEditing(false);
        onSaved?.();
      }
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <div className="rounded-xl p-4" style={{ background: '#FAFAF8', border: '1px solid #F0E8F8' }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#1A0030' }}>
          ✎ Personalisation Required
        </p>
        {!editing ? (
          <button onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
            data-testid="edit-personalisation-btn">
            <Edit2 className="w-3 h-3" /> Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 font-semibold"
              data-testid="save-personalisation-btn">
              <Save className="w-3 h-3" /> {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { key: 'bandana_name', label: 'Bandana Name', placeholder: 'e.g. MOJO' },
          { key: 'cake_message', label: 'Cake Message', placeholder: 'e.g. Happy Birthday Mojo!' },
          { key: 'delivery_date', label: 'Delivery Date', type: 'date' },
          { key: 'delivery_address', label: 'Delivery Address', placeholder: 'Full address' },
        ].map(f => (
          <div key={f.key}>
            <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
            {editing ? (
              <input
                type={f.type || 'text'}
                value={fields[f.key]}
                onChange={e => setFields(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full text-sm border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-300"
                style={{ borderColor: '#e2e8f0' }}
              />
            ) : (
              <p className="text-sm text-gray-800">
                {fields[f.key] || <span className="text-gray-400 italic">Not set</span>}
              </p>
            )}
          </div>
        ))}
      </div>
      {editing && (
        <div className="mt-3">
          <label className="block text-xs text-gray-500 mb-1">Special Requests</label>
          <textarea
            value={fields.special_requests}
            onChange={e => setFields(p => ({ ...p, special_requests: e.target.value }))}
            placeholder="Any special requests from the customer…"
            rows={2}
            className="w-full text-sm border rounded-lg px-2.5 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-purple-300"
            style={{ borderColor: '#e2e8f0' }}
          />
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   WHATSAPP CONTACT PANEL
   ───────────────────────────────────────────────────────────────── */
const ContactPanel = ({ order }) => {
  const petName = order?.pet_name || 'your pet';
  const ownerName = order?.user_name || 'there';
  const orderId = order?.ticket_id || order?.id || '';

  const waMessage = encodeURIComponent(
    `Hi ${ownerName}! This is The Doggy Company Concierge. I'm confirming ${petName}'s Birthday Box (Order ${orderId}). Can we arrange delivery? When would work best for you?`
  );
  const phone = order?.user_phone;
  const email = order?.user_email;
  const waUrl = phone
    ? `https://wa.me/${phone.replace(/\D/g, '')}?text=${waMessage}`
    : `https://wa.me/?text=${waMessage}`;

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
      <div className="px-4 py-2.5 flex items-center gap-2"
        style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Contact Owner</p>
      </div>
      <div className="p-3 space-y-2">
        {/* WhatsApp — primary */}
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="whatsapp-contact-btn"
          className="flex items-center gap-3 w-full rounded-xl px-4 py-3 text-white font-bold text-sm transition-all hover:opacity-90"
          style={{ background: '#25D366', textDecoration: 'none' }}
        >
          <MessageCircle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">WhatsApp {ownerName}</p>
            <p className="text-xs opacity-80 truncate">Pre-filled order confirmation message</p>
          </div>
          <ChevronRight className="w-4 h-4 flex-shrink-0 opacity-60" />
        </a>

        {/* Email */}
        {email && (
          <a
            href={`mailto:${email}?subject=Your%20Birthday%20Box%20Order%20%E2%80%94%20${petName}&body=Hi%20${ownerName}%2C%0A%0AThis%20is%20The%20Doggy%20Company%20Concierge.%20I%27m%20reaching%20out%20about%20${petName}%27s%20Birthday%20Box%20(Order%20${orderId}).%0A%0AKind%20regards%2C%0AThe%20Doggy%20Company%20Concierge`}
            data-testid="email-contact-btn"
            className="flex items-center gap-3 w-full rounded-xl px-4 py-2.5 text-sm font-medium transition-all hover:bg-blue-50"
            style={{ background: '#EFF6FF', color: '#2563EB', textDecoration: 'none', border: '1px solid #DBEAFE' }}
          >
            <Mail className="w-4 h-4 flex-shrink-0" />
            <span>Email {ownerName}</span>
          </a>
        )}

        {/* Phone */}
        {phone && (
          <a
            href={`tel:${phone}`}
            data-testid="phone-contact-btn"
            className="flex items-center gap-3 w-full rounded-xl px-4 py-2.5 text-sm font-medium transition-all hover:bg-gray-50"
            style={{ background: '#F9FAFB', color: '#374151', textDecoration: 'none', border: '1px solid #E5E7EB' }}
          >
            <Phone className="w-4 h-4 flex-shrink-0" />
            <span>Call {phone}</span>
          </a>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   STATUS TRANSITION BUTTON
   ───────────────────────────────────────────────────────────────── */
const StatusTransition = ({ orderId, currentStatus, order, assembledCount, totalSlots, allergyConfirmed, onUpdated, agentName }) => {
  const [loading, setLoading] = useState(false);
  const [showAllergyGate, setShowAllergyGate] = useState(false);
  const [trackingUrl, setTrackingUrl] = useState('');
  const s = STATUS[currentStatus];
  if (!s?.next) return null;
  const nextS = STATUS[s.next];

  // Gate checks
  const hasAllergies = order?.hasAllergies;
  const needsAllergyConfirm = s.next === 'in_progress' && hasAllergies && !allergyConfirmed;
  const needsAllSlots = s.next === 'assembled' && assembledCount < totalSlots;

  const handleClick = () => {
    if (needsAllergyConfirm) {
      setShowAllergyGate(true);
      return;
    }
    if (needsAllSlots) {
      toast.error(`${assembledCount}/${totalSlots} slots assembled. Check all 6 before marking assembled.`);
      return;
    }
    advance();
  };

  const advance = async () => {
    setLoading(true);
    setShowAllergyGate(false);
    try {
      const res = await fetch(`${API_BASE}/api/admin/birthday-box-orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: s.next,
          concierge_name: agentName || 'concierge',
          tracking_url: trackingUrl || undefined
        }),
      });
      if (res.ok) {
        toast.success(`Status → ${nextS?.label}`);
        onUpdated?.();
      }
    } catch { toast.error('Failed to update status'); }
    finally { setLoading(false); }
  };

  const isDisabled = needsAllSlots;

  return (
    <>
      {/* Allergy gate modal */}
      {showAllergyGate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="font-bold text-gray-900">Confirm Allergy Check</h3>
            </div>
            <p className="text-sm text-gray-700 mb-2">
              Confirm you have checked all items against <strong>{order?.pet_name}'s</strong> allergens:
            </p>
            <div className="flex gap-2 flex-wrap mb-4">
              {order?.allergies?.map(a => (
                <span key={a} className="px-2 py-0.5 rounded-full text-xs font-bold uppercase"
                  style={{ background: '#FEE2E2', color: '#991B1B' }}>{a}</span>
              ))}
            </div>
            <p className="text-xs text-gray-500 mb-4">This confirmation is logged and cannot be skipped.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowAllergyGate(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={advance}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: '#DC2626' }}
                data-testid="confirm-allergy-advance-btn">
                I have checked — proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tracking URL field for dispatched */}
      {s.next === 'dispatched' && (
        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-1.5">Tracking URL (optional)</label>
          <input
            type="text"
            value={trackingUrl}
            onChange={e => setTrackingUrl(e.target.value)}
            placeholder="https://track.delhivery.com/…"
            className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-300"
            style={{ borderColor: '#e2e8f0' }}
          />
        </div>
      )}

      <button
        onClick={handleClick}
        disabled={loading || isDisabled}
        className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-all hover:opacity-90"
        style={{
          background: isDisabled ? '#E5E7EB' : (nextS?.color || '#2563EB'),
          color: isDisabled ? '#9CA3AF' : 'white',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          boxShadow: isDisabled ? 'none' : `0 4px 16px ${nextS?.color}40`
        }}
        data-testid="advance-status-btn"
      >
        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        {needsAllSlots
          ? `${assembledCount}/${totalSlots} slots — Mark as ${nextS?.label}`
          : `Mark as ${nextS?.label}`
        }
      </button>
    </>
  );
};

/* ─────────────────────────────────────────────────────────────────
   NOTES PANEL
   ───────────────────────────────────────────────────────────────── */
const NotesPanel = ({ orderId, notes = [], auditTrail = [], agentName }) => {
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [showLog, setShowLog] = useState(false);

  const sendNote = async () => {
    if (!newNote.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/birthday-box-orders/${orderId}/note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote.trim(), concierge_name: agentName || 'concierge' })
      });
      if (res.ok) {
        toast.success('Note saved');
        setNewNote('');
      }
    } catch { toast.error('Failed to save note'); }
    finally { setSaving(false); }
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
      <div className="px-4 py-2.5 flex items-center justify-between"
        style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        <p className="text-xs font-bold uppercase tracking-wide text-gray-500 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" /> Internal Notes
        </p>
      </div>
      <div className="p-3 space-y-3">
        {notes.slice(-3).map((n, i) => (
          <div key={i} className="text-xs" style={{ borderLeft: '2px solid #e2e8f0', paddingLeft: 8 }}>
            <p className="text-gray-700">{n.note}</p>
            <p className="text-gray-400 mt-0.5">{n.concierge_name} · {timeAgo(n.timestamp)}</p>
          </div>
        ))}
        <div className="flex gap-2">
          <input
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendNote()}
            placeholder="Add a note…"
            className="flex-1 text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-300"
            style={{ borderColor: '#e2e8f0' }}
            data-testid="add-note-input"
          />
          <button onClick={sendNote} disabled={saving || !newNote.trim()}
            className="px-3 py-1.5 rounded-lg text-white text-sm font-semibold transition-all"
            style={{ background: saving ? '#94a3b8' : '#7C3AED' }}
            data-testid="add-note-btn">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>

        {/* Collapsible order log */}
        {auditTrail?.length > 0 && (
          <button onClick={() => setShowLog(!showLog)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 w-full">
            {showLog ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {showLog ? 'Hide' : 'Show'} order log ({auditTrail.length} events)
          </button>
        )}
        {showLog && (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {[...auditTrail].reverse().map((entry, i) => (
              <div key={i} className="text-xs flex items-start gap-2"
                style={{ borderLeft: '2px solid #e2e8f0', paddingLeft: 8 }}>
                <div>
                  <p className="text-gray-600 font-medium">{entry.action?.replace(/_/g, ' ')}</p>
                  {entry.note && <p className="text-gray-500">{entry.note}</p>}
                  <p className="text-gray-400">{entry.performed_by} · {timeAgo(entry.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   ORDER DETAIL PANEL (Center + Right)
   ───────────────────────────────────────────────────────────────── */
const OrderDetail = ({ orderId, onClose, onStatusChange, agentName }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/birthday-box-orders/${orderId}`);
      if (res.ok) setOrder(await res.json());
    } finally { setLoading(false); }
  }, [orderId]);

  useEffect(() => { load(); }, [load]);

  const assembledCount = Object.values(order?.slot_assembly || {}).filter(v => v?.assembled).length;
  const totalSlots = order?.slots?.length || 6;

  if (loading) return (
    <div className="flex-1 flex items-center justify-center" style={{ minHeight: 400 }}>
      <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
    </div>
  );

  if (!order) return (
    <div className="flex-1 flex items-center justify-center p-8 text-center text-gray-400">
      Order not found
    </div>
  );

  const isUrgent = order.birthday_urgency;
  const isToday = order.birthday_today;

  return (
    <div className="flex-1 overflow-y-auto lg:overflow-hidden lg:flex" style={{ minWidth: 0 }}>
      {/* CENTER: Manifest */}
      <div className="flex-1 overflow-y-auto" style={{ borderRight: '1px solid #e2e8f0' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid #e2e8f0', background: 'white', position: 'sticky', top: 0, zIndex: 10 }}>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-gray-900">
                {order.pet_name}'s Birthday Box
              </h2>
              <StatusBadge status={order.status} />
              {order.hasAllergies && (
                <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                  <AlertTriangle className="w-3 h-3" /> Allergies
                </span>
              )}
              {isUrgent && (
                <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">🚨 URGENT</span>
              )}
              {isToday && (
                <span className="text-xs font-bold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">🎂 Birthday TODAY</span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {order.ticket_id} · {order.user_email}
            </p>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 lg:hidden">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="p-5 space-y-5">
          {/* Birthday urgency banner */}
          {isUrgent && (
            <div className="rounded-xl px-4 py-3"
              style={{ background: '#FEF2F2', border: '2px solid #DC2626' }}>
              <p className="text-sm font-bold text-red-800">
                🚨 URGENT — {order.pet_name}'s birthday is soon. Order must be assembled and dispatched promptly.
              </p>
              <p className="text-xs text-red-600 mt-1">SLA: Contact pet parent within 4 hours.</p>
            </div>
          )}
          {isToday && (
            <div className="rounded-xl px-4 py-3"
              style={{ background: '#FEF9C3', border: '2px solid #D97706' }}>
              <p className="text-sm font-bold text-yellow-800">
                🎂 It's {order.pet_name}'s birthday TODAY. This order needs same-day attention.
              </p>
            </div>
          )}

          {/* Allergy banner */}
          <AllergyBanner
            petName={order.pet_name}
            allergies={order.allergies}
            confirmed={order.allergy_confirmed}
            orderId={orderId}
            onConfirmed={load}
          />

          {/* Pet info strip */}
          <div className="flex items-center gap-3 rounded-xl p-3"
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
              style={{ background: '#f1f5f9' }}>🐾</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900">{order.pet_name}</p>
              <p className="text-xs text-gray-500 truncate">{order.pet?.breed} · {order.user_email}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-gray-500">Received</p>
              <p className="text-xs font-semibold text-gray-700">
                {order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
              </p>
            </div>
          </div>

          {/* 6-Slot Manifest with checkboxes */}
          <SlotManifest
            orderId={orderId}
            slots={order.slots}
            allergies={order.allergies}
            slotAssembly={order.slot_assembly}
            onAssembled={load}
          />

          {/* Personalisation */}
          <PersonalisationPanel
            orderId={orderId}
            personalisation={order.personalisation || {}}
            onSaved={load}
          />
        </div>
      </div>

      {/* RIGHT: Action Panel */}
      <div className="flex-shrink-0 overflow-y-auto" style={{ width: '100%', maxWidth: 280, background: '#fafafa' }}>
        <div className="p-4 space-y-4">
          {/* Current status */}
          <div className="rounded-xl p-3 text-center" style={{ background: 'white', border: '1px solid #e2e8f0' }}>
            <p className="text-xs text-gray-500 mb-1">Current Status</p>
            <StatusBadge status={order.status} />
          </div>

          {/* Status advance */}
          <StatusTransition
            orderId={orderId}
            currentStatus={order.status}
            order={order}
            assembledCount={assembledCount}
            totalSlots={totalSlots}
            allergyConfirmed={order.allergy_confirmed}
            onUpdated={() => { load(); onStatusChange?.(); }}
            agentName={agentName}
          />

          {/* WhatsApp contact panel */}
          <ContactPanel order={order} />

          {/* Notes + audit log */}
          <NotesPanel
            orderId={orderId}
            notes={order.notes || []}
            auditTrail={order.audit_trail || []}
            agentName={agentName}
          />
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────────────────────────── */
const BirthdayBoxOrdersAdmin = ({ agentName }) => {
  const [orders, setOrders] = useState([]);
  const [counts, setCounts] = useState({});
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileShowDetail, setMobileShowDetail] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/birthday-box-orders?limit=200`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setCounts(data.counts || {});
        if (data.orders?.length && !selectedId) {
          setSelectedId(data.orders[0].id);
        }
      }
    } finally { setLoading(false); }
  }, [selectedId]);

  useEffect(() => { load(); }, []);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [load]);

  const filtered = orders.filter(o => {
    const matchStatus = statusFilter === 'all' || o.status === statusFilter ||
      (statusFilter === 'new' && (o.status === 'new' || o.status === 'pending_concierge'));
    const matchSearch = !search || (
      o.pet_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      o.ticket_id?.toLowerCase().includes(search.toLowerCase())
    );
    return matchStatus && matchSearch;
  });

  const statusFilters = [
    { key: 'all',         label: 'All',         count: counts.total },
    { key: 'new',         label: 'New',          count: counts.new, color: '#DC2626' },
    { key: 'in_progress', label: 'In Progress',  count: counts.in_progress, color: '#D97706' },
    { key: 'assembled',   label: 'Assembled',    count: counts.assembled, color: '#2563EB' },
    { key: 'dispatched',  label: 'Dispatched',   count: counts.dispatched, color: '#7C3AED' },
    { key: 'delivered',   label: 'Delivered',    count: counts.delivered, color: '#16A34A' },
  ];

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 120px)', minHeight: 600 }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid #e2e8f0', background: 'white' }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">🎂</span>
          <h1 className="text-base font-bold text-gray-900">Birthday Box Orders</h1>
          {counts.new > 0 && (
            <span className="text-xs font-bold text-white bg-red-600 rounded-full px-2 py-0.5"
              data-testid="new-orders-badge">
              {counts.new} NEW
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search pet, email…"
            className="hidden sm:block text-xs border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-300"
            style={{ borderColor: '#e2e8f0', width: 180 }}
            data-testid="search-orders-input"
          />
          <button onClick={load} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
            data-testid="refresh-orders-btn">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Status filter pills */}
      <div className="flex items-center gap-2 px-4 py-2.5 overflow-x-auto flex-shrink-0"
        style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
        {statusFilters.map(f => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            data-testid={`filter-${f.key}`}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0"
            style={{
              background: statusFilter === f.key ? (f.color || '#1e293b') : 'white',
              color: statusFilter === f.key ? 'white' : '#64748b',
              border: `1px solid ${statusFilter === f.key ? (f.color || '#1e293b') : '#e2e8f0'}`,
            }}
          >
            {f.label}
            {f.count != null && (
              <span className="rounded-full px-1.5" style={{
                background: statusFilter === f.key ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                color: statusFilter === f.key ? 'white' : '#64748b', fontSize: 10
              }}>
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Body — 3 pane layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Order list */}
        <div
          className={`flex-shrink-0 overflow-y-auto ${mobileShowDetail ? 'hidden' : 'flex flex-col'} lg:flex lg:flex-col`}
          style={{ width: '100%', maxWidth: 280, borderRight: '1px solid #e2e8f0', background: 'white' }}
        >
          {loading && orders.length === 0 ? (
            <div className="flex items-center justify-center p-8 text-gray-400">
              <RefreshCw className="w-5 h-5 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No orders found</p>
              <p className="text-xs text-gray-400 mt-1">Birthday box orders will appear here</p>
            </div>
          ) : (
            filtered.map(order => (
              <OrderRow
                key={order.id}
                order={order}
                isSelected={selectedId === order.id}
                onClick={() => {
                  setSelectedId(order.id);
                  setMobileShowDetail(true);
                }}
              />
            ))
          )}
        </div>

        {/* Center + Right: Detail + Action panel */}
        <div
          className={`flex-1 overflow-hidden flex ${mobileShowDetail ? 'flex' : 'hidden'} lg:flex`}
          style={{ background: '#f8fafc' }}
        >
          {selectedId ? (
            <OrderDetail
              orderId={selectedId}
              onClose={() => setMobileShowDetail(false)}
              onStatusChange={load}
              agentName={agentName}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <Package className="w-12 h-12 text-gray-200 mb-4" />
              <p className="text-base font-semibold text-gray-500">Select an order</p>
              <p className="text-sm text-gray-400 mt-1">
                {orders.length === 0 ? 'No birthday box orders yet' : 'Click an order on the left to view details'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BirthdayBoxOrdersAdmin;
