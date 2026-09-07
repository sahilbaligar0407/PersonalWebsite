import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Trash2 } from "lucide-react";
import type { Assignment } from "@/types/assignment";
import { cn } from "@/lib/utils";

const courseColorMap: Record<string, string> = {
  blue: "bg-course-blue",
  purple: "bg-course-purple",
  orange: "bg-course-orange",
  green: "bg-course-green",
  pink: "bg-course-pink",
};

interface AssignmentDetailDialogProps {
  assignment: Assignment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (id: string) => void;
  onDeleteSimilar?: (assignment: Assignment) => void;
}

export function AssignmentDetailDialog({
  assignment,
  open,
  onOpenChange,
  onDelete,
  onDeleteSimilar,
}: AssignmentDetailDialogProps) {
  if (!assignment) return null;

  const colorClass = courseColorMap[assignment.color] ?? "bg-primary/20";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className={cn("w-2 h-2 rounded-full flex-shrink-0", colorClass)} />
            {assignment.course} - {assignment.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              <span className="text-foreground font-medium">Due:</span> {assignment.dueDate}
              {assignment.dueTime && ` at ${assignment.dueTime}`}
            </p>
            {assignment.link && (
              <a
                href={assignment.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                Open assignment link
              </a>
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              variant="destructive"
              size="sm"
              className="gap-2"
              onClick={() => {
                onDelete(assignment.id);
                onOpenChange(false);
              }}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
            {onDeleteSimilar && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onDeleteSimilar(assignment);
                  onOpenChange(false);
                }}
              >
                Delete all similar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
