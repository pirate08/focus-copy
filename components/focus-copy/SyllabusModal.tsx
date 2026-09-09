import { Check, X } from "lucide-react";

import type { Subject, Topic } from "@/lib/types";

type SyllabusModalProps = {
  isOpen: boolean;
  progress: number;
  topics: Topic[];
  subjects: Subject[];
  onClose: () => void;
  onToggleTopic: (topic: Topic) => void;
};

export function SyllabusModal({
  isOpen,
  progress,
  topics,
  subjects,
  onClose,
  onToggleTopic,
}: SyllabusModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="syllabus-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <span className="eyebrow">UPSC TRACKER</span>
            <h2>Syllabus progress</h2>
          </div>
          <button className="icon-button" onClick={onClose}>
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
                onChange={() => void onToggleTopic(topic)}
              />
              <span className="custom-check">
                {topic.syllabus_checked && <Check size={13} />}
              </span>
              <span>{topic.name}</span>
              <small>
                {
                  subjects.find((subject) => subject.id === topic.subject_id)
                    ?.name
                }
              </small>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
