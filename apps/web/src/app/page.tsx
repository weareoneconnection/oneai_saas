// apps/web/src/app/page.tsx
import Image from "next/image";
import Link from "next/link";

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function AppLogo({ size = 40 }: { size?: number }) {
  return (
    <div
      className="shrink-0 overflow-hidden rounded-2xl"
      style={{ width: size, height: size }}
    >
      <Image
        src="/icons/icon-512.png"
        alt="OneAI"
        width={size}
        height={size}
        className="h-full w-full object-contain"
        priority
      />
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-black/70 shadow-sm">
      {children}
    </span>
  );
}

function SectionTitle({
  eyebrow,
  title,
  desc,
  center = false,
}: {
  eyebrow?: string;
  title: string;
  desc?: string;
  center?: boolean;
}) {
  return (
    <div className={cx("max-w-3xl", center && "mx-auto text-center")}>
      {eyebrow ? (
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-black/45">
          {eyebrow}
        </div>
      ) : null}
      <h2 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight text-black md:text-4xl">
        {title}
      </h2>
      {desc ? (
        <p className="mt-4 text-sm leading-relaxed text-black/65 md:text-base">
          {desc}
        </p>
      ) : null}
    </div>
  );
}

function Card({
  title,
  desc,
  subtle,
}: {
  title: string;
  desc: string;
  subtle?: boolean;
}) {
  return (
    <div
      className={cx(
        "rounded-3xl border border-black/10 p-6 shadow-sm",
        subtle ? "bg-black/[0.02]" : "bg-white",
      )}
    >
      <div className="text-sm font-extrabold text-black">{title}</div>
      <div className="mt-2 text-sm leading-relaxed text-black/65">{desc}</div>
    </div>
  );
}

function MetricCard({
  title,
  desc,
}: {
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
      <div className="text-lg font-extrabold tracking-tight text-black">
        {title}
      </div>
      <div className="mt-2 text-sm leading-relaxed text-black/65">{desc}</div>
    </div>
  );
}

