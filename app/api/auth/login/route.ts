import { NextResponse } from "next/server";

import {
  comparePassword,
  getSessionCookieOptions,
  signSessionToken,
} from "../../../../lib/auth";
import { connectDB } from "../../../../lib/db";
import User from "../../../../lib/models/User";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 },
      );
    }

    await connectDB();

    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }

    const token = signSessionToken(String(user._id));
    const response = NextResponse.json({
      user: {
        id: String(user._id),
        email: user.email,
        name: user.name,
      },
    });

    response.cookies.set("session", token, getSessionCookieOptions());
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Unable to log in." }, { status: 500 });
  }
}
