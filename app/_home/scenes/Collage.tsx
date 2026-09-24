"use client";
import { useRef } from "react";
import { COLLAGE, PORTRAIT } from "../content";
import { KineticStatement } from "../recipes/KineticStatement";
import { ParallaxCollage, type CollageItem } from "../recipes/ParallaxCollage";
import { useColorWorld } from "../recipes/ColorWorld";
import { SceneFrame } from "../runtime/SceneFrame";

const shot = (name: string, alt: string, position: string) => ({ src: `/home/${name}.jpg`, alt, width: 1440, height: 900, position });

const ITEMS: CollageItem[] = [
  { slot: "portrait", media: { ...PORTRAIT, position: "50% 20%" }, x: 5, y: 4, width: 17, ratio: "4 / 5", speed: 1.2, caption: "Sahil Baligar" },
  { slot: "rrender", media: shot("rrender", "RRender.ai home page", "0% 0%"), x: 66, y: 2, width: 22, ratio: "16 / 10", speed: 0.5, caption: "RRender.ai" },
  { slot: "guard-logo", media: shot("guardcmd", "GuardCMD wordmark", "50% 12%"), x: 38, y: 0, width: 13, ratio: "1 / 1", speed: 0.35 },
  { slot: "smartcal", media: shot("smartcal", "SmartCal home page", "40% 40%"), x: 79, y: 30, width: 17, ratio: "3 / 4", speed: 1.1, caption: "SmartCal" },
  { slot: "geturseat", media: shot("geturseat", "GetUrSeat home page", "50% 40%"), x: 3, y: 44, width: 19, ratio: "5 / 4", speed: 0.7, caption: "GetUrSeat" },
  { slot: "guardcmd", media: shot("guardcmd", "GuardCMD home page", "50% 0%"), x: 67, y: 62, width: 25, ratio: "16 / 10", speed: 1.35, caption: "GuardCMD" },
  { slot: "rrender-app", media: shot("rrender", "RRender.ai dashboard preview", "92% 88%"), x: 17, y: 74, width: 15, ratio: "2 / 3", speed: 0.9 },
  { slot: "salon", media: shot("geturseat", "GetUrSeat salon photograph", "88% 70%"), x: 46, y: 86, width: 11, ratio: "4 / 5", speed: 0.45 },
];

export default function Collage() {
  const root = useRef<HTMLElement>(null);
  useColorWorld(root, { background: "#c7d0b5", ink: "#12140f", accent: "#2f5a17" });

  return (
    <SceneFrame id="shipping" ref={root} label={COLLAGE.label} className="collage">
      <ParallaxCollage items={ITEMS} height={1.5} drift={200}>
        <div className="collage__copy">
          <p className="collage__label sbk-label">{COLLAGE.label}</p>
          <KineticStatement text={COLLAGE.headline} as="h2" mode="lines" size="l" accentItalic accentFont="display" className="collage__headline" />
          <p className="collage__body">{COLLAGE.body}</p>
        </div>
      </ParallaxCollage>
    </SceneFrame>
  );
}
