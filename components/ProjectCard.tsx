"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import Modal from "./Modal";

interface ProjectCardProps {
  title: string;
  description: string;
  status: "live" | "wip";
  link?: string;
  delay?: number;
}

export default function ProjectCard({ title, description, status, link, delay = 0 }: ProjectCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    if (status === "live" && link) {
      window.open(link, "_blank", "noopener,noreferrer");
    } else {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay }}
        whileHover={{ y: -5 }}
        onClick={handleClick}
        className="group relative bg-gray-900/50 border border-gray-800 rounded-xl p-6 cursor-pointer transition-all hover:border-accent/50 hover:shadow-lg hover:shadow-accent/10"
      >
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-bold text-white group-hover:text-accent transition-colors">
            {title}
          </h3>
          {status === "live" ? (
            <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
              LIVE
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-medium">
              WIP
            </span>
          )}
        </div>

        <p className="text-gray-400 mb-4 leading-relaxed">{description}</p>

        <div className="flex items-center text-accent text-sm font-medium group-hover:gap-2 transition-all">
          {status === "live" ? (
            <>
              Visit Website
              <svg
                className="h-4 w-4 ml-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </>
          ) : (
            <>
              Learn More
              <svg
                className="h-4 w-4 ml-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </>
          )}
        </div>

        {/* Subtle glow effect on hover */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-accent/0 via-accent/5 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </motion.div>

      {status === "wip" && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={title}
          description={description}
        />
      )}
    </>
  );
}
