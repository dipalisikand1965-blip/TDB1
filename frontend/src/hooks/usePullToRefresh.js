/**
 * usePullToRefresh - Custom hook for pull-to-refresh functionality
 * Works on mobile touch devices
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const usePullToRefresh = (onRefresh, options = {}) => {
  const {
    threshold = 80,
    maxPull = 120,
    refreshTimeout = 2000,
    enabled = true
  } = options;

  const [isPulling, setIsPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = useCallback((e) => {
    if (!enabled || window.scrollY > 0) return;
    startY.current = e.touches[0].clientY;
    setIsPulling(true);
  }, [enabled]);

  const handleTouchMove = useCallback((e) => {
    if (!isPulling || window.scrollY > 0) return;
    
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    
    if (diff > 0) {
      const progress = Math.min(diff, maxPull);
      setPullProgress(progress);
      
      // Prevent default scroll when pulling
      if (diff > 10) {
        e.preventDefault();
      }
    }
  }, [isPulling, maxPull]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    
    if (pullProgress >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh error:', error);
      }
      
      // Minimum refresh time for UX
      setTimeout(() => {
        setIsRefreshing(false);
        setPullProgress(0);
        setIsPulling(false);
      }, refreshTimeout);
    } else {
      setPullProgress(0);
      setIsPulling(false);
    }
  }, [isPulling, pullProgress, threshold, isRefreshing, onRefresh, refreshTimeout]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    isPulling,
    pullProgress,
    isRefreshing,
    progressPercent: Math.min((pullProgress / threshold) * 100, 100),
    shouldTrigger: pullProgress >= threshold
  };
};

export default usePullToRefresh;
