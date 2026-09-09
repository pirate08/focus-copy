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
  };
}
