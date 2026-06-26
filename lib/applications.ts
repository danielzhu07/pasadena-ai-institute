import { promises as fs } from "fs";
import { readFileSync } from "fs";
import os from "os";
import path from "path";
import { getNotificationRecipients, sendNotificationEmail } from "@/lib/notifications";

// Read once at module load so every warm invocation skips the disk read
let _signatureB64: string | null = null;
function getSignatureB64(): string | null {
  if (_signatureB64 !== null) return _signatureB64;
  try {
    _signatureB64 = readFileSync(path.join(process.cwd(), "public", "email-signature.jpg")).toString("base64");
  } catch {
    _signatureB64 = "";
  }
  return _signatureB64 || null;
}

// Capped at 4 MB to stay under Vercel's ~4.5 MB serverless request-body limit.
// A larger multipart body is rejected with a 413 at the platform edge BEFORE this
// route runs, which would silently drop the lead (no email, no sheet row).
export const MAX_RESUME_BYTES = 4 * 1024 * 1024;

export type Lead = {
  name: string;
  email: string;
  company?: string;
  linkedin?: string;
  ambition?: string;
  experience?: string;
  resumeFile?: string;
  receivedAt: string;
};

export type ResumeUpload = {
  buffer: Buffer;
  originalName: string;
  storedName?: string;
};

export type ApplicationInput = {
  name: string;
  email: string;
  company: string;
  linkedin: string;
  ambition: string;
  experience: string;
  resume?: ResumeUpload;
};

export const EXPERIENCE_LABELS: Record<string, string> = {
  none: "Never really used it",
  dabbled: "Dabbled with ChatGPT or Claude a little",
  regular: "Use AI tools sometimes for work",
  comfortable: "Comfortable, want to go deeper",
};

const ALLOWED_RESUME_EXTENSIONS = new Set([".pdf", ".doc", ".docx"]);
// On Vercel (and most serverless hosts) the project filesystem is read-only and
// only the OS temp dir is writable. Writing there avoids EROFS noise, but it is
// ephemeral — production lead capture must go through Resend email. Locally we
// persist to ./data so leads survive between runs.
const DATA_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), "whistle-leads")
  : path.join(process.cwd(), "data");
const LEADS_FILE = path.join(DATA_DIR, "leads.json");
const RESUMES_DIR = path.join(DATA_DIR, "resumes");

let leadWriteQueue = Promise.resolve();

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function safeFileName(value: string) {
  return value.replace(/[^a-z0-9._-]+/gi, "_").slice(0, 80);
}

export function cleanFormString(value: FormDataEntryValue | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

export function validateApplication(input: ApplicationInput) {
  if (!input.name) return "Please tell us your name.";
  if (!isEmail(input.email)) return "Please enter a valid email address.";
  if (!input.company) return "Please tell us your company or role.";
  if (!input.ambition) {
    return "Please tell us what you want to walk out having built or learned.";
  }

  if (input.resume) {
    const extension = path.extname(input.resume.originalName).toLowerCase();
    if (!ALLOWED_RESUME_EXTENSIONS.has(extension)) {
      return "Please attach a PDF, DOC, or DOCX resume.";
    }
    if (input.resume.buffer.byteLength > MAX_RESUME_BYTES) {
      return "That resume is over 4 MB. Please attach a smaller file.";
    }
  }

  return null;
}

export function createLead(input: ApplicationInput, resumeFile?: string): Lead {
  return {
    name: input.name,
    email: input.email,
    company: input.company || undefined,
    linkedin: input.linkedin || undefined,
    ambition: input.ambition || undefined,
    experience: input.experience || undefined,
    resumeFile,
    receivedAt: new Date().toISOString(),
  };
}

export async function saveResume(upload: ResumeUpload) {
  await fs.mkdir(RESUMES_DIR, { recursive: true });
  const stamped = `${Date.now()}-${safeFileName(upload.originalName || "resume")}`;
  await fs.writeFile(path.join(RESUMES_DIR, stamped), upload.buffer);
  return stamped;
}

export async function saveLead(lead: Lead) {
  return enqueueLeadWrite(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const existing = await readLeads();
    existing.push(lead);

    const tempFile = path.join(
      DATA_DIR,
      `.leads.${process.pid}.${Date.now()}.tmp`,
    );
    await fs.writeFile(tempFile, JSON.stringify(existing, null, 2));
    await fs.rename(tempFile, LEADS_FILE);
  });
}

