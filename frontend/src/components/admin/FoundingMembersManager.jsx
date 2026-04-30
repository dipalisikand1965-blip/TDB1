import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Search, Users, Heart, Send, AlertTriangle, Download, Edit2, Trash2, Plus, X, RefreshCw, Calendar, Star } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  dormant: 'bg-yellow-100 text-yellow-800',
  lapsed: 'bg-orange-100 text-orange-800',
  churned: 'bg-red-100 text-red-800',
  never_ordered: 'bg-gray-100 text-gray-700',
};
const TIER_COLORS = {
  COMPLETE: 'bg-purple-100 text-purple-800',
  HIGH: 'bg-blue-100 text-blue-800',
  MEDIUM: 'bg-cyan-100 text-cyan-800',
  LOW: 'bg-gray-100 text-gray-700',
  MINIMAL: 'bg-stone-100 text-stone-700',
};

const FoundingMembersManager = ({ authHeaders }) => {
  const [tab, setTab] = useState('parents'); // 'parents' | 'pets'
  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [selected, setSelected] = useState(null);            // detail panel (parent or pet object)
  const [editing, setEditing] = useState(null);              // form state when editing
  const [auditTrail, setAuditTrail] = useState([]);
  const [bulkSelection, setBulkSelection] = useState(new Set());
  const [showBulkPanel, setShowBulkPanel] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [cities, setCities] = useState([]);
  const [toast, setToast] = useState(null);

  // Auth headers — supports x-admin-secret for production routes
  const getAdminHeaders = useCallback(() => {
    const h = { 'Content-Type': 'application/json', ...(authHeaders || {}) };
    // Pass admin password as x-admin-secret too (basic auth password = admin secret)
    try {
      const auth = h.Authorization || '';
      if (auth.startsWith('Basic ')) {
        const decoded = atob(auth.slice(6));
        const pwd = decoded.split(':').slice(1).join(':');
        if (pwd) h['x-admin-secret'] = pwd;
      }
    } catch {}
    return h;
  }, [authHeaders]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Loaders ───────────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/admin/pet-parents/stats`, { headers: getAdminHeaders() });
      if (r.ok) setStats(await r.json());
    } catch (e) { console.error(e); }
  }, [getAdminHeaders]);

  const loadCities = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/admin/pet-parents/meta/cities`, { headers: getAdminHeaders() });
      if (r.ok) setCities(await r.json());
    } catch (e) { console.error(e); }
  }, [getAdminHeaders]);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, page_size: pageSize });
      if (search.trim()) params.set('search', search.trim());
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') params.set(k, v);
      });
      const url = tab === 'parents'
        ? `${API}/api/admin/pet-parents?${params}`
        : `${API}/api/admin/tdb-pets?${params}`;
      const r = await fetch(url, { headers: getAdminHeaders() });
      if (r.ok) {
        const d = await r.json();
        setItems(d.items || []);
        setTotal(d.total || 0);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [tab, page, pageSize, search, filters, getAdminHeaders]);

  useEffect(() => { loadStats(); loadCities(); }, [loadStats, loadCities]);
  useEffect(() => { loadList(); }, [loadList]);

  // ── Detail / Edit ─────────────────────────────────────────────
  const openDetail = async (item) => {
    setSelected(item);
    setEditing(null);
    setAuditTrail([]);
    try {
      const url = tab === 'parents'
        ? `${API}/api/admin/pet-parents/${item._id}`
        : `${API}/api/admin/tdb-pets/${encodeURIComponent(item.staging_id)}`;
      const r = await fetch(url, { headers: getAdminHeaders() });
      if (r.ok) setSelected(await r.json());
      // Load audit trail (parent only)
      if (tab === 'parents') {
        const a = await fetch(`${API}/api/admin/pet-parents/audit/${item._id}`, { headers: getAdminHeaders() });
        if (a.ok) {
          const d = await a.json();
          setAuditTrail(d.items || []);
        }
      }
    } catch (e) { console.error(e); }
  };

  const startEdit = () => {
    setEditing({ ...selected });
  };

  const saveEdit = async () => {
    try {
      const url = tab === 'parents'
        ? `${API}/api/admin/pet-parents/${selected._id}`
        : `${API}/api/admin/tdb-pets/${encodeURIComponent(selected.staging_id)}`;
      const r = await fetch(url, {
        method: 'PATCH',
        headers: getAdminHeaders(),
        body: JSON.stringify(editing),
      });
      if (r.ok) {
        const updated = await r.json();
        setSelected(updated);
        setEditing(null);
        showToast('Saved successfully');
        loadList();
      } else {
        const err = await r.json();
        showToast(err.detail || 'Save failed', 'error');
      }
    } catch (e) {
      showToast('Save failed: ' + e.message, 'error');
    }
  };

  const handleDelete = async () => {
    const reason = prompt('Reason for deletion (required, min 3 chars):');
    if (!reason || reason.length < 3) return;
    try {
      const url = tab === 'parents'
        ? `${API}/api/admin/pet-parents/${selected._id}`
        : `${API}/api/admin/tdb-pets/${encodeURIComponent(selected.staging_id)}`;
      const r = await fetch(url, {
        method: 'DELETE',
        headers: getAdminHeaders(),
        body: JSON.stringify({ reason }),
      });
      if (r.ok) {
        showToast('Soft-deleted successfully');
        setSelected(null);
        loadList();
      }
    } catch (e) { showToast('Delete failed', 'error'); }
  };

  // ── Bulk ──────────────────────────────────────────────────────
  const toggleBulk = (id) => {
    setBulkSelection(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  };

  const runBulk = async (action, extra = {}) => {
    if (bulkSelection.size === 0) return showToast('Select at least 1 record', 'error');
    try {
      const r = await fetch(`${API}/api/admin/pet-parents/bulk`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ ids: Array.from(bulkSelection), action, ...extra }),
      });
      if (r.ok) {
        const d = await r.json();
        showToast(`${d.modified} records updated`);
        setBulkSelection(new Set());
        setShowBulkPanel(false);
        loadList();
      }
    } catch (e) { showToast('Bulk action failed', 'error'); }
  };

  // ── Export ────────────────────────────────────────────────────
  const exportCSV = (kind) => {
    const params = new URLSearchParams({ kind });
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    // Use admin secret in URL? No — must POST or use header. Use a temp form.
    // Simpler: trigger fetch + blob download
    const headers = getAdminHeaders();
    fetch(`${API}/api/admin/pet-parents/export.csv?${params}`, { headers })
      .then(r => r.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `pet_parents_${kind}_${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast(`Exported ${kind}`);
      });
  };

  const totalPages = Math.ceil(total / pageSize);

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="space-y-6" data-testid="founding-members-manager">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
        }`} data-testid="founding-toast">{toast.msg}</div>
      )}

      {/* Stats Header */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3" data-testid="founding-stats-bar">
          <StatCard icon={<Users />} label="Pet Parents" value={stats.total_pet_parents.toLocaleString()} testid="stat-parents" />
          <StatCard icon={<Heart />} label="Pets" value={stats.total_pets.toLocaleString()} testid="stat-pets" />
          <StatCard icon={<Send />} label="Activated" value={stats.activated.toLocaleString()} color="green" testid="stat-activated" />
          <StatCard icon={<Calendar />} label="Pending" value={stats.pending.toLocaleString()} color="amber" testid="stat-pending" />
          <StatCard icon={<Send />} label="Sent" value={stats.sent.toLocaleString()} color="blue" testid="stat-sent" />
          <StatCard icon={<Star />} label="Soft Launch" value={stats.soft_launch.toLocaleString()} color="purple" testid="stat-softlaunch" />
          <StatCard icon={<AlertTriangle />} label="Overdue" value={stats.overdue.toLocaleString()} color="red" testid="stat-overdue" />
          <StatCard icon={<Heart />} label="Rainbow Bridge" value={stats.rainbow_bridge_pets.toLocaleString()} color="rose" testid="stat-rainbow" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {[
          { id: 'parents', label: 'Pet Parents', count: stats?.total_pet_parents },
          { id: 'pets', label: 'Pets Staging', count: stats?.total_pets },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setPage(1); setBulkSelection(new Set()); setSelected(null); }}
            className={`px-4 py-2 font-medium transition-colors ${
              tab === t.id ? 'border-b-2 border-purple-600 text-purple-700' : 'text-gray-600 hover:text-gray-900'
            }`}
            data-testid={`tab-${t.id}`}
          >
            {t.label} {t.count !== undefined && <span className="text-sm text-gray-500">({t.count.toLocaleString()})</span>}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={tab === 'parents' ? "Search name, email, phone, pet name…" : "Search pet name or parent email…"}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
            data-testid="founding-search-input"
          />
        </div>

        {tab === 'parents' && (
          <>
            <select value={filters.city || ''} onChange={(e) => setFilters({...filters, city: e.target.value})}
              className="px-3 py-2 border rounded-lg" data-testid="filter-city">
              <option value="">All Cities</option>
              {cities.map(c => <option key={c.city} value={c.city}>{c.city} ({c.count})</option>)}
            </select>
            <select value={filters.intelligence_tier || ''} onChange={(e) => setFilters({...filters, intelligence_tier: e.target.value})}
              className="px-3 py-2 border rounded-lg" data-testid="filter-intel">
              <option value="">All Intelligence</option>
              {['COMPLETE','HIGH','MEDIUM','LOW','MINIMAL'].map(x => <option key={x} value={x}>{x}</option>)}
            </select>
            <select value={filters.customer_status || ''} onChange={(e) => setFilters({...filters, customer_status: e.target.value})}
              className="px-3 py-2 border rounded-lg" data-testid="filter-status">
              <option value="">All Statuses</option>
              {['active','dormant','lapsed','churned','never_ordered'].map(x => <option key={x} value={x}>{x}</option>)}
            </select>
            <label className="flex items-center gap-1 text-sm">
              <input type="checkbox" checked={filters.soft_launch === true}
                onChange={(e) => setFilters({...filters, soft_launch: e.target.checked ? true : ''})}
                data-testid="filter-softlaunch"/>
              Soft launch
            </label>
            <label className="flex items-center gap-1 text-sm">
              <input type="checkbox" checked={filters.overdue === true}
                onChange={(e) => setFilters({...filters, overdue: e.target.checked ? true : ''})}
                data-testid="filter-overdue"/>
              Overdue
            </label>
          </>
        )}
        {tab === 'pets' && (
          <label className="flex items-center gap-1 text-sm">
            <input type="checkbox" checked={filters.rainbow_bridge === true}
              onChange={(e) => setFilters({...filters, rainbow_bridge: e.target.checked ? true : ''})}
              data-testid="filter-rainbow"/>
            🌈 Rainbow Bridge
          </label>
        )}

        <button onClick={() => loadList()} className="px-3 py-2 border rounded-lg hover:bg-gray-50" title="Refresh" data-testid="btn-refresh">
          <RefreshCw className="h-4 w-4" />
        </button>
        <button onClick={() => setShowCreate(true)} className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-1" data-testid="btn-create">
          <Plus className="h-4 w-4" /> Add
        </button>
        {tab === 'parents' && (
          <div className="relative group">
            <button className="px-3 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-1" data-testid="btn-export">
              <Download className="h-4 w-4" /> Export
            </button>
            <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg py-1 hidden group-hover:block min-w-48 z-10">
              {['full','emails','whatsapp','birthdays','overdue'].map(k => (
                <button key={k} onClick={() => exportCSV(k)}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50" data-testid={`export-${k}`}>
                  {k === 'full' ? 'Full data CSV' :
                   k === 'emails' ? 'Email list only' :
                   k === 'whatsapp' ? 'WhatsApp list only' :
                   k === 'birthdays' ? 'Birthday calendar' :
                   'Overdue customers'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bulk action bar */}
      {bulkSelection.size > 0 && tab === 'parents' && (
        <div className="bg-purple-50 border border-purple-200 px-4 py-3 rounded-lg flex flex-wrap gap-2 items-center">
          <span className="font-medium text-purple-900">{bulkSelection.size} selected</span>
          <button onClick={() => {
            const date = prompt('Reschedule send date (YYYY-MM-DD):', '2026-05-15');
            if (date) runBulk('reschedule', { new_send_date: date });
          }} className="px-3 py-1 bg-purple-600 text-white rounded text-sm" data-testid="bulk-reschedule">
            Reschedule
          </button>
          <button onClick={() => runBulk('mark_soft_launch')} className="px-3 py-1 bg-pink-600 text-white rounded text-sm" data-testid="bulk-soft">
            Mark soft launch
          </button>
          <button onClick={() => runBulk('unmark_soft_launch')} className="px-3 py-1 bg-gray-600 text-white rounded text-sm" data-testid="bulk-unsoft">
            Remove soft launch
          </button>
          <button onClick={() => setBulkSelection(new Set())} className="px-3 py-1 border rounded text-sm" data-testid="bulk-clear">
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading && <div className="p-8 text-center text-gray-500">Loading…</div>}
        {!loading && items.length === 0 && <div className="p-8 text-center text-gray-500">No records.</div>}
        {!loading && items.length > 0 && tab === 'parents' && (
          <ParentsTable
            items={items}
            bulkSelection={bulkSelection}
            toggleBulk={toggleBulk}
            onRowClick={openDetail}
          />
        )}
        {!loading && items.length > 0 && tab === 'pets' && (
          <PetsTable items={items} onRowClick={openDetail} />
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-600">
            Page {page} of {totalPages} • {total.toLocaleString()} total
          </div>
          <div className="flex gap-1">
            <button disabled={page === 1} onClick={() => setPage(1)} className="px-3 py-1 border rounded disabled:opacity-30" data-testid="pg-first">«</button>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded disabled:opacity-30" data-testid="pg-prev">‹</button>
            <span className="px-3 py-1">{page}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded disabled:opacity-30" data-testid="pg-next">›</button>
            <button disabled={page === totalPages} onClick={() => setPage(totalPages)} className="px-3 py-1 border rounded disabled:opacity-30" data-testid="pg-last">»</button>
          </div>
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <DetailPanel
          tab={tab}
          item={selected}
          editing={editing}
          setEditing={setEditing}
          startEdit={startEdit}
          saveEdit={saveEdit}
          handleDelete={handleDelete}
          auditTrail={auditTrail}
          onClose={() => { setSelected(null); setEditing(null); }}
        />
      )}

      {/* Create modal */}
      {showCreate && (
        <CreateModal
          tab={tab}
          getAdminHeaders={getAdminHeaders}
          onCreated={() => { setShowCreate(false); loadList(); loadStats(); }}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, color = 'gray', testid }) => (
  <div className={`bg-white border rounded-lg p-3`} data-testid={testid}>
    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
      <span className={`text-${color}-600`}>{React.cloneElement(icon, { className: 'h-4 w-4' })}</span>
      {label}
    </div>
    <div className="text-2xl font-bold">{value}</div>
  </div>
);

const Badge = ({ children, color }) => (
  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${color}`}>{children}</span>
);

const ParentsTable = ({ items, bulkSelection, toggleBulk, onRowClick }) => (
  <table className="w-full text-sm">
    <thead className="bg-gray-50 text-left text-xs uppercase text-gray-600">
      <tr>
        <th className="p-3"><input type="checkbox" disabled aria-label="select all" /></th>
        <th className="p-3">Name</th>
        <th className="p-3">Email</th>
        <th className="p-3">Phone</th>
        <th className="p-3">City</th>
        <th className="p-3">Status</th>
        <th className="p-3">Intel</th>
        <th className="p-3 text-right">Spend ₹</th>
        <th className="p-3">Send Date</th>
        <th className="p-3">Activation</th>
        <th className="p-3"></th>
      </tr>
    </thead>
    <tbody>
      {items.map(p => (
        <tr key={p._id} className="border-t hover:bg-gray-50 cursor-pointer" data-testid={`parent-row-${p._id}`}>
          <td className="p-3" onClick={(e) => { e.stopPropagation(); toggleBulk(p._id); }}>
            <input type="checkbox" checked={bulkSelection.has(p._id)} onChange={() => {}} data-testid={`bulk-cb-${p._id}`}/>
          </td>
          <td className="p-3 font-medium" onClick={() => onRowClick(p)}>
            {p.first_name || ''} {p.last_name || ''}
            {p.primary_pet_name && <div className="text-xs text-gray-500">🐾 {p.primary_pet_name}</div>}
          </td>
          <td className="p-3" onClick={() => onRowClick(p)}>{p.email || <span className="text-gray-400">—</span>}</td>
          <td className="p-3" onClick={() => onRowClick(p)}>{p.phone || <span className="text-gray-400">—</span>}</td>
          <td className="p-3" onClick={() => onRowClick(p)}>{p.city || <span className="text-gray-400">—</span>}</td>
          <td className="p-3" onClick={() => onRowClick(p)}>
            <Badge color={STATUS_COLORS[p.customer_status] || 'bg-gray-100'}>{p.customer_status}</Badge>
          </td>
          <td className="p-3" onClick={() => onRowClick(p)}>
            <Badge color={TIER_COLORS[p.intelligence_tier] || 'bg-gray-100'}>{p.intelligence_tier || '—'}</Badge>
          </td>
          <td className="p-3 text-right font-mono" onClick={() => onRowClick(p)}>
            {(p.total_spent_inr || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </td>
          <td className="p-3 text-xs" onClick={() => onRowClick(p)}>
            {p.assigned_send_date ? new Date(p.assigned_send_date).toLocaleDateString('en-IN', {month:'short', day:'numeric'}) : <span className="text-gray-400">—</span>}
            {p.soft_launch && <Badge color="bg-pink-100 text-pink-800">★ soft</Badge>}
          </td>
          <td className="p-3 text-xs" onClick={() => onRowClick(p)}>{(p.activation_status || '').replace(/_/g, ' ')}</td>
          <td className="p-3" onClick={() => onRowClick(p)}><Edit2 className="h-4 w-4 text-gray-400" /></td>
        </tr>
      ))}
    </tbody>
  </table>
);

const PetsTable = ({ items, onRowClick }) => (
  <table className="w-full text-sm">
    <thead className="bg-gray-50 text-left text-xs uppercase text-gray-600">
      <tr>
        <th className="p-3">Name</th>
        <th className="p-3">Parent</th>
        <th className="p-3">Breed</th>
        <th className="p-3">Birthday</th>
        <th className="p-3">Age</th>
        <th className="p-3">Proteins</th>
        <th className="p-3">Status</th>
        <th className="p-3"></th>
      </tr>
    </thead>
    <tbody>
      {items.map(p => (
        <tr key={p.staging_id} className="border-t hover:bg-gray-50 cursor-pointer"
          onClick={() => onRowClick(p)} data-testid={`pet-row-${p.staging_id}`}>
          <td className="p-3 font-medium">
            {p.is_rainbow_bridge && <span title="Rainbow Bridge">🌈 </span>}
            {p.name || <span className="italic text-gray-500">{p.name_raw}</span>}
          </td>
          <td className="p-3 text-xs">{p.parent_email || p.parent_phone || p.parent_customer_key}</td>
          <td className="p-3">{p.breed || <span className="text-gray-400">—</span>}</td>
          <td className="p-3 text-xs">
            {p.birthday_month ? `${p.birthday_day || '?'}/${p.birthday_month}` : <span className="text-gray-400">—</span>}
          </td>
          <td className="p-3">{p.age_now || <span className="text-gray-400">—</span>}</td>
          <td className="p-3 text-xs">{(p.proteins_known || []).slice(0, 3).join(', ') || <span className="text-gray-400">—</span>}</td>
          <td className="p-3">
            <Badge color={p.is_rainbow_bridge ? 'bg-rose-100 text-rose-800' : (p.migration_status === 'staged' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800')}>
              {p.migration_status}
            </Badge>
          </td>
          <td className="p-3"><Edit2 className="h-4 w-4 text-gray-400" /></td>
        </tr>
      ))}
    </tbody>
  </table>
);

const DetailPanel = ({ tab, item, editing, setEditing, startEdit, saveEdit, handleDelete, auditTrail, onClose }) => (
  <div className="fixed inset-0 bg-black/40 z-40 flex items-start justify-end p-4" onClick={onClose} data-testid="detail-overlay">
    <div className="bg-white w-full max-w-2xl h-full overflow-y-auto rounded-lg shadow-xl p-6" onClick={(e) => e.stopPropagation()} data-testid="detail-panel">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">
            {tab === 'parents' ? `${item.first_name || ''} ${item.last_name || ''}` : (item.name || item.name_raw)}
          </h2>
          <p className="text-sm text-gray-500">{tab === 'parents' ? item.email || item.phone : item.parent_email || item.parent_phone}</p>
        </div>
        <div className="flex gap-2">
          {!editing && <button onClick={startEdit} className="px-3 py-1 bg-purple-600 text-white rounded text-sm flex items-center gap-1" data-testid="btn-edit">
            <Edit2 className="h-3 w-3" /> Edit
          </button>}
          {editing && <>
            <button onClick={saveEdit} className="px-3 py-1 bg-green-600 text-white rounded text-sm" data-testid="btn-save">Save</button>
            <button onClick={() => setEditing(null)} className="px-3 py-1 border rounded text-sm" data-testid="btn-cancel-edit">Cancel</button>
          </>}
          <button onClick={handleDelete} className="px-3 py-1 border border-red-300 text-red-600 rounded text-sm" data-testid="btn-delete">
            <Trash2 className="h-3 w-3" />
          </button>
          <button onClick={onClose} className="px-2 py-1 text-gray-500 hover:bg-gray-100 rounded" data-testid="btn-close-detail">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {tab === 'parents' ? (
        <ParentDetailFields item={item} editing={editing} setEditing={setEditing} />
      ) : (
        <PetDetailFields item={item} editing={editing} setEditing={setEditing} />
      )}

      {/* Audit trail */}
      {auditTrail.length > 0 && (
        <div className="mt-6 border-t pt-4">
          <h3 className="font-semibold mb-2 text-sm uppercase text-gray-600">Audit Trail</h3>
          <div className="space-y-2 text-xs max-h-64 overflow-y-auto">
            {auditTrail.map((a, i) => (
              <div key={i} className="bg-gray-50 p-2 rounded">
                <div className="text-gray-700 font-medium">
                  {a.action} • {new Date(a.when).toLocaleString('en-IN')}
                  {a.reason && <span className="ml-2 text-rose-600">[{a.reason}]</span>}
                </div>
                {(a.diffs || []).map((d, j) => (
                  <div key={j} className="text-gray-600">
                    <span className="font-mono">{d.field}:</span> {' '}
                    <span className="line-through text-red-600">{JSON.stringify(d.old)}</span>
                    {' → '}
                    <span className="text-green-700">{JSON.stringify(d.new)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
);

// ── Editable forms ────────────────────────────────────────────────
const InputRow = ({ label, value, onChange, editing, type = 'text', placeholder, testid, ...rest }) => (
  <div className="grid grid-cols-3 gap-2 items-center py-1.5">
    <label className="text-sm text-gray-600">{label}</label>
    <div className="col-span-2">
      {editing ? (
        <input type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="w-full px-2 py-1 border rounded text-sm" data-testid={testid} {...rest}/>
      ) : (
        <span className="text-sm">{value ?? <span className="text-gray-400">—</span>}</span>
      )}
    </div>
  </div>
);

const ReadRow = ({ label, value }) => (
  <div className="grid grid-cols-3 gap-2 py-1.5">
    <span className="text-sm text-gray-600">{label}</span>
    <span className="col-span-2 text-sm">{value ?? <span className="text-gray-400">—</span>}</span>
  </div>
);

const ParentDetailFields = ({ item, editing, setEditing }) => {
  const v = editing || item;
  const set = (k, val) => setEditing(prev => ({ ...prev, [k]: val }));
  return (
    <div className="space-y-1 divide-y divide-gray-100">
      <Section title="Identity">
        <InputRow label="First name" value={v.first_name} onChange={(x) => set('first_name', x)} editing={!!editing} testid="ed-first-name" />
        <InputRow label="Last name" value={v.last_name} onChange={(x) => set('last_name', x)} editing={!!editing} testid="ed-last-name" />
        <InputRow label="Email" value={v.email} onChange={(x) => set('email', x)} editing={!!editing} testid="ed-email" />
        <InputRow label="Phone" value={v.phone} onChange={(x) => set('phone', x)} editing={!!editing} testid="ed-phone" />
      </Section>
      <Section title="Address">
        <InputRow label="Address line 1" value={v.address_line_1} onChange={(x) => set('address_line_1', x)} editing={!!editing} />
        <InputRow label="Address line 2" value={v.address_line_2} onChange={(x) => set('address_line_2', x)} editing={!!editing} />
        <InputRow label="City" value={v.city} onChange={(x) => set('city', x)} editing={!!editing} testid="ed-city" />
        <InputRow label="State" value={v.state} onChange={(x) => set('state', x)} editing={!!editing} />
        <InputRow label="Pincode" value={v.pincode} onChange={(x) => set('pincode', x)} editing={!!editing} />
      </Section>
      <Section title="Pet Snapshot">
        <InputRow label="Primary pet" value={v.primary_pet_name} onChange={(x) => set('primary_pet_name', x)} editing={!!editing} />
        <InputRow label="Breed" value={v.primary_breed} onChange={(x) => set('primary_breed', x)} editing={!!editing} />
        <ReadRow label="All pet names" value={(item.pet_names || []).join(', ') || '—'} />
        <ReadRow label="Birthday" value={item.pet_birthday_month ? `${item.pet_birthday_day || '?'}/${item.pet_birthday_month}` : '—'} />
        <ReadRow label="Age now" value={item.pet_age_now} />
        <ReadRow label="Life stage" value={item.pet_life_stage} />
      </Section>
      <Section title="Status & Tier">
        {editing ? (
          <>
            <SelectRow label="Customer status" value={v.customer_status} onChange={(x) => set('customer_status', x)}
              options={['active','dormant','lapsed','churned','never_ordered']} testid="ed-cstatus"/>
            <SelectRow label="Loyalty tier" value={v.loyalty_tier} onChange={(x) => set('loyalty_tier', x)}
              options={['VIP','Founding','Regular','Prospect']} />
            <SelectRow label="Activation status" value={v.activation_status} onChange={(x) => set('activation_status', x)}
              options={['imported_pending_invite','sent','opened','active_founding','bounced','manual_created']} />
          </>
        ) : (
          <>
            <ReadRow label="Customer status" value={item.customer_status} />
            <ReadRow label="Loyalty tier" value={item.loyalty_tier} />
            <ReadRow label="Activation status" value={item.activation_status} />
            <ReadRow label="Churn risk" value={item.churn_risk} />
            <ReadRow label="Intelligence" value={item.intelligence_tier} />
          </>
        )}
        <InputRow label="Send date" value={editing ? (typeof v.assigned_send_date === 'string' ? v.assigned_send_date.slice(0, 10) : '') : (item.assigned_send_date ? new Date(item.assigned_send_date).toISOString().slice(0,10) : '—')}
          onChange={(x) => set('assigned_send_date', x)} editing={!!editing} type="date" testid="ed-send-date" />
        {editing && (
          <div className="grid grid-cols-3 gap-2 py-1.5">
            <label className="text-sm text-gray-600">Soft launch</label>
            <div className="col-span-2">
              <input type="checkbox" checked={!!v.soft_launch} onChange={(e) => set('soft_launch', e.target.checked)} data-testid="ed-soft"/>
            </div>
          </div>
        )}
      </Section>
      <Section title="Order history (read-only)">
        <ReadRow label="Total orders" value={item.total_orders} />
        <ReadRow label="Total cakes" value={item.total_cakes} />
        <ReadRow label="Total spent" value={`₹${(item.total_spent_inr || 0).toLocaleString('en-IN')}`} />
        <ReadRow label="Last order" value={item.last_order_date ? new Date(item.last_order_date).toLocaleDateString() : '—'} />
        <ReadRow label="Days since last" value={item.days_since_last_order} />
        <ReadRow label="Favourite protein" value={item.favourite_protein} />
        <ReadRow label="Proteins ever" value={(item.proteins_ever_ordered || []).join(', ') || '—'} />
      </Section>
      <Section title="Admin">
        <InputRow label="Admin notes" value={v.admin_notes} onChange={(x) => set('admin_notes', x)} editing={!!editing} testid="ed-notes" />
        <ReadRow label="Invite token" value={item.invite_token} />
        <ReadRow label="Customer key" value={item.customer_key} />
        <ReadRow label="Import batch" value={item.import_batch_id} />
      </Section>
    </div>
  );
};

const PetDetailFields = ({ item, editing, setEditing }) => {
  const v = editing || item;
  const set = (k, val) => setEditing(prev => ({ ...prev, [k]: val }));
  return (
    <div className="space-y-1 divide-y divide-gray-100">
      <Section title="Identity">
        <InputRow label="Pet name" value={v.name} onChange={(x) => set('name', x)} editing={!!editing} testid="ed-pet-name" />
        <ReadRow label="Original (raw)" value={item.name_raw} />
        <InputRow label="Breed" value={v.breed} onChange={(x) => set('breed', x)} editing={!!editing} testid="ed-pet-breed" />
        <ReadRow label="Parent" value={item.parent_email || item.parent_phone} />
      </Section>
      <Section title="Birthday">
        <InputRow label="Month" value={v.birthday_month} onChange={(x) => set('birthday_month', x ? parseInt(x) : null)} editing={!!editing} type="number" min="1" max="12" testid="ed-bday-month"/>
        <InputRow label="Day" value={v.birthday_day} onChange={(x) => set('birthday_day', x ? parseInt(x) : null)} editing={!!editing} type="number" min="1" max="31" testid="ed-bday-day"/>
        <InputRow label="Year" value={v.birthday_year} onChange={(x) => set('birthday_year', x ? parseInt(x) : null)} editing={!!editing} type="number" />
        <InputRow label="Age now" value={v.age_now} onChange={(x) => set('age_now', x ? parseFloat(x) : null)} editing={!!editing} type="number" step="0.5"/>
        {editing && (
          <SelectRow label="Life stage" value={v.life_stage} onChange={(x) => set('life_stage', x)} options={['puppy','adult','senior']} />
        )}
      </Section>
      <Section title="Diet & Health">
        <ReadRow label="Proteins known" value={(item.proteins_known || []).join(', ') || '—'} />
        <ReadRow label="Allergens known" value={(item.allergens_known || []).join(', ') || '—'} />
        {editing && (
          <>
            <InputRow label="Health conditions" value={(v.health_conditions || []).join(', ')} onChange={(x) => set('health_conditions', x.split(',').map(s => s.trim()).filter(Boolean))} editing={!!editing} testid="ed-health"/>
            <InputRow label="Gender" value={v.gender} onChange={(x) => set('gender', x)} editing={!!editing} />
            <InputRow label="Weight (kg)" value={v.weight_kg} onChange={(x) => set('weight_kg', parseFloat(x))} editing={!!editing} type="number" step="0.1"/>
            <div className="grid grid-cols-3 gap-2 py-1.5">
              <label className="text-sm text-gray-600">Spayed/Neutered</label>
              <input type="checkbox" checked={!!v.spayed_neutered} onChange={(e) => set('spayed_neutered', e.target.checked)} />
            </div>
          </>
        )}
      </Section>

      {/* 🌈 Rainbow Bridge — most critical field per spec */}
      <Section title="🌈 Rainbow Bridge">
        <p className="text-xs text-gray-500 mb-2 italic">When a pet has crossed the Rainbow Bridge, toggle this to remove them from birthday nudges. Mira will treat their family with extra care.</p>
        <div className="grid grid-cols-3 gap-2 py-1.5 items-center">
          <label className="text-sm text-gray-600">Has crossed the Rainbow Bridge?</label>
          <div className="col-span-2">
            {editing ? (
              <input type="checkbox" checked={!!v.is_rainbow_bridge} onChange={(e) => set('is_rainbow_bridge', e.target.checked)} data-testid="ed-rainbow"/>
            ) : (
              <span className={item.is_rainbow_bridge ? 'text-rose-700 font-medium' : 'text-gray-500'}>
                {item.is_rainbow_bridge ? '🌈 Yes — never sends birthday nudges' : 'No'}
              </span>
            )}
          </div>
        </div>
        {(editing ? v.is_rainbow_bridge : item.is_rainbow_bridge) && (
          <>
            <InputRow label="Date crossed" value={editing ? v.passed_date : (item.passed_date ? new Date(item.passed_date).toISOString().slice(0, 10) : '')}
              onChange={(x) => set('passed_date', x)} editing={!!editing} type="date" testid="ed-passed"/>
            <InputRow label="Memorial message" value={v.memorial_message} onChange={(x) => set('memorial_message', x)} editing={!!editing} testid="ed-memorial"/>
          </>
        )}
      </Section>

      <Section title="Migration">
        <ReadRow label="Migration status" value={item.migration_status} />
        <ReadRow label="Live pet ID" value={item.migrated_to_pet_id} />
        <ReadRow label="Imported" value={item.imported_at ? new Date(item.imported_at).toLocaleString() : '—'} />
        <ReadRow label="Staging ID" value={item.staging_id} />
      </Section>
    </div>
  );
};

const SelectRow = ({ label, value, onChange, options, testid }) => (
  <div className="grid grid-cols-3 gap-2 items-center py-1.5">
    <label className="text-sm text-gray-600">{label}</label>
    <div className="col-span-2">
      <select value={value || ''} onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1 border rounded text-sm" data-testid={testid}>
        <option value="">—</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  </div>
);

const Section = ({ title, children }) => (
  <div className="py-3">
    <h3 className="font-semibold text-sm uppercase text-gray-700 mb-2">{title}</h3>
    {children}
  </div>
);

// ── Create modal ──────────────────────────────────────────────────
const CreateModal = ({ tab, getAdminHeaders, onCreated, onClose }) => {
  const [form, setForm] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const submit = async () => {
    setSubmitting(true);
    try {
      const url = tab === 'parents' ? `${API}/api/admin/pet-parents` : `${API}/api/admin/tdb-pets`;
      const r = await fetch(url, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify(form),
      });
      if (r.ok) onCreated();
      else { const e = await r.json(); alert(e.detail); }
    } catch (e) { alert(e.message); }
    setSubmitting(false);
  };
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()} data-testid="create-modal">
        <h2 className="text-lg font-bold mb-4">Add new {tab === 'parents' ? 'Pet Parent' : 'Pet'}</h2>
        {tab === 'parents' ? (
          <>
            <FormInput label="First name" onChange={(v) => setForm({...form, first_name: v})} />
            <FormInput label="Last name" onChange={(v) => setForm({...form, last_name: v})} />
            <FormInput label="Email" onChange={(v) => setForm({...form, email: v})} />
            <FormInput label="Phone" onChange={(v) => setForm({...form, phone: v})} />
            <FormInput label="City" onChange={(v) => setForm({...form, city: v})} />
          </>
        ) : (
          <>
            <FormInput label="Parent customer key (email or phone with country code)*" onChange={(v) => setForm({...form, parent_customer_key: v})} required />
            <FormInput label="Pet name*" onChange={(v) => setForm({...form, name: v})} required />
            <FormInput label="Breed" onChange={(v) => setForm({...form, breed: v})} />
            <FormInput label="Birthday month" type="number" onChange={(v) => setForm({...form, birthday_month: parseInt(v)})} />
            <FormInput label="Birthday day" type="number" onChange={(v) => setForm({...form, birthday_day: parseInt(v)})} />
          </>
        )}
        <div className="flex gap-2 mt-4">
          <button onClick={submit} disabled={submitting} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded" data-testid="btn-create-submit">
            {submitting ? 'Creating…' : 'Create'}
          </button>
          <button onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
        </div>
      </div>
    </div>
  );
};

const FormInput = ({ label, type = 'text', onChange, required }) => (
  <div className="mb-3">
    <label className="block text-sm text-gray-600 mb-1">{label}</label>
    <input type={type} onChange={(e) => onChange(e.target.value)} required={required}
      className="w-full px-3 py-2 border rounded" />
  </div>
);

export default FoundingMembersManager;
