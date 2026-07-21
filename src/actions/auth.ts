"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { createSessionToken, SESSION_COOKIE } from "@/lib/session";

export type LoginState = { error?: string } | undefined;

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get("password") || "");
  const encodedHash = process.env.AUTH_PASSWORD_HASH;

  if (!encodedHash) {
    return { error: "AUTH_PASSWORD_HASH is not configured on the server." };
  }
  if (!password) {
    return { error: "Enter your password." };
  }

  // AUTH_PASSWORD_HASH is stored base64-encoded — see scripts/hash-password.js
  // for why (raw bcrypt hashes contain `$`, which Next.js's .env loader mangles).
  const hash = Buffer.from(encodedHash, "base64").toString("utf8");
  const valid = await bcrypt.compare(password, hash);
  if (!valid) {
    return { error: "Incorrect password." };
  }

  const token = await createSessionToken();
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/dashboard");
}

export async function logout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}
