"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import type { ReactNode } from "react";

interface ScrollSectionProps {
  id?: string;
  children: ReactNode;
  className?: string;
  bgClass?: string;
}

const fadeIn = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

export function ScrollSection({
  id,
  children,
  className = "",
  bgClass = "",
}: ScrollSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <motion.div
      ref={ref}
      id={id}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={fadeIn}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`relative ${bgClass} ${className}`}
    >
      {children}
    </motion.div>
  );
}
