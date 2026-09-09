import mongoose, { type Model, Schema } from "mongoose";
import type { IMapSnapshot } from "../../types";

const mapSnapshotSchema = new Schema<IMapSnapshot>(
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
    mapId: {
      type: String,
      required: true,
      enum: ["india_political", "india_physical", "world", "india_states"],
    },
    imageData: {
      type: String,
      required: true,
    },
    savedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

const MapSnapshotModel =
  (mongoose.models.MapSnapshot as Model<IMapSnapshot>) ||
  mongoose.model<IMapSnapshot>("MapSnapshot", mapSnapshotSchema);

export default MapSnapshotModel;
