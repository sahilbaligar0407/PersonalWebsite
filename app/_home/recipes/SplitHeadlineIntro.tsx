"use client";
/**
 * <SplitHeadlineIntro>: the page's opening headline; chars / words / lines rise out of masks once the
 * page is ready (after fonts, preloader or a custom event), staggered by tempo. READ-ONLY runtime file.
 */
import { useRef, type CSSProperties, type Ref } from "react";
import { useSceneMotion } from "../runtime/motion";
import { getHomeRoot } from "../runtime/media";
import { colorVar, cx, fontVar, renderAccentMarkup, resolveText, stripAccentMarkup, type ColorValue, type FontRole } from "./shared";

export type IntroSplit = "chars" | "words" | "lines";

export interface SplitHeadlineIntroProps {
  /** Copy key (supports `*accent*` markup and `\n`)… */
  k?: string;
  /** …or literal text. */
  text?: string;
  as?: "h1" | "h2" | "p" | "div";
  /** Split granularity. Default "chars" (falls back to "words" on mobile). */
  split?: IntroSplit;
  /** When to start: "ready" (runtime measured + fonts, default), "mount", or a window event name
   *  dispatched by a preloader, e.g. "draftly:preloader-done". A 3s safety timeout always starts it. */
  after?: "ready" | "mount" | `event:${string}`;
  /** Extra delay in seconds after the start signal. */
  delay?: number;
  /** Rotation (deg) each piece starts with, for a livelier rise. Default 8 for chars, 0 otherwise. */
  tilt?: number;
  size?: "l" | "xl" | "giant";
  font?: FontRole;
  accentFont?: FontRole;
  accentColor?: ColorValue;
  className?: string;
  style?: CSSProperties;
}

export function SplitHeadlineIntro({
  k,
  text,
  as: Tag = "h1",
  split = "chars",
  after = "ready",
  delay = 0,
  tilt,
  size = "giant",
  font = "display",
  accentFont = "display",
  accentColor = "accent",
  className,
  style,
}: SplitHeadlineIntroProps) {
  const ref = useRef<HTMLElement>(null);
  const source = resolveText(k, text);

  useSceneMotion(
    ref,
    ({ gsap, SplitText, scope, reducedMotion, isMobile, tempo }) => {
      if (reducedMotion) return;
      const unit: IntroSplit = isMobile && split === "chars" ? "words" : split;
      const type = unit === "lines" ? "lines" : unit === "words" ? "lines,words" : "lines,words,chars";
      let started = false;
      let current: gsap.core.Tween | null = null;
      const angle = tilt ?? (unit === "chars" ? 8 : 0);

      SplitText.create(scope, {
        type,
        mask: "lines",
        linesClass: "rx-intro__line",
        autoSplit: true,
        onSplit: (self) => {
          const pieces = unit === "chars" ? self.chars : unit === "words" ? self.words : self.lines;
          current = gsap.from(pieces, {
            yPercent: 115,
            rotate: angle,
            transformOrigin: "0% 100%",
            duration: tempo.duration,
            ease: tempo.ease,
            stagger: unit === "chars" ? tempo.stagger * 0.35 : tempo.stagger * 1.2,
            delay,
            paused: !started,
          });
          if (started) current.progress(1);
          return current;
        },
      });

      const begin = () => {
        if (started) return;
        started = true;
        current?.play();
      };

      const root = getHomeRoot() ?? document.documentElement;
      let observer: MutationObserver | null = null;
      let eventName: string | null = null;
      if (after === "mount") begin();
      else if (after === "ready") {
        if (root.dataset.dlReady === "true") begin();
        else {
          observer = new MutationObserver(() => root.dataset.dlReady === "true" && begin());
          observer.observe(root, { attributes: true, attributeFilter: ["data-dl-ready"] });
        }
      } else {
        eventName = after.slice("event:".length);
        window.addEventListener(eventName, begin, { once: true });
      }
      const safety = window.setTimeout(begin, 3000);

      return () => {
        observer?.disconnect();
        if (eventName) window.removeEventListener(eventName, begin);
        window.clearTimeout(safety);
      };
    },
    [source, split, after, delay, tilt],
  );

  return (
    <Tag
      ref={ref as Ref<never>}
      className={cx("rx-intro", `rx-intro--${size}`, className)}
      style={{ "--rx-intro-font": fontVar(font), "--rx-intro-accent-font": fontVar(accentFont), "--rx-intro-accent": colorVar(accentColor), ...style } as CSSProperties}
      aria-label={stripAccentMarkup(source)}
      {...(k ? { "data-dl-copy": k } : {})}
    >
      {renderAccentMarkup(source, "rx-intro__accent")}
    </Tag>
  );
}
