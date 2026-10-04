import { signIn } from "@/lib/auth";

export default function SignInPage() {
  const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
  const appleEnabled = Boolean(process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET);
  const emailEnabled = Boolean(process.env.EMAIL_SERVER && process.env.EMAIL_FROM);
  const anyEnabled = googleEnabled || appleEnabled || emailEnabled;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center">
      <div className="card w-full space-y-6 p-6">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#f0d48a]">Sign in to Octave</h1>
          <p className="mt-2 text-sm text-[#9aa8c7]">
            Use Google, Apple, or a personal email address. Email sign-in uses a secure one-time link.
          </p>
        </div>

        {anyEnabled ? (
          <div className="grid gap-3">
            {googleEnabled && (
              <form action={async () => { "use server"; await signIn("google", { redirectTo: "/" }); }}>
                <button className="w-full rounded-full border border-[#2a3654] px-4 py-3 text-sm hover:border-[#e2b657]">
                  Continue with Google
                </button>
              </form>
            )}

            {appleEnabled && (
              <form action={async () => { "use server"; await signIn("apple", { redirectTo: "/" }); }}>
                <button className="w-full rounded-full border border-[#2a3654] px-4 py-3 text-sm hover:border-[#e2b657]">
                  Continue with Apple
                </button>
              </form>
            )}

            {emailEnabled && (
              <form action={async (formData) => {
                "use server";
                const email = String(formData.get("email") || "").trim();
                if (!email) return;
                await signIn("nodemailer", { email, redirectTo: "/" });
              }} className="space-y-3">
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-[#2a3654] bg-[#0c1220] px-3 py-3 text-sm outline-none focus:border-[#e2b657]"
                />
                <button className="w-full rounded-full bg-[#e2b657] px-4 py-3 text-sm font-semibold text-[#0c1220]">
                  Email me a sign-in link
                </button>
              </form>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-[#2a3654] p-4 text-sm leading-6 text-[#9aa8c7]">
            Sign-in is not configured yet. Add credentials for at least one provider in your local
            <code className="mx-1">.env</code> file, then restart Octave. See <code>docs/SETUP.md</code>.
          </div>
        )}

        <p className="text-xs leading-5 text-[#6f7d9d]">
          Octave keeps your job profile and application data tied to your account. We never need your
          Google or Apple password.
        </p>
      </div>
    </div>
  );
}
