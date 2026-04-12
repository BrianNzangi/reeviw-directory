"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@bargainlydeals.com");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (result?.error) {
        setError(result.error.message || "Sign-in failed");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Sign-in failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,116,72,0.14),_transparent_26%),linear-gradient(180deg,_#f8f9fb_0%,_#eef2f6_100%)] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:72px_72px] opacity-40" />
      <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[hsl(var(--brand-primary-1))] opacity-10 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[hsl(var(--brand-secondary-10))] opacity-40 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1500px] items-center justify-center px-6 py-8 lg:px-10 xl:px-16">
        <section className="relative flex w-full items-center justify-center">
          <div className="w-full max-w-md rounded-lg border border-white/10 bg-[linear-gradient(180deg,rgba(12,15,22,0.92),rgba(8,10,16,0.98))] p-7 text-white shadow-[0_28px_90px_rgba(0,0,0,0.35)] sm:p-9">
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[hsl(var(--brand-primary-6))]">Secure access</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white">Sign in</h2>
              <p className="mt-3 text-sm leading-6 text-white/65">Use your admin credentials to continue into the Bargainly control room.</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              <label className="block text-sm">
                <span className="mb-2 block font-medium text-white/86">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-12 w-full rounded-lg border border-white/10 bg-white px-4 text-[hsl(var(--brand-secondary-1))] placeholder:text-[hsl(var(--brand-secondary-6))] focus:border-[hsl(var(--brand-primary-4))] focus:ring-2 focus:ring-[hsl(var(--brand-primary-1))]/25"
                  autoComplete="email"
                  required
                />
              </label>

              <label className="block text-sm">
                <span className="mb-2 block font-medium text-white/86">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-12 w-full rounded-lg border border-white/10 bg-white/6 px-4 text-white placeholder:text-white/35 focus:border-[hsl(var(--brand-primary-4))] focus:ring-2 focus:ring-[hsl(var(--brand-primary-1))]/25"
                  autoComplete="current-password"
                  required
                />
              </label>

              <div className="flex items-center justify-between gap-3 text-xs text-white/60">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-white/20 bg-transparent accent-[hsl(var(--brand-primary-1))]"
                  />
                  <span>Remember me</span>
                </label>
                <span>Admins only</span>
              </div>

              {error ? (
                <p className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="h-12 w-full rounded-lg bg-[linear-gradient(135deg,_hsl(var(--brand-primary-2)),_hsl(var(--brand-primary-1)))] px-4 font-semibold text-white shadow-[0_18px_40px_rgba(255,52,0,0.28)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Signing in..." : "Sign In"}
              </button>
            </form>

          </div>
        </section>
      </div>
    </main>
  );
}
