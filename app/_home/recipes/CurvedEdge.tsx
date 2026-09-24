"use client";
/**
 * <CurvedEdge>: the section enters with a curved top edge (a dome or a bowl in its own colour) that
 * flattens as it scrolls in, wiping over the previous section. READ-ONLY runtime file.
 */
import { useRef, type CSSProperties, type ReactNode } from "react";
import { useSceneMotion } from "../runtime/motion";
import { colorVar, cx, type ColorValue } from "./shared";

export interface CurvedEdgeProps {
  children?: ReactNode;
  /** Section background (the curve uses the same colour). Default "surface". */
  background?: ColorValue;
  /** Text colour. Default "ink". */
  ink?: ColorValue;
  /** "convex" = dome rising from the middle (default); "concave" = edges lead, middle trails. */
  variant?: "convex" | "concave";
  /** Curve height in viewport heights at the start. Default 0.18. */
  depth?: number;
  className?: string;
  style?: CSSProperties;
}

export function CurvedEdge({ children, background = "surface", ink = "ink", variant = "convex", depth = 0.18, className, style }: CurvedEdgeProps) {
  const root = useRef<HTMLDivElement>(null);

  useSceneMotion(
    root,
    ({ gsap, q, scope, reducedMotion, isMobile }) => {
      const [curve] = q(".rx-curve__edge");
      if (!curve || reducedMotion) return;
      gsap.fromTo(
        curve,
        { autoAlpha: 1, scaleY: isMobile ? 0.5 : 1 },
        { scaleY: 0, ease: "none", scrollTrigger: { trigger: scope, start: "top bottom", end: "top 25%", scrub: true } },
      );
    },
    [depth, variant],
  );

  const path = variant === "convex" ? "M0 100 C 5 -30, 95 -30, 100 100 Z" : "M0 0 C 5 130, 95 130, 100 0 L100 100 L0 100 Z";

  return (
    <div
      ref={root}
      className={cx("rx-curve", className)}
      style={{ "--rx-curve-bg": colorVar(background), "--rx-curve-depth": `${depth * 100}vh`, color: colorVar(ink), ...style } as CSSProperties}
    >
      <svg className="rx-curve__edge" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path d={path} />
      </svg>
      {children}
    </div>
  );
}
