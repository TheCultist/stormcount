import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  path: "/sign-up",
  title: "Create account",
  description:
    "Create a Storm Count account to save your daily scores to the leaderboard. Registration is optional — you can also play anonymously.",
  noindex: true,
});

type Props = {
  searchParams: Promise<{ redirect_url?: string }>;
};

export default async function SignUpPage({ searchParams }: Props) {
  const { redirect_url } = await searchParams;
  // Only allow same-origin (relative) redirects to prevent open-redirect attacks.
  const safeRedirect = redirect_url?.startsWith("/") ? redirect_url : undefined;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center gap-8 px-5 py-16 sm:px-8">
      {/* Privacy notice — shown before the auth form */}
      <div className="codex w-full rounded-md border border-brass/25 bg-paper-2/30 px-6 py-4">
        <p className="eyebrow mb-2 text-[10px] text-brass-bright">
          ✦ Registration is optional
        </p>
        <p className="text-[13px] leading-relaxed text-foreground/75">
          You can play Daily and Survival mode without an account.
          Create one only if you want your daily scores saved to the leaderboard.
        </p>
        <p className="mt-2 text-[12px] leading-relaxed text-foreground/50">
          We only store your username and profile picture from your sign-in
          provider — never your email address or any other personal data.
          We do not share, sell, or use your data for any purpose other than
          displaying your leaderboard scores.
        </p>
      </div>

      {/* Clerk's sign-up form */}
      <SignUp forceRedirectUrl={safeRedirect} />
    </div>
  );
}
