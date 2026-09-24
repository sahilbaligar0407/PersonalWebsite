"use client";
/**
 * <ColorWorld tone>: while this block crosses the viewport centre, the whole page's background and
 * ink colours tween to its tone (CSS variables on <html>). Restored when the last world unmounts.
 * READ-ONLY runtime file.
 */
import { useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap } from "gsap";
import { useSceneMotion } from "../runtime/motion";
import { getHomeRoot } from "../runtime/media";
import { PALETTE, cx, type PaletteRole } from "./shared";

export type ToneColor = PaletteRole | `#${string}`;

export interface ColorTone {
  background: ToneColor;
  ink: ToneColor;
  /** Optional overrides; default: muted = ink at 65% over background, accent unchanged. */
  muted?: ToneColor;
  accent?: ToneColor;
  surface?: ToneColor;
}

/** Common pairings from the palette. */
export const COLOR_TONES = {
  base: { background: "background", ink: "ink" },
  surface: { background: "surface", ink: "ink" },
  inverse: { background: "ink", ink: "background", surface: "muted" },
  accent: { background: "accent", ink: "background" },
  "accent-2": { background: "accent-2", ink: "background" },
} as const satisfies Record<string, ColorTone>;

export type ColorToneName = keyof typeof COLOR_TONES;

const VARS = ["--color-background", "--color-surface", "--color-ink", "--color-muted", "--color-accent", "--color-ink-rgb", "--color-accent-rgb"] as const;

function hex(value: ToneColor): string {
  return value.startsWith("#") ? value : PALETTE[value as PaletteRole];
}

function rgbTriplet(hexValue: string): [number, number, number] {
  let h = hexValue.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = Number.parseInt(h.slice(0, 6), 16);
  return Number.isNaN(n) ? [0, 0, 0] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const toHex = (rgb: [number, number, number]) => `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;
const mix = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

function toneVars(tone: ColorTone): Record<string, string> {
  const bg = rgbTriplet(hex(tone.background));
  const ink = rgbTriplet(hex(tone.ink));
  const accent = rgbTriplet(hex(tone.accent ?? "accent"));
  return {
    "--color-background": toHex(bg),
    "--color-surface": tone.surface ? hex(tone.surface) : toHex(mix(bg, ink, 0.06)),
    "--color-ink": toHex(ink),
    "--color-muted": tone.muted ? hex(tone.muted) : toHex(mix(bg, ink, 0.65)),
    "--color-accent": toHex(accent),
    "--color-ink-rgb": ink.join(" "),
    "--color-accent-rgb": accent.join(" "),
  };
}

// ------------------------------------------------------------------ page-level manager (one per document)

let mounted = 0;
let saved: Record<string, string> | null = null;
let active: gsap.core.Tween | null = null;
let currentKey = "";

function applyTone(tone: ColorTone, duration: number, ease: string) {
  const vars = toneVars(tone);
  const key = JSON.stringify(vars);
  if (key === currentKey) return;
  currentKey = key;
  active?.kill();
  const root = getHomeRoot();
  if (!root) return;
  if (duration <= 0) {
    for (const [name, value] of Object.entries(vars)) root.style.setProperty(name, value);
    active = null;
    return;
  }
  active = gsap.to(root, { ...vars, duration, ease, overwrite: "auto" });
}

function retain() {
  if (mounted++ === 0) {
    const style = getHomeRoot()?.style;
    if (!style) return;
    saved = Object.fromEntries(VARS.map((name) => [name, style.getPropertyValue(name)]));
  }
}

function release() {
  if (--mounted > 0 || !saved) return;
  active?.kill();
  active = null;
  currentKey = "";
  const style = getHomeRoot()?.style;
  if (!style) {
    saved = null;
    return;
  }
  for (const [name, value] of Object.entries(saved)) {
    if (value) style.setProperty(name, value);
    else style.removeProperty(name);
  }
  saved = null;
}

export interface ColorWorldOptions {
  /** Tween seconds; default tempo.duration * 0.6. Instant under reduced motion. */
  duration?: number;
  /** Viewport line that activates the world. Default "center". */
  line?: "center" | "top" | "bottom" | `${number}%`;
}

/** Hook form: attach a tone to any element (e.g. a SceneFrame ref). */
export function useColorWorld<T extends HTMLElement>(ref: RefObject<T | null>, tone: ColorTone | ColorToneName, options: ColorWorldOptions = {}): void {
  const resolved: ColorTone = typeof tone === "string" ? COLOR_TONES[tone] : tone;
  const toneKey = JSON.stringify(resolved);
  useSceneMotion(
    ref,
    ({ ScrollTrigger, scope, reducedMotion, tempo }) => {
      retain();
      const line = options.line ?? "center";
      const duration = reducedMotion ? 0 : (options.duration ?? tempo.duration * 0.6);
      const activate = () => applyTone(resolved, duration, tempo.easeInOut);
      const trigger = ScrollTrigger.create({
        trigger: scope,
        start: `top ${line}`,
        end: `bottom ${line}`,
        onEnter: activate,
        onEnterBack: activate,
      });
      if (trigger.isActive) applyTone(resolved, 0, tempo.easeInOut);
      return release;
    },
    [toneKey, options.duration, options.line],
  );
}

export interface ColorWorldProps extends ColorWorldOptions {
  tone: ColorTone | ColorToneName;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/** Wrapper form. Put it around a scene's content (or use `useColorWorld(sceneRef, tone)`). */
export function ColorWorld({ tone, children, className, style, duration, line }: ColorWorldProps) {
  const ref = useRef<HTMLDivElement>(null);
  useColorWorld(ref, tone, { duration, line });
  return (
    <div ref={ref} className={cx("rx-world", className)} style={style}>
      {children}
    </div>
  );
}
