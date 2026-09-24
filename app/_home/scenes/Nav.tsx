"use client";
import { useEffect, useRef, useState } from "react";
import { LINKS, NAV } from "../content";
import { useSceneMotion } from "../runtime/motion";

/** Fixed top bar: hides while scrolling down, returns on scroll up. Colours follow the active colour world. */
export default function Nav() {
  const root = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);

  useSceneMotion(root, ({ ScrollTrigger, scope, reducedMotion }) => {
    const trigger = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        const y = self.scroll();
        scope.dataset.scrolled = y > 40 ? "true" : "false";
        if (reducedMotion) return;
        scope.dataset.hidden = self.direction === 1 && y > 240 ? "true" : "false";
      },
    });
    return () => trigger.kill();
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <nav ref={root} className="sbk-nav" aria-label="Primary" data-open={open ? "true" : "false"}>
      <a href="#about" className="sbk-nav__mark" aria-label="Sahil Baligar, back to top">
        SB
      </a>
      <ul className="sbk-nav__links" id="sbk-nav-links">
        {NAV.map((item) => (
          <li key={item.href}>
            <a href={item.href} className="sbk-nav__link" onClick={() => setOpen(false)}>
              {item.name}
            </a>
          </li>
        ))}
      </ul>
      <div className="sbk-nav__end">
        <a href={LINKS.resume} className="sbk-nav__resume">
          Résumé
        </a>
        <button
          type="button"
          className="sbk-nav__toggle"
          aria-expanded={open}
          aria-controls="sbk-nav-links"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>
    </nav>
  );
}
