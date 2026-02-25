/**
 * LivingSoulOrb - A LIVING, BREATHING Pet Soul™ Visualization
 * 
 * This is the heart of the Pet Soul™ experience - a visualization that feels ALIVE.
 * It breathes, pulses, grows, and celebrates milestones with the pet parent.
 * 
 * Features:
 * - Breathing/pulsing animation that feels organic
 * - Aurora-like aura effects
 * - Score-based color evolution (grows warmer as score increases)
 * - Growth celebration animations
 * - First reveal "WOW" moment
 * - Orbiting particles representing answered questions
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, Star, Zap } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

// Soul growth milestones - each one triggers a celebration
const SOUL_MILESTONES = [
  { threshold: 10, title: 'Soul Awakened', message: 'The journey begins...', icon: '✨', color: '#8B5CF6' },
  { threshold: 25, title: 'Soul Seeker', message: 'Discovering who they truly are', icon: '🔍', color: '#A855F7' },
  { threshold: 50, title: 'Soul Explorer', message: 'Halfway to understanding their heart', icon: '🧭', color: '#D946EF' },
  { threshold: 75, title: 'Soul Guardian', message: 'A bond that runs deep', icon: '🛡️', color: '#EC4899' },
  { threshold: 90, title: 'Soul Connected', message: 'Two hearts, one soul', icon: '💜', color: '#F472B6' },
  { threshold: 100, title: 'Soul Master', message: 'Complete understanding achieved', icon: '👑', color: '#FFD700' },
];

// Get the current milestone based on score
const getCurrentMilestone = (score) => {
  return SOUL_MILESTONES.filter(m => score >= m.threshold).pop() || SOUL_MILESTONES[0];
};

// Get the next milestone
const getNextMilestone = (score) => {
  return SOUL_MILESTONES.find(m => score < m.threshold) || null;
};

const LivingSoulOrb = ({
  score = 0,
  previousScore = null, // Used to detect growth
  petName = 'Your pet',
  petId,
  size = 'lg', // 'sm', 'md', 'lg', 'xl'
  showDetails = true,
  showCelebration = true,
  isFirstReveal = false, // Trigger special animation for first time view
  onMilestoneReached,
  className = '',
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [pulseIntensity, setPulseIntensity] = useState(1);
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationData, setCelebrationData] = useState(null);
  const [hasAnimatedIn, setHasAnimatedIn] = useState(false);
  const [showFirstReveal, setShowFirstReveal] = useState(isFirstReveal);
  const orbRef = useRef(null);
  const prevScoreRef = useRef(previousScore ?? score);

  // Size configurations
  const sizes = {
    sm: { container: 100, orbSize: '60px', fontSize: 'text-xl', particleCount: 3 },
    md: { container: 160, orbSize: '100px', fontSize: 'text-3xl', particleCount: 5 },
    lg: { container: 220, orbSize: '140px', fontSize: 'text-4xl', particleCount: 7 },
    xl: { container: 280, orbSize: '180px', fontSize: 'text-5xl', particleCount: 9 },
  };
  const config = sizes[size] || sizes.lg;

  // Get colors based on score
  const getScoreColors = useCallback((s) => {
    if (s >= 90) return { primary: '#FFD700', secondary: '#FFA500', aura: 'rgba(255, 215, 0, 0.3)' };
    if (s >= 75) return { primary: '#EC4899', secondary: '#F472B6', aura: 'rgba(236, 72, 153, 0.3)' };
    if (s >= 50) return { primary: '#D946EF', secondary: '#A855F7', aura: 'rgba(217, 70, 239, 0.3)' };
    if (s >= 25) return { primary: '#A855F7', secondary: '#8B5CF6', aura: 'rgba(168, 85, 247, 0.3)' };
    return { primary: '#8B5CF6', secondary: '#6366F1', aura: 'rgba(139, 92, 246, 0.3)' };
  }, []);

  const colors = getScoreColors(score);
  const milestone = getCurrentMilestone(score);
  const nextMilestone = getNextMilestone(score);

  // Breathing effect - makes the orb feel alive
  useEffect(() => {
    const breathe = setInterval(() => {
      setPulseIntensity(0.85 + Math.random() * 0.3);
    }, 2000 + Math.random() * 1000);
    return () => clearInterval(breathe);
  }, []);

  // Animate score count-up
  useEffect(() => {
    const duration = isFirstReveal ? 3000 : 1500;
    const startTime = performance.now();
    const startScore = 0;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      
      setAnimatedScore(startScore + (score - startScore) * eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setHasAnimatedIn(true);
      }
    };

    requestAnimationFrame(animate);
  }, [score, isFirstReveal]);

  // Trigger general growth celebration
  const triggerGrowthCelebration = useCallback((growth) => {
    toast.success(`✨ ${petName}'s soul grew!`, {
      description: `+${growth}% closer to understanding their heart`,
      duration: 3000,
    });
  }, [petName]);

  // Trigger milestone celebration
  const triggerCelebration = useCallback((milestone, growth) => {
    setCelebrating(true);
    setCelebrationData({
      type: 'milestone',
      milestone,
      growth,
    });

    // Fire confetti!
    if (orbRef.current) {
      const rect = orbRef.current.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { x, y },
        colors: [milestone.color, '#FFD700', '#FF69B4'],
      });
    }

    // Show toast
    toast.success(`${milestone.icon} ${milestone.title}!`, {
      description: `${petName}'s soul grew today! ${milestone.message}`,
      duration: 5000,
    });

    // Callback
    if (onMilestoneReached) {
      onMilestoneReached(milestone);
    }

    setTimeout(() => {
      setCelebrating(false);
      setCelebrationData(null);
    }, 4000);
  }, [petName, onMilestoneReached]);

  // First reveal - special magical moment
  const triggerFirstRevealCelebration = useCallback(() => {
    setCelebrating(true);
    setCelebrationData({
      type: 'firstReveal',
      milestone: getCurrentMilestone(score),
    });

    // Dramatic confetti burst
    if (orbRef.current) {
      const rect = orbRef.current.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;
      
      // Multiple bursts for drama
      confetti({ particleCount: 50, spread: 60, origin: { x, y: y - 0.1 }, colors: ['#8B5CF6', '#EC4899'] });
      setTimeout(() => {
        confetti({ particleCount: 30, spread: 100, origin: { x: x - 0.1, y }, colors: ['#A855F7', '#F472B6'] });
        confetti({ particleCount: 30, spread: 100, origin: { x: x + 0.1, y }, colors: ['#D946EF', '#FFD700'] });
      }, 300);
    }

    setShowFirstReveal(false);

    setTimeout(() => {
      setCelebrating(false);
      setCelebrationData(null);
    }, 5000);
  }, [score]);

  // Detect score growth and trigger celebration
  useEffect(() => {
    if (previousScore !== null && score > previousScore && showCelebration) {
      // Check if we crossed a milestone
      const prevMilestone = getCurrentMilestone(previousScore);
      const newMilestone = getCurrentMilestone(score);
      
      // Use setTimeout to avoid setState in effect body
      const timer = setTimeout(() => {
        if (newMilestone.threshold > prevMilestone.threshold) {
          // Milestone reached! Celebrate!
          triggerCelebration(newMilestone, score - previousScore);
        } else if (score - previousScore >= 5) {
          // General growth celebration
          triggerGrowthCelebration(score - previousScore);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
    prevScoreRef.current = score;
  }, [score, previousScore, showCelebration, triggerCelebration, triggerGrowthCelebration]);

  // First reveal celebration
  useEffect(() => {
    if (isFirstReveal && hasAnimatedIn) {
      setTimeout(() => {
        triggerFirstRevealCelebration();
      }, 500);
    }
  }, [isFirstReveal, hasAnimatedIn, triggerFirstRevealCelebration]);

  // Generate orbiting particles (representing answered questions)
  const particles = Array.from({ length: config.particleCount }, (_, i) => ({
    id: i,
    delay: i * 0.5,
    duration: 6 + (i % 3),
    angle: (i * 360) / config.particleCount,
  }));

  return (
    <div className={`relative flex flex-col items-center ${className}`} ref={orbRef}>
      {/* The Living Orb Container */}
      <div
        className="relative"
        style={{ width: config.container, height: config.container }}
      >
        {/* Aurora Outer Rings - The "Aura" */}
        <motion.div
          className="absolute inset-[-20%] rounded-full"
          style={{
            background: `conic-gradient(from 0deg, ${colors.primary}40, ${colors.secondary}40, ${colors.aura}, ${colors.primary}40)`,
            filter: 'blur(40px)',
          }}
          animate={{
            rotate: 360,
            scale: [1, 1.1 * pulseIntensity, 1],
          }}
          transition={{
            rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
            scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
          }}
        />

        {/* Secondary Aurora Ring */}
        <motion.div
          className="absolute inset-[-10%] rounded-full"
          style={{
            background: `conic-gradient(from 180deg, ${colors.secondary}50, ${colors.primary}50, transparent, ${colors.secondary}50)`,
            filter: 'blur(30px)',
          }}
          animate={{
            rotate: -360,
            scale: [1.1, 1, 1.1],
          }}
          transition={{
            rotate: { duration: 15, repeat: Infinity, ease: 'linear' },
            scale: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
          }}
        />

        {/* Breathing Glow Pulse */}
        <motion.div
          className="absolute inset-[5%] rounded-full"
          style={{
            background: `radial-gradient(circle, ${colors.primary}60 0%, ${colors.secondary}30 50%, transparent 70%)`,
            filter: 'blur(20px)',
          }}
          animate={{
            scale: [1, 1.2 * pulseIntensity, 1],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Core Orb with Glass Effect */}
        <motion.div
          className="absolute rounded-full overflow-hidden flex items-center justify-center"
          style={{
            width: config.orbSize,
            height: config.orbSize,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
            boxShadow: `
              0 0 60px ${colors.primary}80,
              0 0 100px ${colors.secondary}60,
              inset 0 0 60px rgba(255,255,255,0.2)
            `,
          }}
          animate={{
            scale: celebrating ? [1, 1.15, 1] : [1, 1.03 * pulseIntensity, 1],
          }}
          transition={{
            duration: celebrating ? 0.5 : 2,
            repeat: celebrating ? 3 : Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* Inner Light Refraction */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at 30% 30%, rgba(255,255,255,0.5) 0%, transparent 50%)',
            }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* Score Display */}
          <div className="relative z-10 text-center">
            <motion.span
              className={`${config.fontSize} font-black text-white drop-shadow-lg`}
              key={animatedScore}
            >
              {Math.round(animatedScore)}
            </motion.span>
            <span className="text-white/80 text-lg font-medium">%</span>
          </div>
        </motion.div>

        {/* Orbiting Particles */}
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-2 h-2 rounded-full bg-white/80"
            style={{
              top: '50%',
              left: '50%',
              boxShadow: '0 0 10px rgba(255,255,255,0.8)',
            }}
            animate={{
              x: [
                Math.cos((particle.angle * Math.PI) / 180) * (config.container / 2.5),
                Math.cos(((particle.angle + 180) * Math.PI) / 180) * (config.container / 2.5),
                Math.cos((particle.angle * Math.PI) / 180) * (config.container / 2.5),
              ],
              y: [
                Math.sin((particle.angle * Math.PI) / 180) * (config.container / 2.5),
                Math.sin(((particle.angle + 180) * Math.PI) / 180) * (config.container / 2.5),
                Math.sin((particle.angle * Math.PI) / 180) * (config.container / 2.5),
              ],
              opacity: [0.3, 0.9, 0.3],
              scale: [0.5, 1.2, 0.5],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* Milestone Badge */}
        <motion.div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-white text-xs font-bold shadow-lg"
          style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {milestone.icon} {milestone.title}
        </motion.div>
      </div>

      {/* Details Section */}
      {showDetails && (
        <motion.div
          className="mt-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <h3 className="text-xl font-bold text-white mb-1">
            {petName}&apos;s Soul
          </h3>
          <p className="text-white/70 text-sm italic">
            {milestone.message}
          </p>
          
          {/* Next milestone progress */}
          {nextMilestone && (
            <div className="mt-3 px-4">
              <div className="flex items-center justify-between text-xs text-white/60 mb-1">
                <span>Next: {nextMilestone.icon} {nextMilestone.title}</span>
                <span>{nextMilestone.threshold - score}% to go</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${colors.primary}, ${nextMilestone.color})` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${((score - milestone.threshold) / (nextMilestone.threshold - milestone.threshold)) * 100}%` }}
                  transition={{ duration: 1, delay: 1 }}
                />
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Celebration Overlay */}
      <AnimatePresence>
        {celebrating && celebrationData && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <div className="text-center">
              <motion.div
                className="text-6xl mb-2"
                animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: 3 }}
              >
                {celebrationData.milestone?.icon || '✨'}
              </motion.div>
              {celebrationData.type === 'firstReveal' && (
                <motion.p
                  className="text-white font-bold text-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Welcome to {petName}&apos;s Soul!
                </motion.p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LivingSoulOrb;
