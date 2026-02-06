import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, Receipt, RefreshCw, Download, Search,
  Filter, CheckCircle, XCircle, Clock, AlertTriangle, Eye,
  ChevronDown, ChevronUp, Calendar, User, Package, Sparkles,
  Gift, Tag, TrendingUp, TrendingDown, FileText, MessageSquare,
  Check, X, MoreVertical, ArrowUpRight, ArrowDownLeft, Wallet,
  Building2, Smartphone, Banknote, PiggyBank, Star, Upload
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';

const getApiUrl = () => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8001';
  }
  return '';
};

// Get admin auth header
const getAuthHeader = () => {
  const adminUsername = localStorage.getItem('adminUsername') || 'aditya';
  const adminPassword = localStorage.getItem('adminPassword') || 'lola4304';
  return `Basic ${btoa(`${adminUsername}:${adminPassword}`)}`;
};

// Payment status colors and icons
const STATUS_CONFIG = {
  completed: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle, label: 'Completed' },
  pending: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Clock, label: 'Pending' },
  failed: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle, label: 'Failed' },
  refunded: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: ArrowDownLeft, label: 'Refunded' },
  partial_refund: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: ArrowDownLeft, label: 'Partial Refund' },
  reconciled: { color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', icon: Check, label: 'Reconciled' }
};

// Payment method icons
const METHOD_ICONS = {
  razorpay: Smartphone,
  upi: Smartphone,
  card: CreditCard,
  credit_card: CreditCard,
  debit_card: CreditCard,
  netbanking: Building2,
  wallet: Wallet,
  offline: Banknote,
  bank_transfer: Building2,
  cash: Banknote,
  paw_points: Star,
  others: FileText
};

// Payment type colors
const TYPE_COLORS = {
  membership: 'bg-gradient-to-r from-pink-500 to-purple-500',
  product: 'bg-gradient-to-r from-orange-500 to-amber-500',
  service: 'bg-gradient-to-r from-blue-500 to-cyan-500',
  refund: 'bg-gradient-to-r from-purple-500 to-indigo-500',
  quote: 'bg-gradient-to-r from-emerald-500 to-teal-500',
  others: 'bg-gradient-to-r from-slate-500 to-gray-500'
};

