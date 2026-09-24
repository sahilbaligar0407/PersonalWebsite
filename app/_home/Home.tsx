"use client";
/**
 * The sahilbaligar.com landing, rebuilt on the Kai Arden scroll-recipe grammar
 * (SplitHeadlineIntro + DrawPath, KineticStatement + ColorWorld, VelocityMarquee, ParallaxCollage,
 * PinnedStage chapters, ClipReveal, HorizontalTrack, StackedPanels, CurvedEdge).
 * Landing-only: styles are scoped to `.sbk`, colour worlds write to the `.sbk` root, not <html>.
 */
import "./styles/base.css";
import "./styles/recipes.css";
import "./styles/scenes.css";
import { MotionProvider } from "./runtime/motion";
import Nav from "./scenes/Nav";
import Intro from "./scenes/Intro";
import Statement from "./scenes/Statement";
import Collage from "./scenes/Collage";
import Experience from "./scenes/Experience";
import Reveal from "./scenes/Reveal";
import Products from "./scenes/Products";
import Repos from "./scenes/Repos";
import Skills from "./scenes/Skills";
import Education from "./scenes/Education";
import Contact from "./scenes/Contact";

export default function Home({ fontClassName }: { fontClassName: string }) {
  return (
    <div className={`sbk ${fontClassName}`} data-sbk-root="">
      <MotionProvider>
        <a className="sbk-skip" href="#main">
          Skip to content
        </a>
        <Nav />
        <main id="main" className="sbk-main">
          <Intro />
          <Statement />
          <Collage />
          <Experience />
          <Reveal />
          <Products />
          <Repos />
          <Skills />
          <Education />
        </main>
        <Contact />
      </MotionProvider>
    </div>
  );
}
