import { NextRequest, NextResponse } from "next/server";
import {
  cleanFormString,
  createLead,
  MAX_RESUME_BYTES,
  notifyByEmail,
  safeFileName,
  saveLead,
  saveResume,
  sendApplicantConfirmation,
  validateApplication,
  type ApplicationInput,
} from "@/lib/applications";
import { appendLeadToSheet } from "@/lib/sheets";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";

  let input: ApplicationInput;

  if (contentType.includes("multipart/form-data")) {
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    input = {
      name: cleanFormString(form.get("name")),
      email: cleanFormString(form.get("email")),
      company: cleanFormString(form.get("company")),
      linkedin: cleanFormString(form.get("linkedin")),
      ambition: cleanFormString(form.get("ambition")),
      experience: cleanFormString(form.get("experience")),
    };

    const file = form.get("resume");
    if (file && typeof file !== "string" && file.size > 0) {
      if (file.size > MAX_RESUME_BYTES) {
        return NextResponse.json(
          { error: "That resume is over 4 MB. Please attach a smaller file." },
          { status: 400 },
        );
      }
      input.resume = {
        buffer: Buffer.from(await file.arrayBuffer()),
        originalName: safeFileName(file.name || "resume"),
      };
    }
  } else {
    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    input = {
      name: typeof body.name === "string" ? body.name.trim() : "",
      email: typeof body.email === "string" ? body.email.trim() : "",
      company: typeof body.company === "string" ? body.company.trim() : "",
      linkedin: typeof body.linkedin === "string" ? body.linkedin.trim() : "",
      ambition: typeof body.ambition === "string" ? body.ambition.trim() : "",
      experience:
        typeof body.experience === "string" ? body.experience.trim() : "",
    };
  }

  const validationError = validateApplication(input);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  let savedResume: string | undefined;
  if (input.resume) {
    try {
      savedResume = await saveResume(input.resume);
    } catch (err) {
      console.error("[interest] could not save resume:", err);
    }
  }

  const lead = createLead(input, savedResume);
  let savedLead = false;
  try {
    await saveLead(lead);
    savedLead = true;
  } catch (err) {
    console.error("[interest] could not write leads file:", err);
  }

  const resumePayload = input.resume
    ? {
        filename: input.resume.originalName || "resume",
        base64: input.resume.buffer.toString("base64"),
      }
    : undefined;

  const [emailed, loggedToSheet] = await Promise.all([
    notifyByEmail(lead, resumePayload),
    appendLeadToSheet(lead, resumePayload),
  ]);

  // On Vercel the leads-file write lands in ephemeral /tmp, so it is NOT a durable
  // record — only the email or the sheet survives a container recycle. Require one
  // of those in production; locally ./data is durable, so savedLead counts there.
  const persistedDurably =
    emailed || loggedToSheet || (!process.env.VERCEL && savedLead);
  if (!persistedDurably) {
    return NextResponse.json(
      {
        error:
          "We couldn't save your application just now. Please try again or email us directly.",
      },
      { status: 500 },
    );
  }

  if (!emailed && !loggedToSheet) {
    console.log("[interest] New application:", JSON.stringify(lead, null, 2));
  }

  // Await so the confirmation email actually flushes: on Vercel's serverless
  // runtime the instance is frozen once the response returns, which drops any
  // un-awaited in-flight fetch. sendApplicantConfirmation never throws.
  await sendApplicantConfirmation(lead).catch((err) =>
    console.error("[interest] applicant confirmation threw:", err),
  );

  return NextResponse.json({
    ok: true,
    message:
      "Application received. We review on a rolling basis and you'll hear from us in July.",
  });
}
