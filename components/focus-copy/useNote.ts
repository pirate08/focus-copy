import { useCallback, useState } from "react";

import type { StudyTag } from "@/lib/types";

type EditorLike = {
  commands: {
    setContent: (...args: any[]) => any;
  };
} | null;

export function useNote(editor: EditorLike) {
  const [noteId, setNoteId] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState("Untitled note");
  const [tags, setTags] = useState<StudyTag[]>([]);
  const [paperStyle, setPaperStyle] = useState<"lined" | "grid" | "blank">(
    "lined",
  );
  const [saveStatus, setSaveStatus] = useState("Ready to save");

  const resetNoteState = useCallback(() => {
    setNoteId(null);
    setNoteTitle("Untitled note");
    setTags([]);
    setPaperStyle("lined");
    editor?.commands.setContent({ type: "doc", content: [] });
  }, [editor]);

  const loadNoteForTopic = useCallback(
    async (topicId: string) => {
      try {
        const res = await fetch(
          `/api/notes?topicId=${encodeURIComponent(topicId)}`,
        );

        if (!res.ok) {
          resetNoteState();
          return;
        }

        const data = await res.json();
        const note = Array.isArray(data) && data.length ? data[0] : null;

        if (!note) {
          resetNoteState();
          return;
        }

        setNoteId(note.id ?? note._id ?? null);
        setNoteTitle(note.title ?? "Untitled note");
        setTags(Array.isArray(note.tags) ? (note.tags as StudyTag[]) : []);
        setPaperStyle(
          (note.paperStyle ?? note.paper_style ?? "lined") as
            | "lined"
            | "grid"
            | "blank",
        );
        editor?.commands.setContent(
          note.content ?? { type: "doc", content: [] },
        );
      } catch (err) {
        console.error(err);
      }
    },
    [editor, resetNoteState],
  );

  return {
    noteId,
    setNoteId,
    noteTitle,
    setNoteTitle,
    tags,
    setTags,
    paperStyle,
    setPaperStyle,
    saveStatus,
    setSaveStatus,
    loadNoteForTopic,
    resetNoteState,
  };
}
