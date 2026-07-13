import { createHmac, timingSafeEqual } from "crypto";
import { getAdminSessionSecret } from "./config";

type SessionPayload = {
  email: string;
  exp: number;
};

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function createAdminSessionToken(email: string): string | null {
  const secret = getAdminSessionSecret();
  if (!secret) return null;

  const payload: SessionPayload = {
    email: email.trim().toLowerCase(),
    exp: Date.now() + 60 * 60 * 24 * 7 * 1000,
  };
  const payloadStr = JSON.stringify(payload);
  const signature = sign(payloadStr, secret);
  return Buffer.from(JSON.stringify({ payload: payloadStr, signature })).toString("base64url");
}

export function verifyAdminSessionToken(token: string): SessionPayload | null {
  const secret = getAdminSessionSecret();
  if (!secret) return null;

  try {
    const decoded = JSON.parse(Buffer.from(token, "base64url").toString("utf8")) as {
      payload: string;
      signature: string;
    };
    const expected = sign(decoded.payload, secret);
    const a = Buffer.from(expected);
    const b = Buffer.from(decoded.signature);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    const payload = JSON.parse(decoded.payload) as SessionPayload;
    if (!payload.email || !payload.exp || Date.now() > payload.exp) return null;
    // A valid signature means WE issued this token at login (after verifying the
    // owner or a DB admin's credentials), so any signed email is a real admin.
    return payload;
  } catch {
    return null;
  }
}

export type { SessionPayload };
