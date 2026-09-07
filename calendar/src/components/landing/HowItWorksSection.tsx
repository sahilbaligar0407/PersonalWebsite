"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
import { motion } from "framer-motion";

const STEPS = [
  { num: "1", title: "Paste your link", text: "Get your calendar subscription URL from Brightspace or your LMS." },
  { num: "2", title: "We import it", text: "We fetch your events, parse dates, and add them to your calendar." },
  { num: "3", title: "Stay on track", text: "See recommended tasks, color-coded courses, and never miss a deadline." },
];

export function HowItWorksSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section ref={ref} className="landing-section">
      <div className="landing-container">
        <motion.h2
          className="landing-section-title"
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          How it works
        </motion.h2>

        <div className="landing-steps">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              className="landing-step"
              initial={{ opacity: 0, x: -12 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.12 }}
            >
              <span className="landing-step-num">{step.num}</span>
              <div>
                <h3 className="landing-step-title">{step.title}</h3>
                <p className="landing-step-text">{step.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
