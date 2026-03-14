/**
 * useResizeMobile — Platform-standard mobile detection hook.
 *
 * One hook. One truth. Entire platform.
 *
 * Uses ResizeObserver on document.body with a 150ms debounce.
 * Handles device rotation, browser resize, Chrome DevTools resize.
 * SSR-safe (window/document guards). Full cleanup on unmount.
 *
 * Usage:
 *   const isMobile = useResizeMobile();           // default breakpoint: 641
 *   const isTablet = useResizeMobile(1024);        // custom breakpoint
 *
 * @param {number} breakpoint - width in px below which isMobile=true (default: 641)
 * @returns {boolean} isMobile
 */

import { useState, useEffect } from 'react';

// Simple debounce helper — no external dependencies needed
function debounce(fn, wait) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}

export const useResizeMobile = (breakpoint = 641) => {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const observer = new ResizeObserver(
      debounce(entries => {
        setIsMobile(entries[0].contentRect.width < breakpoint);
      }, 150)
    );
    observer.observe(document.body);
    return () => observer.disconnect();
  }, [breakpoint]);

  return isMobile;
};

// Backward-compat alias — use useResizeMobile going forward
export const useViewportMobile = useResizeMobile;
