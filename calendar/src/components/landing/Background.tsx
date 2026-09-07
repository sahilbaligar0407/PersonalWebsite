"use client";

import { motion, useScroll, useTransform } from "framer-motion";

/**
 * Immersive background inspired by PersonalWebsiteMaker:
 * - Grain texture overlay
 * - Section-aware gradient shifts on scroll
 */
export function Background() {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.3]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 1.2]);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base gradient mesh */}
      <motion.div
        style={{ scale }}
        className="absolute inset-0"
      >
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-25 blur-[140px]"
          style={{ background: "hsl(175 80% 50%)" }}
        />
        <div
          className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] rounded-full opacity-15 blur-[100px]"
          style={{ background: "hsl(220 80% 60%)" }}
        />
        <div
          className="absolute top-2/3 left-1/4 w-[400px] h-[400px] rounded-full opacity-10 blur-[80px]"
          style={{ background: "hsl(175 70% 45%)" }}
        />
      </motion.div>

      {/* Grain texture overlay */}
      <motion.div
        style={{ opacity }}
        className="absolute inset-0 grain-texture"
      />

      {/* Section gradients - subtle radial overlays */}
      <div className="absolute inset-0 bg-section-1" />
    </div>
  );
}
