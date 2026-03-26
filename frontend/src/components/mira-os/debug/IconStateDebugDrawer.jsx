/**
 * IconStateDebugDrawer.jsx (internally) / Proof Panel (user-facing)
 * ==================================================================
 * QA panel to display raw counts and computed icon states
 * For developer/tester validation of the icon state system
 * 
 * User-facing name: "Proof Panel"
 * Feature flag: ?debug=1
 * Microcopy: "For QA only. Shows the contracts Mira is following for this turn."
 * 
 * Shows:
 * - Raw counts from backend API
 * - Computed states per icon
 * - Query filters used
 * - Data flow verification
 * - "Syncing history" notice (never says "legacy" to users)
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, ChevronLeft, Bug, RefreshCw, Check, X, AlertTriangle } from 'lucide-react';
import { ICON_STATE, TAB_IDS, getIconState } from '../../../hooks/mira/useIconState';

const StateIndicator = ({ state }) => {
  const colors = {
    [ICON_STATE.OFF]: 'bg-gray-400',
    [ICON_STATE.ON]: 'bg-green-500',
    [ICON_STATE.PULSE]: 'bg-orange-500 animate-pulse',
  };

  return (
    <span className={`inline-block w-3 h-3 rounded-full ${colors[state] || 'bg-gray-300'}`} />
  );
};

const CountRow = ({ label, value, highlight = false }) => (
  <div className={`flex justify-between py-1 px-2 ${highlight ? 'bg-orange-500/20 rounded' : ''}`}>
    <span className="text-gray-400 text-xs">{label}</span>
    <span className={`font-mono text-xs ${highlight ? 'text-orange-400 font-bold' : 'text-white'}`}>
      {value ?? '—'}
    </span>
  </div>
);

const TabSection = ({ tabId, tabName, counts, serverState, serverBadge, activeTab }) => {
  // Compute client-side state to compare with server
  const clientState = getIconState(tabId, counts, activeTab);
  const statesMatch = clientState.state === serverState;
  const badgesMatch = clientState.badge === (serverBadge ? String(serverBadge) : null);

  return (
    <div className="border border-gray-700 rounded-lg p-2 mb-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-white font-medium text-sm">{tabName}</span>
        <div className="flex items-center gap-2">
          <StateIndicator state={serverState} />
          <span className="text-xs text-gray-400">{serverState}</span>
          {serverBadge && (
            <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {serverBadge}
            </span>
          )}
        </div>
      </div>

      {/* Counts */}
      <div className="bg-gray-800/50 rounded p-1 mb-2">
        {Object.entries(counts || {}).map(([key, value]) => (
          <CountRow 
            key={key} 
            label={key} 
            value={value}
            highlight={value > 0 && (key.includes('urgent') || key.includes('awaiting') || key.includes('unread'))}
          />
        ))}
      </div>

      {/* Client vs Server comparison */}
      <div className="text-xs flex items-center gap-2">
        <span className="text-gray-500">Client:</span>
        <StateIndicator state={clientState.state} />
        <span className={statesMatch ? 'text-green-400' : 'text-red-400'}>
          {clientState.state}
        </span>
        {statesMatch ? (
          <Check className="w-3 h-3 text-green-400" />
        ) : (
          <X className="w-3 h-3 text-red-400" />
        )}
        {clientState.badge && (
          <span className={`${badgesMatch ? 'text-green-400' : 'text-red-400'}`}>
            [{clientState.badge}]
          </span>
        )}
      </div>
    </div>
  );
};

