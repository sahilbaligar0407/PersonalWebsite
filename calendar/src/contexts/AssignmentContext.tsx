import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Assignment, AssignmentInsert } from "@/types/assignment";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

type AssignmentContextType = {
  assignments: Assignment[];
  loading: boolean;
  /** True while showing an unsaved, signed-out import. */
  preview: boolean;
  addAssignment: (a: AssignmentInsert) => Promise<{ success: boolean; duplicate?: boolean }>;
  addAssignments: (items: AssignmentInsert[]) => Promise<{ added: number; duplicates: number }>;
  removeAssignment: (id: string) => Promise<void>;
  removeAssignments: (ids: string[]) => Promise<void>;
  updateAssignment: (a: Assignment) => Promise<void>;
  isDuplicate: (course: string, name: string, dueDate: string) => boolean;
  refresh: () => Promise<void>;
};

const AssignmentContext = createContext<AssignmentContextType | undefined>(undefined);

const sortByDue = (a: Assignment, b: Assignment) =>
  a.dueDate.localeCompare(b.dueDate) || (a.dueTime ?? "").localeCompare(b.dueTime ?? "");

/**
 * Signed-out imports are kept here so someone can paste a Brightspace feed and
 * see their semester before deciding whether to make an account. It is a
 * preview, not storage: it never leaves the browser, and it is handed to the
 * server and cleared the moment they do sign in.
 */
const PREVIEW_KEY = "smartcal.preview";

function readPreview(): Assignment[] {
  try {
    const raw = localStorage.getItem(PREVIEW_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Assignment[]) : [];
  } catch {
    return []; // private mode, or something else wrote nonsense there
  }
}

function writePreview(items: Assignment[]) {
  try {
    if (items.length) localStorage.setItem(PREVIEW_KEY, JSON.stringify(items));
    else localStorage.removeItem(PREVIEW_KEY);
  } catch {
    /* private mode: the preview just stays in memory for this page view */
  }
}

const sameAssignment = (a: { course: string; name: string; dueDate: string }, b: Assignment) =>
  a.course === b.course && a.name === b.name && a.dueDate === b.dueDate;

export function AssignmentProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      const local = readPreview();
      setAssignments(local.sort(sortByDue));
      setPreview(local.length > 0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setPreview(false);
    try {
      // Anything imported before signing in belongs to this account now. Push it
      // once, then clear it so it can't be re-added on the next page load.
      const pending = readPreview();
      if (pending.length) {
        writePreview([]);
        await api
          .addAssignments(
            pending.map(({ course, name, dueDate, dueTime, link, color }) => ({
              course,
              name,
              dueDate,
              dueTime,
              link,
              color,
              source: "ics" as const,
            }))
          )
          .catch(() => {
            /* Duplicates and failures are both fine to swallow: the list below
               is re-read from the server either way. */
          });
      }

      const { assignments } = await api.listAssignments();
      setAssignments(assignments);
    } catch {
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isDuplicate = useCallback(
    (course: string, name: string, dueDate: string) =>
      assignments.some((a) => sameAssignment({ course, name, dueDate }, a)),
    [assignments]
  );

  const addAssignments = useCallback(
    async (items: AssignmentInsert[]) => {
      if (items.length === 0) return { added: 0, duplicates: 0 };

      // Signed out: keep it in the browser so the calendar is still usable.
      if (!user) {
        let added = 0;
        let duplicates = 0;

        setAssignments((prev) => {
          const next = [...prev];
          for (const item of items) {
            if (next.some((a) => sameAssignment(item, a))) {
              duplicates++;
              continue;
            }
            next.push({ ...item, id: crypto.randomUUID() } as Assignment);
            added++;
          }
          const sorted = next.sort(sortByDue);
          writePreview(sorted);
          return sorted;
        });

        setPreview(true);
        return { added, duplicates };
      }

      // One round trip; the server enforces the no-duplicates rule via a
      // unique index, so it stays correct even across concurrent imports.
      const result = await api.addAssignments(items);
      if (result.items.length) {
        setAssignments((prev) => [...prev, ...result.items].sort(sortByDue));
      }
      return { added: result.added, duplicates: result.duplicates };
    },
    [user?.id]
  );

  const addAssignment = useCallback(
    async (a: AssignmentInsert) => {
      const { added, duplicates } = await addAssignments([a]);
      if (added > 0) return { success: true };
      return { success: false, duplicate: duplicates > 0 };
    },
    [addAssignments]
  );

  const removeAssignment = useCallback(
    async (id: string) => {
      setAssignments((prev) => {
        const next = prev.filter((a) => a.id !== id);
        if (!user) writePreview(next);
        return next;
      });
      if (!user) return;
      try {
        await api.deleteAssignment(id);
      } catch {
        await refresh();
      }
    },
    [user?.id, refresh]
  );

  const removeAssignments = useCallback(
    async (ids: string[]) => {
      if (!ids.length) return;
      setAssignments((prev) => {
        const next = prev.filter((a) => !ids.includes(a.id));
        if (!user) writePreview(next);
        return next;
      });
      if (!user) return;
      try {
        await api.deleteAssignments(ids);
      } catch {
        await refresh();
      }
    },
    [user?.id, refresh]
  );

  const updateAssignment = useCallback(
    async (a: Assignment) => {
      setAssignments((prev) => {
        const next = prev.map((item) => (item.id === a.id ? a : item)).sort(sortByDue);
        if (!user) writePreview(next);
        return next;
      });
      if (!user) return;
      try {
        await api.updateAssignment(a.id, {
          course: a.course,
          name: a.name,
          dueDate: a.dueDate,
          dueTime: a.dueTime,
          link: a.link,
          color: a.color,
        });
      } catch {
        await refresh();
      }
    },
    [user?.id, refresh]
  );

  return (
    <AssignmentContext.Provider
      value={{
        assignments,
        loading,
        preview,
        addAssignment,
        addAssignments,
        removeAssignment,
        removeAssignments,
        updateAssignment,
        isDuplicate,
        refresh,
      }}
    >
      {children}
    </AssignmentContext.Provider>
  );
}

export function useAssignments() {
  const context = useContext(AssignmentContext);
  if (context === undefined) {
    throw new Error("useAssignments must be used within an AssignmentProvider");
  }
  return context;
}
