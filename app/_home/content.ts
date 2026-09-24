/**
 * Every word on the landing page. Sources: the previous sahilbaligar.com landing (app/page.tsx before the
 * redesign) and the GitHub profile README (github.com/sahil-baligar). `*word*` renders as an accent span.
 */
import type { MediaSource } from "./recipes/Media";

export const LINKS = {
  email: "mailto:sahilbaligar@gmail.com",
  emailText: "sahilbaligar@gmail.com",
  linkedin: "https://www.linkedin.com/in/sahil-baligar/",
  github: "https://github.com/sahil-baligar",
  githubPersonal: "https://github.com/sahilbaligar0407",
  instagram: "https://www.instagram.com/sahilb_0/",
  resume: "/resume",
  calendar: "/Calendar",
} as const;

export const SOCIALS = [
  { label: "LinkedIn", handle: "in/sahil-baligar", href: LINKS.linkedin },
  { label: "GitHub", handle: "@sahil-baligar", href: LINKS.github },
  { label: "GitHub (personal)", handle: "@sahilbaligar0407", href: LINKS.githubPersonal },
  { label: "Instagram", handle: "@sahilb_0", href: LINKS.instagram },
] as const;

export const PORTRAIT: MediaSource = { src: "/profile.jpg", alt: "Portrait of Sahil Baligar", width: 460, height: 460, position: "50% 30%" };

export const NAV = [
  { name: "About", href: "#about" },
  { name: "Experience", href: "#experience" },
  { name: "Projects", href: "#projects" },
  { name: "Skills", href: "#skills" },
  { name: "Contact", href: "#contact" },
] as const;

export const HERO = {
  first: "Sahil",
  last: "Baligar",
  tagline: "Full-Stack Developer & ML Engineer · CS @ Purdue University",
  ring: "Scroll to explore",
  ctaPrimary: "Let's Talk",
  ctaSecondary: "View My Work",
};

export const ABOUT = {
  label: "About",
  statement:
    "I build end-to-end products — from polished *React/TypeScript* front-ends to *Node/Django* back-ends — and work across *AI/ML* and data science to build clean reliable software.",
  facts: [
    "Junior in Computer Science at Purdue University",
    "Graduating Winter 2027 (Dean's List & Semester Honors)",
    "Interested in: Software Engineering, Machine Learning, Data Science & AI",
  ],
  marquee: ["Full-Stack Developer", "ML Engineer", "Always shipping", "always learning"],
};

export const COLLAGE = {
  label: "Shipping",
  headline: "Always shipping, *always learning*",
  body: "I build and run live products: GetUrSeat, RRender.ai and GuardCMD.",
};

export interface Role {
  title: string;
  company: string;
  word: string;
  period: string;
  location: string;
  bullets: string[];
}

export const EXPERIENCE: { label: string; roles: Role[] } = {
  label: "Experience",
  roles: [
    {
      title: "Data Science Intern",
      company: "FedEx",
      word: "FedEx",
      period: "Jun 2026 – Aug 2026",
      location: "Memphis, TN",
      bullets: [
        "Developed a Python-based machine learning forecasting model to predict package volumes using FedEx sorting logic and operational data",
        "Built an Agentic AI solution with Gemini and Vertex AI for business-insight retrieval and automated AI actions",
        "Contributed full-stack development across the chat UI, backend, web search, and ML integrations",
        "Shipped on GCP, Databricks, and Azure",
      ],
    },
    {
      title: "IT / QA Intern",
      company: "Sedgwick",
      word: "Sedgwick",
      period: "May 2025 – Aug 2025",
      location: "Memphis, TN",
      bullets: [
        "QA intern at a global leader in risk, claims, and loss management",
        "Conducted RPA bot testing and authored detailed test plans",
        "Automated workflows with UiPath and ran enterprise application testing with Playwright",
      ],
    },
    {
      title: "Undergraduate Researcher",
      company: "John Deere — The Data Mine, Purdue",
      word: "John Deere",
      period: "Aug 2024 – May 2025",
      location: "West Lafayette, IN",
      bullets: [
        "Built a Python ML model to predict parts demand using Random Forest, XGBoost, and custom polynomial regression",
        "Evaluated performance with RMSE and identified seasonal demand trends",
        "Worked in an Agile/Kanban environment under John Deere mentors",
      ],
    },
    {
      title: "Software Engineer Intern",
      company: "Roar Labs",
      word: "Roar Labs",
      period: "Sep 2022 – Apr 2023",
      location: "Remote (Mountain View, CA)",
      bullets: [
        "Built frontend for joinroar.co using JavaScript, NodeJS, Pug, and GitHub",
        "Worked directly under the CEO at a startup empowering people in tech careers",
        "Gained hands-on experience across building, testing, deployment, and collaboration",
      ],
    },
  ],
};

