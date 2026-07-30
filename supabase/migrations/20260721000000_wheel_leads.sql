-- ============================================================================
--  La Roue de Fortune — central lead capture for the Bellepros wheel
--  Run this in your Supabase project (SQL editor, or `supabase db push`).
--
--  Security model: the public marketing page inserts leads using the anon
--  (publishable) key. RLS allows INSERT ONLY — nobody with the anon key can
--  read, update, or delete rows. Read the PII with the service role (dashboard
--  Table editor / SQL editor) or a server-side export.
-- ============================================================================

create table if not exists public.wheel_leads (
  id            uuid primary key default gen_random_uuid(),
  inserted_at   timestamptz not null default now(),  -- server time (authoritative)
  created_at    timestamptz,                          -- client-reported time
  location      text,
  name          text,
  phone         text,
  email         text,
  consent       boolean default false,
  prize         text,
  code          text,
  ref_code      text,
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  utm_content   text,
  ref           text
);

comment on table public.wheel_leads is
  'Marketing leads captured by the Roue de Fortune wheel. Insert-only for anon; PII readable only via service role.';

alter table public.wheel_leads enable row level security;

-- Public form can INSERT only. No SELECT/UPDATE/DELETE policy => those are denied
-- for anon/authenticated. Modest length caps blunt spam payloads.
drop policy if exists "wheel_leads_insert_anon" on public.wheel_leads;
create policy "wheel_leads_insert_anon"
  on public.wheel_leads
  for insert
  to anon, authenticated
  with check (
    char_length(coalesce(name, ''))  <= 120 and
    char_length(coalesce(phone, '')) <= 40  and
    char_length(coalesce(email, '')) <= 200 and
    char_length(coalesce(code, ''))  <= 40
  );

create index if not exists wheel_leads_location_idx    on public.wheel_leads (location);
create index if not exists wheel_leads_inserted_at_idx on public.wheel_leads (inserted_at desc);

-- ----------------------------------------------------------------------------
-- Owner exports (run as service role / in the SQL editor):
--   select * from public.wheel_leads order by inserted_at desc;
--   -- consented contacts only:
--   select name, phone, email, location, inserted_at
--   from public.wheel_leads where consent = true order by inserted_at desc;
-- ----------------------------------------------------------------------------
