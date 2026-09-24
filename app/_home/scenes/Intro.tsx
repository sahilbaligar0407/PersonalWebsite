"use client";
import { useRef } from "react";
import { HERO, LINKS, PORTRAIT, SOCIALS } from "../content";
import { Media } from "../recipes/Media";
import { RingText } from "../recipes/RingText";
import { SplitHeadlineIntro } from "../recipes/SplitHeadlineIntro";
import { useColorWorld } from "../recipes/ColorWorld";
import { useSceneMotion } from "../runtime/motion";
import { SceneFrame } from "../runtime/SceneFrame";
import { SocialIcon, iconFor } from "./Icons";

export default function Intro() {
  const root = useRef<HTMLElement>(null);
  useColorWorld(root, "base");

  useSceneMotion(root, ({ gsap, q, scope, reducedMotion, isMobile, tempo }) => {
    const portrait = q(".intro__portrait")[0];
    const photo = q(".intro__photo")[0];
    if (reducedMotion || !portrait || !photo) return;
    gsap.fromTo(
      portrait,
      { clipPath: "inset(100% 0% 0% 0% round 999px 999px 0px 0px)" },
      { clipPath: "inset(0% 0% 0% 0% round 999px 999px 0px 0px)", duration: tempo.duration * 1.2, ease: tempo.easeInOut, delay: 0.25 },
    );
    gsap.fromTo(photo, { scale: 1.18 }, { scale: 1, duration: tempo.duration * 1.6, ease: tempo.ease, delay: 0.25 });
    gsap.from(q(".intro__meta"), { autoAlpha: 0, y: tempo.distance / 2, duration: tempo.duration, ease: tempo.ease, delay: 0.9, stagger: tempo.stagger });
    if (isMobile) return;
    gsap.to(q(".intro__figure"), { yPercent: -14, ease: "none", scrollTrigger: { trigger: scope, start: "top top", end: "bottom top", scrub: true } });
    gsap.to(q(".intro__name"), { yPercent: -22, autoAlpha: 0.4, ease: "none", scrollTrigger: { trigger: scope, start: "top top", end: "bottom top", scrub: true } });
  });

  return (
    <SceneFrame id="about" ref={root} as="header" label="Sahil Baligar" className="intro">
      <p className="intro__top intro__meta sbk-label">{HERO.tagline}</p>

      <div className="intro__name">
        <SplitHeadlineIntro text={`${HERO.first}\n*${HERO.last}*`} split="chars" size="giant" accentFont="body" className="intro__title" />
      </div>

      <div className="intro__figure">
        <div className="intro__arch" aria-hidden="true" />
        <div className="intro__portrait">
          <Media media={PORTRAIT} priority className="intro__photo" />
        </div>
        <RingText text={HERO.ring} repeat={2} size="clamp(6.5rem, 9vw, 8.5rem)" color="accent" className="intro__ring">
          <span className="intro__arrow" aria-hidden="true">
            {"↓"}
          </span>
        </RingText>
      </div>

      <div className="intro__bottom intro__meta">
        <div className="intro__ctas">
          <a href={LINKS.email} className="intro__cta intro__cta--primary">
            {HERO.ctaPrimary}
          </a>
          <a href="#projects" className="intro__cta">
            {HERO.ctaSecondary}
          </a>
        </div>
        <ul className="intro__socials" aria-label="Social links">
          {SOCIALS.filter((s) => s.label !== "GitHub (personal)").map((s) => (
            <li key={s.href}>
              <a href={s.href} target="_blank" rel="noopener noreferrer" className="intro__social" aria-label={s.label}>
                <SocialIcon name={iconFor(s.label)} />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </SceneFrame>
  );
}
