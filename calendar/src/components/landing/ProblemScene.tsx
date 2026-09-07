"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

export function ProblemScene() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-section-2"
    >
      <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-6">
            Scattered syllabi. Missed deadlines. Multiple platforms.
          </h2>
          <p className="text-lg text-muted-foreground">
            Sound familiar? You’re juggling Brightspace, Google Calendar, and a
            paper planner — and nothing stays in sync.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
