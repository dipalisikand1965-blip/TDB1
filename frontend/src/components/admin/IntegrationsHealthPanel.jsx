import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Activity, Mail, Image as ImageIcon, CreditCard, MessageSquare,
  Database, MapPin, RefreshCw, AlertTriangle, CheckCircle2, XCircle,
  Wifi, ShieldCheck, Clock, ChevronRight,
} from 'lucide-react';

const STATUS_CONFIG = {
  green: { color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', icon: CheckCircle2, label: 'Healthy' },
  amber: { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', icon: AlertTriangle, label: 'Watch' },
  red:   { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', icon: XCircle, label: 'Action needed' },
};

const ICON_BY_ID = {
  zoho: Activity,
  resend: Mail,
  cloudinary: ImageIcon,
  razorpay: CreditCard,
  gupshup: MessageSquare,
  sitevault: ShieldCheck,
  google_places: MapPin,
  atlas: Database,
  uptime_robot: Wifi,
};

const formatLocalTime = (iso) => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  } catch (_e) { return iso; }
};

const IntegrationsHealthPanel = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const API = process.env.REACT_APP_BACKEND_URL;

  const fetchHealth = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      const res = await fetch(`${API}/api/admin/integrations-health`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [API]);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 60000); // auto-refresh every 60s
    return () => clearInterval(interval);
  }, [fetchHealth]);

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500" data-testid="integrations-health-loading">
        <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-purple-500" />
        Probing integrations…
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 border-red-200 bg-red-50" data-testid="integrations-health-error">
        <div className="flex items-center gap-3 text-red-700">
          <XCircle className="w-6 h-6" />
          <div>
            <div className="font-semibold">Failed to load health panel</div>
            <div className="text-sm text-red-600">{error}</div>
          </div>
        </div>
        <Button onClick={fetchHealth} className="mt-4" data-testid="health-retry-btn">Retry</Button>
      </Card>
    );
  }

  const { integrations = [], counts = {}, all_healthy, generated_at } = data || {};

  return (
    <div className="space-y-6" data-testid="integrations-health-panel">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            {all_healthy ? (
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-7 h-7 text-amber-600" />
            )}
            Integrations Health
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Live status of every external service · auto-refresh every 60s
          </p>
        </div>
        <Button
          onClick={fetchHealth}
          variant="outline"
          size="sm"
          disabled={refreshing}
          data-testid="health-refresh-btn"
        >
          <RefreshCw className={`w-4 h-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Top-level summary */}
      <div className="grid grid-cols-3 gap-3">
        {['green', 'amber', 'red'].map((key) => {
          const cfg = STATUS_CONFIG[key];
          const Icon = cfg.icon;
          const n = counts[key] || 0;
          return (
            <Card
              key={key}
              className="p-4 border-2"
              style={{ borderColor: cfg.border, backgroundColor: cfg.bg }}
              data-testid={`health-summary-${key}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold" style={{ color: cfg.color }}>{n}</div>
                  <div className="text-sm font-medium" style={{ color: cfg.color }}>
                    {cfg.label}
                  </div>
                </div>
                <Icon className="w-8 h-8" style={{ color: cfg.color }} />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Integration list */}
      <div className="space-y-2">
        {integrations.map((it) => {
          const cfg = STATUS_CONFIG[it.status] || STATUS_CONFIG.amber;
          const Icon = ICON_BY_ID[it.id] || Activity;
          const StatusIcon = cfg.icon;
          const expanded = expandedId === it.id;

          return (
            <Card
              key={it.id}
              className="p-0 overflow-hidden border-l-4 transition-all hover:shadow-md cursor-pointer"
              style={{ borderLeftColor: cfg.color }}
              onClick={() => setExpandedId(expanded ? null : it.id)}
              data-testid={`health-row-${it.id}`}
            >
              <div className="p-4 flex items-center gap-4">
                {/* Icon block */}
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: cfg.bg }}
                >
                  <Icon className="w-6 h-6" style={{ color: cfg.color }} />
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-gray-900 truncate">{it.name}</span>
                    <Badge
                      variant="outline"
                      className="text-xs font-normal shrink-0"
                      style={{ borderColor: cfg.border, color: cfg.color, backgroundColor: cfg.bg }}
                    >
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {cfg.label}
                    </Badge>
                    <span className="text-xs text-gray-400 shrink-0">{it.category}</span>
                  </div>
                  <div className="text-sm text-gray-600 truncate">{it.summary}</div>
                </div>

                {/* Right meta */}
                <div className="text-right shrink-0">
                  {it.last_activity && (
                    <div className="text-xs text-gray-400 flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" />
                      {formatLocalTime(it.last_activity)}
                    </div>
                  )}
                  <div className="text-xs text-gray-400 mt-1 flex items-center justify-end gap-1">
                    {expanded ? 'Hide' : 'Details'}
                    <ChevronRight
                      className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`}
                    />
                  </div>
                </div>
              </div>

              {/* Expanded detail */}
              {expanded && (
                <div className="px-4 pb-4 pt-0 border-t bg-gray-50">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs pt-3">
                    <div>
                      <span className="text-gray-500">Enabled:</span>{' '}
                      <span className={it.enabled ? 'text-emerald-700 font-medium' : 'text-red-700 font-medium'}>
                        {it.enabled ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Configured:</span>{' '}
                      <span className={it.configured ? 'text-emerald-700 font-medium' : 'text-red-700 font-medium'}>
                        {it.configured ? 'Yes' : 'No'}
                      </span>
                    </div>
                    {it.last_activity && (
                      <div className="col-span-2">
                        <span className="text-gray-500">Last activity:</span>{' '}
                        <span className="font-mono text-gray-700">{it.last_activity}</span>
                      </div>
                    )}
                    {Object.entries(it.detail || {}).map(([k, v]) => (
                      <div key={k} className="col-span-2">
                        <span className="text-gray-500">{k}:</span>{' '}
                        <span className="font-mono text-gray-700 break-all">
                          {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <div className="text-xs text-gray-400 text-center pt-2">
        Generated {formatLocalTime(generated_at)} · auto-refreshing every 60s
      </div>
    </div>
  );
};

export default IntegrationsHealthPanel;
