import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { savePayment, type PaymentRecord } from "@/lib/payments";
import { sendNotificationEmail } from "@/lib/notifications";
import { site } from "@/lib/site";

export const runtime = "nodejs";

type StripeEvent = {
  id: string;
  type: string;
  livemode?: boolean;
  data?: {
    object?: StripeCheckoutSession;
  };
};

type StripeCheckoutSession = {
  id: string;
  object?: string;
  payment_intent?: string | null;
  customer_details?: {
    email?: string | null;
    name?: string | null;
  } | null;
  customer_email?: string | null;
  amount_subtotal?: number | null;
  amount_total?: number | null;
  currency?: string | null;
  payment_status?: string | null;
  status?: string | null;
  url?: string | null;
  created?: number | null;
  total_details?: {
    amount_discount?: number | null;
  } | null;
};

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "stripe_webhook_not_configured" },
      { status: 503 },
    );
  }

  const signature = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  if (!signature || !verifyStripeSignature(rawBody, signature, webhookSecret)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(rawBody) as StripeEvent;
  } catch {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data?.object;
  if (!session?.id) {
    return NextResponse.json({ error: "missing_session" }, { status: 400 });
  }

  const payment = createPaymentRecord(event, session);
  const result = await savePayment(payment);

  if (!result.duplicate) {
    await sendPaymentEmail(payment);
  }

  return NextResponse.json({
    received: true,
    logged: result.saved,
    duplicate: result.duplicate,
  });
}

function createPaymentRecord(
  event: StripeEvent,
  session: StripeCheckoutSession,
): PaymentRecord {
  return {
    eventId: event.id,
    sessionId: session.id,
    paymentIntent: session.payment_intent || undefined,
    customerEmail:
      session.customer_details?.email || session.customer_email || undefined,
    customerName: session.customer_details?.name || undefined,
    amountSubtotal: numberOrUndefined(session.amount_subtotal),
    amountDiscount: numberOrUndefined(session.total_details?.amount_discount),
    amountTotal: numberOrUndefined(session.amount_total),
    currency: session.currency || undefined,
    paymentStatus: session.payment_status || undefined,
    status: session.status || undefined,
    livemode: event.livemode,
    checkoutUrl: session.url || undefined,
    createdAt: session.created
      ? new Date(session.created * 1000).toISOString()
      : undefined,
    receivedAt: new Date().toISOString(),
  };
}

async function sendPaymentEmail(payment: PaymentRecord) {
  const total = formatMoney(payment.amountTotal, payment.currency);
  const discount = formatMoney(payment.amountDiscount, payment.currency);
  const subtotal = formatMoney(payment.amountSubtotal, payment.currency);

  const text = [
    "Stripe checkout completed",
    "",
    `Program:        ${site.name} - ${site.cohort.label}`,
    `Customer:       ${payment.customerName || "(not given)"}`,
    `Email:          ${payment.customerEmail || "(not given)"}`,
    `Subtotal:       ${subtotal}`,
    `Discount:       ${discount}`,
    `Total paid:     ${total}`,
    `Payment status: ${payment.paymentStatus || "(unknown)"}`,
    `Session status: ${payment.status || "(unknown)"}`,
    `Live mode:      ${payment.livemode ? "yes" : "no"}`,
    "",
    `Checkout ID:    ${payment.sessionId}`,
    `PaymentIntent:  ${payment.paymentIntent || "(none)"}`,
    `Event ID:       ${payment.eventId}`,
    `Received:       ${payment.receivedAt}`,
  ].join("\n");

  return sendNotificationEmail({
    subject: `Stripe payment completed: ${total}`,
    text,
    replyTo: payment.customerEmail,
    logPrefix: "[stripe-webhook]",
  });
}

function verifyStripeSignature(
  payload: string,
  signatureHeader: string,
  secret: string,
) {
  const values = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key, value];
    }),
  );
  const timestamp = values.t;
  const signature = values.v1;
  if (!timestamp || !signature) return false;

  const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(ageSeconds) || ageSeconds > 300) return false;

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`, "utf8")
    .digest("hex");

  return safeCompare(signature, expected);
}

function safeCompare(a: string, b: string) {
  const aBuffer = Buffer.from(a, "hex");
  const bBuffer = Buffer.from(b, "hex");
  if (aBuffer.byteLength !== bBuffer.byteLength) return false;
  return timingSafeEqual(aBuffer, bBuffer);
}

function formatMoney(cents?: number, currency = "usd") {
  if (typeof cents !== "number") return "(unknown)";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function numberOrUndefined(value?: number | null) {
  return typeof value === "number" ? value : undefined;
}
