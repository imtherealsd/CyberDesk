-- CyberDesk synthetic prototype schema.
-- This migration intentionally supports the demo journey only. It contains no real citizen data.

create extension if not exists pgcrypto;

create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  demo_key text not null unique,
  incident_type text,
  description text not null,
  urgency text not null check (urgency in ('low', 'medium', 'high', 'unknown')),
  status text not null default 'draft' check (status in ('draft', 'submitted', 'information_received', 'under_review')),
  is_demo boolean not null default true check (is_demo = true),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.evidence (
  id text primary key,
  incident_id uuid not null references public.incidents(id) on delete cascade,
  type text not null,
  filename text not null,
  source text not null,
  storage_reference text,
  extracted_fields jsonb not null default '[]'::jsonb,
  verification_status text not null default 'candidate' check (verification_status in ('candidate', 'confirmed', 'rejected')),
  is_demo boolean not null default true check (is_demo = true),
  created_at timestamptz not null default now()
);

create table if not exists public.facts (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  fact_type text not null,
  value jsonb not null,
  source text not null,
  confidence numeric(4, 3) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  verification_status text not null default 'candidate' check (verification_status in ('candidate', 'confirmed', 'rejected')),
  verified_at timestamptz,
  is_demo boolean not null default true check (is_demo = true),
  created_at timestamptz not null default now()
);

create table if not exists public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  event_time timestamptz,
  event_type text not null,
  description text not null,
  source text not null,
  verification_status text not null default 'candidate' check (verification_status in ('candidate', 'confirmed', 'rejected')),
  is_demo boolean not null default true check (is_demo = true),
  created_at timestamptz not null default now()
);

create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null unique references public.incidents(id) on delete cascade,
  complaint_text text not null,
  status text not null default 'submitted' check (status in ('submitted', 'information_received', 'under_review')),
  acknowledgement_id text not null,
  is_demo boolean not null default true check (is_demo = true),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.complaint_events (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  status text not null check (status in ('submitted', 'information_received', 'under_review')),
  description text not null,
  timestamp timestamptz not null default now(),
  is_demo boolean not null default true check (is_demo = true)
);

create index if not exists incidents_demo_key_idx on public.incidents(demo_key);
create index if not exists evidence_incident_id_idx on public.evidence(incident_id);
create index if not exists facts_incident_id_idx on public.facts(incident_id);
create index if not exists timeline_events_incident_time_idx on public.timeline_events(incident_id, event_time);
create index if not exists complaint_events_complaint_timestamp_idx on public.complaint_events(complaint_id, timestamp);
create unique index if not exists complaint_events_complaint_status_idx on public.complaint_events(complaint_id, status);

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.incidents, public.evidence, public.facts, public.timeline_events, public.complaints, public.complaint_events to anon, authenticated;

alter table public.incidents enable row level security;
alter table public.evidence enable row level security;
alter table public.facts enable row level security;
alter table public.timeline_events enable row level security;
alter table public.complaints enable row level security;
alter table public.complaint_events enable row level security;

drop policy if exists "demo incidents are visible" on public.incidents;
create policy "demo incidents are visible" on public.incidents for select to anon, authenticated using (is_demo = true);
drop policy if exists "demo incidents can be created" on public.incidents;
create policy "demo incidents can be created" on public.incidents for insert to anon, authenticated with check (is_demo = true);
drop policy if exists "demo incidents can be updated" on public.incidents;
create policy "demo incidents can be updated" on public.incidents for update to anon, authenticated using (is_demo = true) with check (is_demo = true);

drop policy if exists "demo evidence is visible" on public.evidence;
create policy "demo evidence is visible" on public.evidence for select to anon, authenticated using (is_demo = true);
drop policy if exists "demo evidence can be created" on public.evidence;
create policy "demo evidence can be created" on public.evidence for insert to anon, authenticated with check (is_demo = true);
drop policy if exists "demo evidence can be updated" on public.evidence;
create policy "demo evidence can be updated" on public.evidence for update to anon, authenticated using (is_demo = true) with check (is_demo = true);

drop policy if exists "demo facts are visible" on public.facts;
create policy "demo facts are visible" on public.facts for select to anon, authenticated using (is_demo = true);
drop policy if exists "demo facts can be created" on public.facts;
create policy "demo facts can be created" on public.facts for insert to anon, authenticated with check (is_demo = true);

drop policy if exists "demo timeline is visible" on public.timeline_events;
create policy "demo timeline is visible" on public.timeline_events for select to anon, authenticated using (is_demo = true);
drop policy if exists "demo timeline can be created" on public.timeline_events;
create policy "demo timeline can be created" on public.timeline_events for insert to anon, authenticated with check (is_demo = true);

drop policy if exists "demo complaints are visible" on public.complaints;
create policy "demo complaints are visible" on public.complaints for select to anon, authenticated using (is_demo = true);
drop policy if exists "demo complaints can be created" on public.complaints;
create policy "demo complaints can be created" on public.complaints for insert to anon, authenticated with check (is_demo = true);
drop policy if exists "demo complaints can be updated" on public.complaints;
create policy "demo complaints can be updated" on public.complaints for update to anon, authenticated using (is_demo = true) with check (is_demo = true);

drop policy if exists "demo complaint events are visible" on public.complaint_events;
create policy "demo complaint events are visible" on public.complaint_events for select to anon, authenticated using (is_demo = true);
drop policy if exists "demo complaint events can be created" on public.complaint_events;
create policy "demo complaint events can be created" on public.complaint_events for insert to anon, authenticated with check (is_demo = true);

insert into public.incidents (demo_key, incident_type, description, urgency, status, is_demo, updated_at)
values ('hero-financial-fraud', 'Online financial fraud', 'Synthetic bank impersonation and KYC-link scenario.', 'high', 'under_review', true, '2026-08-26 14:48:00+05:30')
on conflict (demo_key) do update set status = excluded.status, updated_at = excluded.updated_at;

insert into public.complaints (incident_id, complaint_text, status, acknowledgement_id, is_demo)
select id, 'Synthetic demo complaint for the CyberDesk tracking experience.', 'under_review', 'CYB-DEMO-84A21', true
from public.incidents where demo_key = 'hero-financial-fraud'
on conflict (incident_id) do nothing;

insert into public.complaint_events (complaint_id, status, description, timestamp, is_demo)
select id, event.status, event.description, event.timestamp, true
from public.complaints,
lateral (values
  ('submitted', 'Synthetic demo report created', '2026-08-26 14:41:00+05:30'::timestamptz),
  ('information_received', 'Synthetic incident information received', '2026-08-26 14:42:00+05:30'::timestamptz),
  ('under_review', 'Synthetic case shown as under review', '2026-08-26 14:48:00+05:30'::timestamptz)
) as event(status, description, timestamp)
where acknowledgement_id = 'CYB-DEMO-84A21'
  and not exists (select 1 from public.complaint_events existing where existing.complaint_id = public.complaints.id);
