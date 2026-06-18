"use client";

import { useState } from "react";
import { site } from "@/lib/site";

type Status = "idle" | "loading" | "error";

export function CheckoutButton() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function startCheckout() {
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const json = await res.json();

      if (!res.ok || !json?.url) {
        throw new Error(json?.message || "Could not start checkout.");
      }

      window.location.href = json.url;
    } catch (err) {
      setStatus("error");
      setMessage(
        err instanceof Error
          ? err.message
          : "Could not start checkout. Please try again.",
      );
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={startCheckout}
        disabled={status === "loading"}
        className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? "Opening checkout..." : `Checkout - ${site.price.display}`}
      </button>
      <p className="mx-auto mt-2 max-w-[42ch] text-center text-xs leading-relaxed text-ink-500">
        Discount and scholarship codes can be entered on the Stripe checkout
        page.
      </p>
      {status === "error" && (
        <p className="mt-3 rounded-[3px] bg-rose-100 px-4 py-3 text-sm text-rose-700">
          {message}
        </p>
      )}
    </div>
  );
}
