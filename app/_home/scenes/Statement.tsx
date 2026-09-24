"use client";
import { Fragment, useRef } from "react";
import { ABOUT } from "../content";
import { KineticStatement } from "../recipes/KineticStatement";
import { VelocityMarquee } from "../recipes/VelocityMarquee";
import { useColorWorld } from "../recipes/ColorWorld";
import { useSceneMotion } from "../runtime/motion";
import { SceneFrame } from "../runtime/SceneFrame";

const SAGE = { background: "#c7d0b5", ink: "#12140f", accent: "#2f5a17" } as const;

export default function Statement() {
  const root = useRef<HTMLElement>(null);
  useColorWorld(root, SAGE);

  useSceneMotion(root, ({ gsap, q, reducedMotion, isMobile, tempo }) => {
    const [facts] = q(".statement__facts");
    if (reducedMotion || !facts) return;
    gsap.from(q(".statement__fact"), {
      autoAlpha: 0,
      y: isMobile ? tempo.distance / 2 : tempo.distance,
      duration: tempo.duration,
      ease: tempo.ease,
      stagger: tempo.stagger * 1.5,
      scrollTrigger: { trigger: facts, start: "top 85%", once: true },
    });
  });

  return (
    <SceneFrame id="about-me" ref={root} label="About" className="statement">
      <h2 className="statement__label sbk-label">{ABOUT.label}</h2>
      <KineticStatement text={ABOUT.statement} as="p" mode="lines+words" size="l" accentFont="body" className="statement__text" />
      <ul className="statement__facts">
        {ABOUT.facts.map((fact) => (
          <li key={fact} className="statement__fact">
            {fact}
          </li>
        ))}
      </ul>
      <div className="statement__marquee-wrap" aria-hidden="true">
        <VelocityMarquee speed={70} skew={10} className="statement__marquee">
          {ABOUT.marquee.map((word, i) => (
            <Fragment key={word}>
              <span className={i % 2 ? "statement__word statement__word--serif" : "statement__word"}>{word}</span>
              <span className="statement__star">{"✦"}</span>
            </Fragment>
          ))}
        </VelocityMarquee>
      </div>
    </SceneFrame>
  );
}
