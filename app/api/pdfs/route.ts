import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { getSessionUser } from "../../../lib/auth";
import { connectDB } from "../../../lib/db";
import PdfDocumentModel from "../../../lib/models/PdfDocument";

function getGridFSBucket() {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("MongoDB connection is not ready.");
  }

  const GridFSBucket = (mongoose as any).mongo?.GridFSBucket;
  if (!GridFSBucket) {
    throw new Error("GridFS is not available on the MongoDB driver.");
  }

  return new GridFSBucket(db, { bucketName: "pdfs" });
}

function serializePdf(document: any) {
  const id = String(document._id);
  return {
    id,
    _id: id,
    userId: String(document.userId),
    name: document.name ?? "Untitled PDF",
    storageKey: String(document.storageKey),
    sizeBytes: Number(document.sizeBytes ?? 0),
    uploadedAt: document.uploadedAt?.toISOString?.() ?? null,
  };
}

export async function GET(request: Request) {
  const userId = await getSessionUser(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const documents = await PdfDocumentModel.find({ userId: userObjectId })
    .sort({ uploadedAt: -1 })
    .lean();

  return NextResponse.json(documents.map(serializePdf));
}

export async function POST(request: Request) {
  const userId = await getSessionUser(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json(
      { error: "Invalid form-data payload." },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "A PDF file is required in the file field." },
      { status: 400 },
    );
  }

  const isPdf =
    file.type === "application/pdf" || /\.pdf$/i.test(file.name || "");

  if (!isPdf) {
    return NextResponse.json(
      { error: "Only PDF files are allowed." },
      { status: 400 },
    );
  }

  if (file.size <= 0) {
    return NextResponse.json({ error: "The file is empty." }, { status: 400 });
  }

  await connectDB();
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const bucket = getGridFSBucket();
  const fileName = file.name || "document.pdf";
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  const uploadStream = bucket.openUploadStream(fileName, {
    metadata: {
      userId,
      uploadedAt: new Date().toISOString(),
    },
  });

  await new Promise<void>((resolve, reject) => {
    uploadStream.on("finish", resolve);
    uploadStream.on("error", reject);
    uploadStream.end(fileBuffer);
  });

  const document = (await PdfDocumentModel.create({
    userId: userObjectId,
    name: fileName,
    storageKey: String(uploadStream.id),
    sizeBytes: file.size,
    uploadedAt: new Date(),
  } as any)) as any;

  return NextResponse.json(serializePdf(document), { status: 201 });
}
