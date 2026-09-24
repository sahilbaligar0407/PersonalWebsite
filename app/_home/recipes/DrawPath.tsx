"use client";
/**
 * <DrawPath>: draws SVG strokes (signature, scribble, underline, circle mark, diagrams) on enter or
 * scrubbed with scroll, using DrawSVGPlugin. Wrap text to mark it. READ-ONLY runtime file.
 */
import { useRef, type CSSProperties, type ReactNode } from "react";
import { gsap } from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { useSceneMotion } from "../runtime/motion";
import { colorVar, cx, type ColorValue } from "./shared";
import { SIGNATURE } from "../signature";

gsap.registerPlugin(DrawSVGPlugin);

export interface PathPreset {
  viewBox: string;
  paths: readonly string[];
}

export const DRAW_PRESETS = {
  /** Sahil's own handwritten signature (traced from his drawing). */
  signature: SIGNATURE,
  /** Hand-drawn double swoosh underline. */
  underline: {
    viewBox: "0 0 400 48",
    paths: ["M6 30 C 90 14, 230 8, 394 20", "M52 42 C 150 30, 262 28, 350 36"],
  },
  /** Overshooting hand-drawn ellipse to circle a word. */
  circle: {
    viewBox: "0 0 320 150",
    paths: ["M176 14 C 84 6, 12 36, 14 78 C 16 124, 118 142, 196 134 C 272 126, 312 98, 306 62 C 300 24, 226 6, 142 14 C 110 18, 86 26, 70 36"],
  },
} as const satisfies Record<string, PathPreset>;

export type DrawPresetName = keyof typeof DRAW_PRESETS;

export interface DrawPathProps {
  /** Built-in path set… */
  preset?: DrawPresetName;
  /** …or your own path data (all share `viewBox`). */
  paths?: readonly string[];
  viewBox?: string;
  /** "enter" = draws once when it enters (default); "scrub" = drawn amount follows scroll. */
  trigger?: "enter" | "scrub";
  color?: ColorValue;
  /** Stroke width in viewBox units. Default 6. */
  strokeWidth?: number;
  /** Seconds for "enter" (default tempo.duration * 1.2). */
  duration?: number;
  /** Delay seconds for "enter". */
  delay?: number;
  /** When children are given, the stroke is placed around/under them. Default "under". */
  placement?: "under" | "around" | "over";
  /** Text to mark. Without children the SVG renders standalone (size it via className). */
  children?: ReactNode;
  /** Accessible label for a standalone meaningful drawing; decorative (aria-hidden) when omitted. */
  label?: string;
  className?: string;
  style?: CSSProperties;
}

export function DrawPath({
  preset = "signature",
  paths,
  viewBox,
  trigger = "enter",
  color = "accent",
  strokeWidth = 6,
  duration,
  delay = 0,
  placement = "under",
  children,
  label,
  className,
  style,
}: DrawPathProps) {
  const root = useRef<HTMLSpanElement>(null);
  const data = paths ? { viewBox: viewBox ?? "0 0 100 100", paths } : DRAW_PRESETS[preset];

  useSceneMotion(
    root,
    ({ gsap, q, scope, reducedMotion, tempo }) => {
      const strokes = q(".rx-draw__stroke") as SVGPathElement[];
      if (!strokes.length || reducedMotion) return;
      // Like a pen: strokes are written one after another, each taking time in proportion to its length,
      // so a long loop doesn't flash by as fast as a tiny tick.
      const lengths = strokes.map((s) => Math.max(1, s.getTotalLength?.() ?? 1));
      const sum = lengths.reduce((a, b) => a + b, 0);
      gsap.set(strokes, { drawSVG: "0%" });
      if (trigger === "scrub") {
        const tl = gsap.timeline({ scrollTrigger: { trigger: scope, start: "clamp(top 90%)", end: "clamp(bottom 50%)", scrub: tempo.scrub } });
        strokes.forEach((s, i) => tl.to(s, { drawSVG: "100%", ease: "none", duration: lengths[i]! / sum }));
        return;
      }
      const total = duration ?? tempo.duration * 1.2;
      const tl = gsap.timeline({ delay, scrollTrigger: { trigger: scope, start: "top 85%", once: true } });
      strokes.forEach((s, i) => tl.to(s, { drawSVG: "100%", ease: "sine.inOut", duration: Math.max(0.06, (total * lengths[i]!) / sum) }, i === 0 ? 0 : "-=0.02"));
    },
    [trigger, duration, delay, data.paths.join("|")],
  );

  const svg = (
    <svg
      className={cx("rx-draw__svg", children ? `rx-draw__svg--${placement}` : null)}
      viewBox={data.viewBox}
      preserveAspectRatio={children && placement !== "under" ? "none" : undefined}
      fill="none"
      {...(label && !children ? { role: "img", "aria-label": label } : { "aria-hidden": true, focusable: false })}
    >
      {data.paths.map((d, i) => (
        <path key={i} className="rx-draw__stroke" d={d} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  );

  return (
    <span ref={root} className={cx("rx-draw", children ? "rx-draw--mark" : null, className)} style={{ "--rx-draw-color": colorVar(color), ...style } as CSSProperties}>
      {children}
      {svg}
    </span>
  );
}
