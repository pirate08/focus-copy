import mongoose, { type Model, Schema } from "mongoose";
import type { IPdfDocument } from "../../types";

const pdfDocumentSchema = new Schema<IPdfDocument>(
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
    storageKey: {
      type: String,
      required: true,
    },
    sizeBytes: {
      type: Number,
      default: 0,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  },
);

const PdfDocumentModel =
  (mongoose.models.PdfDocument as Model<IPdfDocument>) ||
  mongoose.model<IPdfDocument>("PdfDocument", pdfDocumentSchema);

export default PdfDocumentModel;
