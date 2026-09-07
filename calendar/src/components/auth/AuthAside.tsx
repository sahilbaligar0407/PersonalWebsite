import { CalendarDays, Cpu, ShieldCheck } from "lucide-react";

const POINTS = [
  {
    icon: CalendarDays,
    title: "One import, whole semester",
    body: "Paste the Brightspace subscription link and every deadline lands on the calendar.",
  },
  {
    icon: Cpu,
    title: "A self-hosted model",
    body: "Assignment parsing runs on a small language model hosted with this site, not a third-party API.",
  },
  {
    icon: ShieldCheck,
    title: "Your calendar is yours",
    body: "Your account and deadlines are only ever visible to you.",
  },
];

/** Editorial panel beside the auth forms. Hidden below lg. */
export function AuthAside() {
  return (
    <aside className="hidden lg:flex lg:w-[46%] xl:w-[42%] flex-col justify-between bg-primary text-primary-foreground p-12 xl:p-16">
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="grid h-8 w-8 place-items-center rounded bg-primary-foreground text-primary text-xs font-bold"
        >
          SC
        </span>
        <span className="text-lg font-bold tracking-tight">SmartCal</span>
      </div>

      <div className="max-w-md">
        <h2 className="font-serif-display text-4xl xl:text-5xl leading-[1.1] mb-10">
          Every deadline, in one place, before it&nbsp;surprises you.
        </h2>

        <ul className="space-y-7">
          {POINTS.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-4">
              <Icon className="w-5 h-5 mt-0.5 shrink-0 opacity-80" aria-hidden="true" />
              <div>
                <p className="font-bold mb-1">{title}</p>
                <p className="text-sm leading-relaxed text-primary-foreground/75">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-sm text-primary-foreground/60">
        Built for Purdue Brightspace calendars.
      </p>
    </aside>
  );
}
