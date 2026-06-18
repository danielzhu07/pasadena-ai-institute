"use client";

import { useRef, useState } from "react";
import { site } from "@/lib/site";

type Status = "idle" | "submitting" | "success" | "error";

const fieldClass =
  "mt-1.5 w-full rounded-[3px] border border-ink-200 bg-white px-4 py-3 text-ink-900 outline-none transition-colors duration-200 placeholder:text-ink-400 focus:border-accent focus:ring-1 focus:ring-accent";

const labelClass = "text-sm font-medium text-ink-800";

export function ApplicationForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    const form = e.currentTarget;

    try {
      // multipart so the resume file rides along
      const res = await fetch("/api/interest", {
        method: "POST",
        body: new FormData(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Something went wrong.");
      setStatus("success");
      setMessage(
        json?.message ||
          `Application received. We review on a rolling basis and you'll hear from us by ${site.cohort.dates.decisionsBy}, either way.`,
      );
      form.reset();
      setFileName("");
    } catch (err) {
      setStatus("error");
      setMessage(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please email us directly.",
      );
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-[4px] border border-ink-200 bg-surface p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M5 12.5l4 4 10-10"
              className="stroke-accent"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h3 className="mt-5 font-serif text-2xl font-normal tracking-tight text-ink-900">
          Application received
        </h3>
        <p className="mx-auto mt-3 max-w-md leading-relaxed text-ink-600">
          {message}
        </p>
        <button
          type="button"
          className="btn-ghost mt-6"
          onClick={() => setStatus("idle")}
        >
          Submit another application
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-[4px] border border-ink-200 bg-surface p-7 sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelClass}>
            Full name <span className="text-rose-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            required
            autoComplete="name"
            className={fieldClass}
            placeholder="Name"
          />
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>
            Email <span className="text-rose-500">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={fieldClass}
            placeholder="Email"
          />
        </div>
      </div>

      <div>
        <label htmlFor="company" className={labelClass}>
          Company / Role <span className="text-rose-500">*</span>
        </label>
        <input
          id="company"
          name="company"
          required
          autoComplete="organization"
          className={fieldClass}
          placeholder="Founder & CEO, Acme Co."
        />
      </div>

      <div>
        <label htmlFor="resume" className={labelClass}>
          Resume <span className="text-rose-500">*</span>
        </label>
        <input
          ref={fileRef}
          id="resume"
          name="resume"
          type="file"
          required
          accept=".pdf,.doc,.docx"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
          className="sr-only"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="mt-1.5 flex w-full items-center justify-between gap-4 rounded-[3px] border border-dashed border-ink-300 bg-white px-4 py-3 text-left transition-colors hover:border-accent"
        >
          <span className={fileName ? "text-ink-900" : "text-ink-400"}>
            {fileName || "Attach your resume (PDF or DOC)"}
          </span>
          <span className="shrink-0 text-sm font-medium text-accent">
            {fileName ? "Replace" : "Browse"}
          </span>
        </button>
        <p className="mt-1.5 max-w-[56ch] text-xs text-ink-500">
          PDF, DOC, or DOCX, up to 8&nbsp;MB.
        </p>
      </div>

      <div>
        <label htmlFor="linkedin" className={labelClass}>
          LinkedIn <span className="text-ink-500">(optional)</span>
        </label>
        <input
          id="linkedin"
          name="linkedin"
          type="url"
          className={fieldClass}
          placeholder="https://linkedin.com/in/you"
        />
      </div>

      <div>
        <label htmlFor="ambition" className={labelClass}>
          What do you want to walk out having built or learned?{" "}
          <span className="text-rose-500">*</span>
        </label>
        <textarea
          id="ambition"
          name="ambition"
          required
          rows={4}
          className={fieldClass}
          placeholder="The idea you want to build, the workflow you want to automate, or what you want to finally understand. A few sentences is plenty."
        />
      </div>

      <div>
        <label htmlFor="experience" className={labelClass}>
          Where are you with AI today?
        </label>
        <select
          id="experience"
          name="experience"
          className={fieldClass}
          defaultValue=""
        >
          <option value="">Choose one…</option>
          <option value="none">Never really used it</option>
          <option value="dabbled">Dabbled with ChatGPT a little</option>
          <option value="regular">Use it sometimes for work</option>
          <option value="comfortable">Comfortable, want to go deeper</option>
        </select>
      </div>

      {status === "error" && (
        <p className="rounded-[3px] bg-rose-100 px-4 py-3 text-sm text-rose-700">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "submitting" ? "Submitting…" : "Submit application"}
      </button>
      <p className="mx-auto max-w-[52ch] text-center text-xs text-ink-500">
        No payment with this application. If accepted, you&rsquo;ll receive
        checkout instructions and any discount or scholarship code.
      </p>
    </form>
  );
}
