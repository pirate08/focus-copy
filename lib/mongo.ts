import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is not defined in environment");

let client: MongoClient | null = null;

export async function getDb() {
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
