import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const PAYMENTS_FILE = path.join(DATA_DIR, "payments.json");

let paymentWriteQueue = Promise.resolve();

export type PaymentRecord = {
  eventId: string;
  sessionId: string;
  paymentIntent?: string;
  customerEmail?: string;
  customerName?: string;
  amountSubtotal?: number;
  amountDiscount?: number;
  amountTotal?: number;
  currency?: string;
  paymentStatus?: string;
  status?: string;
  livemode?: boolean;
  checkoutUrl?: string;
  createdAt?: string;
  receivedAt: string;
};

export async function savePayment(record: PaymentRecord) {
  return enqueuePaymentWrite(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const existing = await readPayments();
    const duplicate = existing.some(
      (payment) =>
        payment.eventId === record.eventId ||
        payment.sessionId === record.sessionId,
    );

    if (duplicate) return { saved: false, duplicate: true };

    existing.push(record);

    const tempFile = path.join(
      DATA_DIR,
      `.payments.${process.pid}.${Date.now()}.tmp`,
    );
    await fs.writeFile(tempFile, JSON.stringify(existing, null, 2));
    await fs.rename(tempFile, PAYMENTS_FILE);

    return { saved: true, duplicate: false };
  });
}

async function readPayments() {
  try {
    const parsed = JSON.parse(await fs.readFile(PAYMENTS_FILE, "utf8"));
    return Array.isArray(parsed) ? (parsed as PaymentRecord[]) : [];
  } catch (err) {
    if (isMissingFile(err)) return [];
    throw err;
  }
}

function enqueuePaymentWrite<T>(task: () => Promise<T>) {
  const run = paymentWriteQueue.then(task, task);
  paymentWriteQueue = run.then(
    () => undefined,
    () => undefined,
  );
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
