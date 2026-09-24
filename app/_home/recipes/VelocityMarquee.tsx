"use client";
/**
 * <VelocityMarquee>: infinite marquee whose speed and direction follow scroll velocity, skewing on
 * fast scroll. Pauses off-screen; static under reduced motion. READ-ONLY runtime file.
 */
import { useRef, type CSSProperties, type ReactNode } from "react";
import { useSceneMotion } from "../runtime/motion";
import { cx } from "./shared";

export interface VelocityMarqueeProps {
  /** One sequence of items (text spans, glyphs, small media). It is cloned to fill the loop. */
  children: ReactNode;
  /** Base speed in px/s. Default 80. */
  speed?: number;
  /** 1 = moves left, -1 = moves right. Default 1. */
  direction?: 1 | -1;
  /** Flip direction when the user scrolls up. Default true. */
  followScroll?: boolean;
  /** Velocity influence. Default 1. */
  boost?: number;
  /** Max skew in degrees on fast scroll (0 disables). Default 8. */
  skew?: number;
  /** Number of copies rendered (>= 2). Default 4. */
  copies?: number;
  className?: string;
  style?: CSSProperties;
}

export function VelocityMarquee({
  children,
  speed = 80,
  direction = 1,
  followScroll = true,
  boost = 1,
  skew = 8,
  copies = 4,
  className,
  style,
}: VelocityMarqueeProps) {
  const root = useRef<HTMLDivElement>(null);

  useSceneMotion(
    root,
    ({ gsap, ScrollTrigger, q, scope, reducedMotion, isMobile }) => {
      const [track] = q(".rx-marquee__track") as HTMLElement[];
      const [group] = q(".rx-marquee__group") as HTMLElement[];
      if (!track || !group || reducedMotion) return;

      let width = group.offsetWidth;
      const measure = () => (width = group.offsetWidth);
      const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
      ro?.observe(group);

      const setX = gsap.quickSetter(track, "x", "px");
      const setSkew = gsap.quickSetter(track, "skewX", "deg");
      const maxSkew = isMobile ? 0 : skew;
      let skewNow = 0;
      let x = 0;
      let dir: number = direction;
      let extra = 0; // velocity multiplier, decays to 0
      const base = isMobile ? speed * 0.6 : speed;

      const tick = (_time: number, deltaMs: number) => {
        if (!width) return;
        const dt = Math.min(deltaMs, 64) / 1000;
        extra *= Math.pow(0.04, dt); // smooth decay
        x -= dir * base * (1 + extra) * dt;
        x = gsap.utils.wrap(-width, 0, x);
        setX(x);
        if (maxSkew > 0) {
          const target = gsap.utils.clamp(-maxSkew, maxSkew, -dir * extra * 1.4);
          skewNow += (target - skewNow) * Math.min(1, dt * 8);
          setSkew(Math.abs(skewNow) < 0.01 ? 0 : skewNow);
        }
      };

      let running = false;
      const start = () => {
        if (!running) gsap.ticker.add(tick);
        running = true;
      };
      const stop = () => {
        if (running) gsap.ticker.remove(tick);
        running = false;
      };

      ScrollTrigger.create({
        trigger: scope,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => (self.isActive ? start() : stop()),
        onUpdate: (self) => {
          const v = self.getVelocity();
          if (followScroll && self.direction !== 0) dir = direction * self.direction;
          extra = Math.min(12, Math.max(extra, (Math.abs(v) / 300) * boost));
        },
      });

      return () => {
        stop();
        ro?.disconnect();
        track.style.transform = "";
      };
    },
    [speed, direction, followScroll, boost, skew],
  );

  const count = Math.max(2, copies);
  return (
    <div ref={root} className={cx("rx-marquee", className)} style={style}>
      <div className="rx-marquee__track">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="rx-marquee__group" aria-hidden={i > 0 ? true : undefined}>
            {children}
          </div>
        ))}
      </div>
    </div>
  );
}
