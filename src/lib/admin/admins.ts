import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { hashPassword, verifyPassword } from "@/lib/customer/password";
import { getAdminEmail } from "./config";

/**
 * Extra admins invited by email. The env ADMIN_EMAIL is the built-in owner and
 * is NOT stored here — these are the additional accounts. Invite tokens are
 * HMAC'd (never stored in plaintext); passwords use the shared scrypt hasher.
 */

const INVITE_TTL_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

function inviteSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || process.env.GIFT_CARD_HASH_SECRET || "tc3-admin-invite-fallback-secret";
}

export function hashInviteToken(token: string): string {
  return createHmac("sha256", inviteSecret()).update(token).digest("hex");
}

export type AdminUser = {
  id: string;
  email: string;
  status: "invited" | "active";
  invited_by: string | null;
  invite_expires_at: string | null;
  accepted_at: string | null;
  created_at: string;
};

const COLUMNS = "id,email,status,invited_by,invite_expires_at,accepted_at,created_at";

/** All invited/active admins (does not include the env owner). */
export async function listAdminUsers(): Promise<AdminUser[]> {
  const { data } = await getSupabaseAdmin()
    .from("admin_users")
    .select(COLUMNS)
    .order("created_at", { ascending: true });
  return (data ?? []) as AdminUser[];
}

export type InviteResult =
  | { ok: true; inviteUrl: string; email: string }
  | { ok: false; error: string };

/**
 * Create (or re-issue) an invite for `email`. Returns the accept URL so the
 * caller can email it — and surface it even when SMTP isn't configured.
 */
export async function createAdminInvite(email: string, invitedBy: string, origin: string): Promise<InviteResult> {
  const normalised = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalised)) {
    return { ok: false, error: "Enter a valid email address." };
  }
  if (normalised === getAdminEmail()) {
    return { ok: false, error: "That is already the owner admin account." };
  }

  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase.from("admin_users").select("id,status").eq("email", normalised).maybeSingle();
  if (existing && existing.status === "active") {
    return { ok: false, error: "That admin already exists." };
  }

  const token = randomBytes(32).toString("base64url");
  const row = {
    email: normalised,
    invite_token_hash: hashInviteToken(token),
    invite_expires_at: new Date(Date.now() + INVITE_TTL_MS).toISOString(),
    invited_by: invitedBy,
    status: "invited" as const,
    password_hash: null,
  };

  const { error } = existing
    ? await supabase.from("admin_users").update(row).eq("id", existing.id)
    : await supabase.from("admin_users").insert(row);
  if (error) return { ok: false, error: error.message };

  const inviteUrl = `${origin}/admin/invite/accept?email=${encodeURIComponent(normalised)}&token=${token}`;
  return { ok: true, inviteUrl, email: normalised };
}

/** Verify an invite and set the admin's password. Returns their email on success. */
export async function acceptAdminInvite(email: string, token: string, password: string): Promise<{ ok: true; email: string } | { ok: false; error: string }> {
  const normalised = email.trim().toLowerCase();
  if (!password || password.length < 8) {
    return { ok: false, error: "Choose a password of at least 8 characters." };
  }

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("admin_users")
    .select("id,invite_token_hash,invite_expires_at,status")
    .eq("email", normalised)
    .maybeSingle();

  if (!data || !data.invite_token_hash) {
    return { ok: false, error: "This invite is no longer valid." };
  }
  if (data.invite_expires_at && Date.now() > new Date(data.invite_expires_at).getTime()) {
    return { ok: false, error: "This invite has expired. Ask an admin to re-send it." };
  }

  const expected = Buffer.from(data.invite_token_hash);
  const actual = Buffer.from(hashInviteToken(token));
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return { ok: false, error: "This invite link is invalid." };
  }

  const { error } = await supabase
    .from("admin_users")
    .update({
      password_hash: hashPassword(password),
      status: "active",
      accepted_at: new Date().toISOString(),
      invite_token_hash: null,
      invite_expires_at: null,
    })
    .eq("id", data.id);
  if (error) return { ok: false, error: error.message };

  return { ok: true, email: normalised };
}

/** Login check for a DB admin: returns the email if the password matches an active admin. */
export async function verifyAdminCredentials(email: string, password: string): Promise<string | null> {
  const normalised = email.trim().toLowerCase();
  const { data } = await getSupabaseAdmin()
    .from("admin_users")
    .select("email,password_hash,status")
    .eq("email", normalised)
    .maybeSingle();
  if (!data || data.status !== "active" || !data.password_hash) return null;
  return verifyPassword(password, data.password_hash) ? data.email : null;
}

export async function revokeAdminUser(id: string): Promise<boolean> {
  const { error } = await getSupabaseAdmin().from("admin_users").delete().eq("id", id);
  return !error;
}
