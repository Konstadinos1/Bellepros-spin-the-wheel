-- =============================================================================
--  STEP 1 — AUDIT (read-only, changes nothing)
--
--  Run this first in the Supabase SQL editor. It answers the two questions
--  that decide what the policies in step 2 must look like:
--    A. What columns do the exposed tables actually have?
--    B. How do your ALREADY-protected tables scope access? Match that pattern
--       rather than inventing a second one.
--
--  Paste the output back and the migration can be finalised against it.
-- =============================================================================

-- --- A. Which public tables are currently unprotected? ---
select c.relname as table_name,
       c.relrowsecurity as rls_enabled,
       (select count(*) from pg_policy p where p.polrelid = c.oid) as policy_count,
       pg_size_pretty(pg_total_relation_size(c.oid)) as size,
       (select reltuples::bigint from pg_class where oid = c.oid) as approx_rows
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by c.relrowsecurity, c.relname;

-- --- B. Columns of the seven exposed tables (look for the ownership column) ---
select table_name, ordinal_position as pos, column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name in ('employees','paychecks','tax_tables','pay_periods',
                     'paycheck_deductions','employee_deductions','deduction_types')
order by table_name, ordinal_position;

-- --- C. Foreign keys: how these tables hang together ---
select tc.table_name,
       kcu.column_name,
       ccu.table_name  as references_table,
       ccu.column_name as references_column
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on kcu.constraint_name = tc.constraint_name and kcu.table_schema = tc.table_schema
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name and ccu.table_schema = tc.table_schema
where tc.constraint_type = 'FOREIGN KEY' and tc.table_schema = 'public'
  and tc.table_name in ('employees','paychecks','tax_tables','pay_periods',
                        'paycheck_deductions','employee_deductions','deduction_types')
order by tc.table_name;

-- --- D. THE IMPORTANT ONE: how do your protected tables already scope access? ---
select c.relname as table_name,
       p.polname  as policy_name,
       p.polcmd   as command,
       pg_get_expr(p.polqual, p.polrelid)      as using_expression,
       pg_get_expr(p.polwithcheck, p.polrelid) as with_check_expression
from pg_policy p
join pg_class c on c.oid = p.polrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
order by c.relname, p.polname;

-- --- E. Do any of the seven have a user/business/tenant column at all? ---
select table_name, column_name
from information_schema.columns
where table_schema = 'public'
  and table_name in ('employees','paychecks','tax_tables','pay_periods',
                     'paycheck_deductions','employee_deductions','deduction_types')
  and (column_name ilike '%user%' or column_name ilike '%owner%'
       or column_name ilike '%business%' or column_name ilike '%tenant%'
       or column_name ilike '%org%'      or column_name ilike '%company%'
       or column_name ilike '%store%'    or column_name ilike '%location%')
order by table_name, column_name;
