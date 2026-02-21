/**
 * ReportBuilder - Intelligent Report Generation System
 * Features:
 * - Custom report creation with multiple metrics
 * - Date range selection
 * - Pillar/category filtering
 * - CSV/Excel export
 * - Email scheduling
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';
import {
  FileText, Download, Mail, Calendar, Filter, BarChart3,
  TrendingUp, Users, Package, DollarSign, PawPrint, Ticket,
  Clock, RefreshCw, Plus, Trash2, Save, Send, Eye, Loader2,
  ChevronDown, CheckCircle, AlertCircle
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { API_URL } from '../../utils/api';

// Report Types
const REPORT_TYPES = [
  { id: 'daily_summary', name: 'Daily Summary', icon: Calendar, description: 'Orders, revenue, tickets for a day' },
  { id: 'pillar_performance', name: 'Pillar Performance', icon: BarChart3, description: 'Revenue by pillar (Celebrate, Dine, Stay, etc.)' },
  { id: 'member_analytics', name: 'Member Analytics', icon: Users, description: 'Member signups, engagement, retention' },
  { id: 'order_report', name: 'Order Report', icon: Package, description: 'All orders with details' },
  { id: 'revenue_report', name: 'Revenue Report', icon: DollarSign, description: 'Revenue breakdown with GST' },
  { id: 'ticket_report', name: 'Ticket Report', icon: Ticket, description: 'Service desk tickets and resolution times' },
  { id: 'pet_analytics', name: 'Pet Analytics', icon: PawPrint, description: 'Pet registrations and soul scores' },
  { id: 'product_performance', name: 'Product Performance', icon: TrendingUp, description: 'Best sellers, low stock, wishlist' }
];

// Date Presets
const DATE_PRESETS = [
  { id: 'today', name: 'Today' },
  { id: 'yesterday', name: 'Yesterday' },
  { id: 'this_week', name: 'This Week' },
  { id: 'last_week', name: 'Last Week' },
  { id: 'this_month', name: 'This Month' },
  { id: 'last_month', name: 'Last Month' },
  { id: 'last_30_days', name: 'Last 30 Days' },
  { id: 'last_90_days', name: 'Last 90 Days' },
  { id: 'this_year', name: 'This Year' },
  { id: 'custom', name: 'Custom Range' }
];

// Pillars
const PILLARS = [
  { id: 'all', name: 'All Pillars' },
  { id: 'celebrate', name: '🎂 Celebrate' },
  { id: 'dine', name: '🍽️ Dine' },
  { id: 'stay', name: '🏨 Stay' },
  { id: 'travel', name: '✈️ Travel' },
  { id: 'care', name: '💊 Care' },
  { id: 'enjoy', name: '🎾 Enjoy' },
  { id: 'fit', name: '🏃 Fit' },
  { id: 'shop', name: '🛒 Shop' }
];

const ReportBuilder = ({ getAuthHeader }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('builder');
  
  // Report Configuration
  const [selectedReportType, setSelectedReportType] = useState('daily_summary');
  const [datePreset, setDatePreset] = useState('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedPillar, setSelectedPillar] = useState('all');
  
  // Generated Report
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // Email Scheduling
  const [scheduleConfig, setScheduleConfig] = useState({
    enabled: false,
    recipients: '',
    frequency: 'daily',
    time: '09:00',
    reportTypes: ['daily_summary']
  });
  
  // Saved Reports
  const [savedReports, setSavedReports] = useState([]);
  
  const authHeaders = typeof getAuthHeader === 'function' ? getAuthHeader() : getAuthHeader;

  // Fetch report data
  const generateReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        report_type: selectedReportType,
        period: datePreset,
        pillar: selectedPillar
      });
      
      if (datePreset === 'custom' && customStartDate && customEndDate) {
        params.append('start_date', customStartDate);
        params.append('end_date', customEndDate);
      }
      
      const response = await fetch(`${API_URL}/api/admin/reports/generate?${params}`, authHeaders);
      
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
        toast({ title: 'Report Generated', description: 'Your report is ready to view or download' });
      } else {
        throw new Error('Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast({ title: 'Error', description: 'Failed to generate report', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Export to CSV
  const exportToCSV = async () => {
    if (!reportData) return;
    
    setExporting(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/reports/export/csv?report_type=${selectedReportType}&period=${datePreset}&pillar=${selectedPillar}`, authHeaders);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedReportType}_${datePreset}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast({ title: 'Downloaded', description: 'CSV report downloaded successfully' });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({ title: 'Error', description: 'Failed to export report', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  // Export to Excel
  const exportToExcel = async () => {
    if (!reportData) return;
    
    setExporting(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/reports/export/excel?report_type=${selectedReportType}&period=${datePreset}&pillar=${selectedPillar}`, authHeaders);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedReportType}_${datePreset}_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast({ title: 'Downloaded', description: 'Excel report downloaded successfully' });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({ title: 'Error', description: 'Failed to export report', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  // Save email schedule
  const saveSchedule = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/reports/schedule`, {
        ...authHeaders,
        method: 'POST',
        headers: { ...authHeaders.headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleConfig)
      });
      
      if (response.ok) {
        toast({ title: 'Saved', description: 'Email schedule saved successfully' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save schedule', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-purple-600" />
            Report Builder
          </h2>
          <p className="text-gray-500 mt-1">Create custom reports, export data, and schedule email delivery</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-[400px]">
          <TabsTrigger value="builder">
            <BarChart3 className="w-4 h-4 mr-2" /> Build Report
          </TabsTrigger>
          <TabsTrigger value="schedule">
            <Mail className="w-4 h-4 mr-2" /> Email Schedule
          </TabsTrigger>
          <TabsTrigger value="saved">
            <Save className="w-4 h-4 mr-2" /> Saved Reports
          </TabsTrigger>
        </TabsList>

        {/* BUILD REPORT TAB */}
        <TabsContent value="builder" className="space-y-6 mt-6">
          <div className="grid grid-cols-3 gap-6">
            {/* Left Column - Configuration */}
            <Card className="col-span-1 p-6 space-y-6">
              <div>
                <Label className="text-sm font-semibold text-gray-700">Report Type</Label>
                <div className="mt-2 space-y-2 max-h-[300px] overflow-y-auto">
                  {REPORT_TYPES.map(type => (
                    <div
                      key={type.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedReportType === type.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedReportType(type.id)}
                    >
                      <div className="flex items-center gap-2">
                        <type.icon className={`w-4 h-4 ${selectedReportType === type.id ? 'text-purple-600' : 'text-gray-400'}`} />
                        <span className="font-medium text-sm">{type.name}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold text-gray-700">Date Range</Label>
                <select
                  value={datePreset}
                  onChange={(e) => setDatePreset(e.target.value)}
                  className="w-full mt-2 p-2 border rounded-md"
                >
                  {DATE_PRESETS.map(preset => (
                    <option key={preset.id} value={preset.id}>{preset.name}</option>
                  ))}
                </select>
                
                {datePreset === 'custom' && (
                  <div className="mt-3 space-y-2">
                    <div>
                      <Label className="text-xs">Start Date</Label>
                      <Input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">End Date</Label>
                      <Input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-sm font-semibold text-gray-700">Filter by Pillar</Label>
                <select
                  value={selectedPillar}
                  onChange={(e) => setSelectedPillar(e.target.value)}
                  className="w-full mt-2 p-2 border rounded-md"
                >
                  {PILLARS.map(pillar => (
                    <option key={pillar.id} value={pillar.id}>{pillar.name}</option>
                  ))}
                </select>
              </div>

              <Button 
                onClick={generateReport} 
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <BarChart3 className="w-4 h-4 mr-2" />
                )}
                Generate Report
              </Button>
            </Card>

            {/* Right Column - Report Preview */}
            <Card className="col-span-2 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-lg">Report Preview</h3>
                {reportData && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={exportToCSV} disabled={exporting}>
                      <Download className="w-4 h-4 mr-1" /> CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportToExcel} disabled={exporting}>
                      <Download className="w-4 h-4 mr-1" /> Excel
                    </Button>
                  </div>
                )}
              </div>

              {!reportData ? (
                <div className="text-center py-20 text-gray-400">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Select options and generate a report</p>
                  <p className="text-sm mt-1">Your report will appear here</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-4 gap-4">
                    {reportData.summary?.map((item, idx) => (
                      <div key={idx} className="bg-gradient-to-br from-purple-50 to-white p-4 rounded-lg border">
                        <p className="text-xs text-gray-500 uppercase">{item.label}</p>
                        <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                        {item.change && (
                          <p className={`text-xs ${item.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.change > 0 ? '+' : ''}{item.change}% vs previous
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Data Table */}
                  {reportData.rows && (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            {reportData.columns?.map((col, idx) => (
                              <th key={idx} className="px-4 py-3 text-left font-medium text-gray-700">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {reportData.rows.slice(0, 10).map((row, rowIdx) => (
                            <tr key={rowIdx} className="hover:bg-gray-50">
                              {row.map((cell, cellIdx) => (
                                <td key={cellIdx} className="px-4 py-3 text-gray-600">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {reportData.rows.length > 10 && (
                        <div className="p-3 bg-gray-50 text-center text-sm text-gray-500">
                          Showing 10 of {reportData.rows.length} rows. Download full report for all data.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* EMAIL SCHEDULE TAB */}
        <TabsContent value="schedule" className="mt-6">
          <Card className="p-6 max-w-2xl">
            <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
              <Mail className="w-5 h-5 text-purple-600" />
              Email Report Schedule
            </h3>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="font-medium">Enable Scheduled Reports</Label>
                  <p className="text-sm text-gray-500">Automatically email reports to recipients</p>
                </div>
                <Switch
                  checked={scheduleConfig.enabled}
                  onCheckedChange={(c) => setScheduleConfig({ ...scheduleConfig, enabled: c })}
                />
              </div>

              <div>
                <Label>Recipients (comma-separated emails)</Label>
                <Textarea
                  value={scheduleConfig.recipients}
                  onChange={(e) => setScheduleConfig({ ...scheduleConfig, recipients: e.target.value })}
                  placeholder="owner@thedoggycompany.com, manager@thedoggycompany.com"
                  rows={2}
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Frequency</Label>
                  <select
                    value={scheduleConfig.frequency}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, frequency: e.target.value })}
                    className="w-full mt-2 p-2 border rounded-md"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly (Mondays)</option>
                    <option value="monthly">Monthly (1st)</option>
                  </select>
                </div>
                <div>
                  <Label>Send Time (IST)</Label>
                  <Input
                    type="time"
                    value={scheduleConfig.time}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, time: e.target.value })}
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label>Reports to Include</Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {REPORT_TYPES.map(type => (
                    <div
                      key={type.id}
                      className={`p-3 rounded-lg border cursor-pointer flex items-center gap-2 ${
                        scheduleConfig.reportTypes.includes(type.id)
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200'
                      }`}
                      onClick={() => {
                        const types = scheduleConfig.reportTypes.includes(type.id)
                          ? scheduleConfig.reportTypes.filter(t => t !== type.id)
                          : [...scheduleConfig.reportTypes, type.id];
                        setScheduleConfig({ ...scheduleConfig, reportTypes: types });
                      }}
                    >
                      {scheduleConfig.reportTypes.includes(type.id) && (
                        <CheckCircle className="w-4 h-4 text-purple-600" />
                      )}
                      <type.icon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{type.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={saveSchedule} className="bg-purple-600 hover:bg-purple-700">
                <Save className="w-4 h-4 mr-2" /> Save Schedule
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* SAVED REPORTS TAB */}
        <TabsContent value="saved" className="mt-6">
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">Saved & Recent Reports</h3>
            <div className="text-center py-12 text-gray-400">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Your generated reports will appear here</p>
              <p className="text-sm mt-1">Reports are saved for 30 days</p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportBuilder;
