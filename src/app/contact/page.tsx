export const metadata = {
  title: "Contact — Storm Count",
};

const fieldClass =
  "border border-rule/30 bg-background-deep/60 px-4 py-3 text-sm text-foreground placeholder:text-muted/60 transition-colors duration-200 focus:border-brass-bright focus:outline-none focus:ring-1 focus:ring-brass/40 storm-mono";

export default function ContactPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-5 py-12 sm:px-8 sm:py-16">
      <header className="anim-fade-in flex flex-col gap-3">
        <p className="eyebrow">Contact</p>
        <h1
          className="storm-display text-4xl font-extrabold leading-[0.95] tracking-[-0.02em] text-foreground sm:text-5xl"
          style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1' }}
        >
          Report a{" "}
          <span className="storm-display-italic text-brass-bright">bug</span>
        </h1>
        <p className="storm-display-italic max-w-md text-base leading-relaxed text-foreground/65">
          Spot a wrong mana value or a broken run? Let us know. Form submission
          is wired later via Resend.
        </p>
      </header>

      <form
        className="codex rim-brass anim-rise-in flex flex-col gap-5 rounded-md p-8"
        action="/api/contact"
        method="post"
      >
        <label className="flex flex-col gap-1.5">
          <span className="eyebrow text-[10px] text-muted">Name</span>
          <input
            type="text"
            name="name"
            required
            placeholder="Your name"
            className={fieldClass}
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
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="eyebrow text-[10px] text-muted">Message</span>
          <textarea
            name="message"
            rows={5}
            required
            placeholder="What broke? Steps to reproduce help a lot."
            className={`${fieldClass} resize-y leading-relaxed`}
          />
        </label>

        <span aria-hidden className="rule-brass" />

        <div className="flex items-center justify-between gap-4">
          <p className="storm-mono text-[10px] uppercase tracking-[0.22em] text-muted/70">
            Wired later via Resend
          </p>
          <button
            type="submit"
            disabled
            aria-disabled
            className="btn-primary cursor-not-allowed opacity-60"
            title="Submission not wired yet"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
