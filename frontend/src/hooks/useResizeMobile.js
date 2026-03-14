/**
 * useResizeMobile — ResizeObserver-based mobile detection with 150ms debounce.
 *
 * Two variants:
 *  - useResizeMobile(breakpoint)  → callback ref for modal containers
 *  - useViewportMobile(breakpoint) → observes document.documentElement (for persistent panels)
 *
 * Both:
 *  - Debounce at 150ms (never stale after device rotation / Chrome DevTools resize)
 *  - Full cleanup in every useEffect (no memory leaks, no zombie setState)
 *  - SSR-safe (window/document guards)
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useResizeMobile
 *
 * Returns [containerRef, isMobile].
 * Attach containerRef to the modal container element.
 * ResizeObserver fires whenever that element resizes (rotation, DevTools resize).
 * Cleanup runs on unmount AND whenever the observed element changes.
 *
 * @param {number} breakpoint - px threshold below which isMobile=true (default: 640)
 */
export function useResizeMobile(breakpoint = 640) {
  const observerRef = useRef(null);
  const debounceRef = useRef(null);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );

  // Callback ref — called with el on mount, null on unmount
  const containerRef = useCallback(
    (el) => {
      // Tear down previous observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      clearTimeout(debounceRef.current);

      if (!el) return;

      observerRef.current = new ResizeObserver((entries) => {
        const width = entries[0]?.contentRect?.width ?? window.innerWidth;
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(
          () => setIsMobile(width < breakpoint),
          150
        );
      });
      observerRef.current.observe(el);
    },
    [breakpoint]
  );

  // Final safety cleanup on component unmount
  useEffect(
    () => () => {
      if (observerRef.current) observerRef.current.disconnect();
      clearTimeout(debounceRef.current);
    },
    []
  );

  return [containerRef, isMobile];
}

/**
 * useViewportMobile
 *
 * Observes document.documentElement so it tracks the full viewport width.
 * Use this for persistent panels (Mira widget) where the panel itself
 * is narrower than the viewport on desktop.
 *
 * @param {number} breakpoint - px threshold below which isMobile=true (default: 640)
 */
export function useViewportMobile(breakpoint = 640) {
  const observerRef = useRef(null);
  const debounceRef = useRef(null);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    observerRef.current = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect?.width ?? window.innerWidth;
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(
        () => setIsMobile(width < breakpoint),
        150
      );
    });
    observerRef.current.observe(document.documentElement);

    return () => {
      observerRef.current?.disconnect();
      clearTimeout(debounceRef.current);
    };
  }, [breakpoint]);

  return isMobile;
}
