"use client";
import { useRef } from "react";
import { EXPERIENCE } from "../content";
import { PinnedStage, usePinnedTimeline } from "../recipes/PinnedStage";
import { useColorWorld } from "../recipes/ColorWorld";
import { SceneFrame } from "../runtime/SceneFrame";

const ROLES = EXPERIENCE.roles;

/** One chapter per role. Pinned: company words swap through a mask while meta + bullets crossfade. Static: a readable list. */
function Roles() {
  usePinnedTimeline((tl, { gsap, q }) => {
    const words = q(".xp__word");
    const details = q(".xp__detail");
    gsap.set(words.slice(1), { yPercent: 130 });
    gsap.set(details.slice(1), { autoAlpha: 0, y: 24 });
    const step = 1 / ROLES.length;
    for (let i = 1; i < words.length; i++) {
      const at = i * step;
      tl.to(words[i - 1] ?? [], { yPercent: -130, duration: 0.1 }, at)
        .to(words[i] ?? [], { yPercent: 0, duration: 0.1 }, at)
        .to(details[i - 1] ?? [], { autoAlpha: 0, y: -24, duration: 0.06 }, at)
        .to(details[i] ?? [], { autoAlpha: 1, y: 0, duration: 0.07 }, at + 0.05);
    }
  });

  return (
    <div className="xp__roles">
      {ROLES.map((role) => (
        <article key={role.company} className="xp__role">
          <div className="xp__word-mask">
            <h3 className="xp__word">
              <span className="sbk-sr">
                {role.title} — {role.company}
              </span>
              <span aria-hidden="true">{role.word}</span>
            </h3>
          </div>
          <div className="xp__detail">
            <p className="xp__title">
              {role.title} <span className="xp__at">at</span> {role.company}
            </p>
            <p className="xp__meta">
              <span>{role.period}</span>
              <span aria-hidden="true">{" · "}</span>
              <span>{role.location}</span>
            </p>
            <ul className="xp__bullets">
              {role.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
        </article>
      ))}
    </div>
  );
}

export default function Experience() {
  const root = useRef<HTMLElement>(null);
  useColorWorld(root, "base");

  return (
    <SceneFrame id="experience" ref={root} label={EXPERIENCE.label} className="xp">
      <PinnedStage
        length={3}
        stageClassName="xp__stage"
        timeline={(tl, { q }) => {
          tl.fromTo(q(".xp__bar-fill"), { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0).fromTo(q(".xp__dial"), { rotate: 0 }, { rotate: 300, duration: 1 }, 0);
        }}
      >
        <h2 className="xp__label sbk-label">{EXPERIENCE.label}</h2>
        <div className="xp__dial" aria-hidden="true" />
        <Roles />
        <div className="xp__bar" aria-hidden="true">
          <div className="xp__bar-fill" />
        </div>
      </PinnedStage>
    </SceneFrame>
  );
}
