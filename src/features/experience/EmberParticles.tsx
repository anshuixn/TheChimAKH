import React, { useEffect, useRef } from 'react';
import styles from './EmberParticles.module.css';

export const EmberParticles: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let isMounted = true;

    // Handle high DPI displays
    const resizeCanvas = () => {
      if (!isMounted) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    interface EmberColor {
      solid: string;
      rgbaPrefix: string;
    }

    // Particle representation
    interface Particle {
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      opacity: number;
      color: EmberColor;
      wobble: number;
      wobbleSpeed: number;
    }

    const particles: Particle[] = [];
    const colors: EmberColor[] = [
      { solid: 'rgb(212, 98, 42)', rgbaPrefix: 'rgba(212, 98, 42,' },
      { solid: 'rgb(181, 83, 60)', rgbaPrefix: 'rgba(181, 83, 60,' },
      { solid: 'rgb(245, 158, 11)', rgbaPrefix: 'rgba(245, 158, 11,' },
      { solid: 'rgb(239, 68, 68)', rgbaPrefix: 'rgba(239, 68, 68,' },
    ];

    const createParticle = (isInitial = false): Particle => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width || window.innerWidth;
      const h = rect.height || window.innerHeight;

      return {
        x: Math.random() * w,
        y: isInitial ? Math.random() * h : h + 10,
        size: Math.random() * 2.5 + 0.8, // small circular orbs (0.8px to 3.3px)
        speedY: -(Math.random() * 0.8 + 0.4), // float upwards gently
        speedX: (Math.random() - 0.5) * 0.3, // slight drift
        opacity: Math.random() * 0.4 + 0.2, // subtle opacity
        color: colors[Math.floor(Math.random() * colors.length)],
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.015 + 0.005,
      };
    };

    // Populate initial particles across the viewport height
    const maxParticles = 35;
    for (let i = 0; i < maxParticles; i++) {
      particles.push(createParticle(true));
    }

    const draw = () => {
      if (!isMounted) return;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width || window.innerWidth;
      const h = rect.height || window.innerHeight;

      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.y += p.speedY;
        p.wobble += p.wobbleSpeed;
        p.x += p.speedX + Math.sin(p.wobble) * 0.2; // subtle sway

        // Calculate opacity fade based on height (fades out near top of screen)
        const verticalFade = p.y < 120 ? Math.max(0, p.y / 120) : 1;
        const currentOpacity = Math.max(0, p.opacity * verticalFade);

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        
        ctx.shadowBlur = p.size * 1.5;
        ctx.shadowColor = p.color.solid;
        ctx.fillStyle = `${p.color.rgbaPrefix}${currentOpacity.toFixed(3)})`;
        ctx.fill();

        // Recycle particle if it goes off screen (top or sides)
        if (p.y < -10 || p.x < -10 || p.x > w + 10) {
          particles[i] = createParticle(false);
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      isMounted = false;
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.particleCanvas} aria-hidden="true" />;
};

export default EmberParticles;
