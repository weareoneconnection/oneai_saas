// apps/web/src/app/(app)/login/page.tsx
"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { getProviders, signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const capabilities = [
  "Create and rotate API keys · 创建和轮换 API keys",
  "Track usage, cost, model, provider, and requestId · 追踪用量、成本和请求",
  "Inspect model registry and task catalog · 查看模型和任务注册表",
  "Test structured generation in Playground · 测试结构化生成",
  "Manage billing and customer plans · 管理计费和套餐",
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
  const [loading, setLoading] = useState<"google" | "email" | "credentials" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [providers, setProviders] = useState<Record<string, any> | null>(null);
  const [localError, setLocalError] = useState("");
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/dashboard";
  const authError = params.get("error") || "";
  const hasGoogle = !!providers?.google;
  const hasEmail = !!providers?.email;
  const hasCredentials = !!providers?.credentials;

  React.useEffect(() => {
    getProviders()
      .then((nextProviders) => setProviders(nextProviders || {}))
      .catch(() => setProviders({}));
  }, []);

  async function handleGoogle() {
    setLocalError("");
    setLoading("google");
    await signIn("google", { callbackUrl });
  }

  async function handleEmail() {
    if (!email.trim()) return;
    setLocalError("");
    setLoading("email");
    await signIn("email", { email: email.trim(), callbackUrl });
  }

  async function handleConsolePassword() {
    if (!email.trim() || !password) return;
    setLocalError("");
    setLoading("credentials");
    const result = await signIn("credentials", {
      email: email.trim(),
      password,
      callbackUrl,
      redirect: false,
    });
    setLoading(null);

    if (result?.ok && result.url) {
      window.location.href = result.url;
      return;
    }

    setLocalError("Email or console password is incorrect, or password login is not enabled.");
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
              <div className="text-xs text-black/50">Developer Console · 开发者控制台</div>
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
            Commercial API operations · 商用 API 控制台
          </div>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            Manage OneAI as full-model AI infrastructure.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-black/60">
            OneAI is the intelligent coordination layer. The console is where
            customers manage access, test tasks, inspect models, control cost,
            and operate API usage and plans. OneAI 是智能协调层，控制台负责运营。
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <Stat label="Product 产品" value="API first" />
            <Stat label="Routing 路由" value="Full-model" />
            <Stat label="Business 商业" value="Usage + billing" />
          </div>

          <div className="mt-8 rounded-lg border border-black/10 bg-black/[0.02] p-5">
            <div className="text-sm font-bold">Console includes · 控制台能力</div>
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
          <div className="text-sm font-bold">Sign in · 登录</div>
          <p className="mt-2 text-sm leading-relaxed text-black/55">
            Continue to the OneAI developer console. 继续进入 OneAI 开发者控制台。
          </p>

          {authError || localError ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {localError || `Sign-in failed: ${authError}`}
            </div>
          ) : null}

          <div className="mt-6 space-y-3">
            {hasGoogle ? (
              <Button
                className="w-full"
                onClick={handleGoogle}
                disabled={loading !== null}
              >
                {loading === "google" ? "Redirecting..." : "Continue with Google"}
              </Button>
            ) : null}

            {hasGoogle && (hasEmail || hasCredentials) ? (
              <div className="flex items-center gap-3 py-2">
                <div className="h-px flex-1 bg-black/10" />
                <div className="text-xs text-black/40">or</div>
                <div className="h-px flex-1 bg-black/10" />
              </div>
            ) : null}

            {!providers ? (
              <div className="rounded-lg border border-black/10 bg-black/[0.02] p-3 text-sm text-black/55">
                Loading sign-in methods...
              </div>
            ) : null}

            {providers && !hasGoogle && !hasEmail && !hasCredentials ? (
              <div className="rounded-lg border border-black/10 bg-black/[0.02] p-3 text-sm text-black/60">
                No sign-in method is enabled. Set ONEAI_CONSOLE_USER_EMAIL and ONEAI_CONSOLE_PASSWORD on Railway Web, then redeploy.
              </div>
            ) : null}

            {hasEmail || hasCredentials ? (
              <label className="block">
                <div className="mb-1 text-xs text-black/50">Work email</div>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  type="email"
                />
              </label>
            ) : null}

            {hasEmail ? (
              <Button
                variant="secondary"
                className="w-full"
                onClick={handleEmail}
                disabled={loading !== null || !email.trim()}
              >
                {loading === "email" ? "Sending link..." : "Send sign-in link"}
              </Button>
            ) : null}

            {hasEmail && hasCredentials ? (
              <div className="flex items-center gap-3 py-2">
                <div className="h-px flex-1 bg-black/10" />
                <div className="text-xs text-black/40">or</div>
                <div className="h-px flex-1 bg-black/10" />
              </div>
            ) : null}

            {hasCredentials ? (
              <>
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
                {loading === "credentials" ? "登录中..." : "密码登录"}
                </Button>
              </>
            ) : null}

            {/* <div className="flex items-center gap-3 py-2">
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
            </Button> */}
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
