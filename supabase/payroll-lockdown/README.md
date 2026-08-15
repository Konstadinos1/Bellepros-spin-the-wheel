# Payroll RLS lockdown — run on next restore

The Supabase project **`bellepros-wheel` (`hhkmoxwizuhwfnmmdihg`)** has seven tables in
`public` with **Row Level Security disabled**: `employees`, `paychecks`, `tax_tables`,
`pay_periods`, `paycheck_deductions`, `employee_deductions`, `deduction_types`. Anyone
holding the anon (publishable) key can read and write them — and that key is public by
design. This is payroll data.

The project is currently **paused**, so the hole is dormant: a paused project serves no
API. **The moment you restore it, run this — before anything else:**

1. **`01-audit.sql`** — read-only. Confirms the table list, shows their columns, and
   (section D) dumps how the already-protected tables scope access.
2. **`02-enable-rls.sql` — PART 1 only** — enables RLS on all seven and revokes the API
   roles. No policies: RLS with no policy is deny-all for `anon`/`authenticated`, while
   `service_role` (server code, dashboard, migrations) always bypasses RLS and keeps
   working. Payroll should not be reachable from a browser at all.
3. **PART 3** of the same file verifies. PARTS 2/4 hold opt-in policy variants and a
   rollback, all commented out.

These are **not** in `supabase/migrations/` on purpose: `02` requires a human choice
(PART 1 vs the policy variants) and must never auto-run as a migration.

Verified on a real PostgreSQL 16 replica of the vulnerable shape: after PART 1, `anon`
and `authenticated` get *permission denied* on every read and write, `service_role`
still reads and writes normally, and data is untouched.

**Related, more urgent while the project sleeps:** rotate the Supabase management token
(and GitHub PAT, ZAI + Gemini keys) committed in `continue-here-metaprompt`'s README —
they are in git history, and the `sbp_…` token can restore this project and read
everything. Deleting the file does not revoke them.
