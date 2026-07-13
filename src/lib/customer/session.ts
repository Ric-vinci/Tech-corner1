import { cookies } from "next/headers";
import {
  createCustomerSessionToken,
  verifyCustomerSessionToken,
  type SessionPayload,
} from "./session-token";

const COOKIE_NAME = "customer_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export { createCustomerSessionToken, verifyCustomerSessionToken, type SessionPayload };

export async function setCustomerSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearCustomerSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function getCustomerSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyCustomerSessionToken(token);
}

export async function requireCustomerSession(): Promise<SessionPayload> {
  const session = await getCustomerSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}
