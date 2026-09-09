import mongoose, { type Model, Schema } from "mongoose";
import { STUDY_TAGS, type INote, type NotePaperStyle } from "../../types";

const noteSchema = new Schema<INote>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    topicId: {
      type: Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: "Untitled note",
      trim: true,
    },
    content: {
      type: Schema.Types.Mixed,
      default: {
        type: "doc",
        content: [],
      },
    },
    tags: {
      type: [String],
      enum: STUDY_TAGS,
      default: [],
    },
    paperStyle: {
      type: String,
      enum: ["lined", "grid", "blank"] as NotePaperStyle[],
      default: "lined",
    },
  },
  {
    timestamps: true,
  },
);

noteSchema.index({ userId: 1, topicId: 1 }, { unique: true });

const NoteModel =
  (mongoose.models.Note as Model<INote>) ||
  mongoose.model<INote>("Note", noteSchema);

export default NoteModel;
