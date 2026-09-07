"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
import { motion } from "framer-motion";

const FEATURES = [
  {
    title: "One link, one calendar",
    description: "Paste your Brightspace subscription URL. All your assignments appear in one place — no copy-pasting, no duplicates.",
  },
  {
    title: "AI-powered parsing",
    description: "Paste syllabus text or upload screenshots. We extract due dates and assignments automatically.",
  },
  {
    title: "Recommended tasks",
    description: "See what to work on next. Tasks are sorted by due date so you never miss a deadline.",
  },
  {
    title: "Color-coded by course",
    description: "Each class gets its own color. Your calendar stays organized and readable.",
  },
];

export function FeatureSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section ref={ref} className="landing-section landing-section-alt">
      <div className="landing-container">
        <motion.h2
          className="landing-section-title"
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          Built for students
        </motion.h2>
        <motion.p
          className="landing-section-subtitle"
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          A simple tool that does one thing well: keep your assignments in order.
        </motion.p>

        <div className="landing-feature-grid">
          {FEATURES.map((feature, i) => (
            <motion.article
              key={feature.title}
              className="landing-feature-card"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.15 + i * 0.08 }}
            >
              <h3 className="landing-feature-title">{feature.title}</h3>
              <p className="landing-feature-desc">{feature.description}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
