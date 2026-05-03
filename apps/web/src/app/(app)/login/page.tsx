// apps/web/src/app/(app)/login/page.tsx
"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const capabilities = [
  "Create and rotate API keys",
  "Track usage, cost, model, provider, and requestId",
  "Inspect model registry and task catalog",
  "Test structured generation in Playground",
  "Manage billing and customer plans",
];

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-4">
      <div className="text-xs text-black/50">{label}</div>
      <div className="mt-2 text-lg font-semibold text-black">{value}</div>
    </div>
  );
}

function LoginPageContent() {
  const [loading, setLoading] = useState<"google" | "email" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/dashboard";

  async function handleGoogle() {
    setLoading("google");
    await signIn("google", { callbackUrl });
  }

  async function handleEmail() {
    if (!email.trim()) return;
    setLoading("email");
    await signIn("email", { email: email.trim(), callbackUrl });
  }

  async function handleConsolePassword() {
    if (!email.trim() || !password) return;
    setLoading("email");
    await signIn("credentials", {
      email: email.trim(),
      password,
      callbackUrl,
    });
  }

  return (
    <div className="min-h-dvh bg-white text-black">
      <header className="border-b border-black/10">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 text-sm font-bold">
              OA
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold">OneAI API</div>
              <div className="text-xs text-black/50">Developer Console</div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/docs">
              <Button variant="ghost" size="sm">
                Docs
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="secondary" size="sm">
                Pricing
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1fr_420px] md:py-20">
        <section>
          <div className="text-xs font-bold uppercase tracking-wide text-black/45">
            Sign in to commercial API operations
          </div>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            Manage OneAI as full-model AI infrastructure.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-black/60">
            OneAI stays the intelligent coordination brain. The console is where
            customers manage access, test tasks, inspect models, control cost,
            and pay for API usage.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <Stat label="Product" value="API first" />
            <Stat label="Routing" value="Multi-model" />
            <Stat label="Business" value="Usage + billing" />
          </div>

          <div className="mt-8 rounded-lg border border-black/10 bg-black/[0.02] p-5">
            <div className="text-sm font-bold">Console includes</div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {capabilities.map((item) => (
                <div key={item} className="text-sm text-black/65">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="rounded-lg border border-black/10 bg-white p-6 shadow-sm">
          <div className="text-sm font-bold">Sign in</div>
          <p className="mt-2 text-sm leading-relaxed text-black/55">
            Continue to the OneAI developer console.
          </p>

          <div className="mt-6 space-y-3">
            <Button
              className="w-full"
              onClick={handleGoogle}
              disabled={loading !== null}
            >
              {loading === "google" ? "Redirecting..." : "Continue with Google"}
            </Button>

            <div className="flex items-center gap-3 py-2">
              <div className="h-px flex-1 bg-black/10" />
              <div className="text-xs text-black/40">or</div>
              <div className="h-px flex-1 bg-black/10" />
            </div>

            <label className="block">
              <div className="mb-1 text-xs text-black/50">Work email</div>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                type="email"
              />
            </label>

            <Button
              variant="secondary"
              className="w-full"
              onClick={handleEmail}
              disabled={loading !== null || !email.trim()}
            >
              {loading === "email" ? "Sending link..." : "Send sign-in link"}
            </Button>

            <label className="block">
              <div className="mb-1 text-xs text-black/50">Console password</div>
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Production console password"
                type="password"
              />
            </label>

            <Button
              variant="secondary"
              className="w-full"
              onClick={handleConsolePassword}
              disabled={loading !== null || !email.trim() || !password}
            >
              {loading === "email" ? "Signing in..." : "Sign in with password"}
            </Button>
          </div>

          <div className="mt-6 rounded-lg border border-black/10 bg-black/[0.02] p-3 text-xs leading-relaxed text-black/55">
            Keep API keys server-side. The console is for operators and
            customers who manage production access.
          </div>
        </aside>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-white" />}>
      <LoginPageContent />
    </Suspense>
  );
}
