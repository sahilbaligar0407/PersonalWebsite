"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAssignments } from "@/contexts/AssignmentContext";
import { fetchAndParseICS, toAssignments } from "@/lib/ics";
import { toast } from "sonner";
import { CalendarUploadChat } from "@/components/ui/calendar-upload-chat";

export function HeroUpload() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { addAssignments } = useAssignments();

  const handleSubmit = async (url: string) => {
    const trimmed = url.trim();
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

  const handleFileSelect = (_file: File) => {
    toast.info("File upload coming soon. Please paste your calendar subscription link.");
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden noise-overlay bg-section-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full"
      >
        <CalendarUploadChat
          heading="Let's build your calendar."
          placeholder="Paste your Brightspace calendar subscription link... https://.../calendar/feed.ics?token=XXXXX"
          onSubmit={handleSubmit}
          onFileSelect={handleFileSelect}
          disabled={submitted}
          loading={loading}
          success={submitted}
        />
        {error && (
          <p className="text-destructive text-sm text-center mt-4">{error}</p>
        )}
      </motion.div>
    </section>
  );
}
