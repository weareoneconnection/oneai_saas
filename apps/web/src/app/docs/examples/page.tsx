import Link from "next/link";
import { DocShell, DocSectionTitle } from "../_components/DocShell";
import { exampleOrder, examples } from "./_data";

export default function ExamplesPage() {
  return (
    <DocShell
      title="Task Examples"
      description="Copyable examples for the most important OneAI commercial tasks."
      pills={["/v1/generate", "Free + Pro", "copyable JSON", "cost controls"]}
      prev={{ href: "/docs/guides/production-checklist", label: "Production Checklist" }}
      next={{ href: "/docs/examples/business-strategy", label: "Business Strategy" }}
    >
      <DocSectionTitle
        title="Start with a business task"
        desc="Each example includes an input payload, output shape, plan requirement, cost guidance, and common mistakes."
      />

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {exampleOrder.map((slug) => {
          const item = examples[slug];
          return (
            <Link
              key={item.slug}
              href={`/docs/examples/${item.slug}`}
              className="rounded-lg border border-black/10 bg-white p-5 transition hover:border-black/25 hover:bg-black/[0.02]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-extrabold text-black">{item.title}</div>
                  <code className="mt-2 block text-xs font-semibold text-black/55">{item.task}</code>
                </div>
                <span className="rounded-full bg-black/[0.06] px-3 py-1 text-xs font-bold text-black/60">
                  {item.tier}
                </span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-black/60">{item.summary}</p>
            </Link>
          );
        })}
      </div>
    </DocShell>
  );
}
