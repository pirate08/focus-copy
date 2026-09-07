import type { NextApiRequest, NextApiResponse } from "next";
import { getDb, normalizeDocument } from "@/lib/mongo";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { id } = req.query;
  if (!id || Array.isArray(id)) return res.status(400).end();

  if (req.method === "PUT") {
    const db = await getDb();
    if (!db) {
      return res.status(503).json({ message: "MongoDB is not configured" });
    }

    const body = req.body ?? {};
    const coll = db.collection("subjects");
    await coll.updateOne({ id }, { $set: body });
    const item = normalizeDocument(await coll.findOne({ id }));
    if (!item) return res.status(404).json({ message: "Subject not found" });
    return res.status(200).json(item);
  }

  return res.status(405).end();
}
