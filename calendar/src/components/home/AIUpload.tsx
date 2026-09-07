import { motion } from "framer-motion";
import { Upload, Image, MessageSquare } from "lucide-react";

const chips = [
  { label: "Homework 5 – Due Mar 7", color: "bg-course-blue" },
  { label: "Lab Report – Due Mar 10", color: "bg-course-green" },
  { label: "Quiz 3 – Due Mar 8", color: "bg-course-purple" },
];

const chatMessages = [
  { role: "user", text: "Here's my Gradescope screenshot" },
  { role: "ai", text: "I found 3 assignments. Adding them to your calendar..." },
  { role: "ai", text: "Which class is this for? I see two possible matches." },
];

export function AIUpload() {
  return (
    <section className="py-24 sm:py-32 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-5xl font-bold mb-4">
            Upload a screenshot,{" "}
            <span className="gradient-text">chat with AI</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            No manual entry. Just show us what you see.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Upload card */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Upload className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Upload Screenshot</span>
            </div>
            <div className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center gap-3 mb-4">
              <Image className="w-10 h-10 text-muted-foreground" />
              <p className="text-xs text-muted-foreground text-center">Gradescope / Piazza / EdFinity</p>
            </div>

            {/* Fake thumbnail */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="surface-elevated rounded-lg p-3 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center">
                <Image className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-foreground">screenshot_gradescope.png</p>
                <div className="h-1.5 rounded-full bg-secondary mt-2 overflow-hidden">
                  <motion.div
                    initial={{ width: "0%" }}
                    whileInView={{ width: "100%" }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6, duration: 1.5, ease: "easeOut" }}
                    className="h-full rounded-full bg-primary"
                  />
                </div>
              </div>
            </motion.div>

            {/* Extracted chips */}
            <div className="mt-4 flex flex-col gap-2">
              {chips.map((chip, i) => (
                <motion.div
                  key={chip.label}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 1.2 + i * 0.15 }}
                  className="flex items-center gap-2 surface-elevated rounded-lg px-3 py-2"
                >
                  <div className={`w-2 h-2 rounded-full ${chip.color}`} />
                  <span className="text-xs font-medium text-foreground">{chip.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Chat bubbles */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-card p-6 flex flex-col"
          >
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">AI Assistant</span>
            </div>

            <div className="flex-1 flex flex-col gap-3">
              {chatMessages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.25 }}
                  className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${
                    msg.role === "user"
                      ? "self-end bg-primary text-primary-foreground"
                      : "self-start surface-elevated text-foreground"
                  }`}
                >
                  {msg.text}
                </motion.div>
              ))}
            </div>

            {/* Quick actions */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 1.2 }}
              className="mt-4 flex gap-2 flex-wrap"
            >
              {["CS 201", "MATH 301", "Skip"].map((opt) => (
                <span
                  key={opt}
                  className="px-3 py-1.5 rounded-full text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 cursor-pointer transition-colors"
                >
                  {opt}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
