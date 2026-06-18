import { NextRequest, NextResponse } from "next/server";
import { site } from "@/lib/site";

export const runtime = "nodejs";

/**
 * Creates a Stripe Checkout Session via the Stripe REST API (no SDK dependency).
 * Price is built inline at $1,000 - no Stripe dashboard product needed.
 * If STRIPE_SECRET_KEY is unset, returns 503 so the UI can show a graceful
 * "reserve by application" fallback instead of breaking.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const productId = process.env.STRIPE_PRODUCT_ID;

  if (!secret) {
    return NextResponse.json(
      {
        error: "online_checkout_unavailable",
        message:
          "Online checkout isn't switched on yet. Apply with the interest form and we'll send you a secure payment link.",
      },
      { status: 503 },
    );
  }

  const origin =
    req.headers.get("origin") ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    site.url;

  // Stripe expects application/x-www-form-urlencoded with bracketed keys.
  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("allow_promotion_codes", "true");
  params.set("success_url", `${origin}/register?status=success`);
  params.set("cancel_url", `${origin}/register?status=cancelled`);
  params.set("line_items[0][quantity]", "1");
  params.set("line_items[0][price_data][currency]", site.price.currency);
  params.set(
    "line_items[0][price_data][unit_amount]",
    String(site.price.cents),
  );
  if (productId) {
    params.set("line_items[0][price_data][product]", productId);
  } else {
    params.set(
      "line_items[0][price_data][product_data][name]",
      `${site.name} - ${site.cohort.label} Seat`,
    );
    params.set(
      "line_items[0][price_data][product_data][description]",
      `Two-day in-person AI workshop in ${site.cohort.location} (${site.cohort.season}). ${site.price.label}.`,
    );
  }
  params.set("billing_address_collection", "required");
  params.set("phone_number_collection[enabled]", "true");
  params.set("metadata[program]", "founding-cohort");

  try {
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const session = await res.json();
    if (!res.ok) {
      console.error("[checkout] Stripe error:", session);
      return NextResponse.json(
        {
          error: "stripe_error",
          message:
            "We couldn't start checkout just now. Please try again or apply with the interest form.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[checkout] request failed:", err);
    return NextResponse.json(
      {
        error: "network_error",
        message: "Network hiccup starting checkout. Please try again.",
      },
      { status: 502 },
    );
  }
}
