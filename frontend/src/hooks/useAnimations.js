// Advanced Animation Utilities and Custom Hooks
import { useEffect, useRef, useState } from 'react';

// Intersection Observer Hook for scroll animations
export const useInView = (options = {}) => {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsInView(entry.isIntersecting);
    }, {
      threshold: 0.1,
      ...options
    });

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [options]);

  return [ref, isInView];
};

// Stagger children animation
export const useStaggerAnimation = (itemCount, delay = 100) => {
  return Array.from({ length: itemCount }, (_, i) => ({
    animationDelay: `${i * delay}ms`
  }));
};

// Parallax scroll effect
export const useParallax = (speed = 0.5) => {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setOffset(window.pageYOffset * speed);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return offset;
};

// Number counter animation
export const useCountUp = (end, duration = 2000, startWhen = true) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!startWhen) return;

    let startTime;
    let animationFrame;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = (currentTime - startTime) / duration;

      if (progress < 1) {
        setCount(Math.floor(end * progress));
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, startWhen]);

  return count;
};

export default {
  useInView,
  useStaggerAnimation,
  useParallax,
  useCountUp
};
