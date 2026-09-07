import { useState } from "react";
import { motion } from "framer-motion";
import { ListTodo, CalendarDays, Sparkles } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { RecommendedTasks } from "@/components/calendar/RecommendedTasks";
import { FullScreenCalendar } from "@/components/calendar/FullScreenCalendar";
import { AIChat } from "@/components/calendar/AIChat";
import { useAssignments } from "@/contexts/AssignmentContext";

const Calendar = () => {
  const { loading } = useAssignments();
  const [mobileTab, setMobileTab] = useState<"tasks" | "calendar" | "ai">("calendar");
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isTablet = useMediaQuery("(min-width: 768px)");

  // Mobile layout
  if (!isTablet) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <div className="flex items-center gap-2 p-3 border-b border-border bg-card/50">
          <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-[8px]">SC</span>
          </div>
          <span className="text-sm font-semibold text-foreground">SmartCal</span>
        </div>

        <div className="flex-1 overflow-hidden">
          {loading ? (
            <SkeletonLoader />
          ) : (
            <>
              {mobileTab === "tasks" && <RecommendedTasks />}
              {mobileTab === "calendar" && <FullScreenCalendar />}
              {mobileTab === "ai" && <AIChat />}
            </>
          )}
        </div>

        {/* Bottom tabs */}
        <div className="flex border-t border-border">
          {[
            { key: "tasks" as const, icon: ListTodo, label: "Tasks" },
            { key: "calendar" as const, icon: CalendarDays, label: "Calendar" },
            { key: "ai" as const, icon: Sparkles, label: "AI" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setMobileTab(tab.key)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                mobileTab === tab.key ? "text-primary" : "text-foreground/70"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Desktop / Tablet layout
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-[8px]">SC</span>
          </div>
          <span className="text-sm font-semibold text-foreground">SmartCal</span>
        </div>
      </div>

      {loading ? (
        <SkeletonLoader />
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Tasks */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-72 flex-shrink-0 border-r border-border shadow-sm hidden lg:flex flex-col"
          >
            <RecommendedTasks />
          </motion.div>

          {/* Center: Calendar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <FullScreenCalendar />
          </motion.div>

          {/* Right: AI Chat */}
          {isDesktop && (
            <div className="w-80 flex-shrink-0">
              <AIChat />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function SkeletonLoader() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-sm text-foreground/80 font-medium">Importing your calendar...</p>
      </motion.div>
    </div>
  );
}

export default Calendar;
