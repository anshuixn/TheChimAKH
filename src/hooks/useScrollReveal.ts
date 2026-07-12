import { useEffect } from 'react';

export function useScrollReveal(dependency?: unknown) {
  useEffect(() => {
    // Feature detect scroll-driven animations; if supported natively in CSS, let CSS handle it.
    if (typeof window !== 'undefined' && CSS.supports('(animation-timeline: view()) and (animation-range: entry)')) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-visible');
          } else {
            entry.target.classList.remove('reveal-visible');
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    const elements = document.querySelectorAll('.scroll-reveal');
    elements.forEach((el) => { observer.observe(el); });

    return () => {
      elements.forEach((el) => { observer.unobserve(el); });
    };
  }, [dependency]);
}
