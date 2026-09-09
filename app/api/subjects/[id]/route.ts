import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { getSessionUser } from "../../../../lib/auth";
import { connectDB } from "../../../../lib/db";
import SubjectModel from "../../../../lib/models/Subject";
import TopicModel from "../../../../lib/models/Topic";
import NoteModel from "../../../../lib/models/Note";
import { SUBJECT_ICONS } from "../../../../types";

function serializeSubject(document: any) {
  const id = String(document._id);

  return {
    id,
    _id: id,
    userId: String(document.userId),
    name: document.name,
    icon: document.icon,
    sortOrder: Number(document.sortOrder ?? document.sort_order ?? 0),
    sort_order: Number(document.sortOrder ?? document.sort_order ?? 0),
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
  const subject = await SubjectModel.findOne({
    _id: params.id,
    userId: userObjectId,
  }).lean();

  if (!subject) {
    return NextResponse.json({ error: "Subject not found" }, { status: 404 });
  }

  return NextResponse.json(serializeSubject(subject));
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
        { error: "Subject name cannot be empty." },
        { status: 400 },
      );
    }
    update.name = name;
  }

  if (typeof body?.icon === "string") {
    if (!SUBJECT_ICONS.includes(body.icon as (typeof SUBJECT_ICONS)[number])) {
      return NextResponse.json(
        { error: "Invalid icon value." },
        { status: 400 },
      );
    }
    update.icon = body.icon;
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
  const subject = await SubjectModel.findOneAndUpdate(
    { _id: params.id, userId: userObjectId },
    update,
    { new: true },
  ).lean();

  if (!subject) {
    return NextResponse.json({ error: "Subject not found" }, { status: 404 });
  }

  return NextResponse.json(serializeSubject(subject));
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
  const subject = await SubjectModel.findOne({
    _id: params.id,
    userId: userObjectId,
  });

  if (!subject) {
    return NextResponse.json({ error: "Subject not found" }, { status: 404 });
  }

  const topics = await TopicModel.find({
    userId: userObjectId,
    subjectId: subject._id,
  })
    .select("_id")
    .lean();
  const topicIds = topics.map((topic) => topic._id);

  if (topicIds.length > 0) {
    await NoteModel.deleteMany({
      userId: userObjectId,
      topicId: { $in: topicIds },
    });
    await TopicModel.deleteMany({
      userId: userObjectId,
      _id: { $in: topicIds },
    });
  }

  await SubjectModel.deleteOne({ _id: params.id, userId: userObjectId });

  return NextResponse.json({ success: true, deletedSubjectId: params.id });
}
