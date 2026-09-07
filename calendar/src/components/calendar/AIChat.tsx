import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Cpu, ImagePlus, Loader2, LogIn, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useAssignments } from "@/contexts/AssignmentContext";
import { classifyInput } from "@/lib/ai-modes";
import { parseAssignmentsFromText, getModelStatus } from "@/lib/ai-parse";
import { readImages } from "@/lib/ocr";
import {
  fileToAttachment,
  imagesFromClipboard,
  isImageFile,
  MAX_ATTACHMENTS,
  type Attachment,
} from "@/lib/images";
import type { AssignmentInsert } from "@/types/assignment";
import { cn } from "@/lib/utils";

interface Message {
  id: number;
  role: "user" | "ai";
  text: string;
  thumbnails?: string[];
}

const PLATFORM_RESPONSE =
  "Type an assignment, or copy the list off your course page and paste it here — I'll put the deadlines on your calendar. For a whole semester, import your Brightspace link from the home page.";

const INITIAL: Message[] = [
  {
    id: 1,
    role: "ai",
    text: "Type an assignment, or copy your course page and paste the text here. I'll pull out the deadlines.",
  },
];

const QUICK_ACTIONS = [
  "CS252 lab 4 due Friday 11:59pm",
  "Remove Reflection items",
  "How does this work?",
];

type ModelState = Awaited<ReturnType<typeof getModelStatus>> | null;

