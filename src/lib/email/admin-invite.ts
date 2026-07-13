import "server-only";
import { sendMail } from "@/lib/email/mailer";

/**
 * Sent when an admin invites a teammate. Delivery is best-effort (SMTP may be
 * unconfigured) — the invite URL is also returned to the inviter so they can
 * share it manually.
 */
export async function sendAdminInviteEmail(params: {
  to: string;
  invitedBy: string;
  inviteUrl: string;
}): Promise<boolean> {
  const { to, invitedBy, inviteUrl } = params;
  const html = `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#0E1012">
  <h1 style="font-size:22px;margin:0 0 16px">You've been invited to the 4gadgets admin</h1>
  <p style="font-size:15px;line-height:1.5">${invitedBy} has invited you to help manage the 4gadgets store. Set your password to activate your account:</p>
  <p style="margin:24px 0"><a href="${inviteUrl}" style="background:#1eb16d;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;display:inline-block">Set your password</a></p>
  <p style="font-size:13px;color:#555C67">Or paste this link into your browser:<br>${inviteUrl}</p>
  <p style="font-size:13px;color:#555C67">This link expires in 3 days. If you weren't expecting it, you can ignore this email.</p>
  <p style="margin-top:32px;font-size:12px;color:#555C67">4gadgets — Duke House, Perry Road, Harlow, Essex, CM18 7ND</p>
</div>`;

  const text = `${invitedBy} invited you to the 4gadgets admin.\n\nSet your password: ${inviteUrl}\n\nThis link expires in 3 days.`;

  return sendMail({ to, subject: "You've been invited to the 4gadgets admin", html, text });
}
