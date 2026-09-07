"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { supabase } from "@/lib/supabase";
import type { Note, Subject, StudyTag, Topic } from "@/lib/types";
import { studyTags } from "@/lib/types";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  Cloud,
  FileText,
  FolderPlus,
  Globe2,
  Grid3X3,
  Highlighter,
  Keyboard,
  Landmark,
  Leaf,
  List,
  ListChecks,
  ListTree,
  LoaderCircle,
  Map,
  MapPin,
  Menu,
  Moon,
  MoreHorizontal,
  Mountain,
  NotebookPen,
  Pen,
  Plus,
  Save,
  Scale,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Square,
  Sun,
  Table2,
  Tags,
  Type,
  Upload,
  X,
  Zap,
} from "lucide-react";

const iconMap: Record<string, typeof Landmark> = {
  landmark: Landmark,
  mountain: Mountain,
  "scroll-text": FileText,
  "chart-no-axes-combined": ArrowUp,
  leaf: Leaf,
  scale: Scale,
  "globe-2": Globe2,
  "book-open": BookOpen,
};

const mapOptions = [
  { id: "india_political", label: "India Political", tone: "india" },
  { id: "india_physical", label: "India Physical", tone: "terrain" },
  { id: "world", label: "World Map", tone: "world" },
  { id: "india_states", label: "State-wise", tone: "states" },
] as const;

type SplitMode = "none" | "pdf" | "map";
type DrawingTool = "pen" | "highlighter" | "pin" | "circle" | "arrow";

function AppIcon({ name, size = 17 }: { name: string | null; size?: number }) {
  const Icon = iconMap[name ?? "book-open"] ?? BookOpen;
  return <Icon size={size} strokeWidth={1.8} />;
}

