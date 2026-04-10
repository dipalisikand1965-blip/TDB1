import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Download, Upload, Database, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { getApiUrl } from '../utils/api';

export default function DataMigration({ adminAuth }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [message, setMessage] = useState(null);
  const [exportData, setExportData] = useState(null);
  const [restoring, setRestoring] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState(null);
  const [restoreResult, setRestoreResult] = useState(null);

  const checkRestoreStatus = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/db/restore-status`);
      if (res.ok) setRestoreStatus(await res.json());
    } catch (e) { /* silent */ }
  };

  const handleRestore = async () => {
    if (!window.confirm('This will load all backed-up data (products, pets, services, members) into the current database.\n\nSafe to run — it will not delete existing data.\n\nContinue?')) return;
    setRestoring(true);
    setRestoreResult(null);
    setMessage(null);
    try {
      // Fire-and-forget — backend returns immediately, restore runs in background
      const res = await fetch(`${getApiUrl()}/api/admin/db/restore`, {
        method: 'POST',
        headers: { 'Authorization': `Basic ${adminAuth}` }
      });
      const kick = await res.json();
      if (kick.status !== 'started' && kick.status !== 'already_running') {
        setMessage({ type: 'error', text: `Could not start restore: ${JSON.stringify(kick)}` });
        setRestoring(false);
        return;
      }

      // Poll /restore-progress every 2 seconds until done
      const poll = setInterval(async () => {
        try {
          const pr = await fetch(`${getApiUrl()}/api/admin/db/restore-progress`);
          const state = await pr.json();
          const done = state.collections_done ?? 0;
          const total = state.collections_total ?? 14;
          const col = state.current_collection ? ` — ${state.current_collection}` : '';
          setMessage({ type: 'info', text: `Restoring... ${done}/${total} collections${col}` });

          if (state.status === 'complete' || state.status === 'complete_with_errors') {
            clearInterval(poll);
            setRestoring(false);
            setRestoreResult(state);
            const patched  = state.visitor_tickets_patched ?? 0;
            const inferred = state.pets_archetypes_inferred ?? 0;
            const patchMsg = patched  > 0 ? ` + ${patched} tickets patched`   : '';
            const archMsg  = inferred > 0 ? ` + ${inferred} archetypes live`  : '';
            setMessage({ type: 'success', text: `✅ Database restored — ${state.total_docs?.toLocaleString()} docs in ${state.duration_seconds}s${patchMsg}${archMsg}` });
            fetchStats();
          } else if (state.status === 'error') {
            clearInterval(poll);
            setRestoring(false);
            setMessage({ type: 'error', text: `Restore failed: ${JSON.stringify(state.errors)}` });
          }
        } catch (pollErr) {
          // Network hiccup — keep polling
        }
      }, 2000);

    } catch (e) {
      setMessage({ type: 'error', text: `Error: ${e.message}` });
      setRestoring(false);
    }
  };

  useEffect(() => { checkRestoreStatus(); }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/migration/stats`, {
        headers: { 'Authorization': `Basic ${adminAuth}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleExport = async () => {
    setExporting(true);
    setMessage(null);
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/migration/export-all`, {
        headers: { 'Authorization': `Basic ${adminAuth}` }
      });
      if (res.ok) {
        const data = await res.json();
        setExportData(data);
        
        // Create downloadable file
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `doggy-company-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setMessage({ type: 'success', text: `Export complete! Downloaded ${data.summary.products} products, ${data.summary.restaurants} restaurants, and more.` });
      } else {
        setMessage({ type: 'error', text: 'Export failed. Please try again.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: `Export error: ${err.message}` });
    }
    setExporting(false);
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImporting(true);
    setMessage(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const res = await fetch(`${getApiUrl()}/api/admin/migration/import-all`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${adminAuth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        const result = await res.json();
        const imported = result.imported;
        setMessage({ 
          type: 'success', 
          text: `Import complete! Imported: ${imported.products || 0} products, ${imported.restaurants || 0} restaurants, ${imported.pillars || 0} pillars, ${imported.categories || 0} categories, ${imported.enhanced_collections || 0} collections` 
        });
        fetchStats(); // Refresh stats
      } else {
        const error = await res.json();
        setMessage({ type: 'error', text: `Import failed: ${error.detail}` });
      }
    } catch (err) {
      setMessage({ type: 'error', text: `Import error: ${err.message}` });
    }
    setImporting(false);
    event.target.value = ''; // Reset file input
  };

  const handleSeedCoreData = async () => {
    setSeeding(true);
    setMessage(null);
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/migration/seed-core-data`, {
        method: 'POST',
        headers: { 'Authorization': `Basic ${adminAuth}` }
      });
      if (res.ok) {
        const result = await res.json();
        setMessage({ 
          type: 'success', 
          text: `Core data seeded! Created ${result.results.pillars_created} pillars and ${result.results.categories_created} categories.` 
        });
        fetchStats();
      } else {
        setMessage({ type: 'error', text: 'Seeding failed. Please try again.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: `Seeding error: ${err.message}` });
    }
    setSeeding(false);
  };

  return (
    <div className="space-y-6" data-testid="data-migration-page">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Data Migration Tool</h2>
        <Button variant="outline" onClick={fetchStats} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Stats
        </Button>
      </div>

      {message && (
        <Alert className={message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4 text-green-600" /> : <AlertTriangle className="w-4 h-4 text-red-600" />}
          <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* ── RESTORE FROM BACKUP — use after fresh deployment ── */}
      <Card className="border-2 border-emerald-400 bg-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-800">
            <Database className="w-5 h-5 text-emerald-600" />
            Restore Database from Backup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-emerald-800">
            Use this after a fresh deployment to load all your data — products, soul products, services, pets, members and more — into the live database. Safe to run anytime (won't create duplicates).
          </p>

          {restoreStatus && (
            <div className="grid grid-cols-3 gap-2 text-center">
              {['products_master','breed_products','services_master','pets','users','guided_paths'].map(col => {
                const info = restoreStatus.collections?.[col];
                return info?.ready ? (
                  <div key={col} className="bg-white rounded p-2 text-xs">
                    <div className="font-bold text-emerald-700">{info.docs?.toLocaleString()}</div>
                    <div className="text-gray-500">{col.replace('_master','').replace('_',' ')}</div>
                  </div>
                ) : null;
              })}
            </div>
          )}

          {restoreResult && (
            <div className="bg-white rounded-lg p-3 text-xs space-y-1 max-h-48 overflow-y-auto">
              {Object.entries(restoreResult.collections || {}).map(([col, r]) => (
                <div key={col} className="flex justify-between text-gray-600">
                  <span>{col}</span>
                  <span className="text-emerald-600">{r.inserted} new, {r.updated} updated</span>
                </div>
              ))}
            </div>
          )}

          <Button
            onClick={handleRestore}
            disabled={restoring}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3"
            data-testid="restore-db-btn"
          >
            {restoring ? (
              <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Restoring... (takes ~20 seconds)</>
            ) : (
              <><Database className="w-4 h-4 mr-2" /> Restore All Data to Live Database</>
            )}
          </Button>
          <p className="text-xs text-emerald-700 text-center">Run this once after every fresh deployment</p>
        </CardContent>
      </Card>

      {/* Current Database Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Current Database Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stats.products}</div>
                <div className="text-sm text-gray-600">Products</div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.restaurants}</div>
                <div className="text-sm text-gray-600">Restaurants</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.pillars}</div>
                <div className="text-sm text-gray-600">Pillars</div>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{stats.categories}</div>
                <div className="text-sm text-gray-600">Categories</div>
              </div>
              <div className="p-4 bg-pink-50 rounded-lg">
                <div className="text-2xl font-bold text-pink-600">{stats.enhanced_collections}</div>
                <div className="text-sm text-gray-600">Collections</div>
              </div>
              <div className="p-4 bg-cyan-50 rounded-lg">
                <div className="text-2xl font-bold text-cyan-600">{stats.orders}</div>
                <div className="text-sm text-gray-600">Orders</div>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg">
                <div className="text-2xl font-bold text-amber-600">{stats.users}</div>
                <div className="text-sm text-gray-600">Users</div>
              </div>
              <div className="p-4 bg-indigo-50 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">{stats.partner_applications}</div>
                <div className="text-sm text-gray-600">Partners</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">Loading stats...</div>
          )}
        </CardContent>
      </Card>

      {/* Migration Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Export Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-blue-600" />
              Export Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Download all your data (products, restaurants, pillars, categories, collections) as a JSON file. 
              Use this to backup your data or transfer to another environment.
            </p>
            <Button 
              onClick={handleExport} 
              disabled={exporting}
              className="w-full bg-blue-600 hover:bg-blue-700"
              data-testid="export-data-btn"
            >
              {exporting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export All Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Import Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-green-600" />
              Import Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Upload a previously exported JSON file to import data into this environment.
              Existing records will be updated (upsert), not duplicated.
            </p>
            <label className="block">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                disabled={importing}
                className="hidden"
                data-testid="import-file-input"
              />
              <Button 
                as="span"
                disabled={importing}
                className="w-full bg-green-600 hover:bg-green-700 cursor-pointer"
                onClick={() => document.querySelector('[data-testid="import-file-input"]').click()}
                data-testid="import-data-btn"
              >
                {importing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Import Data from File
                  </>
                )}
              </Button>
            </label>
          </CardContent>
        </Card>
      </div>

      {/* Seed Core Data Card */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Setup: Seed Core Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            If this is a fresh deployment, click below to create the default Pillars (Celebrate, Dine, Stay, Travel, Care) 
            and basic Categories. This is safe to run multiple times - it won't create duplicates.
          </p>
          <Button 
            onClick={handleSeedCoreData} 
            disabled={seeding}
            variant="outline"
            data-testid="seed-core-data-btn"
          >
            {seeding ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Seeding...
              </>
            ) : (
              'Seed Core Pillars & Categories'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-amber-50 border-amber-200">
        <CardHeader>
          <CardTitle className="text-amber-800">How to Migrate Data to Production</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-amber-900">
          <p><strong>Step 1:</strong> In your PREVIEW environment (this chat/fork), click "Export All Data" to download a JSON file.</p>
          <p><strong>Step 2:</strong> Deploy your app to production.</p>
          <p><strong>Step 3:</strong> Go to the Admin panel on your PRODUCTION site (thedoggycompany.in/admin).</p>
          <p><strong>Step 4:</strong> Navigate to Data Migration and click "Import Data from File".</p>
          <p><strong>Step 5:</strong> Select the JSON file you exported in Step 1. Your data will be imported!</p>
        </CardContent>
      </Card>
    </div>
  );
}
