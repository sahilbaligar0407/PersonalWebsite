"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ZoomParallax } from "@/components/ui/zoom-parallax";

const ZOOM_IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=800&q=85",
    alt: "Paper planner",
  },
  {
    src: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=85",
    alt: "University lecture",
  },
  {
    src: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=85",
    alt: "Scattered papers",
  },
  {
    src: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&q=85",
    alt: "Paper calendar",
  },
  {
    src: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=85",
    alt: "Desktop with calendar",
  },
  {
    src: "https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=1200&q=90",
    alt: "SmartCal - Online calendar platform",
  },
];

export function ZoomParallaxScene() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0 });

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-background"
    >
      <div className="absolute inset-x-0 top-0 z-10 pt-16 pb-4 text-center pointer-events-none">
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          className="text-sm text-muted-foreground"
        >
          Scroll to zoom in
        </motion.p>
      </div>
      <ZoomParallax images={ZOOM_IMAGES} />
    </section>
  );
}