const IconStateDebugDrawer = ({ 
  debugInfo = {}, 
  onRefresh,
  counts = {},
  activeTab = null,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDevMode, setIsDevMode] = useState(false);

  // Only show when ?debug=1 query param is explicitly present (not in dev mode by default)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const debugParam = urlParams.get('debug');
    setIsDevMode(debugParam === '1');
  }, []);

  // Always show button in dev mode, even if no data
  if (!isDevMode) return null;

  const { raw, serverStates = {}, serverBadges = {}, lastFetchedAt, error, petIds = [], userEmail } = debugInfo || {};

  // Map tab IDs to display names and counts
  const tabConfig = [
    { 
      id: TAB_IDS.SERVICES, 
      name: 'SERVICES', 
      counts: { 
        activeTicketsCount: counts.activeTicketsCount, 
        awaitingYouCount: counts.awaitingYouCount 
      } 
    },
    { 
      id: TAB_IDS.TODAY, 
      name: 'TODAY', 
      counts: { 
        urgentCount: counts.urgentCount, 
        dueTodayCount: counts.dueTodayCount, 
        upcomingCount: counts.upcomingCount 
      } 
    },
    { 
      id: TAB_IDS.CONCIERGE, 
      name: 'CONCIERGE', 
      counts: { 
        unreadRepliesCount: counts.unreadRepliesCount, 
        openThreadsCount: counts.openThreadsCount 
      } 
    },
    { 
      id: TAB_IDS.PICKS, 
      name: 'PICKS', 
      counts: { 
        newPicksSinceLastView: counts.newPicksSinceLastView, 
        materialChangeCount: counts.materialChangeCount 
      } 
    },
    { 
      id: TAB_IDS.LEARN, 
      name: 'LEARN', 
      counts: { 
        pendingInsightsCount: counts.pendingInsightsCount, 
        learnedFactsCount: counts.learnedFactsCount 
      } 
    },
    { 
      id: TAB_IDS.MOJO, 
      name: 'MOJO', 
      counts: { 
        hasCriticalMissing: counts.hasCriticalMissing, 
        soulScore: counts.soulScore 
      } 
    },
  ];

  // Use portal to render outside overflow-hidden containers
  const portalContent = (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-[9999] bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-l-lg shadow-lg transition-all"
        title="Proof Panel"
      >
        {isOpen ? <ChevronRight className="w-4 h-4" /> : <Bug className="w-4 h-4" />}
      </button>

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-80 bg-gray-900 border-l border-gray-700 shadow-2xl z-[9998] transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } overflow-y-auto`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-white font-bold text-sm flex items-center gap-2">
              <Bug className="w-4 h-4 text-purple-400" />
              Proof Panel
            </h2>
            <button
              onClick={onRefresh}
              className="p-1 hover:bg-gray-700 rounded"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          
          {/* QA microcopy */}
          <p className="text-[10px] text-gray-500 italic mb-2">
            QA only. Shows what Mira decided this turn. Not shown to members.
          </p>

          {/* Status */}
          <div className="text-xs space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">User:</span>
              <span className="text-gray-300 truncate">{userEmail || '—'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Pets:</span>
              <span className="text-gray-300">{petIds?.length || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Active Tab:</span>
              <span className="text-orange-400 font-mono">{activeTab || 'none'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Last Fetch:</span>
              <span className="text-gray-300 text-[10px]">
                {lastFetchedAt ? new Date(lastFetchedAt).toLocaleTimeString() : '—'}
              </span>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-3 h-3" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tab States */}
        <div className="p-3">
          <h3 className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">
            Tab States
          </h3>
          
          {!userEmail && (
            <div className="text-yellow-400 text-xs p-2 bg-yellow-500/10 rounded mb-2">
              Login required to fetch icon state data
            </div>
          )}
          
          {/* SYNCING HISTORY NOTICE - User-friendly language */}
          {counts?._hasLegacyData && (
            <div className="text-blue-400 text-xs p-2 bg-blue-500/10 rounded mb-2 border border-blue-500/30">
              <div className="font-medium flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Syncing history
              </div>
              <div className="text-blue-300 mt-1">
                Older requests may appear gradually. New requests are tracked instantly.
              </div>
            </div>
          )}
          
          {tabConfig.map(({ id, name, counts: tabCounts }) => (
            <TabSection
              key={id}
              tabId={id}
              tabName={name}
              counts={tabCounts}
              serverState={serverStates?.[id] || ICON_STATE.OFF}
              serverBadge={serverBadges?.[id]}
              activeTab={activeTab}
            />
          ))}
        </div>

        {/* Query Filters */}
        {raw?.debug && (
          <div className="p-3 border-t border-gray-700">
            <h3 className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">
              Query Filters
            </h3>
            <div className="bg-gray-800/50 rounded p-2 text-xs font-mono text-gray-400 overflow-x-auto">
              <div className="mb-1">
                <span className="text-purple-400">Sources:</span>
                <span className="text-gray-300 ml-2">
                  {raw.debug.unified_ticket_sources?.join(', ')}
                </span>
              </div>
              <div className="mb-1">
                <span className="text-purple-400">Terminal:</span>
                <span className="text-gray-300 ml-2 break-words">
                  {raw.debug.terminal_statuses?.join(', ')}
                </span>
              </div>
              <div className="mb-1">
                <span className="text-purple-400">Awaiting:</span>
                <span className="text-gray-300 ml-2 break-words">
                  {raw.debug.awaiting_user_statuses?.join(', ')}
                </span>
              </div>
              <div>
                <span className="text-purple-400">High Urgency:</span>
                <span className="text-gray-300 ml-2">
                  {raw.debug.high_urgency?.join(', ')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Suppressed Tags Section (Conflict Resolution Debug) */}
        {counts?.suppressedTagsCount !== undefined && (
          <div className="p-3 border-t border-gray-700">
            <h3 className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">
              Tag Safety (Conflict Resolution)
            </h3>
            <div className="bg-gray-800/50 rounded p-2 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-400">Suppressed Tags:</span>
                <span className={`font-mono ${counts.suppressedTagsCount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {counts.suppressedTagsCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Has Conflicts:</span>
                <span className={`font-mono ${counts.hasConflicts ? 'text-orange-400' : 'text-green-400'}`}>
                  {counts.hasConflicts ? 'YES' : 'NO'}
                </span>
              </div>
              {counts.suppressedTagsList?.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-700">
                  <span className="text-red-400 font-medium">Suppressed:</span>
                  <ul className="mt-1 space-y-0.5">
                    {counts.suppressedTagsList.map((tag, idx) => (
                      <li key={idx} className="text-red-300 truncate">
                        ❌ [{tag.category}] {tag.content}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="p-3 border-t border-gray-700">
          <h3 className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">
            Legend
          </h3>
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1">
              <StateIndicator state={ICON_STATE.OFF} />
              <span className="text-gray-400">OFF</span>
            </div>
            <div className="flex items-center gap-1">
              <StateIndicator state={ICON_STATE.ON} />
              <span className="text-gray-400">ON</span>
            </div>
            <div className="flex items-center gap-1">
              <StateIndicator state={ICON_STATE.PULSE} />
              <span className="text-gray-400">PULSE</span>
            </div>
          </div>
        </div>

        {/* Raw JSON (collapsible) */}
        <details className="p-3 border-t border-gray-700">
          <summary className="text-gray-400 text-xs font-medium cursor-pointer hover:text-gray-300">
            Raw API Response
          </summary>
          <pre className="mt-2 bg-gray-800/50 rounded p-2 text-[10px] text-gray-500 overflow-x-auto max-h-48 overflow-y-auto">
            {JSON.stringify(raw, null, 2)}
          </pre>
        </details>
      </div>
    </>
  );

  // Render via portal to escape overflow-hidden containers
  return createPortal(portalContent, document.body);
};

export default IconStateDebugDrawer;
