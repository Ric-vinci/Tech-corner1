import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

/**
 * SMTP is optional. When it isn't configured the app still works — emails are
 * skipped and logged instead of throwing, so a trade-in never fails just
 * because mail delivery isn't set up yet.
 */
export function isMailerConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT ?? 587);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    });
  }
  return transporter;
}

export type MailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

/** Returns true when the message was handed to SMTP, false when skipped. */
export async function sendMail(message: MailMessage): Promise<boolean> {
  if (!isMailerConfigured()) {
    console.warn(`[email] SMTP not configured — skipped "${message.subject}" to ${message.to}`);
    return false;
  }

  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER!;
  await getTransporter().sendMail({
    from,
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
  return true;
}
