/** Debounced ScrollTrigger refresh + "ready" signal (ported from the Kai Arden runtime). */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getHomeRoot } from "./media";

gsap.registerPlugin(ScrollTrigger);

let timer: ReturnType<typeof setTimeout> | undefined;

export function scheduleRefresh(delayMs = 120): void {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = undefined;
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
  }, delayMs);
}

export function refreshOnMediaLoad(scope: HTMLElement): () => void {
  const pending = Array.from(scope.querySelectorAll<HTMLImageElement>("img")).filter((el) => !el.complete);
  const onLoad = () => scheduleRefresh();
  for (const el of pending) el.addEventListener("load", onLoad, { once: true });
  return () => {
    for (const el of pending) el.removeEventListener("load", onLoad);
  };
}

/** Once fonts are ready and ScrollTrigger has measured, flag the root so intro animations can start. */
export function markReady(): () => void {
  let cancelled = false;
  const fonts = document.fonts ? document.fonts.ready.then(() => undefined) : Promise.resolve();
  void fonts.then(() => {
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (cancelled) return;
        ScrollTrigger.sort();
        ScrollTrigger.refresh();
        const root = getHomeRoot();
        if (root) root.dataset.dlReady = "true";
      }),
    );
  });
  return () => {
    cancelled = true;
  };
}
