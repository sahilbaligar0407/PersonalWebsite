"use client";
/**
 * <PinnedStage>: pins an inner 100svh stage for `length` viewport heights and drives one scrubbed
 * GSAP timeline. Children add choreography with `usePinnedTimeline` or the `timeline` prop.
 * READ-ONLY runtime file.
 */
import { createContext, useContext, useLayoutEffect, useRef, type CSSProperties, type DependencyList, type ReactNode } from "react";
import type { gsap } from "gsap";
import type { ScrollTrigger } from "gsap/ScrollTrigger";
import { useSceneMotion, type SceneMotionContext } from "../runtime/motion";
import { cx } from "./shared";

export interface PinnedStageContext extends SceneMotionContext {
  /** The pinned 100svh stage element (use as `pinnedContainer` for nested ScrollTriggers). */
  stage: HTMLElement;
  /** The stage's ScrollTrigger (null on mobile "static"). */
  trigger: ScrollTrigger | null;
}

/** Adds tweens to the stage timeline. Position tweens in timeline seconds (total 1 = whole pin). */
export type PinnedTimelineBuilder = (tl: gsap.core.Timeline, ctx: PinnedStageContext) => void;

type Registry = Map<number, { current: PinnedTimelineBuilder }>;
const StageRegistry = createContext<Registry | null>(null);
let nextId = 1;

export interface PinnedStageProps {
  children?: ReactNode;
  /** Pinned scroll distance in viewport heights (clamped 0.5-3). Default 2. */
  length?: number;
  /** Timeline builder, run after children registered theirs. */
  timeline?: PinnedTimelineBuilder;
  /** Scrub smoothing seconds; default tempo.scrub. */
  scrub?: number;
  /** Mobile: "static" (no pin, final CSS state, default) or "scrub" (timeline scrubs while stage scrolls past, no pin). */
  mobile?: "static" | "scrub";
  /** Writes `--stage-progress` (0-1) on the stage for CSS-driven children. Default false. */
  progressVar?: boolean;
  /** Re-build the timeline when these change. */
  deps?: DependencyList;
  className?: string;
  stageClassName?: string;
  style?: CSSProperties;
}

export function PinnedStage({
  children,
  length = 2,
  timeline,
  scrub,
  mobile = "static",
  progressVar = false,
  deps = [],
  className,
  stageClassName,
  style,
}: PinnedStageProps) {
  const root = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const registry = useRef<Registry>(new Map()).current;
  const builderRef = useRef(timeline);
  builderRef.current = timeline;

  useSceneMotion(
    root,
    (ctx) => {
      const { gsap, scope, reducedMotion, isMobile, tempo } = ctx;
      const stage = stageRef.current;
      if (!stage || reducedMotion) return;
      if (isMobile && mobile === "static") return;
      const vh = Math.min(3, Math.max(0.5, length));
      const pin = !isMobile;
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: scope,
          start: pin ? "top top" : "top 75%",
          end: pin ? `+=${vh * 100}%` : "bottom 25%",
          pin: pin ? stage : false,
          scrub: scrub ?? tempo.scrub,
          invalidateOnRefresh: true,
          onUpdate: progressVar ? (self) => stage.style.setProperty("--stage-progress", self.progress.toFixed(4)) : undefined,
        },
      });
      stage.dataset.rxStage = "active";
      const stageCtx: PinnedStageContext = { ...ctx, stage, trigger: tl.scrollTrigger ?? null };
      for (const entry of registry.values()) entry.current(tl, stageCtx);
      builderRef.current?.(tl, stageCtx);
      // Normalise so an empty or short timeline still spans the whole pin.
      if (tl.duration() < 1) tl.to({}, { duration: 1 - tl.duration() });
      return () => {
        stage.style.removeProperty("--stage-progress");
        delete stage.dataset.rxStage;
      };
    },
    [length, mobile, progressVar, scrub, ...deps],
  );

  return (
    <StageRegistry.Provider value={registry}>
      <div ref={root} className={cx("rx-pinned", className)} style={style}>
        <div ref={stageRef} className={cx("rx-pinned__stage", stageClassName)}>
          {children}
        </div>
      </div>
    </StageRegistry.Provider>
  );
}

/**
 * Register a builder on the nearest <PinnedStage>. Builders run when the stage (re)builds; pass
 * values they read through PinnedStage `deps`. Use refs or `ctx.q` to target elements.
 */
export function usePinnedTimeline(builder: PinnedTimelineBuilder): void {
  const registry = useContext(StageRegistry);
  const ref = useRef(builder);
  ref.current = builder;
  const idRef = useRef(0);
  if (idRef.current === 0) idRef.current = nextId++;
  useLayoutEffect(() => {
    if (!registry) {
      if (process.env.NODE_ENV !== "production") console.warn("[draftly] usePinnedTimeline must be used inside <PinnedStage>.");
      return;
    }
    const id = idRef.current;
    registry.set(id, ref);
    return () => {
      registry.delete(id);
    };
  }, [registry]);
}
