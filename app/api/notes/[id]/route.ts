import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { getSessionUser } from "../../../../lib/auth";
import { connectDB } from "../../../../lib/db";
import NoteModel from "../../../../lib/models/Note";
import { STUDY_TAGS, type StudyTag } from "../../../../types";

function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];

  const validSet = new Set(STUDY_TAGS);
  const normalized = tags
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag) => validSet.has(tag as StudyTag));

  return [...new Set(normalized)];
}

function serializeNote(document: any) {
  const id = String(document._id);
  return {
    id,
    _id: id,
    userId: String(document.userId),
    topicId: String(document.topicId),
    topic_id: String(document.topicId),
    title: document.title ?? "Untitled note",
    content: document.content ?? { type: "doc", content: [] },
    tags: Array.isArray(document.tags) ? document.tags : [],
    paperStyle: document.paperStyle ?? document.paper_style ?? "lined",
    paper_style: document.paperStyle ?? document.paper_style ?? "lined",
    createdAt: document.createdAt?.toISOString?.() ?? null,
    updatedAt: document.updatedAt?.toISOString?.() ?? null,
  };
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const userId = await getSessionUser(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const note = await NoteModel.findOne({
    _id: params.id,
    userId: userObjectId,
  }).lean();

  if (!note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  return NextResponse.json(serializeNote(note));
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const userId = await getSessionUser(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const update: Record<string, unknown> = {};

  if (typeof body?.title === "string") {
    update.title = body.title.trim() || "Untitled note";
  }

  if (typeof body?.content !== "undefined") {
    update.content = body.content;
  }

  if (Array.isArray(body?.tags)) {
    update.tags = normalizeTags(body.tags);
  }

  if (typeof body?.paperStyle !== "undefined") {
    update.paperStyle = body.paperStyle;
  }

  if (typeof body?.paper_style !== "undefined") {
    update.paperStyle = body.paper_style;
  }

  if (
    typeof update.paperStyle === "string" &&
    !["lined", "grid", "blank"].includes(update.paperStyle as string)
  ) {
    return NextResponse.json(
      { error: "paperStyle must be lined, grid, or blank" },
      { status: 400 },
    );
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { error: "No note updates provided." },
      { status: 400 },
    );
  }

  await connectDB();
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const note = await NoteModel.findOneAndUpdate(
    { _id: params.id, userId: userObjectId },
    update,
    { new: true },
  ).lean();

  if (!note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  return NextResponse.json(serializeNote(note));
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  const userId = await getSessionUser(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const deleted = await NoteModel.findOneAndDelete({
    _id: params.id,
    userId: userObjectId,
  }).lean();

  if (!deleted) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, deletedNoteId: params.id });
}
