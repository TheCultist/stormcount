import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const TO = process.env.CONTACT_EMAIL ?? "contact@stormcount.gg";
const FROM = "Storm Count <noreply@stormcount.gg>";

const BUG_TYPE_LABELS: Record<string, string> = {
  "wrong-mana-value": "Wrong mana value displayed",
  "broken-run": "Broken Daily / Survival run",
  "leaderboard": "Leaderboard / score issue",
  "ui-visual": "UI or visual glitch",
  "auth": "Sign-in / account problem",
  "other": "Other",
};

export async function POST(req: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "Email service not configured." },
      { status: 503 },
    );
  }

  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { name, email, message, bugType } = body;
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  const bugLabel = BUG_TYPE_LABELS[bugType] ?? bugType ?? "Unknown";

  const { error } = await resend.emails.send({
    from: FROM,
    to: TO,
    replyTo: `${name} <${email}>`,
    subject: `[Storm Count] Bug: ${bugLabel}`,
    text: [
      `Name: ${name}`,
      `Email: ${email}`,
      `Bug type: ${bugLabel}`,
      "",
      `Description:`,
      message,
    ].join("\n"),
    html: `
      <p><strong>Name:</strong> ${escHtml(name)}</p>
      <p><strong>Email:</strong> ${escHtml(email)}</p>
      <p><strong>Bug type:</strong> ${escHtml(bugLabel)}</p>
      <hr />
      <p><strong>Description:</strong></p>
      <p style="white-space:pre-wrap">${escHtml(message)}</p>
    `,
  });

  if (error) {
    console.error("[api/bug-report]", error);
    return NextResponse.json({ error: "Failed to send. Try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

function escHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
