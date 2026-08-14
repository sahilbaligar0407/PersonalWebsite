import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "MEMORY+",
  description: "For Roy Lee.",
};

export default function RoyLeePage() {
  return (
    <main className="min-h-screen w-full bg-black flex items-center justify-center">
      <div className="relative w-full max-w-[1680px] aspect-[1680/945]">
        <Image
          src="/Image4RoyLee.png"
          alt="MEMORY+ — Mom is a Premium feature."
          fill
          priority
          sizes="100vw"
          className="object-contain"
        />
      </div>
    </main>
  );
}
