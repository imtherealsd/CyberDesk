-- ====================================================================
-- CyberDesk Complete Supabase Database Schema & Setup
-- Clean Setup: Drops any outdated partial tables and rebuilds fresh
-- ====================================================================

-- 1. Enable Extensions
create extension if not exists pgcrypto;

-- 2. Clean up any existing partial / legacy tables
drop table if exists public.complaint_events cascade;
drop table if exists public.complaints cascade;
drop table if exists public.timeline_events cascade;
drop table if exists public.facts cascade;
drop table if exists public.evidence cascade;
drop table if exists public.case_members cascade;
drop table if exists public.incidents cascade;
drop table if exists public.profiles cascade;

-- 3. Create Storage Bucket (Private Evidence Vault)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cyberdesk-evidence',
  'cyberdesk-evidence',
  false,
  5242880, -- 5 MB limit
  array['image/png', 'image/jpeg', 'application/pdf', 'text/plain']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/png', 'image/jpeg', 'application/pdf', 'text/plain'];

-- 4. Profiles Table (Synchronized with auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = pg_catalog, public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do update set email = excluded.email, updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert or update of email on auth.users
  for each row execute function public.handle_new_user();
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- 5. Core Incidents Table
create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  demo_key text unique,
  incident_type text,
  description text not null,
  urgency text not null check (urgency in ('low', 'medium', 'high', 'unknown')),
  status text not null default 'draft' check (status in ('draft', 'submitted', 'information_received', 'under_review')),
  is_demo boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint incidents_real_owner_check check (is_demo = true or created_by is not null)
);

create index incidents_demo_key_idx on public.incidents(demo_key);
create index incidents_created_by_idx on public.incidents(created_by);
create index incidents_status_idx on public.incidents(status);

-- 6. Case Members Table (Multi-User Collaboration & Ownership)
create table public.case_members (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'collaborator', 'viewer')),
  created_at timestamptz not null default now(),
  constraint case_members_incident_user_unique unique (incident_id, user_id)
);

create index case_members_user_id_idx on public.case_members(user_id);
create index case_members_incident_id_idx on public.case_members(incident_id);

-- 7. Helper Security Functions for Membership & Roles
create or replace function public.is_case_member(lookup_incident_id uuid)
returns boolean language sql security definer stable
set search_path = pg_catalog, public
as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.case_members
    where incident_id = lookup_incident_id and user_id = (select auth.uid())
  );
$$;

create or replace function public.is_case_owner(lookup_incident_id uuid)
returns boolean language sql security definer stable
set search_path = pg_catalog, public
as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.case_members
    where incident_id = lookup_incident_id and user_id = (select auth.uid()) and role = 'owner'
  );
$$;

revoke all on function public.is_case_member(uuid), public.is_case_owner(uuid) from public, anon, authenticated;
grant execute on function public.is_case_member(uuid), public.is_case_owner(uuid) to authenticated;

-- 8. Evidence Table
create table public.evidence (
  id text primary key,
  incident_id uuid not null references public.incidents(id) on delete cascade,
  type text not null,
  category text not null default 'other',
  filename text not null,
  source text not null,
  storage_reference text,
  mime_type text,
  upload_status text not null default 'pending',
  extraction_status text not null default 'pending',
  extraction_notes text,
  extracted_fields jsonb not null default '[]'::jsonb,
  verification_status text not null default 'candidate' check (verification_status in ('candidate', 'confirmed', 'rejected')),
  is_demo boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index evidence_incident_id_idx on public.evidence(incident_id);
create index evidence_category_idx on public.evidence(category);
create index evidence_storage_reference_idx on public.evidence(storage_reference);

-- 9. Facts Table (Verified Incident Facts)
create table public.facts (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  evidence_id text references public.evidence(id) on delete cascade,
  field_key text not null,
  fact_type text not null,
  value jsonb not null,
  source text not null,
  confidence numeric(4, 3) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  verification_status text not null default 'candidate' check (verification_status in ('candidate', 'confirmed', 'rejected')),
  verified_at timestamptz,
  provenance jsonb default '{}'::jsonb,
  is_demo boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint facts_incident_evidence_field_unique unique (incident_id, evidence_id, field_key)
);

create index facts_incident_id_idx on public.facts(incident_id);
create index facts_field_key_idx on public.facts(field_key);
create index facts_evidence_id_idx on public.facts(evidence_id);

-- 10. Timeline Events Table
create table public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  evidence_id text references public.evidence(id) on delete cascade,
  event_key text not null,
  event_time timestamptz,
  event_time_label text,
  time_precision text check (time_precision in ('exact', 'approximate', 'unknown', 'range')),
  event_type text not null,
  description text not null,
  source text not null,
  verification_status text not null default 'candidate' check (verification_status in ('candidate', 'confirmed', 'rejected')),
  is_demo boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint timeline_events_incident_event_key_unique unique (incident_id, event_key)
);

