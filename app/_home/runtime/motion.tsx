"use client";
/**
 * MotionProvider + useSceneMotion, ported from the Kai Arden scroll runtime for Next 14 / React 18.
 * One Lenis instance drives smooth scroll; every scene builds its GSAP work inside a scoped matchMedia.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type DependencyList,
  type ReactNode,
  type RefObject,
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import Lenis from "lenis";
import { DESKTOP_QUERY, MOBILE_QUERY, REDUCED_MOTION_QUERY, getHomeRoot, usePointerFine, usePrefersReducedMotion } from "./media";
import { markReady, refreshOnMediaLoad, scheduleRefresh } from "./refresh";

gsap.registerPlugin(ScrollTrigger, SplitText, ScrollToPlugin);
if (typeof window !== "undefined") ScrollTrigger.config({ ignoreMobileResize: true });

export const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export type MotionTier = "full" | "lite" | "reduced";

export interface TempoPreset {
  ease: string;
  easeInOut: string;
  easeIn: string;
  duration: number;
  stagger: number;
  scrub: number;
  distance: number;
}

/** Kai Arden runs on the "cinematic" tempo. */
export const TEMPO: TempoPreset = { ease: "expo.out", easeInOut: "expo.inOut", easeIn: "expo.in", duration: 1.4, stagger: 0.08, scrub: 1, distance: 48 };

export interface MotionContextValue {
  lenis: Lenis | null;
  reducedMotion: boolean;
  isCoarsePointer: boolean;
  tier: MotionTier;
  tempo: TempoPreset;
  scrollTo: (target: HTMLElement | string | number, options?: { offset?: number; duration?: number }) => void;
}

function isLowPowerDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return Boolean(connection?.saveData) || (navigator.hardwareConcurrency ?? 8) <= 4;
}

/** Without Lenis: a GSAP-driven scroll (CSS smooth scroll gets interrupted by ScrollTrigger refreshes on long pages). */
function nativeScrollTo(target: HTMLElement | string | number, offset: number, reduced: boolean) {
  const el = typeof target === "number" ? null : typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
  if (typeof target !== "number" && !el) return;
  const y = () => (el ? el.getBoundingClientRect().top + window.scrollY + offset : (target as number) + offset);
  if (reduced) {
    window.scrollTo({ top: y(), behavior: "instant" as ScrollBehavior });
    return;
  }
  // The site-wide `html { scroll-behavior: smooth }` would fight the tween, so switch it off for its duration.
  const html = document.documentElement;
  const restore = () => html.style.removeProperty("scroll-behavior");
  html.style.scrollBehavior = "auto";
  gsap.to(window, { scrollTo: { y: y(), autoKill: false }, duration: 1.2, ease: "power3.inOut", overwrite: true, onComplete: restore, onInterrupt: restore });
}

const MotionContext = createContext<MotionContextValue>({
  lenis: null,
  reducedMotion: false,
  isCoarsePointer: false,
  tier: "full",
  tempo: TEMPO,
  scrollTo: (target, options) => nativeScrollTo(target, options?.offset ?? 0, false),
});

