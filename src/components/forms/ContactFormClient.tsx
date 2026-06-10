"use client";

import { useState, useRef } from "react";

type Status = "idle" | "submitting" | "success" | "error";

// 16px minimum on mobile — anything smaller makes iOS Safari zoom in on focus.
const fieldClass =
  "border border-rule/30 bg-background-deep/60 px-4 py-3 text-base sm:text-sm text-foreground placeholder:text-muted/60 transition-colors duration-200 focus:border-brass-bright focus:outline-none focus:ring-1 focus:ring-brass/40 storm-mono";

interface Props {
  /** POST endpoint e.g. "/api/contact" or "/api/bug-report" */
  action: string;
  /** Placeholder text for the message field */
  messagePlaceholder: string;
  /** Optional extra fields rendered between email and message */
  extraFields?: React.ReactNode;
  /** Label shown while idle */
  submitLabel?: string;
}

export default function ContactFormClient({
  action,
  messagePlaceholder,
  extraFields,
  submitLabel = "Send",
}: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    const data = new FormData(e.currentTarget);
    const body = Object.fromEntries(data.entries());

    try {
      const res = await fetch(action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setStatus("success");
        formRef.current?.reset();
      } else {
        const json = await res.json().catch(() => ({}));
        setErrorMsg(json?.error ?? "Something went wrong. Try again.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Network error. Check your connection and try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="codex rim-brass anim-rise-in flex flex-col items-center gap-4 rounded-md p-10 text-center">
        <span className="text-3xl text-brass">✦</span>
        <p className="storm-display text-lg font-semibold text-foreground/90">
          Message sent
        </p>
        <p className="storm-display-italic text-sm text-foreground/60">
          We&apos;ll get back to you soon.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="storm-mono mt-2 text-[11px] uppercase tracking-[0.2em] text-muted/60 underline underline-offset-2 transition-colors hover:text-brass-bright"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="codex rim-brass anim-rise-in flex flex-col gap-5 rounded-md p-8"
    >
      <label className="flex flex-col gap-1.5">
        <span className="eyebrow text-[10px] text-muted">Name</span>
        <input
          type="text"
          name="name"
          required
          placeholder="Your name"
          className={fieldClass}
          disabled={status === "submitting"}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="eyebrow text-[10px] text-muted">Email</span>
        <input
          type="email"
          name="email"
          required
          placeholder="you@domain.com"
          className={fieldClass}
          disabled={status === "submitting"}
        />
      </label>

      {extraFields}

      <label className="flex flex-col gap-1.5">
        <span className="eyebrow text-[10px] text-muted">Message</span>
        <textarea
          name="message"
          rows={5}
          required
          placeholder={messagePlaceholder}
          className={`${fieldClass} resize-y leading-relaxed`}
          disabled={status === "submitting"}
        />
      </label>

      <span aria-hidden className="rule-brass" />

      {status === "error" && (
        <p className="storm-mono text-[11px] text-crimson-bright">
          {errorMsg}
        </p>
      )}

      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "submitting" ? "Sending…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
