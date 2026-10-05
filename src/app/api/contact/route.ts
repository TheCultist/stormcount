import { NextRequest } from "next/server";
import { escHtml, parseContactRequest, sendContactEmail } from "@/lib/contactEmail";

export async function POST(req: NextRequest) {
  const parsed = await parseContactRequest(req);
  if ("response" in parsed) return parsed.response;
  const { name, email, message } = parsed.fields;

  return sendContactEmail("contact", {
    replyTo: email,
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
}
