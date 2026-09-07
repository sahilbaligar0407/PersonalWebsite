import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Loader2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useAssignments } from "@/contexts/AssignmentContext";
import { fetchAndParseICS, toAssignments } from "@/lib/ics";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface CalendarImportProps {
  /** Rendered above the field; omit for a bare form. */
  heading?: string;
  description?: string;
}

export function CalendarImport({ heading, description }: CalendarImportProps) {
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addAssignments } = useAssignments();

  // Pre-fill with the feed this account imported last time.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    api
      .getCalendar()
      .then(({ calendar }) => {
        if (!cancelled && calendar.feedUrl) setLink(calendar.feedUrl);
      })
      .catch(() => {
        /* nothing saved yet */
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const handleImport = async () => {
    const trimmed = link.trim();
    if (!trimmed || loading) return;

    setError(null);
    setLoading(true);

    try {
      const { deadlines, skipped } = await fetchAndParseICS(trimmed);

      if (deadlines.length === 0) {
        setError(
          skipped.length > 0
            ? `Found ${skipped.length} calendar entries, but none of them were deadlines.`
            : "That calendar has no events in it."
        );
        return;
      }

      const { added, duplicates } = await addAssignments(toAssignments(deadlines, "ics"));
      await api.saveFeedUrl(trimmed).catch(() => {});

      const detail = [
        duplicates > 0 ? `${duplicates} already saved` : null,
        skipped.length > 0 ? `${skipped.length} non-deadline entries skipped` : null,
      ]
        .filter(Boolean)
        .join(" · ");

      if (added > 0) {
        toast.success(`Imported ${added} deadline${added === 1 ? "" : "s"}`, {
          description: detail || undefined,
        });
        navigate("/calendar");
      } else {
        toast.info("Your calendar is already up to date", {
          description: detail || undefined,
        });
        navigate("/calendar");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not import that calendar.";
      setError(message);
      toast.error("Import failed", { description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl">
      {heading && (
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-2">
            {heading}
          </h2>
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
      )}

      <div className="panel p-5 sm:p-6">
        <label
          htmlFor="feed-url"
          className="eyebrow block mb-2"
        >
          Brightspace subscription link
        </label>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            id="feed-url"
            type="url"
            inputMode="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleImport()}
            disabled={!user || loading}
            placeholder="https://…/calendar/feed/user/feed.ics?token=…"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "feed-error" : "feed-help"}
            className="flex-1 h-11 px-3 rounded-md border border-input bg-background text-foreground
                       placeholder:text-muted-foreground/70 text-sm font-mono
                       focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0
                       disabled:opacity-60 transition-colors"
          />
          <Button
            onClick={handleImport}
            disabled={!user || loading || !link.trim()}
            className="h-11 min-w-[112px]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Importing
              </>
            ) : (
              <>
                Import
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </>
            )}
          </Button>
        </div>

        {error ? (
          <p
            id="feed-error"
            role="alert"
            className="mt-3 flex items-start gap-2 text-sm text-destructive"
          >
            <TriangleAlert className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </p>
        ) : (
          <p id="feed-help" className="mt-3 text-sm text-muted-foreground">
            In Brightspace open <strong className="font-bold">Calendar → Subscribe</strong> and copy
            the link. Only assignment deadlines are imported.
          </p>
        )}

        {!user && (
          <p className="mt-4 pt-4 border-t border-border text-sm text-muted-foreground">
            <Link
              to="/signin"
              className="font-bold text-primary underline underline-offset-4"
            >
              Sign in
            </Link>{" "}
            to save a calendar to your account.
          </p>
        )}
      </div>
    </div>
  );
}
