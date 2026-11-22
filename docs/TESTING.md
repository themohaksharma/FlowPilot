# FlowPilot testing

Run static checks and production build with:

```sh
npm run check
```

Install the Playwright Chromium browser before the first browser run, then run the suite:

```sh
npx playwright install chromium
npm run test:e2e
```

The authenticated invoice test is opt-in and requires a dedicated Supabase QA account with verified email and completed onboarding. Create it through `/signup`; never insert test users directly into `auth.users` and never point the test at a real business.

Supply `FLOWPILOT_TEST_EMAIL` and `FLOWPILOT_TEST_PASSWORD` only to the test process. Browser traces can capture form input, so run the authenticated test with tracing disabled:

```sh
npx playwright test tests/browser/invoice-management-auth.spec.ts --project=desktop --trace=off
```

That test creates a uniquely named QA customer and draft/unpaid invoices, edits them, attempts a PDF download, and cleans up its test records. Other financial workflows do not yet have authenticated end-to-end coverage. The authenticated invoice PDF download has not been verified; the PDF helper test is not equivalent to downloading a saved invoice from the authenticated workspace.
