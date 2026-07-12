import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function useScrollReveal(dependency?: unknown) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Text reveals (.scroll-reveal)
    // Feature detect scroll-driven animations; if supported natively in CSS, let CSS handle it.
    const hasNativeScrollAnim = 
      typeof CSS !== 'undefined' &&
      typeof CSS.supports === 'function' &&
      CSS.supports('(animation-timeline: view()) and (animation-range: entry)');

    let observer: IntersectionObserver | null = null;
    const textElements = document.querySelectorAll('.scroll-reveal');

    if (!hasNativeScrollAnim && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(
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
      
      const activeObserver = observer;
      textElements.forEach((el) => { activeObserver.observe(el); });
    }

    // 2. Image reveals (.scroll-reveal-img)
    // Always use GSAP ScrollTrigger to tie sliding position to the scrollbar for continuous scrubbing
    const ctx = gsap.context(() => {
      const imgElements = document.querySelectorAll('.scroll-reveal-img');
      imgElements.forEach((img) => {
        const isMobile = window.innerWidth <= 768;
        
        gsap.fromTo(
          img,
          {
            x: isMobile ? 50 : 90,
            opacity: 0.1,
            filter: 'blur(4px)',
          },
          {
            x: 0,
            opacity: 1,
            filter: 'blur(0px)',
            ease: 'none',
            scrollTrigger: {
              trigger: img,
              start: 'top 95%', // Starts sliding as the top edge of the image enters the bottom of the viewport
              end: isMobile ? 'top 55%' : 'top 45%', // Finishes when it reaches mid-screen
              scrub: 1.2, // Premium lag scrub
            },
          }
        );
      });
    });

    return () => {
      if (observer) {
        textElements.forEach((el) => { observer.unobserve(el); });
        observer.disconnect();
      }
      ctx.revert();
    };
  }, [dependency]);
}
export default useScrollReveal;
