# Sample.fm

Elite music marketing SmartLink and pre-save platform for independent creators
and labels in the African music market — modeled on Feature.fm's product and
feature set.

## Stack

- Next.js 14 (Pages Router) + React 18
- Tailwind CSS (dark, glassmorphic UI)
- Prisma ORM + PostgreSQL
- JWT (httpOnly cookie) auth with bcrypt password hashing
- Paystack subscription billing via signed webhook

## 2-Tier Monetization

| | Free | Premium ($16/mo) |
|---|---|---|
| SmartLinks | Unlimited | Unlimited |
| Sample.fm branding footer | Shown | Hidden |
| Facebook / TikTok retargeting pixels | Blocked server-side | Enabled |
| Custom domain | Blocked server-side | Enabled |

`/api/links/create` enforces this server-side: if the authenticated user's
`is_pro` flag is `false`, any `pixel_fb`, `pixel_tiktok`, or custom-domain
input in the request body is sanitized and dropped before the record is ever
written — never partially persisted.

## Local Setup

```bash
npm install
cp .env.example .env      # fill in DATABASE_URL, JWT_SECRET, PAYSTACK_SECRET_KEY
npx prisma migrate dev --name init
npm run dev
```

App runs at http://localhost:3000.

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import the repo in Vercel.
3. Add environment variables from `.env.example` in the Vercel project
   settings (use a hosted Postgres instance — Neon, Supabase, or Railway
   all work well).
4. Vercel will run `prisma generate && next build` automatically
   (see `vercel.json`).
5. Run `npx prisma migrate deploy` against your production `DATABASE_URL`
   (locally, or via a one-off Vercel deploy hook) to create the tables.
6. Point your Paystack subscription webhook at
   `https://<your-domain>/api/paystack-webhook`.

## Key Routes

- `/` — marketing + register/login
- `/dashboard` — Creator Dashboard (SSR-protected)
- `/[slug]` — public fan-facing SmartLink landing page
- `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`
- `/api/links/create`, `/api/links/list`
- `/api/analytics/track`, `/api/analytics/summary`
- `/api/presave/register`
- `/api/paystack-webhook`
- `/api/dev/simulate-upgrade` — dev-only Paystack success simulator
- `/api/user/update-domain` — Premium-gated custom domain setter

## Notes

- Fan country is read from `x-vercel-ip-country` / `cf-ipcountry` edge
  headers in production. In local dev, append `?demo_country=NG` to any
  SmartLink URL to simulate a fan browsing from Nigeria and see Audiomack /
  Boomplay bubble to the top with their brand colors.
- The dashboard's "[Simulate Paystack $16 Subscription Success]" button
  calls `/api/dev/simulate-upgrade`, which flips `is_pro` the same way the
  real `/api/paystack-webhook` does on a verified `charge.success` event —
  useful for demoing the tier gates without a live Paystack integration.
