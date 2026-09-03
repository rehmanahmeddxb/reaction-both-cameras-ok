/**
 * src/utils/confetti.ts
 *
 * Tiny replacement for the `canvas-confetti` npm package. The app fires exactly one
 * celebratory burst after a take is downloaded, so the ~30 options that package supports
 * are not worth an install: same call signature — confetti({ particleCount, spread, origin, colors, zIndex }) —
 * and it also returns a Promise so `await confetti()` keeps working.
 *
 * Want the real thing back?  npm i canvas-confetti  and import from 'canvas-confetti'.
 */

export interface ConfettiOptions {
  particleCount?: number;
  spread?: number;
  startVelocity?: number;
  origin?: { x?: number; y?: number };
  colors?: string[];
  ticks?: number;
  zIndex?: number;
  gravity?: number;
  scalar?: number;
  disableForReducedMotion?: boolean;
}

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rot: number;
  vrot: number;
  life: number;
  ttl: number;
};

const DEFAULT_COLORS = ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcba42'];

let running = 0;

export function confetti(options: ConfettiOptions = {}): Promise<void> {
  const {
    particleCount = 50,
    spread = 45,
    startVelocity = 35,
    origin = { x: 0.5, y: 0.5 },
    colors = DEFAULT_COLORS,
    ticks = 200,
    zIndex = 100,
    gravity = 1.05,
    scalar = 1.1,
    disableForReducedMotion = false,
  } = options;

  return new Promise((resolve) => {
    if (
      typeof window === 'undefined' ||
      (disableForReducedMotion && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
    ) {
      resolve();
      return;
    }

    const canvas = document.createElement('canvas');
    Object.assign(canvas.style, {
      position: 'fixed',
      inset: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: String(zIndex),
    } as CSSStyleDeclaration);
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      canvas.remove();
      resolve();
      return;
    }
    const resize = () => {
      canvas.width = Math.floor(canvas.clientWidth * dpr);
      canvas.height = Math.floor(canvas.clientHeight * dpr);
    };
    resize();

    const w = canvas.width;
    const h = canvas.height;
    const ox = (origin.x ?? 0.5) * w;
    const oy = (origin.y ?? 0.5) * h;
    const angleRad = (spread / 2) * (Math.PI / 180);

    const parts: Particle[] = Array.from({ length: particleCount }, () => {
      // Burst upward-ish, matching canvas-confetti's default 90° angle.
      const angle = Math.PI * 1.5 + (Math.random() - 0.5) * 2 * angleRad;
      const v = startVelocity * (0.7 + Math.random() * 0.6) * dpr;
      return {
        x: ox,
        y: oy,
        vx: Math.cos(angle) * v,
        vy: Math.sin(angle) * v,
        size: (5 + Math.random() * 4) * scalar * dpr,
        color: colors[Math.floor(Math.random() * colors.length)] ?? '#ffffff',
        rot: Math.random() * Math.PI,
        vrot: (Math.random() - 0.5) * 0.35,
        life: 0,
        ttl: ticks * (0.6 + Math.random() * 0.6),
      };
    });

    running += 1;
    const step = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = 0;
      for (const p of parts) {
        p.life += 1;
        if (p.life > p.ttl || p.y > canvas.height + 40 * dpr) continue;
        alive += 1;
        p.vy += gravity * 0.6 * dpr;
        p.vx *= 0.99;
        p.vy *= 0.995;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;
        const fade = 1 - p.life / p.ttl;
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, fade));
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size / 1.6);
        ctx.restore();
      }
      if (alive > 0) {
        requestAnimationFrame(step);
        return;
      }
      canvas.remove();
      running = Math.max(0, running - 1);
      window.removeEventListener('resize', resize);
      resolve();
    };
    window.addEventListener('resize', resize);
    requestAnimationFrame(step);
  });
}

export default confetti;
