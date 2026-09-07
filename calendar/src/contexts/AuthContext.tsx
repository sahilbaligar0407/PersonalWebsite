import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, ApiError } from "@/lib/api";

export type AuthUser = { id: string; email: string };

type AuthContextType = {
  user: AuthUser | null;
  session: { user: AuthUser } | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session from the httpOnly cookie via /api/auth/me.
    api
      .get("/auth/me")
      .then((data) => setUser(data?.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const data = await api.post("/auth/signin", { email, password });
      setUser(data.user);
      return { error: null };
    } catch (err) {
      return { error: err instanceof ApiError ? err : new Error("Sign in failed") };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const data = await api.post("/auth/signup", { email, password });
      setUser(data.user);
      return { error: null };
    } catch (err) {
      return { error: err instanceof ApiError ? err : new Error("Sign up failed") };
    }
  };

  const signOut = async () => {
    try {
      await api.post("/auth/signout");
    } finally {
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    session: user ? { user } : null,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
