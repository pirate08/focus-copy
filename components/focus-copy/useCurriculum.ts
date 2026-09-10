import { useCallback, useEffect, useMemo, useState } from "react";

import type { Subject, Topic } from "@/lib/types";

export function useCurriculum() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const selectedTopic = useMemo(
    () => topics.find((topic) => topic.id === selectedTopicId) ?? topics[0],
    [selectedTopicId, topics],
  );

  const loadData = useCallback(async () => {
    try {
      const [subjectsRes, topicsRes] = await Promise.all([
        fetch("/api/subjects"),
        fetch("/api/topics"),
      ]);

      if (!subjectsRes.ok || !topicsRes.ok) return;

      const subjectData = await subjectsRes.json();
      const topicData = await topicsRes.json();

      if (Array.isArray(subjectData) && subjectData.length) {
        setSubjects(subjectData as Subject[]);
      }

      if (Array.isArray(topicData) && topicData.length) {
        setTopics(topicData as Topic[]);
        setSelectedTopicId((topicData as Topic[])[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const renameTopic = useCallback(async (id: string, name: string) => {
    if (!id || !name?.trim()) throw new Error("Invalid params");
    try {
      const res = await fetch("/api/topics", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: name.trim() }),
      });
      if (!res.ok) throw new Error("Failed to rename");
      const updated = await res.json();
      setTopics((items) =>
        items.map((t) => (t.id === id ? { ...t, name: updated.name } : t)),
      );
      return updated;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }, []);

  const deleteTopic = useCallback(
    async (id: string) => {
      if (!id) throw new Error("Missing id");
      try {
        const res = await fetch(`/api/topics?id=${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error ?? "Failed to delete");

        // compute descendants to remove from local topics
        const findDescendants = (rootId: string, all: typeof topics) => {
          const ids = new Set<string>();
          const stack = [rootId];
          while (stack.length) {
            const cur = stack.pop() as string;
            ids.add(cur);
            all.forEach((t) => {
              if (t.parent_id === cur) stack.push(t.id);
            });
          }
          return ids;
        };

        setTopics((items) => {
          const ids = findDescendants(id, items);
          return items.filter((t) => !ids.has(t.id));
        });

        return { success: true };
      } catch (err) {
        console.error(err);
        throw err;
      }
    },
    [topics],
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  return {
    subjects,
    setSubjects,
    topics,
    setTopics,
    selectedTopicId,
    setSelectedTopicId,
    expanded,
    setExpanded,
    selectedTopic,
    loadData,
    renameTopic,
    deleteTopic,
  };
}
