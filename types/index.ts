import mongoose from "mongoose";

export const SUBJECT_ICONS = [
  "landmark",
  "mountain",
  "scroll-text",
  "chart-no-axes-combined",
  "leaf",
  "scale",
  "globe-2",
  "book-open",
] as const;

export const STUDY_TAGS = [
  "polity",
  "history",
  "geography",
  "economy",
  "science",
  "ethics",
  "essay",
  "current-affairs",
  "environment",
  "society",
  "international",
  "art-culture",
] as const;

export type SubjectIcon = (typeof SUBJECT_ICONS)[number];
export type StudyTag = (typeof STUDY_TAGS)[number];
export type NotePaperStyle = "lined" | "grid" | "blank";
export type MapId =
  | "india_political"
  | "india_physical"
  | "world"
  | "india_states";

export interface IUser {
  _id?: mongoose.Types.ObjectId | string;
  email: string;
  passwordHash: string;
  name?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISubject {
  _id?: mongoose.Types.ObjectId | string;
  userId: mongoose.Types.ObjectId | string;
  name: string;
  icon: SubjectIcon;
  sortOrder?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITopic {
  _id?: mongoose.Types.ObjectId | string;
  userId: mongoose.Types.ObjectId | string;
  subjectId: mongoose.Types.ObjectId | string;
  parentId?: mongoose.Types.ObjectId | string | null;
  name: string;
  sortOrder?: number;
  syllabusChecked?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface INote {
  _id?: mongoose.Types.ObjectId | string;
  userId: mongoose.Types.ObjectId | string;
  topicId: mongoose.Types.ObjectId | string;
  title?: string;
  content?: Record<string, unknown> | null;
  tags?: StudyTag[];
  paperStyle?: NotePaperStyle;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPdfDocument {
  _id?: mongoose.Types.ObjectId | string;
  userId: mongoose.Types.ObjectId | string;
  name: string;
  storageKey: string;
  sizeBytes?: number;
  uploadedAt?: Date;
}

export interface IMapSnapshot {
  _id?: mongoose.Types.ObjectId | string;
  userId: mongoose.Types.ObjectId | string;
  topicId: mongoose.Types.ObjectId | string;
  mapId: MapId;
  imageData: string;
  savedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
