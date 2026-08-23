"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiFetch, getErrorMessage } from "@/lib/api";
import type { Topic } from "@/lib/types";
import { useToast } from "./ui/Toast";

interface TopicsApi {
  topics: Topic[];
  loading: boolean;
  refresh: () => Promise<void>;
  create: (name: string) => Promise<Topic | null>;
  rename: (id: string, name: string) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  /** Local-only count nudge so cards stay right without a refetch. */
  adjustCount: (topicId: string, delta: number) => void;
}

const TopicsContext = createContext<TopicsApi | null>(null);

export function TopicsProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const result = await apiFetch<Topic[]>("/api/topics");
      setTopics(Array.isArray(result) ? result : []);
    } catch (err) {
      toast.error("Couldn't load topics", getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const create = useCallback(
    async (name: string) => {
      try {
        const created = await apiFetch<Topic>("/api/topics", {
          method: "POST",
          body: JSON.stringify({ name }),
        });
        setTopics((prev) => [{ ...created, note_count: 0 }, ...prev]);
        toast.success("Topic created", `“${created.name}” is ready for notes.`);
        return created;
      } catch (err) {
        toast.error("Couldn't create topic", getErrorMessage(err));
        return null;
      }
    },
    [toast]
  );

  const rename = useCallback(
    async (id: string, name: string) => {
      const snapshot = topics;
      setTopics((prev) => prev.map((t) => (t.id === id ? { ...t, name } : t)));
      try {
        await apiFetch(`/api/topics/${id}`, {
          method: "PUT",
          body: JSON.stringify({ name }),
        });
        toast.success("Topic renamed");
        return true;
      } catch (err) {
        setTopics(snapshot);
        toast.error("Couldn't rename topic", getErrorMessage(err));
        return false;
      }
    },
    [topics, toast]
  );

  const remove = useCallback(
    async (id: string) => {
      const snapshot = topics;
      const name = topics.find((t) => t.id === id)?.name;
      setTopics((prev) => prev.filter((t) => t.id !== id));
      try {
        await apiFetch(`/api/topics/${id}`, { method: "DELETE" });
        toast.success("Topic deleted", name ? `“${name}” is gone.` : undefined);
        return true;
      } catch (err) {
        setTopics(snapshot);
        toast.error("Couldn't delete topic", getErrorMessage(err));
        return false;
      }
    },
    [topics, toast]
  );

  const adjustCount = useCallback((topicId: string, delta: number) => {
    setTopics((prev) =>
      prev.map((t) =>
        t.id === topicId && typeof t.note_count === "number"
          ? { ...t, note_count: Math.max(0, t.note_count + delta) }
          : t
      )
    );
  }, []);

  const value = useMemo<TopicsApi>(
    () => ({ topics, loading, refresh, create, rename, remove, adjustCount }),
    [topics, loading, refresh, create, rename, remove, adjustCount]
  );

  return (
    <TopicsContext.Provider value={value}>{children}</TopicsContext.Provider>
  );
}

export function useTopics(): TopicsApi {
  const ctx = useContext(TopicsContext);
  if (!ctx) throw new Error("useTopics must be used inside <TopicsProvider>");
  return ctx;
}
