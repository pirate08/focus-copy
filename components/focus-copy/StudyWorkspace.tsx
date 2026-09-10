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
import dynamic from "next/dynamic";

import type { Topic } from "@/lib/types";

const mapOptions = [
  { id: "india_political", label: "India Political", tone: "india" },
  { id: "india_physical", label: "India Physical", tone: "terrain" },
  { id: "world", label: "World Map", tone: "world" },
  { id: "india_states", label: "State-wise", tone: "states" },
] as const;

type DrawingTool = "pen" | "highlighter" | "pin" | "circle" | "arrow";

// Dynamic import with SSR disabled to prevent Node canvas errors
const PdfPanel = dynamic(() => import("./PdfPanel"), {
  ssr: false,
});

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
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [pdfTotalPages, setPdfTotalPages] = useState<number | null>(null);
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
    isDraggingPdf,
    closePdfPane,
    resetPdfSplit,
    startPdfDrag,
    togglePdfPane,
  } = usePdfPanel(editorLayoutRef, isMapOpen, mapWidth);

  // Reliable manual toggle fallback
  const handleTogglePdf = useCallback(() => {
    if (togglePdfPane) {
      togglePdfPane();
    } else {
      setIsPdfOpen((prev) => !prev);
    }
  }, [togglePdfPane, setIsPdfOpen]);

  const loadPdfDocuments = useCallback(async () => {
    try {
      const res = await fetch("/api/pdfs");
      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data)) return;
      setPdfDocuments(data);
      if (data.length && !selectedPdfId) {
        setSelectedPdfId(data[0].id);
        setPdfDocumentName(data[0].name || "Reference PDF");
      }
    } catch (err) {
      console.error(err);
    }
  }, [selectedPdfId]);

  const handleDeletePdf = useCallback(
    async (id: string) => {
      if (!id) return;
      try {
        const res = await fetch(`/api/pdfs/${id}`, { method: "DELETE" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error(data?.error ?? "Failed to delete PDF");
          return;
        }
        setPdfDocuments((items) => items.filter((d) => d.id !== id));
        if (selectedPdfId === id) {
          const next = pdfDocuments.find((d) => d.id !== id);
          setSelectedPdfId(next?.id ?? null);
          setPdfDocumentName(next?.name ?? "Reference PDF");
        }
        toast.success("PDF deleted");
      } catch (err) {
        console.error(err);
        toast.error("Failed to delete PDF");
      }
    },
    [pdfDocuments, selectedPdfId],
  );

  useEffect(() => {
    void loadPdfDocuments();
  }, [loadPdfDocuments]);

  // Stable note saving without cascading state recreation
  const saveNote = useCallback(async () => {
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
  }, [
    selectedTopic,
    editor,
    noteTitle,
    tags,
    paperStyle,
    noteId,
    setNoteId,
    setSaveStatus,
  ]);

  // Keep a ref to saveNote to avoid putting it in the switch topic effect
  const saveNoteRef = useRef(saveNote);
  saveNoteRef.current = saveNote;
  const saveStatusRef = useRef(saveStatus);
  saveStatusRef.current = saveStatus;

  // STOP SHAKING: Only depend strictly on selectedTopicId
  useEffect(() => {
    if (!editor || !selectedTopicId) return;
    let isCancelled = false;

    async function loadCurrentTopic() {
      try {
        if (saveStatusRef.current === "Unsaved changes") {
          await saveNoteRef.current();
        }
        if (!isCancelled) {
          await loadNoteForTopic(selectedTopicId);
        }
      } catch (err) {
        console.error(err);
      }
    }

    void loadCurrentTopic();

    return () => {
      isCancelled = true;
    };
  }, [selectedTopicId, editor, loadNoteForTopic]);

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
  }, [isPdfOpen, isMapOpen, undoMapCanvas, setIsPdfOpen]);

  // Sync selected topic from URL query if present
  useEffect(() => {
    try {
      const param = searchParams?.get?.("topic");
      if (param && topics.some((t) => t.id === param)) {
        setSelectedTopicId(param);
      }
    } catch (err) {
      /* ignore */
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
      if (!res.ok)
        throw new Error(data?.error ?? "Failed to create a subject.");

      const createdSubject = data as (typeof subjects)[number];
      setSubjects((items) => [...items, createdSubject]);
      setExpanded((items) => ({ ...items, [createdSubject.id]: true }));
      toast.success("Subject created successfully");
      return;
    }

    const targetSubjectId = subjectId ?? curriculumModal.subjectId;
    if (!targetSubjectId) throw new Error("Please choose a subject first.");

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
    if (!res.ok)
      throw new Error(data?.error ?? "Failed to create curriculum item.");

    const createdTopic = data as Topic;
    setTopics((items) => [...items, createdTopic]);
    setExpanded((items) => ({ ...items, [targetSubjectId]: true }));
    setSelectedTopicId(createdTopic.id);
    toast.success(
      curriculumModal.type === "chapter"
        ? "Chapter added to subject"
        : "Topic created",
    );
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
            if (topicId === selectedTopicId) return;
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
              subjects.find((s) => s.id === selectedTopic?.subject_id)?.name ??
              "Study notes"
            }
            selectedTopicName={selectedTopic?.name ?? "Notebook"}
            isPdfOpen={isPdfOpen}
            isMapOpen={isMapOpen}
            onOpenSyllabus={() => setShowSyllabus(true)}
            onTogglePdf={handleTogglePdf}
            onToggleMap={() => setIsMapOpen((value) => !value)}
            onSaveNote={() => void saveNote()}
            subjectIconName={
              subjects.find((s) => s.id === selectedTopic?.subject_id)?.icon ??
              "book-open"
            }
            pdfTotalPages={pdfTotalPages}
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
                    (doc) => doc.id === nextId,
                  );
                  setSelectedPdfId(nextId || null);
                  setPdfDocumentName(nextDocument?.name ?? "Reference PDF");
                }}
                onSetZoom={setPdfZoom}
                onSetPage={setPdfPage}
                onDocumentLoadSuccess={setPdfTotalPages}
                isUploading={isUploadingPdf}
                onClose={closePdfPane}
                onUpload={async (file) => {
                  setIsUploadingPdf(true);
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
                  } finally {
                    setIsUploadingPdf(false);
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
              onBeginDrawing={() => {}}
              onDraw={() => {}}
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
