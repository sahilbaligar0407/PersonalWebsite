import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Newsreader } from "next/font/google";
import Home from "./_home/Home";

const serif = Newsreader({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-sbk-serif", display: "swap", adjustFontFallback: false });
const sans = Inter({ subsets: ["latin"], weight: ["400", "500", "700", "800", "900"], variable: "--font-sbk-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-sbk-mono", display: "swap" });

const SITE = "https://www.sahilbaligar.com";
const TITLE = "Sahil Baligar | Full-Stack Developer & ML Engineer · CS @ Purdue";
const DESCRIPTION =
  "Sahil Baligar builds end-to-end products — React/TypeScript front-ends, Node/Django back-ends and AI/ML. CS at Purdue University; FedEx, Sedgwick, John Deere and Roar Labs; GetUrSeat, RRender.ai and GuardCMD.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "profile",
    url: "/",
    siteName: "Sahil Baligar",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "/home/og-sahil-baligar.jpg", width: 1200, height: 630, alt: "Sahil Baligar — Full-Stack Developer & ML Engineer" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/home/og-sahil-baligar.jpg"],
  },
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Sahil Baligar",
  url: SITE,
  image: `${SITE}/profile.jpg`,
  email: "mailto:sahilbaligar@gmail.com",
  jobTitle: "Full-Stack Developer & ML Engineer",
  alumniOf: { "@type": "CollegeOrUniversity", name: "Purdue University" },
  sameAs: [
    "https://www.linkedin.com/in/sahil-baligar/",
    "https://github.com/sahil-baligar",
    "https://github.com/sahilbaligar0407",
    "https://www.instagram.com/sahilb_0/",
  ],
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
      <Home fontClassName={`${serif.variable} ${sans.variable} ${mono.variable}`} />
    </>
  );
}
