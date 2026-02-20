"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message || "Login failed");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError((err as Error).message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-zinc-950 p-10 md:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-45"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.14) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="pointer-events-none absolute -left-24 top-20 h-80 w-80 rounded-full bg-cyan-500/15 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-16 right-0 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" aria-hidden />
        <div className="relative flex h-full w-full flex-col justify-between">
          <div className="text-sm font-semibold tracking-[0.2em] text-zinc-200">REEVIW</div>
          <div className="space-y-4">
            <h2 className="max-w-md text-4xl font-semibold leading-tight text-white">
              Centralized review ops for high-volume teams.
            </h2>
            <p className="max-w-md text-base text-zinc-300">
              Manage submissions, moderation, and publishing from one controlled workspace.
            </p>
          </div>
        </div>
      </div>

      <div className="relative flex items-center justify-center bg-white p-6 md:p-10">
        <div className="absolute right-8 top-8 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Login</div>
        <Card className="w-full max-w-sm border-zinc-200 bg-white shadow-sm">
          <CardContent className="px-6 py-8 md:px-8">
            <div className="mb-6 space-y-1 text-center">
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Welcome back</h1>
              <p className="text-sm text-zinc-600">Sign in with your email and password</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@example.com"
                  required
                  className="border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-700">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="********"
                  required
                  className="border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400"
                />
              </div>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-zinc-900 text-white hover:bg-zinc-800"
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-zinc-500">
              By clicking continue, you agree to our <span className="underline">Terms of Service</span> and <span className="underline">Privacy Policy</span>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
