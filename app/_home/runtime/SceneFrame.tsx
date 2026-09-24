"use client";
import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

export interface SceneFrameProps extends Omit<HTMLAttributes<HTMLElement>, "id"> {
  id: string;
  label: string;
  as?: "section" | "header" | "footer" | "div";
  fullHeight?: boolean;
  children?: ReactNode;
}

/** Root element of every scene: a labelled landmark with an anchor id (ported from the Kai Arden runtime). */
export const SceneFrame = forwardRef<HTMLElement, SceneFrameProps>(function SceneFrame(
  { id, label, as: Tag = "section", fullHeight = true, className, children, ...rest },
  ref,
) {
  const classes = ["dl-scene", fullHeight ? "dl-scene--full" : null, className].filter(Boolean).join(" ");
  return (
    <Tag {...rest} ref={ref as never} id={id} aria-label={label} className={classes} data-dl-scene={id}>
      {children}
    </Tag>
  );
});
