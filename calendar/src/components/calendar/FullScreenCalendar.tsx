import * as React from "react";
import {
  add,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isEqual,
  isSameDay,
  isSameMonth,
  isToday,
  parse,
  startOfToday,
  startOfWeek,
  startOfDay,
  endOfDay,
  eachWeekOfInterval,
  addDays,
} from "date-fns";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusCircleIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAssignments } from "@/contexts/AssignmentContext";
import { assignmentsToCalendarData, parseTimeToHour, type CalendarDay, type CalendarEvent } from "@/lib/calendar-utils";
import { AssignmentDetailDialog } from "./AssignmentDetailDialog";
import { ManualAddDialog } from "./ManualAddDialog";
import type { Assignment } from "@/types/assignment";

const colStartClasses = [
  "",
  "col-start-2",
  "col-start-3",
  "col-start-4",
  "col-start-5",
  "col-start-6",
  "col-start-7",
];

const courseColorMap: Record<string, string> = {
  blue: "bg-course-blue/25 text-foreground border border-course-blue/40",
  purple: "bg-course-purple/25 text-foreground border border-course-purple/40",
  orange: "bg-course-orange/25 text-foreground border border-course-orange/40",
  green: "bg-course-green/25 text-foreground border border-course-green/40",
  pink: "bg-course-pink/25 text-foreground border border-course-pink/40",
};

type ViewMode = "month" | "week" | "day" | "year";

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6am to 11pm

