import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { getSessionUser } from "../../../lib/auth";
import { connectDB } from "../../../lib/db";
import SubjectModel from "../../../lib/models/Subject";
import { SUBJECT_ICONS } from "../../../types";

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

export async function GET(request: Request) {
  const userId = await getSessionUser(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const documents = await SubjectModel.find({ userId: userObjectId })
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();

  return NextResponse.json(documents.map(serializeSubject));
}

export async function POST(request: Request) {
  const userId = await getSessionUser(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const icon = typeof body?.icon === "string" ? body.icon : "book-open";
  const sortOrder = Number(body?.sortOrder ?? body?.sort_order ?? 0);

  if (!name) {
    return NextResponse.json(
      { error: "Subject name is required." },
      { status: 400 },
    );
  }

  if (!SUBJECT_ICONS.includes(icon as (typeof SUBJECT_ICONS)[number])) {
    return NextResponse.json({ error: "Invalid icon value." }, { status: 400 });
  }

  await connectDB();
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const subject = await SubjectModel.create({
    userId: userObjectId,
    name,
    icon,
    sortOrder,
  });

  return NextResponse.json(serializeSubject(subject.toObject()), {
    status: 201,
  });
}
