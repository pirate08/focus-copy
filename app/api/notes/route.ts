import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { getSessionUser } from "../../../lib/auth";
import { connectDB } from "../../../lib/db";
import NoteModel from "../../../lib/models/Note";

function serializeNote(document: any) {
  const id = String(document._id);
  return {
    id,
    _id: id,
    userId: String(document.userId),
    topicId: String(document.topicId),
    topic_id: String(document.topicId),
    title: document.title,
    content: document.content,
    tags: document.tags ?? [],
    paperStyle: document.paperStyle ?? document.paper_style ?? "lined",
    paper_style: document.paperStyle ?? document.paper_style ?? "lined",
    createdAt: document.createdAt?.toISOString?.() ?? null,
    updatedAt: document.updatedAt?.toISOString?.() ?? null,
  };
}

export async function POST(request: Request) {
  const userId = await getSessionUser(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const topicId = body?.topicId ?? body?.topic_id;
  const title = typeof body?.title === "string" ? body.title : "Untitled note";
  const content =
    typeof body?.content !== "undefined"
      ? body.content
      : { type: "doc", content: [] };
  const tags = Array.isArray(body?.tags) ? body.tags : [];
  const paperStyle = body?.paperStyle ?? body?.paper_style ?? "lined";

  if (!topicId) {
    return NextResponse.json({ error: "topicId is required" }, { status: 400 });
  }

  await connectDB();
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const topicObjectId = new mongoose.Types.ObjectId(topicId);

  const note = await NoteModel.create({
    userId: userObjectId,
    topicId: topicObjectId,
    title,
    content,
    tags,
    paperStyle,
  });

  return NextResponse.json(serializeNote(note.toObject()), { status: 201 });
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

  const update: Record<string, any> = {};
  if (typeof body?.title === "string") update.title = body.title;
  if (typeof body?.content !== "undefined") update.content = body.content;
  if (Array.isArray(body?.tags)) update.tags = body.tags;
  if (typeof body?.paperStyle !== "undefined")
    update.paperStyle = body.paperStyle;
  if (typeof body?.paper_style !== "undefined")
    update.paperStyle = body.paper_style;

  await connectDB();
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const noteObjectId = new mongoose.Types.ObjectId(id);

  const updated = await NoteModel.findOneAndUpdate(
    { _id: noteObjectId, userId: userObjectId },
    update,
    { new: true },
  ).lean();

  if (!updated)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(serializeNote(updated));
}
