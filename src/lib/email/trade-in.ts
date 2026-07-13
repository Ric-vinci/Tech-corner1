import "server-only";
import { sendMail } from "@/lib/email/mailer";

const money = (value: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(value);

const DEFAULT_SHIPPING_INSTRUCTIONS = `Pack your device securely, include a note with your reference {{submissionId}}, and post it to:

4gadgets Trade-In
Duke House, Perry Road
Harlow, Essex, CM18 7ND

We'll send a freepost pack, or you can print a pre-paid label from your account.`;

/** Shipping instructions are overridable via env until the Settings admin lands. */
function shippingInstructions(submissionId: string): string {
  const template = process.env.TRADE_IN_SHIPPING_INSTRUCTIONS ?? DEFAULT_SHIPPING_INSTRUCTIONS;
  return template.replaceAll("{{submissionId}}", submissionId);
}

function layout(heading: string, bodyHtml: string): string {
  return `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#0E1012">
  <h1 style="font-size:22px;margin:0 0 16px">${heading}</h1>
  ${bodyHtml}
  <p style="margin-top:32px;font-size:12px;color:#555C67">4gadgets — Duke House, Perry Road, Harlow, Essex, CM18 7ND</p>
</div>`;
}

export type TradeInEmailItem = {
  id: string;
  productName: string;
  price: number;
  condition: string;
  paymentMethod: string;
};

/**
 * Sent right after checkout: confirms the trade-in and tells the customer how
 * to post the device.
 */
export async function sendTradeInConfirmationEmail(params: {
  to: string;
  customerName: string;
  items: TradeInEmailItem[];
}): Promise<boolean> {
  const { to, customerName, items } = params;
  const total = items.reduce((sum, item) => sum + item.price, 0);
  const reference = items[0]?.id ?? "";

  const rows = items
    .map(
      (item) =>
        `<tr><td style="padding:6px 0">${item.productName}<br><span style="color:#555C67;font-size:12px">${item.condition} — payment by ${item.paymentMethod}</span></td>` +
        `<td align="right" style="padding:6px 0;font-weight:600">${money(item.price)}</td></tr>`,
    )
    .join("");

  const instructions = shippingInstructions(reference);

  const html = layout(
    "Trade In Confirmed!",
    `<p>Hi ${customerName || "there"}, thanks for trading in with us.</p>
     <table style="width:100%;border-collapse:collapse">${rows}
       <tr><td style="border-top:1px solid #D5D7E3;padding-top:10px">Total</td>
       <td align="right" style="border-top:1px solid #D5D7E3;padding-top:10px;font-weight:700">${money(total)}</td></tr>
     </table>
     <p>The ${money(total)} will be sent to your account once we've received and inspected your device.</p>
     <h2 style="font-size:16px;margin-top:28px">Where to post your device</h2>
     <pre style="white-space:pre-wrap;font-family:inherit;background:#F7F7FB;padding:14px;border-radius:8px">${instructions}</pre>`,
  );

  const text = `Trade In Confirmed!\n\n${items
    .map((item) => `${item.productName} — ${money(item.price)} (${item.condition}, ${item.paymentMethod})`)
    .join("\n")}\n\nTotal: ${money(total)}\n\nWhere to post your device:\n${instructions}`;

  return sendMail({ to, subject: "Your 4gadgets trade-in is confirmed", html, text });
}

/** Sent when a return pack / freepost label is on its way (awaiting_shipment). */
export async function sendTradeInReturnPackEmail(params: {
  to: string;
  customerName: string;
  productName: string;
}): Promise<boolean> {
  const { to, customerName, productName } = params;
  const html = layout(
    "Your return pack is on its way",
    `<p>Hi ${customerName || "there"}, we're sending a freepost pack for your <strong>${productName}</strong>.</p>
     <p>When it arrives, pop your device inside and drop it in the post. Prefer not to wait? Print a pre-paid label from your account.</p>`,
  );
  const text = `Your return pack is on its way.\n\nWe're sending a freepost pack for your ${productName}. When it arrives, post your device back to us.`;
  return sendMail({ to, subject: "Your 4gadgets return pack is on its way", html, text });
}

/** Sent when the device arrives at the warehouse (received). */
export async function sendTradeInReceivedEmail(params: {
  to: string;
  customerName: string;
  productName: string;
}): Promise<boolean> {
  const { to, customerName, productName } = params;
  const html = layout(
    "We've received your device",
    `<p>Hi ${customerName || "there"}, your <strong>${productName}</strong> has arrived at our warehouse.</p>
     <p>Our team will now inspect it to confirm its condition. We'll email you again as soon as that's done — usually within a couple of working days.</p>`,
  );
  const text = `We've received your device.\n\nYour ${productName} has arrived. We'll inspect it and email you again — usually within a couple of working days.`;
  return sendMail({ to, subject: "We've received your 4gadgets trade-in", html, text });
}

/** Sent when the offer changes after inspection (revised_offer). */
export async function sendTradeInRevisedOfferEmail(params: {
  to: string;
  customerName: string;
  productName: string;
  price: number;
  reason?: string | null;
}): Promise<boolean> {
  const { to, customerName, productName, price, reason } = params;
  const html = layout(
    "We've revised your offer",
    `<p>Hi ${customerName || "there"}, after inspecting your <strong>${productName}</strong> we've revised our offer to <strong>${money(price)}</strong>.</p>
     ${reason ? `<p style="padding:12px;background:#F7F7FB;border-radius:8px">${reason}</p>` : ""}
     <p>Sign in to your account to accept the new offer or ask for your device back.</p>`,
  );
  const text = `We've revised your offer.\n\nAfter inspecting your ${productName}, our revised offer is ${money(price)}.${reason ? `\n\n${reason}` : ""}\n\nSign in to accept or request your device back.`;
  return sendMail({ to, subject: "Your revised 4gadgets trade-in offer", html, text });
}

/** Sent when a device is rejected. */
export async function sendTradeInRejectedEmail(params: {
  to: string;
  customerName: string;
  productName: string;
  reason?: string | null;
}): Promise<boolean> {
  const { to, customerName, productName, reason } = params;
  const html = layout(
    "About your trade-in",
    `<p>Hi ${customerName || "there"}, unfortunately we weren't able to accept your <strong>${productName}</strong>.</p>
     ${reason ? `<p style="padding:12px;background:#F7F7FB;border-radius:8px">${reason}</p>` : ""}
     <p>We'll return your device to you free of charge. If you have any questions, just reply to this email.</p>`,
  );
  const text = `About your trade-in.\n\nUnfortunately we couldn't accept your ${productName}.${reason ? `\n\n${reason}` : ""}\n\nWe'll return your device free of charge.`;
  return sendMail({ to, subject: "About your 4gadgets trade-in", html, text });
}

/** Sent when an admin accepts the device after inspection. */
export async function sendTradeInAcceptedEmail(params: {
  to: string;
  customerName: string;
  productName: string;
  price: number;
  paymentMethod: string;
}): Promise<boolean> {
  const { to, customerName, productName, price, paymentMethod } = params;

  const html = layout(
    "Your device has been accepted",
    `<p>Hi ${customerName || "there"}, good news — we've inspected your <strong>${productName}</strong> and accepted it.</p>
     <p>We'll send <strong>${money(price)}</strong> by ${paymentMethod}. Payments usually take about 2 days to process.</p>`,
  );
  const text = `Your device has been accepted.\n\n${productName}\nWe'll send ${money(price)} by ${paymentMethod}. Payments usually take about 2 days.`;

  return sendMail({ to, subject: "Your 4gadgets trade-in was accepted", html, text });
}

/** Sent when an admin marks the submission as paid. */
export async function sendTradeInPaidEmail(params: {
  to: string;
  customerName: string;
  productName: string;
  price: number;
  paymentMethod: string;
  reference?: string | null;
  /** Optional note the staff member typed when issuing the payout. */
  message?: string | null;
  /** Gift card rail only — Shopify reveals the code exactly once. */
  giftCardCode?: string | null;
  /** ISO date the payout was issued; defaults to now. */
  paidAt?: string | null;
}): Promise<boolean> {
  const { to, customerName, productName, price, paymentMethod, reference, message, giftCardCode, paidAt } = params;

  const paidDate = new Date(paidAt ?? Date.now()).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const giftCardHtml = giftCardCode
    ? `<div style="margin:20px 0;padding:16px;background:#EAF9F2;border-radius:8px;text-align:center">
         <p style="margin:0 0 6px;color:#555C67;font-size:12px">Your gift card code</p>
         <p style="margin:0;font-size:20px;font-weight:700;letter-spacing:2px">${giftCardCode}</p>
       </div>
       <p>Enter this code at checkout to spend your ${money(price)} store credit.</p>`
    : `<p>We've sent <strong>${money(price)}</strong> by ${paymentMethod}.</p>`;

  const html = layout(
    giftCardCode ? "Your store credit is ready" : "You've been paid",
    `<p>Hi ${customerName || "there"}, thanks for trading in your <strong>${productName}</strong>.</p>
     ${giftCardHtml}
     <p style="color:#555C67">Payment date: ${paidDate}</p>
     ${reference ? `<p style="color:#555C67">Payment reference: ${reference}</p>` : ""}
     ${message ? `<p style="padding:12px;background:#F7F7FB;border-radius:8px">${message}</p>` : ""}
     <p>Thanks for trading in with 4gadgets.</p>`,
  );

  const text = [
    giftCardCode ? "Your store credit is ready." : "You've been paid.",
    "",
    giftCardCode
      ? `Gift card code: ${giftCardCode}\nWorth ${money(price)} for your ${productName}.`
      : `${money(price)} sent for ${productName} by ${paymentMethod}.`,
    `Payment date: ${paidDate}`,
    reference ? `Reference: ${reference}` : "",
    message ? `\n${message}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return sendMail({
    to,
    subject: giftCardCode ? "Your 4gadgets store credit" : "Your 4gadgets payment is on its way",
    html,
    text,
  });
}
