"use client";

import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Section from "@/components/Section";
import ProjectCard from "@/components/ProjectCard";
import Image from "next/image";
// Social icons as SVG components
const LinkedinIcon = () => (
  <svg
    className="h-5 w-5 text-gray-400 group-hover:text-accent transition-colors"
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const GithubIcon = () => (
  <svg
    className="h-5 w-5 text-gray-400 group-hover:text-accent transition-colors"
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const InstagramIcon = () => (
  <svg
    className="h-5 w-5 text-gray-400 group-hover:text-accent transition-colors"
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const MailIcon = () => (
  <svg
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

export default function Home() {
  const socialLinks = [
    { icon: LinkedinIcon, href: "https://www.linkedin.com/in/sahil-baligar/", label: "LinkedIn" },
    { icon: GithubIcon, href: "https://github.com/sahilbaligar0407", label: "GitHub" },
    { icon: InstagramIcon, href: "https://www.instagram.com/sahilb_0/", label: "Instagram" },
  ];

  const experiences = [
    {
      title: "Software Engineering Intern",
      company: "Hilton (Connected Room)",
      period: "May 2026 – Aug 2026",
      location: "Upcoming",
      isUpcoming: true,
      bullets: [
        "Upcoming 10-week summer internship with Connected Room team",
        "Software engineering role starting May 2026",
      ],
    },
    {
      title: "QA Intern",
      company: "Sedgwick",
      period: "May 2025 – Aug 2025",
      location: "Memphis, TN (Hybrid)",
      bullets: [
        "Conducted comprehensive RPA bot testing to ensure performance and reliability",
        "Authored detailed test plans to improve testing efficiency",
        "Used UIPath for automation and Playwright for end-to-end testing",
        "Supported Sedgwick's mission as a global leader in risk and claims management through QA improvements",
      ],
    },
    {
      title: "Undergraduate Student Researcher",
      company: "John Deere",
      period: "Aug 2024 – May 2025",
      location: "West Lafayette, Indiana",
      bullets: [
        "The Data Mine, Purdue University",
        "Built Python ML models to estimate parts demand quantity",
        "Used models: Random Forest, XGBoost, Holt-Winters, custom polynomial regression",
        "Evaluated performance with RMSE and identified seasonal patterns",
        "Worked in Agile/Kanban weekly sprints",
      ],
    },
    {
      title: "Software Engineer Intern",
      company: "Roar Inc.",
      period: "Sep 2022 – Apr 2023",
      location: "Remote (Mountain View, CA)",
      bullets: [
        "Built web portal joinroar.co using NodeJS, JavaScript, Pug, GitHub",
        "Worked under CEO at a STEM career-empowerment startup",
        "Gained experience in building, testing, deployment, and collaboration",
      ],
    },
  ];

  const projects = [
    {
      title: "GetUrSeat",
      description:
        "A side B2B SaaS project for wellness services/companies: landing pages + dashboard for revenue tracking and client management.",
      status: "live" as const,
      link: "https://geturseat.com",
    },
    {
      title: "Shorts/Reels Virality Engine",
      description:
        "Shorts/Reel styled video clipping with captions, facial tracking, and a virality engine to gauge the most successful clips.",
      status: "wip" as const,
    },
    {
      title: "QA Document Generator",
      description:
        "AI document generator catered for QA items (test plans, pass/fail tables, evidence, structured outputs).",
      status: "wip" as const,
    },
    {
      title: "Mobile Outfits App",
      description:
        "Mobile app with a wardrobe to store clothing pieces online. Build and store outfits manually or use AI suggestions. Includes AI to generate a Pinterest-board style image or dress up an AI avatar to preview how you'd look.",
      status: "wip" as const,
    },
  ];

  const skills = {
    Languages: ["Java", "Python", "C", "JavaScript", "R"],
    "Frameworks/Tools": ["Playwright", "UIPath", "GitHub", "NodeJS"],
    "ML/Data": ["XGBoost", "Random Forest", "Holt-Winters", "RMSE", "Forecasting"],
    Web: ["Full-stack web development", "Dashboards", "Product UI"],
  };

  return (
    <main className="relative">
      <Navigation />

      {/* Hero / About Section */}
      <Section id="about" bgClass="bg-section-1">
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-12 pt-24">
          {/* Profile Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="relative w-64 h-64 lg:w-80 lg:h-80 rounded-2xl overflow-hidden border-2 border-accent/30 shadow-2xl shadow-accent/20"
          >
            <Image
              src="/profile.jpg"
              alt="Sahil Baligar"
              fill
              className="object-cover"
              priority
            />
          </motion.div>

          {/* Content */}
          <div className="flex-1 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h1 className="text-5xl lg:text-6xl font-bold text-white mb-4">
                Sahil Baligar
              </h1>
              <p className="text-xl lg:text-2xl text-accent font-semibold mb-2">
                Computer Science student @ Purdue University
              </p>
              <p className="text-lg text-gray-300 leading-relaxed max-w-2xl">
                I build software products and automation that turn messy workflows into clean,
                reliable systems.
              </p>
            </motion.div>

            {/* Quick Facts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="space-y-2 text-gray-400"
            >
              <p>• Sophomore in Computer Science at Purdue University</p>
              <p>• Graduating Winter 2027</p>
              <p>• Interested in: product engineering, automation, QA systems, ML/analytics</p>
            </motion.div>

            {/* Social Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex items-center gap-4"
            >
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-lg bg-gray-900/50 border border-gray-800 hover:border-accent/50 hover:bg-accent/10 transition-all group"
                    aria-label={social.label}
                  >
                    <Icon />
                  </a>
                );
              })}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="flex flex-wrap gap-4 pt-4"
            >
              <a
                href="mailto:sahilbaligar@gmail.com"
                className="px-6 py-3 bg-accent hover:bg-accent-dark text-white rounded-lg font-semibold transition-all hover:shadow-lg hover:shadow-accent/50"
              >
                Let's Talk
              </a>
              <a
                href="#projects"
                className="px-6 py-3 bg-gray-900/50 border border-gray-800 hover:border-accent/50 text-white rounded-lg font-semibold transition-all"
              >
                View My Work
              </a>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* Experience Section */}
      <Section id="experience" bgClass="bg-section-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-12 text-center">
            Experience
          </h2>

          <div className="space-y-8">
            {experiences.map((exp, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-accent/30 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-2xl font-bold text-white">
                        {exp.title} — {exp.company}
                      </h3>
                      {exp.isUpcoming && (
                        <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium">
                          Upcoming
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400">
                      {exp.period} | {exp.location}
                    </p>
                  </div>
                </div>
                <ul className="space-y-2 mt-4">
                  {exp.bullets.map((bullet, i) => (
                    <li key={i} className="text-gray-300 flex items-start gap-2">
                      <span className="text-accent mt-2">•</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Section>

      {/* Projects Section */}
      <Section id="projects" bgClass="bg-section-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-12 text-center">
            Projects
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((project, index) => (
              <ProjectCard
                key={index}
                title={project.title}
                description={project.description}
                status={project.status}
                link={project.link}
                delay={index * 0.1}
              />
            ))}
          </div>
        </motion.div>
      </Section>

      {/* Skills Section */}
      <Section id="skills" bgClass="bg-section-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-12 text-center">
            Skills
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {Object.entries(skills).map(([category, items], index) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gray-900/50 border border-gray-800 rounded-xl p-6"
              >
                <h3 className="text-xl font-bold text-accent mb-4">{category}</h3>
                <div className="flex flex-wrap gap-2">
                  {items.map((skill, i) => (
                    <span
                      key={i}
                      className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-full text-gray-300 text-sm hover:border-accent/50 hover:text-accent transition-all"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Section>

      {/* Education Section */}
      <Section id="education" bgClass="bg-section-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-12 text-center">
            Education
          </h2>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Purdue University — B.S. Computer Science
              </h3>
              <p className="text-gray-400 mb-4">Aug 2024 – Winter 2027</p>
              <p className="text-gray-300">
                <span className="text-accent">Activities:</span> Purdue Student Government — Board
                of Directors (Engagement Committee)
              </p>
            </div>

            <details className="group">
              <summary className="cursor-pointer text-accent hover:text-accent-light font-medium list-none">
                Earlier background
              </summary>
              <div className="mt-4 pl-4 border-l-2 border-gray-800 space-y-2">
                <p className="text-gray-300">
                  <span className="font-semibold">Collierville High School</span> (GPA 4.7541, Rank
                  15/700, Cum Laude)
                </p>
                <p className="text-gray-300">
                  <span className="font-semibold">Certifications:</span> TestOut Network Pro, TestOut
                  PC Pro (University of Memphis)
                </p>
              </div>
            </details>
          </div>
        </motion.div>
      </Section>

      {/* Contact Section */}
      <Section id="contact" bgClass="bg-section-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">Get In Touch</h2>
          <p className="text-gray-400 text-lg mb-8">
            Open to internships, software roles, and building ambitious products.
          </p>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 space-y-6">
            <a
              href="mailto:sahilbaligar@gmail.com"
              className="inline-flex items-center gap-2 px-8 py-4 bg-accent hover:bg-accent-dark text-white rounded-lg font-semibold transition-all hover:shadow-lg hover:shadow-accent/50"
            >
              <MailIcon />
              Email me
            </a>

            <div className="flex justify-center gap-4 pt-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-lg bg-gray-800/50 border border-gray-700 hover:border-accent/50 hover:bg-accent/10 transition-all group"
                    aria-label={social.label}
                  >
                    <Icon />
                  </a>
                );
              })}
            </div>
          </div>
        </motion.div>
      </Section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} Sahil Baligar. All rights reserved.</p>
      </footer>
    </main>
  );
}
