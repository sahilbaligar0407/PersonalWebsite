import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="grid h-7 w-7 place-items-center rounded bg-primary text-[10px] font-bold text-primary-foreground"
          >
            SC
          </span>
          <span className="text-sm text-muted-foreground">
            SmartCal — built for Brightspace calendars.
          </span>
        </div>

        <nav className="flex gap-6" aria-label="Footer">
          <Link
            to="/about"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            About
          </Link>
          <Link
            to="/privacy"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Privacy
          </Link>
        </nav>
      </div>
    </footer>
  );
}