function DayViewContent({
  selectedDay,
  events,
  onEventClick,
  courseColorMap,
}: {
  selectedDay: Date;
  events: CalendarEvent[];
  onEventClick: (a: Assignment) => void;
  courseColorMap: Record<string, string>;
}) {
  const allDayEvents = events.filter((e) => !e.time || !parseTimeToHour(e.time));
  const timedEvents = events.filter((e) => e.time && parseTimeToHour(e.time) != null);
  const byHour = new Map<number, CalendarEvent[]>();
  for (const evt of timedEvents) {
    const h = parseTimeToHour(evt.time!);
    if (h != null) {
      const slot = Math.floor(h);
      const list = byHour.get(slot) ?? [];
      list.push(evt);
      byHour.set(slot, list);
    }
  }
  for (const list of byHour.values()) {
    list.sort((a, b) => (parseTimeToHour(a.time!) ?? 0) - (parseTimeToHour(b.time!) ?? 0));
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="sticky top-0 z-10 px-4 py-3 bg-card/95 border-b border-border shadow-sm backdrop-blur">
        <h3 className="text-base font-semibold text-foreground">
          {format(selectedDay, "EEEE, MMMM d, yyyy")}
        </h3>
        <p className="text-xs text-foreground/70 mt-0.5">
          {events.length} {events.length === 1 ? "event" : "events"} today
        </p>
      </div>
      {events.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-16 text-center px-4">
          <p className="text-foreground/85 text-sm font-medium">No events this day</p>
          <p className="text-foreground/65 text-xs mt-1">Your schedule is clear</p>
        </div>
      ) : (
      <div className="flex-1 p-4 space-y-4">
        {allDayEvents.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-foreground/80 uppercase tracking-wider mb-2">
              All day
            </div>
            <div className="space-y-2">
              {allDayEvents.map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => onEventClick(evt.assignment)}
                  className={cn(
                    "rounded-lg p-3 cursor-pointer hover:opacity-90 transition-opacity border",
                    courseColorMap[evt.assignment.color] ?? "bg-primary/15 text-foreground border-primary/30"
                  )}
                >
                  <p className="font-medium text-foreground">{evt.assignment.course} – {evt.assignment.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        <div>
          <div className="text-xs font-semibold text-foreground/80 uppercase tracking-wider mb-2">
            Schedule
          </div>
          <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
            {HOURS.map((hour) => {
              const hourEvents = byHour.get(hour) ?? [];
              const ampm = hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`;
              return (
                <div
                  key={hour}
                  className="flex min-h-[56px] bg-card/30"
                >
                  <div className="w-16 flex-shrink-0 py-2 px-2 text-xs font-medium text-foreground/80 border-r border-border">
                    {ampm}
                  </div>
                  <div className="flex-1 p-2 space-y-2">
                    {hourEvents.length === 0 ? (
                      <div className="h-8" />
                    ) : (
                      hourEvents.map((evt) => (
                        <div
                          key={evt.id}
                          onClick={() => onEventClick(evt.assignment)}
                          className={cn(
                            "rounded-lg px-3 py-2 cursor-pointer hover:opacity-90 transition-opacity text-sm border",
                            courseColorMap[evt.assignment.color] ?? "bg-primary/15 text-foreground border-primary/30"
                          )}
                        >
                          <p className="font-medium text-foreground">{evt.assignment.course} – {evt.assignment.name}</p>
                          <p className="text-xs text-foreground/80 mt-0.5">{evt.time}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

export function FullScreenCalendar() {
  const { assignments, addAssignment, removeAssignment, removeAssignments } = useAssignments();
  const today = startOfToday();
  const [selectedDay, setSelectedDay] = React.useState(today);
  const [currentMonth, setCurrentMonth] = React.useState(format(today, "MMM-yyyy"));
  const [viewMode, setViewMode] = React.useState<ViewMode>("month");
  const [detailAssignment, setDetailAssignment] = React.useState<Assignment | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [manualAddOpen, setManualAddOpen] = React.useState(false);

  const data = React.useMemo(
    () => assignmentsToCalendarData(assignments),
    [assignments]
  );

  const firstDayCurrentMonth = parse(currentMonth, "MMM-yyyy", new Date());

  const days = eachDayOfInterval({
    start: startOfWeek(firstDayCurrentMonth),
    end: endOfWeek(endOfMonth(firstDayCurrentMonth)),
  });

  const weekStart = startOfWeek(selectedDay);
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: addDays(weekStart, 6),
  });

  const previousMonth = () => {
    const d = add(firstDayCurrentMonth, { months: -1 });
    setCurrentMonth(format(d, "MMM-yyyy"));
  };

  const nextMonth = () => {
    const d = add(firstDayCurrentMonth, { months: 1 });
    setCurrentMonth(format(d, "MMM-yyyy"));
  };

  const goToToday = () => {
    setCurrentMonth(format(today, "MMM-yyyy"));
    setSelectedDay(today);
  };

  const getEventsForDay = (day: Date) =>
    data.filter((d) => isSameDay(d.day, day)).flatMap((d) => d.events);

  const handleEventClick = (assignment: Assignment) => {
    setDetailAssignment(assignment);
    setDetailOpen(true);
  };

  const handleDeleteSimilar = (assignment: Assignment) => {
    const toRemove = assignments.filter(
      (a) =>
        a.course === assignment.course &&
        a.name === assignment.name &&
        a.dueDate === assignment.dueDate
    );
    removeAssignments(toRemove.map((a) => a.id));
  };

  const viewTabs: { mode: ViewMode; label: string }[] = [
    { mode: "month", label: "Month" },
    { mode: "week", label: "Week" },
    { mode: "day", label: "Day" },
  ];

  const handleDayCellClick = (day: Date) => {
    setSelectedDay(day);
    setViewMode("day");
  };

  return (
    <div className="flex flex-1 flex-col h-full">
      {/* Calendar Header */}
      <div className="flex flex-col gap-4 border-b border-border bg-card/30 px-4 py-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">
                {format(today, "d")}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {viewMode === "month" && format(firstDayCurrentMonth, "MMMM yyyy")}
                {viewMode === "week" && `Week of ${format(weekStart, "MMM d")}`}
                {viewMode === "day" && format(selectedDay, "EEEE, MMM d, yyyy")}
              </h2>
              <p className="text-xs text-foreground/70">
                {format(firstDayCurrentMonth, "MMM d")} –{" "}
                {format(endOfMonth(firstDayCurrentMonth), "MMM d, yyyy")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden">
            {viewTabs.map((tab) => (
              <button
                key={tab.mode}
                onClick={() => setViewMode(tab.mode)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium transition-colors",
                  viewMode === tab.mode
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/75 hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Button variant="outline" size="icon" onClick={previousMonth}>
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRightIcon className="h-4 w-4" />
          </Button>

          <Button variant="default" size="sm" onClick={() => setManualAddOpen(true)}>
            <PlusCircleIcon className="h-4 w-4 mr-1" />
            New Event
          </Button>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="flex-1 overflow-auto">
        {viewMode === "month" && (
          <div className="grid grid-cols-7 h-full min-h-[400px]">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="py-2 text-center text-xs font-semibold text-foreground/80 uppercase tracking-wider border-b border-border bg-muted/20"
              >
                {d}
              </div>
            ))}
            {days.map((day, dayIdx) => {
              const dayEvents = getEventsForDay(day);
              return (
                <div
                  key={dayIdx}
                  onClick={() => handleDayCellClick(day)}
                  className={cn(
                    dayIdx === 0 && colStartClasses[getDay(day)],
                    !isSameMonth(day, firstDayCurrentMonth) && "bg-muted/30 text-foreground/60",
                    "flex flex-col border-b border-r border-border hover:bg-muted/50 cursor-pointer transition-colors min-h-[80px]"
                  )}
                >
                  <div className="flex justify-end p-1.5">
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                        isToday(day) && "bg-primary text-primary-foreground font-bold",
                        isEqual(day, selectedDay) && !isToday(day) && "bg-secondary"
                      )}
                    >
                      {format(day, "d")}
                    </span>
                  </div>
                  <div className="flex-1 px-1.5 pb-1 space-y-0.5 overflow-hidden">
                    {dayEvents.slice(0, 3).map((evt) => (
                      <div
                        key={evt.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick(evt.assignment);
                        }}
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[10px] truncate cursor-pointer hover:opacity-80",
                          courseColorMap[evt.assignment.color] ?? "bg-primary/15 text-foreground border border-primary/30"
                        )}
                      >
                        {evt.assignment.course} - {evt.assignment.name}
                        {evt.time && ` - ${evt.time}`}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <p className="text-[10px] text-foreground/75 px-1.5 font-medium">
                        +{dayEvents.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {viewMode === "week" && (
          <div className="grid grid-cols-8 min-h-[300px]">
            <div className="border-b border-r border-border p-2 text-xs font-medium text-foreground/80 bg-muted/20" />
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className="border-b border-r border-border p-2 text-center text-xs font-semibold text-foreground bg-muted/20"
              >
                {format(day, "EEE d")}
              </div>
            ))}
            <div className="border-b border-r border-border p-2 text-xs font-medium text-foreground/80 bg-muted/20">
              Events
            </div>
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className="border-b border-r border-border p-2 space-y-1 min-h-[120px] bg-card/20"
              >
                {getEventsForDay(day).map((evt) => (
                  <div
                    key={evt.id}
                    onClick={() => handleEventClick(evt.assignment)}
                    className={cn(
                      "rounded px-2 py-1 text-xs font-medium cursor-pointer hover:opacity-90 truncate text-foreground",
                      courseColorMap[evt.assignment.color] ?? "bg-primary/15 border border-primary/30"
                    )}
                  >
                    {evt.assignment.name}
                    {evt.time && ` ${evt.time}`}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {viewMode === "day" && (
          <DayViewContent
            selectedDay={selectedDay}
            events={getEventsForDay(selectedDay)}
            onEventClick={handleEventClick}
            courseColorMap={courseColorMap}
          />
        )}
      </div>

      <AssignmentDetailDialog
        assignment={detailAssignment}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onDelete={removeAssignment}
        onDeleteSimilar={handleDeleteSimilar}
      />
      <ManualAddDialog
        open={manualAddOpen}
        onOpenChange={setManualAddOpen}
        onSubmit={addAssignment}
      />
    </div>
  );
}
