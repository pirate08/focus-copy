import type { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "@/lib/mongo";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const db = await getDb();
  const coll = db.collection("subjects");
  if (req.method === "GET") {
    const order = req.query.order as string | undefined;
    const cursor = coll.find({});
    if (order) cursor.sort({ [order]: 1 });
    const items = await cursor.toArray();
    return res.status(200).json(items);
  }
  if (req.method === "POST") {
    const body = req.body;
    const now = new Date().toISOString();
    const insertRes = await coll.insertOne({ ...body, created_at: now });
    const item = await coll.findOne({ _id: insertRes.insertedId });
    return res.status(201).json(item);
  }
  return res.status(405).end();
}
