import mongoose, { type Model, Schema } from "mongoose";
import type { ITopic } from "../../types";

const topicSchema = new Schema<ITopic>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "Topic",
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    syllabusChecked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

const TopicModel =
  (mongoose.models.Topic as Model<ITopic>) ||
  mongoose.model<ITopic>("Topic", topicSchema);

export default TopicModel;
