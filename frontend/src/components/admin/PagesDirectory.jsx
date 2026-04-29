/**
 * PagesDirectory.jsx — Admin tab: "📑 Pages Directory"
 *
 * One-stop catalog of every shareable URL on the site. So Dipali never has
 * to ask the agent "what's the link to the investor deck?" again.
 *
 * Each card has: name · description · audience · live URL · Copy + Open
 * Pulls partner proposals dynamically so they appear here automatically too.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Copy, ExternalLink, Search, Briefcase, Sparkles, FileText,
  Heart, Users, BookOpen, Layout, Lock, Globe, Wand2,
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;
const PROD_HOST = 'https://thedoggycompany.com';

// Curated, grouped catalog. Edit here when you ship a new shareable page.
const STATIC_CATALOG = [
  // ── INVESTOR / FUNDRAISING ──────────────────────────────────────
  {
    group: 'Investors',
    icon: Briefcase,
    color: 'from-amber-500 to-orange-500',
    pages: [
      { path: '/investor.html', name: 'Investor One-Pager', desc: 'Concise pitch summary for cold outreach.', audience: 'Angels · VCs · LP intros', tag: 'Static HTML' },
      { path: '/investor-deck.html', name: 'Investor Deck (full)', desc: 'Full 30-page pitch deck — vision, market, traction, ask.', audience: 'Active VC conversations', tag: 'Static HTML' },
      { path: '/investor-pet-wrapped.html', name: 'Pet Wrapped — Investor Edition', desc: 'Year-in-review numbers wrapped as a Spotify-style story.', audience: 'Investor follow-up', tag: 'Static HTML' },
      { path: '/introduction.html', name: 'Brand Introduction', desc: 'High-level "what is The Doggy Company" overview.', audience: 'New conversations', tag: 'Static HTML' },
    ],
  },

  // ── B2B PARTNERSHIPS / PROPOSALS ─────────────────────────────────
  {
    group: 'B2B Demos & Proposals',
    icon: Sparkles,
    color: 'from-purple-500 to-pink-500',
    pages: [
      { path: '/demo/dreamfolks', name: 'DreamFolks Demo (gold standard)', desc: 'Hand-crafted pitch demo with full guided tour.', audience: 'DreamFolks team', tag: 'Live page' },
      { path: '/demo', name: 'Public Experience Demo', desc: 'Try-Mira experience for any first-time visitor.', audience: 'Cold leads', tag: 'Live page' },
    ],
    note: 'AI-generated proposals appear automatically in the section below ↓',
  },

  // ── DOCS & KNOWLEDGE ─────────────────────────────────────────────
  {
    group: 'Docs & Architecture',
    icon: BookOpen,
    color: 'from-blue-500 to-indigo-500',
    pages: [
      { path: '/complete-documentation.html', name: 'Complete Platform Documentation', desc: 'Full architecture & feature documentation (autogen).', audience: 'Engineers · sysadmins', tag: 'Static HTML' },
      { path: '/owners-guide.html', name: "Owner's Guide", desc: "Operations playbook — what's where, how it works.", audience: 'Internal · ops', tag: 'Static HTML' },
      { path: '/admin/docs', name: 'Admin Docs Console', desc: 'Live in-app documentation viewer for admins.', audience: 'Admins', tag: 'Auth required' },
    ],
  },

  // ── MARQUEE EXPERIENCES ──────────────────────────────────────────
  {
    group: 'Marquee Experiences',
    icon: Heart,
    color: 'from-pink-500 to-rose-500',
    pages: [
      { path: '/', name: 'Landing Page', desc: 'The first thing anyone sees — hero, pillars, story.', audience: 'Public', tag: 'Live page' },
      { path: '/about', name: 'About — Our Story', desc: 'Founder story · Mystique tribute · 30-year heritage.', audience: 'Public', tag: 'Live page' },
      { path: '/membership', name: 'Membership', desc: 'Pet Pass tiers and pricing.', audience: 'Public', tag: 'Live page' },
      { path: '/pet-soul-demo', name: 'Pet Soul Demo', desc: "Walk through Mojo's pet soul card.", audience: 'Public', tag: 'Live page' },
      { path: '/pet-wrapped-mystique.html', name: 'Pet Wrapped — Mystique', desc: 'Mystique\'s legacy story page.', audience: 'Brand · emotional', tag: 'Static HTML' },
      { path: '/flat-art-demo.html', name: 'Flat Art Demo', desc: 'Brand illustration explorer.', audience: 'Internal · brand', tag: 'Static HTML' },
    ],
  },

  // ── 12 PILLARS ───────────────────────────────────────────────────
  {
    group: '12 Life Pillars',
    icon: Layout,
    color: 'from-green-500 to-emerald-500',
    pages: [
      { path: '/celebrate', name: 'Celebrate', desc: 'Birthdays, parties, custom cakes.', audience: 'Public', tag: 'Live page' },
      { path: '/dine', name: 'Dine', desc: 'Meals, treats, nutrition.', audience: 'Public', tag: 'Live page' },
      { path: '/care', name: 'Care', desc: 'Vet, grooming, supplements.', audience: 'Public', tag: 'Live page' },
      { path: '/go', name: 'Go (Travel + Stay)', desc: 'Pet-friendly travel & boarding.', audience: 'Public', tag: 'Live page' },
      { path: '/play', name: 'Play (Enjoy + Fit)', desc: 'Activities & fitness.', audience: 'Public', tag: 'Live page' },
      { path: '/learn', name: 'Learn', desc: 'Training, behavior, knowledge.', audience: 'Members', tag: 'Auth required' },
      { path: '/paperwork', name: 'Paperwork', desc: 'Vault for records & documents.', audience: 'Members', tag: 'Auth required' },
      { path: '/emergency', name: 'Emergency', desc: '24/7 emergency vet finder + pet ER file.', audience: 'Members', tag: 'Auth required' },
      { path: '/adopt', name: 'Adopt', desc: 'Adoption support and matching.', audience: 'Members', tag: 'Auth required' },
      { path: '/farewell', name: 'Farewell', desc: 'End-of-life care and grief support.', audience: 'Members', tag: 'Auth required' },
      { path: '/shop', name: 'Shop', desc: 'Curated products store.', audience: 'Members', tag: 'Auth required' },
      { path: '/services', name: 'Services', desc: 'Bookable concierge services.', audience: 'Members', tag: 'Auth required' },
    ],
  },

  // ── COMMUNITY ────────────────────────────────────────────────────
  {
    group: 'Community',
    icon: Users,
    color: 'from-cyan-500 to-blue-500',
    pages: [
      { path: '/streaties', name: 'Streaties', desc: 'Stories of community-cared street dogs.', audience: 'Public', tag: 'Live page' },
      { path: '/franchise', name: 'Franchise', desc: 'Partner with us as a city franchisee.', audience: 'Entrepreneurs', tag: 'Live page' },
      { path: '/insights', name: 'Blog · Insights', desc: 'Articles on pet wellness & care.', audience: 'Public', tag: 'Live page' },
      { path: '/faqs', name: 'FAQs', desc: 'Most-asked questions answered.', audience: 'Public', tag: 'Live page' },
      { path: '/contact', name: 'Contact', desc: 'Reach Concierge® directly.', audience: 'Public', tag: 'Live page' },
    ],
  },

  // ── POLICIES ─────────────────────────────────────────────────────
  {
    group: 'Policies & Legal',
    icon: FileText,
    color: 'from-slate-500 to-gray-600',
    pages: [
      { path: '/privacy-policy', name: 'Privacy Policy', desc: 'Data handling and privacy commitments.', audience: 'Public', tag: 'Live page' },
      { path: '/terms', name: 'Terms of Service', desc: 'Usage terms.', audience: 'Public', tag: 'Live page' },
      { path: '/refund-policy', name: 'Refund Policy', desc: 'Refund & return rules.', audience: 'Public', tag: 'Live page' },
      { path: '/shipping-policy', name: 'Shipping Policy', desc: 'Delivery zones and times.', audience: 'Public', tag: 'Live page' },
      { path: '/ai-disclaimer', name: 'AI Disclaimer', desc: "Mira's limits and safety disclaimers.", audience: 'Public', tag: 'Live page' },
    ],
  },
];

const PageRow = ({ page, baseUrl, copyLabel }) => {
  const [copied, setCopied] = useState(false);
  const fullUrl = `${baseUrl}${page.path}`;
  const onCopy = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1300);
  };
  return (
    <div className="flex items-start justify-between gap-3 p-3 hover:bg-gray-50 transition-colors border-b last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm text-gray-900">{page.name}</span>
          {page.tag && <Badge variant="outline" className="text-[10px] py-0 px-1.5">{page.tag}</Badge>}
        </div>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{page.desc}</p>
        <div className="flex items-center gap-3 mt-1 text-[11px]">
          <code className="text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">{page.path}</code>
          {page.audience && <span className="text-gray-400">{page.audience}</span>}
        </div>
      </div>
      <div className="flex gap-1.5 flex-shrink-0">
        <Button size="sm" variant="outline" onClick={onCopy} className="text-xs h-8" data-testid={`copy-${page.path}`}>
          <Copy className="w-3 h-3 mr-1" /> {copied ? '✓' : (copyLabel || 'Copy')}
        </Button>
        <a href={fullUrl} target="_blank" rel="noreferrer">
          <Button size="sm" variant="outline" className="text-xs h-8" data-testid={`open-${page.path}`}>
            <ExternalLink className="w-3 h-3 mr-1" /> Open
          </Button>
        </a>
      </div>
    </div>
  );
};

const PagesDirectory = ({ authHeaders }) => {
  const [search, setSearch] = useState('');
  const [hostMode, setHostMode] = useState('prod');  // 'prod' | 'preview'
  const [proposals, setProposals] = useState([]);

  const baseUrl = hostMode === 'prod' ? PROD_HOST : window.location.origin;

  // Pull AI-generated proposals so they show up here too
  useEffect(() => {
    fetch(`${API}/api/admin/partner-demos`, { headers: authHeaders })
      .then((r) => r.ok ? r.json() : { demos: [] })
      .then((d) => setProposals(d.demos || []))
      .catch(() => setProposals([]));
  }, [authHeaders]);

  const filteredCatalog = useMemo(() => {
    if (!search.trim()) return STATIC_CATALOG;
    const q = search.toLowerCase();
    return STATIC_CATALOG
      .map((g) => ({
        ...g,
        pages: g.pages.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.desc.toLowerCase().includes(q) ||
            p.path.toLowerCase().includes(q) ||
            (p.audience || '').toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.pages.length > 0);
  }, [search]);

  const filteredProposals = useMemo(() => {
    if (!search.trim()) return proposals;
    const q = search.toLowerCase();
    return proposals.filter(
      (p) =>
        p.partner_name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.target_audience || '').toLowerCase().includes(q)
    );
  }, [proposals, search]);

  const totalPages = STATIC_CATALOG.reduce((acc, g) => acc + g.pages.length, 0) + proposals.length;

  return (
    <div className="space-y-5" data-testid="pages-directory">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Globe className="w-6 h-6 text-purple-600" />
          Pages Directory
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Every shareable page on the site, in one place. <strong>{totalPages}</strong> pages indexed · click to copy or open.
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pages by name, path, or audience…"
            data-testid="pages-search"
            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-purple-500"
          />
        </div>
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setHostMode('prod')}
            className={`px-3 py-1 text-xs rounded font-medium transition-colors ${hostMode === 'prod' ? 'bg-white shadow text-purple-700' : 'text-gray-500 hover:text-gray-700'}`}
            data-testid="host-prod"
          >
            🌐 Production
          </button>
          <button
            onClick={() => setHostMode('preview')}
            className={`px-3 py-1 text-xs rounded font-medium transition-colors ${hostMode === 'preview' ? 'bg-white shadow text-purple-700' : 'text-gray-500 hover:text-gray-700'}`}
            data-testid="host-preview"
          >
            🧪 Preview
          </button>
        </div>
      </div>

      <div className="text-xs text-gray-400 bg-amber-50 border border-amber-200 rounded p-2">
        💡 Showing links as <code className="bg-white px-1 rounded">{baseUrl}</code> — toggle above to switch.
      </div>

      {/* AI Proposals (auto-pulled) */}
      {filteredProposals.length > 0 && (
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-3 flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            <h3 className="font-bold text-base">AI-Generated Partner Proposals</h3>
            <Badge className="ml-auto bg-white/20 hover:bg-white/30 text-white text-xs">{filteredProposals.length}</Badge>
          </div>
          <div className="divide-y">
            {filteredProposals.map((p) => (
              <PageRow
                key={p.slug}
                baseUrl={baseUrl}
                page={{
                  path: `/proposal/${p.slug}`,
                  name: `${p.partner_name} Proposal`,
                  desc: `${p.target_audience} · ${p.view_count || 0} view${p.view_count === 1 ? '' : 's'}${p.last_viewed_at ? ` · last viewed ${new Date(p.last_viewed_at).toLocaleDateString()}` : ''}`,
                  audience: p.industry,
                  tag: p.is_active ? 'Email-gated' : 'Inactive',
                }}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Static catalog grouped */}
      {filteredCatalog.map((group) => (
        <Card key={group.group} className="overflow-hidden">
          <div className={`bg-gradient-to-r ${group.color} text-white px-4 py-3 flex items-center gap-2`}>
            <group.icon className="w-5 h-5" />
            <h3 className="font-bold text-base">{group.group}</h3>
            <Badge className="ml-auto bg-white/20 hover:bg-white/30 text-white text-xs">{group.pages.length}</Badge>
          </div>
          {group.note && (
            <div className="px-4 py-2 bg-blue-50 text-xs text-blue-700 border-b">{group.note}</div>
          )}
          <div className="divide-y">
            {group.pages.map((p) => (
              <PageRow key={p.path} baseUrl={baseUrl} page={p} />
            ))}
          </div>
        </Card>
      ))}

      {filteredCatalog.length === 0 && filteredProposals.length === 0 && (
        <Card className="p-8 text-center">
          <Search className="w-10 h-10 mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">No pages match "{search}".</p>
        </Card>
      )}

      <div className="text-xs text-gray-400 italic text-center pt-4">
        <Lock className="w-3 h-3 inline mr-1" />
        Auth-required pages will prompt for login when opened in incognito.
      </div>
    </div>
  );
};

export default PagesDirectory;
