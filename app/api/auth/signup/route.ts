import { NextResponse } from "next/server";

import {
  getSessionCookieOptions,
  hashPassword,
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
    const name = typeof body?.name === "string" ? body.name.trim() : "";

    if (!email || !password || password.length < 6) {
      return NextResponse.json(
        {
          error:
            "Email and password are required. Password must be at least 6 characters.",
        },
        { status: 400 },
      );
    }

    await connectDB();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({
      email,
      passwordHash,
      name: name || undefined,
    });

    const token = signSessionToken(String(user._id));
    const response = NextResponse.json(
      {
        user: {
          id: String(user._id),
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 },
    );

    response.cookies.set("session", token, getSessionCookieOptions());
    return response;
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Unable to create account." },
      { status: 500 },
    );
  }
}
