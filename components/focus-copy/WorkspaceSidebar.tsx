import {
  Check,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  Plus,
  Search,
  Settings2,
} from "lucide-react";

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
}: WorkspaceSidebarProps) {
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
                          <span className="tree-label">{chapterLabel}</span>
                          {chapter.syllabus_checked && (
                            <Check size={13} className="done-check" />
                          )}
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
                                <span className="tree-label">
                                  {`${subjectNumber}.${chapterIndex + 1}.${topicIndex + 1}. ${topic.name}`}
                                </span>
                                {topic.syllabus_checked && (
                                  <Check size={13} className="done-check" />
                                )}
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
