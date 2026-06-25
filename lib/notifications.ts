type EmailAttachment = {
  filename: string;
  content: string;
};

type SendNotificationEmailInput = {
  subject: string;
  text: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
  logPrefix?: string;
};

export function getNotificationRecipients() {
  return (process.env.LEAD_NOTIFY_EMAIL || "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}

export async function sendNotificationEmail({
  subject,
  text,
  replyTo,
  attachments,
  logPrefix = "[notify]",
}: SendNotificationEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = getNotificationRecipients();
  if (!apiKey || to.length === 0) return false;

  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Pasadena AI Workshop <${from}>`,
        to,
        ...(replyTo ? { reply_to: replyTo } : {}),
        subject,
        text,
        ...(attachments?.length ? { attachments } : {}),
      }),
    });

    if (!res.ok) {
      console.error(`${logPrefix} Resend error ${res.status}:`, await res.text());
      return false;
    }

    return true;
  } catch (err) {
    console.error(`${logPrefix} Resend request failed:`, err);
    return false;
  }
}
