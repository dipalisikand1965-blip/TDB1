import { useEffect } from 'react';

/**
 * Locks document body scroll when isLocked is true.
 * Restores on unmount. Use in any modal/overlay component.
 */
export function useScrollLock(isLocked) {
  useEffect(() => {
    if (isLocked) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isLocked]);
}
