import { DocShell, DocSectionTitle } from "../../_components/DocShell";

export default function Page() {
  return (
    <DocShell
      title="Reference: Schemas"
      description="Task schemas define stable, product-ready responses."
      pills={["Structured JSON", "Task contracts", "Stable clients"]}
      prev={{ href: "/docs/reference/generate", label: "Generate endpoint" }}
      next={{ href: "/docs/reference/errors", label: "Errors" }}
    >
      <DocSectionTitle title="Why schemas" desc="They protect customer integrations and keep API responses predictable." />
      <div className="mt-6 rounded-lg border border-black/10 bg-white p-6">
        <ul className="list-disc pl-5 text-sm text-black/70 space-y-2">
          <li>Clients can render responses without guessing types</li>
          <li>Tasks expose predictable commercial capabilities</li>
          <li>Errors include enough context for customer support</li>
        </ul>
      </div>
    </DocShell>
  );
}
