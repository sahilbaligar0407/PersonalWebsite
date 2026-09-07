import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Upload, Sparkles, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useAssignments } from "@/contexts/AssignmentContext";
import { useAIRateLimit } from "@/hooks/useAIRateLimit";
import { classifyInput } from "@/lib/ai-modes";
import { parseAssignmentsFromText } from "@/lib/ai-parse";
import { toast } from "sonner";

interface Message {
  id: number;
  role: "user" | "ai";
  text: string;
}

const PLATFORM_RESPONSE = `SmartCal helps you organize your academic assignments. Paste your Brightspace calendar link on the homepage, or use this chat to add assignments by typing them (e.g. "CS251 Homework 5 due April 12"). You can also upload screenshots of assignment boards. I'll add them to your calendar with no duplicates.`;

const UNSUPPORTED_RESPONSE = `This AI assistant is only meant to help parse assignments into your calendar. Please provide assignment information or upload an image.`;

const initialMessages: Message[] = [
  { id: 1, role: "ai", text: "Hey! I'm your scheduling assistant." },
  { id: 2, role: "ai", text: "Paste assignment text or upload a screenshot. I'll add them to your calendar." },
];

const quickActions = ["CS251 HW5 due Friday", "Remove Week begins items", "How does this work?"];

export function AIChat() {
  const { user } = useAuth();
  const { addAssignments, assignments, removeAssignments } = useAssignments();
  const { canUse, remaining, increment } = useAIRateLimit();
  const [collapsed, setCollapsed] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = (role: "user" | "ai", text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now() + prev.length, role, text },
    ]);
  };

  const handleRemoveAllSimilar = (pattern: string) => {
    const lower = pattern.toLowerCase();
    const toRemove = assignments.filter((a) =>
      a.name.toLowerCase().includes(lower)
    );
    if (toRemove.length === 0) {
      addMessage("ai", `No items matching "${pattern}" found.`);
      return;
    }
    removeAssignments(toRemove.map((a) => a.id));
    addMessage("ai", `Removed ${toRemove.length} item(s).`);
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    addMessage("user", trimmed);
    setInput("");
    setIsProcessing(true);

    const mode = classifyInput(trimmed);

    if (mode === "platform") {
      setTimeout(() => {
        addMessage("ai", PLATFORM_RESPONSE);
        setIsProcessing(false);
      }, 500);
      return;
    }

    if (mode === "unsupported") {
      setTimeout(() => {
        addMessage("ai", UNSUPPORTED_RESPONSE);
        setIsProcessing(false);
      }, 500);
      return;
    }

    if (mode === "assignment") {
      if (!canUse) {
        addMessage("ai", `You've used all ${remaining} AI requests this month. Resets next month.`);
        setIsProcessing(false);
        return;
      }

      const removeMatch = trimmed.match(/remove\s+(?:all\s+)?["']?([^"']+)["']?\s*(?:items?)?/i);
      if (removeMatch) {
        handleRemoveAllSimilar(removeMatch[1].trim());
        setIsProcessing(false);
        return;
      }

      try {
        const items = await parseAssignmentsFromText(trimmed);
        await increment();
        const { added, duplicates } = await addAssignments(items);
        addMessage(
          "ai",
          added > 0
            ? `Added ${added} assignment(s)${duplicates > 0 ? ` (${duplicates} duplicate(s) skipped)` : ""}.`
            : duplicates > 0
            ? "Those assignments are already in your calendar."
            : "I couldn't find any assignments in that message. Try: 'CS251 Homework 5 due April 12'"
        );
      } catch (err) {
        addMessage(
          "ai",
          err instanceof Error ? err.message : "Something went wrong. Check your API key or try again."
        );
      }
      setIsProcessing(false);
      return;
    }

    addMessage("ai", PLATFORM_RESPONSE);
    setIsProcessing(false);
  };

  if (collapsed) {
    return (
      <motion.div
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 48, opacity: 1 }}
        className="h-full border-l border-border flex flex-col items-center py-4 cursor-pointer hover:bg-secondary/50 transition-colors"
        onClick={() => setCollapsed(false)}
      >
        <Sparkles className="w-5 h-5 text-primary mb-2" />
        <span className="text-[10px] font-medium text-foreground/80" style={{ writingMode: "vertical-rl" }}>
          AI Assistant
        </span>
      </motion.div>
    );
  }

  if (!user) {
    return (
      <motion.div
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: "100%", opacity: 1 }}
        className="h-full flex flex-col border-l border-border"
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">AI Assistant</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="rounded-full bg-primary/10 p-4">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground mb-1">Sign in to use AI</p>
            <p className="text-xs text-foreground/75 max-w-[200px]">
              Parse assignments from text or screenshots. Save calendars and get recommendations.
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/signin">
              <Button size="sm" className="gap-2">
                <LogIn className="w-4 h-4" />
                Sign In
              </Button>
            </Link>
            <Link to="/signup">
              <Button variant="outline" size="sm">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: "100%", opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      className="h-full flex flex-col border-l border-border"
    >
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">AI Assistant</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-foreground/80 font-medium">{remaining} AI left</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCollapsed(true)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-thin">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`max-w-[90%] rounded-xl px-3 py-2 text-sm ${
                msg.role === "user"
                  ? "self-end bg-primary text-primary-foreground"
                  : "self-start surface-elevated text-foreground"
              }`}
            >
              {msg.text}
            </motion.div>
          ))}
        </AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="self-start surface-elevated rounded-xl px-3 py-2 text-sm text-foreground/80"
          >
            ...
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 pb-2 flex gap-2 flex-wrap">
        {quickActions.map((action) => (
          <button
            key={action}
            onClick={() => sendMessage(action)}
            disabled={isProcessing}
            className="px-3 py-1 rounded-full text-xs font-medium border border-border text-foreground/80 hover:text-foreground hover:border-primary/50 transition-colors disabled:opacity-50"
          >
            {action}
          </button>
        ))}
      </div>

      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <button
            className="flex-shrink-0 w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
            title="Image upload coming soon"
          >
            <Upload className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
            placeholder="Paste assignments or ask..."
            className="flex-1 h-9 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          <Button
            size="icon"
            className="h-9 w-9"
            onClick={() => sendMessage(input)}
            disabled={isProcessing}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
