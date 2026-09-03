import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cookie from "cookie";

const JWT_SECRET = process.env.JWT_SECRET || "dev-only-insecure-secret-change-me";
const COOKIE_NAME = "samplefm_session";
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export function hashPassword(plainTextPassword) {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(plainTextPassword, salt);
}

export function verifyPassword(plainTextPassword, passwordHash) {
  return bcrypt.compareSync(plainTextPassword, passwordHash);
}

export function signSessionToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL_SECONDS });
}

export function verifySessionToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export function setSessionCookie(res, token) {
  const serialized = cookie.serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: TOKEN_TTL_SECONDS,
    path: "/",
  });
  res.setHeader("Set-Cookie", serialized);
}

export function clearSessionCookie(res) {
  const serialized = cookie.serialize(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: -1,
    path: "/",
  });
  res.setHeader("Set-Cookie", serialized);
}

export function getSessionFromRequest(req) {
  const rawCookies = req.headers.cookie || "";
  const parsed = cookie.parse(rawCookies);
  const token = parsed[COOKIE_NAME];
  if (!token) return null;
  return verifySessionToken(token);
}

export function isValidEmail(email) {
  if (typeof email !== "string") return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Password reset tokens are deliberately a DIFFERENT shape from session
// tokens (a "purpose" claim) and much shorter-lived, so a leaked/old reset
// link can never be replayed as a login session, and a session token can
// never be used to reset a password.
const RESET_TOKEN_TTL_SECONDS = 60 * 30; // 30 minutes

export function signPasswordResetToken({ userId, email }) {
  return jwt.sign({ userId, email, purpose: "password_reset" }, JWT_SECRET, {
    expiresIn: RESET_TOKEN_TTL_SECONDS,
  });
}

export function verifyPasswordResetToken(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (!payload || payload.purpose !== "password_reset") return null;
    return payload;
  } catch (err) {
    return null;
  }
}

// Same pattern as the password reset token — a distinct "purpose" claim so
// this can never be replayed as a session token or a password reset token.
// Longer-lived than the reset token since there's no security-sensitive
// action behind it, just confirming the address is real.
const VERIFY_TOKEN_TTL_SECONDS = 60 * 60 * 24; // 24 hours

export function signEmailVerificationToken({ userId, email }) {
  return jwt.sign({ userId, email, purpose: "email_verify" }, JWT_SECRET, {
    expiresIn: VERIFY_TOKEN_TTL_SECONDS,
  });
}

export function verifyEmailVerificationToken(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (!payload || payload.purpose !== "email_verify") return null;
    return payload;
  } catch (err) {
    return null;
  }
}

export const AUTH_COOKIE_NAME = COOKIE_NAME;
