"use client";

import { useEffect, useRef, useCallback } from "react";
import { useIsMobile, usePrefersReducedMotion } from "@/hooks/use-media-query";

interface Particle {
  x: number;
  y: number;
  speed: number;
  opacity: number;
  fontSize: number;
  text: string;
}

const CODE_FRAGMENTS = [
  '{"key": "value"}',
  "SGVsbG8gV29ybGQ=",
  "/^[a-z]+$/gi",
  "2026-02-08T00:00:00Z",
  "#6366F1",
  "SELECT * FROM",
  "import { cn }",
  "curl -X POST",
  "sha256:e3b0c4",
  "rgb(99,102,241)",
  "0x1A2B3C",
  "(() => {})",
  "pipe(a, b, c)",
  "npm run build",
  "utf-8",
  "Bearer eyJhb...",
  "Content-Type:",
  "localhost:3000",
  "async/await",
  "export default",
];

function createParticle(canvasWidth: number, canvasHeight: number): Particle {
  return {
    x: Math.random() * canvasWidth,
    y: Math.random() * canvasHeight * -1,
    speed: 0.3 + Math.random() * 0.9,
    opacity: 0.12 + Math.random() * 0.18,
    fontSize: 10 + Math.random() * 6,
    text:
      CODE_FRAGMENTS[Math.floor(Math.random() * CODE_FRAGMENTS.length)] ??
      CODE_FRAGMENTS[0]!,
  };
}

interface CodeRainProps {
  className?: string;
}

export function CodeRain({ className }: CodeRainProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const isMobile = useIsMobile();
  const prefersReducedMotion = usePrefersReducedMotion();

  const particleCount = isMobile ? 18 : 35;

  const initParticles = useCallback(
    (width: number, height: number) => {
      particlesRef.current = Array.from({ length: particleCount }, () => {
        const p = createParticle(width, height);
        p.y = Math.random() * height;
        return p;
      });
    },
    [particleCount]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        canvas.width = width;
        canvas.height = height;
        initParticles(width, height);
      }
    });

    resizeObserver.observe(canvas.parentElement || canvas);

    // Brand indigo color for particles
    const color = "99, 102, 241";

    // Detect dark mode from next-themes class on <html>
    const isDark = (): boolean =>
      document.documentElement.classList.contains("dark");

    if (prefersReducedMotion) {
      const draw = (): void => {
        const { width, height } = canvas;
        const dark = isDark();
        canvas.style.mixBlendMode = dark ? "screen" : "normal";
        ctx.clearRect(0, 0, width, height);
        const opacityScale = dark ? 1.8 : 1;
        for (const p of particlesRef.current) {
          ctx.font = `${p.fontSize}px monospace`;
          ctx.fillStyle = `rgba(${color}, ${p.opacity * opacityScale})`;
          ctx.fillText(p.text, p.x, p.y);
        }
      };
      requestAnimationFrame(() => requestAnimationFrame(draw));
      return () => resizeObserver.disconnect();
    }

    const animate = (): void => {
      const { width, height } = canvas;
      const dark = isDark();
      canvas.style.mixBlendMode = dark ? "screen" : "normal";
      const opacityScale = dark ? 1.8 : 1;

      // Fully clear each frame — no dark trail overlay
      ctx.clearRect(0, 0, width, height);

      for (const p of particlesRef.current) {
        ctx.font = `${p.fontSize}px monospace`;
        ctx.fillStyle = `rgba(${color}, ${p.opacity * opacityScale})`;
        ctx.fillText(p.text, p.x, p.y);

        p.y += p.speed;

        if (p.y > height + 20) {
          p.y = -20;
          p.x = Math.random() * width;
          p.text =
            CODE_FRAGMENTS[Math.floor(Math.random() * CODE_FRAGMENTS.length)] ??
            CODE_FRAGMENTS[0]!;
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      resizeObserver.disconnect();
    };
  }, [prefersReducedMotion, initParticles]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
