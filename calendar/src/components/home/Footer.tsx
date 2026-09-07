import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-border py-12 bg-background/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">SC</span>
            </div>
            <span className="text-base font-medium text-foreground">SmartCal</span>
          </div>
          <div className="flex items-center gap-8">
            <Link
              to="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link
              to="/about"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </Link>
          </div>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-8">
          © 2025 SmartCal. Built for students.
        </p>
      </div>
    </footer>
  );
}