export const REVEAL = {
  eyebrow: "Projects",
  headline: "Designed, built and deployed end to end.",
  media: { src: "/home/geturseat.jpg", alt: "GetUrSeat home page: Find Your Perfect Style", width: 1440, height: 900, position: "50% 40%" } as MediaSource,
};

export interface Product {
  title: string;
  aka?: string;
  status: "live" | "wip";
  description: string;
  stack: string[];
  links: { label: string; href: string; external: boolean }[];
  media: MediaSource;
}

export const PRODUCTS: { label: string; title: string; body: string; items: Product[] } = {
  label: "Live products",
  title: "Products I build and run.",
  body: "Frontend, backend, database and cloud. Drag or scroll through the work.",
  items: [
    {
      title: "GetUrSeat",
      status: "live",
      description:
        "A production full-stack web app built with React, TypeScript, Python, MongoDB, and REST APIs — designed, built, and deployed end-to-end across frontend, backend, database, and cloud (Vercel + Railway).",
      stack: ["React", "TypeScript", "Python", "MongoDB", "REST APIs", "Vercel", "Railway"],
      links: [{ label: "Visit Website", href: "https://geturseat.com", external: true }],
      media: { src: "/home/geturseat.jpg", alt: "GetUrSeat home page screenshot", width: 1440, height: 900 },
    },
    {
      title: "RRender.ai",
      status: "live",
      description:
        "An AI creative platform that turns natural-language prompts into motion graphics, 3D Blender renders, narrated animations, and editable designs. Built with React, TypeScript, Node.js, Python, Remotion, Blender, and FFmpeg — with OAuth/OTP auth, Stripe billing, PostgreSQL/Prisma, AI orchestration, and Railway deployment.",
      stack: ["React", "TypeScript", "Node.js", "Python", "Remotion", "Blender", "FFmpeg", "Prisma", "Stripe"],
      links: [{ label: "Visit Website", href: "https://www.rrender.ai", external: true }],
      media: { src: "/home/rrender.jpg", alt: "RRender.ai home page screenshot", width: 1440, height: 900, position: "0% 0%" },
    },
    {
      title: "GuardCMD",
      status: "live",
      description:
        "Abuse protection for apps and AI agents. It scores signups, logins, AI generations, and agent tool calls from 0 to 100 and returns allow / challenge / throttle / review / block. It ships as an SDK, an MCP server, and a coding-agent skill that wires protection in for you.",
      stack: ["TypeScript", "npm SDK", "MCP", "Claude Code skill", "API"],
      links: [
        { label: "Visit Website", href: "https://guardcmd.ai", external: true },
        { label: "Agent skill repo", href: "https://github.com/guardcmd/guardcmd", external: true },
      ],
      media: { src: "/home/guardcmd.jpg", alt: "GuardCMD home page screenshot", width: 1440, height: 900, position: "50% 0%" },
    },
    {
      title: "Smart Schedule Hub",
      aka: "SmartCal",
      status: "live",
      description:
        "An AI-powered calendar and scheduling app with iCal integration, a self-hosted small language model for smart planning, and per-user data storage — running on my own Railway infrastructure.",
      stack: ["Next.js", "React", "Express", "Prisma", "Postgres", "Ollama", "Tesseract.js", "Railway"],
      links: [
        { label: "Learn More", href: LINKS.calendar, external: false },
        { label: "PersonalWebsite repo", href: "https://github.com/sahilbaligar0407/PersonalWebsite", external: true },
      ],
      media: { src: "/home/smartcal.jpg", alt: "SmartCal home page screenshot", width: 1440, height: 900, position: "50% 0%" },
    },
    {
      title: "Mobile Outfits App",
      status: "wip",
      description:
        "Mobile app with a wardrobe to store clothing pieces online. Build and store outfits manually or use AI suggestions. Includes AI to generate a Pinterest-board style image or dress up an AI avatar to preview how you'd look.",
      stack: [],
      links: [],
      media: { alt: "Work in progress", procedural: "mesh" },
    },
  ],
};

