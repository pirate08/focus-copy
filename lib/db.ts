import mongoose from "mongoose";

declare global {
  var mongooseCache:
    | {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

const cached =
  global.mongooseCache ??
  (global.mongooseCache = {
    conn: null,
    promise: null,
  });

export async function connectDB() {
  const uri = process.env.MONGODB_URI ?? process.env.MONGO_URI;

  if (!uri) {
    throw new Error("Please set MONGODB_URI in your .env.local file.");
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri);
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
}

export default connectDB;
