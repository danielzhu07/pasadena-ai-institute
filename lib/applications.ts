import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { getNotificationRecipients, sendNotificationEmail } from "@/lib/notifications";

export const MAX_RESUME_BYTES = 8 * 1024 * 1024;

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
  none: "Never really used AI",
  dabbled: "Dabbled with ChatGPT a little",
  regular: "Uses it sometimes for work",
  comfortable: "Comfortable, wants to go deeper",
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
      return "That resume is over 8 MB. Please attach a smaller file.";
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
