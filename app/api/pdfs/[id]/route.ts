import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { getSessionUser } from "../../../../lib/auth";
import { connectDB } from "../../../../lib/db";
import PdfDocumentModel from "../../../../lib/models/PdfDocument";

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

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const userId = await getSessionUser(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!params?.id) {
    return NextResponse.json({ error: "PDF id is required" }, { status: 400 });
  }

  await connectDB();
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const document = await PdfDocumentModel.findOne({
    _id: params.id,
    userId: userObjectId,
  }).lean();

  if (!document) {
    return NextResponse.json({ error: "PDF not found" }, { status: 404 });
  }

  try {
    const bucket = getGridFSBucket();
    const storageObjectId = new mongoose.Types.ObjectId(
      String(document.storageKey),
    );
    const stream = bucket.openDownloadStream(storageObjectId);

    const chunks: Uint8Array[] = [];
    await new Promise<void>((resolve, reject) => {
      stream.on("data", (chunk: Uint8Array | Buffer) => {
        chunks.push(
          Buffer.isBuffer(chunk)
            ? new Uint8Array(chunk)
            : new Uint8Array(chunk),
        );
      });
      stream.on("end", resolve);
      stream.on("error", reject);
    });

    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const fileBytes = new Uint8Array(totalLength);
    let offset = 0;

    for (const chunk of chunks) {
      fileBytes.set(chunk, offset);
      offset += chunk.length;
    }

    const fileName = String(document.name || "document.pdf");

    return new NextResponse(fileBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Failed to stream PDF:", error);
    return NextResponse.json(
      { error: "PDF file could not be retrieved." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  const userId = await getSessionUser(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!params?.id) {
    return NextResponse.json({ error: "PDF id is required" }, { status: 400 });
  }

  await connectDB();
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const document = await PdfDocumentModel.findOne({
    _id: params.id,
    userId: userObjectId,
  }).lean();

  if (!document) {
    return NextResponse.json({ error: "PDF not found" }, { status: 404 });
  }

  try {
    const bucket = getGridFSBucket();
    const storageObjectId = new mongoose.Types.ObjectId(
      String(document.storageKey),
    );
    await bucket.delete(storageObjectId);
  } catch (error) {
    console.error("Failed to delete GridFS PDF record:", error);
  }

  await PdfDocumentModel.deleteOne({
    _id: params.id,
    userId: userObjectId,
  });

  return NextResponse.json({ success: true, pdfId: params.id });
}
