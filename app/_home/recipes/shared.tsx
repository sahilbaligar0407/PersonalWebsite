/** Shared helpers for the scroll & typography recipes (ported from the Kai Arden runtime). */
import { Fragment, type ReactNode } from "react";
import { gsap } from "gsap";

export type FontRole = "display" | "body" | "utility";
export type PaletteRole = "background" | "surface" | "ink" | "muted" | "accent" | "accent-2";
export type ColorValue = PaletteRole | `#${string}`;

const PALETTE_ROLES: readonly string[] = ["background", "surface", "ink", "muted", "accent", "accent-2"];

/** Kai Arden base palette ("Salt & Kiln"). */
export const PALETTE: Record<PaletteRole, string> = {
  background: "#0e100c",
  surface: "#1a1d17",
  ink: "#f2efe6",
  muted: "#9a9d8f",
  accent: "#d2ff3c",
  "accent-2": "#b7c4a6",
};

export function colorVar(value: ColorValue): string {
  return PALETTE_ROLES.includes(value) ? `var(--color-${value})` : value;
}

export const fontVar = (role: FontRole) => `var(--font-${role})`;

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/** Deterministic PRNG (mulberry32). Same seed -> same layout on every load. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Recipes here take literal text; `k` is kept for API parity with the exemplar and ignored. */
export function resolveText(_k: string | undefined, text: string | undefined): string {
  return text ?? "";
}

export interface MarkupToken {
  text: string;
  accent: boolean;
}

export function parseAccentMarkup(source: string): MarkupToken[] {
  const tokens: MarkupToken[] = [];
  const re = /\*([^*]+)\*/g;
  let last = 0;
  for (let match = re.exec(source); match; match = re.exec(source)) {
    if (match.index > last) tokens.push({ text: source.slice(last, match.index), accent: false });
    tokens.push({ text: match[1] ?? "", accent: true });
    last = match.index + match[0].length;
  }
  if (last < source.length) tokens.push({ text: source.slice(last), accent: false });
  return tokens;
}

export const stripAccentMarkup = (source: string) => source.replace(/\*([^*]+)\*/g, "$1");

export function renderAccentMarkup(source: string, accentClass: string): ReactNode {
  return parseAccentMarkup(source).map((token, i) => {
    const parts = token.text.split("\n");
    const content = parts.map((part, j) => (
      <Fragment key={j}>
        {j > 0 ? <br /> : null}
        {part}
      </Fragment>
    ));
    return token.accent ? (
      <span key={i} className={accentClass}>
        {content}
      </span>
    ) : (
      <Fragment key={i}>{content}</Fragment>
    );
  });
}

export interface SplitAnimationHandle {
  totalTime: (value?: number) => number | SplitAnimationHandle;
  revert: () => void;
}

export function splitAnimation(build: () => void): SplitAnimationHandle {
  const ctx = gsap.context(build);
  const handle: SplitAnimationHandle = {
    totalTime: (value?: number) => (value === undefined ? 0 : handle),
    revert: () => ctx.revert(),
  };
  return handle;
}
