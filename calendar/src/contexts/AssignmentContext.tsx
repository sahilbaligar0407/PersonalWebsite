import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Assignment, AssignmentInsert } from "@/types/assignment";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

type AssignmentState = {
  assignments: Assignment[];
  loading: boolean;
};

type AssignmentAction =
  | { type: "SET"; payload: Assignment[] }
  | { type: "ADD"; payload: Assignment }
  | { type: "ADD_MANY"; payload: Assignment[] }
  | { type: "REMOVE"; payload: string }
  | { type: "REMOVE_MANY"; payload: string[] }
  | { type: "UPDATE"; payload: Assignment }
  | { type: "SET_LOADING"; payload: boolean };

function assignmentReducer(state: AssignmentState, action: AssignmentAction): AssignmentState {
  switch (action.type) {
    case "SET":
      return { ...state, assignments: action.payload };
    case "ADD":
      return { ...state, assignments: [...state.assignments, action.payload] };
    case "ADD_MANY":
      return { ...state, assignments: [...state.assignments, ...action.payload] };
    case "REMOVE":
      return { ...state, assignments: state.assignments.filter((a) => a.id !== action.payload) };
    case "REMOVE_MANY":
      return {
        ...state,
        assignments: state.assignments.filter((a) => !action.payload.includes(a.id)),
      };
    case "UPDATE":
      return {
        ...state,
        assignments: state.assignments.map((a) =>
          a.id === action.payload.id ? action.payload : a
        ),
      };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

function isDuplicate(existing: Assignment, candidate: { course: string; name: string; dueDate: string }): boolean {
  return (
    existing.course === candidate.course &&
    existing.name === candidate.name &&
    existing.dueDate === candidate.dueDate
  );
}

type AssignmentContextType = {
  assignments: Assignment[];
  loading: boolean;
  addAssignment: (a: AssignmentInsert) => Promise<{ success: boolean; duplicate?: boolean }>;
  addAssignments: (items: AssignmentInsert[]) => Promise<{ added: number; duplicates: number }>;
  removeAssignment: (id: string) => Promise<void>;
  removeAssignments: (ids: string[]) => Promise<void>;
  updateAssignment: (a: Assignment) => Promise<void>;
  isDuplicate: (course: string, name: string, dueDate: string) => boolean;
  calendarId: string | null;
};

const AssignmentContext = createContext<AssignmentContextType | undefined>(undefined);

export function AssignmentProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(assignmentReducer, {
    assignments: [],
    loading: true,
  });

  const [calendarId, setCalendarId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      // Signed-out: keep an in-memory calendar so the UI is usable, but nothing persists.
      dispatch({ type: "SET", payload: [] });
      setCalendarId(null);
      dispatch({ type: "SET_LOADING", payload: false });
      return;
    }

    let cancelled = false;
    async function load() {
      dispatch({ type: "SET_LOADING", payload: true });
      try {
        const data = await api.get("/assignments");
        if (cancelled) return;
        setCalendarId(data.calendarId ?? null);
        dispatch({ type: "SET", payload: (data.assignments ?? []) as Assignment[] });
      } catch {
        if (!cancelled) dispatch({ type: "SET", payload: [] });
      } finally {
        if (!cancelled) dispatch({ type: "SET_LOADING", payload: false });
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const isDuplicateCheck = (course: string, name: string, dueDate: string) => {
    return state.assignments.some((a) => isDuplicate(a, { course, name, dueDate }));
  };

  const addAssignment = async (a: AssignmentInsert) => {
    if (isDuplicateCheck(a.course, a.name, a.dueDate)) {
      return { success: false, duplicate: true };
    }

    // Signed-in: persist through the API.
    if (user) {
      try {
        const res = await api.post("/assignments", a);
        if (res?.duplicate) return { success: false, duplicate: true };
        if (res?.assignment) {
          dispatch({ type: "ADD", payload: res.assignment as Assignment });
          return { success: true };
        }
      } catch {
        return { success: false };
      }
      return { success: false };
    }

    // Signed-out: in-memory only.
    dispatch({
      type: "ADD",
      payload: {
        ...a,
        id: crypto.randomUUID(),
        color: a.color ?? "blue",
        source: a.source ?? "manual",
      } as Assignment,
    });
    return { success: true };
  };

  const addAssignments = async (items: AssignmentInsert[]) => {
    // Signed-in: one bulk round-trip. Filter client-side dupes first.
    if (user) {
      const fresh = items.filter((a) => !isDuplicateCheck(a.course, a.name, a.dueDate));
      const duplicatesLocal = items.length - fresh.length;
      if (fresh.length === 0) return { added: 0, duplicates: duplicatesLocal };
      try {
        const res = await api.post("/assignments/bulk", { items: fresh });
        const created = (res?.assignments ?? []) as Assignment[];
        if (created.length) dispatch({ type: "ADD_MANY", payload: created });
        return {
          added: res?.added ?? created.length,
          duplicates: duplicatesLocal + (res?.duplicates ?? 0),
        };
      } catch {
        return { added: 0, duplicates: duplicatesLocal };
      }
    }

    // Signed-out: in-memory only.
    let added = 0;
    let duplicates = 0;
    for (const item of items) {
      const result = await addAssignment(item);
      if (result.success) added++;
      else if (result.duplicate) duplicates++;
    }
    return { added, duplicates };
  };

  const removeAssignment = async (id: string) => {
    if (user) {
      try {
        await api.del(`/assignments/${id}`);
      } catch {
        /* keep optimistic removal */
      }
    }
    dispatch({ type: "REMOVE", payload: id });
  };

  const removeAssignments = async (ids: string[]) => {
    if (user && ids.length) {
      try {
        await api.post("/assignments/delete-bulk", { ids });
      } catch {
        /* keep optimistic removal */
      }
    }
    dispatch({ type: "REMOVE_MANY", payload: ids });
  };

  const updateAssignment = async (a: Assignment) => {
    if (user) {
      try {
        await api.patch(`/assignments/${a.id}`, {
          course: a.course,
          name: a.name,
          dueDate: a.dueDate,
          dueTime: a.dueTime,
          link: a.link,
          color: a.color,
        });
      } catch {
        /* keep optimistic update */
      }
    }
    dispatch({ type: "UPDATE", payload: a });
  };

  const value: AssignmentContextType = {
    assignments: state.assignments,
    loading: state.loading,
    addAssignment,
    addAssignments,
    removeAssignment,
    removeAssignments,
    updateAssignment,
    isDuplicate: isDuplicateCheck,
    calendarId,
  };

  return (
    <AssignmentContext.Provider value={value}>{children}</AssignmentContext.Provider>
  );
}

export function useAssignments() {
  const context = useContext(AssignmentContext);
  if (context === undefined) {
    throw new Error("useAssignments must be used within an AssignmentProvider");
  }
  return context;
}
