import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAssignments } from "@/contexts/AssignmentContext";
import { fetchAndParseICS, toAssignments } from "@/lib/ics";
import { toast } from "sonner";

export function Hero() {
  const [link, setLink] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { addAssignments } = useAssignments();

  const handleBegin = async () => {
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
    <section id="hero" className="relative min-h-screen flex items-center justify-center pt-16 noise-overlay overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20 blur-[120px]" style={{ background: "hsl(175 80% 50%)" }} />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-10 blur-[100px]" style={{ background: "hsl(220 80% 60%)" }} />

      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            Turn your class chaos{" "}
            <span className="gradient-text">into a smart calendar.</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
            Paste your Brightspace calendar link. We build your schedule instantly — no duplicates.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card glow-border p-6 sm:p-8 max-w-xl mx-auto"
        >
          <label className="text-sm font-medium text-muted-foreground block text-left mb-3">
            Paste your subscription link
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://.../calendar/feed.ics?token=XXXXX"
              className="flex-1 h-12 px-4 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            <Button
              variant="hero"
              size="lg"
              onClick={handleBegin}
              disabled={submitted || loading}
              className="min-w-[120px]"
            >
              <motion.span
                className="flex items-center gap-2"
                animate={submitted ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : submitted ? (
                  <>
                    <Check size={18} /> Done
                  </>
                ) : (
                  <>
                    Begin <ArrowRight size={18} />
                  </>
                )}
              </motion.span>
            </Button>
          </div>
          {error && (
            <p className="text-destructive text-xs mt-2 text-left">{error}</p>
          )}
        </motion.div>

        {/* Floating badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap justify-center gap-3 mt-8"
        >
          {["No duplicates", "Auto-sync", "AI-powered"].map((tag, i) => (
            <motion.span
              key={tag}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.1 }}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-secondary text-muted-foreground border border-border"
            >
              {tag}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
