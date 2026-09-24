"use client";
import { useRef } from "react";
import { EDUCATION } from "../content";
import { DrawPath } from "../recipes/DrawPath";
import { KineticStatement } from "../recipes/KineticStatement";
import { useColorWorld } from "../recipes/ColorWorld";
import { useSceneMotion } from "../runtime/motion";
import { SceneFrame } from "../runtime/SceneFrame";

export default function Education() {
  const root = useRef<HTMLElement>(null);
  useColorWorld(root, { background: "#c7d0b5", ink: "#12140f", accent: "#2f5a17" });

  useSceneMotion(root, ({ gsap, q, reducedMotion, isMobile, tempo }) => {
    const [cols] = q(".edu__cols");
    if (reducedMotion || !cols) return;
    gsap.from(q(".edu__rise"), {
      autoAlpha: 0,
      y: isMobile ? tempo.distance / 2 : tempo.distance,
      duration: tempo.duration,
      ease: tempo.ease,
      stagger: tempo.stagger * 1.5,
      scrollTrigger: { trigger: root.current ?? cols, start: "top 60%", once: true },
    });
  });

  return (
    <SceneFrame id="education" ref={root} label={EDUCATION.label} className="edu">
      <h2 className="edu__label sbk-label">{EDUCATION.label}</h2>

      <div className="edu__main">
        <KineticStatement text={EDUCATION.school} as="p" mode="lines" size="xl" align="start" className="edu__school" />
        <p className="edu__degree edu__rise">
          {EDUCATION.degree}
          <span className="edu__period">{EDUCATION.period}</span>
        </p>
        <p className="edu__honours edu__rise">
          <DrawPath preset="circle" placement="around" color="accent" strokeWidth={3} delay={0.3}>
            <span>{EDUCATION.honours}</span>
          </DrawPath>
        </p>
        <p className="edu__activities edu__rise">
          <span className="edu__key sbk-label">Activities</span>
          {EDUCATION.activities}
        </p>
      </div>

      <div className="edu__cols">
        <section className="edu__col edu__rise" aria-label={EDUCATION.earlierLabel}>
          <h3 className="edu__col-title sbk-label">{EDUCATION.earlierLabel}</h3>
          <p className="edu__col-lead">{EDUCATION.highSchool}</p>
          <p className="edu__col-text">{EDUCATION.highSchoolDetail}</p>
          <p className="edu__col-text">
            <span className="edu__key sbk-label">Certifications</span>
            {EDUCATION.certifications}
          </p>
        </section>
        <section className="edu__col edu__rise" aria-label={EDUCATION.outsideLabel}>
          <h3 className="edu__col-title sbk-label">{EDUCATION.outsideLabel}</h3>
          <ul className="edu__outside">
            {EDUCATION.outside.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
    </SceneFrame>
  );
}
