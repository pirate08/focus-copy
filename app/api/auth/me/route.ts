import { NextResponse } from "next/server";

import { getSessionUser } from "../../../../lib/auth";
import { connectDB } from "../../../../lib/db";
import User from "../../../../lib/models/User";

export async function GET(request: Request) {
  const userId = await getSessionUser(request);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const user = await User.findById(userId).lean();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      id: String(user._id),
      email: user.email,
      name: user.name,
    },
  });
}
