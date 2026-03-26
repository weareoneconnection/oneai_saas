export type OneClawTaskRequest = {
  taskName: string;
  steps: Array<{
    id: string;
    action:
      | "api.request"
      | "browser.open"
      | "browser.screenshot"
      | "file.read"
      | "file.write"
      | "message.send"
      | "social.post";
    input: Record<string, unknown>;
    dependsOn?: string[];
  }>;
};

export async function executeOneClawTask(task: OneClawTaskRequest) {
  const baseUrl =
    process.env.ONECLAW_API_BASE_URL ??
    process.env.ONECLAW_BASE_URL ??
    "http://localhost:4100";

  const token =
    process.env.ONECLAW_INTERNAL_TOKEN ??
    process.env.ONECLAW_ADMIN_TOKEN ??
    "";

  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${baseUrl}/v1/tasks/run`, {
    method: "POST",
    headers,
    body: JSON.stringify(task)
  });

  const text = await res.text();

  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    throw new Error(`OneClaw request failed: ${res.status} ${text}`);
  }

  return json;
}