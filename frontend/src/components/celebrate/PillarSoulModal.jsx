/**
 * PillarSoulModal.jsx
 * Opens when an INCOMPLETE pillar is clicked ("Tell Mira more")
 * Shows 4-6 pillar-specific soul questions → answers update soul profile + recalibrate score
 * All answers go to Mira's Memory (learned_facts) for concierge + product wizard
 *
 * Style: Dark purple header (Mira branding) + white question cards — like Mira Picks
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ChevronRight, Loader2 } from 'lucide-react';
import { PILLAR_QUESTIONS, buildLearnedFact, transformAnswer } from './pillarQuestions';

const API_BASE = process.env.REACT_APP_BACKEND_URL;

// ── Question type renderers ──────────────────────────────────────────────────

const SingleSelect = ({ question, value, onChange, petName }) => {
  const q = question.question.replace(/{petName}/g, petName);
  return (
    <div>
      <p className="font-bold mb-4" style={{ fontSize: 16, color: '#1A0030', lineHeight: 1.4 }}>
        <span style={{ marginRight: 8 }}>{question.icon}</span>{q}
      </p>
      <div className="flex flex-wrap gap-2">
        {question.options.map(opt => (
          <button key={opt} onClick={() => onChange(opt)}
            data-testid={`soul-opt-${opt.replace(/\s/g, '-').toLowerCase()}`}
            className="rounded-full font-medium transition-all duration-100 hover:scale-[1.02]"
            style={{
              padding: '10px 18px', fontSize: 14, cursor: 'pointer',
              background: value === opt ? '#C44DFF' : '#FAF5FF',
              color: value === opt ? '#FFF' : '#7C3AED',
              border: value === opt ? '1.5px solid #C44DFF' : '1.5px solid #E0CCFF',
            }}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};

const MultiSelect = ({ question, value = [], onChange, petName }) => {
  const q = question.question.replace(/{petName}/g, petName);
  const selected = Array.isArray(value) ? value : [];
  const allOptions = question.none_option ? [...question.options, question.none_option] : question.options;

  const toggle = (opt) => {
    if (opt === question.none_option) {
      onChange([question.none_option]);
      return;
    }
    const filtered = selected.filter(s => s !== question.none_option);
    const next = filtered.includes(opt) ? filtered.filter(s => s !== opt) : [...filtered, opt];
    onChange(next);
  };

  return (
    <div>
      <p className="font-bold mb-1" style={{ fontSize: 16, color: '#1A0030', lineHeight: 1.4 }}>
        <span style={{ marginRight: 8 }}>{question.icon}</span>{q}
      </p>
      <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 12 }}>Select all that apply</p>
      <div className="flex flex-wrap gap-2">
        {allOptions.map(opt => {
          const isSelected = selected.includes(opt);
          const isNone = opt === question.none_option;
          return (
            <button key={opt} onClick={() => toggle(opt)}
              className="rounded-full font-medium transition-all duration-100"
              style={{
                padding: '9px 16px', fontSize: 13, cursor: 'pointer',
                background: isSelected ? (isNone ? '#22C55E' : '#C44DFF') : '#FAF5FF',
                color: isSelected ? '#FFF' : (isNone ? '#166534' : '#7C3AED'),
                border: isSelected ? `1.5px solid ${isNone ? '#22C55E' : '#C44DFF'}` : '1.5px solid #E0CCFF',
              }}>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const TextInput = ({ question, value = '', onChange, petName }) => {
  const q = question.question.replace(/{petName}/g, petName);
  return (
    <div>
      <p className="font-bold mb-3" style={{ fontSize: 16, color: '#1A0030', lineHeight: 1.4 }}>
        <span style={{ marginRight: 8 }}>{question.icon}</span>{q}
      </p>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={question.placeholder}
        rows={3}
        className="w-full rounded-xl p-3 resize-none focus:outline-none"
        style={{
          border: '1.5px solid #E0CCFF',
          fontSize: 14, color: '#1A0030',
          background: '#FAF5FF',
          lineHeight: 1.5,
        }}
      />
    </div>
  );
};

// ── Main Modal ────────────────────────────────────────────────────────────────

const PillarSoulModal = ({ pillar, pet, token, isOpen, onClose, onComplete }) => {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const petName = pet?.name || 'your pet';
  const questions = PILLAR_QUESTIONS[pillar?.id] || [];
  const totalQ = questions.length;
  const progress = totalQ > 0 ? Math.round(((currentQ) / totalQ) * 100) : 0;
  const activeQ = questions[currentQ];
  const currentAnswer = answers[activeQ?.id];
  const hasAnswer = currentAnswer !== undefined && currentAnswer !== '' &&
    (Array.isArray(currentAnswer) ? currentAnswer.length > 0 : true);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setCurrentQ(0);
      setAnswers({});
      setSuccess(false);
    }
  }, [isOpen, pillar?.id]);

  const handleAnswer = (value) => {
    setAnswers(prev => ({ ...prev, [activeQ.id]: value }));
  };

  const handleNext = () => {
    if (currentQ < totalQ - 1) {
      setCurrentQ(prev => prev + 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Build soul_answers from raw answers (applying transforms)
      const soulAnswers = {};
      const learnedFacts = [];

      questions.forEach(q => {
        const raw = answers[q.id];
        if (raw === undefined || raw === '') return;
        const finalValue = transformAnswer(q, raw);
        soulAnswers[q.soul_field] = finalValue;
        learnedFacts.push(buildLearnedFact(pillar.name, q, finalValue, petName));
      });

      const resp = await fetch(`${API_BASE}/api/pets/${pet.id}/pillar-soul-update`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          pillar: pillar.id,
          answers: soulAnswers,
          learned_facts: learnedFacts,
          summary: `${petName}'s ${pillar.name} profile updated via pillar soul modal`,
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        setSuccess(true);
        setTimeout(() => {
          onComplete?.(data.pet || data);
          onClose();
        }, 1800);
      } else {
        setSubmitting(false);
      }
    } catch (e) {
      console.error('[PillarSoulModal] Submit error:', e);
      setSubmitting(false);
    }
  };

  if (!isOpen || !pillar) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(26,0,48,0.65)', backdropFilter: 'blur(4px)' }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 24 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ pointerEvents: 'none' }}
          >
            <div
              className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
              style={{ pointerEvents: 'all', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
            >
              {/* ── Header ── */}
              <div className="relative px-6 pt-6 pb-5"
                style={{ background: 'linear-gradient(135deg, #2D0050, #6B0099, #C44DFF)', flexShrink: 0 }}>
                <button onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer' }}>
                  <X className="w-4 h-4 text-white" />
                </button>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.15)' }}>
                    {pillar.icon}
                  </div>
                  <div>
                    <p className="font-extrabold text-white" style={{ fontSize: 17 }}>
                      Tell Mira about {petName}'s {pillar.name}
                    </p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
                      Mira will personalise everything for {petName}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="rounded-full overflow-hidden h-1.5" style={{ background: 'rgba(255,255,255,0.20)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'rgba(255,255,255,0.90)' }}
                    animate={{ width: `${progress + (100 / totalQ)}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 6 }}>
                  {currentQ + 1} of {totalQ} questions
                </p>
              </div>

              {/* ── Content ── */}
              <div className="bg-white overflow-y-auto flex-1 px-6 py-6"
                style={{ minHeight: 240 }}>

                {!success ? (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentQ}
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -24 }}
                      transition={{ duration: 0.18 }}
                    >
                      {activeQ?.type === 'single_select' && (
                        <SingleSelect question={activeQ} value={currentAnswer} onChange={handleAnswer} petName={petName} />
                      )}
                      {activeQ?.type === 'multi_select' && (
                        <MultiSelect question={activeQ} value={currentAnswer} onChange={handleAnswer} petName={petName} />
                      )}
                      {activeQ?.type === 'text_input' && (
                        <TextInput question={activeQ} value={currentAnswer} onChange={handleAnswer} petName={petName} />
                      )}
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                      style={{ background: 'linear-gradient(135deg, #C44DFF, #FF6B9D)' }}>
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <p className="font-extrabold text-xl mb-2" style={{ color: '#1A0030' }}>
                      Mira knows {petName} better now
                    </p>
                    <p style={{ fontSize: 13, color: '#888' }}>
                      Soul score updated — {pillar.name} is now personalised for {petName}
                    </p>
                  </motion.div>
                )}
              </div>

              {/* ── Footer ── */}
              {!success && (
                <div className="bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-between"
                  style={{ flexShrink: 0 }}>
                  {/* Skip */}
                  {currentQ < totalQ - 1 ? (
                    <button onClick={handleNext}
                      className="text-sm font-medium"
                      style={{ color: '#C44DFF', background: 'none', border: 'none', cursor: 'pointer' }}>
                      Skip this one
                    </button>
                  ) : (
                    <div />
                  )}

                  {/* Next / Submit */}
                  {currentQ < totalQ - 1 ? (
                    <button
                      onClick={handleNext}
                      disabled={!hasAnswer}
                      data-testid="pillar-soul-next-btn"
                      className="flex items-center gap-2 rounded-full font-bold text-white disabled:opacity-40"
                      style={{
                        padding: '10px 22px', fontSize: 14,
                        background: 'linear-gradient(135deg, #C44DFF, #FF6B9D)',
                        border: 'none', cursor: hasAnswer ? 'pointer' : 'default',
                      }}>
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      data-testid="pillar-soul-submit-btn"
                      className="flex items-center gap-2 rounded-full font-bold text-white disabled:opacity-60"
                      style={{
                        padding: '10px 22px', fontSize: 14,
                        background: 'linear-gradient(135deg, #C44DFF, #FF6B9D)',
                        border: 'none', cursor: 'pointer',
                      }}>
                      {submitting
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                        : <><Sparkles className="w-4 h-4" /> Update {petName}'s Soul</>
                      }
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PillarSoulModal;
