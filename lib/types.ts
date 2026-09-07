export type Subject = {
  id: string;
  name: string;
  icon: string | null;
  sort_order: number;
  created_at: string;
};

export type Topic = {
  id: string;
  subject_id: string;
  parent_id: string | null;
  name: string;
  sort_order: number;
  syllabus_checked: boolean;
  created_at: string;
};

export type Note = {
  id: string;
  topic_id: string;
  title: string;
  content: Record<string, unknown> | null;
  tags: string[];
  paper_style: 'lined' | 'grid' | 'blank';
  created_at: string;
  updated_at: string;
};

export const studyTags = ['GS1', 'GS2', 'GS3', 'GS4', 'Prelims', 'Mains Pyq'] as const;
export type StudyTag = (typeof studyTags)[number];