export default function Home() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [splitMode, setSplitMode] = useState<SplitMode>("none");
  const [showMapRoom, setShowMapRoom] = useState(false);
  const [showSyllabus, setShowSyllabus] = useState(false);
  const [showStealth, setShowStealth] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [query, setQuery] = useState("");
  const [paperStyle, setPaperStyle] = useState<"lined" | "grid" | "blank">(
    "lined",
  );
  const [tags, setTags] = useState<StudyTag[]>([]);
  const [noteId, setNoteId] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState("Untitled note");
  const [saveStatus, setSaveStatus] = useState("Ready to save");
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [activeMap, setActiveMap] =
    useState<(typeof mapOptions)[number]["id"]>("india_political");
  const [drawingTool, setDrawingTool] = useState<DrawingTool>("pen");
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const selectedTopic =
    topics.find((topic) => topic.id === selectedTopicId) ?? topics[0];
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Highlight,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder: "Start writing your revision notes…",
      }),
    ],
    content: "",
    immediatelyRender: false,
    onUpdate: () => setSaveStatus("Unsaved changes"),
  });

  const loadData = useCallback(async () => {
    const [{ data: subjectData }, { data: topicData }] = await Promise.all([
      supabase.from("subjects").select("*").order("sort_order"),
      supabase.from("topics").select("*").order("sort_order"),
    ]);
    if (subjectData?.length) setSubjects(subjectData as Subject[]);
    if (topicData?.length) {
      setTopics(topicData as Topic[]);
      setSelectedTopicId((topicData as Topic[])[0].id);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "Escape" ||
        (event.altKey && event.key.toLowerCase() === "k")
      )
        setShowStealth((value) => !value);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    context.scale(ratio, ratio);
    context.fillStyle = "#f7f8f6";
    context.fillRect(0, 0, rect.width, rect.height);
    context.strokeStyle = "#d9e1dc";
    context.lineWidth = 1;
    for (let x = 0; x < rect.width; x += 32) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, rect.height);
      context.stroke();
    }
    for (let y = 0; y < rect.height; y += 32) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(rect.width, y);
      context.stroke();
    }
    context.fillStyle = "#e7efea";
    context.beginPath();
    context.ellipse(
      rect.width * 0.5,
      rect.height * 0.53,
      rect.width * 0.29,
      rect.height * 0.34,
      0,
      0,
      Math.PI * 2,
    );
    context.fill();
    context.strokeStyle = "#9eb4a6";
    context.lineWidth = 2;
    context.stroke();
    context.fillStyle = "#547365";
    context.font = "600 14px Inter, sans-serif";
    context.textAlign = "center";
    context.fillText(
      activeMap === "world"
        ? "WORLD MAP"
        : activeMap === "india_states"
          ? "INDIA · STATE PRACTICE"
          : activeMap === "india_physical"
            ? "INDIA · PHYSICAL FEATURES"
            : "INDIA · POLITICAL PRACTICE",
      rect.width / 2,
      30,
    );
  }, [activeMap, showMapRoom, splitMode]);

  const filteredSubjects = useMemo(
    () =>
      subjects.filter((subject) =>
        subject.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [subjects, query],
  );
  const completedCount = topics.filter(
    (topic) => topic.syllabus_checked,
  ).length;
  const progress = topics.length
    ? Math.round((completedCount / topics.length) * 100)
    : 0;

  const saveNote = async () => {
    if (!selectedTopic || !editor) return;
    setSaveStatus("Saving…");
    const payload = {
      topic_id: selectedTopic.id,
      title: noteTitle,
      content: editor.getJSON(),
      tags,
      paper_style: paperStyle,
      updated_at: new Date().toISOString(),
    };
    const result = noteId
      ? await supabase
          .from("notes")
          .update(payload)
          .eq("id", noteId)
          .select()
          .maybeSingle()
      : await supabase.from("notes").insert(payload).select().maybeSingle();
    if (result.error) {
      setSaveStatus("Saved in this session");
      return;
    }
    setNoteId((result.data as Note | null)?.id ?? noteId);
    setSaveStatus("Saved just now");
  };

  const toggleSyllabus = async (topic: Topic) => {
    const nextValue = !topic.syllabus_checked;
    setTopics((items) =>
      items.map((item) =>
        item.id === topic.id ? { ...item, syllabus_checked: nextValue } : item,
      ),
    );
    await supabase
      .from("topics")
      .update({ syllabus_checked: nextValue })
      .eq("id", topic.id);
  };

  const addTopic = async (subjectId: string) => {
    const name = window.prompt("Name this new chapter");
    if (!name?.trim()) return;
    const { data } = await supabase
      .from("topics")
      .insert({ subject_id: subjectId, name: name.trim(), sort_order: 99 })
      .select()
      .maybeSingle();
    if (data) setTopics((items) => [...items, data as Topic]);
  };

  const beginDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (drawingTool === "pin") {
      const rect = event.currentTarget.getBoundingClientRect();
      const context = event.currentTarget.getContext("2d");
      if (!context) return;
      context.fillStyle = "#c4573e";
      context.beginPath();
      context.arc(
        event.clientX - rect.left,
        event.clientY - rect.top,
        6,
        0,
        Math.PI * 2,
      );
      context.fill();
      return;
    }
    setIsDrawing(true);
    const context = event.currentTarget.getContext("2d");
    if (!context) return;
    const rect = event.currentTarget.getBoundingClientRect();
    context.beginPath();
    context.moveTo(event.clientX - rect.left, event.clientY - rect.top);
    context.strokeStyle =
      drawingTool === "highlighter" ? "rgba(213, 174, 55, .45)" : "#38604d";
    context.lineWidth = drawingTool === "highlighter" ? 14 : 2.5;
    context.lineCap = "round";
  };
  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const context = event.currentTarget.getContext("2d");
    if (!context) return;
    const rect = event.currentTarget.getBoundingClientRect();
    context.lineTo(event.clientX - rect.left, event.clientY - rect.top);
    context.stroke();
  };

  if (showStealth)
    return <StealthDashboard onExit={() => setShowStealth(false)} />;

  return (
    <div className="study-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <NotebookPen size={18} />
          </div>
          <div>
            <strong>FOCUS / COPY</strong>
            <span>UPSC STUDY DESK</span>
          </div>
        </div>
        <div className="topbar-center">
          <div className="breadcrumbs">
            <span>Workspace</span>
            <ChevronRight size={13} />
            <span>{selectedTopic?.name ?? "Notes"}</span>
          </div>
          <div className="save-indicator">
            <Cloud size={14} /> {saveStatus}
          </div>
        </div>
        <div className="top-actions">
          <button
            className="icon-button mobile-menu"
            onClick={() => setShowMobileSidebar(true)}
            aria-label="Open subjects"
          >
            <Menu size={18} />
          </button>
          <button
            className="icon-button"
            onClick={() => setDarkMode((value) => !value)}
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            className="office-button"
            onClick={() => setShowStealth(true)}
          >
            <ShieldCheck size={15} /> Quick Switch <kbd>Esc</kbd>
          </button>
          <div className="avatar">AS</div>
        </div>
      </header>
      <div className="workspace">
        <aside className={`sidebar ${showMobileSidebar ? "sidebar-open" : ""}`}>
          <div className="sidebar-heading">
            <div>
              <span className="eyebrow">YOUR CURRICULUM</span>
              <h2>Subject tree</h2>
            </div>
            <button
              className="icon-button small"
              onClick={() =>
                window.alert("Create a new subject from the subject tree.")
              }
            >
              <FolderPlus size={16} />
            </button>
          </div>
          <div className="search-box">
            <Search size={15} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search subjects…"
            />
          </div>
          <div className="tree-list">
            {filteredSubjects.map((subject) => {
              const subjectTopics = topics.filter(
                (topic) => topic.subject_id === subject.id && !topic.parent_id,
              );
              const isOpen =
                expanded[subject.id] ?? subject.name === "Geography";
              return (
                <div className="tree-group" key={subject.id}>
                  <div
                    className="tree-row subject-row"
                    onClick={() =>
                      setExpanded((items) => ({
                        ...items,
                        [subject.id]: !isOpen,
                      }))
                    }
                  >
                    <span className="chevron">
                      {isOpen ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronRight size={14} />
                      )}
                    </span>
                    <span className="subject-icon">
                      <AppIcon name={subject.icon} />
                    </span>
                    <span className="tree-label">{subject.name}</span>
                    <span className="tree-count">{subjectTopics.length}</span>
                    <button
                      className="tree-add"
                      onClick={(event) => {
                        event.stopPropagation();
                        void addTopic(subject.id);
                      }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  {isOpen && (
                    <div className="nested-list">
                      {subjectTopics.map((topic) => (
                        <div key={topic.id}>
                          <div
                            className={`tree-row topic-row ${selectedTopicId === topic.id ? "selected" : ""}`}
                            onClick={() => {
                              setSelectedTopicId(topic.id);
                              setShowMobileSidebar(false);
                            }}
                          >
                            <span className="topic-dot" />
                            <span className="tree-label">{topic.name}</span>
                            {topic.syllabus_checked && (
                              <Check size={13} className="done-check" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <button
            className="new-subject"
            onClick={() =>
              window.alert("Create a new subject from the subject tree.")
            }
          >
            <Plus size={15} /> New subject
          </button>
          <div className="sidebar-footer">
            <div className="progress-mini">
              <div className="progress-mini-head">
                <span>Syllabus progress</span>
                <strong>{progress}%</strong>
              </div>
              <div className="progress-track">
                <span style={{ width: `${progress}%` }} />
              </div>
              <small>
                {completedCount} of {topics.length} topics complete
              </small>
            </div>
            <button className="settings-link">
              <Settings2 size={15} /> Workspace settings
            </button>
          </div>
        </aside>
        <main className="main-area">
          <div className="page-toolbar">
            <div className="page-context">
              <span className="subject-pill">
                <AppIcon
                  name={
                    subjects.find(
                      (subject) => subject.id === selectedTopic?.subject_id,
                    )?.icon ?? "book-open"
                  }
                  size={14}
                />{" "}
                {subjects.find(
                  (subject) => subject.id === selectedTopic?.subject_id,
                )?.name ?? "Study notes"}
              </span>
              <span className="slash">/</span>
              <span>{selectedTopic?.name ?? "Notebook"}</span>
            </div>
            <div className="toolbar-actions">
              <button
                className="tool-button"
                onClick={() => setShowSyllabus(true)}
              >
                <ListChecks size={15} /> Syllabus
              </button>
              <button
                className={`tool-button ${splitMode === "pdf" ? "active" : ""}`}
                onClick={() =>
                  setSplitMode(splitMode === "pdf" ? "none" : "pdf")
                }
              >
                <FileText size={15} /> Reference PDF
              </button>
              <button
                className={`tool-button ${splitMode === "map" ? "active" : ""}`}
                onClick={() =>
                  setSplitMode(splitMode === "map" ? "none" : "map")
                }
              >
                <Map size={15} /> Map practice
              </button>
              <button
                className="primary-button"
                onClick={() => void saveNote()}
              >
                <Save size={15} /> Save note
              </button>
            </div>
          </div>
          <section
            className={`editor-layout ${splitMode !== "none" ? "split-active" : ""}`}
          >
            <div className="editor-panel">
              <div className="note-header">
                <div className="note-kicker">
                  <span className="status-dot" /> ACTIVE NOTE{" "}
                  <span className="note-date">Updated today</span>
                </div>
                <input
                  className="note-title"
                  value={noteTitle}
                  onChange={(event) => {
                    setNoteTitle(event.target.value);
                    setSaveStatus("Unsaved changes");
                  }}
                />
                <div className="note-meta">
                  <div className="tag-list">
                    {tags.map((tag) => (
                      <button
                        className="tag-chip"
                        key={tag}
                        onClick={() =>
                          setTags((items) =>
                            items.filter((item) => item !== tag),
                          )
                        }
                      >
                        {tag} <X size={11} />
                      </button>
                    ))}
                    <select
                      className="tag-select"
                      value=""
                      onChange={(event) => {
                        const tag = event.target.value as StudyTag;
                        if (tag && !tags.includes(tag))
                          setTags((items) => [...items, tag]);
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
                        onClick={() => setPaperStyle(style)}
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
                    onClick={() =>
                      editor?.chain().focus().toggleUnderline().run()
                    }
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
                    onClick={() =>
                      editor?.chain().focus().toggleBulletList().run()
                    }
                  >
                    <List size={16} />
                  </button>
                  <button
                    onClick={() =>
                      editor?.chain().focus().toggleTaskList().run()
                    }
                  >
                    <ListChecks size={16} />
                  </button>
                  <button
                    onClick={() =>
                      editor?.chain().focus().toggleHighlight().run()
                    }
                  >
                    <Highlighter size={15} />
                  </button>
                  <button
                    onClick={() =>
                      editor?.chain().focus().setTextAlign("left").run()
                    }
                  >
                    <AlignLeft size={15} />
                  </button>
                  <button
                    onClick={() =>
                      editor?.chain().focus().setTextAlign("center").run()
                    }
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
            {splitMode !== "none" && (
              <aside className="reference-panel">
                {splitMode === "pdf" ? (
                  <>
                    <div className="reference-head">
                      <div>
                        <span className="eyebrow">REFERENCE MATERIAL</span>
                        <h3>PDF reader</h3>
                      </div>
                      <button
                        className="icon-button small"
                        onClick={() => setSplitMode("none")}
                      >
                        <X size={15} />
                      </button>
                    </div>
                    <label className="upload-card">
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(event) =>
                          setPdfName(event.target.files?.[0]?.name ?? null)
                        }
                      />
                      <Upload size={24} />
                      <strong>{pdfName ?? "Drop a syllabus PDF here"}</strong>
                      <span>
                        {pdfName
                          ? "Ready to reference alongside your notes"
                          : "PDF files up to 20 MB"}
                      </span>
                    </label>
                    <div className="pdf-placeholder">
                      <FileText size={30} />
                      <strong>{pdfName ?? "No reference loaded"}</strong>
                      <span>
                        Upload a PDF to keep your reading and revision in one
                        calm workspace.
                      </span>
                    </div>
                  </>
                ) : (
                  <MapRoom
                    compact
                    activeMap={activeMap}
                    setActiveMap={setActiveMap}
                    drawingTool={drawingTool}
                    setDrawingTool={setDrawingTool}
                    canvasRef={canvasRef}
                    beginDrawing={beginDrawing}
                    draw={draw}
                    setIsDrawing={setIsDrawing}
                    onClose={() => setSplitMode("none")}
                    onSave={() => setSaveStatus("Map snapshot ready")}
                  />
                )}
              </aside>
            )}
          </section>
          <div className="bottom-insights">
            <div className="insight-card">
              <div className="insight-icon green">
                <Sparkles size={17} />
              </div>
              <div>
                <strong>Revision rhythm</strong>
                <span>
                  3 focused sessions this week · keep the streak going
                </span>
              </div>
              <ArrowUp size={15} className="trend-up" />
            </div>
            <div className="insight-card">
              <div className="insight-icon amber">
                <Zap size={17} />
              </div>
              <div>
                <strong>Next best action</strong>
                <span>
                  Complete 2 more Geography topics to unlock a review set
                </span>
              </div>
              <ChevronRight size={16} />
            </div>
          </div>
        </main>
      </div>
      {showMapRoom && (
        <div className="modal-backdrop">
          <div className="map-modal">
            <MapRoom
              activeMap={activeMap}
              setActiveMap={setActiveMap}
              drawingTool={drawingTool}
              setDrawingTool={setDrawingTool}
              canvasRef={canvasRef}
              beginDrawing={beginDrawing}
              draw={draw}
              setIsDrawing={setIsDrawing}
              onClose={() => setShowMapRoom(false)}
              onSave={() => {
                setShowMapRoom(false);
                setSaveStatus("Map snapshot ready");
              }}
            />
          </div>
        </div>
      )}
      {showSyllabus && (
        <div className="modal-backdrop" onClick={() => setShowSyllabus(false)}>
          <div
            className="syllabus-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <span className="eyebrow">UPSC TRACKER</span>
                <h2>Syllabus progress</h2>
              </div>
              <button
                className="icon-button"
                onClick={() => setShowSyllabus(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="large-progress">
              <div>
                <strong>{progress}%</strong>
                <span>overall completion</span>
              </div>
              <div className="progress-track">
                <span style={{ width: `${progress}%` }} />
              </div>
            </div>
            <div className="syllabus-list">
              {topics.map((topic) => (
                <label key={topic.id} className="syllabus-item">
                  <input
                    type="checkbox"
                    checked={topic.syllabus_checked}
                    onChange={() => void toggleSyllabus(topic)}
                  />
                  <span className="custom-check">
                    {topic.syllabus_checked && <Check size={13} />}
                  </span>
                  <span>{topic.name}</span>
                  <small>
                    {
                      subjects.find(
                        (subject) => subject.id === topic.subject_id,
                      )?.name
                    }
                  </small>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MapRoom({
  compact = false,
  activeMap,
  setActiveMap,
  drawingTool,
  setDrawingTool,
  canvasRef,
  beginDrawing,
  draw,
  setIsDrawing,
  onClose,
  onSave,
}: {
  compact?: boolean;
  activeMap: (typeof mapOptions)[number]["id"];
  setActiveMap: (value: (typeof mapOptions)[number]["id"]) => void;
  drawingTool: DrawingTool;
  setDrawingTool: (value: DrawingTool) => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  beginDrawing: (event: React.PointerEvent<HTMLCanvasElement>) => void;
  draw: (event: React.PointerEvent<HTMLCanvasElement>) => void;
  setIsDrawing: (value: boolean) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className={`map-room ${compact ? "compact" : ""}`}>
      <div className="map-head">
        <div>
          <span className="eyebrow">PRACTICE ROOM</span>
          <h2>Blank maps</h2>
        </div>
        <div className="map-head-actions">
          <button className="secondary-button" onClick={onSave}>
            <Save size={15} /> Save to note
          </button>
          <button className="icon-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
      </div>
      <div className="map-tabs">
        {mapOptions.map((map) => (
          <button
            className={activeMap === map.id ? "active" : ""}
            onClick={() => setActiveMap(map.id)}
            key={map.id}
          >
            <Map size={14} />
            {map.label}
          </button>
        ))}
      </div>
      <div className="map-body">
        <div className="map-toolbar">
          <span className="eyebrow">ANNOTATE</span>
          {(
            [
              ["pen", Pen],
              ["highlighter", Highlighter],
              ["pin", MapPin],
              ["circle", Circle],
              ["arrow", ArrowUp],
            ] as const
          ).map(([tool, Icon]) => (
            <button
              className={drawingTool === tool ? "active" : ""}
              onClick={() => setDrawingTool(tool)}
              key={tool}
              title={tool}
            >
              <Icon size={17} />
            </button>
          ))}
          <span className="toolbar-separator" />
          <button title="Clear">
            <MoreHorizontal size={17} />
          </button>
        </div>
        <canvas
          ref={canvasRef}
          className="map-canvas"
          onPointerDown={beginDrawing}
          onPointerMove={draw}
          onPointerUp={() => setIsDrawing(false)}
          onPointerLeave={() => setIsDrawing(false)}
        />
      </div>
      <div className="map-footer">
        <span>
          <MapPin size={14} /> Mark rivers, passes, ports, and sites
        </span>
        <span>Canvas autosaves locally</span>
      </div>
    </div>
  );
}

function StealthDashboard({ onExit }: { onExit: () => void }) {
  return (
    <div className="stealth-shell">
      <header className="stealth-top">
        <div className="stealth-brand">
          <div className="stealth-logo">
            <BarChartIcon />
          </div>
          <div>
            <strong>ARC / OPERATIONS</strong>
            <span>INTERNAL WORKSPACE</span>
          </div>
        </div>
        <div className="stealth-nav">
          <span>Overview</span>
          <span>Projects</span>
          <span>Reports</span>
          <span>Team</span>
        </div>
        <div className="stealth-profile">
          <span>Alex Sharma</span>
          <div className="avatar">AS</div>
        </div>
      </header>
      <div className="stealth-content">
        <div className="stealth-title">
          <div>
            <span className="eyebrow">MONDAY · SEPTEMBER 07, 2026</span>
            <h1>Good morning, Alex</h1>
            <p>Here is the latest operational snapshot for your workspace.</p>
          </div>
          <button className="exit-stealth" onClick={onExit}>
            <ShieldCheck size={15} /> Return to focus desk <kbd>Esc</kbd>
          </button>
        </div>
        <div className="metrics">
          <div>
            <span>ACTIVE PROJECTS</span>
            <strong>08</strong>
            <small className="positive">
              +12.5% <ArrowUp size={12} />
            </small>
          </div>
          <div>
            <span>OPEN ACTIONS</span>
            <strong>24</strong>
            <small className="neutral">Across 6 teams</small>
          </div>
          <div>
            <span>Q3 DELIVERY</span>
            <strong>87.4%</strong>
            <small className="positive">On track</small>
          </div>
          <div>
            <span>TEAM UTILIZATION</span>
            <strong>76%</strong>
            <small className="positive">+4.8%</small>
          </div>
        </div>
        <div className="dashboard-grid">
          <div className="dash-card wide">
            <div className="dash-card-head">
              <div>
                <span className="eyebrow">DELIVERY VELOCITY</span>
                <h3>Project throughput</h3>
              </div>
              <button className="icon-button small">
                <MoreHorizontal size={17} />
              </button>
            </div>
            <div className="fake-chart">
              <div className="chart-y">
                <span>100</span>
                <span>75</span>
                <span>50</span>
                <span>25</span>
                <span>0</span>
              </div>
              <div className="chart-lines">
                <div className="chart-gridline" />
                <div className="chart-gridline" />
                <div className="chart-gridline" />
                <div className="chart-gridline" />
                <div className="bars">
                  {[42, 58, 50, 72, 64, 81, 73, 91, 82, 96, 87, 100].map(
                    (height, index) => (
                      <div
                        className="bar"
                        style={{ height: `${height}%` }}
                        key={index}
                      />
                    ),
                  )}
                </div>
                <div className="chart-x">
                  <span>OCT</span>
                  <span>NOV</span>
                  <span>DEC</span>
                  <span>JAN</span>
                  <span>FEB</span>
                  <span>MAR</span>
                </div>
              </div>
            </div>
          </div>
          <div className="dash-card">
            <div className="dash-card-head">
              <div>
                <span className="eyebrow">TEAM ACTIVITY</span>
                <h3>Latest updates</h3>
              </div>
              <MoreHorizontal size={17} />
            </div>
            <div className="activity-list">
              <div>
                <div className="activity-avatar blue">JR</div>
                <span>
                  <strong>Jamie Reynolds</strong> updated Client Onboarding
                  <small>12 minutes ago</small>
                </span>
              </div>
              <div>
                <div className="activity-avatar tan">MK</div>
                <span>
                  <strong>Maya Kapoor</strong> completed Q3 Review
                  <small>43 minutes ago</small>
                </span>
              </div>
              <div>
                <div className="activity-avatar green">DL</div>
                <span>
                  <strong>Devon Lee</strong> created a new milestone
                  <small>1 hour ago</small>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BarChartIcon() {
  return (
    <div className="bar-chart-icon">
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}
