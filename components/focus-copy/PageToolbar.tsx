import { FileText, ListChecks, Map, Save } from "lucide-react";

import AppIcon from "./AppIcon";

type PageToolbarProps = {
  selectedSubjectName: string | null;
  selectedTopicName: string;
  isPdfOpen: boolean;
  isMapOpen: boolean;
  onOpenSyllabus: () => void;
  onTogglePdf: () => void;
  onToggleMap: () => void;
  onSaveNote: () => void;
  subjectIconName: string | null;
  pdfTotalPages?: number | null;
};

export function PageToolbar({
  selectedSubjectName,
  selectedTopicName,
  isPdfOpen,
  isMapOpen,
  onOpenSyllabus,
  onTogglePdf,
  onToggleMap,
  onSaveNote,
  subjectIconName,
  pdfTotalPages,
}: PageToolbarProps) {
  return (
    <div className="page-toolbar">
      <div className="page-context">
        <span className="subject-pill">
          <AppIcon name={subjectIconName} size={14} />{" "}
          {selectedSubjectName ?? "Study notes"}
        </span>
        <span className="slash">/</span>
        <span>{selectedTopicName}</span>
      </div>
      <div className="toolbar-actions">
        <button className="tool-button" onClick={onOpenSyllabus}>
          <ListChecks size={15} /> Syllabus
        </button>
        <button
          className={`tool-button ${isPdfOpen ? "active" : ""}`}
          onClick={onTogglePdf}
        >
          <FileText size={15} /> Reference PDF
          {pdfTotalPages ? ` (${pdfTotalPages})` : ""}
        </button>
        <button
          className={`tool-button ${isMapOpen ? "active" : ""}`}
          onClick={onToggleMap}
        >
          <Map size={15} /> Map practice
        </button>
        <button className="primary-button" onClick={onSaveNote}>
          <Save size={15} /> Save note
        </button>
      </div>
    </div>
  );
}
