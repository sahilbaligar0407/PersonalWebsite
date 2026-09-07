// Self-owned auth: bcrypt password hashing + JWT in an httpOnly cookie.
// Replaces Supabase Auth.
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const COOKIE_NAME = "smartcal_token";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// In production JWT_SECRET must be set (Railway env). Fall back only for local dev.
const JWT_SECRET = process.env.JWT_SECRET || "dev-insecure-secret-change-me";
if (!process.env.JWT_SECRET) {
  console.warn("[auth] JWT_SECRET not set — using an insecure dev fallback.");
}

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SEVEN_DAYS_MS,
    path: "/",
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

// Reads the token from the cookie and attaches req.user = { id, email } if valid.
export function readUser(req) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return { id: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

// Middleware guarding routes that require a logged-in user.
export function requireAuth(req, res, next) {
  const user = readUser(req);
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  req.user = user;
  next();
}
