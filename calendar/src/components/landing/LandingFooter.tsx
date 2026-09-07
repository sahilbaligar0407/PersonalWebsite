import { Link } from "react-router-dom";

export function LandingFooter() {
  return (
    <footer className="landing-footer">
      <div className="landing-container">
        <div className="landing-footer-inner">
          <span className="landing-footer-brand">
            <span className="landing-footer-logo">SC</span> SmartCal
          </span>
          <nav className="landing-footer-nav">
            <Link to="/about">About</Link>
            <Link to="/privacy">Privacy</Link>
          </nav>
        </div>
        <p className="landing-footer-copy">© 2025 SmartCal. Built for students.</p>
      </div>
    </footer>
  );
}
