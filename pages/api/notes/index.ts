import type { NextApiRequest, NextApiResponse } from "next";
import { getDb, normalizeDocument } from "@/lib/mongo";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const db = await getDb();

  if (req.method === "GET") {
    const topicId = req.query.topic_id as string | undefined;

    if (!db) {
      return res.status(200).json([]);
    }

    const coll = db.collection("notes");
    const filter = topicId ? { topic_id: topicId } : {};
    const items = (await coll.find(filter).toArray())
      .map(normalizeDocument)
      .filter(Boolean);
    return res.status(200).json(items);
  }

  if (req.method === "POST") {
    if (!db) {
      return res.status(503).json({ message: "MongoDB is not configured" });
    }

    const body = req.body ?? {};
    const now = new Date().toISOString();
    const item = {
      id: body.id ?? crypto.randomUUID(),
      topic_id: body.topic_id,
      title: body.title ?? "Untitled note",
      content: body.content ?? null,
      tags: Array.isArray(body.tags) ? body.tags : [],
      paper_style: body.paper_style ?? "lined",
      created_at: body.created_at ?? now,
      updated_at: body.updated_at ?? now,
    };

    const coll = db.collection("notes");
    await coll.insertOne({ ...item });
    const stored = await coll.findOne({ id: item.id });
    return res.status(201).json(normalizeDocument(stored));
  }

  return res.status(405).end();
}
