import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";

const LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "About", href: "/about" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  const renderLink = (link: (typeof LINKS)[number], onClick?: () => void) =>
    link.href.startsWith("#") ? (
      <a
        key={link.label}
        href={link.href}
        onClick={onClick}
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        {link.label}
      </a>
    ) : (
      <Link
        key={link.label}
        to={link.href}
        onClick={onClick}
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        {link.label}
      </Link>
    );

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="grid h-8 w-8 place-items-center rounded bg-primary text-xs font-bold text-primary-foreground"
          >
            SC
          </span>
          <span className="text-lg font-bold tracking-tight text-foreground">SmartCal</span>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {LINKS.map((link) => renderLink(link))}
          <ThemeToggle />
          <Button asChild size="sm">
            <Link to={user ? "/calendar" : "/signin"}>
              {user ? "Open calendar" : "Sign in"}
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="flex flex-col gap-4 px-4 py-4">
            {LINKS.map((link) => renderLink(link, () => setOpen(false)))}
            <Button asChild size="sm" className="w-full">
              <Link to={user ? "/calendar" : "/signin"} onClick={() => setOpen(false)}>
                {user ? "Open calendar" : "Sign in"}
              </Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
