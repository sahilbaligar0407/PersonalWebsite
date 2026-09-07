import * as React from "react";
import {
  add,
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parse,
  startOfToday,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAssignments } from "@/contexts/AssignmentContext";
import { assignmentsToCalendarData, type CalendarEvent } from "@/lib/calendar-utils";
import { courseColorClasses } from "@/lib/course-colors";
import { AssignmentDetailDialog } from "./AssignmentDetailDialog";
import { ManualAddDialog } from "./ManualAddDialog";
import type { Assignment } from "@/types/assignment";

type ViewMode = "month" | "week" | "day";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_CHIPS_PER_CELL = 3;

/**
 * A deadline chip. Colour sits on a left rule rather than a translucent fill,
 * so the label keeps full contrast in both themes.
 */
function EventChip({
  event,
  onClick,
  showTime = true,
}: {
  event: CalendarEvent;
  onClick: (a: Assignment) => void;
  showTime?: boolean;
}) {
  const { bg, text } = courseColorClasses(event.assignment.color, event.assignment.course);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick(event.assignment);
      }}
      title={`${event.assignment.course} — ${event.assignment.name}`}
      className="group flex w-full items-start gap-1.5 rounded-sm bg-secondary px-1.5 py-1 text-left
                 hover:bg-border focus-visible:bg-border transition-colors"
    >
      <span className={cn("mt-[5px] h-2.5 w-0.5 shrink-0 rounded-full", bg)} aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className={cn("block text-[10px] font-bold leading-tight", text)}>
          {event.assignment.course}
        </span>
        <span className="block truncate text-[11px] leading-tight text-foreground">
          {event.assignment.name}
        </span>
        {showTime && event.time && (
          <span className="block text-[10px] leading-tight text-muted-foreground">
            {event.time}
          </span>
        )}
      </span>
    </button>
  );
}