function FlowNode({
  title,
  desc,
}: {
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white px-4 py-4 shadow-sm">
      <div className="text-sm font-extrabold text-black">{title}</div>
      <div className="mt-1 text-xs leading-relaxed text-black/60">{desc}</div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="relative overflow-hidden bg-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-48 -top-48 h-[560px] w-[560px] rounded-full bg-black/[0.04]" />
        <div className="absolute -bottom-48 -left-48 h-[560px] w-[560px] rounded-full bg-black/[0.03]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(0,0,0,0.05),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(0,0,0,0.04),transparent_45%)]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <header className="flex items-center justify-between py-5 sm:py-6">
          <div className="flex min-w-0 items-center gap-3">
            <AppLogo size={44} />
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-extrabold tracking-tight">
                OneAI
              </div>
              <div className="truncate text-xs text-black/55">Agent OS</div>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-sm font-semibold text-black/70 md:flex">
            <Link href="/studio-lite" className="hover:text-black">
              Product
            </Link>
            <Link href="/developers" className="hover:text-black">
              Developers
            </Link>
            <Link href="/pricing" className="hover:text-black">
              Pricing
            </Link>
            <Link href="/docs" className="hover:text-black">
              Docs
            </Link>
            <Link href="/security" className="hover:text-black">
              Security
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="hidden rounded-full border border-black/15 bg-white px-4 py-2 text-sm font-bold text-black transition hover:bg-black/[0.04] sm:inline-flex"
            >
              Console
            </Link>
            <Link
              href="/studio-lite"
              className="inline-flex rounded-full bg-black px-4 py-2 text-sm font-extrabold text-white shadow-lg transition hover:bg-neutral-900 sm:px-5"
            >
              Try Studio
            </Link>
          </div>
        </header>

        {/* Hero */}
        <section className="pt-10 pb-12 md:pt-20 md:pb-20">
          <div className="flex flex-wrap gap-2">
            <Pill>Agent OS</Pill>
            <Pill>AI-native coordination</Pill>
            <Pill>Execution systems</Pill>
            <Pill>Workflow-ready</Pill>
          </div>

          <div className="mt-8 grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr]">
            <div>
              <div className="text-sm font-bold tracking-wide text-black/50">
                AI tools generate text. OneAI generates execution systems.
              </div>

              <h1 className="mt-5 max-w-4xl text-4xl font-extrabold tracking-tight leading-[1.02] text-black sm:text-5xl md:text-6xl">
                OneAI —
                <br />
                The Agent OS
                <br />
                for execution.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-relaxed text-black/70 sm:text-lg">
                Most AI tools stop at text.
                <br className="hidden sm:block" />
                OneAI turns intent into structured systems that can drive growth,
                workflows, execution, and verifiable outcomes.
              </p>

              <div className="mt-10 flex flex-col flex-wrap gap-3 sm:flex-row">
                <Link
                  href="/studio-lite"
                  className="inline-flex items-center justify-center rounded-full bg-black px-6 py-4 font-extrabold text-white shadow-lg transition hover:bg-neutral-900 sm:px-8"
                >
                  Launch AI Growth OS
                </Link>

                <Link
                  href="/studio/os"
                  className="inline-flex items-center justify-center rounded-full border border-black/15 bg-white px-6 py-4 font-extrabold text-black transition hover:bg-black/[0.04] sm:px-8"
                >
                  Explore Builder OS →
                </Link>
              </div>

              <div className="mt-4 flex flex-col flex-wrap gap-3 sm:flex-row sm:items-center">
                <Link
                  href="https://oneai-xlayer-hackathon.vercel.app"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center text-sm font-semibold text-black/70 transition hover:text-black"
                >
                  View Live Demo →
                </Link>

                <Link
                  href="/whitepaper"
                  className="inline-flex items-center text-sm font-semibold text-black/70 transition hover:text-black"
                >
                  Read Whitepaper →
                </Link>
              </div>

              <div className="mt-5 max-w-2xl text-sm text-black/50">
                OneAI is the operating layer.
                Studio Lite is the AI Growth OS for launch packs, viral campaigns,
                and execution-ready outputs.
              </div>
            </div>

            {/* Hero visual */}
            <div className="rounded-[28px] border border-black/10 bg-white p-3 shadow-[0_20px_80px_rgba(0,0,0,0.08)] sm:p-4">
              <div className="overflow-hidden rounded-[24px] border border-black/10 bg-[#0B0B0C] text-white">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                      <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                      <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                    </div>
                    <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">
                      OneAI Studio Lite
                    </div>
                  </div>

                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/70">
                    AI Growth OS
                  </div>
                </div>

                <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
                  <div className="border-b border-white/10 p-4 lg:border-r lg:border-b-0 lg:border-r-white/10 sm:p-5">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
                            Input
                          </div>
                          <div className="mt-1 text-sm font-semibold text-white/90">
                            Viral launch pack. Founders.
                          </div>
                        </div>

                        <div className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/60">
                          Ready
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-3">
                        <div className="text-[11px] text-white/40">Prompt</div>
                        <div className="mt-2 text-sm leading-relaxed text-white/85">
                          Goal: 100 waitlist
                          <br />
                          Topic: AI workflows
                          <br />
                          Tone: Contrarian
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                          <div className="text-[10px] uppercase tracking-wide text-white/40">
                            Pack
                          </div>
                          <div className="mt-1 text-xs font-semibold text-white/85">
                            Growth
                          </div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                          <div className="text-[10px] uppercase tracking-wide text-white/40">
                            Audience
                          </div>
                          <div className="mt-1 text-xs font-semibold text-white/85">
                            Founders
                          </div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                          <div className="text-[10px] uppercase tracking-wide text-white/40">
                            Output
                          </div>
                          <div className="mt-1 text-xs font-semibold text-white/85">
                            Execution
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-2">
                        <div className="flex h-9 flex-1 items-center justify-center rounded-full bg-white text-sm font-extrabold text-black">
                          Generate pack
                        </div>
                        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/70">
                          Export
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
                          Output Pack
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-white/50">
                          <span className="h-2 w-2 rounded-full bg-emerald-400" />
                          Synced
                        </div>
                      </div>

                      <div className="mt-4 max-h-[360px] space-y-3 overflow-y-auto pr-1">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                          <div className="text-[11px] font-semibold text-white/45">
                            Best Hook
                          </div>
                          <div className="mt-2 text-sm font-semibold leading-relaxed text-white/92">
                            Most founders think AI tools replace teams.
                            <br />
                            The real shift is replacing workflows.
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                          <div className="text-[11px] font-semibold text-white/45">
                            Hooks
                          </div>
                          <div className="mt-2 space-y-2 text-sm text-white/85">
                            <div>1. AI tools generate content.</div>
                            <div>2. Growth systems generate leverage.</div>
                            <div>3. Builders who execute win.</div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                          <div className="text-[11px] font-semibold text-white/45">
                            Tweets
                          </div>
                          <div className="mt-2 text-sm leading-relaxed text-white/82">
                            Most AI startups fail because prompts never become
                            workflows.
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                          <div className="text-[11px] font-semibold text-white/45">
                            CTA
                          </div>
                          <div className="mt-2 text-sm font-semibold text-white/88">
                            Join the waitlist →
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                        <div className="text-[11px] text-white/45">
                          Validation → Export → Workflow
                        </div>
                        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/70">
                          Ready to ship
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Live demo */}
        <section className="border-t border-black/10 py-14 md:py-16">
          <SectionTitle
            eyebrow="Live demo"
            title="See OneAI execute in real-time."
            desc="The live system shows visible reasoning, execution logs, real-world actions, and verifiable proof — not just AI output."
          />

          <div className="mt-10 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
              <div className="text-sm font-extrabold text-black">
                WAOC OneAI Agent OS demo
              </div>
              <div className="mt-2 text-sm leading-relaxed text-black/65">
                Watch the full loop:
                <br />
                intent → reasoning → execution → real-world action → proof.
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Pill>Reasoning</Pill>
                <Pill>Execution logs</Pill>
                <Pill>Real actions</Pill>
                <Pill>On-chain proof</Pill>
              </div>

              <div className="mt-6">
                <Link
                  href="https://oneai-xlayer-hackathon.vercel.app"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-full bg-black px-5 py-3 text-sm font-extrabold text-white transition hover:bg-neutral-900"
                >
                  Open Live Demo →
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-black/10 bg-black/[0.02] p-6 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-black/45">
                Execution flow
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Card
                  subtle
                  title="OneAI reasoning"
                  desc="Makes planning visible instead of hiding AI behind a black box."
                />
                <Card
                  subtle
                  title="Action graph"
                  desc="Turns intent into tweets, missions, workflows, and execution-ready outputs."
                />
                <Card
                  subtle
                  title="OneClaw execution"
                  desc="Runs real tasks, returns logs, and drives actions across systems."
                />
                <Card
                  subtle
                  title="Verifiable proof"
                  desc="Execution can be recorded and verified, powered by XLayer."
                />
              </div>
            </div>
          </div>
        </section>

        {/* Problem */}
        <section className="border-t border-black/10 py-14 md:py-16">
          <SectionTitle
            eyebrow="Problem"
            title="AI generation is easy. Execution is the real problem."
            desc="Most AI tools stop at text. But real work needs structure, validation, and workflows. Without those layers, outputs stay trapped in chat windows."
          />

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Text without structure"
              desc="Outputs look useful, but break the moment you need predictable formats."
            />
            <MetricCard
              title="Manual copy-paste"
              desc="Teams waste time moving AI outputs into docs, tools, and real workflows."
            />
            <MetricCard
              title="No validation layer"
              desc="Without schemas and retries, outputs are inconsistent and fragile."
            />
            <MetricCard
              title="No execution path"
              desc="The missing piece is not generation. It is what happens after generation."
            />
          </div>
        </section>

        {/* Solution */}
        <section className="border-t border-black/10 py-14 md:py-16">
          <SectionTitle
            eyebrow="Solution"
            title="OneAI is an agent operating layer for execution."
            desc="Instead of generating raw text, OneAI produces structured artifacts ready for real systems: validated, exportable, workflow-compatible, and execution-oriented."
          />

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <Card
              title="Structured outputs"
              desc="Schema-validated outputs with predictable formats for JSON, Markdown, and downstream systems."
            />
            <Card
              title="Execution-aware"
              desc="Outputs are designed to move into actions, workflows, and real operations — not just look good in chat."
            />
            <Card
              title="Workflow-ready"
              desc="Chains, retries, and execution-oriented steps that connect AI outputs to real operations."
            />
          </div>
        </section>

        {/* Architecture */}
        <section className="border-t border-black/10 py-14 md:py-16">
          <SectionTitle
            eyebrow="Architecture"
            title="AI needs an execution architecture."
            desc="OneAI connects generation with real execution systems — from intent and prompts to validated artifacts, workflows, actions, and verifiable outcomes."
          />

          <div className="mt-10 rounded-[28px] border border-black/10 bg-black/[0.02] p-4 sm:p-6">
            <div className="grid gap-3 md:grid-cols-6">
              <FlowNode title="Intent" desc="Topic, goal, context, constraints." />
              <FlowNode title="Prompt" desc="Templates and structured generation rules." />
              <FlowNode title="Output" desc="Predictable artifacts, not random text." />
              <FlowNode title="Validation" desc="Schemas, retries, and reliability checks." />
              <FlowNode title="Execution" desc="Connected to workflows and actions." />
              <FlowNode title="Proof" desc="Verifiable outcomes and trust layers." />
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-black/45">
                  System logic
                </div>
                <div className="mt-3 text-lg font-extrabold tracking-tight text-black">
                  Generation is only step one.
                </div>
                <p className="mt-3 text-sm leading-relaxed text-black/65">
                  The real value appears when outputs become stable enough to validate,
                  export, and use inside repeatable execution systems.
                </p>
              </div>

              <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-black/45">
                  Why it matters
                </div>
                <div className="mt-3 text-lg font-extrabold tracking-tight text-black">
                  More than AI output. A path to execution.
                </div>
                <p className="mt-3 text-sm leading-relaxed text-black/65">
                  OneAI sits in the gap between prompts and execution — the layer most AI
                  products ignore, but teams actually need.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Products */}
        <section className="border-t border-black/10 py-14 md:py-16">
          <SectionTitle
            eyebrow="Products"
            title="The OneAI product stack"
            desc="OneAI is the Agent OS. Studio Lite is the AI Growth OS. Builder OS and API extend the system into full execution infrastructure."
          />

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
              <div className="text-sm font-extrabold text-black">
                Studio Lite
              </div>
              <div className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-black/40">
                AI Growth OS
              </div>
              <div className="mt-3 text-sm leading-relaxed text-black/65">
                Turns one idea into hooks, threads, launch packs, viral campaigns,
                and execution-ready growth outputs.
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Pill>Growth packs</Pill>
                <Pill>Hooks</Pill>
                <Pill>Launch systems</Pill>
              </div>
              <div className="mt-5">
                <Link
                  href="/studio-lite"
                  className="inline-flex rounded-full bg-black px-4 py-2 text-xs font-extrabold text-white transition hover:bg-neutral-900"
                >
                  Launch AI Growth OS →
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
              <div className="text-sm font-extrabold text-black">Builder OS</div>
              <div className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-black/40">
                Execution OS
              </div>
              <div className="mt-3 text-sm leading-relaxed text-black/65">
                Execution infrastructure for builders: projects, workflows, keys,
                structured generation, and system-level coordination.
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Pill>Projects</Pill>
                <Pill>Workflows</Pill>
                <Pill>Execution</Pill>
              </div>
              <div className="mt-5">
                <Link
                  href="/studio/os"
                  className="inline-flex rounded-full border border-black/15 bg-white px-4 py-2 text-xs font-extrabold transition hover:bg-black/[0.04]"
                >
                  Explore Builder OS →
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
              <div className="text-sm font-extrabold text-black">OneAI API</div>
              <div className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-black/40">
                Coordination API
              </div>
              <div className="mt-3 text-sm leading-relaxed text-black/65">
                Coordination APIs for structured generation, validation, execution,
                and system-level integration inside your own products.
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Pill>Generate</Pill>
                <Pill>Validate</Pill>
                <Pill>Execute</Pill>
              </div>
              <div className="mt-5">
                <Link
                  href="/developers"
                  className="inline-flex rounded-full border border-black/15 bg-white px-4 py-2 text-xs font-extrabold transition hover:bg-black/[0.04]"
                >
                  For developers →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Use cases */}
        <section className="border-t border-black/10 py-14 md:py-16">
          <SectionTitle
            eyebrow="Use cases"
            title="Built for builders who ship."
            desc="Use OneAI to produce outputs that move work forward — growth, docs, commands, workflows, launch systems, and operating layers."
          />

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <Card
              subtle
              title="Growth systems"
              desc="Generate hooks, launch packs, reply flows, campaign structures, and execution-ready publishing outputs."
            />
            <Card
              subtle
              title="Product & docs"
              desc="Create PRDs, specs, checklists, and structured exports that teams can actually reuse."
            />
            <Card
              subtle
              title="Developers"
              desc="Produce structured payloads, commands, and execution-ready outputs for real systems."
            />
            <Card
              subtle
              title="Operations"
              desc="Turn SOPs, plans, reporting, and coordination loops into repeatable execution systems."
            />
          </div>
        </section>

        {/* Reliability */}
        <section className="border-t border-black/10 py-14 md:py-16">
          <SectionTitle
            eyebrow="Reliability"
            title="Reliability built-in"
            desc="Production systems need predictable outputs. OneAI is designed for stability, validation, execution readiness, and trustworthy outcomes."
          />

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <Card
              title="Validation"
              desc="Schema-checked outputs reduce failures, fragile formatting, and downstream chaos."
            />
            <Card
              title="Retries"
              desc="Controlled attempts improve consistency when exact structured output matters."
            />
            <Card
              title="Trust layer"
              desc="Verifiable outcomes can plug into proof systems, including on-chain verification powered by XLayer."
            />
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-black/10 py-16 text-center md:py-20">
          <SectionTitle
            eyebrow="Get started"
            title="Start with growth. Expand into execution."
            desc="Launch Studio Lite for AI Growth OS. Move into Builder OS when you need full execution workflows and system-level coordination."
            center
          />

          <div className="mt-8 flex flex-col flex-wrap justify-center gap-3 sm:flex-row">
            <Link
              href="/studio-lite"
              className="inline-flex items-center justify-center rounded-full bg-black px-6 py-4 font-extrabold text-white shadow-lg transition hover:bg-neutral-900 sm:px-8"
            >
              Launch AI Growth OS
            </Link>

            <Link
              href="/studio/os"
              className="inline-flex items-center justify-center rounded-full border border-black/15 bg-white px-6 py-4 font-extrabold text-black transition hover:bg-black/[0.04] sm:px-8"
            >
              Explore Builder OS →
            </Link>

            <Link
              href="https://oneai-xlayer-hackathon.vercel.app"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-black/15 bg-white px-6 py-4 font-extrabold text-black transition hover:bg-black/[0.04] sm:px-8"
            >
              View Live Demo →
            </Link>
          </div>

          <div className="mt-5 text-sm text-black/50">
            OneAI is the Agent OS. Studio Lite is the AI Growth OS.
          </div>
        </section>

        {/* Footer */}
        <footer className="py-10 text-sm text-black/50">
          <div className="flex flex-col gap-3 border-t border-black/10 pt-6 md:flex-row md:items-center md:justify-between">
            <div>
              © {new Date().getFullYear()} OneAI — Agent operating system for
              execution.
            </div>
            <div className="flex flex-wrap gap-4">
              <Link className="hover:text-black" href="/security">
                Security
              </Link>
              <Link className="hover:text-black" href="/docs">
                Docs
              </Link>
              <Link className="hover:text-black" href="/developers">
                Developers
              </Link>
              <Link className="hover:text-black" href="/whitepaper">
                Whitepaper
              </Link>
            </div>
          </div>

          <div className="mt-4 text-xs text-black/40">
            On-chain verification powered by XLayer.
          </div>
        </footer>
      </div>
    </main>
  );
}