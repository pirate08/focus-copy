import bcrypt from "bcryptjs";
import jwt, { type JwtPayload } from "jsonwebtoken";
import type { NextRequest } from "next/server";

export const SESSION_COOKIE_NAME = "session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";

export function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export function comparePassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function signSessionToken(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifySessionToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload & { userId?: string };
  } catch {
    return null;
  }
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

function getCookieValueFromHeader(header: string | null, name: string) {
  if (!header) {
    return null;
  }

  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) {
      return decodeURIComponent(rest.join("="));
    }
  }

  return null;
}

export async function getSessionUser(req: NextRequest | Request) {
  const cookieHeader = req.headers.get("cookie");
  const tokenFromHeader = getCookieValueFromHeader(
    cookieHeader,
    SESSION_COOKIE_NAME,
  );
  const token =
    "cookies" in req
      ? (req.cookies.get(SESSION_COOKIE_NAME)?.value ?? tokenFromHeader)
      : tokenFromHeader;

  if (!token) {
    return null;
  }

  const payload = verifySessionToken(token);

  if (!payload?.userId) {
    return null;
  }

  return payload.userId;
}
