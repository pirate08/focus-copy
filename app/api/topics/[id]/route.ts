import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { getSessionUser } from "../../../../lib/auth";
import { connectDB } from "../../../../lib/db";
import TopicModel from "../../../../lib/models/Topic";
import NoteModel from "../../../../lib/models/Note";

function serializeTopic(document: any) {
  const id = String(document._id);
  return {
    id,
    _id: id,
    userId: String(document.userId),
    subjectId: String(document.subjectId),
    subject_id: String(document.subjectId),
    parentId: document.parentId ? String(document.parentId) : null,
    parent_id: document.parentId ? String(document.parentId) : null,
    name: document.name,
    sortOrder: Number(document.sortOrder ?? document.sort_order ?? 0),
    sort_order: Number(document.sortOrder ?? document.sort_order ?? 0),
    syllabusChecked: Boolean(
      document.syllabusChecked ?? document.syllabus_checked ?? false,
    ),
    syllabus_checked: Boolean(
      document.syllabusChecked ?? document.syllabus_checked ?? false,
    ),
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
  const topic = await TopicModel.findOne({
    _id: params.id,
    userId: userObjectId,
  }).lean();

  if (!topic) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  return NextResponse.json(serializeTopic(topic));
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

  if (typeof body?.name === "string") {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json(
        { error: "Topic name cannot be empty." },
        { status: 400 },
      );
    }
    update.name = name;
  }

  if (
    typeof body?.sortOrder === "number" ||
    typeof body?.sort_order === "number"
  ) {
    update.sortOrder = Number(body?.sortOrder ?? body?.sort_order);
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { error: "No valid updates provided." },
      { status: 400 },
    );
  }

  await connectDB();
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const topic = await TopicModel.findOneAndUpdate(
    { _id: params.id, userId: userObjectId },
    update,
    { new: true },
  ).lean();

  if (!topic) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  return NextResponse.json(serializeTopic(topic));
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

  const queue = [params.id];
  const idsToDelete = new Set<string>();

  while (queue.length > 0) {
    const currentId = queue.shift() as string;
    if (idsToDelete.has(currentId)) continue;
    idsToDelete.add(currentId);

    const childIds = await TopicModel.find({
      userId: userObjectId,
      parentId: currentId,
    })
      .select("_id")
      .lean();
    for (const child of childIds) {
      queue.push(String(child._id));
    }
  }

  if (idsToDelete.size > 0) {
    await NoteModel.deleteMany({
      userId: userObjectId,
      topicId: { $in: [...idsToDelete] },
    });
    await TopicModel.deleteMany({
      userId: userObjectId,
      _id: { $in: [...idsToDelete] },
    });
  }

  return NextResponse.json({ success: true, deletedTopicId: params.id });
}
