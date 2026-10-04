import { signIn } from "@/lib/auth";

export default function SignInPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center">
      <div className="card w-full space-y-6 p-6">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#f0d48a]">Sign in to Octave</h1>
          <p className="mt-2 text-sm text-[#9aa8c7]">
            Use Google, Apple, or any personal email address. Email sign-in uses a secure one-time link.
          </p>
        </div>

        <div className="grid gap-3">
          <form action={async () => { "use server"; await signIn("google", { redirectTo: "/" }); }}>
            <button className="w-full rounded-full border border-[#2a3654] px-4 py-3 text-sm hover:border-[#e2b657]">
              Continue with Google
            </button>
          </form>

          <form action={async () => { "use server"; await signIn("apple", { redirectTo: "/" }); }}>
            <button className="w-full rounded-full border border-[#2a3654] px-4 py-3 text-sm hover:border-[#e2b657]">
              Continue with Apple
            </button>
          </form>

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
        </div>

        <p className="text-xs leading-5 text-[#6f7d9d]">
          Octave keeps your job profile and application data tied to your account. We never need your
          Google or Apple password.
        </p>
      </div>
    </div>
  );
}
