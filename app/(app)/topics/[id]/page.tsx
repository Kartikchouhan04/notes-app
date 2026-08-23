"use client";

import { useParams } from "next/navigation";
import { NotesWorkspace } from "@/components/NotesWorkspace";
import { useTopics } from "@/components/TopicsProvider";

export default function TopicPage() {
  const params = useParams();
  const { topics, loading } = useTopics();

  const topicId = typeof params.id === "string" ? params.id : params.id?.[0];
  const topic = topics.find((t) => t.id === topicId);

  if (!topicId) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <p className="text-sm text-muted">Invalid topic.</p>
      </div>
    );
  }

  return (
    <NotesWorkspace
      key={topicId}
      scope={{ kind: "topic", topicId }}
      title={topic?.name ?? (loading ? "Loading…" : "Topic")}
    />
  );
}
