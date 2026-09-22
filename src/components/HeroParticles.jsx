import { useRef, useEffect } from "react";

/**
 * HeroParticles — ambient "constellation" background: drifting dots connected by faint
 * lines, gently reactive to the cursor. Pure canvas, cheap, reduced-motion aware.
 * Sits as an absolute layer inside the hero section (fills its positioned parent).
 */
export default function HeroParticles({ className = "" }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = 0,
      H = 0,
      dpr = 1,
      raf = 0;
    let pts = [];
    const mouse = { x: -9999, y: -9999 };

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      if (!W || !H) return;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(90, Math.round((W * H) / 15000));
      pts = Array.from({ length: count }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.32,
        vy: (Math.random() - 0.5) * 0.32,
        r: 1 + Math.random() * 1.7,
        gold: Math.random() < 0.22,
      }));
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const host = canvas.parentElement;
    const onMove = (e) => {
      const b = canvas.getBoundingClientRect();
      mouse.x = e.clientX - b.left;
      mouse.y = e.clientY - b.top;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };
    host && host.addEventListener("mousemove", onMove);
    host && host.addEventListener("mouseleave", onLeave);

    const LINK = 122;
    const LINK2 = LINK * LINK;
    function draw() {
      raf = requestAnimationFrame(draw);
      if (!W || !H) return;
      ctx.clearRect(0, 0, W, H);

      for (const p of pts) {
        if (!reduce) {
          p.x += p.vx;
          p.y += p.vy;
        }
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        const dx = mouse.x - p.x,
          dy = mouse.y - p.y;
        if (dx * dx + dy * dy < 150 * 150) {
          p.x += dx * 0.0022;
          p.y += dy * 0.0022;
        }
      }

      // connecting lines
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i],
            b = pts[j];
          const dx = a.x - b.x,
            dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK2) {
            const d = Math.sqrt(d2);
            ctx.strokeStyle = "rgba(45,214,208," + (1 - d / LINK) * 0.16 + ")";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // dots
      for (const p of pts) {
        ctx.fillStyle = p.gold ? "rgba(201,162,75,0.9)" : "rgba(120,240,235,0.85)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    /* The loop is the hero's ambient backdrop, but rAF keeps firing long after
       the hero has scrolled away — every frame it walks ~4,000 point pairs for
       a canvas nobody can see, and that cost lands on the scroll of every
       section below. Run it only while the canvas is actually on screen and
       the tab is in front. Purely a gate: what draws is unchanged. */
    let onScreen = false;
    const start = () => {
      if (raf || !onScreen || document.hidden) return;
      raf = requestAnimationFrame(draw);
    };
    const stop = () => {
      if (!raf) return;
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const io = new IntersectionObserver(
      ([e]) => {
        onScreen = e.isIntersecting;
        onScreen ? start() : stop();
      },
      { rootMargin: "150px" }
    );
    io.observe(canvas);

    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      host && host.removeEventListener("mousemove", onMove);
      host && host.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
