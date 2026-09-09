import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { getSessionUser } from "../../../lib/auth";
import { connectDB } from "../../../lib/db";
import NoteModel from "../../../lib/models/Note";
import { STUDY_TAGS, type StudyTag } from "../../../types";

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

export async function GET(request: Request) {
  const userId = await getSessionUser(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const topicId = searchParams.get("topicId") ?? searchParams.get("topic_id");

  await connectDB();
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const filter: Record<string, unknown> = { userId: userObjectId };
  if (topicId) {
    filter.topicId = new mongoose.Types.ObjectId(topicId);
  }

  const notes = await NoteModel.find(filter).sort({ updatedAt: -1 }).lean();
  return NextResponse.json(notes.map(serializeNote));
}

export async function POST(request: Request) {
  const userId = await getSessionUser(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const topicId = body?.topicId ?? body?.topic_id;
  const title =
    typeof body?.title === "string" ? body.title.trim() : "Untitled note";
  const content =
    typeof body?.content !== "undefined"
      ? body.content
      : { type: "doc", content: [] };
  const tags = normalizeTags(body?.tags);
  const paperStyle = body?.paperStyle ?? body?.paper_style ?? "lined";

  if (!topicId) {
    return NextResponse.json({ error: "topicId is required" }, { status: 400 });
  }

  if (!["lined", "grid", "blank"].includes(paperStyle)) {
    return NextResponse.json(
      { error: "paperStyle must be lined, grid, or blank" },
      { status: 400 },
    );
  }

  await connectDB();
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const topicObjectId = new mongoose.Types.ObjectId(topicId);

  const note = (await NoteModel.create({
    userId: userObjectId,
    topicId: topicObjectId,
    title: title || "Untitled note",
    content,
    tags,
    paperStyle,
  } as any)) as any;

  return NextResponse.json(serializeNote(note), { status: 201 });
}

export async function PATCH(request: Request) {
  const userId = await getSessionUser(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const id = body?.id ?? body?._id;
  if (!id) {
    return NextResponse.json({ error: "Note id is required" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (typeof body?.title === "string")
    update.title = body.title.trim() || "Untitled note";
  if (typeof body?.content !== "undefined") update.content = body.content;
  if (Array.isArray(body?.tags)) update.tags = normalizeTags(body.tags);
  if (typeof body?.paperStyle !== "undefined")
    update.paperStyle = body.paperStyle;
  if (typeof body?.paper_style !== "undefined")
    update.paperStyle = body.paper_style;

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
  const noteObjectId = new mongoose.Types.ObjectId(id);

  const updated = await NoteModel.findOneAndUpdate(
    { _id: noteObjectId, userId: userObjectId },
    update,
    { new: true },
  ).lean();

  if (!updated) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  return NextResponse.json(serializeNote(updated));
}
