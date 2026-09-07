import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter } from "lucide-react";
import { useAssignments } from "@/contexts/AssignmentContext";
import { addDays, isWithinInterval, parseISO, startOfToday } from "date-fns";
import { cn } from "@/lib/utils";

const courseColorMap: Record<string, string> = {
  blue: "bg-course-blue",
  purple: "bg-course-purple",
  orange: "bg-course-orange",
  green: "bg-course-green",
  pink: "bg-course-pink",
};

const RECOMMENDED_LIMIT = 8;

export function RecommendedTasks() {
  const { assignments } = useAssignments();

  const recommended = useMemo(() => {
    const today = startOfToday();
    const twoWeeksOut = addDays(today, 14);

    return assignments
      .filter((a) => {
        const d = parseISO(a.dueDate);
        return isWithinInterval(d, { start: today, end: twoWeeksOut });
      })
      .sort((a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime())
      .slice(0, RECOMMENDED_LIMIT);
  }, [assignments]);

  return (
    <div className="h-full flex flex-col bg-card/20">
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/50">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Recommended Tasks</h2>
        </div>
      </div>

      <p className="px-4 py-2 text-xs text-foreground/75 font-medium">
        Next 14 days · Top {RECOMMENDED_LIMIT}
      </p>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 scrollbar-thin">
        <AnimatePresence mode="popLayout">
          {recommended.length === 0 ? (
            <p className="text-sm text-foreground/75 py-4 text-center font-medium">
              No upcoming tasks
            </p>
          ) : (
            recommended.map((task, i) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.03 }}
                className="surface-elevated rounded-lg p-3 border border-border/50 hover:bg-secondary/80 transition-colors cursor-pointer group shadow-sm"
              >
                <div className="flex items-start gap-2">
                  <div
                    className={cn(
                      "w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0",
                      courseColorMap[task.color] ?? "bg-primary"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {task.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          courseColorMap[task.color] ?? "bg-primary"
                        )}
                      />
                      <span className="text-[10px] text-foreground/75 font-medium">
                        {task.course}
                      </span>
                      <span className="text-[10px] text-foreground/50">·</span>
                      <span className="text-[10px] text-foreground/75 font-medium">
                        {task.dueDate}
                        {task.dueTime && ` ${task.dueTime}`}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
