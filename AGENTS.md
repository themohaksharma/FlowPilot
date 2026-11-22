# FlowPilot project rules

- Continue the existing FlowPilot prototype; do not recreate it or alter unrelated projects.
- Preserve the public homepage, its visual identity, and working motion. Keep sections modular and keep direct route refreshes working.
- Keep brand configuration in `src/config/brand.ts` and design tokens in `src/styles/tokens.css`.
- Keep claims accurate. Mark illustrative figures; do not claim external messages are sent or workflows are verified unless they were tested.
- Supabase browser code may use only the publishable/anon key. Never expose a service-role or secret key.
- Preserve RLS and business-level data isolation. Make database changes as additive migrations; review remote dry runs and never reset a database to apply changes.
- Use semantic, keyboard-accessible, responsive UI and respect `prefers-reduced-motion`. Scope GSAP work and clean up contexts/listeners.
- Do not add dependencies without a clear need. Do not stage local environment files, Supabase CLI state, browser traces, or build output.
- Run `npm run check` after implementation changes. Report only checks that actually ran.
