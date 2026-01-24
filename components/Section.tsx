"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface SectionProps {
  id: string;
  children: ReactNode;
  bgClass?: string;
  className?: string;
}

export default function Section({ id, children, bgClass = "", className = "" }: SectionProps) {
  return (
    <section
      id={id}
      className={`relative min-h-screen py-20 px-4 sm:px-6 lg:px-8 grain-texture ${bgClass} ${className}`}
    >
      <div className="max-w-7xl mx-auto">{children}</div>
    </section>
  );
}
