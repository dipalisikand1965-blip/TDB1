/**
 * BirthdayBoxOrdersAdmin.jsx
 * Service Desk — Birthday Box Orders (Phase 1 + Phase 2)
 *
 * 3-column layout: Order List | Manifest Detail | Action Panel
 * Mobile: single column with tap-to-open detail
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  AlertTriangle, ShieldCheck, Clock, ChevronRight, 
  RefreshCw, X, Package, ChevronDown, Edit2, Save, Check
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
      fontWeight: 700, letterSpacing: '0.05em'
    }}>
      {s.label}
    </span>
  );
};

/* ─────────────────────────────────────────────────────────────────
   ORDER LIST ROW
   ───────────────────────────────────────────────────────────────── */
const OrderRow = ({ order, isSelected, onClick }) => {
  const timeAgo = (ts) => {
    if (!ts) return '';
    const diff = Date.now() - new Date(ts).getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor(diff / 60000);
    if (h > 24) return `${Math.floor(h/24)}d ago`;
    if (h > 0) return `${h}h ago`;
    return `${m}m ago`;
  };

  return (
    <div
      onClick={onClick}
      data-testid={`order-row-${order.id}`}
      className="cursor-pointer transition-all"
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid #f1f5f9',
        background: isSelected ? '#f0f9ff' : 'white',
        borderLeft: isSelected ? '3px solid #2563EB' : '3px solid transparent',
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-sm text-gray-900">{order.pet_name || 'Pet'}</span>
          {order.hasAllergies && (
            <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
          )}
        </div>
        <StatusBadge status={order.status} small />
      </div>
      <p className="text-xs text-gray-500 truncate">{order.user_email || 'No email'}</p>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-xs text-gray-400">{order.ticket_id}</span>
        <span className="text-xs text-gray-400">{timeAgo(order.created_at)}</span>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   6-SLOT MANIFEST TABLE
   ───────────────────────────────────────────────────────────────── */
const ManifestTable = ({ slots, allergies }) => (
  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ background: '#f8fafc' }}>
          {['SLOT', 'ITEM', 'PERSONALISATION', 'SAFETY'].map(h => (
            <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {(slots || []).map((slot, i) => {
          const slotName = SLOT_LABELS[slot.slotNumber - 1] || SLOT_LABELS[i] || `SLOT ${i+1}`;
          const isAllergenRisk = slot.slotNumber === 5 && allergies?.length > 0;
          const isSafe = slot.isAllergySafe;

          return (
            <tr key={i} style={{
              background: isSafe ? '#f0fdf4' : isAllergenRisk ? '#fef2f2' : 'white',
              borderBottom: '1px solid #f1f5f9',
            }}>
              <td style={{ padding: '10px 12px' }}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{slot.emoji}</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#7c3aed', letterSpacing: '0.05em' }}>{slotName}</span>
                </div>
              </td>
              <td style={{ padding: '10px 12px' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{slot.itemName || slot.chipLabel}</p>
                {slot.hiddenUntilDelivery && (
                  <span style={{ fontSize: '10px', background: '#f5f3ff', color: '#7c3aed', padding: '1px 6px', borderRadius: '999px' }}>Surprise</span>
                )}
              </td>
              <td style={{ padding: '10px 12px', fontSize: '12px', color: '#64748b' }}>
                {slot.slotNumber === 3 && <span>🎀 Bandana name — confirm with customer</span>}
                {slot.slotNumber === 1 && <span>🎂 Cake message — confirm with customer</span>}
                {!slot.slotNumber || (slot.slotNumber !== 1 && slot.slotNumber !== 3) ? '—' : null}
              </td>
              <td style={{ padding: '10px 12px' }}>
                {isSafe ? (
                  <span style={{ fontSize: '11px', background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: '999px', fontWeight: 600 }}>✓ Safe</span>
                ) : isAllergenRisk ? (
                  <span style={{ fontSize: '11px', background: '#fef2f2', color: '#dc2626', padding: '2px 8px', borderRadius: '999px', fontWeight: 600 }}>⚠ Check</span>
                ) : (
                  <span style={{ color: '#94a3b8', fontSize: '11px' }}>—</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

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
    <div className="rounded-xl p-4" style={{ background: '#fafafa', border: '1px solid #e2e8f0' }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Personalisation</p>
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
          { key: 'bandana_name', label: 'Bandana Name', placeholder: 'e.g. Mojo' },
          { key: 'cake_message', label: 'Cake Message', placeholder: 'e.g. Happy Birthday Mojo!' },
          { key: 'delivery_date', label: 'Delivery Date', placeholder: 'e.g. March 20, 2026', type: 'date' },
          { key: 'delivery_address', label: 'Delivery Address', placeholder: 'Full address' },
        ].map(f => (
          <div key={f.key}>
            <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
            {editing ? (
              <input
                type={f.type || 'text'}
                value={fields[f.key]}
                onChange={e => setFields(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full text-sm border rounded-lg px-2.5 py-1.5"
                style={{ borderColor: '#e2e8f0', outline: 'none' }}
              />
            ) : (
              <p className="text-sm text-gray-800">{fields[f.key] || <span className="text-gray-400 italic">Not set</span>}</p>
            )}
          </div>
        ))}
      </div>
      {editing && (
        <div className="mt-3">
          <label className="block text-xs text-gray-500 mb-1">Special Requests</label>
          <textarea
            value={fields.special_requests}
            onChange={e => setFields(prev => ({ ...prev, special_requests: e.target.value }))}
            placeholder="Any special requests from the customer…"
            rows={2}
            className="w-full text-sm border rounded-lg px-2.5 py-1.5 resize-none"
            style={{ borderColor: '#e2e8f0', outline: 'none' }}
          />
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   STATUS TRANSITION BUTTON
   ───────────────────────────────────────────────────────────────── */
const StatusTransition = ({ orderId, currentStatus, onUpdated }) => {
  const [loading, setLoading] = useState(false);
  const s = STATUS[currentStatus];
  if (!s?.next) return null;
  const nextS = STATUS[s.next];

  const advance = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/birthday-box-orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: s.next }),
      });
      if (res.ok) {
        toast.success(`Status → ${nextS?.label}`);
        onUpdated?.();
      }
    } catch { toast.error('Failed to update status'); }
    finally { setLoading(false); }
  };

  return (
    <button
      onClick={advance}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition-all hover:opacity-90"
      style={{ background: nextS?.color || '#2563EB' }}
      data-testid={`advance-status-btn`}
    >
      {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
      Mark as {nextS?.label}
    </button>
  );
};

/* ─────────────────────────────────────────────────────────────────
   ORDER DETAIL PANEL
   ───────────────────────────────────────────────────────────────── */
const OrderDetail = ({ orderId, onClose, onStatusChange }) => {
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

  const s = STATUS[order.status] || STATUS['new'];

  return (
    <div className="flex-1 overflow-y-auto" style={{ minWidth: 0 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #e2e8f0' }}>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900">
              {order.pet_name}'s Birthday Box
            </h2>
            <StatusBadge status={order.status} />
            {order.hasAllergies && (
              <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                <AlertTriangle className="w-3 h-3" /> Allergies
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {order.ticket_id} · {order.user_email} · {order.slots?.length || 6} slots
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 lg:hidden">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-6 space-y-5">
        {/* ALLERGY ALERT BANNER */}
        {order.hasAllergies && (
          <div className="rounded-xl px-4 py-3 flex items-start gap-3"
            style={{ background: '#FEF2F2', border: '2px solid #DC2626' }}>
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-800">ALLERGEN ALERT — Check all items</p>
              <p className="text-xs text-red-700 mt-0.5">
                {order.pet_name} is allergic to: <strong>{order.allergies?.join(', ').toUpperCase()}</strong>
              </p>
              <p className="text-xs text-red-600 mt-1">
                Customer confirmed allergy safety: {order.allergy_confirmed ? '✓ Yes' : '⚠ Not confirmed'}
              </p>
            </div>
          </div>
        )}

        {/* Pet info strip */}
        <div className="flex items-center gap-3 rounded-xl p-3"
          style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
            style={{ background: '#f1f5f9' }}>
            🐾
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">{order.pet_name}</p>
            <p className="text-xs text-gray-500">
              {order.pet?.breed} · {order.user_email}
            </p>
          </div>
          <div className="ml-auto">
            <p className="text-xs text-gray-500">Received</p>
            <p className="text-xs font-semibold text-gray-700">
              {order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
            </p>
          </div>
        </div>

        {/* 6-Slot Manifest */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">6-Slot Manifest</p>
          <ManifestTable slots={order.slots} allergies={order.allergies} />
        </div>

        {/* Personalisation */}
        <PersonalisationPanel
          orderId={orderId}
          personalisation={order.personalisation || {}}
          onSaved={load}
        />

        {/* Advance status */}
        <StatusTransition
          orderId={orderId}
          currentStatus={order.status}
          onUpdated={() => { load(); onStatusChange?.(); }}
        />
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────────────────────────── */
const BirthdayBoxOrdersAdmin = () => {
  const [orders, setOrders] = useState([]);
  const [counts, setCounts] = useState({});
  const [statusFilter, setStatusFilter] = useState('all');
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
        // Auto-select first order
        if (data.orders?.length && !selectedId) {
          setSelectedId(data.orders[0].id);
        }
      }
    } finally { setLoading(false); }
  }, [selectedId]);

  useEffect(() => { load(); }, []);

  const filtered = statusFilter === 'all' ? orders :
    orders.filter(o => o.status === statusFilter || (statusFilter === 'new' && o.status === 'pending_concierge'));

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
            <span className="text-xs font-bold text-white bg-red-600 rounded-full px-2 py-0.5">
              {counts.new} NEW
            </span>
          )}
        </div>
        <button onClick={load} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
          data-testid="refresh-orders-btn">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
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
              <span className="rounded-full px-1.5"
                style={{
                  background: statusFilter === f.key ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                  color: statusFilter === f.key ? 'white' : '#64748b',
                  fontSize: '10px',
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
          style={{ width: '100%', maxWidth: '300px', borderRight: '1px solid #e2e8f0', background: 'white' }}
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

        {/* Center + Right: Detail panel */}
        <div
          className={`flex-1 overflow-hidden flex ${mobileShowDetail ? 'flex' : 'hidden'} lg:flex`}
          style={{ background: '#f8fafc' }}
        >
          {selectedId ? (
            <OrderDetail
              orderId={selectedId}
              onClose={() => setMobileShowDetail(false)}
              onStatusChange={load}
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
