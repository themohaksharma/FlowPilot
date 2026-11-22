# FlowPilot deployment configuration

## Frontend environment

Vite reads these public client variables at build time:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (Supabase publishable key or legacy anon key)

They are present in the local `.env.local` and are ignored by Git. Configure both in the deployment provider's build environment before building. Never use a Supabase secret or service-role key in a `VITE_` variable.

## Supabase Auth URLs

In **Authentication → URL Configuration**, set the Site URL to the deployed origin and allowlist the deployed origin's `/onboarding` and `/login` routes. For local development, the origin is `http://127.0.0.1:5174`.

Email/password signup uses email verification; password recovery returns to `/login`. Production email delivery requires a working Supabase SMTP configuration.

## Database

The linked FlowPilot production project has these migrations applied, in order:

1. `supabase/migrations/202611210001_flowpilot_phase2.sql`
2. `supabase/migrations/202611220002_invoice_payment_workflow.sql`
3. `supabase/migrations/202611220003_invoice_management.sql`
4. `supabase/migrations/202611220004_expense_categories.sql`
5. `supabase/migrations/202611220005_invoice_rpc_wrappers.sql`

The owner-check and bootstrap helpers live in the non-exposed `private` schema. Keep RLS enabled. Business data is protected by authenticated policies scoped to the user's business. To apply future migrations, link the intended project and review the dry run before running `npx supabase db push --remote`.

Invoice save and delete routines have authenticated wrappers in `public`. The payment-allocation routine remains private while the browser payment page calls it through the public PostgREST API; in-app payment recording needs a corresponding authenticated wrapper before it can be considered verified.

## Static hosting

No production hosting provider or deployment rewrite configuration is present in this project. Configure the host to serve the Vite `dist/` output and rewrite unknown paths to `/index.html` so direct refreshes of client-side routes work. Add the two frontend environment variables and the deployed Auth redirect URLs above. No server-side Supabase key is required by this frontend.
