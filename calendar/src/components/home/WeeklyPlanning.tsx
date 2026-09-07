import { motion } from "framer-motion";

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const tasks = [
  { title: "Submit Lab 4", course: "CS 201", due: "Today", priority: "high" },
  { title: "Read Ch. 7", course: "MATH 301", due: "Today", priority: "medium" },
  { title: "Discussion Post", course: "ENG 102", due: "Tomorrow", priority: "low" },
  { title: "Homework 5", course: "CS 201", due: "Wed", priority: "high" },
  { title: "Quiz Prep", course: "PHYS 201", due: "Thu", priority: "medium" },
  { title: "Essay Draft", course: "ENG 102", due: "Fri", priority: "high" },
  { title: "Lab Pre-work", course: "PHYS 201", due: "Fri", priority: "low" },
  { title: "Study Group", course: "MATH 301", due: "Sat", priority: "medium" },
];

const priorityColors: Record<string, string> = {
  high: "bg-destructive",
  medium: "bg-warning",
  low: "bg-success",
};

const courseColors: Record<string, string> = {
  "CS 201": "bg-course-blue",
  "MATH 301": "bg-course-purple",
  "ENG 102": "bg-course-orange",
  "PHYS 201": "bg-course-green",
};

export function WeeklyPlanning() {
  return (
    <section id="preview" className="py-24 sm:py-32 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-5xl font-bold mb-4">
            Weekly planning, <span className="gradient-text">simplified</span>
          </h2>
        </motion.div>

        {/* Week strip */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-thin"
        >
          {weekDays.map((day, i) => (
            <motion.div
              key={day}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className={`flex-shrink-0 w-28 glass-card p-3 text-center cursor-pointer hover:border-primary/50 transition-colors ${
                i === 0 ? "glow-border" : ""
              }`}
            >
              <p className="text-xs text-muted-foreground">{day}</p>
              <p className="text-lg font-semibold text-foreground mt-1">{3 + i}</p>
              <div className="flex justify-center gap-1 mt-2">
                {tasks
                  .filter((_, ti) => (ti + i) % 3 === 0)
                  .slice(0, 3)
                  .map((t, ti) => (
                    <div key={ti} className={`w-1.5 h-1.5 rounded-full ${priorityColors[t.priority]}`} />
                  ))}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Recommended today */}
        <div className="glass-card p-6 max-w-2xl mx-auto">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Recommended Today
          </h3>
          <div className="flex flex-col gap-2">
            {tasks.map((task, i) => (
              <motion.div
                key={task.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                className="flex items-center gap-3 surface-elevated rounded-lg px-4 py-3 hover:bg-secondary/80 transition-colors cursor-pointer group"
              >
                <div className={`w-2 h-2 rounded-full ${priorityColors[task.priority]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {task.title}
                  </p>
                </div>
                <span className={`w-2 h-2 rounded-full ${courseColors[task.course]}`} />
                <span className="text-xs text-muted-foreground flex-shrink-0">{task.course}</span>
                <span className="text-xs text-muted-foreground flex-shrink-0">{task.due}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
