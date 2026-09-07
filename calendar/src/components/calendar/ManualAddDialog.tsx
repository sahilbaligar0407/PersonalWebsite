import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AssignmentInsert } from "@/types/assignment";
import { format } from "date-fns";

interface ManualAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (a: AssignmentInsert) => Promise<{ success: boolean; duplicate?: boolean }>;
}

const COURSE_COLORS = [
  { value: "blue", label: "Blue" },
  { value: "purple", label: "Purple" },
  { value: "orange", label: "Orange" },
  { value: "green", label: "Green" },
  { value: "pink", label: "Pink" },
];

export function ManualAddDialog({
  open,
  onOpenChange,
  onSubmit,
}: ManualAddDialogProps) {
  const [course, setCourse] = useState("");
  const [name, setName] = useState("");
  const [dueDate, setDueDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dueTime, setDueTime] = useState("");
  const [link, setLink] = useState("");
  const [color, setColor] = useState("blue");
  const [error, setError] = useState<string | null>(null);

  const formatTimeForStorage = (time: string) => {
    if (!time) return null;
    const [h, m] = time.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!course.trim() || !name.trim()) {
      setError("Course and assignment name are required");
      return;
    }
    const result = await onSubmit({
      course: course.trim(),
      name: name.trim(),
      dueDate,
      dueTime: dueTime.trim() ? formatTimeForStorage(dueTime) : null,
      link: link.trim() || null,
      color,
      source: "manual",
    });
    if (result.success) {
      onOpenChange(false);
      setCourse("");
      setName("");
      setDueDate(format(new Date(), "yyyy-MM-dd"));
      setDueTime("");
      setLink("");
      setColor("blue");
    } else if (result.duplicate) {
      setError("This assignment already exists");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Assignment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="course">Course name</Label>
            <Input
              id="course"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="e.g. CS 251"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="name">Assignment name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Homework 5"
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dueDate">Due date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="dueTime">Due time (optional)</Label>
              <Input
                id="dueTime"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="link">Link (optional)</Label>
            <Input
              id="link"
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
              className="mt-1"
            />
          </div>
          <div>
            <Label>Color</Label>
            <div className="flex gap-2 mt-1 flex-wrap">
              {COURSE_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-6 h-6 rounded-full border-2 transition-colors ${
                    color === c.value
                      ? "border-foreground ring-2 ring-offset-2 ring-offset-background"
                      : "border-transparent"
                  } ${
                    c.value === "blue"
                      ? "bg-course-blue"
                      : c.value === "purple"
                      ? "bg-course-purple"
                      : c.value === "orange"
                      ? "bg-course-orange"
                      : c.value === "green"
                      ? "bg-course-green"
                      : "bg-course-pink"
                  }`}
                  title={c.label}
                />
              ))}
            </div>
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
