"use client";
/**
 * <ClipReveal slot>: media grows from a small inset frame (rect / rounded / circle) to full-bleed
 * while scrolling, with an inner counter-scale. READ-ONLY runtime file.
 */
import { useRef, type CSSProperties, type ReactNode } from "react";
import { Media, type MediaSource } from "./Media";
import { useSceneMotion } from "../runtime/motion";
import { cx } from "./shared";

export type ClipShape = "rect" | "rounded" | "circle";

export interface ClipRevealProps {
  media: MediaSource;
  shape?: ClipShape;
  /** Starting inset as a fraction of each side (0-0.45). Default 0.28. For "circle": starting radius fraction. */
  inset?: number;
  /** Inner media scale at the start (settles to 1). Default 1.3. */
  counterScale?: number;
  /** Corner radius in px at the start for "rounded". Default 32. */
  radius?: number;
  /** Pin the frame while it expands (desktop). Default true. */
  pin?: boolean;
  /** Pinned distance in viewport heights when `pin`. Default 1.2. */
  length?: number;
  /** Overlay content (captions, headline) rendered above the media; rises in near the end. */
  children?: ReactNode;
  /** Darkens media under overlay content (0-1). Default 0.35 when children exist. */
  veil?: number;
  priority?: boolean;
  className?: string;
  style?: CSSProperties;
}

function clipFrom(shape: ClipShape, inset: number, aspect: number, radius: number): string {
  const v = Math.min(45, Math.max(0, inset * 100));
  if (shape === "circle") return `circle(${Math.max(4, v * 0.7)}% at 50% 50%)`;
  // Keep a visually even frame: horizontal inset compensates for wide viewports.
  const h = Math.min(45, v * Math.max(1, aspect * 0.75));
  return `inset(${v}% ${h}% ${v}% ${h}% round ${shape === "rounded" ? radius : 0}px)`;
}

function clipTo(shape: ClipShape): string {
  if (shape === "circle") return "circle(75% at 50% 50%)";
  return "inset(0% 0% 0% 0% round 0px)";
}

export function ClipReveal({
  media,
  shape = "rounded",
  inset = 0.28,
  counterScale = 1.3,
  radius = 32,
  pin = true,
  length = 1.2,
  children,
  veil,
  priority = false,
  className,
  style,
}: ClipRevealProps) {
  const root = useRef<HTMLDivElement>(null);

  useSceneMotion(
    root,
    ({ gsap, q, scope, reducedMotion, isMobile, tempo }) => {
      const [frame] = q(".rx-clip__frame");
      const [media] = q(".rx-clip__media");
      const overlay = q(".rx-clip__overlay > *");
      if (!frame || !media || reducedMotion) return;
      const aspect = window.innerWidth / Math.max(1, window.innerHeight);
      const start = clipFrom(shape, isMobile ? inset * 0.6 : inset, aspect, radius);
      const usePin = pin && !isMobile;
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: scope,
          start: usePin ? "top top" : "top 90%",
          end: usePin ? `+=${Math.min(3, length) * 100}%` : "top 10%",
          pin: usePin ? frame : false,
          scrub: tempo.scrub,
          invalidateOnRefresh: true,
        },
      });
      tl.fromTo(frame, { clipPath: start }, { clipPath: clipTo(shape), duration: 1, ease: "power1.inOut" }, 0).fromTo(
        media,
        { scale: counterScale },
        { scale: 1, duration: 1, ease: "power1.out" },
        0,
      );
      if (overlay.length) {
        tl.from(overlay, { autoAlpha: 0, y: tempo.distance, stagger: 0.08, duration: 0.35, ease: "power2.out" }, 0.62);
      }
    },
    [shape, inset, counterScale, radius, pin, length],
  );

  const veilOpacity = veil ?? (children ? 0.35 : 0);
  return (
    <div ref={root} className={cx("rx-clip", `rx-clip--${shape}`, className)} style={style}>
      <div className="rx-clip__frame">
        <Media media={media} priority={priority} className="rx-clip__media" />
        {veilOpacity > 0 ? <div className="rx-clip__veil" style={{ opacity: veilOpacity }} aria-hidden="true" /> : null}
        {children ? <div className="rx-clip__overlay">{children}</div> : null}
      </div>
    </div>
  );
}