export function MotionProvider({ children }: { children: ReactNode }) {
  const reducedMotion = usePrefersReducedMotion();
  const isCoarsePointer = !usePointerFine();
  const [lowPower, setLowPower] = useState(false);
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => setLowPower(isLowPowerDevice()), []);

  const tier: MotionTier = reducedMotion ? "reduced" : isCoarsePointer || lowPower ? "lite" : "full";
  const wantsSmooth = tier === "full";

  useEffect(() => {
    const root = getHomeRoot();
    if (!root) return;
    root.dataset.motion = reducedMotion ? "reduced" : "full";
    root.dataset.motionTier = tier;
  }, [reducedMotion, tier]);

  useEffect(() => {
    if (!wantsSmooth) return;
    const instance = new Lenis({ autoRaf: false, anchors: true, lerp: 0.1, smoothWheel: true, syncTouch: false });
    const onScroll = () => ScrollTrigger.update();
    instance.on("scroll", onScroll);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    lenisRef.current = instance;
    setLenis(instance);
    scheduleRefresh();
    return () => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      instance.destroy();
      lenisRef.current = null;
      setLenis(null);
    };
  }, [wantsSmooth]);

  useEffect(() => {
    const stop = markReady();
    const onLoad = () => scheduleRefresh();
    window.addEventListener("load", onLoad);
    void document.fonts?.ready.then(onLoad);
    return () => {
      stop();
      window.removeEventListener("load", onLoad);
    };
  }, []);

  const scrollTo = useCallback<MotionContextValue["scrollTo"]>(
    (target, options) => {
      const active = lenisRef.current;
      if (active && !reducedMotion) {
        active.scrollTo(target, { offset: options?.offset ?? 0, duration: options?.duration ?? TEMPO.duration });
        return;
      }
      nativeScrollTo(target, options?.offset ?? 0, reducedMotion);
    },
    [reducedMotion],
  );

  // In-page anchors: Lenis handles them itself (anchors: true); otherwise route them through scrollTo.
  useEffect(() => {
    if (lenis) return;
    const root = getHomeRoot();
    if (!root) return;
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.("a[href^='#']");
      const href = link?.getAttribute("href");
      if (!href || href.length < 2 || !document.getElementById(href.slice(1))) return;
      event.preventDefault();
      nativeScrollTo(href, 0, reducedMotion);
      history.replaceState(null, "", href);
    };
    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, [lenis, reducedMotion]);

  const value = useMemo<MotionContextValue>(
    () => ({ lenis, reducedMotion, isCoarsePointer, tier, tempo: TEMPO, scrollTo }),
    [lenis, reducedMotion, isCoarsePointer, tier, scrollTo],
  );

  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}

export function useMotion(): MotionContextValue {
  return useContext(MotionContext);
}

export interface SceneMotionContext {
  gsap: typeof gsap;
  ScrollTrigger: typeof ScrollTrigger;
  SplitText: typeof SplitText;
  scope: HTMLElement;
  q: (selector: string) => Element[];
  reducedMotion: boolean;
  isMobile: boolean;
  isCoarsePointer: boolean;
  tier: MotionTier;
  tempo: TempoPreset;
  lenis: Lenis | null;
}

export type SceneMotionSetup = (ctx: SceneMotionContext) => void | (() => void);

/** Scoped, self-cleaning GSAP setup (gsap.matchMedia): reverted on unmount, breakpoint and reduced-motion change. */
export function useSceneMotion<T extends HTMLElement>(ref: RefObject<T | null>, setup: SceneMotionSetup, deps: DependencyList = []): void {
  const motion = useMotion();

  useIsoLayoutEffect(() => {
    const scope = ref.current;
    if (!scope) return;
    const mm = gsap.matchMedia(scope);
    mm.add(
      { isMobile: MOBILE_QUERY, isDesktop: DESKTOP_QUERY, reduce: REDUCED_MOTION_QUERY },
      (context) => {
        const conditions = (context.conditions ?? {}) as Record<string, boolean>;
        const reducedMotion = Boolean(conditions.reduce) || motion.reducedMotion;
        const q = gsap.utils.selector(scope) as (selector: string) => Element[];
        return setup({
          gsap,
          ScrollTrigger,
          SplitText,
          scope,
          q,
          reducedMotion,
          isMobile: Boolean(conditions.isMobile),
          isCoarsePointer: motion.isCoarsePointer,
          tier: reducedMotion ? "reduced" : motion.tier,
          tempo: motion.tempo,
          lenis: motion.lenis,
        });
      },
      scope,
    );
    const stopWatching = refreshOnMediaLoad(scope);
    scheduleRefresh();
    return () => {
      stopWatching();
      mm.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, motion.reducedMotion, motion.isCoarsePointer, ...deps]);
}
