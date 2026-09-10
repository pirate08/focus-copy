import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { getSessionUser } from "../../../lib/auth";
import { connectDB } from "../../../lib/db";
import TopicModel from "../../../lib/models/Topic";

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

export async function GET(request: Request) {
  const userId = await getSessionUser(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const { searchParams } = new URL(request.url);
  const subjectId =
    searchParams.get("subjectId") ?? searchParams.get("subject_id");

  const filter: Record<string, unknown> = { userId: userObjectId };
  if (subjectId) {
    filter.subjectId = new mongoose.Types.ObjectId(subjectId);
  }

  const documents = await TopicModel.find(filter)
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();

  return NextResponse.json(documents.map(serializeTopic));
}

export async function POST(request: Request) {
  const userId = await getSessionUser(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const subjectId =
    typeof body?.subjectId === "string" ? body.subjectId : body?.subject_id;
  const parentId =
    typeof body?.parentId === "string"
      ? body.parentId
      : (body?.parent_id ?? null);
  const sortOrder = Number(body?.sortOrder ?? body?.sort_order ?? 0);
  const syllabusChecked = Boolean(
    body?.syllabusChecked ?? body?.syllabus_checked ?? false,
  );

  if (!name) {
    return NextResponse.json(
      { error: "Topic name is required." },
      { status: 400 },
    );
  }

  if (!subjectId) {
    return NextResponse.json(
      { error: "A subjectId is required." },
      { status: 400 },
    );
  }

  await connectDB();
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const subjectObjectId = new mongoose.Types.ObjectId(subjectId);

  const topic = await TopicModel.create({
    userId: userObjectId,
    subjectId: subjectObjectId,
    parentId: parentId ? new mongoose.Types.ObjectId(parentId) : null,
    name,
    sortOrder,
    syllabusChecked,
  });

  return NextResponse.json(serializeTopic(topic.toObject()), { status: 201 });
}

export async function PATCH(request: Request) {
  const userId = await getSessionUser(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const id = body?.id ?? body?.topicId ?? body?.topic_id;
  if (!id) {
    return NextResponse.json({ error: "Missing topic id." }, { status: 400 });
  }

  const update: Record<string, any> = {};
  if (typeof body?.syllabusChecked !== "undefined") {
    update.syllabusChecked = Boolean(body.syllabusChecked);
  }
  if (typeof body?.name === "string") update.name = body.name.trim();
  if (typeof body?.name === "string" && update.name === "") {
    return NextResponse.json(
      { error: "Topic name is required." },
      { status: 400 },
    );
  }
  if (typeof body?.sortOrder !== "undefined")
    update.sortOrder = Number(body.sortOrder ?? body.sort_order ?? 0);

  await connectDB();
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const topicObjectId = new mongoose.Types.ObjectId(id);

  const updated = await TopicModel.findOneAndUpdate(
    { _id: topicObjectId, userId: userObjectId },
    update,
    { new: true },
  ).lean();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(serializeTopic(updated));
}

export async function DELETE(request: Request) {
  const userId = await getSessionUser(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const { searchParams } = new URL(request.url);
  const queryId = searchParams.get("id") ?? searchParams.get("topicId");

  const body = await request.json().catch(() => ({}));
  const bodyId = body?.id ?? body?.topicId ?? body?.topic_id;

  const id = queryId ?? bodyId;
  if (!id) {
    return NextResponse.json({ error: "Missing topic id." }, { status: 400 });
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const topicObjectId = new mongoose.Types.ObjectId(id);

  // Ensure the topic exists and belongs to the user
  const root = await TopicModel.findOne({
    _id: topicObjectId,
    userId: userObjectId,
  }).lean();
  if (!root) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Gather all descendant topic ids (BFS)
  const toVisit = [topicObjectId];
  const allIds: mongoose.Types.ObjectId[] = [topicObjectId];

  while (toVisit.length) {
    const current = toVisit.shift() as mongoose.Types.ObjectId;
    const children = await TopicModel.find({
      parentId: current,
      userId: userObjectId,
    }).lean();
    for (const child of children) {
      const childId = new mongoose.Types.ObjectId(String(child._id));
      allIds.push(childId);
      toVisit.push(childId);
    }
  }

  // Delete Notes that reference these topics
  const NoteModel = (await import("../../../lib/models/Note")).default;
  await NoteModel.deleteMany({
    topicId: { $in: allIds },
    userId: userObjectId,
  });

  // Delete the topics themselves
  await TopicModel.deleteMany({ _id: { $in: allIds }, userId: userObjectId });

  return NextResponse.json({ success: true, deletedId: String(topicObjectId) });
}