export interface Repo {
  name: string;
  href: string;
  description: string;
  stack: string[];
}

export const REPOS: { label: string; groups: { title: string; intro: string; repos: Repo[] }[] } = {
  label: "On GitHub",
  groups: [
    {
      title: "Video AI pipeline",
      intro: "A set of Python tools I built for turning long-form video into short-form content.",
      repos: [
        {
          name: "ClipGenius",
          href: "https://github.com/sahilbaligar0407/VideoProject",
          description: "Takes a YouTube URL or upload and auto-generates 20–40s highlight clips with burned-in captions, using Whisper and an embeddings-based viral similarity engine.",
          stack: ["Next.js", "FastAPI", "Whisper", "OpenAI Embeddings", "FFmpeg"],
        },
        {
          name: "Transcription",
          href: "https://github.com/sahil-baligar/Transcription",
          description: "A modular feature-extraction pipeline: transcripts, loudness, silence, speech rate, pitch, overtalk, and face presence, all time-aligned for highlight scoring.",
          stack: ["Python", "OpenAI", "FFmpeg", "OpenCV"],
        },
        {
          name: "Dynamic-Facial-Framing",
          href: "https://github.com/sahil-baligar/Dynamic-Facial-Framing",
          description: "Converts horizontal video to 9:16 with face tracking and smoothed dynamic crops, plus blur, gameplay, and cover layouts.",
          stack: ["Python", "MediaPipe", "OpenCV", "FFmpeg"],
        },
        {
          name: "AutoCaptions",
          href: "https://github.com/sahilbaligar0407/AutoCaptions",
          description: "Progressive 1–3 word captions with rate-aware chunking and dynamic \"wow word\" styling. Reads SRT, VTT, and ASS files.",
          stack: ["Python", "MoviePy"],
        },
      ],
    },
    {
      title: "Featured builds",
      intro: "Side projects across mobile, agents, data and campus life.",
      repos: [
        {
          name: "FitBuilder",
          href: "https://github.com/sahil-baligar/FitBuilderApp",
          description: "Build outfits from your own wardrobe. Snap a garment and it becomes a clean ghost-mannequin render, auto-tagged by AI. Compose fits, try them on your own photo, and generate multi-view style frames. One codebase ships iOS, Android, and web.",
          stack: ["Expo", "React Native", "TypeScript", "Express", "Postgres", "OpenAI", "fal.ai"],
        },
        {
          name: "repomind",
          href: "https://github.com/sahilbaligar0407/repomind",
          description: "A context compiler for AI coding agents. It compiles a codebase into an adaptive k-ary context tree with O(1) hash indexes and hot/warm/cold memory, so agents fetch compact 5–12 node context packets instead of re-scanning the repo. It includes a 3D WebGL viewer.",
          stack: ["TypeScript", "ts-morph", "Node.js", "WebGL", "Vitest"],
        },
        {
          name: "PolymarketSearcher",
          href: "https://github.com/sahilbaligar0407/PolymarketSearcher",
          description: "Tracks the open positions of Polymarket's top ~100 traders and surfaces what the smart money agrees on. Given a bankroll, it generates an AI-built spread of trades validated against live web search, shown on a command-center dashboard. It has zero npm dependencies.",
          stack: ["Node.js", "JavaScript", "Polymarket API", "LLM"],
        },
        {
          name: "BoilerMarketplace",
          href: "https://github.com/sahilbaligar0407/BoilerMarketplace",
          description: "A campus marketplace for Purdue students to buy and sell textbooks, furniture, tickets, and electronics. It has auth, listings, chat, and favorites, and runs on the web, iOS, and Android via Capacitor.",
          stack: ["React", "TypeScript", "Vite", "shadcn/ui", "TanStack Query", "Capacitor"],
        },
      ],
    },
    {
      title: "Human Writing",
      intro: "A writing skill for Claude and other assistants.",
      repos: [
        {
          name: "HumanWriting",
          href: "https://github.com/sahil-baligar/HumanWriting",
          description: "It edits prose so the page reads as one person thinking about one subject for one reader. It checks the facts first, then the shape of the reasoning, then sentence rhythm, and gets to vocabulary last.",
          stack: ["Claude Code plugin", "Python", "MIT"],
        },
      ],
    },
  ],
};

