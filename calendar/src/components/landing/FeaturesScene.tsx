"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import DisplayCards from "@/components/ui/display-cards";
import { FileText, Lightbulb, Calendar } from "lucide-react";

const FEATURES = [
  {
    title: "AI Parsing",
    description: "Syllabus → structured schedule",
    date: "Automatic",
    icon: <FileText className="size-4 text-primary" />,
    iconClassName: "text-primary",
    titleClassName: "text-primary",
    className:
      "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
  },
  {
    title: "Recommended Tasks",
    description: "AI suggests what to do next",
    date: "Smart prioritization",
    icon: <Lightbulb className="size-4 text-primary" />,
    iconClassName: "text-primary",
    titleClassName: "text-primary",
    className:
      "[grid-area:stack] translate-x-16 translate-y-10 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
  },
  {
    title: "One Calendar",
    description: "All your courses in one place",
    date: "No duplicates",
    icon: <Calendar className="size-4 text-primary" />,
    iconClassName: "text-primary",
    titleClassName: "text-primary",
    className: "[grid-area:stack] translate-x-32 translate-y-20 hover:translate-y-10",
  },
];

export function FeaturesScene() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-section-3"
    >
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-2">
            Built for students
          </h2>
          <p className="text-muted-foreground">
            AI parsing, smart recommendations, one calendar.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex justify-center"
        >
          <DisplayCards cards={FEATURES} />
        </motion.div>
      </div>
    </section>
  );
}
