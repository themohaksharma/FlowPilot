# Build plan and current status

## Implemented prototype

- Public homepage with responsive editorial scenes, interactions, and GSAP motion.
- Supabase email/password auth scaffolding, protected routes, business onboarding, and dashboard.
- Customer and invoice management, invoice PDF generation, payment/reminder interface, expense and bill records, cash-flow views, reports, and CSV export.
- Light/dark theme support and business-scoped database policies/migrations.

## Remaining release verification

1. Add a complete password-recovery completion screen.
2. Expose the existing private payment-allocation function through a narrowly scoped authenticated PostgREST wrapper.
3. Run authenticated end-to-end tests for saved invoices, payments, expenses, reminders, forecasts, notifications, and reports using a dedicated QA business.
4. Verify authenticated invoice PDF download in a browser.
5. Select and configure a static hosting provider, including SPA route fallback and Supabase redirect URLs.

Keep financial calculations deterministic and auditable. Do not claim these remaining items are complete before testing them.
