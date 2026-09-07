import { useState } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COURSE_COLORS, courseColorClasses, type CourseColor } from "@/lib/course-colors";
import { cn } from "@/lib/utils";
import type { AssignmentInsert } from "@/types/assignment";

interface ManualAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (a: AssignmentInsert) => Promise<{ success: boolean; duplicate?: boolean }>;
}

const COLOR_LABELS: Record<CourseColor, string> = {
  blue: "Blue",
  amber: "Amber",
  green: "Green",
  purple: "Purple",
  rose: "Rose",
};

/** "14:30" from <input type="time"> to the "2:30 PM" the app stores. */
function toStoredTime(value: string): string | null {
  if (!value) return null;
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const period = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${period}`;
}

export function ManualAddDialog({ open, onOpenChange, onSubmit }: ManualAddDialogProps) {
  const [course, setCourse] = useState("");
  const [name, setName] = useState("");
  const [dueDate, setDueDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dueTime, setDueTime] = useState("");
  const [link, setLink] = useState("");
  const [color, setColor] = useState<CourseColor>("blue");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setCourse("");
    setName("");
    setDueDate(format(new Date(), "yyyy-MM-dd"));
    setDueTime("");
    setLink("");
    setColor("blue");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!course.trim() || !name.trim()) {
      setError("Course and assignment name are both required.");
      return;
    }

    setSaving(true);
    const result = await onSubmit({
      course: course.trim(),
      name: name.trim(),
      dueDate,
      dueTime: toStoredTime(dueTime),
      link: link.trim() || null,
      color,
      source: "manual",
    });
    setSaving(false);

    if (result.success) {
      reset();
      onOpenChange(false);
    } else if (result.duplicate) {
      setError("That assignment is already on your calendar.");
    } else {
      setError("Could not save. Check that the server is running.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add an assignment</DialogTitle>
          <DialogDescription>
            For a whole semester, import your Brightspace link instead.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <Label htmlFor="course">Course</Label>
            <Input
              id="course"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="CS 25200"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="name">Assignment</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Homework 5"
              className="mt-1.5"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="dueDate">Due date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="dueTime">Time</Label>
              <Input
                id="dueTime"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="link">Link</Label>
            <Input
              id="link"
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://…"
              className="mt-1.5"
            />
          </div>

          <fieldset>
            <legend className="text-sm font-bold text-foreground">Colour</legend>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {COURSE_COLORS.map((value) => {
                const { bg } = courseColorClasses(value, value);
                const selected = color === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setColor(value)}
                    aria-pressed={selected}
                    aria-label={COLOR_LABELS[value]}
                    title={COLOR_LABELS[value]}
                    className={cn(
                      "h-8 w-8 rounded-full transition-transform",
                      bg,
                      selected
                        ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                        : "hover:scale-110"
                    )}
                  />
                );
              })}
            </div>
          </fieldset>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Add"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
