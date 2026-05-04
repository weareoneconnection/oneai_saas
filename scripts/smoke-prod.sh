#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${ONEAI_API_BASE_URL:-https://oneai-saas-api-production.up.railway.app}"
API_KEY="${ONEAI_SMOKE_API_KEY:-${ONEAI_API_KEY:-}}"
MODEL_PROVIDER="${ONEAI_SMOKE_PROVIDER:-openai}"
MODEL_NAME="${ONEAI_SMOKE_MODEL:-gpt-5.2}"

if [[ -z "$API_KEY" ]]; then
  echo "Missing ONEAI_SMOKE_API_KEY or ONEAI_API_KEY" >&2
  exit 1
fi

require_jq() {
  if ! command -v jq >/dev/null 2>&1; then
    echo "jq is required for smoke-prod.sh" >&2
    exit 1
  fi
}

json_post() {
  local path="$1"
  local body="$2"
  curl -sS -X POST "$BASE_URL$path" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $API_KEY" \
    -d "$body"
}

json_get_bearer() {
  local path="$1"
  curl -sS "$BASE_URL$path" \
    -H "Authorization: Bearer $API_KEY"
}

json_get_x_key() {
  local path="$1"
  curl -sS "$BASE_URL$path" \
    -H "x-api-key: $API_KEY"
}

require_jq

echo "OneAI production smoke test"
echo "Base URL: $BASE_URL"
echo

echo "1. Health"
curl -sS "$BASE_URL/health" | jq -e '.status == "ok"' >/dev/null
echo "   ok"

echo "2. Models"
json_get_bearer "/v1/models" | jq -e '.object == "list" and (.data | length > 0)' >/dev/null
echo "   ok"

echo "3. Model health: $MODEL_PROVIDER:$MODEL_NAME"
json_post "/v1/models/health" "{\"provider\":\"$MODEL_PROVIDER\",\"model\":\"$MODEL_NAME\"}" \
  | jq -e '.success == true and .data.ok == true' >/dev/null
echo "   ok"

echo "4. Model cost estimate"
json_post "/v1/models/estimate" "{\"provider\":\"$MODEL_PROVIDER\",\"model\":\"$MODEL_NAME\",\"promptTokens\":1000,\"completionTokens\":500}" \
  | jq -e '.success == true and .data.canEstimate == true and .data.estimatedCostUsd > 0' >/dev/null
echo "   ok"

echo "5. Tasks"
json_get_x_key "/v1/tasks" | jq -e '.success == true and (.data | length > 0)' >/dev/null
echo "   ok"

echo "6. Chat completions"
json_post "/v1/chat/completions" "{\"model\":\"$MODEL_PROVIDER:$MODEL_NAME\",\"messages\":[{\"role\":\"user\",\"content\":\"Say OneAI smoke test ok.\"}],\"max_completion_tokens\":80}" \
  | jq -e '.choices[0].message.content | length > 0' >/dev/null
echo "   ok"

echo "7. Generate task"
curl -sS -X POST "$BASE_URL/v1/generate" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{"type":"agent_plan","input":{"goal":"Create a short OneAI launch checklist"},"options":{"llm":{"mode":"cheap","maxCostUsd":0.03}}}' \
  | jq -e '.success == true and .requestId' >/dev/null
echo "   ok"

echo
echo "OneAI production smoke test passed."