create index timeline_events_incident_time_idx on public.timeline_events(incident_id, event_time);
create index timeline_events_event_key_idx on public.timeline_events(event_key);
create index timeline_events_evidence_id_idx on public.timeline_events(evidence_id);

-- 11. Complaints & Audit Trail
create table public.complaints (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null unique references public.incidents(id) on delete cascade,
  complaint_text text not null,
  status text not null default 'submitted' check (status in ('submitted', 'information_received', 'under_review')),
  acknowledgement_id text not null,
  is_demo boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.complaint_events (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  status text not null check (status in ('submitted', 'information_received', 'under_review')),
  description text not null,
  timestamp timestamptz not null default now(),
  is_demo boolean not null default false
);

create index complaint_events_complaint_timestamp_idx on public.complaint_events(complaint_id, timestamp);

-- 12. Immutability Triggers
create or replace function public.prevent_incident_identity_mutation()
returns trigger language plpgsql set search_path = pg_catalog, public
as $$
begin
  if new.is_demo is distinct from old.is_demo or new.created_by is distinct from old.created_by
     or new.demo_key is distinct from old.demo_key then
    raise exception 'case identity fields cannot be changed';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_incident_identity_mutation_trigger on public.incidents;
create trigger prevent_incident_identity_mutation_trigger
  before update on public.incidents
  for each row execute function public.prevent_incident_identity_mutation();

-- 13. Storage Path Policy Functions
create or replace function public.is_case_storage_path(object_name text)
returns boolean
language plpgsql
security definer
stable
set search_path = pg_catalog, public
as $$
declare
  folders text[];
  case_id uuid;
  evidence_id text;
begin
  folders := storage.foldername(object_name);

  if cardinality(folders) <> 3
     or folders[1] <> 'cases'
     or folders[2] !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
     or folders[3] !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
     or storage.filename(object_name) !~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,79}\.(png|jpg|jpeg|pdf|txt)$' then
    return false;
  end if;

  case_id := folders[2]::uuid;
  evidence_id := folders[3];

  return public.is_case_member(case_id)
    and exists (
      select 1
      from public.evidence e
      where e.id = evidence_id
        and e.incident_id = case_id
        and e.is_demo = false
    );
end;
$$;

revoke all on function public.is_case_storage_path(text) from public, anon, authenticated;
grant execute on function public.is_case_storage_path(text) to authenticated;

create or replace function public.is_case_storage_write_path(object_name text)
returns boolean
language sql
security definer
stable
set search_path = pg_catalog, public
as $$
  select public.is_case_storage_path(object_name)
    and exists (
      select 1
      from public.case_members cm
      where lower(cm.incident_id::text) = lower((storage.foldername(object_name))[2])
        and cm.user_id = (select auth.uid())
        and cm.role in ('owner', 'collaborator')
    );
$$;

revoke all on function public.is_case_storage_write_path(text) from public, anon, authenticated;
grant execute on function public.is_case_storage_write_path(text) to authenticated;

-- 14. Enable Row-Level Security (RLS) on all tables
alter table public.profiles enable row level security;
alter table public.incidents enable row level security;
alter table public.case_members enable row level security;
alter table public.evidence enable row level security;
alter table public.facts enable row level security;
alter table public.timeline_events enable row level security;
alter table public.complaints enable row level security;
alter table public.complaint_events enable row level security;

-- 15. Grant Schema Access
grant usage on schema public to anon, authenticated;
grant select on public.profiles to authenticated;
grant update on public.profiles to authenticated;
grant select on public.incidents, public.case_members, public.evidence, public.facts, public.timeline_events, public.complaints, public.complaint_events to authenticated;
grant select on public.incidents, public.evidence, public.facts, public.timeline_events, public.complaints, public.complaint_events to anon;

-- 16. RLS Policies

-- Profiles
drop policy if exists "users can view their profile" on public.profiles;
create policy "users can view their profile" on public.profiles for select to authenticated using (id = (select auth.uid()));
drop policy if exists "users can update their profile" on public.profiles;
create policy "users can update their profile" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Incidents
drop policy if exists "demo incidents are visible" on public.incidents;
create policy "demo incidents are visible" on public.incidents for select to anon, authenticated using (is_demo = true);
drop policy if exists "case members can read incidents" on public.incidents;
create policy "case members can read incidents" on public.incidents for select to authenticated using (is_demo = false and public.is_case_member(id));