const FinanceManager = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_collected: 0,
    pending_amount: 0,
    refunds_issued: 0,
    paw_points_redeemed: 0,
    discounts_given: 0,
    today_revenue: 0,
    pending_reconciliation: 0
  });
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [datePreset, setDatePreset] = useState('all');
  
  // Date preset options
  const applyDatePreset = (preset) => {
    setDatePreset(preset);
    const today = new Date();
    let start = '';
    let end = today.toISOString().split('T')[0];
    
    switch (preset) {
      case 'today':
        start = end;
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        start = end = yesterday.toISOString().split('T')[0];
        break;
      case 'this_week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        start = weekStart.toISOString().split('T')[0];
        break;
      case 'last_week':
        const lastWeekEnd = new Date(today);
        lastWeekEnd.setDate(today.getDate() - today.getDay() - 1);
        const lastWeekStart = new Date(lastWeekEnd);
        lastWeekStart.setDate(lastWeekEnd.getDate() - 6);
        start = lastWeekStart.toISOString().split('T')[0];
        end = lastWeekEnd.toISOString().split('T')[0];
        break;
      case 'this_month':
        start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        break;
      case 'last_month':
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        start = lastMonthStart.toISOString().split('T')[0];
        end = lastMonthEnd.toISOString().split('T')[0];
        break;
      case 'this_quarter':
        const quarterMonth = Math.floor(today.getMonth() / 3) * 3;
        start = new Date(today.getFullYear(), quarterMonth, 1).toISOString().split('T')[0];
        break;
      case 'this_year':
        start = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        break;
      case 'last_year':
        start = new Date(today.getFullYear() - 1, 0, 1).toISOString().split('T')[0];
        end = new Date(today.getFullYear() - 1, 11, 31).toISOString().split('T')[0];
        break;
      case 'custom':
        // Keep existing dates
        return;
      default:
        start = '';
        end = '';
    }
    
    setDateRange({ start, end });
  };
  
  // Selected payment for detail view
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showReconcileModal, setShowReconcileModal] = useState(false);
  const [reconcileNotes, setReconcileNotes] = useState('');
  
  // New offline payment modal
  const [showNewPaymentModal, setShowNewPaymentModal] = useState(false);
  const [newPayment, setNewPayment] = useState({
    member_email: '',
    type: 'service',
    reference_id: '',
    amount: '',
    payment_method: 'razorpay',
    notes: '',
    discount_code: '',
    discount_amount: 0,
    paw_points_used: 0
  });

  // Import CSV state
  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch payments
  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${getApiUrl()}/api/admin/finance/payments`, {
        headers: { 'Authorization': getAuthHeader() }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments || []);
        if (data.stats) {
          setStats(data.stats);
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.detail || 'Failed to fetch payments');
        console.error('Failed to fetch payments:', errData);
      }
    } catch (err) {
      setError('Network error - please check your connection');
      console.error('Failed to fetch payments:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Filter payments by date range - MUST be defined before filteredPayments
  const dateFilteredPayments = payments.filter(p => {
    if (!dateRange.start && !dateRange.end) return true;
    const paymentDate = new Date(p.created_at).toISOString().split('T')[0];
    if (dateRange.start && paymentDate < dateRange.start) return false;
    if (dateRange.end && paymentDate > dateRange.end) return false;
    return true;
  });

  // Filter payments (including date filter already applied)
  const filteredPayments = dateFilteredPayments.filter(p => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        p.member_name?.toLowerCase().includes(query) ||
        p.member_email?.toLowerCase().includes(query) ||
        p.id?.toLowerCase().includes(query) ||
        p.reference_id?.toLowerCase().includes(query) ||
        p.razorpay_payment_id?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (typeFilter !== 'all' && p.type !== typeFilter) return false;
    return true;
  });

  // Reconcile payment
  const handleReconcile = async (paymentId) => {
    try {
      const response = await fetch(`${getApiUrl()}/api/admin/finance/payments/${paymentId}/reconcile`, {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes: reconcileNotes })
      });
      
      if (response.ok) {
        fetchPayments();
        setShowReconcileModal(false);
        setSelectedPayment(null);
        setReconcileNotes('');
      } else {
        const errData = await response.json().catch(() => ({}));
        alert(errData.detail || 'Failed to reconcile payment');
      }
    } catch (err) {
      console.error('Failed to reconcile payment:', err);
      alert('Network error');
    }
  };

  // Record offline payment
  const handleRecordPayment = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/admin/finance/payments/offline`, {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPayment)
      });
      
      if (response.ok) {
        fetchPayments();
        setShowNewPaymentModal(false);
        setNewPayment({
          member_email: '',
          type: 'service',
          reference_id: '',
          amount: '',
          payment_method: 'razorpay',
          notes: '',
          discount_code: '',
          discount_amount: 0,
          paw_points_used: 0
        });
        alert('Payment recorded successfully!');
      } else {
        const errData = await response.json().catch(() => ({}));
        alert(errData.detail || 'Failed to record payment');
      }
    } catch (err) {
      console.error('Failed to record payment:', err);
      alert('Network error');
    }
  };

  // Process refund
  const handleRefund = async (paymentId, amount, reason) => {
    try {
      const response = await fetch(`${getApiUrl()}/api/admin/finance/payments/${paymentId}/refund`, {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount, reason })
      });
      
      if (response.ok) {
        fetchPayments();
        setSelectedPayment(null);
      } else {
        const errData = await response.json().catch(() => ({}));
        alert(errData.detail || 'Failed to process refund');
      }
    } catch (err) {
      console.error('Failed to process refund:', err);
      alert('Network error');
    }
  };

  // Import CSV
  const handleImportCSV = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      // Expected headers: member_email, type, amount, payment_method, reference_id, notes, discount_amount
      const emailIdx = headers.findIndex(h => h.includes('email'));
      const typeIdx = headers.findIndex(h => h.includes('type'));
      const amountIdx = headers.findIndex(h => h.includes('amount') && !h.includes('discount'));
      const methodIdx = headers.findIndex(h => h.includes('method'));
      const refIdx = headers.findIndex(h => h.includes('reference'));
      const notesIdx = headers.findIndex(h => h.includes('notes'));
      const discountIdx = headers.findIndex(h => h.includes('discount'));
      
      let imported = 0;
      let failed = 0;
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        
        const payment = {
          member_email: values[emailIdx] || '',
          type: values[typeIdx] || 'service',
          amount: parseFloat(values[amountIdx]) || 0,
          payment_method: values[methodIdx] || 'offline',
          reference_id: values[refIdx] || '',
          notes: values[notesIdx] || `Imported from CSV row ${i + 1}`,
          discount_amount: parseFloat(values[discountIdx]) || 0,
          paw_points_used: 0
        };
        
        if (payment.member_email && payment.amount > 0) {
          try {
            const response = await fetch(`${getApiUrl()}/api/admin/finance/payments/offline`, {
              method: 'POST',
              headers: {
                'Authorization': getAuthHeader(),
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(payment)
            });
            
            if (response.ok) {
              imported++;
            } else {
              failed++;
            }
          } catch {
            failed++;
          }
        }
      }
      
      alert(`Import complete!\n✅ Imported: ${imported}\n❌ Failed: ${failed}`);
      fetchPayments();
    } catch (err) {
      console.error('Import error:', err);
      alert('Failed to parse CSV file');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Payment ID', 'Date', 'Member', 'Email', 'Type', 'Amount', 'Discount', 'Paw Points', 'GST', 'Net Amount', 'Method', 'Status', 'Reference', 'Reconciled', 'Notes'];
    const rows = filteredPayments.map(p => [
      p.id,
      new Date(p.created_at).toLocaleDateString('en-IN'),
      p.member_name,
      p.member_email,
      p.type,
      p.subtotal || p.amount,
      p.discount_amount || 0,
      p.paw_points_value || 0,
      p.gst_amount || 0,
      p.total || p.amount,
      p.payment_method,
      p.status,
      p.reference_id,
      p.reconciled ? 'Yes' : 'No',
      (p.notes || '').replace(/,/g, ';')
    ]);
    
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Export GST Report
  const exportGSTReport = () => {
    const completedPayments = payments.filter(p => p.status === 'completed' && p.gst_amount > 0);
    const headers = ['Invoice No', 'Date', 'Customer Name', 'Customer Email', 'GSTIN', 'HSN/SAC', 'Taxable Value', 'CGST (9%)', 'SGST (9%)', 'Total GST', 'Invoice Value'];
    const rows = completedPayments.map(p => {
      const taxableValue = (p.subtotal || p.amount) - (p.discount_amount || 0);
      const gstAmount = p.gst_amount || (taxableValue * 0.18);
      const cgst = gstAmount / 2;
      const sgst = gstAmount / 2;
      return [
        p.id,
        new Date(p.created_at).toLocaleDateString('en-IN'),
        p.member_name,
        p.member_email,
        '', // GSTIN - to be filled
        p.type === 'service' ? '999799' : '0910', // SAC for pet services
        taxableValue.toFixed(2),
        cgst.toFixed(2),
        sgst.toFixed(2),
        gstAmount.toFixed(2),
        (p.total || p.amount).toFixed(2)
      ];
    });
    
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gst_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Export Member Ledger
  const exportMemberLedger = (memberEmail) => {
    const memberPayments = payments.filter(p => p.member_email === memberEmail);
    const headers = ['Date', 'Transaction ID', 'Type', 'Description', 'Debit', 'Credit', 'Balance', 'Status'];
    let balance = 0;
    const rows = memberPayments.map(p => {
      const isRefund = p.type === 'refund' || p.status === 'refunded';
      const amount = p.total || p.amount;
      if (isRefund) {
        balance -= Math.abs(amount);
      } else if (p.status === 'completed') {
        balance += amount;
      }
      return [
        new Date(p.created_at).toLocaleDateString('en-IN'),
        p.id,
        p.type,
        p.notes || p.reference_id || '-',
        isRefund ? Math.abs(amount).toFixed(2) : '',
        !isRefund && p.status === 'completed' ? amount.toFixed(2) : '',
        balance.toFixed(2),
        p.status
      ];
    });
    
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledger_${memberEmail.split('@')[0]}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Calculate stats based on date-filtered payments
  const dateFilteredStats = {
    total_collected: dateFilteredPayments.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.total || p.amount || 0), 0),
    pending_amount: dateFilteredPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + (p.total || p.amount || 0), 0),
    refunds_issued: dateFilteredPayments.filter(p => p.status === 'refunded' || p.type === 'refund').reduce((sum, p) => sum + Math.abs(p.refund_amount || p.total || p.amount || 0), 0),
    paw_points_redeemed: dateFilteredPayments.reduce((sum, p) => sum + (p.paw_points_value || 0), 0),
    discounts_given: dateFilteredPayments.reduce((sum, p) => sum + (p.discount_amount || 0), 0),
    gst_collected: dateFilteredPayments.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.gst_amount || 0), 0),
    transaction_count: dateFilteredPayments.filter(p => p.status === 'completed').length,
  };

  // Calculate advanced stats from date-filtered payments
  const advancedStats = {
    gstCollected: dateFilteredStats.gst_collected,
    avgTransactionValue: dateFilteredStats.transaction_count > 0 ? dateFilteredStats.total_collected / dateFilteredStats.transaction_count : 0,
    pendingReconciliation: dateFilteredPayments.filter(p => p.status === 'completed' && !p.reconciled).length,
    thisMonthRevenue: dateFilteredPayments.filter(p => {
      const paymentDate = new Date(p.created_at);
      const now = new Date();
      return paymentDate.getMonth() === now.getMonth() && 
             paymentDate.getFullYear() === now.getFullYear() && 
             p.status === 'completed';
    }).reduce((sum, p) => sum + (p.total || p.amount || 0), 0),
    lastMonthRevenue: dateFilteredPayments.filter(p => {
      const paymentDate = new Date(p.created_at);
      const now = new Date();
      const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      return paymentDate.getMonth() === lastMonth && 
             paymentDate.getFullYear() === lastMonthYear && 
             p.status === 'completed';
    }).reduce((sum, p) => sum + (p.total || p.amount || 0), 0),
    membershipRevenue: dateFilteredPayments.filter(p => p.type === 'membership' && p.status === 'completed').reduce((sum, p) => sum + (p.total || p.amount || 0), 0),
    serviceRevenue: dateFilteredPayments.filter(p => p.type === 'service' && p.status === 'completed').reduce((sum, p) => sum + (p.total || p.amount || 0), 0),
    productRevenue: dateFilteredPayments.filter(p => p.type === 'product' && p.status === 'completed').reduce((sum, p) => sum + (p.total || p.amount || 0), 0),
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <IndianRupee className="w-7 h-7 text-emerald-400" />
            Finance & Reconciliation
          </h2>
          <p className="text-slate-400 text-sm mt-1">Track payments, refunds, discounts & reconcile accounts</p>
        </div>
        
        {/* Date Range Presets */}
        <div className="flex flex-wrap gap-1 bg-slate-800/50 rounded-xl p-2 border border-slate-700/50">
          {[
            { id: 'all', label: 'All Time' },
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: 'this_week', label: 'This Week' },
            { id: 'last_week', label: 'Last Week' },
            { id: 'this_month', label: 'This Month' },
            { id: 'last_month', label: 'Last Month' },
            { id: 'this_quarter', label: 'This Quarter' },
            { id: 'this_year', label: 'This Year' },
            { id: 'custom', label: 'Custom' },
          ].map(preset => (
            <button
              key={preset.id}
              onClick={() => applyDatePreset(preset.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                datePreset === preset.id 
                  ? 'bg-emerald-500 text-white' 
                  : 'text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Range (shows when custom is selected) */}
      {datePreset === 'custom' && (
        <div className="flex gap-3 items-center bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <Calendar className="w-5 h-5 text-slate-400" />
          <div className="flex gap-2 items-center">
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="bg-slate-900/50 border-slate-600 w-40"
            />
            <span className="text-slate-400">to</span>
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="bg-slate-900/50 border-slate-600 w-40"
            />
          </div>
          {(dateRange.start || dateRange.end) && (
            <span className="text-emerald-400 text-sm ml-2">
              Showing {dateFilteredPayments.length} transactions
            </span>
          )}
        </div>
      )}
      
      {/* Action Buttons Row */}
      <div className="flex flex-wrap gap-2">
        {/* Record Payment Button */}
        <Button 
          onClick={() => setShowNewPaymentModal(true)} 
          className="bg-emerald-500 hover:bg-emerald-600 text-white"
          data-testid="record-payment-btn"
        >
          <CreditCard className="w-4 h-4 mr-2" />
          Record Payment
        </Button>
        
        {/* Import CSV Button */}
        <Button 
          variant="outline" 
          className="border-slate-600 text-slate-300"
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          data-testid="import-csv-btn"
        >
          <Upload className="w-4 h-4 mr-2" />
          {importing ? 'Importing...' : 'Import CSV'}
        </Button>
        
        {/* Hidden file input for CSV import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleImportCSV}
          className="hidden"
          data-testid="csv-file-input"
        />
        
        {/* Export Dropdown */}
        <div className="relative group">
          <Button variant="outline" className="border-slate-600 text-slate-300" data-testid="export-btn">
            <Download className="w-4 h-4 mr-2" />
            Export
            <ChevronDown className="w-4 h-4 ml-1" />
          </Button>
          <div className="absolute right-0 mt-1 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <button onClick={exportToCSV} className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 rounded-t-lg flex items-center gap-2">
              <FileText className="w-4 h-4" /> All Payments
            </button>
            <button onClick={exportGSTReport} className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2">
              <Receipt className="w-4 h-4" /> GST Report
            </button>
            <button onClick={() => { const email = prompt('Enter member email:'); if (email) exportMemberLedger(email); }} className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 rounded-b-lg flex items-center gap-2">
              <User className="w-4 h-4" /> Member Ledger
            </button>
          </div>
        </div>
        
        <Button onClick={fetchPayments} variant="outline" className="border-slate-600 text-slate-300" data-testid="refresh-btn">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{error}</p>
          <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto text-red-400">
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Stats Cards - Row 1: Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-xl p-4 border border-emerald-500/20"
        >
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-medium">Total Collected</span>
          </div>
          <p className="text-xl font-bold text-white">{formatCurrency(dateFilteredStats.total_collected)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-xl p-4 border border-amber-500/20"
        >
          <div className="flex items-center gap-2 text-amber-400 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-medium">Pending</span>
          </div>
          <p className="text-xl font-bold text-white">{formatCurrency(dateFilteredStats.pending_amount)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl p-4 border border-purple-500/20"
        >
          <div className="flex items-center gap-2 text-purple-400 mb-1">
            <ArrowDownLeft className="w-4 h-4" />
            <span className="text-xs font-medium">Refunds</span>
          </div>
          <p className="text-xl font-bold text-white">{formatCurrency(dateFilteredStats.refunds_issued)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-pink-500/20 to-pink-600/10 rounded-xl p-4 border border-pink-500/20"
        >
          <div className="flex items-center gap-2 text-pink-400 mb-1">
            <Star className="w-4 h-4" />
            <span className="text-xs font-medium">Paw Points Used</span>
          </div>
          <p className="text-xl font-bold text-white">{formatCurrency(dateFilteredStats.paw_points_redeemed)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl p-4 border border-blue-500/20"
        >
          <div className="flex items-center gap-2 text-blue-400 mb-1">
            <Tag className="w-4 h-4" />
            <span className="text-xs font-medium">Discounts Given</span>
          </div>
          <p className="text-xl font-bold text-white">{formatCurrency(dateFilteredStats.discounts_given)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 rounded-xl p-4 border border-cyan-500/20"
        >
          <div className="flex items-center gap-2 text-cyan-400 mb-1">
            <Calendar className="w-4 h-4" />
            <span className="text-xs font-medium">Today</span>
          </div>
          <p className="text-xl font-bold text-white">{formatCurrency(stats.today_revenue)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-br from-red-500/20 to-red-600/10 rounded-xl p-4 border border-red-500/20"
        >
          <div className="flex items-center gap-2 text-red-400 mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-medium">To Reconcile</span>
          </div>
          <p className="text-xl font-bold text-white">{advancedStats.pendingReconciliation}</p>
        </motion.div>
      </div>

      {/* Stats Cards - Row 2: GST & Monthly Comparison */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-xl p-4 border border-orange-500/20"
        >
          <div className="flex items-center gap-2 text-orange-400 mb-1">
            <Receipt className="w-4 h-4" />
            <span className="text-xs font-medium">GST Collected</span>
          </div>
          <p className="text-xl font-bold text-white">{formatCurrency(advancedStats.gstCollected)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 rounded-xl p-4 border border-indigo-500/20"
        >
          <div className="flex items-center gap-2 text-indigo-400 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-medium">This Month</span>
          </div>
          <p className="text-xl font-bold text-white">{formatCurrency(advancedStats.thisMonthRevenue)}</p>
          {advancedStats.lastMonthRevenue > 0 && (
            <p className={`text-xs mt-1 ${advancedStats.thisMonthRevenue >= advancedStats.lastMonthRevenue ? 'text-emerald-400' : 'text-red-400'}`}>
              {advancedStats.thisMonthRevenue >= advancedStats.lastMonthRevenue ? '↑' : '↓'} vs {formatCurrency(advancedStats.lastMonthRevenue)} last month
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-gradient-to-br from-pink-500/20 to-rose-600/10 rounded-xl p-4 border border-pink-500/20"
        >
          <div className="flex items-center gap-2 text-pink-400 mb-1">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-medium">Membership</span>
          </div>
          <p className="text-xl font-bold text-white">{formatCurrency(advancedStats.membershipRevenue)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="bg-gradient-to-br from-blue-500/20 to-sky-600/10 rounded-xl p-4 border border-blue-500/20"
        >
          <div className="flex items-center gap-2 text-blue-400 mb-1">
            <Package className="w-4 h-4" />
            <span className="text-xs font-medium">Services</span>
          </div>
          <p className="text-xl font-bold text-white">{formatCurrency(advancedStats.serviceRevenue)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="bg-gradient-to-br from-amber-500/20 to-yellow-600/10 rounded-xl p-4 border border-amber-500/20"
        >
          <div className="flex items-center gap-2 text-amber-400 mb-1">
            <Gift className="w-4 h-4" />
            <span className="text-xs font-medium">Products</span>
          </div>
          <p className="text-xl font-bold text-white">{formatCurrency(advancedStats.productRevenue)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="bg-gradient-to-br from-teal-500/20 to-emerald-600/10 rounded-xl p-4 border border-teal-500/20"
        >
          <div className="flex items-center gap-2 text-teal-400 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-medium">Avg Transaction</span>
          </div>
          <p className="text-xl font-bold text-white">{formatCurrency(advancedStats.avgTransactionValue)}</p>
        </motion.div>
      </div>

      {/* Search & Filters */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by name, email, payment ID, or reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-900/50 border-slate-600"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
              <option value="reconciled">Reconciled</option>
            </select>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="all">All Types</option>
              <option value="membership">Membership</option>
              <option value="product">Product</option>
              <option value="service">Service</option>
              <option value="quote">Quote</option>
              <option value="refund">Refund</option>
            </select>
            
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="border-slate-600"
            >
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Advanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-4 border-t border-slate-700 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">From Date</label>
                  <Input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="bg-slate-900/50 border-slate-600"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">To Date</label>
                  <Input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="bg-slate-900/50 border-slate-600"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Payments Table */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Payment</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Member</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Adjustments</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Method</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <RefreshCw className="w-8 h-8 text-slate-400 animate-spin mx-auto" />
                    <p className="text-slate-400 mt-2">Loading payments...</p>
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <Receipt className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-400">No payments found</p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => {
                  const StatusIcon = STATUS_CONFIG[payment.status]?.icon || Clock;
                  const MethodIcon = METHOD_ICONS[payment.payment_method] || CreditCard;
                  
                  return (
                    <tr 
                      key={payment.id} 
                      className="hover:bg-slate-700/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedPayment(payment)}
                    >
                      {/* Payment ID & Date */}
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-white">{payment.id}</p>
                          <p className="text-xs text-slate-400">{formatDate(payment.created_at)}</p>
                        </div>
                      </td>
                      
                      {/* Member */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{payment.member_name || 'N/A'}</p>
                            <p className="text-xs text-slate-400">{payment.member_email}</p>
                          </div>
                        </div>
                      </td>
                      
                      {/* Type */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${TYPE_COLORS[payment.type] || 'bg-slate-600'}`}>
                          {payment.type?.charAt(0).toUpperCase() + payment.type?.slice(1)}
                        </span>
                        {payment.reference_id && (
                          <p className="text-xs text-slate-400 mt-1">{payment.reference_id}</p>
                        )}
                      </td>
                      
                      {/* Amount */}
                      <td className="px-4 py-3">
                        <p className="text-sm font-bold text-white">{formatCurrency(payment.total || payment.amount)}</p>
                        {payment.subtotal && payment.subtotal !== payment.total && (
                          <p className="text-xs text-slate-400 line-through">{formatCurrency(payment.subtotal)}</p>
                        )}
                      </td>
                      
                      {/* Adjustments */}
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {payment.discount_amount > 0 && (
                            <div className="flex items-center gap-1 text-xs text-blue-400">
                              <Tag className="w-3 h-3" />
                              <span>-{formatCurrency(payment.discount_amount)}</span>
                            </div>
                          )}
                          {payment.paw_points_value > 0 && (
                            <div className="flex items-center gap-1 text-xs text-pink-400">
                              <Star className="w-3 h-3" />
                              <span>-{formatCurrency(payment.paw_points_value)}</span>
                            </div>
                          )}
                          {!payment.discount_amount && !payment.paw_points_value && (
                            <span className="text-xs text-slate-500">—</span>
                          )}
                        </div>
                      </td>
                      
                      {/* Method */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <MethodIcon className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-300 capitalize">{payment.payment_method?.replace('_', ' ')}</span>
                        </div>
                      </td>
                      
                      {/* Status */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <Badge className={`${STATUS_CONFIG[payment.status]?.color || 'bg-slate-600'} border flex items-center gap-1 w-fit`}>
                            <StatusIcon className="w-3 h-3" />
                            {STATUS_CONFIG[payment.status]?.label || payment.status}
                          </Badge>
                          {payment.reconciled && (
                            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 border text-xs w-fit">
                              <Check className="w-3 h-3 mr-1" /> Reconciled
                            </Badge>
                          )}
                        </div>
                      </td>
                      
                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => { e.stopPropagation(); setSelectedPayment(payment); }}
                            className="text-slate-400 hover:text-white"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {!payment.reconciled && payment.status === 'completed' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPayment(payment);
                                setShowReconcileModal(true);
                              }}
                              className="text-cyan-400 hover:text-cyan-300"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Detail Modal */}
      <AnimatePresence>
        {selectedPayment && !showReconcileModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPayment(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-700">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-emerald-400" />
                      Payment Receipt
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">{selectedPayment.id}</p>
                  </div>
                  <Button variant="ghost" onClick={() => setSelectedPayment(null)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Status Banner */}
                <div className={`p-4 rounded-xl ${STATUS_CONFIG[selectedPayment.status]?.color} border`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {React.createElement(STATUS_CONFIG[selectedPayment.status]?.icon || Clock, { className: 'w-5 h-5' })}
                      <span className="font-medium">{STATUS_CONFIG[selectedPayment.status]?.label}</span>
                    </div>
                    <span className="text-2xl font-bold">{formatCurrency(selectedPayment.total || selectedPayment.amount)}</span>
                  </div>
                </div>
                
                {/* Member Info */}
                <div className="bg-slate-900/50 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-slate-400 mb-3">Member Details</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{selectedPayment.member_name || 'N/A'}</p>
                      <p className="text-sm text-slate-400">{selectedPayment.member_email}</p>
                    </div>
                  </div>
                </div>
                
                {/* Payment Breakdown */}
                <div className="bg-slate-900/50 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-slate-400 mb-3">Payment Breakdown</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">Subtotal</span>
                      <span className="text-white">{formatCurrency(selectedPayment.subtotal || selectedPayment.amount)}</span>
                    </div>
                    {selectedPayment.discount_amount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-400 flex items-center gap-1">
                          <Tag className="w-3 h-3" /> Discount {selectedPayment.discount_code && `(${selectedPayment.discount_code})`}
                        </span>
                        <span className="text-blue-400">-{formatCurrency(selectedPayment.discount_amount)}</span>
                      </div>
                    )}
                    {selectedPayment.paw_points_used > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-pink-400 flex items-center gap-1">
                          <Star className="w-3 h-3" /> Paw Points ({selectedPayment.paw_points_used} pts)
                        </span>
                        <span className="text-pink-400">-{formatCurrency(selectedPayment.paw_points_value)}</span>
                      </div>
                    )}
                    {selectedPayment.gst_amount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-300">GST (18%)</span>
                        <span className="text-white">{formatCurrency(selectedPayment.gst_amount)}</span>
                      </div>
                    )}
                    <div className="border-t border-slate-700 pt-2 mt-2">
                      <div className="flex justify-between font-bold">
                        <span className="text-white">Total Paid</span>
                        <span className="text-emerald-400">{formatCurrency(selectedPayment.total || selectedPayment.amount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Transaction Details */}
                <div className="bg-slate-900/50 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-slate-400 mb-3">Transaction Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Type</p>
                      <p className="text-white capitalize">{selectedPayment.type}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Reference</p>
                      <p className="text-white">{selectedPayment.reference_id || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Payment Method</p>
                      <p className="text-white capitalize">{selectedPayment.payment_method?.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Date</p>
                      <p className="text-white">{formatDate(selectedPayment.created_at)}</p>
                    </div>
                    {selectedPayment.razorpay_payment_id && (
                      <div className="col-span-2">
                        <p className="text-slate-400">Razorpay ID</p>
                        <p className="text-white font-mono text-xs">{selectedPayment.razorpay_payment_id}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Notes */}
                {selectedPayment.notes && (
                  <div className="bg-slate-900/50 rounded-xl p-4">
                    <h4 className="text-sm font-medium text-slate-400 mb-2">Notes</h4>
                    <p className="text-white text-sm">{selectedPayment.notes}</p>
                  </div>
                )}
                
                {/* Reconciliation Status */}
                {selectedPayment.reconciled && (
                  <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-cyan-400 mb-2">
                      <Check className="w-5 h-5" />
                      <span className="font-medium">Reconciled</span>
                    </div>
                    <p className="text-sm text-slate-300">
                      By {selectedPayment.reconciled_by} on {formatDate(selectedPayment.reconciled_at)}
                    </p>
                    {selectedPayment.reconcile_notes && (
                      <p className="text-sm text-slate-400 mt-1">{selectedPayment.reconcile_notes}</p>
                    )}
                  </div>
                )}
              </div>
              
              {/* Actions */}
              <div className="p-6 border-t border-slate-700 flex gap-3">
                {!selectedPayment.reconciled && selectedPayment.status === 'completed' && (
                  <Button
                    onClick={() => setShowReconcileModal(true)}
                    className="bg-cyan-500 hover:bg-cyan-600"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Mark Reconciled
                  </Button>
                )}
                {selectedPayment.status === 'completed' && !selectedPayment.refunded && (
                  <Button
                    variant="outline"
                    className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
                    onClick={() => {
                      const amount = prompt('Enter refund amount:', selectedPayment.total || selectedPayment.amount);
                      const reason = prompt('Refund reason:');
                      if (amount && reason) {
                        handleRefund(selectedPayment.id, parseFloat(amount), reason);
                      }
                    }}
                  >
                    <ArrowDownLeft className="w-4 h-4 mr-2" />
                    Issue Refund
                  </Button>
                )}
                <Button variant="ghost" onClick={() => setSelectedPayment(null)}>
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reconcile Modal */}
      <AnimatePresence>
        {showReconcileModal && selectedPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowReconcileModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-800 rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Check className="w-5 h-5 text-cyan-400" />
                Reconcile Payment
              </h3>
              
              <div className="bg-slate-900/50 rounded-xl p-4 mb-4">
                <p className="text-sm text-slate-400">Payment ID</p>
                <p className="text-white font-medium">{selectedPayment.id}</p>
                <p className="text-2xl font-bold text-emerald-400 mt-2">
                  {formatCurrency(selectedPayment.total || selectedPayment.amount)}
                </p>
              </div>
              
              <div className="mb-4">
                <label className="text-sm text-slate-400 mb-2 block">Notes (optional)</label>
                <textarea
                  value={reconcileNotes}
                  onChange={(e) => setReconcileNotes(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-lg p-3 text-white text-sm"
                  rows={3}
                  placeholder="Add any notes for this reconciliation..."
                />
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={() => handleReconcile(selectedPayment.id)}
                  className="flex-1 bg-cyan-500 hover:bg-cyan-600"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Confirm Reconciliation
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowReconcileModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Offline Payment Modal */}
      <AnimatePresence>
        {showNewPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowNewPaymentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-800 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-emerald-400" />
                  Record Payment
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewPaymentModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Member Email *</label>
                  <Input
                    value={newPayment.member_email}
                    onChange={(e) => setNewPayment(prev => ({ ...prev, member_email: e.target.value }))}
                    placeholder="member@email.com"
                    className="bg-slate-900/50 border-slate-600"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Type *</label>
                    <select
                      value={newPayment.type}
                      onChange={(e) => setNewPayment(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="service">Service</option>
                      <option value="product">Product</option>
                      <option value="membership">Membership</option>
                      <option value="quote">Quote</option>
                      <option value="others">Others</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Payment Method</label>
                    <select
                      value={newPayment.payment_method}
                      onChange={(e) => setNewPayment(prev => ({ ...prev, payment_method: e.target.value }))}
                      className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="razorpay">Razorpay</option>
                      <option value="credit_card">Credit Card</option>
                      <option value="debit_card">Debit Card</option>
                      <option value="upi">UPI</option>
                      <option value="netbanking">Net Banking</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cash">Cash</option>
                      <option value="wallet">Wallet</option>
                      <option value="others">Others</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Reference ID (Quote/Order)</label>
                  <Input
                    value={newPayment.reference_id}
                    onChange={(e) => setNewPayment(prev => ({ ...prev, reference_id: e.target.value }))}
                    placeholder="QUO-xxx or ORD-xxx"
                    className="bg-slate-900/50 border-slate-600"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Amount (₹) *</label>
                  <Input
                    type="number"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="1000"
                    className="bg-slate-900/50 border-slate-600"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Discount Code</label>
                    <Input
                      value={newPayment.discount_code}
                      onChange={(e) => setNewPayment(prev => ({ ...prev, discount_code: e.target.value }))}
                      placeholder="WELCOME10"
                      className="bg-slate-900/50 border-slate-600"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Discount Amount</label>
                    <Input
                      type="number"
                      value={newPayment.discount_amount}
                      onChange={(e) => setNewPayment(prev => ({ ...prev, discount_amount: parseFloat(e.target.value) || 0 }))}
                      placeholder="0"
                      className="bg-slate-900/50 border-slate-600"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Paw Points Used</label>
                  <Input
                    type="number"
                    value={newPayment.paw_points_used}
                    onChange={(e) => setNewPayment(prev => ({ ...prev, paw_points_used: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                    className="bg-slate-900/50 border-slate-600"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Notes</label>
                  <textarea
                    value={newPayment.notes}
                    onChange={(e) => setNewPayment(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg p-3 text-white text-sm"
                    rows={2}
                    placeholder="Payment notes..."
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleRecordPayment}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                  disabled={!newPayment.member_email || !newPayment.amount}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Record Payment
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowNewPaymentModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FinanceManager;
