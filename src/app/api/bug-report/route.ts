import { NextRequest } from "next/server";
import { escHtml, parseContactRequest, sendContactEmail } from "@/lib/contactEmail";

const BUG_TYPE_LABELS: Record<string, string> = {
  "wrong-mana-value": "Wrong mana value displayed",
  "broken-run": "Broken Daily / Survival run",
  "leaderboard": "Leaderboard / score issue",
  "ui-visual": "UI or visual glitch",
  "auth": "Sign-in / account problem",
  "other": "Other",
};

export async function POST(req: NextRequest) {
  const parsed = await parseContactRequest(req);
  if ("response" in parsed) return parsed.response;
  const { name, email, message } = parsed.fields;

  const bugType = parsed.body.bugType;
  const bugLabel =
    typeof bugType === "string" && Object.hasOwn(BUG_TYPE_LABELS, bugType)
      ? BUG_TYPE_LABELS[bugType]
      : "Unknown";

  return sendContactEmail("bug-report", {
    replyTo: email,
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
}
