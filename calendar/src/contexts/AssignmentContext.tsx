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

export function AssignmentProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setAssignments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
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
      assignments.some(
        (a) => a.course === course && a.name === name && a.dueDate === dueDate
      ),
    [assignments]
  );

  const addAssignments = useCallback(
    async (items: AssignmentInsert[]) => {
      if (!user || items.length === 0) return { added: 0, duplicates: 0 };

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

  const removeAssignment = useCallback(async (id: string) => {
    setAssignments((prev) => prev.filter((a) => a.id !== id));
    try {
      await api.deleteAssignment(id);
    } catch {
      await refresh();
    }
  }, [refresh]);

  const removeAssignments = useCallback(
    async (ids: string[]) => {
      if (!ids.length) return;
      setAssignments((prev) => prev.filter((a) => !ids.includes(a.id)));
      try {
        await api.deleteAssignments(ids);
      } catch {
        await refresh();
      }
    },
    [refresh]
  );

  const updateAssignment = useCallback(
    async (a: Assignment) => {
      setAssignments((prev) =>
        prev.map((item) => (item.id === a.id ? a : item)).sort(sortByDue)
      );
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
    [refresh]
  );

  return (
    <AssignmentContext.Provider
      value={{
        assignments,
        loading,
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
