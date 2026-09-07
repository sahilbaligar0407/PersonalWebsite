"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
import { motion } from "framer-motion";

export function ShowcaseSection() {
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
          Your calendar, simplified
        </motion.h2>
        <motion.p
          className="landing-section-subtitle"
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          One view. All your assignments. Color-coded by course.
        </motion.p>

        <motion.div
          className="landing-showcase"
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="landing-showcase-mock">
            <div className="landing-mock-header">
              <span className="landing-mock-dot" />
              <span className="landing-mock-dot" />
              <span className="landing-mock-dot" />
            </div>
            <div className="landing-mock-content">
              <div className="landing-mock-cal">
                <div className="landing-mock-event" data-course="1">CS 251 — Homework 5</div>
                <div className="landing-mock-event" data-course="2">STAT 350 — Quiz 2</div>
                <div className="landing-mock-event" data-course="3">COM 217 — Presentation</div>
                <div className="landing-mock-event" data-course="1">CS 251 — Lab 3</div>
              </div>
              <div className="landing-mock-sidebar">
                <div className="landing-mock-label">Recommended</div>
                <div className="landing-mock-task">HW5 — Due tomorrow</div>
                <div className="landing-mock-task">Quiz 2 — Due Friday</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
