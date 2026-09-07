"use client";

import { HeroWithUpload } from "./HeroWithUpload";
import { FeatureSection } from "./FeatureSection";
import { HowItWorksSection } from "./HowItWorksSection";
import { ShowcaseSection } from "./ShowcaseSection";
import { LandingFooter } from "./LandingFooter";

export function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-navbar">
        <div className="landing-container landing-navbar-inner">
          <span className="landing-navbar-brand">
            <span className="landing-navbar-logo">SC</span> SmartCal
          </span>
        </div>
      </header>
      <main>
        <HeroWithUpload />
        <FeatureSection />
        <HowItWorksSection />
        <ShowcaseSection />
      </main>
      <LandingFooter />
    </div>
  );
}