export const SKILLS: { label: string; title: string; groups: { name: string; items: string[] }[] } = {
  label: "Skills",
  title: "The *toolkit*",
  groups: [
    { name: "Languages", items: ["Python", "TypeScript", "JavaScript", "Java", "C", "R", "SQL"] },
    { name: "Frontend", items: ["React", "Next.js", "Vite", "Tailwind CSS", "Radix UI", "Framer Motion", "Remotion", "Expo"] },
    { name: "Backend & Data", items: ["Node.js", "Express", "Django", "FastAPI", "Supabase", "PostgreSQL", "MongoDB", "Prisma", "REST APIs", "Stripe"] },
    {
      name: "AI / ML & Data Science",
      items: ["OpenAI", "Gemini", "Vertex AI", "Agentic AI", "XGBoost", "Random Forest", "scikit-learn", "OpenCV", "Pandas", "NumPy", "Ollama", "MediaPipe", "FFmpeg", "Blender"],
    },
    { name: "Cloud & DevOps", items: ["GCP", "Azure", "Databricks", "Railway", "Vercel", "Docker", "Git", "GitHub"] },
    { name: "QA & Testing", items: ["Playwright", "Vitest", "UiPath"] },
  ],
};

export const EDUCATION = {
  label: "Education",
  school: "Purdue University",
  degree: "B.S. Computer Science",
  period: "Aug 2024 – Winter 2027",
  honours: "Dean's List & Semester Honors",
  activities: "Purdue Student Government — Board of Directors (Engagement Committee)",
  earlierLabel: "Earlier background",
  highSchool: "Collierville High School",
  highSchoolDetail: "GPA 4.7541 · Rank 15/700 · Cum Laude",
  certifications: "TestOut Network Pro, TestOut PC Pro (University of Memphis)",
  outsideLabel: "Outside of code",
  outside: ["Founder of Lead2Help (Tennessee-registered nonprofit)", "National Honor Society", "AP Scholar with Distinction"],
};

export const CONTACT = {
  label: "Get In Touch",
  lineOne: "Let's",
  lineTwo: "talk",
  body: "Open to internships, software roles, and building ambitious products.",
  note: "Open to Summer 2027 internships in full-stack, AI/ML, and data engineering.",
  email: "Email me",
  resume: "Résumé",
  back: "Back to the start",
  footer: "Sahil Baligar. All rights reserved.",
};
