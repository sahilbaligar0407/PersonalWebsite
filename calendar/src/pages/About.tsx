import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground mb-8 inline-block">
          ← Back to home
        </Link>
        <h1 className="text-3xl font-bold text-foreground mb-6">About SmartCal</h1>
        <div className="prose prose-invert prose-sm max-w-none text-foreground space-y-4">
          <p>
            SmartCal is a student productivity platform that helps you organize academic assignments in a single calendar.
          </p>
          <h2 className="text-lg font-semibold mt-6">Features</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Paste your Brightspace calendar subscription link to auto-import assignments</li>
            <li>Add assignments via AI: paste text or upload screenshots</li>
            <li>Recommended tasks panel for the next 14 days</li>
            <li>Calendar views: Month, Week, Day</li>
            <li>Manual assignment creation and course color customization</li>
          </ul>
          <h2 className="text-lg font-semibold mt-6">Built for Students</h2>
          <p>
            SmartCal is designed to reduce the chaos of tracking assignments across multiple courses. One calendar, no duplicates, AI-powered parsing.
          </p>
        </div>
      </div>
    </div>
  );
}
