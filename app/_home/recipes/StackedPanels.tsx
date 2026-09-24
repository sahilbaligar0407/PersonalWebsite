"use client";
/**
 * <StackedPanels>: full-viewport panels that slide up over the previous one (sticky stack);
 * the covered panel scales down and darkens slightly. READ-ONLY runtime file.
 */
import { Children, useRef, type CSSProperties, type ReactNode } from "react";
import { useSceneMotion } from "../runtime/motion";
import { colorVar, cx, type ColorValue } from "./shared";

export interface StackedPanelsProps {
  /** One child per panel (use <StackPanel> for tone + layout). */
  children: ReactNode;
  /** Scale of a fully covered panel. Default 0.9. */
  depthScale?: number;
  /** Veil opacity of a fully covered panel. Default 0.55. */
  darken?: number;
  /** Rounded top corners on incoming panels (px). Default 28. */
  radius?: number;
  /** Keep sticky stacking on mobile (only when every panel fits in 100svh). Default false. */
  mobileSticky?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function StackedPanels({ children, depthScale = 0.9, darken = 0.55, radius = 28, mobileSticky = false, className, style }: StackedPanelsProps) {
  const root = useRef<HTMLDivElement>(null);
  const panels = Children.toArray(children);

  useSceneMotion(
    root,
    ({ gsap, q, reducedMotion, isMobile }) => {
      if (reducedMotion || isMobile) return;
      const items = q(".rx-stack__panel") as HTMLElement[];
      items.forEach((panel, i) => {
        const next = items[i + 1];
        if (!next) return;
        const inner = panel.querySelector(".rx-stack__inner");
        const veil = panel.querySelector(".rx-stack__veil");
        const st = { trigger: next, start: "top bottom", end: "top top", scrub: true } as const;
        if (inner) gsap.fromTo(inner, { scale: 1, yPercent: 0 }, { scale: depthScale, yPercent: -4, ease: "none", scrollTrigger: st });
        if (veil) gsap.fromTo(veil, { opacity: 0 }, { opacity: darken, ease: "none", scrollTrigger: st });
      });
    },
    [depthScale, darken, panels.length],
  );

  return (
    <div
      ref={root}
      className={cx("rx-stack", mobileSticky && "rx-stack--mobile-sticky", className)}
      style={{ "--rx-stack-radius": `${radius}px`, ...style } as CSSProperties}
    >
      {panels.map((panel, i) => (
        <div key={i} className="rx-stack__panel" style={{ zIndex: i + 1 }}>
          <div className="rx-stack__inner">
            {panel}
            <div className="rx-stack__veil" aria-hidden="true" />
          </div>
        </div>
      ))}
    </div>
  );
}

export interface StackPanelProps {
  children?: ReactNode;
  /** Panel background (palette role or hex). Default "surface". */
  background?: ColorValue;
  /** Panel text colour. Default "ink". */
  ink?: ColorValue;
  className?: string;
  style?: CSSProperties;
}

/** A 100svh panel surface for <StackedPanels>. */
export function StackPanel({ children, background = "surface", ink = "ink", className, style }: StackPanelProps) {
  return (
    <div className={cx("rx-stack__surface", className)} style={{ background: colorVar(background), color: colorVar(ink), ...style }}>
      {children}
    </div>
  );
}
