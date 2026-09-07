"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Compare } from "@/components/ui/compare";

const BEFORE_IMAGE =
  "https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=1200&q=90";
const AFTER_IMAGE =
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=90";

export function CompareScene() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-section-4"
    >
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-2">
            Traditional vs SmartCal
          </h2>
          <p className="text-muted-foreground">
            Paper planner · 12 months · chaos. vs One link · color-coded · smart.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex justify-center w-full h-[70vh] min-h-[400px] max-h-[800px]"
        >
          <Compare
            firstImage={BEFORE_IMAGE}
            secondImage={AFTER_IMAGE}
            className="w-full h-full min-w-0 min-h-0 rounded-2xl overflow-hidden"
            slideMode="drag"
            autoplay
            autoplayDuration={4000}
          />
        </motion.div>
      </div>
    </section>
  );
}
