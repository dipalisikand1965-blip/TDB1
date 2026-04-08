/**
 * AdminGuideDashboard.jsx
 * 
 * A comprehensive admin guide with:
 * - Explanation of every admin section
 * - Database backup/download functionality
 * - Quick reference for all features
 */

import React, { useState } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { toast } from '../../hooks/use-toast';
import { API_URL } from '../../utils/api';
import {
  Download,
  Database,
  BookOpen,
  LayoutDashboard,
  Ticket,
  Inbox,
  DollarSign,
  Package,
  Users,
  PawPrint,
  Crown,
  Star,
  Flame,
  Calendar,
  ShoppingBag,
  Store,
  Tag,
  RefreshCw,
  PartyPopper,
  UtensilsCrossed,
  Home,
  Plane,
  Heart,
  Activity,
  GraduationCap,
  FileText,
  AlertCircle,
  Headphones,
  MessageCircle,
  Brain,
  Send,
  Bell,
  Gift,
  BarChart3,
  TrendingUp,
  Eye,
  HelpCircle,
  Settings,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Loader2,
  AlertTriangle,
  Info
} from 'lucide-react';

const AdminGuideDashboard = () => {
  const [downloading, setDownloading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [expandedSection, setExpandedSection] = useState('command-center');
  const [restoring, setRestoring] = useState(false);
  const [restoreMsg, setRestoreMsg] = useState(null);

  const handleRestore = async () => {
    if (!window.confirm(
      'RESTORE DATABASE from latest snapshot?\n\n' +
      '✅ 9,355 products (1,073 duplicates/wrong-image products now archived)\n' +
      '✅ breed- prefix duplicates archived (keep soul-breed- versions)\n' +
      '✅ bp- AI batch wrong-image products archived\n' +
      '✅ All pets, services & members preserved\n\n' +
      'Safe to run — will not delete data, uses upsert by product ID.\n' +
      'Snapshot updated: Apr 8 2026'
    )) return;
    setRestoring(true);
    setRestoreMsg(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/db/restore`, {
        method: 'POST',
        headers: { 'Authorization': 'Basic ' + btoa('aditya:lola4304') }
      });
      // Use text() first to avoid "body stream already read" errors on slow responses
      const text = await res.text();
      let data = {};
      try { data = JSON.parse(text); } catch { data = { status: 'error', errors: [text || 'Empty response'] }; }
      if (data.status?.startsWith('complete')) {
        // Build per-collection breakdown
        const cols = data.collections || {};
        const lines = Object.entries(cols)
          .filter(([, v]) => v?.total > 0)
          .sort((a, b) => (b[1]?.total || 0) - (a[1]?.total || 0))
          .map(([name, v]) => `• ${name}: ${v.total?.toLocaleString()} docs`)
          .join('\n');
        const summary = `${lines}\n\nTotal: ${data.total_docs_processed?.toLocaleString()} docs in ${data.duration_seconds}s`;
        setRestoreMsg({ ok: true, text: `✅ Restored! ${data.total_docs_processed?.toLocaleString()} docs in ${data.duration_seconds}s` });
        toast({
          title: '✅ Database Restored Successfully!',
          description: summary,
          duration: 10000,
        });
      } else {
        setRestoreMsg({ ok: false, text: `Error: ${JSON.stringify(data.errors)}` });
        toast({ title: '❌ Restore failed', description: JSON.stringify(data.errors), variant: 'destructive' });
      }
    } catch (e) {
      setRestoreMsg({ ok: false, text: `Error: ${e.message}` });
      toast({ title: '❌ Restore error', description: e.message, variant: 'destructive' });
    }
    setRestoring(false);
  };

  // Regenerate documentation function
  const regenerateDocumentation = async () => {
    setRegenerating(true);
    try {
      toast({ title: '🔄 Regenerating Documentation...', description: 'Compiling all project files' });
      
      const response = await fetch(`${API_URL}/api/admin/regenerate-documentation`, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa('aditya:lola4304')
        }
      });
      
      const data = await response.json();
      if (data.success) {
        toast({ 
          title: '✅ Documentation Updated!', 
          description: 'Refresh the docs page to see changes',
          duration: 5000
        });
      } else {
        throw new Error(data.detail || 'Failed to regenerate');
      }
    } catch (error) {
      console.error('Regenerate error:', error);
      toast({ 
        title: '❌ Regeneration Failed', 
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setRegenerating(false);
    }
  };

  // Email documentation function
  const emailDocumentation = async () => {
    setEmailing(true);
    try {
      toast({ title: '📧 Sending Documentation...', description: 'Emailing to dipali.sikand1965@gmail.com' });
      
      const response = await fetch(`${API_URL}/api/admin/send-documentation-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + btoa('aditya:lola4304')
        },
        body: JSON.stringify({ email: 'dipali.sikand1965@gmail.com' })
      });
      
      const data = await response.json();
      if (data.success) {
        toast({ 
          title: '✅ Documentation Sent!', 
          description: 'Check your Gmail inbox',
          duration: 5000
        });
      } else {
        throw new Error(data.detail || 'Failed to send');
      }
    } catch (error) {
      console.error('Email error:', error);
      toast({ 
        title: '❌ Email Failed', 
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setEmailing(false);
    }
  };

  // Database download function
  const downloadDatabase = async () => {
    setDownloading(true);
    try {
      toast({ title: '📦 Preparing Database Export...', description: 'This may take a minute' });
      
      const response = await fetch(`${API_URL}/api/admin/export-database`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Create downloadable JSON file
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `thedoggycompany_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({ 
          title: '✅ Database Downloaded!', 
          description: `Exported ${Object.keys(data.collections || {}).length} collections`,
          duration: 5000
        });
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({ 
        title: '❌ Download Failed', 
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setDownloading(false);
    }
  };

  // Section definitions with full explanations
  const sections = [
    {
      id: 'command-center',
      title: '🎯 COMMAND CENTER',
      color: 'bg-purple-500',
      description: 'Your mission control for daily operations',
      items: [
        { 
          name: 'Dashboard', 
          icon: LayoutDashboard, 
          tab: 'dashboard',
          description: 'Overview of key metrics - members, orders, tickets, revenue',
          howToUse: 'Check this first thing every morning to see pending tasks and daily stats'
        },
        { 
          name: 'Service Desk', 
          icon: Ticket, 
          tab: 'servicedesk',
          description: 'All customer requests and tickets across all pillars',
          howToUse: 'Process tickets by priority. Click a ticket to view details, assign, or respond'
        },
        { 
          name: 'Unified Inbox', 
          icon: Inbox, 
          tab: 'inbox',
          description: 'Consolidated view of all communications (WhatsApp, Email, Chat)',
          howToUse: 'Reply to messages directly from here. Messages sync back to original channel'
        },
        { 
          name: 'Finance', 
          icon: DollarSign, 
          tab: 'finance',
          description: 'Revenue tracking, payments, refunds, and financial reports',
          howToUse: 'Monitor daily revenue, process refunds, view payment history'
        },
        { 
          name: 'Pillar Queues', 
          icon: Package, 
          tab: 'pillar-queues',
          description: 'Requests organized by pillar (Celebrate, Care, Dine, etc.)',
          howToUse: 'Filter by pillar to focus on specific service categories'
        }
      ]
    },
    {
      id: 'members-pets',
      title: '👥 MEMBERS & PETS',
      color: 'bg-blue-500',
      description: 'Manage your customer base and their fur babies',
      items: [
        { 
          name: 'Pet Parents', 
          icon: Users, 
          tab: 'member-directory',
          description: 'All registered members with contact info and membership status',
          howToUse: 'Search members, view their history, edit profiles, send communications'
        },
        { 
          name: 'Pet Profiles', 
          icon: PawPrint, 
          tab: 'pets',
          description: 'Every pet registered in the system with their Soul data',
          howToUse: 'View/edit pet details, health records, soul scores, and preferences'
        },
        { 
          name: 'Membership', 
          icon: Crown, 
          tab: 'membership',
          description: 'Membership tiers, benefits, and upgrade management',
          howToUse: 'Upgrade/downgrade members, manage tier benefits, view expiration dates'
        },
        { 
          name: 'Loyalty', 
          icon: Star, 
          tab: 'loyalty',
          description: 'Paw Points program - earnings, redemptions, and rewards',
          howToUse: 'Manually credit/debit points, view point history, manage rewards'
        },
        { 
          name: 'Engagement', 
          icon: Flame, 
          tab: 'engagement',
          description: 'Member activity, streaks, and engagement metrics',
          howToUse: 'Identify inactive members, view engagement trends, plan re-engagement'
        },
        { 
          name: 'Celebrations', 
          icon: Calendar, 
          tab: 'celebrations',
          description: 'Upcoming pet birthdays, adoption anniversaries, and events',
          howToUse: 'Plan birthday outreach, send celebration messages, schedule gifts'
        }
      ]
    },
    {
      id: 'commerce',
      title: '🛒 COMMERCE',
      color: 'bg-green-500',
      description: 'Products, orders, and fulfilment management',
      items: [
        { 
          name: 'Orders', 
          icon: Package, 
          tab: 'orders',
          description: 'All orders - pending, processing, shipped, delivered',
          howToUse: 'Update order status, print invoices, handle cancellations'
        },
        { 
          name: 'Fulfilment', 
          icon: Package, 
          tab: 'fulfilment',
          description: 'Warehouse operations - picking, packing, shipping',
          howToUse: 'Generate pick lists, update shipping status, manage returns'
        },
        { 
          name: 'Product Box', 
          icon: ShoppingBag, 
          tab: 'product-box',
          description: 'Manage all products - add, edit, pricing, inventory',
          howToUse: 'Add new products, update prices, manage stock levels'
        },
        { 
          name: 'Service Box', 
          icon: Store, 
          tab: 'service-box',
          description: 'Manage all services - grooming, training, boarding, etc.',
          howToUse: 'Add new services, set pricing, manage availability'
        },
        { 
          name: 'Pricing', 
          icon: DollarSign, 
          tab: 'pricing',
          description: 'Price management across products and services',
          howToUse: 'Bulk price updates, seasonal pricing, member discounts'
        },
        { 
          name: 'Autoship', 
          icon: RefreshCw, 
          tab: 'autoship',
          description: 'Subscription orders and recurring deliveries',
          howToUse: 'Manage subscriptions, pause/resume, change frequencies'
        }
      ]
    },
    {
      id: 'pillars',
      title: '🏛️ 12 LIFE PILLARS',
      color: 'bg-gradient-to-r from-purple-500 to-pink-500',
      description: 'Service categories covering every aspect of pet life',
      items: [
        { name: 'Celebrate', icon: PartyPopper, tab: 'celebrate', description: 'Birthdays, parties, events', howToUse: 'Manage celebration requests and party bookings' },
        { name: 'Dine', icon: UtensilsCrossed, tab: 'dine', description: 'Food, nutrition, treats', howToUse: 'Food orders, diet plans, custom meal requests' },
        { name: 'Stay', icon: Home, tab: 'stay', description: 'Boarding, daycare, pet sitting', howToUse: 'Booking calendar, availability, check-ins' },
        { name: 'Travel', icon: Plane, tab: 'travel', description: 'Pet travel, relocation, transport', howToUse: 'Travel bookings, documentation, pet taxis' },
        { name: 'Care', icon: Heart, tab: 'care', description: 'Health, vet, grooming, wellness', howToUse: 'Vet appointments, grooming bookings, health records' },
        { name: 'Enjoy', icon: Activity, tab: 'enjoy', description: 'Activities, walks, playdates', howToUse: 'Activity bookings, walker assignments' },
        { name: 'Fit', icon: Activity, tab: 'fit', description: 'Exercise, training, fitness', howToUse: 'Fitness programs, training sessions' },
        { name: 'Learn', icon: GraduationCap, tab: 'learn', description: 'Training, education, tips', howToUse: 'Training courses, educational content' },
        { name: 'Paperwork', icon: FileText, tab: 'paperwork', description: 'Documents, licenses, insurance', howToUse: 'Document management, license renewals' },
        { name: 'Advisory', icon: Headphones, tab: 'advisory', description: 'Expert consultations', howToUse: 'Schedule consultations, expert assignments' },
        { name: 'Emergency', icon: AlertCircle, tab: 'emergency', description: '24/7 emergency support', howToUse: 'Emergency requests, vet referrals' },
        { name: 'Farewell', icon: Heart, tab: 'farewell', description: 'End-of-life care, memorials', howToUse: 'Memorial services, cremation arrangements' },
        { name: 'Adopt', icon: PawPrint, tab: 'adopt', description: 'Pet adoption services', howToUse: 'Adoption applications, matching' },
        { name: 'Shop', icon: ShoppingBag, tab: 'shop-manager', description: 'Pet supplies and merchandise', howToUse: 'Product management, inventory' }
      ]
    },
    {
      id: 'mira-ai',
      title: '🤖 MIRA & AI',
      color: 'bg-violet-500',
      description: 'AI assistant management and conversation tools',
      items: [
        { 
          name: 'Mira Chats', 
          icon: MessageCircle, 
          tab: 'chats',
          description: 'All Mira AI conversations with members',
          howToUse: 'Review AI responses, intervene if needed, train Mira'
        },
        { 
          name: 'Live Threads', 
          icon: MessageCircle, 
          tab: 'live-threads',
          description: 'Active ongoing conversations',
          howToUse: 'Monitor live chats, take over from AI if needed'
        },
        { 
          name: 'Mira Memory', 
          icon: Brain, 
          tab: 'mira-memory',
          description: 'What Mira has learned about each pet',
          howToUse: 'View/edit AI memories, correct wrong information'
        },
        { 
          name: 'Communications', 
          icon: Send, 
          tab: 'communications',
          description: 'Outbound messaging templates and campaigns',
          howToUse: 'Create message templates, send bulk communications'
        },
        { 
          name: 'Reminders', 
          icon: Bell, 
          tab: 'reminders',
          description: 'Automated reminder settings',
          howToUse: 'Configure vaccine reminders, appointment alerts'
        }
      ]
    },
    {
      id: 'analytics',
      title: '📊 ANALYTICS',
      color: 'bg-cyan-500',
      description: 'Data insights and reporting',
      items: [
        { 
          name: 'Live MIS', 
          icon: BarChart3, 
          tab: 'mis',
          description: 'Real-time management information system',
          howToUse: 'Monitor KPIs, track daily/weekly/monthly metrics'
        },
        { 
          name: 'Reports', 
          icon: FileText, 
          tab: 'reports',
          description: 'Downloadable reports and exports',
          howToUse: 'Generate reports by date range, export to Excel'
        },
        { 
          name: 'Analytics', 
          icon: TrendingUp, 
          tab: 'analytics',
          description: 'Deep dive analytics and trends',
          howToUse: 'Analyze trends, compare periods, identify opportunities'
        },
        { 
          name: 'Site Status', 
          icon: Eye, 
          tab: 'site-status',
          description: 'System health and API status',
          howToUse: 'Check if all systems are operational'
        }
      ]
    },
    {
      id: 'config',
      title: '⚙️ CONFIGURATION',
      color: 'bg-slate-600',
      description: 'System settings and configurations',
      items: [
        { 
          name: 'Agents', 
          icon: Users, 
          tab: 'agents',
          description: 'Admin user management',
          howToUse: 'Add/remove admin users, set permissions'
        },
        { 
          name: 'Tags', 
          icon: Tag, 
          tab: 'product-tags',
          description: 'Product and service tagging system',
          howToUse: 'Create tags for filtering and categorization'
        },
        { 
          name: 'Breeds', 
          icon: PawPrint, 
          tab: 'breed-tags',
          description: 'Breed database and attributes',
          howToUse: 'Manage breed list, add breed-specific info'
        }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header with Database Download */}
      <Card className="bg-gradient-to-r from-slate-800 to-slate-900 border-slate-700 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <BookOpen className="w-7 h-7 text-pink-400" />
              Admin Guide & Database Tools
            </h1>
            <p className="text-slate-400 mt-1">
              Complete reference for all admin features + backup tools
            </p>
          </div>
          
          <div className="flex gap-3 flex-wrap">
            <Button 
              onClick={handleRestore}
              disabled={restoring}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 font-bold"
              data-testid="restore-db-btn"
            >
              {restoring ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Restoring... (~20s)</>
              ) : (
                <><Database className="w-4 h-4 mr-2" /> Restore Database</>
              )}
            </Button>
            <Button 
              onClick={downloadDatabase}
              disabled={downloading}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              data-testid="download-database-btn"
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {downloading ? 'Exporting...' : 'Download Database Backup'}
            </Button>
          </div>
        </div>
      </Card>

      {restoreMsg && (
        <Card className={`p-4 border-2 ${restoreMsg.ok ? 'bg-green-900/30 border-green-500/50' : 'bg-red-900/30 border-red-500/50'}`}>
          <p className={`font-semibold ${restoreMsg.ok ? 'text-green-300' : 'text-red-300'}`}>{restoreMsg.text}</p>
        </Card>
      )}

      {/* Critical Warning Box */}
      <Card className="bg-red-900/30 border-red-500/50 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-red-300">⚠️ CRITICAL: Before Any Deployment</h3>
            <p className="text-red-200 text-sm mt-1">
              Always verify <code className="bg-red-800 px-1 rounded">REACT_APP_BACKEND_URL</code> is set to 
              <code className="bg-red-800 px-1 rounded ml-1">https://thedoggycompany.com</code> — NOT a preview URL!
              See <strong>/app/memory/DEPLOYMENT_BIBLE.md</strong> for details.
            </p>
          </div>
        </div>
      </Card>

      {/* 📚 DOCUMENTATION TOOLS - Easy access to project docs */}
      <Card className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border-purple-500/30 p-6" data-testid="documentation-tools-card">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-purple-400" />
          📚 Project Documentation
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          Access your project's complete documentation. Updated automatically when the server starts, or regenerate manually anytime.
        </p>
        
        {/* View Documentation Links */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <a
            href="/owners-guide.html"
            target="_blank"
            className="p-3 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/30 rounded-lg text-center transition-all"
            data-testid="view-owners-guide-btn"
          >
            <span className="text-purple-300 font-medium">📖 Simple Owner's Guide</span>
            <p className="text-purple-400 text-xs mt-1">Non-technical overview</p>
          </a>
          <a
            href="/complete-documentation.html"
            target="_blank"
            className="p-3 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/30 rounded-lg text-center transition-all"
            data-testid="view-full-docs-btn"
          >
            <span className="text-indigo-300 font-medium">📚 Complete Documentation</span>
            <p className="text-indigo-400 text-xs mt-1">All project files (105 docs)</p>
          </a>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={regenerateDocumentation}
            disabled={regenerating}
            variant="outline"
            className="flex-1 border-green-500/50 text-green-400 hover:bg-green-500/20"
            data-testid="regenerate-docs-btn"
          >
            {regenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            {regenerating ? 'Updating...' : '🔄 Update Docs'}
          </Button>
          
          <a
            href={`${API_URL}/api/admin/download-documentation`}
            className="flex-1"
          >
            <Button 
              variant="outline"
              className="w-full border-blue-500/50 text-blue-400 hover:bg-blue-500/20"
              data-testid="download-docs-btn"
            >
              <Download className="w-4 h-4 mr-2" />
              📥 Download
            </Button>
          </a>
          
          <Button 
            onClick={emailDocumentation}
            disabled={emailing}
            variant="outline"
            className="flex-1 border-pink-500/50 text-pink-400 hover:bg-pink-500/20"
            data-testid="email-docs-btn"
          >
            {emailing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {emailing ? 'Sending...' : '📧 Email Me'}
          </Button>
        </div>
        
        <p className="text-slate-500 text-xs mt-3 text-center">
          Docs auto-regenerate on every server restart. Last update timestamp shown on docs pages.
        </p>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700 p-4 text-center">
          <div className="text-3xl font-bold text-purple-400">7</div>
          <div className="text-slate-400 text-sm">Main Sections</div>
        </Card>
        <Card className="bg-slate-800 border-slate-700 p-4 text-center">
          <div className="text-3xl font-bold text-blue-400">14</div>
          <div className="text-slate-400 text-sm">Life Pillars</div>
        </Card>
        <Card className="bg-slate-800 border-slate-700 p-4 text-center">
          <div className="text-3xl font-bold text-green-400">50+</div>
          <div className="text-slate-400 text-sm">Admin Features</div>
        </Card>
        <Card className="bg-slate-800 border-slate-700 p-4 text-center">
          <div className="text-3xl font-bold text-pink-400">1</div>
          <div className="text-slate-400 text-sm">AI Assistant (Mira)</div>
        </Card>
      </div>

      {/* Section Guides */}
      <div className="space-y-4">
        {sections.map((section) => (
          <Card 
            key={section.id} 
            className="bg-slate-800 border-slate-700 overflow-hidden"
          >
            {/* Section Header */}
            <button
              onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
              data-testid={`section-${section.id}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-3 h-10 rounded-r-full ${section.color}`} />
                <div className="text-left">
                  <h2 className="text-lg font-bold text-white">{section.title}</h2>
                  <p className="text-slate-400 text-sm">{section.description}</p>
                </div>
              </div>
              {expandedSection === section.id ? (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-slate-400" />
              )}
            </button>

            {/* Section Content */}
            {expandedSection === section.id && (
              <div className="border-t border-slate-700 p-4">
                <div className="grid gap-3">
                  {section.items.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <div 
                        key={idx}
                        className="bg-slate-900/50 rounded-lg p-4 border border-slate-700"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg ${section.color} flex items-center justify-center flex-shrink-0`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-white">{item.name}</h3>
                              <Badge variant="outline" className="text-xs">
                                Tab: {item.tab}
                              </Badge>
                            </div>
                            <p className="text-slate-400 text-sm mt-1">{item.description}</p>
                            <div className="mt-2 flex items-start gap-2 bg-slate-800 rounded p-2">
                              <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                              <p className="text-blue-300 text-xs">{item.howToUse}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Database Collections Reference */}
      <Card className="bg-slate-800 border-slate-700 p-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-emerald-400" />
          Database Collections Reference
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          {[
            'users', 'pets', 'tickets', 'orders', 'products_master', 'services_master',
            'mira_sessions', 'mira_memories', 'conversation_memories', 'learn_videos',
            'unified_inbox', 'admin_notifications', 'paw_points_ledger', 'faqs'
          ].map((collection) => (
            <div key={collection} className="bg-slate-900 rounded px-3 py-2 text-slate-300 font-mono">
              {collection}
            </div>
          ))}
        </div>
        <p className="text-slate-500 text-xs mt-3">
          Download backup includes all collections. Store safely for disaster recovery.
        </p>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-purple-500/30 p-6">
        <h2 className="text-lg font-bold text-white mb-4">🚀 Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button variant="outline" className="justify-start" onClick={() => window.location.href = '/admin?tab=dashboard'}>
            <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => window.location.href = '/admin?tab=servicedesk'}>
            <Ticket className="w-4 h-4 mr-2" /> Service Desk
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => window.location.href = '/admin?tab=member-directory'}>
            <Users className="w-4 h-4 mr-2" /> Members
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => window.location.href = '/admin?tab=orders'}>
            <Package className="w-4 h-4 mr-2" /> Orders
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AdminGuideDashboard;
