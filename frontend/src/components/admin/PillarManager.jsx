import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import {
  Bell, Building2, Package, Briefcase, Gift, Sparkles, Settings,
  RefreshCw, Loader2, Clock, Plus, ChevronDown
} from 'lucide-react';
import PillarProductsTab from './PillarProductsTab';
import PillarServicesTab from './PillarServicesTab';
import PillarBundlesTab from './PillarBundlesTab';
import { API_URL } from '../../utils/api';

// ─── PillarManager.jsx ────────────────────────────────────────────────────────
// Universal pillar admin — used by GoManager, PlayManager, and any future pillar
// that doesn't need a fully custom UI.
//
// All 7 standard tabs: Requests · Partners · Products · Services · Bundles · Tips · Settings
//
// Props:
//   pillar          — pillar id string e.g. 'go', 'play'
//   pillarLabel     — display name e.g. 'Go', 'Play'
//   pillarEmoji     — emoji icon
//   pillarColor     — CSS class fragment (e.g. 'purple')
//   pillarDescription — short description shown in header
//   noteText        — optional warning note

const STATUS_COLORS = {
  open:        'bg-blue-100 text-blue-800',
  new:         'bg-purple-100 text-purple-800',
  pending:     'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-orange-100 text-orange-800',
  resolved:    'bg-green-100 text-green-800',
  closed:      'bg-gray-100 text-gray-700',
};

