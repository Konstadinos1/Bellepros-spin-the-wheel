-- =============================================================================
--  STEP 2 — LOCK DOWN THE PAYROLL TABLES
--
--  Seven tables in public are readable and writable by anyone holding the anon
--  key: employees, paychecks, tax_tables, pay_periods, paycheck_deductions,
--  employee_deductions, deduction_types. That is payroll data.
--
--  READ THIS BEFORE RUNNING
--
--  * `service_role` ALWAYS bypasses RLS. Server-side code, migrations, admin
--    scripts and the Supabase dashboard keep working no matter what you do here.
--  * RLS only constrains the `anon` and `authenticated` roles — i.e. anything
--    holding the publishable key, which in practice means browsers and phones.
--  * Enabling RLS with NO policy = deny-all for those two roles. That is SAFE,
--    and if no client-side code reads these tables it is also CORRECT and is
--    all you need. Pick VARIANT A.
--  * Only add policies (VARIANT B/C) if a browser client genuinely must read
--    this data. Payroll usually should not be reachable from a browser at all.
--
--  ROLLOUT: run PART 1, verify with PART 3, and keep PART 4 handy to undo.
-- =============================================================================


-- =============================================================================
--  PART 1 — VARIANT A: deny-all (recommended default)
--
--  Closes the hole immediately. No policy is created, so anon/authenticated get
--  nothing; service_role is unaffected. Run this now, then check whether any
--  client-side feature broke — usually nothing does, because payroll is
--  server-side work.
-- =============================================================================

begin;

alter table public.employees            enable row level security;
alter table public.paychecks            enable row level security;
alter table public.tax_tables           enable row level security;
alter table public.pay_periods          enable row level security;
alter table public.paycheck_deductions  enable row level security;
alter table public.employee_deductions  enable row level security;
alter table public.deduction_types      enable row level security;

-- Belt and braces: stop PostgREST from exposing them to the API roles at all,
-- so a future policy added by mistake still cannot leak them to the browser.
revoke all on public.employees,
              public.paychecks,
              public.tax_tables,
              public.pay_periods,
              public.paycheck_deductions,
              public.employee_deductions,
              public.deduction_types
  from anon, authenticated;

commit;

-- Stop here unless a browser client must read these tables.


-- =============================================================================
--  PART 2 — only if a client app genuinely needs access
--
--  Do NOT run these blind. Fill the ownership column in from the audit
--  (step 1, sections B/D/E) so the policy matches how your other tables scope.
--  Every variant below also needs the matching grant restored, e.g.
--     grant select on public.employees to authenticated;
-- =============================================================================

-- ---------------------------------------------------------------------------
--  VARIANT B — per-user ownership
--  Use when the table has a user_id/owner_id column referencing auth.users.
--  Replace <OWNER_COLUMN> with the real column name.
-- ---------------------------------------------------------------------------
-- alter table public.employees enable row level security;
--
-- drop policy if exists employees_own_rows on public.employees;
-- create policy employees_own_rows on public.employees
--   for all
--   to authenticated
--   using      (<OWNER_COLUMN> = auth.uid())
--   with check (<OWNER_COLUMN> = auth.uid());
--
-- grant select, insert, update, delete on public.employees to authenticated;


-- ---------------------------------------------------------------------------
--  VARIANT C — per-business membership (matches an acct_businesses model)
--
--  The helper MUST be `security definer`: a policy that queries the membership
--  table directly re-enters that table's own policy and recurses forever.
--  Adjust the membership table/column names to whatever the audit shows.
-- ---------------------------------------------------------------------------
-- create or replace function public.is_business_member(p_business_id uuid)
-- returns boolean
-- language sql
-- stable
-- security definer
-- set search_path = public
-- as $$
--   select exists (
--     select 1 from public.acct_businesses b
--     where b.id = p_business_id
--       and b.owner_id = auth.uid()      -- <-- adjust to the real membership rule
--   );
-- $$;
--
-- revoke all on function public.is_business_member(uuid) from public;
-- grant execute on function public.is_business_member(uuid) to authenticated;
--
-- alter table public.employees enable row level security;
--
-- drop policy if exists employees_business_member on public.employees;
-- create policy employees_business_member on public.employees
--   for all
--   to authenticated
--   using      (public.is_business_member(business_id))
--   with check (public.is_business_member(business_id));
--
-- grant select, insert, update, delete on public.employees to authenticated;


-- ---------------------------------------------------------------------------
--  VARIANT D — shared reference data (tax_tables, deduction_types)
--
--  These are usually non-sensitive lookups (rates, deduction codes) with no
--  owner column. If a client legitimately needs them, allow read-only and
--  keep writes to service_role.
-- ---------------------------------------------------------------------------
-- alter table public.tax_tables enable row level security;
--
-- drop policy if exists tax_tables_read on public.tax_tables;
-- create policy tax_tables_read on public.tax_tables
--   for select
--   to authenticated
--   using (true);
--
-- grant select on public.tax_tables to authenticated;   -- select only, no writes


-- =============================================================================
--  PART 3 — VERIFY (run after PART 1)
-- =============================================================================

-- 3a. Every one of the seven should now report rls_enabled = true.
select c.relname as table_name,
       c.relrowsecurity as rls_enabled,
       (select count(*) from pg_policy p where p.polrelid = c.oid) as policy_count
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('employees','paychecks','tax_tables','pay_periods',
                    'paycheck_deductions','employee_deductions','deduction_types')
order by c.relname;

-- 3b. Nothing in public should be left unprotected.
select c.relname as still_unprotected
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity
order by c.relname;

-- 3c. Prove the anon role can no longer read. Expect: permission denied
--     (or 0 rows). Run each statement separately.
-- set role anon;
-- select count(*) from public.employees;
-- reset role;

-- 3d. Real-world check — this should now fail or return [] :
--     curl "https://<PROJECT>.supabase.co/rest/v1/employees?select=*" \
--          -H "apikey: <ANON_KEY>"


-- =============================================================================
--  PART 4 — ROLLBACK (only if PART 1 broke a client feature)
--
--  Prefer adding the right policy from PART 2 over turning RLS back off.
--  Reopening these tables restores full public read/write of payroll data.
-- =============================================================================

-- begin;
-- grant select, insert, update, delete on public.employees,
--       public.paychecks, public.tax_tables, public.pay_periods,
--       public.paycheck_deductions, public.employee_deductions,
--       public.deduction_types to anon, authenticated;
--
-- alter table public.employees           disable row level security;
-- alter table public.paychecks           disable row level security;
-- alter table public.tax_tables          disable row level security;
-- alter table public.pay_periods         disable row level security;
-- alter table public.paycheck_deductions disable row level security;
-- alter table public.employee_deductions disable row level security;
-- alter table public.deduction_types     disable row level security;
-- commit;
