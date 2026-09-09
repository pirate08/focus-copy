import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { getSessionUser } from "../../../../../lib/auth";
import { connectDB } from "../../../../../lib/db";
import TopicModel from "../../../../../lib/models/Topic";

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

export async function PATCH(
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

  const nextValue = !Boolean(
    (topic as any).syllabusChecked ?? (topic as any).syllabus_checked ?? false,
  );
  const updated = await TopicModel.findOneAndUpdate(
    { _id: params.id, userId: userObjectId },
    { syllabusChecked: nextValue },
    { new: true },
  ).lean();

  return NextResponse.json(serializeTopic(updated));
}
