import { Link } from "react-router-dom";
import { CalendarDays, Copy, Cpu, ListChecks, ShieldCheck, Sparkles } from "lucide-react";
import { Navbar } from "@/components/home/Navbar";
import { Footer } from "@/components/home/Footer";
import { CalendarImport } from "@/components/calendar/CalendarImport";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const STEPS = [
  {
    icon: Copy,
    title: "Copy your feed link",
    body: "In Brightspace, open Calendar and choose Subscribe. Copy the .ics link it gives you.",
  },
  {
    icon: CalendarDays,
    title: "Import once",
    body: "SmartCal reads every course on the feed, pulls out the real deadlines, and skips the noise.",
  },
  {
    icon: ListChecks,
    title: "See what's next",
    body: "Deadlines land on a month, week, or day view, with the next two weeks pinned beside it.",
  },
];

const FEATURES = [
  {
    icon: Cpu,
    title: "A self-hosted model, not a third party",
    body: "Assignment parsing runs on a small language model hosted alongside this site. Your coursework is never sent to OpenAI, Anthropic or anyone else.",
  },
  {
    icon: Sparkles,
    title: "Types the way you talk",
    body: '"CS252 lab 4 due Friday 11:59pm" becomes a calendar entry. Relative dates are resolved against today, so "next Monday" lands on the right Monday.',
  },
  {
    icon: ShieldCheck,
    title: "Imports without duplicates",
    body: "Brightspace lists each item several times — available, due, closes. SmartCal keeps the deadline and drops the rest, every time you re-import.",
  },
];

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main>
        {/* Hero */}
        <section className="border-b border-border">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:py-24">
            <div>
              <p className="eyebrow mb-4">Brightspace → your calendar</p>
              <h1 className="font-serif-display text-4xl leading-[1.08] text-foreground sm:text-5xl lg:text-6xl">
                Every deadline of the semester, in one place.
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
                SmartCal reads your Brightspace calendar feed, keeps the assignments
                that actually have a due date, and shows you what to work on next.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to={user ? "/calendar" : "/signup"}>
                    {user ? "Open your calendar" : "Create an account"}
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href="#how-it-works">How it works</a>
                </Button>
              </div>
            </div>

            <div className="lg:justify-self-end">
              <CalendarImport />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="border-b border-border">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
            <p className="eyebrow mb-3">How it works</p>
            <h2 className="mb-12 max-w-2xl text-3xl text-foreground sm:text-4xl">
              Three steps, then you stop thinking about it.
            </h2>

            <ol className="grid gap-10 sm:grid-cols-3">
              {STEPS.map(({ icon: Icon, title, body }, i) => (
                <li key={title}>
                  <div className="mb-4 flex items-center gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border text-sm font-bold text-foreground">
                      {i + 1}
                    </span>
                    <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-foreground">{title}</h3>
                  <p className="leading-relaxed text-muted-foreground">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-b border-border">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
            <p className="eyebrow mb-3">Why it's different</p>
            <h2 className="mb-12 max-w-2xl text-3xl text-foreground sm:text-4xl">
              Local by default.
            </h2>

            <div className="grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, body }) => (
                <article key={title} className="bg-card p-6">
                  <Icon className="mb-4 h-5 w-5 text-primary" aria-hidden="true" />
                  <h3 className="mb-2 text-lg font-bold text-foreground">{title}</h3>
                  <p className="leading-relaxed text-muted-foreground">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="border-b border-border bg-primary text-primary-foreground">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-serif-display text-3xl sm:text-4xl">
                Import the semester in about a minute.
              </h2>
              <p className="mt-2 text-primary-foreground/75">
                Everything is stored on this machine.
              </p>
            </div>
            <Button asChild variant="accent" size="lg" className="shrink-0">
              <Link to={user ? "/calendar" : "/signup"}>
                {user ? "Open your calendar" : "Get started"}
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
