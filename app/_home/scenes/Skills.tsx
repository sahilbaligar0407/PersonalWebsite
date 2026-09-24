"use client";
import { Fragment, useRef } from "react";
import { SKILLS } from "../content";
import { KineticStatement } from "../recipes/KineticStatement";
import { VelocityMarquee } from "../recipes/VelocityMarquee";
import { useColorWorld } from "../recipes/ColorWorld";
import { useSceneMotion } from "../runtime/motion";
import { SceneFrame } from "../runtime/SceneFrame";

const G = SKILLS.groups;
const ROWS: { items: string[]; direction: 1 | -1 }[] = [
  { items: [...(G[0]?.items ?? []), ...(G[1]?.items ?? [])], direction: 1 },
  { items: [...(G[3]?.items ?? [])], direction: -1 },
  { items: [...(G[2]?.items ?? []), ...(G[4]?.items ?? []), ...(G[5]?.items ?? [])], direction: 1 },
];

export default function Skills() {
  const root = useRef<HTMLElement>(null);
  useColorWorld(root, "base");

  useSceneMotion(root, ({ gsap, q, reducedMotion, isMobile, tempo }) => {
    const [grid] = q(".skills__groups");
    if (reducedMotion || !grid) return;
    gsap.from(q(".skills__group"), {
      autoAlpha: 0,
      y: isMobile ? tempo.distance / 2 : tempo.distance,
      duration: tempo.duration,
      ease: tempo.ease,
      stagger: tempo.stagger,
      scrollTrigger: { trigger: grid, start: "top 85%", once: true },
    });
  });

  return (
    <SceneFrame id="skills" ref={root} label={SKILLS.label} className="skills">
      <div className="skills__head">
        <p className="skills__label sbk-label">{SKILLS.label}</p>
        <KineticStatement text={SKILLS.title} as="h2" mode="lines" size="l" align="start" accentItalic accentFont="display" className="skills__title" />
      </div>

      <div className="skills__marquees" aria-hidden="true">
        {ROWS.map((row, r) => (
          <VelocityMarquee key={r} speed={60 + r * 12} direction={row.direction} skew={8} copies={3} className="skills__marquee">
            {row.items.map((item, i) => (
              <Fragment key={item}>
                <span className={(i + r) % 2 ? "skills__word skills__word--serif" : "skills__word"}>{item}</span>
                <span className="skills__star">{"✦"}</span>
              </Fragment>
            ))}
          </VelocityMarquee>
        ))}
      </div>

      <div className="skills__groups">
        {SKILLS.groups.map((group) => (
          <section key={group.name} className="skills__group" aria-label={group.name}>
            <h3 className="skills__group-name sbk-label">{group.name}</h3>
            <ul className="skills__list">
              {group.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </SceneFrame>
  );
}
