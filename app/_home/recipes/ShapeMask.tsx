"use client";
/**
 * <ShapeMask slot shapes>: media masked by circle / pill / triangle / arch / diamond / rect; the mask
 * morphs between the shapes (and grows) as you scroll. All shapes are sampled to polygons with the
 * same vertex count so clip-path interpolates smoothly. READ-ONLY runtime file.
 */
import { useMemo, useRef, type CSSProperties, type ReactNode } from "react";
import { Media, type MediaSource } from "./Media";
import { useSceneMotion } from "../runtime/motion";
import { cx } from "./shared";

export type MaskShape = "circle" | "pill" | "triangle" | "arch" | "diamond" | "rect";

export interface ShapeMaskProps {
  media: MediaSource;
  /** Morph sequence, e.g. ["circle", "arch", "rect"]. The last shape is the static/reduced-motion state. */
  shapes: readonly MaskShape[];
  /** Mask scale at the first shape (grows to `endScale`). Default 0.62. */
  startScale?: number;
  endScale?: number;
  /** CSS aspect-ratio of the element (used to keep circles round). Default "4 / 5". */
  ratio?: string;
  /** Inner media counter-scale at the start (settles to 1). Default 1.25. */
  counterScale?: number;
  /** Scroll range (ScrollTrigger syntax). Defaults "clamp(top 85%)" -> "clamp(bottom 25%)". */
  start?: string;
  end?: string;
  /** Overlay content above the media (e.g. a label). */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

const POINTS = 64;

function parseRatio(ratio: string): number {
  const [w, h] = ratio.split("/").map((n) => Number.parseFloat(n));
  return w && h ? w / h : 0.8;
}

/** Inside test in a box of width `aspect` x height 1, centred at (0,0), scaled by `s`. */
function insideFn(shape: MaskShape, aspect: number, s: number): (x: number, y: number) => boolean {
  const hw = (aspect / 2) * s;
  const hh = 0.5 * s;
  switch (shape) {
    case "circle": {
      const r = Math.min(hw, hh);
      return (x, y) => x * x + y * y <= r * r;
    }
    case "pill": {
      // Vertical stadium filling the box.
      const r = Math.min(hw, hh);
      const straight = Math.max(0, hh - r);
      return (x, y) => {
        const dy = Math.max(0, Math.abs(y) - straight);
        return Math.abs(x) <= r && x * x + dy * dy <= r * r;
      };
    }
    case "arch": {
      const r = hw;
      const top = -hh + r; // centre of the semicircle
      return (x, y) => Math.abs(x) <= hw && y <= hh && (y >= top || x * x + (y - top) * (y - top) <= r * r);
    }
    case "triangle":
      return (x, y) => y <= hh && y >= -hh && Math.abs(x) <= (hw * (y + hh)) / (2 * hh);
    case "diamond":
      return (x, y) => Math.abs(x) / hw + Math.abs(y) / hh <= 1;
    default:
      return (x, y) => Math.abs(x) <= hw && Math.abs(y) <= hh;
  }
}

/** Polygon vertices (percent x/y pairs, flat) for a shape: POINTS rays from the centre, boundary by bisection. */
export function shapePoints(shape: MaskShape, aspect: number, scale = 1): number[] {
  const inside = insideFn(shape, aspect, scale);
  const maxR = Math.hypot(aspect, 1);
  const pts: number[] = [];
  for (let i = 0; i < POINTS; i++) {
    const a = -Math.PI / 2 + (i / POINTS) * Math.PI * 2;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    let lo = 0;
    let hi = maxR;
    for (let k = 0; k < 22; k++) {
      const mid = (lo + hi) / 2;
      if (inside(dx * mid, dy * mid)) lo = mid;
      else hi = mid;
    }
    pts.push(50 + ((dx * lo) / aspect) * 100, 50 + dy * lo * 100);
  }
  return pts;
}

/** Flat point list -> CSS `polygon()` string. */
export function toPolygon(points: readonly number[]): string {
  const parts: string[] = [];
  for (let i = 0; i < points.length; i += 2) parts.push(`${(points[i] ?? 0).toFixed(2)}% ${(points[i + 1] ?? 0).toFixed(2)}%`);
  return `polygon(${parts.join(", ")})`;
}

/** clip-path polygon() for a shape. */
export const shapePolygon = (shape: MaskShape, aspect: number, scale = 1) => toPolygon(shapePoints(shape, aspect, scale));

export function ShapeMask({
  media,
  shapes,
  startScale = 0.62,
  endScale = 1,
  ratio = "4 / 5",
  counterScale = 1.25,
  start = "clamp(top 85%)",
  end = "clamp(bottom 25%)",
  children,
  className,
  style,
}: ShapeMaskProps) {
  const root = useRef<HTMLDivElement>(null);
  const aspect = parseRatio(ratio);
  const key = shapes.join(",");
  const steps = useMemo(() => {
    const list: readonly MaskShape[] = shapes.length ? shapes : ["rect"];
    // A single shape still grows from startScale to endScale.
    const seq = list.length === 1 ? [list[0] ?? "rect", list[0] ?? "rect"] : list;
    return seq.map((shape, i) => shapePoints(shape, aspect, startScale + ((endScale - startScale) * i) / (seq.length - 1)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, aspect, startScale, endScale]);
  const finalPolygon = toPolygon(steps[steps.length - 1] ?? []);

  useSceneMotion(
    root,
    ({ gsap, q, scope, reducedMotion, isMobile, tempo }) => {
      const [frame] = q(".rx-mask__frame") as HTMLElement[];
      const [media] = q(".rx-mask__media");
      if (!frame || !media || reducedMotion || steps.length < 2) return;
      // GSAP's string interpolation is unreliable for long polygon() lists, so interpolate the vertices here.
      const segments = steps.length - 1;
      const ease = gsap.parseEase("power1.inOut");
      const buffer = new Array<number>(steps[0]?.length ?? 0).fill(0);
      const state = { t: 0 };
      const render = () => {
        const seg = Math.min(segments - 1, Math.floor(state.t));
        const local = ease(Math.min(1, Math.max(0, state.t - seg)));
        const from = steps[seg] ?? [];
        const to = steps[seg + 1] ?? from;
        for (let i = 0; i < buffer.length; i++) buffer[i] = (from[i] ?? 0) + ((to[i] ?? 0) - (from[i] ?? 0)) * local;
        frame.style.clipPath = toPolygon(buffer);
      };
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: scope,
          start: isMobile ? "clamp(top 90%)" : start,
          end: isMobile ? "clamp(center 40%)" : end,
          scrub: tempo.scrub,
        },
      });
      tl.fromTo(state, { t: 0 }, { t: segments, duration: segments, onUpdate: render, onStart: render }, 0);
      tl.fromTo(media, { scale: counterScale }, { scale: 1, duration: segments }, 0);
      render();
      return () => {
        frame.style.clipPath = finalPolygon;
      };
    },
    [key, aspect, startScale, endScale, counterScale, start, end],
  );

  return (
    <div ref={root} className={cx("rx-mask", className)} style={{ "--rx-mask-ratio": ratio, ...style } as CSSProperties}>
      <div className="rx-mask__frame" style={{ clipPath: finalPolygon }}>
        <Media media={media} className="rx-mask__media" />
      </div>
      {children ? <div className="rx-mask__overlay">{children}</div> : null}
    </div>
  );
}