export default function PillarManager({
  token,
  pillar,
  pillarLabel,
  pillarEmoji = '🐾',
  pillarColor = '#7c3aed',
  pillarDescription = '',
  categories = [],
  noteText = null,
}) {
  const [activeTab, setActiveTab]           = useState('requests');
  const [requests, setRequests]             = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestSearch, setRequestSearch]   = useState('');
  // Quick Add triggers — incrementing signals child tab to open create modal
  const [productCreateTrigger, setProductCreateTrigger] = useState(0);
  const [serviceCreateTrigger, setServiceCreateTrigger] = useState(0);
  const [bundleCreateTrigger, setBundleCreateTrigger]   = useState(0);

  const fetchRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const res = await fetch(
        `${API_URL}/api/service_desk/tickets?pillar=${encodeURIComponent(pillar)}&limit=200`
      );
      if (res.ok) {
        const data = await res.json();
        setRequests(data.tickets || []);
      }
    } catch { /* silent */ }
    setLoadingRequests(false);
  }, [pillar]);

  useEffect(() => {
    if (activeTab === 'requests') fetchRequests();
  }, [activeTab, fetchRequests]);

  const filteredRequests = requests.filter(r =>
    !requestSearch ||
    (r.service_name || r.service_type || r.pet_name || r.notes || '')
      .toLowerCase()
      .includes(requestSearch.toLowerCase())
  );

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{pillarEmoji}</span>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{pillarLabel} Manager</h2>
            {pillarDescription && (
              <p className="text-sm text-gray-500 mt-0.5">{pillarDescription}</p>
            )}
          </div>
        </div>
        {/* Quick Add shortcut */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white" data-testid={`${pillar}-quick-add`}>
              <Plus className="w-4 h-4 mr-1" /> Quick Add
              <ChevronDown className="w-3 h-3 ml-1 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={() => { setActiveTab('products'); setProductCreateTrigger(n => n + 1); }}
              data-testid={`${pillar}-quick-add-product`}
            >
              <Package className="w-4 h-4 mr-2 text-purple-600" /> + Add Product
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => { setActiveTab('services'); setServiceCreateTrigger(n => n + 1); }}
              data-testid={`${pillar}-quick-add-service`}
            >
              <Briefcase className="w-4 h-4 mr-2 text-blue-600" /> + Add Service
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => { setActiveTab('bundles'); setBundleCreateTrigger(n => n + 1); }}
              data-testid={`${pillar}-quick-add-bundle`}
            >
              <Gift className="w-4 h-4 mr-2 text-green-600" /> + Add Bundle
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {noteText && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-700">
          {noteText}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="requests" data-testid={`${pillar}-tab-requests`}>
            <Bell className="w-4 h-4 mr-1.5" /> Requests
          </TabsTrigger>
          <TabsTrigger value="partners" data-testid={`${pillar}-tab-partners`}>
            <Building2 className="w-4 h-4 mr-1.5" /> Partners
          </TabsTrigger>
          <TabsTrigger value="products" data-testid={`${pillar}-tab-products`}>
            <Package className="w-4 h-4 mr-1.5" /> Products
          </TabsTrigger>
          <TabsTrigger value="services" data-testid={`${pillar}-tab-services`}>
            <Briefcase className="w-4 h-4 mr-1.5" /> Services
          </TabsTrigger>
          <TabsTrigger value="bundles" data-testid={`${pillar}-tab-bundles`}>
            <Gift className="w-4 h-4 mr-1.5" /> Bundles
          </TabsTrigger>
          <TabsTrigger value="tips" data-testid={`${pillar}-tab-tips`}>
            <Sparkles className="w-4 h-4 mr-1.5" /> Tips
          </TabsTrigger>
          <TabsTrigger value="settings" data-testid={`${pillar}-tab-settings`}>
            <Settings className="w-4 h-4 mr-1.5" /> Settings
          </TabsTrigger>
        </TabsList>

        {/* ── REQUESTS ─────────────────────────────────────────────────── */}
        <TabsContent value="requests" className="mt-4 space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder={`Search ${pillarLabel} requests...`}
              value={requestSearch}
              onChange={e => setRequestSearch(e.target.value)}
              className="flex-1"
              data-testid={`${pillar}-request-search`}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRequests}
              disabled={loadingRequests}
              data-testid={`${pillar}-request-refresh`}
            >
              {loadingRequests
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <RefreshCw className="w-4 h-4" />
              }
            </Button>
          </div>

          {loadingRequests ? (
            <div className="text-center py-12 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p className="text-sm">Loading requests…</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <Card className="p-8 text-center">
              <Bell className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="font-medium text-gray-500">No {pillarLabel} requests yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Service desk tickets for this pillar will appear here
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredRequests.map((r, i) => (
                <Card
                  key={r.ticket_id || i}
                  className="p-4 hover:shadow-sm transition-shadow"
                  data-testid={`${pillar}-request-card`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-mono text-xs text-gray-400">{r.ticket_id}</span>
                        <Badge className={STATUS_COLORS[r.status] || 'bg-blue-100 text-blue-800'}>
                          {r.status || 'new'}
                        </Badge>
                        {r.urgency === 'critical' && (
                          <Badge className="bg-red-100 text-red-800">Urgent</Badge>
                        )}
                      </div>
                      <p className="font-semibold text-gray-800 text-sm">
                        {r.service_name || r.service_type || r.intent_primary || 'Service Request'}
                      </p>
                      {r.pet_name && (
                        <p className="text-xs text-gray-500 mt-0.5">Pet: {r.pet_name}</p>
                      )}
                      {(r.notes || r.details) && (
                        <p className="text-xs text-gray-400 mt-1 truncate">
                          {r.notes || r.details}
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 whitespace-nowrap flex items-center gap-1 flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── PARTNERS ─────────────────────────────────────────────────── */}
        <TabsContent value="partners" className="mt-4">
          <Card className="p-8 text-center" data-testid={`${pillar}-partners-panel`}>
            <Building2 className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-600">{pillarLabel} Partners</p>
            <p className="text-sm text-gray-400 mt-1">
              Partner management for the {pillarLabel} pillar coming soon
            </p>
          </Card>
        </TabsContent>

        {/* ── PRODUCTS ─────────────────────────────────────────────────── */}
        <TabsContent value="products" className="mt-4">
          <PillarProductsTab pillar={pillar} pillarName={pillarLabel} createTrigger={productCreateTrigger} />
        </TabsContent>

        {/* ── SERVICES ─────────────────────────────────────────────────── */}
        <TabsContent value="services" className="mt-4">
          <PillarServicesTab pillar={pillar} pillarName={pillarLabel} createTrigger={serviceCreateTrigger} />
        </TabsContent>

        {/* ── BUNDLES ──────────────────────────────────────────────────── */}
        <TabsContent value="bundles" className="mt-4">
          <PillarBundlesTab pillar={pillar} pillarName={pillarLabel} createTrigger={bundleCreateTrigger} />
        </TabsContent>

        {/* ── TIPS ─────────────────────────────────────────────────────── */}
        <TabsContent value="tips" className="mt-4">
          <Card className="p-8 text-center" data-testid={`${pillar}-tips-panel`}>
            <Sparkles className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-600">{pillarLabel} Tips</p>
            <p className="text-sm text-gray-400 mt-1">
              Quick win tips and Mira prompts for {pillarLabel} coming soon
            </p>
          </Card>
        </TabsContent>

        {/* ── SETTINGS ─────────────────────────────────────────────────── */}
        <TabsContent value="settings" className="mt-4">
          <Card className="p-6" data-testid={`${pillar}-settings-panel`}>
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              {pillarLabel} Pillar Settings
            </h3>
            <div className="space-y-1 text-sm divide-y">
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-gray-800">Pillar ID</p>
                  <p className="text-xs text-gray-400">Internal identifier used across the system</p>
                </div>
                <code className="bg-gray-100 text-gray-700 px-2 py-1 rounded font-mono text-xs">
                  {pillar}
                </code>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-gray-800">Display Name</p>
                  <p className="text-xs text-gray-400">Label shown to users and in navigation</p>
                </div>
                <span className="font-medium text-gray-700">{pillarLabel}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-gray-800">Emoji</p>
                  <p className="text-xs text-gray-400">Icon used in navigation and headings</p>
                </div>
                <span className="text-2xl">{pillarEmoji}</span>
              </div>
              <p className="text-xs text-gray-400 pt-3">
                Advanced pillar settings (enable/disable, pricing rules, visibility) are configured
                in the global Admin Settings.
              </p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
