import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URI ?? process.env.MONGODB_URI;

let client: MongoClient | null = null;

export function normalizeDocument<T extends Record<string, any>>(
  doc: T | null | undefined,
) {
  if (!doc) return null;

  const normalized = { ...doc } as Record<string, any>;
  if (!("id" in normalized) && "_id" in normalized) {
    normalized.id = normalized._id?.toString?.() ?? String(normalized._id);
  }
  delete normalized._id;

  return normalized as T & { id: string };
}

export async function getDb() {
  if (!uri) {
    return null;
  }

  if (!client) {
    client = new MongoClient(uri as string);
    await client.connect();
  }

  return client.db();
}

export async function closeDb() {
  if (client) {
    await client.close();
    client = null;
  }
}
