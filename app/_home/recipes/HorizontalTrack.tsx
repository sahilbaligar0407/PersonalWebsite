"use client";
/**
 * <HorizontalTrack>: pinned horizontal gallery driven by vertical scroll, with per-card media
 * parallax. Mobile: native swipe (scroll-snap) or vertical stack. READ-ONLY runtime file.
 */
import { Children, useRef, type CSSProperties, type ReactNode } from "react";
import { Media, type MediaSource } from "./Media";
import { useSceneMotion } from "../runtime/motion";
import { cx } from "./shared";

export interface HorizontalTrackProps {
  /** Cards: usually <TrackCard>, but any element works. */
  children: ReactNode;
  /** Optional first panel (title/intro) that scrolls with the track. */
  intro?: ReactNode;
  /** Scroll distance multiplier (1 = track overflow in px). Pinned distance is capped at 3 viewports. Default 1. */
  speed?: number;
  /** Mobile layout: "swipe" (native horizontal scroll with snap, default) or "stack" (vertical). */
  mobile?: "swipe" | "stack";
  /** Media parallax inside cards, in % of card width. Default 14. */
  parallax?: number;
  /** Accessible name for the gallery list. */
  label?: string;
  className?: string;
  style?: CSSProperties;
}

export function HorizontalTrack({ children, intro, speed = 1, mobile = "swipe", parallax = 14, label, className, style }: HorizontalTrackProps) {
  const root = useRef<HTMLDivElement>(null);

  useSceneMotion(
    root,
    ({ gsap, q, scope, reducedMotion, isMobile, tempo }) => {
      const [viewport] = q(".rx-htrack__viewport") as HTMLElement[];
      const [track] = q(".rx-htrack__track") as HTMLElement[];
      if (!viewport || !track || reducedMotion || isMobile) return;
      scope.dataset.rxPinned = "true";
      const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
      const scrollLength = () => Math.min(distance() * speed, window.innerHeight * 3);
      const move = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: scope,
          pin: viewport,
          start: "top top",
          end: () => `+=${scrollLength()}`,
          scrub: tempo.scrub,
          invalidateOnRefresh: true,
        },
      });
      for (const card of q(".rx-htrack__card") as HTMLElement[]) {
        const media = card.querySelector(".rx-htrack__media");
        if (!media || parallax <= 0) continue;
        gsap.fromTo(
          media,
          { xPercent: -parallax / 2 },
          {
            xPercent: parallax / 2,
            ease: "none",
            scrollTrigger: { trigger: card, containerAnimation: move, start: "left right", end: "right left", scrub: true },
          },
        );
      }
      return () => {
        delete scope.dataset.rxPinned;
      };
    },
    [speed, parallax],
  );

  return (
    <div ref={root} className={cx("rx-htrack", `rx-htrack--mobile-${mobile}`, className)} style={style}>
      <div className="rx-htrack__viewport">
        <ul className="rx-htrack__track" role="list" aria-label={label}>
          {intro ? <li className="rx-htrack__intro">{intro}</li> : null}
          {Children.toArray(children).map((child, i) => (
            <li key={i} className="rx-htrack__item">
              {child}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export interface TrackCardProps {
  media: MediaSource;
  /** Card width preset. Default "m". */
  size?: "s" | "m" | "l";
  /** Caption content (title, meta). */
  children?: ReactNode;
  className?: string;
}

/** Card with an overflow-hidden media window (parallax target) and a caption. */
export function TrackCard({ media, size = "m", children, className }: TrackCardProps) {
  return (
    <article className={cx("rx-htrack__card", `rx-htrack__card--${size}`, className)}>
      <div className="rx-htrack__window">
        <Media media={media} className="rx-htrack__media" />
      </div>
      {children ? <div className="rx-htrack__caption">{children}</div> : null}
    </article>
  );
}
