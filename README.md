# FlowPilot

FlowPilot is a small-business finance workspace prototype built with React, TypeScript, Vite, and Supabase. Its public site uses a cinematic editorial style; the private workspace focuses on saved business records and clear financial summaries.

## Current application

- Public homepage with responsive sections, GSAP motion, reduced-motion support, and light/dark themes.
- Supabase email/password signup, login, session restoration, protected routes, and business onboarding.
- Business dashboard with receivables, overdue invoices, collections, bills, setup checklist, and action items based on saved records.
- Customer and invoice management, line items, invoice status derivation, and PDF generation.
- Expense and supplier-bill records, reminder drafts and history, cash-flow views, reports, and CSV exports.

Reminder messages are drafts; FlowPilot does not send email or WhatsApp messages. Financial figures should come from the authenticated business's saved records. Illustrative homepage data is labeled as such.

## Requirements

- Node.js 20.19+ or 22.12+.
- A Supabase project for authentication and private workspace data.

## Local setup

```sh
npm install
cp .env.example .env.local
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local` using the project URL and publishable/anon key. Never put a Supabase secret or service-role key in a `VITE_` variable. `.env.local` is ignored by Git.

Run the application at [http://127.0.0.1:5174](http://127.0.0.1:5174):

```sh
npm run dev
```

Configure Supabase Auth's Site URL and redirect allowlist for the local origin and `/onboarding` and `/login`. Email confirmation must be enabled for verified signup. See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for migration and deployment details.

## Checks and browser tests

```sh
npm run lint
npm run typecheck
npm run build
npm run check
```

Install the Playwright Chromium browser once, then run the browser suite:

```sh
npx playwright install chromium
npm run test:e2e
```

The authenticated invoice test requires a dedicated, verified QA account that has completed onboarding. Set `FLOWPILOT_TEST_EMAIL` and `FLOWPILOT_TEST_PASSWORD` only in the test process; do not commit or paste credentials. Run it with tracing disabled because browser traces can capture form input:

```sh
npx playwright test tests/browser/invoice-management-auth.spec.ts --project=desktop --trace=off
```

The authenticated PDF download has not been verified. The current browser suite's PDF helper test does not prove a saved, authenticated invoice download.

## Database migrations

The migration files are in `supabase/migrations/`. For a new Supabase project, link the intended project and review the pending changes before applying:

```sh
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push --dry-run --remote
npx supabase db push --remote
```

Do not reset a linked database to apply migrations. The linked FlowPilot project currently has migrations `202611210001` through `202611220005` applied. The application uses only a publishable/anon key; row-level security policies and private database functions enforce business access.

## Deployment

Build with `npm run build` and publish the `dist/` directory. Set the two Vite environment variables in the hosting provider's build environment, configure the provider to rewrite client-side routes to `/index.html`, and add the deployed `/onboarding` and `/login` URLs to Supabase Auth's redirect allowlist. No hosting provider is configured in this repository.

## Known verification limits

- The application requests password recovery emails, but the current UI does not handle the recovery session or provide a new-password form.
- The payment page calls `public.record_invoice_payment`, while the migration defines that function in the non-exposed `private` schema. In-app payment recording therefore requires an API wrapper before it can be treated as verified.
- Authenticated invoice PDF download verification is incomplete.
- Automated authenticated tests cover invoice flows only; do not treat the other business workflows as end-to-end verified from the current suite.
