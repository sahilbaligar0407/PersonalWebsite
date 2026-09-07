"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAssignments } from "@/contexts/AssignmentContext";
import { fetchAndParseICS, toAssignments } from "@/lib/ics";
import { toast } from "sonner";

export function HeroWithUpload() {
  const [link, setLink] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { addAssignments } = useAssignments();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = link.trim();
    if (!trimmed) return;
    setError(null);
    setLoading(true);

    try {
      const parsed = await fetchAndParseICS(trimmed);
      const items = toAssignments(parsed, "ics");
      const { added, duplicates } = await addAssignments(items);
      setSubmitted(true);
      toast.success(
        added > 0
          ? `${added} events imported${duplicates > 0 ? ` (${duplicates} duplicates skipped)` : ""}`
          : duplicates > 0
          ? "All events already in calendar"
          : "No events found in calendar"
      );
      setTimeout(() => navigate("/calendar"), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load calendar");
      toast.error("Could not fetch calendar. Check the URL and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="landing-hero">
      <div className="landing-container">
        <h1 className="landing-hero-title">
          Turn your class chaos into a smart calendar.
        </h1>
        <p className="landing-hero-subtitle">
          Paste your Brightspace calendar subscription link. We build your schedule instantly — no duplicates, no manual entry.
        </p>

        <form onSubmit={handleSubmit} className="landing-upload-form">
          <div className="landing-upload-input-wrap">
            <label htmlFor="calendar-link" className="landing-sr-only">
              Calendar subscription link
            </label>
            <input
              id="calendar-link"
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://.../calendar/feed.ics?token=..."
              disabled={submitted}
              className="landing-upload-input"
              autoComplete="url"
            />
            <button
              type="submit"
              disabled={submitted || loading}
              className="landing-upload-btn"
            >
              {loading ? "Loading…" : submitted ? "Done" : "Build My Calendar"}
            </button>
          </div>
          {error && <p className="landing-form-error">{error}</p>}
          <p className="landing-upload-hint">
            Works with Brightspace, Canvas, and most LMS calendar feeds.
          </p>
          <div className="landing-badges">
            <span className="landing-badge">Brightspace</span>
            <span className="landing-badge">Canvas</span>
            <span className="landing-badge">.ics feed</span>
          </div>
        </form>
      </div>
    </header>
  );
}