-- Case Members
drop policy if exists "members can see case memberships" on public.case_members;
create policy "members can see case memberships" on public.case_members for select to authenticated using (public.is_case_member(incident_id));

-- Evidence
drop policy if exists "demo evidence is visible" on public.evidence;
create policy "demo evidence is visible" on public.evidence for select to anon, authenticated using (is_demo = true);
drop policy if exists "case members can read evidence" on public.evidence;
create policy "case members can read evidence" on public.evidence for select to authenticated using (is_demo = false and public.is_case_member(incident_id));

-- Facts
drop policy if exists "demo facts are visible" on public.facts;
create policy "demo facts are visible" on public.facts for select to anon, authenticated using (is_demo = true);
drop policy if exists "case members can read facts" on public.facts;
create policy "case members can read facts" on public.facts for select to authenticated using (is_demo = false and public.is_case_member(incident_id));

-- Timeline Events
drop policy if exists "demo timeline events are visible" on public.timeline_events;
create policy "demo timeline events are visible" on public.timeline_events for select to anon, authenticated using (is_demo = true);
drop policy if exists "case members can read timeline events" on public.timeline_events;
create policy "case members can read timeline events" on public.timeline_events for select to authenticated using (is_demo = false and public.is_case_member(incident_id));

-- Complaints
drop policy if exists "demo complaints are visible" on public.complaints;
create policy "demo complaints are visible" on public.complaints for select to anon, authenticated using (is_demo = true);
drop policy if exists "case members can read complaints" on public.complaints;
create policy "case members can read complaints" on public.complaints for select to authenticated using (is_demo = false and public.is_case_member(incident_id));

-- Complaint Events
drop policy if exists "demo complaint events are visible" on public.complaint_events;
create policy "demo complaint events are visible" on public.complaint_events for select to anon, authenticated using (is_demo = true);
drop policy if exists "case members can read complaint events" on public.complaint_events;
create policy "case members can read complaint events" on public.complaint_events for select to authenticated
  using (
    is_demo = false
    and exists (
      select 1 from public.complaints c
      where c.id = complaint_id and public.is_case_member(c.incident_id)
    )
  );

-- Storage Objects Policies
drop policy if exists "case members can read evidence objects" on storage.objects;
create policy "case members can read evidence objects" on storage.objects for select to authenticated
  using (bucket_id = 'cyberdesk-evidence' and public.is_case_storage_path(name));

drop policy if exists "case members can upload evidence objects" on storage.objects;
create policy "case members can upload evidence objects" on storage.objects for insert to authenticated
  with check (bucket_id = 'cyberdesk-evidence' and public.is_case_storage_write_path(name));

drop policy if exists "case members can update evidence objects" on storage.objects;
create policy "case members can update evidence objects" on storage.objects for update to authenticated
  using (bucket_id = 'cyberdesk-evidence' and public.is_case_storage_write_path(name))
  with check (bucket_id = 'cyberdesk-evidence' and public.is_case_storage_write_path(name));

drop policy if exists "case members can delete evidence objects" on storage.objects;
create policy "case members can delete evidence objects" on storage.objects for delete to authenticated
  using (bucket_id = 'cyberdesk-evidence' and public.is_case_storage_write_path(name));

-- 17. Demo Seed Incident
insert into public.incidents (id, demo_key, incident_type, description, urgency, status, is_demo, created_at, updated_at)
values (
  'e6f0b4d4-28b9-4f7f-8d2b-1a0f9b6c0001',
  'hero-financial-fraud',
  'Unauthorized transaction / KYC scam',
  'I received a call from someone claiming to be from my bank. They told me my KYC had expired and sent an APK via WhatsApp. After installing it and entering my UPI PIN, INR 45,000 was debited in two transactions.',
  'high',
  'under_review',
  true,
  now() - interval '2 days',
  now() - interval '1 day'
)
on conflict (demo_key) do nothing;

insert into public.complaints (id, incident_id, complaint_text, status, acknowledgement_id, is_demo, created_at, updated_at)
values (
  'e6f0b4d4-28b9-4f7f-8d2b-1a0f9b6c0002',
  'e6f0b4d4-28b9-4f7f-8d2b-1a0f9b6c0001',
  'Complaint regarding unauthorized debit of Rs 45,000 via malicious APK download after fake KYC call. Transaction IDs: TXN882190, TXN882191.',
  'under_review',
  'CYB-DEMO-84A21',
  true,
  now() - interval '2 days',
  now() - interval '1 day'
)
on conflict (incident_id) do nothing;

-- 18. Enable Supabase Realtime for Live Updates
alter publication supabase_realtime add table public.incidents, public.evidence, public.facts, public.timeline_events, public.complaints;