export async function sendApplicantConfirmation(lead: Lead) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const firstName = lead.name.split(" ")[0];

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://whistleworkshop.com";
  // Hidden unique token prevents Gmail from collapsing repeated test sends as "quoted text"
  const uid = `<!-- ${lead.receivedAt} -->`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Georgia,serif;">${uid}
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:48px 32px;">
    <tr><td>
      <p style="font-size:16px;line-height:1.6;color:#222;margin:0 0 18px 0;">Hi ${firstName},</p>
      <p style="font-size:16px;line-height:1.6;color:#222;margin:0 0 18px 0;">It's a good day. Your application to the founding cohort of the Pasadena AI Workshop just landed with us, and we're glad you're here.</p>
      <p style="font-size:16px;line-height:1.6;color:#222;margin:0 0 18px 0;">We read every application personally and review on a rolling basis. You'll hear from us in July.</p>
      <p style="font-size:16px;line-height:1.6;color:#222;margin:0 0 32px 0;">Should you have any questions in the meantime, please don't hesitate to contact Kevin at <a href="mailto:kexia@g.hmc.edu" style="color:#222;">kexia@g.hmc.edu</a>. We look forward to reading yours.</p>
      <p style="font-size:16px;line-height:1.6;color:#222;margin:0 0 4px 0;">Warmly,</p>
      <p style="font-size:16px;line-height:1.6;color:#222;margin:0 0 40px 0;">The Whistle Workshop Team</p>
      <img src="${siteUrl}/email-signature.jpg" alt="Whistle Workshop" width="480" style="display:block;max-width:100%;border-radius:4px;">
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    `Hi ${firstName},`,
    "",
    "It's a good day. Your application to the founding cohort of the Pasadena AI Workshop just landed with us, and we're glad you're here.",
    "",
    "We read every application personally and review on a rolling basis. You'll hear from us in July.",
    "",
    "Should you have any questions in the meantime, please don't hesitate to contact Kevin at kexia@g.hmc.edu. We look forward to reading yours.",
    "",
    "Warmly,",
    "The Whistle Workshop Team",
    "",
    "whistleworkshop.com",
  ].join("\n");

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Pasadena AI Workshop <${from}>`,
        to: [lead.email],
        subject: "Your application's in: Pasadena AI Workshop",
        html,
        text,
      }),
    });

    if (!res.ok) {
      console.error(`[interest] applicant confirmation error ${res.status}:`, await res.text());
      return false;
    }

    return true;
  } catch (err) {
    console.error("[interest] applicant confirmation failed:", err);
    return false;
  }
}

export async function notifyByEmail(
  lead: Lead,
  resume?: { filename: string; base64: string },
) {
  if (getNotificationRecipients().length === 0) return false;

  const expLabel = lead.experience
    ? EXPERIENCE_LABELS[lead.experience] ?? lead.experience
    : "(not given)";

  const text = [
    "New Pasadena AI Workshop Founding Cohort application",
    "",
    `Name:          ${lead.name}`,
    `Email:         ${lead.email}`,
    `Company/Role:  ${lead.company || "(not given)"}`,
    `LinkedIn:      ${lead.linkedin || "(not given)"}`,
    `AI experience: ${expLabel}`,
    `Resume:        ${lead.resumeFile ? "attached (" + lead.resumeFile + ")" : "(none attached)"}`,
    "",
    "What they want to build / learn:",
    lead.ambition || "(not given)",
    "",
    `Received:      ${lead.receivedAt}`,
  ].join("\n");

  return sendNotificationEmail({
    subject: `Founding Cohort application: ${lead.name}`,
    text,
    replyTo: lead.email,
    logPrefix: "[interest]",
    attachments: resume
      ? [{ filename: resume.filename, content: resume.base64 }]
      : undefined,
  });
}

async function readLeads() {
  try {
    const parsed = JSON.parse(await fs.readFile(LEADS_FILE, "utf8"));
    return Array.isArray(parsed) ? (parsed as Lead[]) : [];
  } catch (err) {
    if (isMissingFile(err)) return [];
    throw err;
  }
}

function enqueueLeadWrite(task: () => Promise<void>) {
  const run = leadWriteQueue.then(task, task);
  leadWriteQueue = run.catch(() => undefined);
  return run;
}

function isMissingFile(err: unknown) {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    err.code === "ENOENT"
  );
}
