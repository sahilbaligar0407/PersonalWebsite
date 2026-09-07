// Self-owned auth: bcrypt password hashing + JWT in an httpOnly cookie.
// Replaces Supabase Auth.
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const COOKIE_NAME = "smartcal_token";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// The dev fallback below is committed to a PUBLIC repo, so anyone can read it.
// If it were ever used in production — a fresh service, a renamed variable, a
// preview environment — anyone could mint a token for any user id and read or
// change that account's calendar. Warning and carrying on is not good enough:
// refuse to boot instead, so the failure is loud and immediate.
if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error(
    "JWT_SECRET is not set. Refusing to start in production rather than sign sessions " +
      "with the public dev fallback.",
  );
}

const JWT_SECRET = process.env.JWT_SECRET || "dev-insecure-secret-change-me";
if (!process.env.JWT_SECRET) {
  console.warn("[auth] JWT_SECRET not set — using an insecure dev fallback (development only).");
}

// Scope the session cookie to the app's own path. It defaulted to "/", which
// sent it on every request to the parent domain, including pages that have
// nothing to do with this service.
const COOKIE_PATH = (process.env.APP_BASE_PATH || "").replace(/\/+$/, "") || "/";

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
    path: COOKIE_PATH,
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: COOKIE_PATH });
  // Sessions issued before the cookie was scoped live at "/" and would survive
  // a sign-out that only cleared the new path, leaving people apparently still
  // signed in. Clearing both is harmless once those have aged out.
  if (COOKIE_PATH !== "/") res.clearCookie(COOKIE_NAME, { path: "/" });
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