function DayList({
  day,
  events,
  onEventClick,
}: {
  day: Date;
  events: CalendarEvent[];
  onEventClick: (a: Assignment) => void;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <header className="mb-6">
        <p className="eyebrow mb-1">{format(day, "EEEE")}</p>
        <h3 className="text-2xl font-semibold text-foreground">
          {format(day, "MMMM d, yyyy")}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {events.length === 0
            ? "Nothing due."
            : `${events.length} deadline${events.length === 1 ? "" : "s"}`}
        </p>
      </header>

      {events.length > 0 && (
        <ul className="panel divide-y divide-border">
          {events.map((event) => {
            const { text, bg } = courseColorClasses(
              event.assignment.color,
              event.assignment.course
            );
            return (
              <li key={event.id}>
                <button
                  type="button"
                  onClick={() => onEventClick(event.assignment)}
                  className="flex w-full items-start gap-3 p-4 text-left hover:bg-secondary
                             focus-visible:bg-secondary transition-colors"
                >
                  <span
                    className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", bg)}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className={cn("block text-[11px] font-bold uppercase tracking-wide", text)}>
                      {event.assignment.course}
                    </span>
                    <span className="block text-foreground">{event.assignment.name}</span>
                  </span>
                  <span className="shrink-0 text-sm font-bold text-muted-foreground">
                    {event.time ?? "All day"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
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

  const data = React.useMemo(() => assignmentsToCalendarData(assignments), [assignments]);

  const firstDayCurrentMonth = parse(currentMonth, "MMM-yyyy", new Date());

  const monthDays = React.useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(firstDayCurrentMonth),
        end: endOfWeek(endOfMonth(firstDayCurrentMonth)),
      }),
    [currentMonth]
  );

  const weekStart = startOfWeek(selectedDay);
  const weekDays = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });

  const eventsForDay = React.useCallback(
    (day: Date) => data.filter((d) => isSameDay(d.day, day)).flatMap((d) => d.events),
    [data]
  );

  const step = (direction: 1 | -1) => {
    if (viewMode === "month") {
      setCurrentMonth(format(add(firstDayCurrentMonth, { months: direction }), "MMM-yyyy"));
      return;
    }
    const days = viewMode === "week" ? 7 : 1;
    const next = addDays(selectedDay, direction * days);
    setSelectedDay(next);
    setCurrentMonth(format(next, "MMM-yyyy"));
  };

  const goToToday = () => {
    setCurrentMonth(format(today, "MMM-yyyy"));
    setSelectedDay(today);
  };

  const openAssignment = (assignment: Assignment) => {
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

  const title =
    viewMode === "month"
      ? format(firstDayCurrentMonth, "MMMM yyyy")
      : viewMode === "week"
        ? `${format(weekStart, "MMM d")} – ${format(addDays(weekStart, 6), "MMM d, yyyy")}`
        : format(selectedDay, "MMMM d, yyyy");

  return (
    <div className="flex h-full flex-1 flex-col bg-background">
      <header className="flex flex-col gap-3 rule bg-card px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">
            {assignments.length} deadline{assignments.length === 1 ? "" : "s"} saved
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            role="tablist"
            aria-label="Calendar view"
            className="flex overflow-hidden rounded-md border border-border"
          >
            {(["month", "week", "day"] as const).map((mode) => (
              <button
                key={mode}
                role="tab"
                aria-selected={viewMode === mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "px-3 py-2 text-xs font-bold capitalize transition-colors",
                  viewMode === mode
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={() => step(-1)} aria-label="Previous">
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday} className="h-11">
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={() => step(1)} aria-label="Next">
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          <Button onClick={() => setManualAddOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto scrollbar-thin">
        {viewMode === "month" && (
          <div className="grid h-full grid-cols-7 border-l border-border">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="rule border-r border-border bg-card py-2 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
              >
                <span className="hidden sm:inline">{d}</span>
                <span className="sm:hidden">{d[0]}</span>
              </div>
            ))}

            {monthDays.map((day) => {
              const dayEvents = eventsForDay(day);
              const outside = !isSameMonth(day, firstDayCurrentMonth);
              const selected = isSameDay(day, selectedDay);

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => {
                    setSelectedDay(day);
                    setViewMode("day");
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedDay(day);
                      setViewMode("day");
                    }
                  }}
                  aria-label={`${format(day, "MMMM d")}, ${dayEvents.length} deadlines`}
                  className={cn(
                    "flex min-h-[92px] cursor-pointer flex-col border-b border-r border-border p-1.5 transition-colors",
                    outside ? "bg-muted/40" : "bg-card hover:bg-secondary",
                    selected && "ring-2 ring-inset ring-ring"
                  )}
                >
                  <div className="mb-1 flex justify-end">
                    <span
                      className={cn(
                        "grid h-6 w-6 place-items-center rounded-full text-xs font-bold",
                        isToday(day)
                          ? "bg-primary text-primary-foreground"
                          : outside
                            ? "text-muted-foreground/60"
                            : "text-foreground"
                      )}
                    >
                      {format(day, "d")}
                    </span>
                  </div>

                  <div className="flex-1 space-y-0.5 overflow-hidden">
                    {dayEvents.slice(0, MAX_CHIPS_PER_CELL).map((event) => (
                      <EventChip
                        key={event.id}
                        event={event}
                        onClick={openAssignment}
                        showTime={false}
                      />
                    ))}
                    {dayEvents.length > MAX_CHIPS_PER_CELL && (
                      <p className="px-1.5 text-[10px] font-bold text-muted-foreground">
                        +{dayEvents.length - MAX_CHIPS_PER_CELL} more
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {viewMode === "week" && (
          <div className="grid min-h-full grid-cols-1 border-l border-border sm:grid-cols-7">
            {weekDays.map((day) => {
              const dayEvents = eventsForDay(day);
              return (
                <div key={day.toISOString()} className="flex flex-col border-b border-r border-border">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDay(day);
                      setViewMode("day");
                    }}
                    className={cn(
                      "rule bg-card px-2 py-2 text-center transition-colors hover:bg-secondary",
                      isToday(day) && "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                  >
                    <span className="block text-[10px] font-bold uppercase tracking-wider opacity-80">
                      {format(day, "EEE")}
                    </span>
                    <span className="block text-lg font-bold">{format(day, "d")}</span>
                  </button>

                  <div className="flex-1 space-y-1 bg-card p-1.5">
                    {dayEvents.length === 0 ? (
                      <p className="p-2 text-center text-[11px] text-muted-foreground">—</p>
                    ) : (
                      dayEvents.map((event) => (
                        <EventChip key={event.id} event={event} onClick={openAssignment} />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {viewMode === "day" && (
          <DayList
            day={selectedDay}
            events={eventsForDay(selectedDay)}
            onEventClick={openAssignment}
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
