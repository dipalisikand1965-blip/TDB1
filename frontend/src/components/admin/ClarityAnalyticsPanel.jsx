/**
 * ClarityAnalyticsPanel.jsx — Admin → Live Analytics
 *
 * Zero-backend shortcut panel. Deep-links directly into Microsoft Clarity
 * (project wg80h6tw9z) so Dipali + the team can jump to Live Recordings /
 * Heatmaps / Dashboard in one click from admin.
 *
 * Intentionally minimal: Clarity blocks iframe embedding (X-Frame-Options),
 * so the right UX is three big buttons that open the corresponding Clarity
 * tab in a new window.
 */

const CLARITY_PROJECT = "wg80h6tw9z";
const BASE = `https://clarity.microsoft.com/projects/view/${CLARITY_PROJECT}`;

const TILES = [
  {
    id: "recordings",
    emoji: "🔴",
    title: "Watch Live Recordings",
    blurb: "Every visitor session replayed. Cursor movements, scrolls, clicks, rage-clicks. See exactly what investors did on your deck.",
    url: `${BASE}/recordings`,
    accent: "#DC2626",
    accentSoft: "#FEE2E2",
  },
  {
    id: "heatmaps",
    emoji: "🔥",
    title: "View Heatmaps",
    blurb: "Red-hot attention maps per page. Find which section of the investor deck held attention — and which scrolled past.",
    url: `${BASE}/heatmaps`,
    accent: "#EA580C",
    accentSoft: "#FFEDD5",
  },
  {
    id: "dashboard",
    emoji: "📈",
    title: "Analytics Dashboard",
    blurb: "Sessions, avg time on site, bounce rate, dead-click %, scroll depth — aggregated across every route on the site.",
    url: `${BASE}/dashboard`,
    accent: "#4F46E5",
    accentSoft: "#E0E7FF",
  },
];

export default function ClarityAnalyticsPanel() {
  return (
    <div className="space-y-6" data-testid="clarity-analytics-panel">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-900 text-white rounded-2xl p-6">
        <div className="text-xs font-bold tracking-widest uppercase text-indigo-300 mb-1">
          ✦ Real-Time Visitor Intelligence
        </div>
        <h2 className="text-2xl font-extrabold">Live Analytics — Microsoft Clarity</h2>
        <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
          Session replays + heatmaps across the entire site (164 React routes + 4 investor HTMLs).
          All three buttons below open Clarity in a new tab, pre-scoped to your project.
        </p>
        <div className="mt-3 inline-flex items-center gap-2 text-xs font-mono text-indigo-200 bg-indigo-950/50 px-3 py-1.5 rounded-lg">
          <span>Project ID:</span>
          <span className="font-bold">{CLARITY_PROJECT}</span>
        </div>
      </div>

      {/* Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="clarity-tiles">
        {TILES.map((t) => (
          <a
            key={t.id}
            href={t.url}
            target="_blank"
            rel="noopener noreferrer"
            data-testid={`clarity-link-${t.id}`}
            className="group block bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all"
            style={{ minHeight: 180 }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3"
              style={{ backgroundColor: t.accentSoft }}
            >
              {t.emoji}
            </div>
            <div
              className="text-base font-bold mb-1.5 flex items-center gap-2"
              style={{ color: t.accent }}
            >
              {t.title}
              <span
                className="inline-block transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              >
                →
              </span>
            </div>
            <div className="text-xs text-slate-600 leading-relaxed">{t.blurb}</div>
          </a>
        ))}
      </div>

      {/* Helper strip */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 leading-relaxed">
        <div className="font-bold text-slate-800 mb-1">💡 Tomorrow morning with your chai:</div>
        Open <b>Watch Live Recordings</b> → filter URL contains <code className="bg-white px-1.5 py-0.5 rounded">/investor</code> →
        sort by duration descending. The longest sessions are your most engaged visitors.
        Replay them end-to-end to see exactly which slides held attention.
      </div>
    </div>
  );
}
