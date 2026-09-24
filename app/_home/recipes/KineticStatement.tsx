"use client";
/**
 * <KineticStatement>: a very large multi-line statement. Lines rise from masks and/or words brighten
 * with scroll. `*accent words*` markup renders accent spans in an alternate font role and colour.
 * READ-ONLY runtime file.
 */
import { useRef, type CSSProperties, type Ref } from "react";
import { useSceneMotion } from "../runtime/motion";
import { colorVar, cx, fontVar, renderAccentMarkup, resolveText, splitAnimation, stripAccentMarkup, type ColorValue, type FontRole } from "./shared";

export type KineticMode = "lines" | "lines-scrub" | "words-scrub" | "lines+words";
export type KineticSize = "l" | "xl" | "giant";

export interface KineticStatementProps {
  /** Copy key (text may contain `*accent*` markup and `\n` line breaks)… */
  k?: string;
  /** …or literal text (for decorative / demo use). */
  text?: string;
  as?: "h1" | "h2" | "h3" | "p" | "div" | "blockquote";
  /** "lines" = masked line rise once on enter; "lines-scrub" = lines rise tied to scroll;
   *  "words-scrub" = words brighten from dim as you scroll; "lines+words" = both. Default "lines+words". */
  mode?: KineticMode;
  size?: KineticSize;
  align?: "start" | "center" | "end";
  font?: FontRole;
  accentFont?: FontRole;
  accentColor?: ColorValue;
  accentItalic?: boolean;
  /** Dim level for words-scrub (0-1). Default 0.16. */
  dim?: number;
  className?: string;
  style?: CSSProperties;
}

export function KineticStatement({
  k,
  text,
  as: Tag = "h2",
  mode = "lines+words",
  size = "xl",
  align = "center",
  font = "display",
  accentFont = "body",
  accentColor = "accent",
  accentItalic = false,
  dim = 0.16,
  className,
  style,
}: KineticStatementProps) {
  const ref = useRef<HTMLElement>(null);
  const source = resolveText(k, text);

  useSceneMotion(
    ref,
    ({ gsap, SplitText, scope, reducedMotion, isMobile, tempo }) => {
      if (reducedMotion) return;
      const wantsLines = mode !== "words-scrub";
      const wantsWords = (mode === "words-scrub" || mode === "lines+words") && !isMobile;
      const scrubLines = mode === "lines-scrub" && !isMobile;
      let played = false;
      SplitText.create(scope, {
        type: wantsWords ? "lines,words" : "lines",
        mask: wantsLines ? "lines" : undefined,
        linesClass: "rx-kinetic__line",
        wordsClass: "rx-kinetic__word",
        autoSplit: true,
        onSplit: (self) =>
          splitAnimation(() => {
            if (wantsLines && scrubLines) {
              gsap.fromTo(
                self.lines,
                { yPercent: 105, rotate: 2 },
                { yPercent: 0, rotate: 0, ease: "none", stagger: 0.15, scrollTrigger: { trigger: scope, start: "clamp(top 92%)", end: "clamp(bottom 60%)", scrub: tempo.scrub } },
              );
            } else if (wantsLines && !played) {
              gsap.from(self.lines, {
                yPercent: 110,
                rotate: isMobile ? 0 : 2.5,
                transformOrigin: "0% 100%",
                duration: tempo.duration,
                ease: tempo.ease,
                stagger: tempo.stagger * 1.6,
                scrollTrigger: { trigger: scope, start: "top 82%", once: true, onEnter: () => (played = true) },
              });
            }
            if (wantsWords) {
              gsap.fromTo(
                self.words,
                { opacity: dim },
                { opacity: 1, ease: "none", stagger: 0.1, scrollTrigger: { trigger: scope, start: "clamp(top 70%)", end: "clamp(bottom 40%)", scrub: tempo.scrub } },
              );
            }
          }),
      });
    },
    [source, mode, dim],
  );

  const vars = {
    "--rx-kinetic-font": fontVar(font),
    "--rx-kinetic-accent-font": fontVar(accentFont),
    "--rx-kinetic-accent": colorVar(accentColor),
    ...style,
  } as CSSProperties;

  return (
    <Tag
      ref={ref as Ref<never>}
      className={cx("rx-kinetic", `rx-kinetic--${size}`, `rx-kinetic--${align}`, accentItalic && "rx-kinetic--italic", className)}
      style={vars}
      aria-label={stripAccentMarkup(source)}
      {...(k ? { "data-dl-copy": k } : {})}
    >
      {renderAccentMarkup(source, "rx-kinetic__accent")}
    </Tag>
  );
}
