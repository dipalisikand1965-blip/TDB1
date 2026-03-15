/**
 * MiraSoulNudge.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Shows the top unanswered soul questions for a pet as interactive soul cards.
 * Context-aware: when context="celebrate" it surfaces celebration + taste_treat
 * questions first.
 *
 * HOW THE SOUL SCORE WORKS (embedded so agents always know):
 *   • Pet soul has 51 questions across 8 folders (pillars)
 *   • Each question has a weight (1-5) — high-weight = more points
 *   • Answering all critical questions = 100% soul score
 *   • The soul score powers ALL of Mira's personalisation on every pillar page
 *   • "none_confirmed" = user deliberately said "none" → counts as answered
 *   • Mira ALWAYS REMEMBERS every answer — they persist in doggy_soul_answers
 *
 * API:
 *   GET  /api/pet-soul/profile/:petId/quick-questions?context=celebrate&limit=3
 *   POST /api/pet-soul/answer  { pet_id, question_id, answer }
 *
 * USAGE: <MiraSoulNudge pet={pet} token={token} context="celebrate" />
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronRight, Check } from 'lucide-react';
import { API_URL } from '../../utils/api';
import { toast } from '../../hooks/use-toast';

// ── Point budget map (weight → visual points displayed) ─────────────────────
const WEIGHT_PTS = { 5: '+10', 4: '+7', 3: '+5', 2: '+3', 1: '+2' };

// ── Type renderers ────────────────────────────────────────────────────────────
function OptionChips({ options, selected, onSelect, multi = false }) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {options.map(opt => {
        const val = typeof opt === 'string' ? opt : opt.value ?? opt;
        const label = typeof opt === 'string' ? opt : opt.label ?? opt;
        const active = multi ? (Array.isArray(selected) && selected.includes(val)) : selected === val;
        return (
          <button
            key={val}
            onClick={() => onSelect(val)}
            className="rounded-full px-3 py-1 text-sm border transition-all"
            style={{
              background: active ? 'linear-gradient(135deg, #8B5CF6, #EC4899)' : '#fff',
              color: active ? '#fff' : '#444',
              border: active ? '1.5px solid transparent' : '1.5px solid #E5E7EB',
              fontWeight: active ? 600 : 400,
            }}
            data-testid={`soul-option-${val}`}
          >
            {active && <span style={{ marginRight: 4 }}>✓</span>}
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ── Single Soul Card ──────────────────────────────────────────────────────────
function SoulCard({ question, pet, token, onAnswered }) {
  const [localAnswer, setLocalAnswer] = useState(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [scoreJump, setScoreJump] = useState(null);

  const pts = WEIGHT_PTS[question.weight] || '+2';

  const submitAnswer = useCallback(async (ans) => {
    if (!ans || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/pet-soul/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ pet_id: pet.id, question_id: question.question_id, answer: ans }),
      });
      const data = await res.json();
      if (data.success) {
        const newScore = data.scores?.overall;
        setScoreJump(pts);
        setDone(true);
        // Emit soul score updated event so hero chip updates instantly
        window.dispatchEvent(new CustomEvent('soulScoreUpdated', {
          detail: { petId: pet.id, score: newScore }
        }));
        setTimeout(() => onAnswered(question.question_id, ans, newScore), 1200);
      } else {
        toast({ title: 'Could not save — try again', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }, [pet.id, question.question_id, pts, token, onAnswered, saving]);

  const handleSelect = (val) => {
    setLocalAnswer(val);
    if (question.type !== 'multi_select') submitAnswer(val);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, height: 0, marginBottom: 0 }}
      className="relative overflow-hidden rounded-2xl"
      style={{
        border: '1.5px solid rgba(139,92,246,0.20)',
        background: done ? 'linear-gradient(135deg,#F0FDF4,#DCFCE7)' : '#fff',
        boxShadow: '0 2px 12px rgba(139,92,246,0.08)',
      }}
      data-testid={`soul-card-${question.question_id}`}
    >
      {/* Score jump flash */}
      <AnimatePresence>
        {scoreJump && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1.1, y: -4 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className="absolute top-3 right-3 rounded-full px-3 py-1 text-sm font-bold text-white pointer-events-none"
            style={{ background: 'linear-gradient(135deg,#10B981,#34D399)', zIndex: 10 }}
          >
            {scoreJump} ✦
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4">
        {/* Done state */}
        {done ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-800">Mira remembers this</p>
              <p className="text-xs text-green-600 mt-0.5">Soul score updating…</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm"
                style={{ background: 'linear-gradient(135deg,#8B5CF6,#EC4899)', color: '#fff' }}
              >
                ✦
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#8B5CF6' }}>
                    {question.folder_icon} {question.folder_name}
                  </span>
                  <span
                    className="text-[10px] font-bold rounded-full px-2 py-0.5"
                    style={{ background: 'rgba(139,92,246,0.10)', color: '#7C3AED' }}
                  >
                    Unlocks {pts} soul pts
                  </span>
                </div>
                <p className="text-sm font-semibold" style={{ color: '#1A0A2E', lineHeight: 1.4 }}>
                  {question.question}
                </p>
              </div>
            </div>

            {/* Answer UI */}
            {question.type === 'text' ? (
              <TextAnswer question={question} onSubmit={submitAnswer} saving={saving} />
            ) : (
              <OptionChips
                options={question.options || []}
                selected={localAnswer}
                onSelect={handleSelect}
                multi={question.type === 'multi_select'}
              />
            )}

            {/* Multi-select submit */}
            {question.type === 'multi_select' && localAnswer?.length > 0 && (
              <button
                onClick={() => submitAnswer(localAnswer)}
                disabled={saving}
                className="mt-3 w-full rounded-xl py-2 text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#8B5CF6,#EC4899)' }}
              >
                {saving ? 'Saving…' : 'Tell Mira →'}
              </button>
            )}

            {/* Skip */}
            <button
              onClick={() => onAnswered(question.question_id, null, null)}
              className="mt-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Skip for now
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

// ── Text input answer ─────────────────────────────────────────────────────────
function TextAnswer({ question, onSubmit, saving }) {
  const [val, setVal] = useState('');
  return (
    <div className="flex gap-2 mt-2">
      <input
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && val.trim() && onSubmit(val.trim())}
        placeholder="Type and press Enter…"
        className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
      />
      <button
        disabled={!val.trim() || saving}
        onClick={() => onSubmit(val.trim())}
        className="rounded-lg px-3 py-2 text-sm font-bold text-white disabled:opacity-40"
        style={{ background: 'linear-gradient(135deg,#8B5CF6,#EC4899)' }}
      >
        {saving ? '…' : <ChevronRight className="w-4 h-4" />}
      </button>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
const MiraSoulNudge = ({ pet, token, context = 'celebrate', limit = 3 }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [answeredIds, setAnsweredIds] = useState(new Set());
  const [currentScore, setCurrentScore] = useState(pet?.soul_score || pet?.overall_score || 0);
  const [allDone, setAllDone] = useState(false);
  const fetchedRef = useRef(false);

  const fetchQuestions = useCallback(async () => {
    if (!pet?.id) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/pet-soul/profile/${pet.id}/quick-questions?context=${context}&limit=${limit}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || []);
        setCurrentScore(data.current_score || 0);
        if (!data.questions?.length) setAllDone(true);
      }
    } catch (e) {
      console.error('MiraSoulNudge fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [pet?.id, context, limit, token]);

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchQuestions();
    }
  }, [fetchQuestions]);

  const handleAnswered = useCallback((questionId, answer, newScore) => {
    setAnsweredIds(prev => new Set([...prev, questionId]));
    if (newScore) setCurrentScore(newScore);
    // Remove the answered card after animation
    setTimeout(() => {
      setQuestions(prev => {
        const remaining = prev.filter(q => q.question_id !== questionId);
        if (remaining.length === 0) setAllDone(true);
        return remaining;
      });
    }, 800);
  }, []);

  // Don't render if loading (no flash) or if no unanswered questions at all
  if (loading) return null;

  const petName = pet?.name || 'your dog';
  const visible = questions.filter(q => !answeredIds.has(q.question_id));
  const scoreRound = Math.round(currentScore);

  return (
    <div
      className="rounded-2xl overflow-hidden mb-6"
      style={{ border: '1.5px solid rgba(139,92,246,0.15)', background: 'linear-gradient(135deg,#FAF5FF,#FFF0F8)' }}
      data-testid="mira-soul-nudge"
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(139,92,246,0.10)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-base"
              style={{ background: 'linear-gradient(135deg,#8B5CF6,#EC4899)' }}
            >
              ✦
            </div>
            <div>
              <div className="text-sm font-bold" style={{ color: '#1A0A2E' }}>
                Mira is learning about {petName}
              </div>
              <div className="text-xs mt-0.5" style={{ color: '#888' }}>
                Soul score: <strong style={{ color: '#8B5CF6' }}>{scoreRound}%</strong>
                {!allDone && ` · Answer these to help Mira know ${petName} better`}
              </div>
            </div>
          </div>
          {/* Score arc */}
          <div className="flex-shrink-0 text-right">
            <div className="text-2xl font-black" style={{ color: '#8B5CF6', lineHeight: 1 }}>{scoreRound}%</div>
            <div className="text-[10px] text-gray-400">soul known</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg,#8B5CF6,#EC4899)' }}
            initial={{ width: 0 }}
            animate={{ width: `${scoreRound}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      <div className="p-4 space-y-3">
        {allDone ? (
          /* All done state */
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 rounded-xl p-4"
            style={{ background: 'linear-gradient(135deg,#F0FDF4,#DCFCE7)', border: '1.5px solid #86EFAC' }}
          >
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-green-800">Mira knows {petName}'s food soul</p>
              <p className="text-xs text-green-600 mt-0.5">
                {petName}'s soul score is {scoreRound}%. Every product, treat, and celebration pick is now personalised.
              </p>
            </div>
          </motion.div>
        ) : (
          /* Soul question cards */
          <AnimatePresence mode="popLayout">
            {visible.map(q => (
              <SoulCard
                key={q.question_id}
                question={q}
                pet={pet}
                token={token}
                onAnswered={handleAnswered}
              />
            ))}
          </AnimatePresence>
        )}

        {/* Footer — Mira's voice */}
        {!allDone && visible.length > 0 && (
          <p className="text-xs text-center pb-1" style={{ color: '#aaa' }}>
            ✦ Mira always remembers. Every answer makes {petName}'s experience more personal.
          </p>
        )}
      </div>
    </div>
  );
};

export default MiraSoulNudge;
