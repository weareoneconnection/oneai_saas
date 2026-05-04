# OneAI SaaS

Commercial full-model AI infrastructure for model routing, task intelligence, usage, billing, and cost control.

OneAI is the unified intelligence coordination brain. It does not execute actions directly. OneClaw and bots handle execution; OneAI returns model responses, structured plans, task outputs, request metadata, usage, and cost signals through commercial APIs.

## Production APIs

| API | Purpose |
| --- | --- |
| `POST /v1/chat/completions` | OpenAI-compatible model gateway with streaming support |
| `GET /v1/models` | Model catalog, readiness, pricing, health metadata |
| `POST /v1/models/health` | Lightweight per-model health check |
| `POST /v1/models/estimate` | Token-based cost estimation before traffic |
| `POST /v1/generate` | Structured task intelligence through OneAI workflows |
| `GET /v1/tasks` | Productized task registry with tiers, schema, maturity, and execution boundary |
| `GET /v1/usage/summary` | Customer usage summary |
| `GET /v1/billing/status` | Plan, policy, Stripe, and monthly allowance state |

## SaaS Console

| Page | Purpose |
| --- | --- |
| Dashboard | Production readiness, usage, costs, keys, model health |
| Playground | Test Task API and Chat API |
| Models | Catalog sync, health checks, pricing, cost estimator |
| Tasks | OneAI task intelligence registry |
| API Keys | Create, rotate, revoke, set RPM, budget, scopes |
| Usage | Requests, tokens, cost, failures by model/task/key/provider |
| Billing | Plans, usage allowance, Stripe readiness, plan permissions |
| Docs | Quickstart and API reference |

## Local Development

Install dependencies:

```bash
pnpm install
```

Generate Prisma client:

```bash
pnpm prisma:generate
```

Run API:

```bash
npm --prefix apps/api run dev
```

Run Web:

```bash
npm --prefix apps/web run dev
```

Build before release:

```bash
npm --prefix apps/api run build
npm --prefix apps/web run build -- --webpack
```

## Production Smoke Test

After Railway deploy:

```bash
ONEAI_API_BASE_URL=https://oneai-saas-api-production.up.railway.app \
ONEAI_SMOKE_API_KEY=replace_with_production_api_key \
./scripts/smoke-prod.sh
```

The script checks health, models, model health, cost estimate, tasks, chat completions, and one generate task.

## Required Production Environment

API service:

- `DATABASE_URL`
- `PORT`
- `APP_URL`
- `ADMIN_API_KEY`
- `API_KEYS`
- `REDIS_URL`
- `OPENAI_API_KEY`
- Optional provider keys: `OPENROUTER_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `XAI_API_KEY`, `DEEPSEEK_API_KEY`, `QWEN_API_KEY`, `MOONSHOT_API_KEY`, `DOUBAO_API_KEY`, etc.
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_TEAM`

Web service:

- `NEXT_PUBLIC_SITE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `DATABASE_URL`
- `ONEAI_API_BASE_URL`
- `ONEAI_API_KEY`
- `ONEAI_ADMIN_API_KEY`
- `ONEAI_CONSOLE_USER_EMAIL`
- `ONEAI_CONSOLE_PASSWORD`
- `NEXT_PUBLIC_STRIPE_PRICE_PRO`
- `NEXT_PUBLIC_STRIPE_PRICE_TEAM`

Use `apps/api/.env.example` and `apps/web/.env.example` as templates. Do not commit real production secrets.

## Commercial Boundary

OneAI:

- routes models
- generates structured intelligence
- estimates and records cost
- enforces plan and API policy
- exposes task intelligence APIs

OneAI does not:

- post to social networks
- execute external workflows
- mutate real-world systems directly

Execution belongs to OneClaw and bots.

## Release Checklist

- API build passes
- Web build passes
- Prisma client generated
- Railway API health returns `ok`
- `/v1/models` returns configured models
- `/v1/models/health` passes for the default production model
- `/v1/models/estimate` returns nonzero cost for priced models
- `/v1/tasks` returns task metadata
- `/v1/chat/completions` returns a live response
- `/v1/generate` returns a structured task output
- Web login works
- Dashboard, Models, Tasks, Keys, Usage, Billing, Docs load
- Stripe checkout and webhook env are configured before paid launch

## Current Positioning

OneAI SaaS competes as:

1. an OpenAI-compatible model gateway,
2. a structured task intelligence API,
3. a cost-aware commercial AI infrastructure layer.

The moat is not only access to models. The moat is model routing plus OneAI task intelligence plus commercial usage and billing controls.
