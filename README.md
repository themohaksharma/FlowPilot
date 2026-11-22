# FlowPilot



> **Everything your business needs to flow.**
>
> Less chaos. More control.

FlowPilot is a financial management workspace prototype for small businesses. It brings customer records, invoices, payments, expenses, payment follow-ups and cash-flow visibility into one place.

## What’s included

- **Public homepage** — responsive editorial design, GSAP storytelling animations, reduced-motion support and light/dark themes.
- **Accounts and onboarding** — Supabase email/password authentication, session restoration, protected routes and business setup.
- **Financial workspace** — business dashboard and saved-record summaries for receivables, overdue invoices, collections, bills and setup actions.
- **Invoices and customers** — customer records, invoice line items, derived payment status, payment history and invoice PDF generation.
- **Business operations** — expenses, supplier bills, reminder drafts and history, cash-flow views, reports and CSV exports.

Reminder content is prepared as a draft; the application does not send email or WhatsApp messages. Workspace financial values are intended to come from the authenticated business’s saved records. Any illustrative figures on the public homepage are labeled as examples.

## Technology

React · TypeScript · Vite · React Router · Supabase · PostgreSQL · GSAP / ScrollTrigger · Lucide · Playwright

## Run locally

### Requirements

- Node.js 20.19+ or 22.12+
- npm
- A Supabase project for authentication and workspace data

### Setup

```sh
npm install
cp .env.example .env.local
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local` using the Supabase project URL and publishable/anon key. Never put a service-role or secret key in frontend configuration. `.env.local` is excluded from Git.

Configure the Supabase Auth Site URL and redirect allowlist for your local origin and the app’s `/login` and `/onboarding` routes. See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for project linking, migrations and auth setup.

Start the Vite server at [http://127.0.0.1:5174](http://127.0.0.1:5174):

```sh
npm run dev
```

## Quality checks and browser tests

```sh
npm run lint
npm run typecheck
npm run build
npm run check
```

Install Playwright’s Chromium browser and run the browser suite:

```sh
npx playwright install chromium
npm run test:e2e
```

The authenticated invoice test uses a dedicated, email-verified QA account that has completed onboarding. Provide `FLOWPILOT_TEST_EMAIL` and `FLOWPILOT_TEST_PASSWORD` only to the local test process. Never commit or share those values. Tracing is disabled for the authenticated test because traces may capture form input:

```sh
npx playwright test tests/browser/invoice-management-auth.spec.ts --project=desktop --trace=off
```

Authenticated PDF download verification is incomplete; the PDF helper test does not verify a saved, authenticated invoice download.

## Database migrations

Migration files are in `supabase/migrations/`. For a new Supabase project, link the intended project and inspect the dry run before applying migrations:

```sh
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push --dry-run --remote
npx supabase db push --remote
```

Do not reset a linked database to apply migrations. The configured FlowPilot project has migrations `202611210001` through `202611220005` applied. The client uses a publishable/anon key; row-level security and private database functions enforce business data access.

## Project structure

```text
src/
  app/                 Application routes and providers
  auth/                Authentication and protected-route logic
  components/          Shared interface components
  config/              Centralized brand and application configuration
  lib/                 Supabase client and data utilities
  pages/               Public, authentication and workspace pages
  sections/            Public homepage storytelling sections
  styles/              Global styles and design tokens
supabase/
  migrations/          Database schema, functions and RLS policies
tests/
  browser/             Playwright browser tests
docs/                  Product, design and setup documentation
public/                Static public assets
```

## Deployment

Build with `npm run build` and publish `dist/` from a static host. Set the two Vite environment variables in the host’s build environment, configure client-side route fallback to `/index.html`, and add the deployed `/login` and `/onboarding` URLs to the Supabase Auth redirect allowlist. This repository does not configure a hosting provider.

## Current verification limits

- Password recovery can request an email, but the UI does not yet complete the recovery session or provide a new-password form.
- The payment page calls `public.record_invoice_payment`, while the migration defines the function in the non-exposed `private` schema. In-app payment recording needs an API wrapper before it can be treated as verified.
- Authenticated invoice PDF download verification is incomplete.
- Automated authenticated browser coverage currently focuses on invoice flows; other financial workflows should not be considered end-to-end verified based on that suite alone.
