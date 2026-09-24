/** Media-query helpers + the landing root element (ported from the Kai Arden scroll runtime). */
import { useSyncExternalStore } from "react";

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
export const FINE_POINTER_QUERY = "(hover: hover) and (pointer: fine)";
export const MOBILE_QUERY = "(max-width: 767px)";
export const DESKTOP_QUERY = "(min-width: 768px)";

/** `?dl-motion=reduced` forces reduced motion (preview / capture emulation). */
export function isReducedMotionForced(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return new URLSearchParams(window.location.search).get("dl-motion") === "reduced";
  } catch {
    return false;
  }
}

function mediaQueryStore(query: string, fallback: boolean) {
  const subscribe = (onChange: () => void) => {
    if (typeof window === "undefined" || !window.matchMedia) return () => {};
    const list = window.matchMedia(query);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  };
  const getSnapshot = () => (typeof window === "undefined" || !window.matchMedia ? fallback : window.matchMedia(query).matches);
  return { subscribe, getSnapshot, getServerSnapshot: () => fallback };
}

const reducedStore = mediaQueryStore(REDUCED_MOTION_QUERY, false);
const finePointerStore = mediaQueryStore(FINE_POINTER_QUERY, true);

export function usePrefersReducedMotion(): boolean {
  const prefers = useSyncExternalStore(reducedStore.subscribe, reducedStore.getSnapshot, reducedStore.getServerSnapshot);
  return prefers || isReducedMotionForced();
}

export function usePointerFine(): boolean {
  return useSyncExternalStore(finePointerStore.subscribe, finePointerStore.getSnapshot, finePointerStore.getServerSnapshot);
}

/** The landing wrapper. Colour worlds and motion flags are written here, never on <html>, so nothing leaks to other routes. */
export function getHomeRoot(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.querySelector<HTMLElement>("[data-sbk-root]");
}
