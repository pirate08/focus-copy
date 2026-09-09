import { EditorContent } from "@tiptap/react";
import {
  AlignCenter,
  AlignLeft,
  Grid3X3,
  Highlighter,
  Keyboard,
  List,
  ListChecks,
  ListTree,
  Square,
  Table2,
  Type,
  X,
} from "lucide-react";

import type { StudyTag } from "@/lib/types";
import { studyTags } from "@/lib/types";

type NoteEditorPanelProps = {
  noteTitle: string;
  tags: StudyTag[];
  paperStyle: "lined" | "grid" | "blank";
  editor: any;
  onChangeTitle: (value: string) => void;
  onToggleTag: (tag: StudyTag) => void;
  onRemoveTag: (tag: StudyTag) => void;
  onSetPaperStyle: (style: "lined" | "grid" | "blank") => void;
};

export function NoteEditorPanel({
  noteTitle,
  tags,
  paperStyle,
  editor,
  onChangeTitle,
  onToggleTag,
  onRemoveTag,
  onSetPaperStyle,
}: NoteEditorPanelProps) {
  return (
    <div className="editor-panel" style={{ flex: 1, minWidth: 0 }}>
      <div className="note-header">
        <div className="note-kicker">
          <span className="status-dot" /> ACTIVE NOTE{" "}
          <span className="note-date">Updated today</span>
        </div>
        <input
          className="note-title"
          value={noteTitle}
          onChange={(event) => onChangeTitle(event.target.value)}
        />
        <div className="note-meta">
          <div className="tag-list">
            {tags.map((tag) => (
              <button
                className="tag-chip"
                key={tag}
                onClick={() => onRemoveTag(tag)}
              >
                {tag} <X size={11} />
              </button>
            ))}
            <select
              className="tag-select"
              value=""
              onChange={(event) => {
                const tag = event.target.value as StudyTag;
                if (tag && !tags.includes(tag)) onToggleTag(tag);
              }}
            >
              <option value="">+ Add tag</option>
              {studyTags
                .filter((tag) => !tags.includes(tag))
                .map((tag) => (
                  <option value={tag} key={tag}>
                    {tag}
                  </option>
                ))}
            </select>
          </div>
          <div className="paper-switcher">
            <span>Paper</span>
            {(["lined", "grid", "blank"] as const).map((style) => (
              <button
                key={style}
                className={paperStyle === style ? "active" : ""}
                onClick={() => onSetPaperStyle(style)}
              >
                {style === "lined" ? (
                  <ListTree size={14} />
                ) : style === "grid" ? (
                  <Grid3X3 size={14} />
                ) : (
                  <Square size={13} />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className={`editor-canvas paper-${paperStyle}`}>
        <div className="floating-toolbar">
          <button
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={editor?.isActive("bold") ? "active" : ""}
          >
            <strong>B</strong>
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={editor?.isActive("italic") ? "active" : ""}
          >
            <em>I</em>
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            className={editor?.isActive("underline") ? "active" : ""}
          >
            <u>U</u>
          </button>
          <span className="toolbar-separator" />
          <button
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <Type size={15} />
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            <List size={16} />
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleTaskList().run()}
          >
            <ListChecks size={16} />
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleHighlight().run()}
          >
            <Highlighter size={15} />
          </button>
          <button
            onClick={() => editor?.chain().focus().setTextAlign("left").run()}
          >
            <AlignLeft size={15} />
          </button>
          <button
            onClick={() => editor?.chain().focus().setTextAlign("center").run()}
          >
            <AlignCenter size={15} />
          </button>
          <button
            onClick={() =>
              editor
                ?.chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run()
            }
          >
            <Table2 size={15} />
          </button>
        </div>
        <EditorContent editor={editor} />
      </div>
      <div className="editor-footer">
        <span>
          <Keyboard size={14} /> Markdown shortcuts enabled
        </span>
        <span>
          Tip: Use <kbd>Alt + K</kbd> for privacy mode
        </span>
      </div>
    </div>
  );
}
