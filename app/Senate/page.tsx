import Image from "next/image";
import { VOTE_URL } from "@/components/senate/config/scenes";

export default function SenatePage() {
  return (
    <main className="senate-landing relative min-h-screen overflow-hidden">
      <div className="senate-landing-bg pointer-events-none absolute inset-0 z-0" aria-hidden>
        <Image
          src="/campaign/Scene1_StudentUnion.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="senate-landing-bg-img object-cover object-center"
        />
        <div className="senate-landing-scrim absolute inset-0" />
      </div>

      <div className="senate-landing-grid relative z-10 mx-auto grid min-h-screen max-w-[1600px] grid-cols-3 grid-rows-3 gap-x-6 gap-y-8 px-5 pb-10 pt-8 sm:px-8 sm:pb-14 sm:pt-10 md:gap-x-10 md:gap-y-10 md:px-12">
        {/* Row 1 — hero (spans left + center; open right like mockup) */}
        <header className="col-span-3 flex flex-col justify-start md:col-span-2 md:row-start-1">
          <p className="senate-landing-kicker font-[family-name:var(--font-barlow)] text-[10px] font-semibold uppercase tracking-[0.35em] text-[#f5f0e6]/90 drop-shadow-md sm:text-[11px]">
            Purdue Student Government
          </p>
          <p className="mt-4 font-[family-name:var(--font-barlow)] text-xs font-medium uppercase tracking-[0.2em] text-[#f0ebe3]/95 drop-shadow-md sm:text-sm">
            Voting for
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-syne)] text-[clamp(2.5rem,10vw,5.5rem)] font-extrabold leading-[0.92] tracking-tight text-[#f8f2e8] drop-shadow-[0_4px_24px_rgba(0,0,0,0.55)]">
            Sahil Baligar
          </h1>
          <p className="mt-3 font-[family-name:var(--font-dm-serif)] text-[clamp(1.15rem,3.5vw,1.75rem)] italic text-[#ede6dc] drop-shadow-md">
            College of Science Senate
          </p>
          <p className="senate-landing-sub mt-4 max-w-xl font-[family-name:var(--font-barlow)] text-[13px] font-light leading-relaxed text-[#e8e2d8]/95 drop-shadow md:text-sm">
            Current Board of Directors for{" "}
            <span className="font-medium text-[#c9a227]">Engagement</span>, PSG
          </p>
        </header>

        {/* Row 2 — three pillars spread across columns */}
        <section
          className="col-span-3 row-start-2 grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6 md:gap-8"
          aria-label="Campaign priorities"
        >
          <article className="senate-landing-pillar flex flex-col rounded-lg border border-[#f5f0e6]/15 bg-[#0a0908]/35 p-4 backdrop-blur-sm sm:p-5">
            <h2 className="font-[family-name:var(--font-syne)] text-lg font-extrabold uppercase tracking-wide text-[#f8f2e8] drop-shadow md:text-xl">
              Increase research opportunities
            </h2>
            <p className="mt-3 font-[family-name:var(--font-barlow)] text-sm font-light leading-relaxed text-[#e8e2d8]/95 md:text-[15px]">
              Subsidize graduate pathways and pair paid undergrad researchers with labs—so grads get{" "}
              <span className="font-medium text-[#c9a227]">teaching</span> and{" "}
              <span className="font-medium text-[#c9a227]">research</span> experience, and
              undergrads get real inquiry and fair compensation.
            </p>
          </article>
          <article className="senate-landing-pillar flex flex-col rounded-lg border border-[#f5f0e6]/15 bg-[#0a0908]/35 p-4 backdrop-blur-sm sm:p-5">
            <h2 className="font-[family-name:var(--font-syne)] text-lg font-extrabold uppercase tracking-wide text-[#f8f2e8] drop-shadow md:text-xl">
              Expand campus transportation
            </h2>
            <p className="mt-3 font-[family-name:var(--font-barlow)] text-sm font-light leading-relaxed text-[#e8e2d8]/95 md:text-[15px]">
              Work with Lafayette and Purdue on <span className="font-medium text-[#c9a227]">CitiBus</span>—more
              reliable routes and headways so fewer students miss class because the bus did not show.
            </p>
          </article>
          <article className="senate-landing-pillar flex flex-col rounded-lg border border-[#f5f0e6]/15 bg-[#0a0908]/35 p-4 backdrop-blur-sm sm:p-5">
            <h2 className="font-[family-name:var(--font-syne)] text-lg font-extrabold uppercase tracking-wide text-[#f8f2e8] drop-shadow md:text-xl">
              Create resume-building courses
            </h2>
            <p className="mt-3 font-[family-name:var(--font-barlow)] text-sm font-light leading-relaxed text-[#e8e2d8]/95 md:text-[15px]">
              More project-driven CS where you ship something{" "}
              <span className="font-[family-name:var(--font-caveat)] text-lg text-[#e8d4a0]">
                portfolio-ready
              </span>
              —aligned with programs like <span className="font-medium text-[#c9a227]">The Data Mine</span> when it
              fits.
            </p>
          </article>
        </section>

        {/* Row 3 — bottom center cell: vote CTA */}
        <div className="col-span-3 row-start-3 flex items-end justify-center pb-2 sm:col-span-1 sm:col-start-2">
          <a
            href={VOTE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="senate-landing-cta inline-flex items-center justify-center gap-3 rounded-full border-2 border-[#2a1810]/80 bg-[#f5f0e6] px-10 py-4 font-[family-name:var(--font-barlow)] text-sm font-bold uppercase tracking-[0.18em] text-[#1a0f0a] shadow-[0_8px_32px_rgba(0,0,0,0.35)] transition hover:bg-white hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)] md:px-14 md:py-5 md:text-base"
          >
            Vote Sahil for Senate
            <span aria-hidden className="text-lg">
              →
            </span>
          </a>
        </div>
      </div>
    </main>
  );
}