export function AIChat() {
  const { user } = useAuth();
  const { addAssignments, assignments, removeAssignments } = useAssignments();

  const [messages, setMessages] = useState<Message[]>(INITIAL);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState("");
  const [dragging, setDragging] = useState(false);
  const [model, setModel] = useState<ModelState>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getModelStatus()
      .then(setModel)
      .catch(() => setModel(null));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const say = (role: Message["role"], text: string, thumbnails?: string[]) =>
    setMessages((prev) => [...prev, { id: Date.now() + prev.length, role, text, thumbnails }]);

  const addFiles = async (files: File[]) => {
    const images = files.filter(isImageFile);
    if (images.length === 0) return;

    const room = MAX_ATTACHMENTS - attachments.length;
    if (room <= 0) {
      say("ai", `You can attach up to ${MAX_ATTACHMENTS} images at a time.`);
      return;
    }

    try {
      const next = await Promise.all(images.slice(0, room).map(fileToAttachment));
      setAttachments((prev) => [...prev, ...next]);
    } catch (err) {
      say("ai", err instanceof Error ? err.message : "Could not read that image.");
    }
  };

  const removeAttachment = (id: string) =>
    setAttachments((prev) => prev.filter((a) => a.id !== id));

  const handleRemoveCommand = (pattern: string) => {
    const needle = pattern.toLowerCase();
    const matches = assignments.filter((a) => a.name.toLowerCase().includes(needle));

    if (matches.length === 0) {
      say("ai", `Nothing matching "${pattern}" is on your calendar.`);
      return;
    }
    removeAssignments(matches.map((a) => a.id));
    say("ai", `Removed ${matches.length} item${matches.length === 1 ? "" : "s"}.`);
  };

  /** Shared reporting for both the text and image paths. */
  const saveItems = async (items: AssignmentInsert[], emptyHint: string) => {
    if (items.length === 0) {
      say("ai", emptyHint);
      return;
    }

    const { added, duplicates } = await addAssignments(items);

    if (added === 0) {
      say(
        "ai",
        duplicates > 0
          ? `All ${duplicates} of those are already on your calendar.`
          : "Nothing new to add."
      );
      return;
    }

    const preview = items
      .slice(0, 4)
      .map((i) => `${i.course} ${i.name} (${i.dueDate})`)
      .join(", ");

    say(
      "ai",
      `Added ${added}: ${preview}${items.length > 4 ? "…" : ""}${
        duplicates > 0 ? ` — skipped ${duplicates} already on your calendar.` : ""
      }`
    );
  };

  const send = async (overrideText?: string) => {
    const trimmed = (overrideText ?? input).trim();
    const images = attachments;
    if ((!trimmed && images.length === 0) || busy) return;

    say("user", trimmed || `${images.length} screenshot${images.length === 1 ? "" : "s"}`,
      images.map((a) => a.dataUrl));
    setInput("");
    setAttachments([]);

    // Images always go to the model — a screenshot is never a platform question.
    if (images.length === 0 && classifyInput(trimmed) === "platform") {
      say("ai", PLATFORM_RESPONSE);
      return;
    }

    if (images.length === 0) {
      const removeMatch = trimmed.match(
        /^\s*(?:remove|delete)\s+(?:all\s+)?["']?(.+?)["']?\s*(?:items?|assignments?)?\s*$/i
      );
      if (removeMatch) {
        handleRemoveCommand(removeMatch[1].trim());
        return;
      }
    }

    setBusy(true);
    try {
      let payload = trimmed;

      if (images.length > 0) {
        setStage("Reading the screenshot…");
        const { text, confidence } = await readImages(images.map((a) => a.dataUrl));

        if (!text.trim()) {
          say("ai", "I couldn't read any text in that image. A sharper or closer crop usually helps.");
          return;
        }
        if (confidence < 60) {
          say("ai", "That image is a little blurry, so I may have misread some of it.");
        }
        // OCR output goes through the same parser as a pasted page.
        payload = trimmed ? `${trimmed}\n\n${text}` : text;
      }

      setStage(images.length > 0 ? "Sorting out the deadlines…" : "Reading that on your GPU…");
      const items = await parseAssignmentsFromText(payload);

      await saveItems(
        items,
        images.length > 0
          ? "I read the image but couldn't find any dated assignments in it."
          : 'I couldn\'t find a deadline in that. Try "CS252 lab 4 due Friday 11:59pm".'
      );
    } catch (err) {
      say("ai", err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
      setStage("");
    }
  };

  if (!user) {
    return (
      <aside className="flex h-full flex-col border-l border-border bg-card">
        <Header model={model} />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="max-w-[220px] text-sm text-muted-foreground">
            Sign in to add assignments by typing or pasting them.
          </p>
          <div className="flex gap-2">
            <Button asChild size="sm">
              <Link to="/signin">
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Sign in
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/signup">Sign up</Link>
            </Button>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        "relative flex h-full flex-col border-l border-border bg-card",
        dragging && "ring-2 ring-inset ring-ring"
      )}
      onPaste={(e) => {
        const files = imagesFromClipboard(e.clipboardData);
        if (files.length) {
          e.preventDefault();
          addFiles(files);
        }
      }}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) {
          e.preventDefault();
          setDragging(true);
        }
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        addFiles(Array.from(e.dataTransfer.files));
      }}
    >
      <Header model={model} />

      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-background/85">
          <p className="text-sm font-bold text-foreground">Drop screenshots to read them</p>
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto p-4 scrollbar-thin" aria-live="polite">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "max-w-[92%] rounded-md px-3 py-2 text-sm leading-snug",
              msg.role === "user"
                ? "ml-auto bg-primary text-primary-foreground"
                : "border border-border bg-background text-foreground"
            )}
          >
            {msg.thumbnails && msg.thumbnails.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {msg.thumbnails.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt=""
                    className="h-16 w-16 rounded border border-border/40 object-cover"
                  />
                ))}
              </div>
            )}
            {msg.text}
          </div>
        ))}

        {busy && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            {stage || "Working…"}
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      {attachments.length === 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-2">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action}
              onClick={() => send(action)}
              disabled={busy}
              className="rounded-full border border-border px-2.5 py-1 text-[11px] font-bold
                         text-muted-foreground transition-colors hover:bg-secondary
                         hover:text-foreground disabled:opacity-50"
            >
              {action}
            </button>
          ))}
        </div>
      )}

      {attachments.length > 0 && (
        <ul className="flex flex-wrap gap-2 px-4 pb-2">
          {attachments.map((a) => (
            <li key={a.id} className="relative">
              <img
                src={a.dataUrl}
                alt={a.name}
                className="h-16 w-16 rounded border border-border object-cover"
              />
              <button
                type="button"
                onClick={() => removeAttachment(a.id)}
                aria-label={`Remove ${a.name}`}
                className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full
                           border border-border bg-background text-foreground hover:bg-secondary"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="border-t border-border p-3">
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => {
              addFiles(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy || attachments.length >= MAX_ATTACHMENTS}
            aria-label="Attach a screenshot"
            title="Attach a screenshot"
            className="relative"
          >
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
          </Button>

          <label htmlFor="chat-input" className="sr-only">
            Assignment text
          </label>
          <input
            id="chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            disabled={busy}
            placeholder={
              attachments.length > 0 ? "Add a note (optional)…" : "Type, or paste a screenshot…"
            }
            className="h-11 flex-1 rounded-md border border-input bg-background px-3 text-sm
                       text-foreground placeholder:text-muted-foreground/70
                       focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0
                       disabled:opacity-60"
          />

          <Button
            size="icon"
            onClick={() => send()}
            disabled={busy || (!input.trim() && attachments.length === 0)}
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </div>
    </aside>
  );
}

function Header({ model }: { model: ModelState }) {
  const textOffline = model && (!model.online || model.modelAvailable === false);
  const visionMissing = model?.online && model.visionAvailable === false;

  return (
    <header className="rule px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-foreground">Assistant</h2>
        <span
          className={cn(
            "flex items-center gap-1.5 text-[11px] font-bold",
            textOffline ? "text-destructive" : "text-muted-foreground"
          )}
        >
          <Cpu className="h-3.5 w-3.5" aria-hidden="true" />
          {model ? (textOffline ? "Model offline" : model.model) : "Checking…"}
        </span>
      </div>
      <p className="mt-0.5 text-sm text-muted-foreground">
        {textOffline
          ? "The model is starting up. Try again in a moment."
          : "A self-hosted model. Screenshots are read in your browser."}
      </p>
    </header>
  );
}
