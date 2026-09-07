import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Shield } from "lucide-react";

const mockEvents = [
  { title: "CS 201 – Data Structures", time: "9:00 AM", color: "bg-course-blue" },
  { title: "MATH 301 – Linear Algebra", time: "11:00 AM", color: "bg-course-purple" },
  { title: "ENG 102 – Academic Writing", time: "1:00 PM", color: "bg-course-orange" },
  { title: "PHYS 201 – Mechanics", time: "3:00 PM", color: "bg-course-green" },
  { title: "CS 201 – Data Structures", time: "9:00 AM", color: "bg-course-blue", isDupe: true },
];

const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export function CalendarAlive() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [60, -60]);

  return (
    <section id="how-it-works" ref={ref} className="py-24 sm:py-32 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-5xl font-bold mb-4">
            Calendar that feels <span className="gradient-text">alive</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            Watch your schedule assemble itself.
          </p>
        </motion.div>

        <motion.div style={{ y }} className="relative">
          {/* Calendar grid */}
          <div className="glass-card p-4 sm:p-6 max-w-4xl mx-auto">
            <div className="grid grid-cols-5 gap-2 mb-3">
              {days.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-5 gap-2 min-h-[300px]">
              {days.map((day, dayIdx) => (
                <div key={day} className="flex flex-col gap-2">
                  {mockEvents
                    .filter((_, i) => (i + dayIdx) % 3 === 0 || (i === 4 && dayIdx === 0))
                    .map((evt, i) => (
                      <motion.div
                        key={`${day}-${i}`}
                        initial={{ opacity: 0, x: -40, scale: 0.9 }}
                        whileInView={{ opacity: evt.isDupe ? 0.4 : 1, x: 0, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: dayIdx * 0.08 + i * 0.12, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className={`relative rounded-lg p-3 border border-border/50 ${evt.isDupe ? "opacity-40 line-through" : ""}`}
                        style={{ background: "hsl(var(--surface-elevated))" }}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${evt.color} absolute top-2 right-2`} />
                        <p className="text-xs font-medium text-foreground truncate">{evt.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{evt.time}</p>
                        {evt.isDupe && (
                          <motion.div
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.8 }}
                            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive flex items-center justify-center"
                          >
                            <span className="text-[8px] text-destructive-foreground font-bold">✕</span>
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                </div>
              ))}
            </div>
          </div>

          {/* Floating dedupe shield */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 1, type: "spring", stiffness: 200 }}
            className="absolute -top-4 -right-4 sm:right-8 sm:top-4"
          >
            <div className="glass-card glow-border p-3 rounded-full animate-float">
              <Shield className="w-6 h-6 text-primary" />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
