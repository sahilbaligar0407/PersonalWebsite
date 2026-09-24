"use client";
/**
 * <RingText>: text set on a circle that idles slowly and spins with scroll velocity; optional
 * scroll-linked dial rotation/scale and centre content. READ-ONLY runtime file.
 */
import { useId, useRef, type CSSProperties, type ReactNode } from "react";
import { useSceneMotion } from "../runtime/motion";
import { colorVar, cx, resolveText, type ColorValue, type FontRole, fontVar } from "./shared";

export interface RingTextProps {
  /** Copy key or literal `text`; repeated `repeat` times around the ring with `separator`. */
  k?: string;
  text?: string;
  repeat?: number;
  separator?: string;
  /** Diameter as CSS length. Default "clamp(9rem, 18vw, 16rem)". */
  size?: string;
  /** Idle degrees per second (0 = no idle). Default 12. Negative = counter-clockwise. */
  idleSpeed?: number;
  /** How strongly scroll velocity spins the ring. Default 1. */
  velocity?: number;
  /** Extra rotation (deg) of the whole dial across its scroll pass, e.g. 180. Default 0. */
  scrollRotate?: number;
  /** Dial scale across its scroll pass [from, to], e.g. [0.7, 1.15]. */
  scrollScale?: readonly [number, number];
  font?: FontRole;
  color?: ColorValue;
  /** Content in the centre (icon, number, arrow). */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function RingText({
  k,
  text,
  repeat = 2,
  separator = " • ",
  size = "clamp(9rem, 18vw, 16rem)",
  idleSpeed = 12,
  velocity = 1,
  scrollRotate = 0,
  scrollScale,
  font = "utility",
  color = "ink",
  children,
  className,
  style,
}: RingTextProps) {
  const root = useRef<HTMLDivElement>(null);
  const pathId = `rx-ring-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const phrase = resolveText(k, text);
  const ringText = Array.from({ length: Math.max(1, repeat) }, () => `${phrase}${separator}`).join("");

  useSceneMotion(
    root,
    ({ gsap, ScrollTrigger, q, scope, reducedMotion, isMobile }) => {
      const [ring] = q(".rx-ring__svg");
      const [dial] = q(".rx-ring__dial");
      if (!ring || !dial || reducedMotion) return;

      if (scrollRotate || scrollScale) {
        gsap.fromTo(
          dial,
          { rotate: 0, scale: scrollScale?.[0] ?? 1 },
          { rotate: scrollRotate, scale: scrollScale?.[1] ?? 1, ease: "none", scrollTrigger: { trigger: scope, start: "clamp(top bottom)", end: "clamp(bottom top)", scrub: true } },
        );
      }

      const direction = idleSpeed < 0 ? -1 : 1;
      const spin = gsap.to(ring, { rotate: `+=${360 * direction}`, duration: 360 / Math.max(1, Math.abs(idleSpeed || 12)), ease: "none", repeat: -1, paused: true });
      if (idleSpeed === 0) spin.timeScale(0);
      const settle = gsap.quickTo(spin, "timeScale", { duration: 0.8, ease: "power2.out" });
      const base = idleSpeed === 0 ? 0 : 1;

      ScrollTrigger.create({
        trigger: scope,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => (self.isActive ? spin.play() : spin.pause()),
        onUpdate: (self) => {
          if (velocity <= 0 || isMobile) return;
          const v = self.getVelocity() / 120; // px/s -> multiplier
          const boost = gsap.utils.clamp(-14, 14, v * velocity);
          spin.timeScale(base + boost);
          settle(base);
        },
      });
    },
    [idleSpeed, velocity, scrollRotate, scrollScale?.[0], scrollScale?.[1], ringText],
  );

  return (
    <div
      ref={root}
      className={cx("rx-ring", className)}
      style={{ "--rx-ring-size": size, "--rx-ring-font": fontVar(font), color: colorVar(color), ...style } as CSSProperties}
    >
      <div className="rx-ring__dial">
        <svg className="rx-ring__svg" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
          <defs>
            <path id={pathId} d="M100,100 m-82,0 a82,82 0 1,1 164,0 a82,82 0 1,1 -164,0" />
          </defs>
          <text className="rx-ring__text">
            <textPath href={`#${pathId}`} textLength={515} lengthAdjust="spacing">
              {ringText}
            </textPath>
          </text>
        </svg>
        {children ? <div className="rx-ring__center">{children}</div> : null}
      </div>
      <span className="dl-sr-only">{phrase}</span>
    </div>
  );
}
