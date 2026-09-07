import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, ListTodo, Loader2, LogOut, Sparkles } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { RecommendedTasks } from "@/components/calendar/RecommendedTasks";
import { FullScreenCalendar } from "@/components/calendar/FullScreenCalendar";
import { AIChat } from "@/components/calendar/AIChat";
import { AssignmentDetailDialog } from "@/components/calendar/AssignmentDetailDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useAssignments } from "@/contexts/AssignmentContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import type { Assignment } from "@/types/assignment";

const TABS = [
  { key: "tasks", icon: ListTodo, label: "Tasks" },
  { key: "calendar", icon: CalendarDays, label: "Calendar" },
  { key: "ai", icon: Sparkles, label: "Assistant" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const Calendar = () => {
  const { loading, removeAssignment, removeAssignments, assignments } = useAssignments();
  const { user, signOut } = useAuth();
  const [mobileTab, setMobileTab] = useState<TabKey>("calendar");
  const [detail, setDetail] = useState<Assignment | null>(null);

  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isTablet = useMediaQuery("(min-width: 768px)");

  const deleteSimilar = (assignment: Assignment) => {
    const ids = assignments
      .filter(
        (a) =>
          a.course === assignment.course &&
          a.name === assignment.name &&
          a.dueDate === assignment.dueDate
      )
      .map((a) => a.id);
    removeAssignments(ids);
  };

  const header = (
    <header className="flex items-center justify-between gap-3 rule bg-card px-4 py-2.5">
      <Link to="/" className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="grid h-7 w-7 place-items-center rounded bg-primary text-[10px] font-bold text-primary-foreground"
        >
          SC
        </span>
        <span className="text-sm font-bold text-foreground">SmartCal</span>
      </Link>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        {user && (
          <>
            <span className="hidden max-w-[180px] truncate px-2 text-sm text-muted-foreground sm:inline">
              {user.email}
            </span>
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </Button>
          </>
        )}
      </div>
    </header>
  );

  const body = loading ? (
    <div className="flex flex-1 items-center justify-center">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Loading your calendar…
      </p>
    </div>
  ) : null;

  if (!isTablet) {
    return (
      <div className="flex h-screen flex-col bg-background">
        {header}

        <main className="flex-1 overflow-hidden">
          {body ?? (
            <>
              {mobileTab === "tasks" && <RecommendedTasks onSelect={setDetail} />}
              {mobileTab === "calendar" && <FullScreenCalendar />}
              {mobileTab === "ai" && <AIChat />}
            </>
          )}
        </main>

        <nav className="flex border-t border-border bg-card" aria-label="Sections">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setMobileTab(tab.key)}
              aria-current={mobileTab === tab.key ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-bold transition-colors",
                mobileTab === tab.key
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="h-5 w-5" aria-hidden="true" />
              {tab.label}
            </button>
          ))}
        </nav>

        <AssignmentDetailDialog
          assignment={detail}
          open={detail !== null}
          onOpenChange={(open) => !open && setDetail(null)}
          onDelete={removeAssignment}
          onDeleteSimilar={deleteSimilar}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {header}

      {body ?? (
        <div className="flex flex-1 overflow-hidden">
          <div className="hidden w-72 shrink-0 border-r border-border lg:flex lg:flex-col">
            <RecommendedTasks onSelect={setDetail} />
          </div>

          <main className="flex flex-1 flex-col overflow-hidden">
            <FullScreenCalendar />
          </main>

          {isDesktop && (
            <div className="w-80 shrink-0">
              <AIChat />
            </div>
          )}
        </div>
      )}

      <AssignmentDetailDialog
        assignment={detail}
        open={detail !== null}
        onOpenChange={(open) => !open && setDetail(null)}
        onDelete={removeAssignment}
        onDeleteSimilar={deleteSimilar}
      />
    </div>
  );
};

export default Calendar;
