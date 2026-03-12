/**
 * PillarGoldSections.jsx
 * Reusable Gold Standard sections for all pillar pages:
 *   1. PillarDailyTip    - Daily rotating tip
 *   2. PillarHelpBuckets - "How can we help?" 3 action buckets
 *   3. PillarGuidedPaths - Step-by-step guided journeys
 *
 * Usage:
 *   import { PillarDailyTip, PillarHelpBuckets, PillarGuidedPaths } from '../components/PillarGoldSections';
 */

import React from 'react';
import { Card } from './ui/card';
import {
  Sparkles, Target, Award, PawPrint, Users, Heart, Star, Shield,
  Activity, Brain, GraduationCap, Zap, CheckCircle, AlertCircle,
  Clipboard, Package, MapPin, Home, Search, BookOpen, Calendar
} from 'lucide-react';

const ICON_MAP = {
  Award, PawPrint, Users, Heart, Star, Shield, Activity, Brain,
  Sparkles, Target, GraduationCap, Zap, CheckCircle, AlertCircle,
  Clipboard, Package, MapPin, Home, Search, BookOpen, Calendar
};

const COLOR_MAP = {
  amber:  { bg: 'bg-gradient-to-br from-amber-50 to-orange-50',   border: 'border-amber-100',  icon: 'bg-amber-100',  iconColor: 'text-amber-600',  dot: 'bg-amber-400'  },
  teal:   { bg: 'bg-gradient-to-br from-teal-50 to-emerald-50',   border: 'border-teal-100',   icon: 'bg-teal-100',   iconColor: 'text-teal-600',   dot: 'bg-teal-400'   },
  violet: { bg: 'bg-gradient-to-br from-violet-50 to-purple-50',  border: 'border-violet-100', icon: 'bg-violet-100', iconColor: 'text-violet-600', dot: 'bg-violet-400' },
  blue:   { bg: 'bg-gradient-to-br from-blue-50 to-indigo-50',    border: 'border-blue-100',   icon: 'bg-blue-100',   iconColor: 'text-blue-600',   dot: 'bg-blue-400'   },
  pink:   { bg: 'bg-gradient-to-br from-pink-50 to-rose-50',      border: 'border-pink-100',   icon: 'bg-pink-100',   iconColor: 'text-pink-600',   dot: 'bg-pink-400'   },
  green:  { bg: 'bg-gradient-to-br from-green-50 to-emerald-50',  border: 'border-green-100',  icon: 'bg-green-100',  iconColor: 'text-green-600',  dot: 'bg-green-400'  },
  rose:   { bg: 'bg-gradient-to-br from-rose-50 to-pink-50',      border: 'border-rose-100',   icon: 'bg-rose-100',   iconColor: 'text-rose-600',   dot: 'bg-rose-400'   },
  indigo: { bg: 'bg-gradient-to-br from-indigo-50 to-blue-50',    border: 'border-indigo-100', icon: 'bg-indigo-100', iconColor: 'text-indigo-600', dot: 'bg-indigo-400' },
  cyan:   { bg: 'bg-gradient-to-br from-cyan-50 to-sky-50',       border: 'border-cyan-100',   icon: 'bg-cyan-100',   iconColor: 'text-cyan-600',   dot: 'bg-cyan-400'   },
  red:    { bg: 'bg-gradient-to-br from-red-50 to-rose-50',       border: 'border-red-100',    icon: 'bg-red-100',    iconColor: 'text-red-600',    dot: 'bg-red-400'    },
  purple: { bg: 'bg-gradient-to-br from-purple-50 to-violet-50',  border: 'border-purple-100', icon: 'bg-purple-100', iconColor: 'text-purple-600', dot: 'bg-purple-400' },
  orange: { bg: 'bg-gradient-to-br from-orange-50 to-amber-50',   border: 'border-orange-100', icon: 'bg-orange-100', iconColor: 'text-orange-600', dot: 'bg-orange-400' },
};

