"use client";
import { useRef } from "react";
import { REVEAL } from "../content";
import { ClipReveal } from "../recipes/ClipReveal";
import { useColorWorld } from "../recipes/ColorWorld";
import { SceneFrame } from "../runtime/SceneFrame";

export default function Reveal() {
  const root = useRef<HTMLElement>(null);
  useColorWorld(root, "base");

  return (
    <SceneFrame id="projects" ref={root} label={REVEAL.eyebrow} className="reveal">
      <ClipReveal media={REVEAL.media} shape="rounded" inset={0.3} counterScale={1.35} length={1.4} veil={0.55}>
        <p className="reveal__eyebrow sbk-label">{REVEAL.eyebrow}</p>
        <h2 className="reveal__headline">{REVEAL.headline}</h2>
      </ClipReveal>
    </SceneFrame>
  );
}
