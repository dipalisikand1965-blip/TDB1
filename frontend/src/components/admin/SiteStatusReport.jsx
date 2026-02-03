/**
 * SiteStatusReport.jsx
 * Dynamic site status dashboard with real-time data and export functionality
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  RefreshCw, Check, Clock, AlertCircle, FileText, Download,
  Package, Users, ShoppingBag, Ticket, MessageSquare, Cake,
  Utensils, Home, Stethoscope, GraduationCap, Loader2
} from 'lucide-react';
import { API_URL, getAuthHeaders } from '../../utils/api';

const SiteStatusReport = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/site-status`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch site status:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const downloadReport = () => {
    if (!status) return;
    
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { 
      day: '2-digit', month: 'short', year: 'numeric' 
    });
    const timeStr = now.toLocaleTimeString('en-IN', { 
      hour: '2-digit', minute: '2-digit' 
    });
    
    // Generate Word-compatible HTML
    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Site Status Report - ${dateStr}</title>
<style>
  body { font-family: Calibri, Arial, sans-serif; margin: 40px; line-height: 1.6; }
  h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
  h2 { color: #4b5563; margin-top: 30px; }
  .stat-box { display: inline-block; padding: 15px 25px; margin: 10px; background: #f3f4f6; border-radius: 8px; }
  .stat-number { font-size: 28px; font-weight: bold; color: #1f2937; }
  .stat-label { font-size: 12px; color: #6b7280; }
  .status-working { color: #059669; }
  .status-pending { color: #d97706; }
  .status-blocked { color: #dc2626; }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
  th { background: #f9fafb; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; }
</style>
</head>
<body>
<h1>🐾 The Doggy Company - Site Status Report</h1>
<p><strong>Generated:</strong> ${dateStr} at ${timeStr}</p>
<p><strong>Status:</strong> <span style="color: #059669;">✅ Operational</span></p>

<h2>📊 Quick Stats (Today)</h2>
<div>
  <div class="stat-box">
    <div class="stat-number">${status.stats?.products || 0}</div>
    <div class="stat-label">Products</div>
  </div>
  <div class="stat-box">
    <div class="stat-number">${status.stats?.services || 0}</div>
    <div class="stat-label">Services</div>
  </div>
  <div class="stat-box">
    <div class="stat-number">${status.stats?.members || 0}</div>
    <div class="stat-label">Members</div>
  </div>
  <div class="stat-box">
    <div class="stat-number">${status.stats?.tickets_open || 0}</div>
    <div class="stat-label">Open Tickets</div>
  </div>
  <div class="stat-box">
    <div class="stat-number">${status.stats?.quotes_pending || 0}</div>
    <div class="stat-label">Pending Quotes</div>
  </div>
</div>

<h2>🎯 Ticket Summary</h2>
<table>
  <tr><th>Metric</th><th>Count</th></tr>
  <tr><td>Total Tickets</td><td>${status.stats?.tickets_total || 0}</td></tr>
  <tr><td>Open/Pending</td><td>${status.stats?.tickets_open || 0}</td></tr>
  <tr><td>Blocked</td><td style="color: #dc2626;">${status.stats?.tickets_blocked || 0}</td></tr>
  <tr><td>Created Today</td><td>${status.stats?.tickets_today || 0}</td></tr>
</table>

<h2>✅ Working Features (${status.features?.working?.length || 0})</h2>
<ul>
${status.features?.working?.map(f => `  <li class="status-working">✅ ${f}</li>`).join('\n') || ''}
</ul>

<h2>⏳ Pending Features (${status.features?.pending?.length || 0})</h2>
<ul>
${status.features?.pending?.map(f => `  <li class="status-pending">⏳ ${f}</li>`).join('\n') || ''}
</ul>

<h2>🚫 Blocked (${status.features?.blocked?.length || 0})</h2>
<ul>
${status.features?.blocked?.map(f => `  <li class="status-blocked">🚫 ${f}</li>`).join('\n') || ''}
</ul>

<h2>🏪 Pillar Status</h2>
<table>
  <tr><th>Pillar</th><th>Status</th><th>Items</th></tr>
  ${Object.entries(status.pillars || {}).map(([key, val]) => 
    `<tr><td>${key.charAt(0).toUpperCase() + key.slice(1)}</td><td>${val.status}</td><td>${val.count}</td></tr>`
  ).join('\n')}
</table>

<h2>📈 Content Summary</h2>
<table>
  <tr><th>Content Type</th><th>Count</th></tr>
  <tr><td>Blogs</td><td>${status.stats?.blogs || 0}</td></tr>
  <tr><td>FAQs</td><td>${status.stats?.faqs || 0}</td></tr>
  <tr><td>Collections</td><td>${status.stats?.collections || 0}</td></tr>
  <tr><td>Party Requests</td><td>${status.stats?.party_requests || 0}</td></tr>
  <tr><td>Quotes Created</td><td>${status.stats?.quotes || 0}</td></tr>
</table>

<h2>🔐 Test Credentials</h2>
<table>
  <tr><th>Account</th><th>Credentials</th></tr>
  <tr><td>Member Login</td><td>dipali@clubconcierge.in / test123</td></tr>
  <tr><td>Admin Login</td><td>aditya / lola4304</td></tr>
</table>

<div class="footer">
  <p>Report generated by The Doggy Company Admin System</p>
  <p>For questions, contact: tech@thedoggycompany.in</p>
</div>
</body>
</html>`;
    
    // Create and download blob
    const blob = new Blob([html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Site_Status_Report_${dateStr.replace(/\s/g, '_')}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading && !status) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
          <span>Loading site status...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Site Status Report</h2>
          <p className="text-gray-500">
            Current system health and statistics
            {lastUpdated && (
              <span className="ml-2 text-xs text-gray-400">
                Last updated: {lastUpdated.toLocaleTimeString('en-IN')}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={fetchStatus}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={downloadReport}
            className="bg-gradient-to-r from-blue-600 to-purple-600"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Report (.doc)
          </Button>
        </div>
      </div>

      {/* Quick Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
              <Check className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">
                {status?.features?.working?.length || 0}
              </p>
              <p className="text-sm text-green-600">Features Working</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-700">
                {status?.features?.pending?.length || 0}
              </p>
              <p className="text-sm text-yellow-600">Pending Features</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-700">
                {status?.features?.blocked?.length || 0}
              </p>
              <p className="text-sm text-red-600">Blocked (Awaiting Keys)</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Today's Stats */}
      <div className="mb-8">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-purple-600" />
          Today&apos;s Numbers
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-4 text-center">
            <ShoppingBag className="w-6 h-6 mx-auto mb-2 text-teal-600" />
            <p className="text-2xl font-bold">{status?.stats?.products || 0}</p>
            <p className="text-xs text-gray-500">Products</p>
          </Card>
          <Card className="p-4 text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold">{status?.stats?.members || 0}</p>
            <p className="text-xs text-gray-500">Members</p>
          </Card>
          <Card className="p-4 text-center">
            <Ticket className="w-6 h-6 mx-auto mb-2 text-orange-600" />
            <p className="text-2xl font-bold">{status?.stats?.tickets_open || 0}</p>
            <p className="text-xs text-gray-500">Open Tickets</p>
          </Card>
          <Card className="p-4 text-center">
            <AlertCircle className="w-6 h-6 mx-auto mb-2 text-red-600" />
            <p className="text-2xl font-bold">{status?.stats?.tickets_blocked || 0}</p>
            <p className="text-xs text-gray-500">Blocked Tickets</p>
          </Card>
          <Card className="p-4 text-center">
            <FileText className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <p className="text-2xl font-bold">{status?.stats?.quotes_pending || 0}</p>
            <p className="text-xs text-gray-500">Pending Quotes</p>
          </Card>
        </div>
      </div>

      {/* Ticket Summary */}
      <div className="mb-8">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Ticket className="w-5 h-5 text-orange-600" />
          Ticket Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Total Tickets</p>
            <p className="text-xl font-bold">{status?.stats?.tickets_total || 0}</p>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-600">Open/Pending</p>
            <p className="text-xl font-bold text-yellow-700">{status?.stats?.tickets_open || 0}</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <p className="text-sm text-red-600">Blocked</p>
            <p className="text-xl font-bold text-red-700">{status?.stats?.tickets_blocked || 0}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600">Created Today</p>
            <p className="text-xl font-bold text-blue-700">{status?.stats?.tickets_today || 0}</p>
          </div>
        </div>
      </div>

      {/* Feature Lists */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Working */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2 text-green-700">
            <Check className="w-4 h-4" /> Working Features
          </h4>
          <div className="space-y-2">
            {status?.features?.working?.map((feature, i) => (
              <div key={i} className="text-sm p-2 bg-green-50 rounded flex items-center gap-2">
                <span className="text-green-600">✅</span>
                {feature}
              </div>
            ))}
          </div>
        </div>
        
        {/* Pending */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2 text-yellow-700">
            <Clock className="w-4 h-4" /> Pending
          </h4>
          <div className="space-y-2">
            {status?.features?.pending?.map((feature, i) => (
              <div key={i} className="text-sm p-2 bg-yellow-50 rounded flex items-center gap-2">
                <span className="text-yellow-600">⏳</span>
                {feature}
              </div>
            ))}
          </div>
        </div>
        
        {/* Blocked */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2 text-red-700">
            <AlertCircle className="w-4 h-4" /> Blocked
          </h4>
          <div className="space-y-2">
            {status?.features?.blocked?.map((feature, i) => (
              <div key={i} className="text-sm p-2 bg-red-50 rounded flex items-center gap-2">
                <span className="text-red-600">🚫</span>
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Test Credentials */}
      <div className="p-4 bg-gray-100 rounded-lg">
        <h3 className="font-bold mb-3">Test Credentials</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Member Login</p>
            <p className="font-mono">dipali@clubconcierge.in / test123</p>
          </div>
          <div>
            <p className="text-gray-500">Admin Login</p>
            <p className="font-mono">aditya / lola4304</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SiteStatusReport;
