/** <Media>: replaces the exemplar's <Asset slot>. Real image when `src` is set, otherwise a token-coloured procedural panel. */
import type { CSSProperties, ReactNode } from "react";
import { cx } from "./shared";

export interface MediaSource {
  src?: string;
  alt: string;
  width?: number;
  height?: number;
  /** CSS object-position, e.g. "50% 20%". */
  position?: string;
  /** Procedural fallback style when there is no image. */
  procedural?: "gradient" | "mesh" | "grid";
}

export interface MediaProps {
  media: MediaSource;
  className?: string;
  priority?: boolean;
  style?: CSSProperties;
  children?: ReactNode;
}

export function Media({ media, className, priority = false, style, children }: MediaProps) {
  if (!media.src) {
    return (
      <div className={cx("dl-asset", "dl-procedural", `dl-procedural--${media.procedural ?? "mesh"}`, className)} style={style} role="img" aria-label={media.alt}>
        {children}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={media.src}
      alt={media.alt}
      width={media.width}
      height={media.height}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={cx("dl-asset", className)}
      style={{ objectPosition: media.position, ...style }}
    />
  );
}
