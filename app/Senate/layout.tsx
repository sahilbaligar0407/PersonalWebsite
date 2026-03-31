import type { Metadata } from "next";
import { Syne, DM_Serif_Display, Barlow, Barlow_Condensed, Caveat } from "next/font/google";
import "./senate.css";

const syne = Syne({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-syne",
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  style: ["italic", "normal"],
  variable: "--font-dm-serif",
});

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-barlow",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-barlow-condensed",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-caveat",
});

export const metadata: Metadata = {
  title: "Sahil Baligar | College of Science Senate",
  description:
    "Vote Sahil Baligar for Purdue College of Science Senate — research, transit, and project-based courses.",
  openGraph: {
    title: "Sahil Baligar | College of Science Senate",
    description:
      "Campaign landing: College of Science Senate — research, CitiBus, and resume-building CS projects.",
  },
};

export default function SenateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={`senate-root min-h-screen bg-[#0a0908] text-[#e8ddcc] antialiased ${syne.variable} ${dmSerif.variable} ${barlow.variable} ${barlowCondensed.variable} ${caveat.variable}`}
    >
      {children}
    </div>
  );
}
