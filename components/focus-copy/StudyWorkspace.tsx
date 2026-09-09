"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { MapRoom } from "./MapRoom";
import { Splitter } from "./Splitter";
import { StealthDashboard } from "./StealthDashboard";
import { useCurriculum } from "./useCurriculum";
import { useMapPanel } from "./useMapPanel";
import { useNote } from "./useNote";
import { usePdfPanel } from "./usePdfPanel";
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
  RotateCcw,
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

type DrawingTool = "pen" | "highlighter" | "pin" | "circle" | "arrow";

function AppIcon({ name, size = 17 }: { name: string | null; size?: number }) {
  const Icon = iconMap[name ?? "book-open"] ?? BookOpen;
  return <Icon size={size} strokeWidth={1.8} />;
}

export default function StudyWorkspace() {
  const {
    subjects,
    setSubjects,
    topics,
    setTopics,
    selectedTopicId,
    setSelectedTopicId,
    expanded,
    setExpanded,
    selectedTopic,
  } = useCurriculum();

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

  const {
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
  } = useNote(editor);

  const [pdfZoom, setPdfZoom] = useState(1);
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfDocumentName, setPdfDocumentName] = useState(
    "UPSC Geography Syllabus",
  );
  const [showSyllabus, setShowSyllabus] = useState(false);
  const [showStealth, setShowStealth] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [query, setQuery] = useState("");
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [pdfDocuments, setPdfDocuments] = useState<
    Array<{ id: string; name: string; uploadedAt?: string | null }>
  >([]);
  const [selectedPdfId, setSelectedPdfId] = useState<string | null>(null);
  const [pdfUploadError, setPdfUploadError] = useState<string | null>(null);
  const [mapUndoCount, setMapUndoCount] = useState(0);
  const editorLayoutRef = useRef<HTMLDivElement | null>(null);
  const mapHistoryRef = useRef<string[]>([]);
  const [activeMap, setActiveMap] =
    useState<(typeof mapOptions)[number]["id"]>("india_political");
  const [drawingTool, setDrawingTool] = useState<DrawingTool>("pen");
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { isMapOpen, setIsMapOpen, mapWidth, isDraggingMap, startMapDrag } =
    useMapPanel(editorLayoutRef, false, 0);

  const {
    isPdfOpen,
    setIsPdfOpen,
    pdfSplitWidth,
    setPdfSplitWidth,
    isDraggingPdf,
    closePdfPane,
    resetPdfSplit,
    startPdfDrag,
    togglePdfPane,
  } = usePdfPanel(editorLayoutRef, isMapOpen, mapWidth);

  const loadPdfDocuments = useCallback(async () => {
    try {
      const res = await fetch("/api/pdfs");
      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data)) return;
      setPdfDocuments(
        data as Array<{ id: string; name: string; uploadedAt?: string | null }>,
      );
      if (data.length && !selectedPdfId) {
        setSelectedPdfId(data[0].id);
        setPdfDocumentName(data[0].name || "Reference PDF");
      }
    } catch (err) {
      console.error(err);
    }
  }, [selectedPdfId]);

  useEffect(() => {
    void loadPdfDocuments();
  }, [loadPdfDocuments]);

  useEffect(() => {
    if (!editor || !selectedTopicId) return;
    void loadNoteForTopic(selectedTopicId);
  }, [editor, loadNoteForTopic, selectedTopicId]);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);
  const undoMapCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || mapHistoryRef.current.length === 0) return;

    const previousSnapshot = mapHistoryRef.current.pop();
    if (!previousSnapshot) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const image = new Image();
    image.onload = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
    };
    image.src = previousSnapshot;
    setMapUndoCount(mapHistoryRef.current.length);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isPdfShortcut =
        (event.altKey && event.key.toLowerCase() === "p") ||
        (event.ctrlKey && (event.key === "\\" || event.key === "|"));

      if (isPdfShortcut) {
        event.preventDefault();
        // PDF panel visibility is controlled solely by isPdfOpen now, so the
        // Map panel is unaffected by this shortcut.
        setIsPdfOpen((value) => !value);
        return;
      }

      const isMapUndoShortcut =
        (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z";
      if (isMapUndoShortcut && isMapOpen) {
        event.preventDefault();
        undoMapCanvas();
        return;
      }

      if (
        event.key === "Escape" ||
        (event.altKey && event.key.toLowerCase() === "k")
      )
        setShowStealth((value) => !value);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isPdfOpen, isMapOpen, undoMapCanvas]);

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
  }, [activeMap, isMapOpen]);

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
      topicId: selectedTopic.id,
      title: noteTitle,
      content: editor.getJSON(),
      tags,
      paperStyle,
    };
    try {
      const res = await fetch("/api/notes", {
        method: noteId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: noteId, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveStatus("Saved in this session");
        return;
      }
      setNoteId((data as any)?.id ?? noteId);
      setSaveStatus("Saved just now");
    } catch (err) {
      console.error(err);
      setSaveStatus("Saved in this session");
    }
  };

  const toggleSyllabus = async (topic: Topic) => {
    const nextValue = !topic.syllabus_checked;
    setTopics((items) =>
      items.map((item) =>
        item.id === topic.id ? { ...item, syllabus_checked: nextValue } : item,
      ),
    );
    try {
      await fetch("/api/topics", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: topic.id, syllabusChecked: nextValue }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const addTopic = async (subjectId: string) => {
    const name = window.prompt("Name this new chapter");
    if (!name?.trim()) return;
    try {
      const res = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId, name: name.trim(), sortOrder: 99 }),
      });
      if (!res.ok) return;
      const newTopic = await res.json();
      setTopics((items) => [...items, newTopic as Topic]);
      setSelectedTopicId((newTopic as Topic).id);
    } catch (err) {
      console.error(err);
    }
  };

  const beginDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget;
    const snapshot = canvas.toDataURL();
    if (mapHistoryRef.current.length >= 15) {
      mapHistoryRef.current.shift();
    }
    mapHistoryRef.current.push(snapshot);
    setMapUndoCount(mapHistoryRef.current.length);

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

  const isPdfSplitOpen = isPdfOpen;

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
        <aside
          className={`sidebar ${showMobileSidebar ? "sidebar-open" : ""} ${isPdfSplitOpen ? "sidebar-hidden" : ""}`}
        >
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
                className={`tool-button ${isPdfOpen ? "active" : ""}`}
                onClick={togglePdfPane}
              >
                <FileText size={15} /> Reference PDF
              </button>
              <button
                className={`tool-button ${isMapOpen ? "active" : ""}`}
                onClick={() => setIsMapOpen((value) => !value)}
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
            ref={editorLayoutRef}
            className={`editor-layout ${isPdfOpen || isMapOpen ? "split-active" : ""}`}
          >
            {isPdfSplitOpen && (
              <>
                <aside
                  className="pdf-panel"
                  style={{
                    width: `${pdfSplitWidth}px`,
                    flexBasis: `${pdfSplitWidth}px`,
                    flexShrink: 0,
                  }}
                >
                  <div className="pdf-header">
                    <div className="pdf-header-left">
                      <span className="eyebrow">REFERENCE MATERIAL</span>
                      <select
                        className="pdf-doc-select"
                        value={selectedPdfId ?? pdfDocumentName}
                        onChange={(event) => {
                          const nextId = event.target.value;
                          const nextDocument = pdfDocuments.find(
                            (document) => document.id === nextId,
                          );
                          setSelectedPdfId(nextId || null);
                          setPdfDocumentName(
                            nextDocument?.name ?? "Reference PDF",
                          );
                        }}
                      >
                        {pdfDocuments.length > 0 ? (
                          pdfDocuments.map((document) => (
                            <option key={document.id} value={document.id}>
                              {document.name}
                            </option>
                          ))
                        ) : (
                          <option value="">No PDFs uploaded yet</option>
                        )}
                      </select>
                    </div>
                    <div className="pdf-header-actions">
                      <button
                        className="icon-button small"
                        onClick={() =>
                          setPdfZoom((value) =>
                            Number(
                              Math.max(
                                0.7,
                                Number((value - 0.15).toFixed(2)),
                              ).toFixed(2),
                            ),
                          )
                        }
                        aria-label="Zoom out"
                      >
                        −
                      </button>
                      <button
                        className="icon-button small"
                        onClick={() =>
                          setPdfZoom((value) =>
                            Number(
                              Math.min(
                                2.2,
                                Number((value + 0.15).toFixed(2)),
                              ).toFixed(2),
                            ),
                          )
                        }
                        aria-label="Zoom in"
                      >
                        +
                      </button>
                      <button
                        className="icon-button small"
                        onClick={() => setPdfZoom(1)}
                        aria-label="Reset zoom"
                      >
                        100%
                      </button>
                    </div>
                  </div>
                  <div className="pdf-header-toolbar">
                    <button
                      className="pdf-nav-button"
                      onClick={() =>
                        setPdfPage((value) => Math.max(1, value - 1))
                      }
                    >
                      Prev
                    </button>
                    <span>Page {pdfPage}</span>
                    <button
                      className="pdf-nav-button"
                      onClick={() => setPdfPage((value) => value + 1)}
                    >
                      Next
                    </button>
                    <button
                      className="icon-button small pdf-close"
                      onClick={closePdfPane}
                      aria-label="Close PDF pane"
                    >
                      <X size={15} />
                    </button>
                  </div>
                  <div className="pdf-upload">
                    <label className="upload-card compact">
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={async (event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;

                          const formData = new FormData();
                          formData.append("file", file);
                          setPdfName(file.name);
                          setPdfUploadError(null);

                          try {
                            const res = await fetch("/api/pdfs", {
                              method: "POST",
                              body: formData,
                            });
                            const data = await res.json();
                            if (!res.ok) {
                              setPdfUploadError(data?.error ?? "Upload failed");
                              return;
                            }
                            await loadPdfDocuments();
                            setSelectedPdfId(data.id);
                            setPdfDocumentName(data.name || file.name);
                            setPdfPage(1);
                          } catch (err) {
                            console.error(err);
                            setPdfUploadError(
                              "Upload failed. Please try again.",
                            );
                          }
                        }}
                      />
                      <Upload size={22} />
                      <strong>{pdfName ?? "Add a PDF reference"}</strong>
                      <span>
                        {pdfName ? "Ready to compare" : "PDF files up to 20 MB"}
                      </span>
                    </label>
                    {pdfUploadError && (
                      <small className="error-text">{pdfUploadError}</small>
                    )}
                  </div>
                  <div className="pdf-viewer">
                    {selectedPdfId ? (
                      <iframe
                        src={`/api/pdfs/${selectedPdfId}`}
                        title={pdfDocumentName}
                        className="pdf-frame"
                        style={{ width: "100%", height: "100%", border: "0" }}
                      />
                    ) : (
                      <div
                        className="pdf-viewer-scroll"
                        style={{ zoom: pdfZoom }}
                      >
                        <div className="pdf-page-frame">
                          <div className="pdf-page-content">
                            <span className="eyebrow">REFERENCE PAGE</span>
                            <h3>{pdfDocumentName}</h3>
                            <p>{pdfName ?? "No document selected"}</p>
                            <div className="pdf-page-metadata">
                              <span>Page {pdfPage}</span>
                              <span>{Math.round(pdfZoom * 100)}%</span>
                            </div>
                            <div className="pdf-sample-lines">
                              <span>Topic summary</span>
                              <span>Key facts</span>
                              <span>Definition</span>
                              <span>Examples</span>
                              <span>Exam angle</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </aside>
                <Splitter
                  onPointerDown={startPdfDrag}
                  onDoubleClick={resetPdfSplit}
                  isDragging={isDraggingPdf}
                  label="Resize PDF panel"
                />
              </>
            )}

            <div className="editor-panel" style={{ flex: 1, minWidth: 0 }}>
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

            {isMapOpen && (
              <>
                <Splitter
                  onPointerDown={startMapDrag}
                  isDragging={isDraggingMap}
                  label="Resize map panel"
                />
                <aside
                  className="reference-panel map-panel"
                  style={{
                    width: `${mapWidth}px`,
                    flexBasis: `${mapWidth}px`,
                    flexShrink: 0,
                    overflow: "hidden",
                  }}
                >
                  <MapRoom
                    compact={false}
                    activeMap={activeMap}
                    setActiveMap={setActiveMap}
                    drawingTool={drawingTool}
                    setDrawingTool={setDrawingTool}
                    canvasRef={canvasRef}
                    beginDrawing={beginDrawing}
                    draw={draw}
                    setIsDrawing={setIsDrawing}
                    onClose={() => setIsMapOpen(false)}
                    onSave={() => setSaveStatus("Map snapshot ready")}
                    onUndo={undoMapCanvas}
                    canUndo={mapUndoCount > 0}
                  />
                </aside>
              </>
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
