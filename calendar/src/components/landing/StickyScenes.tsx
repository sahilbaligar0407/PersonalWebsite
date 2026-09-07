"use client";

import { HeroIntro } from "./HeroIntro";
import { ProblemScene } from "./ProblemScene";
import { ZoomParallaxScene } from "./ZoomParallaxScene";
import { CompareScene } from "./CompareScene";
import { FeaturesScene } from "./FeaturesScene";
import { HeroUpload } from "./HeroUpload";
import { Footer } from "@/components/home/Footer";

export function StickyScenes() {
  return (
    <div className="relative">
      {/* Each sticky scene has solid bg-background so it fully occludes previous content */}
      {/* Scene 1: Hero Intro */}
      <div className="sticky top-0 min-h-screen flex items-center justify-center bg-background isolate">
        <HeroIntro />
      </div>

      {/* Scene 2: Problem Statement */}
      <div className="sticky top-0 min-h-screen flex items-center justify-center bg-background isolate">
        <ProblemScene />
      </div>

      {/* Scene 3: Zoom Parallax (owns its own tall scroll container) */}
      <div className="bg-background">
        <ZoomParallaxScene />
      </div>

      {/* Scene 4: Compare */}
      <div className="sticky top-0 min-h-screen flex items-center justify-center bg-background isolate">
        <CompareScene />
      </div>

      {/* Scene 5: Features */}
      <div className="sticky top-0 min-h-screen flex items-center justify-center bg-background isolate">
        <FeaturesScene />
      </div>

      {/* Scene 6: Calendar Paste CTA */}
      <div className="sticky top-0 min-h-screen flex items-center justify-center bg-background isolate">
        <HeroUpload />
      </div>

      {/* Scene 7: Footer */}
      <Footer />
    </div>
  );
}
