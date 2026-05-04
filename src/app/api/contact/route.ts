import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const TO = process.env.CONTACT_EMAIL ?? "contact@stormcount.gg";
const FROM = "Storm Count <noreply@stormcount.gg>";

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

  const { name, email, message } = body;
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to: TO,
    replyTo: `${name} <${email}>`,
    subject: `[Storm Count] Contact: ${name}`,
    text: [
      `Name: ${name}`,
      `Email: ${email}`,
      "",
      `Message:`,
      message,
    ].join("\n"),
    html: `
      <p><strong>Name:</strong> ${escHtml(name)}</p>
      <p><strong>Email:</strong> ${escHtml(email)}</p>
      <hr />
      <p><strong>Message:</strong></p>
      <p style="white-space:pre-wrap">${escHtml(message)}</p>
    `,
  });

  if (error) {
    console.error("[api/contact]", error);
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
