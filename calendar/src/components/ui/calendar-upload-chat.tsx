"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ArrowUp, Paperclip } from "lucide-react";

interface UseAutoResizeTextareaProps {
  minHeight: number;
  maxHeight?: number;
}

function useAutoResizeTextarea({
  minHeight,
  maxHeight,
}: UseAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      textarea.style.height = `${minHeight}px`;
      const newHeight = Math.max(
        minHeight,
        Math.min(
          textarea.scrollHeight,
          maxHeight ?? Number.POSITIVE_INFINITY
        )
      );
      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = `${minHeight}px`;
    }
  }, [minHeight]);

  useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
}

interface CalendarUploadChatProps {
  onSubmit?: (url: string) => void;
  onFileSelect?: (file: File) => void;
  className?: string;
  placeholder?: string;
  heading?: string;
  disabled?: boolean;
  loading?: boolean;
  success?: boolean;
}

export function CalendarUploadChat({
  onSubmit,
  onFileSelect,
  className,
  placeholder = "Paste your Brightspace calendar subscription link...\nhttps://.../calendar/feed.ics?token=XXXXX",
  heading = "Let's build your calendar.",
  disabled = false,
  loading = false,
  success = false,
}: CalendarUploadChatProps) {
  const [value, setValue] = useState("");
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 60,
    maxHeight: 200,
  });

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed && onSubmit) {
      onSubmit(trimmed);
      setValue("");
      adjustHeight(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileSelect) {
      onFileSelect(file);
    }
    e.target.value = "";
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center w-full max-w-4xl mx-auto p-4 space-y-8",
        className
      )}
    >
      <h1 className="text-4xl font-bold text-white text-center drop-shadow-[0_0_15px_hsl(var(--primary)_/_0.5)]">
        {heading}
      </h1>

      <div className="w-full">
        <div className="relative bg-neutral-900/90 border border-neutral-800 rounded-xl backdrop-blur-sm">
          <div className="overflow-y-auto">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                adjustHeight();
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                "w-full px-4 py-3",
                "resize-none",
                "bg-transparent",
                "border-none",
                "text-white text-sm",
                "focus:outline-none",
                "focus-visible:ring-0 focus-visible:ring-offset-0",
                "placeholder:text-neutral-500 placeholder:text-sm",
                "min-h-[60px]"
              )}
              style={{ overflow: "hidden" }}
            />
          </div>

          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <input
                type="file"
                id="calendar-file-upload"
                className="hidden"
                accept=".ics,.ipynb"
                onChange={handleFileChange}
              />
              {onFileSelect && (
                <button
                  type="button"
                  onClick={() =>
                    document.getElementById("calendar-file-upload")?.click()
                  }
                  disabled={disabled}
                  className="group p-2 hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                  <Paperclip className="w-4 h-4 text-neutral-400 group-hover:text-white" />
                  <span className="text-xs text-zinc-400 hidden group-hover:inline transition-opacity">
                    Attach
                  </span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={disabled || !value.trim() || loading}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm transition-colors border flex items-center justify-center gap-1",
                  value.trim() && !loading && !success
                    ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                    : "border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {loading ? (
                  <span className="animate-pulse">Loading...</span>
                ) : success ? (
                  <span className="text-primary">Done</span>
                ) : (
                  <>
                    <ArrowUp className="w-4 h-4" />
                    <span className="sr-only">Submit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
