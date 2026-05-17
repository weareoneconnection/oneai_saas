import Link from "next/link";
import { DocShell, DocSectionTitle } from "../_components/DocShell";
import { makeCurl, type TaskExample } from "./_data";

function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="overflow-auto whitespace-pre-wrap rounded-lg border border-black/10 bg-white p-5 text-xs leading-relaxed text-black/75">
      <code>{typeof value === "string" ? value : JSON.stringify(value, null, 2)}</code>
    </pre>
  );
}

export function ExamplePage({ example }: { example: TaskExample }) {
  return (
    <DocShell
      title={example.title}
      description={example.summary}
      pills={[example.task, example.tier, `mode: ${example.mode}`, `maxCostUsd: $${example.maxCostUsd}`]}
      prev={example.prev || { href: "/docs/examples", label: "Examples" }}
      next={example.next || { href: "/docs/examples", label: "Examples" }}
    >
      <section>
        <DocSectionTitle
          title="When to use this task"
          desc="Use these examples as starting points, then adapt the input contract to your own product."
        />
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {example.bestFor.map((item) => (
            <div key={item} className="rounded-lg border border-black/10 bg-black/[0.02] px-4 py-3 text-sm font-semibold text-black/70">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <DocSectionTitle
          title="Request JSON"
          desc="Send this payload to /v1/generate with your OneAI API key."
        />
        <div className="mt-6">
          <JsonBlock
            value={{
              type: example.task,
              input: example.input,
              options: {
                llm: {
                  mode: example.mode,
                  maxCostUsd: example.maxCostUsd,
                },
              },
            }}
          />
        </div>
      </section>

      <section className="mt-12">
        <DocSectionTitle
          title="cURL"
          desc="Use Idempotency-Key for production retries and store requestId from the response."
        />
        <div className="mt-6">
          <JsonBlock value={makeCurl(example)} />
        </div>
      </section>

      <section className="mt-12">
        <DocSectionTitle
          title="Example output shape"
          desc="Actual model wording can vary, but your integration should expect the same business-level structure."
        />
        <div className="mt-6">
          <JsonBlock value={example.output} />
        </div>
      </section>

      <section className="mt-12 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-black/10 bg-white p-5">
          <div className="text-sm font-extrabold text-black">Cost control</div>
          <p className="mt-3 text-sm leading-relaxed text-black/65">{example.costAdvice}</p>
        </div>
        <div className="rounded-lg border border-black/10 bg-white p-5">
          <div className="text-sm font-extrabold text-black">Plan requirement</div>
          <p className="mt-3 text-sm leading-relaxed text-black/65">
            This example is available on the <span className="font-bold">{example.tier}</span> tier.
            Free examples are suitable for initial testing. Pro examples are designed for customer-facing workflows.
          </p>
        </div>
      </section>

      <section className="mt-12">
        <DocSectionTitle
          title="Common mistakes"
          desc="Most integration issues come from missing context or using the wrong plan for the task tier."
        />
        <div className="mt-6 grid gap-3">
          {example.commonErrors.map((item) => (
            <div key={item} className="rounded-lg border border-black/10 bg-black/[0.02] p-4 text-sm leading-relaxed text-black/65">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-lg border border-black/10 bg-black p-6 text-white">
        <div className="text-sm font-extrabold">Next step</div>
        <p className="mt-3 text-sm leading-relaxed text-white/70">
          Load the matching preset in Playground, run a real request, then copy the final payload into your backend.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/playground" className="rounded-lg bg-white px-5 py-2 text-sm font-bold text-black hover:bg-white/90">
            Open Playground
          </Link>
          <Link href="/use-cases" className="rounded-lg border border-white/15 bg-white/[0.08] px-5 py-2 text-sm font-bold text-white hover:bg-white/[0.12]">
            View Use Cases
          </Link>
        </div>
      </section>
    </DocShell>
  );
}
