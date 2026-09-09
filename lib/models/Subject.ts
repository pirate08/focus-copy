import mongoose, {
  type Model,
  Schema,
  type Schema as SchemaType,
} from "mongoose";
import { SUBJECT_ICONS, type ISubject } from "../../types";

const subjectSchema = new Schema<ISubject>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      required: true,
      enum: SUBJECT_ICONS,
      default: "book-open",
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

const SubjectModel =
  (mongoose.models.Subject as Model<ISubject>) ||
  mongoose.model<ISubject>("Subject", subjectSchema);

export default SubjectModel;
