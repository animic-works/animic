import { Buffer } from "node:buffer";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

import { env } from "cloudflare:workers";
import {
  deleteCookie,
  getCookie,
  setCookie,
  setResponseHeader,
} from "@tanstack/react-start/server";

const sessionMs = 12 * 60 * 60_000;
const minimumPasswordLength = 12;

function cookie() {
  const secure = new URL(env.BETTER_AUTH_URL).protocol === "https:";
  return {
    name: secure ? "__Host-animic-admin" : "animic-admin",
    options: { secure, httpOnly: true, sameSite: "strict", path: "/" } as const,
  };
}

function password() {
  const value = env.ADMIN_PASSWORD ?? "";
  if (value.length >= minimumPasswordLength) return value;
  console.error(`ADMIN_PASSWORDに${minimumPasswordLength}文字以上のパスワードを設定してください。`);
  return null;
}

function equals(a: Buffer, b: Buffer) {
  return a.byteLength === b.byteLength && timingSafeEqual(a, b);
}

// パスワードを変えると、発行済みのセッションも使えなくなる。
function sign(expiresAt: number, current: string) {
  return createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update(`admin:${expiresAt}:${current}`)
    .digest();
}

export function verifyAdminPassword(input: string) {
  const current = password();
  if (!current) return false;
  return equals(
    createHash("sha256").update(input).digest(),
    createHash("sha256").update(current).digest(),
  );
}

export function startAdminSession() {
  const current = password();
  if (!current) throw new Error("管理画面のパスワードが設定されていません。");
  const expiresAt = Date.now() + sessionMs;
  const { name, options } = cookie();
  setCookie(name, `${expiresAt}.${sign(expiresAt, current).toString("hex")}`, {
    ...options,
    maxAge: sessionMs / 1000,
  });
}

export function endAdminSession() {
  const { name, options } = cookie();
  deleteCookie(name, options);
}

export function isAdmin() {
  const current = password();
  const match = /^(\d+)\.([0-9a-f]{64})$/.exec(getCookie(cookie().name) ?? "");
  if (!current || !match?.[1] || !match[2]) return false;
  const expiresAt = Number(match[1]);
  return expiresAt > Date.now() && equals(Buffer.from(match[2], "hex"), sign(expiresAt, current));
}

export function requireAdmin() {
  setResponseHeader("Cache-Control", "private, no-store");
  if (!isAdmin()) throw new Error("管理画面のパスワードでログインしてください。");
}
