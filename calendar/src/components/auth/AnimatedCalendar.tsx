"use client";

import { memo } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { CalendarDays, ChevronRight } from "lucide-react";
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from "date-fns";
import { cn } from "@/lib/utils";

const today = new Date();
const monthStart = startOfMonth(today);
const monthEnd = endOfMonth(today);
const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

const mockEvents = [
  { day: 3, color: "bg-primary/60" },
  { day: 7, color: "bg-course-blue/60" },
  { day: 12, color: "bg-course-purple/60" },
  { day: 15, color: "bg-primary/60" },
  { day: 18, color: "bg-course-green/60" },
  { day: 22, color: "bg-course-orange/60" },
];

export const AnimatedCalendar = memo(function AnimatedCalendar() {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-lg p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center gap-6"
      >
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
            className="rounded-xl bg-secondary/50 p-3"
          >
            <CalendarDays className="h-10 w-10 text-primary" />
          </motion.div>
          <span className="text-2xl font-bold text-foreground">SmartCal</span>
        </div>

        <p className="text-muted-foreground text-sm text-center max-w-xs">
          Your academic schedule, organized
        </p>

        {/* Mini calendar grid */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="glass-card p-4 w-full max-w-[280px]"
        >
          <p className="text-xs font-medium text-muted-foreground mb-3 text-center">
            {format(today, "MMMM yyyy")}
          </p>
          <div className="grid grid-cols-7 gap-1 text-center">
            {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
              <span key={d} className="text-[10px] text-muted-foreground">
                {d}
              </span>
            ))}
            {Array.from({ length: getFirstDayOffset(monthStart) }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {days.map((day) => {
              const hasEvent = mockEvents.some((e) => format(day, "d") === String(e.day));
              const eventColor = mockEvents.find((e) => format(day, "d") === String(e.day))?.color;
              return (
                <motion.div
                  key={day.toISOString()}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 + days.indexOf(day) * 0.02 }}
                  className={cn(
                    "flex flex-col items-center justify-center h-8 rounded-md text-xs",
                    isToday(day) && "bg-primary text-primary-foreground font-semibold",
                    !isToday(day) && "text-foreground"
                  )}
                >
                  {format(day, "d")}
                  {hasEvent && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5, type: "spring" }}
                      className={cn("w-1.5 h-1.5 rounded-full mt-0.5", eventColor)}
                    />
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex items-center gap-1 text-xs text-muted-foreground"
        >
          <span>Organize assignments</span>
          <ChevronRight className="h-4 w-4 text-primary" />
        </motion.div>
      </motion.div>
    </div>
  );
});

function getFirstDayOffset(date: Date): number {
  const day = date.getDay();
  return day;
}
