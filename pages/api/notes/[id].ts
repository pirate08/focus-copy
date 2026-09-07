import type { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "@/lib/mongo";
import { ObjectId } from "mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { id } = req.query;
  if (!id || Array.isArray(id)) return res.status(400).end();
  const db = await getDb();
  const coll = db.collection("notes");
  if (req.method === "PUT") {
    const body = req.body;
    await coll.updateOne({ _id: new ObjectId(id) }, { $set: body });
    const item = await coll.findOne({ _id: new ObjectId(id) });
    return res.status(200).json(item);
  }
  return res.status(405).end();
}
