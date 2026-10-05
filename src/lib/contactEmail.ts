/**
 * Shared plumbing for the public contact + bug-report forms: payload
 * validation (runtime-typed, length-capped, honeypot) and Resend delivery.
 *
 * Limits live in `contactLimits.ts` so the client form can mirror them as
 * `maxLength`.
 */
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { CONTACT_LIMITS, HONEYPOT_FIELD } from "./contactLimits";

const TO = process.env.CONTACT_EMAIL ?? "findthatcard@thecultist.it";
const FROM = "Storm Count <noreply@thecultist.it>";

export type ContactFields = { name: string; email: string; message: string };

/**
 * Parse and validate a form POST. Returns the cleaned fields plus the raw
 * body (for route-specific extras), or a ready-to-return response — an error,
 * or a silent fake success when the honeypot tripped.
 */
export async function parseContactRequest(
  req: Request,
): Promise<
  | { fields: ContactFields; body: Record<string, unknown> }
  | { response: NextResponse }
> {
  const bad = (error: string, status = 400) => ({
    response: NextResponse.json({ error }, { status }),
  });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return bad("Invalid request body.");
  }
  if (!body || typeof body !== "object") return bad("Invalid request body.");
  const raw = body as Record<string, unknown>;

  if (typeof raw[HONEYPOT_FIELD] === "string" && raw[HONEYPOT_FIELD]) {
    return { response: NextResponse.json({ ok: true }) };
  }

  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const fields = { name: str(raw.name), email: str(raw.email), message: str(raw.message) };

  if (!fields.name || !fields.email || !fields.message) {
    return bad("All fields are required.");
  }
  for (const key of ["name", "email", "message"] as const) {
    if (fields[key].length > CONTACT_LIMITS[key]) {
      return bad(`${key[0].toUpperCase()}${key.slice(1)} is too long (max ${CONTACT_LIMITS[key]} characters).`);
    }
  }
  if (!/^[^\s@<>,"]+@[^\s@<>,"]+\.[^\s@<>,"]+$/.test(fields.email)) {
    return bad("Invalid email address.");
  }
  return { fields, body: raw };
}

export function escHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Send a form submission to the site inbox. The Resend client is created per
 * call: constructing it at module load throws when RESEND_API_KEY is unset,
 * which used to turn the "not configured" 503 into a crash.
 */
export async function sendContactEmail(
  tag: string,
  email: { replyTo: string; subject: string; text: string; html: string },
): Promise<NextResponse> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Email service not configured." }, { status: 503 });
  }

  const { error } = await new Resend(apiKey).emails.send({ from: FROM, to: TO, ...email });
  if (error) {
    console.error(`[api/${tag}]`, error);
    return NextResponse.json({ error: "Failed to send. Try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
