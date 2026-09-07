import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const LIMIT = 20;

// Usage is authoritative on the server (it enforces + increments the quota
// atomically inside /api/ai/parse). Here we just read it and refetch.
export function useAIRateLimit() {
  const { user } = useAuth();
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCount = useCallback(async () => {
    if (!user) {
      setCount(0);
      setLoading(false);
      return;
    }
    try {
      const data = await api.get("/ai/usage");
      setCount(data?.count ?? 0);
    } catch {
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  // The server already incremented during the parse call; just resync.
  const increment = useCallback(async () => {
    await fetchCount();
    return true;
  }, [fetchCount]);

  const canUse = count !== null && count < LIMIT;
  const remaining = count !== null ? Math.max(0, LIMIT - count) : 0;

  return { count: count ?? 0, canUse, remaining, loading, increment };
}
