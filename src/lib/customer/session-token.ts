import { createHmac, timingSafeEqual } from "crypto";

type SessionPayload = {
  customerId: string;
  email: string;
  exp: number;
};

const MAX_AGE_MS = 60 * 60 * 24 * 30 * 1000;

function getSecret(): string | null {
  return process.env.CUSTOMER_SESSION_SECRET?.trim() || process.env.ADMIN_SESSION_SECRET?.trim() || null;
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function createCustomerSessionToken(customerId: string, email: string): string | null {
  const secret = getSecret();
  if (!secret) return null;

  const payload: SessionPayload = {
    customerId,
    email: email.trim().toLowerCase(),
    exp: Date.now() + MAX_AGE_MS,
  };
  const payloadStr = JSON.stringify(payload);
  const signature = sign(payloadStr, secret);
  return Buffer.from(JSON.stringify({ payload: payloadStr, signature })).toString("base64url");
}

export function verifyCustomerSessionToken(token: string): SessionPayload | null {
  const secret = getSecret();
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
    if (!payload.customerId || !payload.email || !payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export type { SessionPayload };
