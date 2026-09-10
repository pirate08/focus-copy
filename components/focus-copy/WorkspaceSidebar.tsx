import {
  Check,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  Plus,
  Search,
  Settings2,
  Pencil,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import type { Subject, Topic } from "@/lib/types";

import AppIcon from "./AppIcon";

type WorkspaceSidebarProps = {
  showMobileSidebar: boolean;
  isPdfSplitOpen: boolean;
  filteredSubjects: Subject[];
  topics: Topic[];
  expanded: Record<string, boolean>;
  selectedTopicId: string;
  query: string;
  progress: number;
  completedCount: number;
  onSearch: (value: string) => void;
  onToggleExpanded: (subjectId: string) => void;
  onSelectTopic: (topicId: string) => void;
  onAddChapter: (subjectId: string) => void;
  onAddTopic: (subjectId: string, parentId?: string | null) => void;
  onOpenSidebar: () => void;
  onCreateSubject: () => void;
  onRenameTopic?: (id: string, name: string) => Promise<void>;
  onDeleteTopic?: (id: string) => Promise<void>;
};

export function WorkspaceSidebar({
  showMobileSidebar,
  isPdfSplitOpen,
  filteredSubjects,
  topics,
  expanded,
  selectedTopicId,
  query,
  progress,
  completedCount,
  onSearch,
  onToggleExpanded,
  onSelectTopic,
  onAddChapter,
  onAddTopic,
  onOpenSidebar,
  onCreateSubject,
  onRenameTopic,
  onDeleteTopic,
}: WorkspaceSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
    type: "chapter" | "topic";
  } | null>(null);

  const beginEdit = (id: string, name: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setEditingId(id);
    setEditingValue(name);
  };

  const cancelEdit = (event?: React.MouseEvent) => {
    event?.stopPropagation();
    setEditingId(null);
    setEditingValue("");
  };

  const confirmEdit = async (id: string) => {
    if (!editingValue.trim()) return;
    try {
      await onRenameTopic?.(id, editingValue.trim());
    } catch (err) {
      /* handled upstream */
    } finally {
      setEditingId(null);
      setEditingValue("");
    }
  };

  const openDeleteDialog = (
    id: string,
    name: string,
    type: "chapter" | "topic",
    event?: React.MouseEvent,
  ) => {
    event?.stopPropagation();
    setDeleteTarget({ id, name, type });
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await onDeleteTopic?.(deleteTarget.id);
    } catch (err) {
      /* handled upstream */
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };
  return (
    <aside
      className={`sidebar ${showMobileSidebar ? "sidebar-open" : ""} ${isPdfSplitOpen ? "sidebar-hidden" : ""}`}
    >
      <div className="sidebar-heading">
        <div>
          <span className="eyebrow">YOUR CURRICULUM</span>
          <h2>Subject tree</h2>
        </div>
        <button className="icon-button small" onClick={onCreateSubject}>
          <FolderPlus size={16} />
        </button>
      </div>
      <div className="search-box">
        <Search size={15} />
        <input
          value={query}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search subjects…"
        />
      </div>
      <div className="tree-list">
        {filteredSubjects.map((subject, subjectIndex) => {
          const subjectChapters = topics.filter(
            (topic) => topic.subject_id === subject.id && !topic.parent_id,
          );
          const isOpen = expanded[subject.id] ?? subject.name === "Geography";
          const subjectNumber = `${subjectIndex + 1}`;

          return (
            <div className="tree-group" key={subject.id}>
              <div
                className="tree-row subject-row"
                onClick={() => onToggleExpanded(subject.id)}
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
                <span className="tree-label">
                  {subjectNumber}. {subject.name}
                </span>
                <span className="tree-count">{subjectChapters.length}</span>
                <button
                  className="tree-add"
                  onClick={(event) => {
                    event.stopPropagation();
                    onAddChapter(subject.id);
                  }}
                >
                  <Plus size={14} />
                </button>
              </div>
              {isOpen && (
                <div className="nested-list">
                  {subjectChapters.map((chapter, chapterIndex) => {
                    const chapterTopics = topics.filter(
                      (topic) => topic.parent_id === chapter.id,
                    );
                    const chapterLabel = `${subjectNumber}.${chapterIndex + 1}. ${chapter.name}`;

                    return (
                      <div key={chapter.id}>
                        <div
                          className={`tree-row topic-row ${selectedTopicId === chapter.id ? "selected" : ""}`}
                          onClick={() => {
                            onSelectTopic(chapter.id);
                            onOpenSidebar();
                          }}
                        >
                          <span className="topic-dot" />
                          {editingId === chapter.id ? (
                            <input
                              autoFocus
                              className="tree-edit-input"
                              value={editingValue}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => setEditingValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") confirmEdit(chapter.id);
                                if (e.key === "Escape") cancelEdit();
                              }}
                              onBlur={() => confirmEdit(chapter.id)}
                            />
                          ) : (
                            <span className="tree-label">{chapterLabel}</span>
                          )}
                          {chapter.syllabus_checked && (
                            <Check size={13} className="done-check" />
                          )}
                          <div
                            className="row-actions"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              className="icon-button ghost"
                              title="Rename"
                              onClick={(e) =>
                                beginEdit(chapter.id, chapter.name, e)
                              }
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              className="icon-button ghost"
                              title="Delete"
                              onClick={(e) =>
                                openDeleteDialog(
                                  chapter.id,
                                  chapter.name,
                                  "chapter",
                                  e,
                                )
                              }
                            >
                              <Trash2 size={13} />
                            </button>
                            <button
                              className="tree-add"
                              onClick={(event) => {
                                event.stopPropagation();
                                onAddTopic(subject.id, chapter.id);
                              }}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                        {chapterTopics.length > 0 && (
                          <div className="deep-list">
                            {chapterTopics.map((topic, topicIndex) => (
                              <div
                                key={topic.id}
                                className={`tree-row deep ${selectedTopicId === topic.id ? "selected" : ""}`}
                                onClick={() => {
                                  onSelectTopic(topic.id);
                                  onOpenSidebar();
                                }}
                              >
                                <span className="topic-dot active" />
                                {editingId === topic.id ? (
                                  <input
                                    autoFocus
                                    className="tree-edit-input"
                                    value={editingValue}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) =>
                                      setEditingValue(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter")
                                        confirmEdit(topic.id);
                                      if (e.key === "Escape") cancelEdit();
                                    }}
                                    onBlur={() => confirmEdit(topic.id)}
                                  />
                                ) : (
                                  <span className="tree-label">
                                    {`${subjectNumber}.${chapterIndex + 1}.${topicIndex + 1}. ${topic.name}`}
                                  </span>
                                )}
                                {topic.syllabus_checked && (
                                  <Check size={13} className="done-check" />
                                )}
                                <div
                                  className="row-actions"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    className="icon-button ghost"
                                    title="Rename"
                                    onClick={(e) =>
                                      beginEdit(topic.id, topic.name, e)
                                    }
                                  >
                                    <Pencil size={12} />
                                  </button>
                                  <button
                                    className="icon-button ghost"
                                    title="Delete"
                                    onClick={(e) =>
                                      openDeleteDialog(
                                        topic.id,
                                        topic.name,
                                        "topic",
                                        e,
                                      )
                                    }
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button className="new-subject" onClick={onCreateSubject}>
        <Plus size={15} /> New subject
      </button>
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        {deleteTarget && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                Delete {deleteTarget.type === "chapter" ? "Chapter" : "Topic"}
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{deleteTarget.name}"? All
                nested topics and notes will also be deleted.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <div
                style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
              >
                <button
                  className="btn"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={doDelete}
                  disabled={deleting}
                >
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
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
  );
}
