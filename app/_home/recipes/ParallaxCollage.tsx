"use client";
/**
 * <ParallaxCollage items>: media scattered on an asymmetric field, each drifting at its own speed
 * (depth parallax) and settling from a slight zoom. Optional centred content sits above.
 * READ-ONLY runtime file.
 */
import { useMemo, useRef, type CSSProperties, type ReactNode } from "react";
import { Media, type MediaSource } from "./Media";
import { useSceneMotion } from "../runtime/motion";
import { cx, seeded } from "./shared";

export interface CollageItem {
  slot: string;
  media: MediaSource;
  /** Left edge in % of the field (0-100). Omit x/y/width to use the seeded layout. */
  x?: number;
  /** Top edge in % of the field height. */
  y?: number;
  /** Width in % of the field width. */
  width?: number;
  /** CSS aspect-ratio, e.g. "4 / 5". Default "4 / 5". */
  ratio?: string;
  /** Depth: -1 (slow, far) .. 1.5 (fast, near). Default seeded. */
  speed?: number;
  /** Small caption under the image (decorative index/label). */
  caption?: ReactNode;
}

export interface ParallaxCollageProps {
  items: CollageItem[];
  /** Centred content above the collage (e.g. a KineticStatement). */
  children?: ReactNode;
  /** Field height in viewport heights. Default 1.6. */
  height?: number;
  /** Seed for the deterministic layout. Default 7. */
  seed?: number;
  /** Max drift in px at speed 1. Default 260. */
  drift?: number;
  /** Keep the middle column clear for `children`. Default true. */
  clearCenter?: boolean;
  className?: string;
  style?: CSSProperties;
}

type PlacedItem = Required<Pick<CollageItem, "slot" | "x" | "y" | "width" | "ratio" | "speed">>;

/** Deterministic asymmetric layout: alternates left/right lanes, varied sizes and depths. */
export function layoutCollage(items: CollageItem[], seed = 7, clearCenter = true): PlacedItem[] {
  const rand = seeded(seed);
  const count = items.length;
  const ratios = ["4 / 5", "3 / 4", "1 / 1", "5 / 4", "2 / 3"];
  return items.map((item, i) => {
    const left = i % 2 === 0;
    const band = (i + 0.5) / count; // vertical progression
    const width = item.width ?? Math.round(14 + rand() * 12);
    const laneMin = left ? 2 : clearCenter ? 62 : 38;
    const laneMax = left ? (clearCenter ? 38 - width : 60 - width) : 98 - width;
    const x = item.x ?? Math.round(laneMin + rand() * Math.max(0, laneMax - laneMin));
    const y = item.y ?? Math.round(Math.min(78, Math.max(2, band * 86 - 8 + (rand() - 0.5) * 14)));
    const speed = item.speed ?? Number((0.35 + rand() * 1.1).toFixed(2));
    const ratio = item.ratio ?? ratios[Math.floor(rand() * ratios.length)] ?? "4 / 5";
    return { slot: item.slot, x, y, width, ratio, speed };
  });
}

export function ParallaxCollage({ items, children, height = 1.6, seed = 7, drift = 260, clearCenter = true, className, style }: ParallaxCollageProps) {
  const root = useRef<HTMLDivElement>(null);
  const layoutKey = items.map((it) => [it.slot, it.x, it.y, it.width, it.ratio, it.speed].join(":")).join("|");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const placed = useMemo(() => layoutCollage(items, seed, clearCenter), [layoutKey, seed, clearCenter]);

  useSceneMotion(
    root,
    ({ gsap, q, scope, reducedMotion, isMobile }) => {
      if (reducedMotion || isMobile) return;
      const cards = q(".rx-collage__item") as HTMLElement[];
      cards.forEach((card) => {
        const speed = Number(card.dataset.speed ?? "1");
        const media = card.querySelector(".rx-collage__media");
        const st = { trigger: scope, start: "top bottom", end: "bottom top", scrub: true } as const;
        gsap.fromTo(card, { y: drift * speed }, { y: -drift * speed, ease: "none", scrollTrigger: st });
        if (media) gsap.fromTo(media, { scale: 1.25 }, { scale: 1, ease: "none", scrollTrigger: { ...st, end: "center center" } });
      });
    },
    [layoutKey, seed, clearCenter, drift],
  );

  return (
    <div
      ref={root}
      className={cx("rx-collage", className)}
      style={{ "--rx-collage-height": `${height * 100}svh`, ...style } as CSSProperties}
    >
      <ul className="rx-collage__field" role="list">
        {placed.map((item, i) => (
          <li
            key={`${item.slot}-${i}`}
            className="rx-collage__item"
            data-speed={item.speed}
            style={{ "--x": `${item.x}%`, "--y": `${item.y}%`, "--w": `${item.width}%`, "--ratio": item.ratio, "--z": Math.round(item.speed * 10) } as CSSProperties}
          >
            <figure className="rx-collage__lift">
              <div className="rx-collage__frame">
                {items[i] ? <Media media={items[i]!.media} className="rx-collage__media" /> : null}
              </div>
              {items[i]?.caption ? <figcaption className="rx-collage__caption">{items[i]?.caption}</figcaption> : null}
            </figure>
          </li>
        ))}
      </ul>
      {children ? <div className="rx-collage__content">{children}</div> : null}
    </div>
  );
}
