import { useMemo } from "react";
import { addDays, differenceInCalendarDays, format, parseISO, startOfToday } from "date-fns";
import { useAssignments } from "@/contexts/AssignmentContext";
import { courseColorClasses } from "@/lib/course-colors";
import { cn } from "@/lib/utils";
import type { Assignment } from "@/types/assignment";

const HORIZON_DAYS = 14;

interface RecommendedTasksProps {
  onSelect?: (assignment: Assignment) => void;
}

/** Plain-language due label — "Today" reads faster than a date. */
function dueLabel(daysAway: number, date: Date) {
  if (daysAway === 0) return "Today";
  if (daysAway === 1) return "Tomorrow";
  if (daysAway <= 6) return format(date, "EEEE");
  return format(date, "MMM d");
}

function urgencyClass(daysAway: number) {
  if (daysAway <= 1) return "text-accent";
  return "text-muted-foreground";
}

export function RecommendedTasks({ onSelect }: RecommendedTasksProps) {
  const { assignments, loading } = useAssignments();

  const tasks = useMemo(() => {
    const today = startOfToday();
    const horizon = addDays(today, HORIZON_DAYS);

    return assignments
      .map((assignment) => {
        const date = parseISO(assignment.dueDate);
        return { assignment, date, daysAway: differenceInCalendarDays(date, today) };
      })
      // Upcoming work only. Past deadlines can't be acted on, so they stay off
      // this list rather than pushing the next real task out of view.
      .filter(({ daysAway }) => daysAway >= 0 && daysAway <= HORIZON_DAYS)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [assignments]);

  return (
    <section className="h-full flex flex-col bg-card" aria-label="Recommended tasks">
      <header className="px-4 py-3 rule">
        <h2 className="text-sm font-bold text-foreground">Up next</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {loading
            ? "Loading…"
            : tasks.length === 0
              ? `Nothing due in ${HORIZON_DAYS} days`
              : `${tasks.length} due in ${HORIZON_DAYS} days`}
        </p>
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {!loading && tasks.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            Import your Brightspace calendar or add an assignment to see it here.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {tasks.map(({ assignment, date, daysAway }) => {
              const { text } = courseColorClasses(assignment.color, assignment.course);
              return (
                <li key={assignment.id}>
                  <button
                    type="button"
                    onClick={() => onSelect?.(assignment)}
                    className="w-full text-left px-4 py-3 hover:bg-secondary focus-visible:bg-secondary transition-colors"
                  >
                    <div className="flex items-baseline justify-between gap-3 mb-1">
                      <span className={cn("text-[11px] font-bold uppercase tracking-wide", text)}>
                        {assignment.course}
                      </span>
                      <span
                        className={cn("text-[11px] font-bold shrink-0", urgencyClass(daysAway))}
                      >
                        {dueLabel(daysAway, date)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground leading-snug">{assignment.name}</p>
                    {assignment.dueTime && (
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {assignment.dueTime}
                      </p>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