// ─── 1. DAILY TIP ─────────────────────────────────────────────────────────────
export const PillarDailyTip = ({ tips = [], tipLabel = "Today's Tip" }) => {
  if (!tips || tips.length === 0) return null;
  const tipIndex = new Date().getDate() % tips.length;
  const tip = tips[tipIndex];
  if (!tip) return null;

  const TipIcon = ICON_MAP[tip.icon] || Sparkles;

  return (
    <section className="py-6 px-4 bg-gradient-to-r from-stone-50 to-gray-50" data-testid="daily-pillar-tip-section">
      <div className="max-w-4xl mx-auto">
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${tip.color || 'from-teal-500 to-emerald-500'} p-5 md:p-6 text-white`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-6 -translate-x-6" />
          <div className="relative flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <TipIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-medium text-white/80 uppercase tracking-wider">{tipLabel}</span>
                {tip.category && (
                  <span className="text-xs text-white/60 ml-auto hidden sm:block">{tip.category}</span>
                )}
              </div>
              <p className="text-sm md:text-base font-medium leading-relaxed" data-testid="daily-pillar-tip">
                {tip.tip}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── 2. HELP BUCKETS ──────────────────────────────────────────────────────────
export const PillarHelpBuckets = ({ buckets = [], pillar = '' }) => {
  if (!buckets || buckets.length === 0) return null;

  return (
    <section className="py-10 px-4 bg-stone-50" data-testid="help-buckets-section">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">How can we help?</h2>
          <p className="text-gray-600 mt-1">Choose what matters most to you right now</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {buckets.map((bucket, idx) => {
            const BucketIcon = ICON_MAP[bucket.icon] || Award;
            const colors = COLOR_MAP[bucket.color] || COLOR_MAP.amber;
            return (
              <Card
                key={bucket.id || idx}
                className={`p-5 ${colors.bg} ${colors.border} rounded-2xl cursor-pointer hover:shadow-md transition-shadow`}
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('openMiraAI', {
                    detail: { message: bucket.items?.join(', ') || bucket.title, context: pillar, pillar }
                  }));
                }}
                data-testid={`help-bucket-${idx}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl ${colors.icon} flex items-center justify-center`}>
                    <BucketIcon className={`w-5 h-5 ${colors.iconColor}`} />
                  </div>
                  <h3 className="font-semibold text-gray-900">{bucket.title}</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-600">
                  {(bucket.items || []).map((item, itemIdx) => (
                    <li key={itemIdx} className="flex items-center gap-2">
                      <span className={`w-1 h-1 ${colors.dot} rounded-full flex-shrink-0`} />{item}
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// ─── 3. GUIDED PATHS ──────────────────────────────────────────────────────────
export const PillarGuidedPaths = ({ paths = [], pillar = '', accentColor = 'teal', heading = 'Guided Paths' }) => {
  if (!paths || paths.length === 0) return null;

  return (
    <div id="guided-paths" className="py-12 bg-gray-50" data-testid="guided-paths-section">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Target className="w-4 h-4" />
            Step-by-Step Journeys
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{heading}</h2>
          <p className="text-gray-600 mt-2">Follow a structured journey tailored to your needs</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {paths.map((path, idx) => {
            const pathColor = path.color || accentColor || 'teal';
            const pathColors = {
              pink:   { bg: 'bg-pink-100',   text: 'text-pink-600',   tag: 'bg-pink-100 text-pink-700'   },
              green:  { bg: 'bg-green-100',  text: 'text-green-600',  tag: 'bg-green-100 text-green-700'  },
              purple: { bg: 'bg-purple-100', text: 'text-purple-600', tag: 'bg-purple-100 text-purple-700' },
              blue:   { bg: 'bg-blue-100',   text: 'text-blue-600',   tag: 'bg-blue-100 text-blue-700'   },
              amber:  { bg: 'bg-amber-100',  text: 'text-amber-600',  tag: 'bg-amber-100 text-amber-700'  },
              indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', tag: 'bg-indigo-100 text-indigo-700' },
              teal:   { bg: 'bg-teal-100',   text: 'text-teal-600',   tag: 'bg-teal-100 text-teal-700'   },
              cyan:   { bg: 'bg-cyan-100',   text: 'text-cyan-600',   tag: 'bg-cyan-100 text-cyan-700'   },
              rose:   { bg: 'bg-rose-100',   text: 'text-rose-600',   tag: 'bg-rose-100 text-rose-700'   },
              red:    { bg: 'bg-red-100',    text: 'text-red-600',    tag: 'bg-red-100 text-red-700'     },
              orange: { bg: 'bg-orange-100', text: 'text-orange-600', tag: 'bg-orange-100 text-orange-700' },
            };
            const pc = pathColors[pathColor] || pathColors.teal;
            return (
              <Card
                key={idx}
                className="p-5 cursor-pointer hover:shadow-lg transition-all group"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('openMiraAI', {
                    detail: {
                      message: `I want to follow the "${path.title}" journey. Steps: ${path.steps?.join(', ')}`,
                      context: pillar,
                      pillar
                    }
                  }));
                }}
                data-testid={`guided-path-${idx}`}
              >
                <div className={`w-10 h-10 rounded-xl ${pc.bg} flex items-center justify-center mb-3`}>
                  <Target className={`w-5 h-5 ${pc.text}`} />
                </div>
                <h3 className={`font-semibold text-gray-900 mb-2 group-hover:${pc.text} transition-colors text-sm`}>{path.title}</h3>
                <div className="flex flex-wrap gap-1">
                  {(path.steps || []).slice(0, 3).map((step, stepIdx) => (
                    <span key={stepIdx} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{step}</span>
                  ))}
                  {(path.steps || []).length > 3 && (
                    <span className={`text-xs ${pc.tag} px-2 py-0.5 rounded-full`}>+{path.steps.length - 3} more</span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
