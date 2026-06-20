"use client";

import { useCallback, useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface HeroCanvasBgProps {
  className?: string;
}

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  /** Hue in the blue-purple spectrum (220-280) */
  hue: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const NODE_COUNT = 40;
const CONNECT_DISTANCE = 150;
const CURSOR_REPEL_RADIUS = 200;
const CURSOR_REPEL_FORCE = 0.6;
const MIN_RADIUS = 3;
const MAX_RADIUS = 8;
const MIN_SPEED = 0.2;
const MAX_SPEED = 0.5;
const LINE_COLOR = "rgba(255, 255, 255, 0.08)";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function createNode(width: number, height: number): Node {
  const angle = Math.random() * Math.PI * 2;
  const speed = randomBetween(MIN_SPEED, MAX_SPEED);
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: randomBetween(MIN_RADIUS, MAX_RADIUS),
    hue: randomBetween(220, 280),
  };
}

function createNodes(count: number, w: number, h: number): Node[] {
  return Array.from({ length: count }, () => createNode(w, h));
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function HeroCanvasBg({ className }: HeroCanvasBgProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number>(0);
  const prefersReducedMotion = useReducedMotion();

  /* ---- draw helpers ---- */

  const drawNode = useCallback(
    (ctx: CanvasRenderingContext2D, node: Node, dpr: number) => {
      const r = node.radius * dpr;
      const gradient = ctx.createRadialGradient(
        node.x * dpr,
        node.y * dpr,
        0,
        node.x * dpr,
        node.y * dpr,
        r * 2.5,
      );
      gradient.addColorStop(0, `hsla(${node.hue}, 72%, 68%, 0.55)`);
      gradient.addColorStop(1, `hsla(${node.hue}, 72%, 68%, 0)`);

      ctx.beginPath();
      ctx.arc(node.x * dpr, node.y * dpr, r * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    },
    [],
  );

  const drawConnections = useCallback(
    (ctx: CanvasRenderingContext2D, nodes: Node[], dpr: number) => {
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_DISTANCE) {
            const alpha = 0.08 * (1 - dist / CONNECT_DISTANCE);
            ctx.beginPath();
            ctx.moveTo(nodes[i].x * dpr, nodes[i].y * dpr);
            ctx.lineTo(nodes[j].x * dpr, nodes[j].y * dpr);
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = dpr;
            ctx.stroke();
          }
        }
      }
    },
    [],
  );

  /* ---- main effect ---- */

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const isMobile = window.innerWidth < 768;
    const frameDuration = isMobile ? 1000 / 30 : 0; // ~30fps cap on mobile

    let width = 0;
    let height = 0;
    let lastFrameTime = 0;

    function resize() {
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (!parent) return;

      width = parent.clientWidth;
      height = parent.clientHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      // Re-seed nodes if empty or canvas resized
      if (nodesRef.current.length === 0) {
        nodesRef.current = createNodes(NODE_COUNT, width, height);
      } else {
        // Clamp existing nodes inside the new bounds
        for (const node of nodesRef.current) {
          node.x = Math.min(node.x, width);
          node.y = Math.min(node.y, height);
        }
      }
    }

    resize();

    /* ---- reduced motion: single static draw ---- */
    if (prefersReducedMotion) {
      const nodes = nodesRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawConnections(ctx, nodes, dpr);
      for (const node of nodes) {
        drawNode(ctx, node, dpr);
      }
      // No animation loop — return only resize cleanup
      window.addEventListener("resize", resize);
      return () => {
        window.removeEventListener("resize", resize);
      };
    }

    /* ---- mouse tracking ---- */
    function handleMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
    function handleMouseLeave() {
      mouseRef.current = null;
    }

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    /* ---- animation loop ---- */
    function tick(timestamp: number) {
      if (!ctx || !canvas) return;

      // Throttle on mobile
      if (frameDuration > 0 && timestamp - lastFrameTime < frameDuration) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      lastFrameTime = timestamp;

      const nodes = nodesRef.current;
      const mouse = mouseRef.current;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update positions
      for (const node of nodes) {
        // Cursor repulsion
        if (mouse) {
          const dx = node.x - mouse.x;
          const dy = node.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CURSOR_REPEL_RADIUS && dist > 0) {
            const force =
              (1 - dist / CURSOR_REPEL_RADIUS) * CURSOR_REPEL_FORCE;
            node.vx += (dx / dist) * force;
            node.vy += (dy / dist) * force;
          }
        }

        // Dampen velocity back toward natural speed
        const currentSpeed = Math.sqrt(
          node.vx * node.vx + node.vy * node.vy,
        );
        const targetSpeed = randomBetween(MIN_SPEED, MAX_SPEED);
        if (currentSpeed > targetSpeed * 2) {
          node.vx *= 0.97;
          node.vy *= 0.97;
        }

        node.x += node.vx;
        node.y += node.vy;

        // Wrap around edges
        if (node.x < -10) node.x = width + 10;
        if (node.x > width + 10) node.x = -10;
        if (node.y < -10) node.y = height + 10;
        if (node.y > height + 10) node.y = -10;
      }

      // Draw connections first (behind nodes)
      drawConnections(ctx, nodes, dpr);

      // Draw nodes
      for (const node of nodes) {
        drawNode(ctx, node, dpr);
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);

    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [prefersReducedMotion, drawNode, drawConnections]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-auto absolute inset-0 ${className ?? ""}`}
      style={{ display: "block" }}
    />
  );
}
