import { randomBytes } from "node:crypto";

import { connectToDatabase } from "@/lib/mongoose";
import { getAdminSessionModel } from "@/models/admin-session";

export const ADMIN_SESSION_COOKIE = "admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

/**
 * Mendapatkan string header Set-Cookie dengan parameter keamanan tinggi.
 * @param token Token sesi atau string kosong untuk menghapus cookie
 * @param isDelete Apakah ini instruksi untuk menghapus cookie
 */
export function getAdminCookieHeader(token: string, isDelete = false) {
  const maxAge = isDelete ? 0 : ADMIN_SESSION_MAX_AGE_SECONDS;
  const secure = process.env.NODE_ENV === "production" ? "Secure;" : ""; // Hanya kirim lewat HTTPS di produksi
  
  return `${ADMIN_SESSION_COOKIE}=${token}; HttpOnly; Path=/; SameSite=Strict; ${secure} Max-Age=${maxAge}`;
}

function getEnv(name: "ADMIN_USERNAME" | "ADMIN_PASSWORD") {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} environment variable.`);
  }

  return value;
}

export function validateAdminCredentials(username: string, password: string) {
  const expectedUsername = getEnv("ADMIN_USERNAME");
  const expectedPassword = getEnv("ADMIN_PASSWORD");

  return username === expectedUsername && password === expectedPassword;
}

function extractCookieToken(rawCookieHeader: string | null) {
  if (!rawCookieHeader) {
    return null;
  }

  const sessionPair = rawCookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${ADMIN_SESSION_COOKIE}=`));

  if (!sessionPair) {
    return null;
  }

  const token = sessionPair.slice(`${ADMIN_SESSION_COOKIE}=`.length).trim();
  return token || null;
}

export async function createAdminSession() {
  await connectToDatabase();
  const AdminSession = getAdminSessionModel();

  const token = randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_MAX_AGE_SECONDS * 1000);

  await AdminSession.create({ token, expiresAt });
  return token;
}

export async function isAdminSessionTokenValid(token: string | null) {
  if (!token) {
    return false;
  }

  await connectToDatabase();
  const AdminSession = getAdminSessionModel();
  const session = await AdminSession.findOne({
    token,
    expiresAt: { $gt: new Date() },
  })
    .select({ _id: 1 })
    .lean();

  return Boolean(session);
}

export async function isCookieTokenValid(rawCookieHeader: string | null) {
  const token = extractCookieToken(rawCookieHeader);
  return isAdminSessionTokenValid(token);
}

export async function revokeAdminSessionFromCookie(rawCookieHeader: string | null) {
  const token = extractCookieToken(rawCookieHeader);
  if (!token) {
    return;
  }

  await connectToDatabase();
  const AdminSession = getAdminSessionModel();
  await AdminSession.deleteOne({ token });
}
