"use client";
import { useRef } from "react";
import { CONTACT, LINKS, SOCIALS } from "../content";
import { CurvedEdge } from "../recipes/CurvedEdge";
import { DrawPath } from "../recipes/DrawPath";
import { useColorWorld } from "../recipes/ColorWorld";
import { useMotion } from "../runtime/motion";
import { SceneFrame } from "../runtime/SceneFrame";
import { SocialIcon, iconFor } from "./Icons";

export default function Contact() {
  const root = useRef<HTMLElement>(null);
  const { scrollTo } = useMotion();
  useColorWorld(root, { background: "#c7d0b5", ink: "#12140f", accent: "#2f5a17" });

  return (
    <SceneFrame id="contact" ref={root} as="footer" label={CONTACT.label} className="closing" fullHeight={false}>
      <CurvedEdge background="#eee8da" ink="#161512" depth={0.2}>
        <div className="closing__inner">
          <h2 className="closing__label sbk-label">{CONTACT.label}</h2>
          <p className="closing__title">
            <span className="closing__line">
              <DrawPath preset="underline" color="#b2410f" strokeWidth={5}>
                <span>{CONTACT.lineOne}</span>
              </DrawPath>
            </span>
            <span className="closing__line closing__line--serif">
              <DrawPath preset="circle" placement="around" color="#b2410f" strokeWidth={4} delay={0.4}>
                <span>{CONTACT.lineTwo}</span>
              </DrawPath>
            </span>
          </p>

          <div className="closing__copy">
            <p className="closing__body">{CONTACT.body}</p>
            <p className="closing__note">{CONTACT.note}</p>
          </div>

          <div className="closing__actions">
            <a href={LINKS.email} className="closing__email">
              <span className="closing__email-label sbk-label">{CONTACT.email}</span>
              <span className="closing__email-address">{LINKS.emailText}</span>
            </a>
            <ul className="closing__links">
              {SOCIALS.map((s) => (
                <li key={s.href}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className="closing__link">
                    <SocialIcon name={iconFor(s.label)} />
                    <span className="closing__link-name">{s.label}</span>
                    <span className="closing__link-handle">{s.handle}</span>
                  </a>
                </li>
              ))}
              <li>
                <a href={LINKS.resume} className="closing__link">
                  <span className="closing__doc" aria-hidden="true">
                    {"↓"}
                  </span>
                  <span className="closing__link-name">{CONTACT.resume}</span>
                  <span className="closing__link-handle">PDF</span>
                </a>
              </li>
            </ul>
          </div>

          <div className="closing__foot">
            <p className="closing__copyright">
              © {new Date().getFullYear()} {CONTACT.footer}
            </p>
            <button type="button" className="closing__cta" onClick={() => scrollTo("#about")}>
              {CONTACT.back}
            </button>
          </div>
        </div>
      </CurvedEdge>
    </SceneFrame>
  );
}
