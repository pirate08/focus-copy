"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { BottomInsights } from "./BottomInsights";
import { CurriculumCreateModal } from "./CurriculumCreateModal";
import { MapPanel } from "./MapPanel";
import { NoteEditorPanel } from "./NoteEditorPanel";
import { PageToolbar } from "./PageToolbar";
import { PdfPanel } from "./PdfPanel";
import { StealthDashboard } from "./StealthDashboard";
import { SyllabusModal } from "./SyllabusModal";
import { TopBar } from "./TopBar";
import { WorkspaceSidebar } from "./WorkspaceSidebar";
import { useCurriculum } from "./useCurriculum";
import { useMapPanel } from "./useMapPanel";
import { useNote } from "./useNote";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { usePdfPanel } from "./usePdfPanel";
import toast from "react-hot-toast";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";

import type { Topic } from "@/lib/types";

const mapOptions = [
  { id: "india_political", label: "India Political", tone: "india" },
  { id: "india_physical", label: "India Physical", tone: "terrain" },
  { id: "world", label: "World Map", tone: "world" },
  { id: "india_states", label: "State-wise", tone: "states" },
] as const;

type DrawingTool = "pen" | "highlighter" | "pin" | "circle" | "arrow";

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

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
  const [curriculumModal, setCurriculumModal] = useState<{
    open: boolean;
    type: "subject" | "chapter" | "topic";
    subjectId?: string;
    parentId?: string | null;
  }>({
    open: false,
    type: "subject",
    subjectId: undefined,
    parentId: null,
  });
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

  // Sync selected topic from URL if provided
  useEffect(() => {
    try {
      const param = searchParams?.get?.("topic");
      if (param && topics.find((t) => t.id === param)) {
        setSelectedTopicId(param);
      }
    } catch (err) {
      // ignore
    }
  }, [searchParams, topics, setSelectedTopicId]);

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

  const submitCurriculumItem = async ({
    name,
    icon,
    subjectId,
    parentId,
  }: {
    name: string;
    icon?: string;
    subjectId?: string;
    parentId?: string | null;
  }) => {
    if (curriculumModal.type === "subject") {
      const nextSortOrder =
        subjects.reduce((max, item) => Math.max(max, item.sort_order ?? 0), 0) +
        1;

      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          icon: icon ?? "book-open",
          sortOrder: nextSortOrder,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to create a subject.");
      }

      const createdSubject = data as (typeof subjects)[number];
      setSubjects((items) => [...items, createdSubject]);
      setExpanded((items) => ({ ...items, [createdSubject.id]: true }));
      try {
        toast.success("Subject created successfully");
      } catch (err) {
        /* noop */
      }
      return;
    }

    const targetSubjectId = subjectId ?? curriculumModal.subjectId;
    if (!targetSubjectId) {
      throw new Error("Please choose a subject first.");
    }

    const nextSortOrder =
      topics
        .filter(
          (item) =>
            item.subject_id === targetSubjectId &&
            (parentId ? item.parent_id === parentId : !item.parent_id),
        )
        .reduce((max, item) => Math.max(max, item.sort_order ?? 0), 0) + 1;

    const res = await fetch("/api/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subjectId: targetSubjectId,
        parentId: parentId ?? null,
        name,
        sortOrder: nextSortOrder,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error ?? "Failed to create curriculum item.");
    }

    const createdTopic = data as Topic;
    setTopics((items) => [...items, createdTopic]);
    setExpanded((items) => ({ ...items, [targetSubjectId]: true }));
    setSelectedTopicId(createdTopic.id);
    try {
      toast.success(
        curriculumModal.type === "chapter"
          ? "Chapter added to subject"
          : "Topic created",
      );
    } catch (err) {
      /* noop */
    }
  };

  const openCurriculumModal = (
    type: "subject" | "chapter" | "topic",
    subjectId?: string,
    parentId?: string | null,
  ) => {
    setCurriculumModal({
      open: true,
      type,
      subjectId,
      parentId: parentId ?? null,
    });
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
      <TopBar
        selectedTopicName={selectedTopic?.name ?? "Notes"}
        saveStatus={saveStatus}
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode((value) => !value)}
        onOpenSidebar={() => setShowMobileSidebar(true)}
        onOpenStealth={() => setShowStealth(true)}
      />
      <div className="workspace">
        <WorkspaceSidebar
          showMobileSidebar={showMobileSidebar}
          isPdfSplitOpen={isPdfSplitOpen}
          filteredSubjects={filteredSubjects}
          topics={topics}
          expanded={expanded}
          selectedTopicId={selectedTopicId}
          query={query}
          progress={progress}
          completedCount={completedCount}
          onSearch={setQuery}
          onToggleExpanded={(subjectId) =>
            setExpanded((items) => ({
              ...items,
              [subjectId]: !(expanded[subjectId] ?? false),
            }))
          }
          onSelectTopic={async (topicId) => {
            try {
              if (saveStatus === "Unsaved changes") {
                await saveNote();
              }
            } catch (err) {
              console.error(err);
            }
            setSelectedTopicId(topicId);
            try {
              const next = `${pathname}?topic=${encodeURIComponent(topicId)}`;
              router.replace(next);
            } catch (err) {
              /* ignore */
            }
            setShowMobileSidebar(false);
          }}
          onAddChapter={(subjectId) =>
            openCurriculumModal("chapter", subjectId)
          }
          onAddTopic={(subjectId, parentId) =>
            openCurriculumModal("topic", subjectId, parentId)
          }
          onOpenSidebar={() => setShowMobileSidebar(false)}
          onCreateSubject={() => openCurriculumModal("subject")}
        />
        <main className="main-area">
          <PageToolbar
            selectedSubjectName={
              subjects.find(
                (subject) => subject.id === selectedTopic?.subject_id,
              )?.name ?? "Study notes"
            }
            selectedTopicName={selectedTopic?.name ?? "Notebook"}
            isPdfOpen={isPdfOpen}
            isMapOpen={isMapOpen}
            onOpenSyllabus={() => setShowSyllabus(true)}
            onTogglePdf={togglePdfPane}
            onToggleMap={() => setIsMapOpen((value) => !value)}
            onSaveNote={() => void saveNote()}
            subjectIconName={
              subjects.find(
                (subject) => subject.id === selectedTopic?.subject_id,
              )?.icon ?? "book-open"
            }
          />
          <section
            ref={editorLayoutRef}
            className={`editor-layout ${isPdfOpen || isMapOpen ? "split-active" : ""}`}
          >
            {isPdfSplitOpen && (
              <PdfPanel
                pdfSplitWidth={pdfSplitWidth}
                selectedPdfId={selectedPdfId}
                pdfDocumentName={pdfDocumentName}
                pdfDocuments={pdfDocuments}
                pdfName={pdfName}
                pdfPage={pdfPage}
                pdfZoom={pdfZoom}
                pdfUploadError={pdfUploadError}
                isDragging={isDraggingPdf}
                onSelectPdf={(nextId) => {
                  const nextDocument = pdfDocuments.find(
                    (document) => document.id === nextId,
                  );
                  setSelectedPdfId(nextId || null);
                  setPdfDocumentName(nextDocument?.name ?? "Reference PDF");
                }}
                onZoomOut={() =>
                  setPdfZoom((value) =>
                    Number(
                      Math.max(0.7, Number((value - 0.15).toFixed(2))).toFixed(
                        2,
                      ),
                    ),
                  )
                }
                onZoomIn={() =>
                  setPdfZoom((value) =>
                    Number(
                      Math.min(2.2, Number((value + 0.15).toFixed(2))).toFixed(
                        2,
                      ),
                    ),
                  )
                }
                onResetZoom={() => setPdfZoom(1)}
                onPrevPage={() => setPdfPage((value) => Math.max(1, value - 1))}
                onNextPage={() => setPdfPage((value) => value + 1)}
                onClose={closePdfPane}
                onUpload={async (file) => {
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
                    setPdfUploadError("Upload failed. Please try again.");
                  }
                }}
                onPointerDown={startPdfDrag}
                onDoubleClick={resetPdfSplit}
              />
            )}

            <NoteEditorPanel
              noteTitle={noteTitle}
              tags={tags}
              paperStyle={paperStyle}
              editor={editor}
              onChangeTitle={(value) => {
                setNoteTitle(value);
                setSaveStatus("Unsaved changes");
              }}
              onToggleTag={(tag) => setTags((items) => [...items, tag])}
              onRemoveTag={(tag) =>
                setTags((items) => items.filter((item) => item !== tag))
              }
              onSetPaperStyle={setPaperStyle}
            />

            <MapPanel
              isMapOpen={isMapOpen}
              mapWidth={mapWidth}
              activeMap={activeMap}
              drawingTool={drawingTool}
              canvasRef={canvasRef}
              isDragging={isDraggingMap}
              onPointerDown={startMapDrag}
              onClose={() => setIsMapOpen(false)}
              onSave={() => setSaveStatus("Map snapshot ready")}
              onUndo={undoMapCanvas}
              onSetActiveMap={setActiveMap}
              onSetDrawingTool={setDrawingTool}
              onBeginDrawing={beginDrawing}
              onDraw={draw}
              onSetIsDrawing={setIsDrawing}
              canUndo={mapUndoCount > 0}
            />
          </section>
          <BottomInsights />
        </main>
      </div>

      <SyllabusModal
        isOpen={showSyllabus}
        progress={progress}
        topics={topics}
        subjects={subjects}
        onClose={() => setShowSyllabus(false)}
        onToggleTopic={toggleSyllabus}
      />

      <CurriculumCreateModal
        open={curriculumModal.open}
        type={curriculumModal.type}
        subjectId={curriculumModal.subjectId}
        parentId={curriculumModal.parentId}
        onClose={() =>
          setCurriculumModal((current) => ({ ...current, open: false }))
        }
        onSubmit={submitCurriculumItem}
      />
    </div>
  );
}
