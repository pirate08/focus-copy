import type { NextApiRequest, NextApiResponse } from "next";
import { getDb, normalizeDocument } from "@/lib/mongo";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const db = await getDb();

  if (req.method === "GET") {
    const order = req.query.order as string | undefined;

    if (!db) {
      return res.status(200).json([]);
    }

    const coll = db.collection("subjects");
    const cursor = coll.find({});
    if (order) cursor.sort({ [order]: 1 });
    const items = (await cursor.toArray())
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
      name: body.name ?? "Untitled subject",
      icon: body.icon ?? "book-open",
      sort_order: Number(body.sort_order ?? 99),
      created_at: body.created_at ?? now,
    };

    const coll = db.collection("subjects");
    await coll.insertOne({ ...item });
    const stored = await coll.findOne({ id: item.id });
    return res.status(201).json(normalizeDocument(stored));
  }

  return res.status(405).end();
}
