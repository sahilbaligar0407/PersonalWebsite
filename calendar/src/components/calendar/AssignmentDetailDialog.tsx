import { format, parseISO } from "date-fns";
import { ExternalLink, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { courseColorClasses } from "@/lib/course-colors";
import { cn } from "@/lib/utils";
import type { Assignment } from "@/types/assignment";

interface AssignmentDetailDialogProps {
  assignment: Assignment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (id: string) => void;
  onDeleteSimilar?: (assignment: Assignment) => void;
}

const SOURCE_LABEL: Record<Assignment["source"], string> = {
  ics: "Imported from Brightspace",
  manual: "Added manually",
  ai_text: "Added by the local model",
  ai_image: "Added from an image",
};

export function AssignmentDetailDialog({
  assignment,
  open,
  onOpenChange,
  onDelete,
  onDeleteSimilar,
}: AssignmentDetailDialogProps) {
  if (!assignment) return null;

  const { bg, text } = courseColorClasses(assignment.color, assignment.course);
  const due = parseISO(assignment.dueDate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <span className={cn("text-[11px] font-bold uppercase tracking-wide", text)}>
            <span
              className={cn("mr-2 inline-block h-2 w-2 rounded-full align-middle", bg)}
              aria-hidden="true"
            />
            {assignment.course}
          </span>
          <DialogTitle className="text-left text-xl">{assignment.name}</DialogTitle>
          <DialogDescription className="text-left">
            Due {format(due, "EEEE, MMMM d, yyyy")}
            {assignment.dueTime && ` at ${assignment.dueTime}`}
          </DialogDescription>
        </DialogHeader>

        <dl className="rule border-b-0 border-t border-border pt-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Source</dt>
            <dd className="text-foreground">{SOURCE_LABEL[assignment.source]}</dd>
          </div>
        </dl>

        {assignment.link && (
          <a
            href={assignment.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-bold text-primary underline underline-offset-4"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Open in Brightspace
          </a>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              onDelete(assignment.id);
              onOpenChange(false);
            }}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
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
              Delete duplicates
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
