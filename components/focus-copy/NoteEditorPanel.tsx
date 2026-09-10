import { EditorContent } from "@tiptap/react";
import { useCallback, useEffect, useRef, useState } from "react";
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
  Undo2,
  X,
} from "lucide-react";

import type { StudyTag } from "@/lib/types";
import { studyTags } from "@/lib/types";
import "./note-editor.css";

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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const proseRef = useRef<HTMLDivElement | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  // Page height only — width is fluid and fills the editor column.
  const PAGE_HEIGHT = 920;
  const PAGE_PADDING_Y = 48; // top/bottom padding inside page
  const PAGE_PADDING_X = 28;// left/right padding inside page

  const ensureProseRef = useCallback(() => {
    if (!containerRef.current) return null;
    const node = containerRef.current.querySelector(
      ".ProseMirror",
    ) as HTMLDivElement | null;
    if (node) proseRef.current = node;
    return node;
  }, []);

  const recalcPages = useCallback(() => {
    const node = ensureProseRef();
    if (!node) return;
    // content height
    const contentHeight = node.scrollHeight;
    const innerHeight = PAGE_HEIGHT - PAGE_PADDING_Y * 2;
    const pages = Math.max(1, Math.ceil(contentHeight / innerHeight));
    setTotalPages(pages);
    if (pageIndex >= pages) setPageIndex(pages - 1);
  }, [ensureProseRef, pageIndex]);

  useEffect(() => {
    const observer = new ResizeObserver(() => recalcPages());
    const node = ensureProseRef();
    if (node) observer.observe(node);
    // also observe container for responsive resizes
    if (containerRef.current) observer.observe(containerRef.current);
    const id = setInterval(recalcPages, 750);
    return () => {
      observer.disconnect();
      clearInterval(id);
    };
  }, [ensureProseRef, recalcPages]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && e.key === "ArrowRight") {
        e.preventDefault();
        setPageIndex((p) => Math.min(totalPages - 1, p + 1));
      }
      if (e.altKey && e.key === "ArrowLeft") {
        e.preventDefault();
        setPageIndex((p) => Math.max(0, p - 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [totalPages]);

  const goNext = () => setPageIndex((p) => Math.min(totalPages - 1, p + 1));
  const goPrev = () => setPageIndex((p) => Math.max(0, p - 1));

  const addPage = () => {
    // Ensure editor content area is at least one more page tall by inserting a placeholder hard break
    const node = ensureProseRef();
    if (!editor || !node) return;
    // Insert a paragraph to create more space
    editor.chain().focus().insertContent("<p><br></p>").run();
    // recalc after small delay
    setTimeout(recalcPages, 200);
  };

  return (
    <div
      className="editor-panel"
      style={{ flex: 1, minWidth: 0, width: "100%" }}
    >
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
            <span className="toolbar-separator" />
            <button
              className="undo-button"
              onClick={() => editor?.chain().focus().undo().run()}
              disabled={!editor?.can().undo()}
              title="Undo (Ctrl+Z)"
              aria-label="Undo"
            >
              <Undo2 size={14} />
            </button>
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
        <div className="notebook-wrapper">
          <div className="notebook-viewport">
            <div
              className="notebook-pages"
              ref={containerRef}
              style={{
                height: PAGE_HEIGHT,
                transform: `translateY(-${pageIndex * PAGE_HEIGHT}px)`,
                transition: "transform 360ms cubic-bezier(.2,.9,.3,1)",
              }}
            >
              {/* Render a tall editor content that will be masked into pages */}
              <div
                className={`notebook-content paper-${paperStyle}`}
                style={{
                  minHeight: PAGE_HEIGHT * totalPages,
                  padding: `${PAGE_PADDING_Y}px ${PAGE_PADDING_X}px`,
                }}
              >
                <EditorContent editor={editor} />
              </div>
            </div>
          </div>
          <div className="notebook-controls">
            <button className="btn" onClick={goPrev} disabled={pageIndex === 0}>
              ◀ Prev
            </button>
            <div className="page-indicator">
              Page {pageIndex + 1} of {totalPages}
            </div>
            <button
              className="btn"
              onClick={goNext}
              disabled={pageIndex >= totalPages - 1}
            >
              Next ▶
            </button>
            <button className="btn" onClick={addPage}>
              + Add Page
            </button>
          </div>
        </div>
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
