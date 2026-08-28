-- CyberDesk Alpha ownership hardening.
-- Real cases are UUID incidents owned through case_members. Demo rows remain
-- public and synthetic, but cannot be claimed by an authenticated user.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
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

create table if not exists public.case_members (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'collaborator', 'viewer')),
  created_at timestamptz not null default now(),
  constraint case_members_incident_user_unique unique (incident_id, user_id)
);
create index if not exists case_members_user_id_idx on public.case_members(user_id);
create index if not exists case_members_incident_id_idx on public.case_members(incident_id);

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

alter table public.incidents
  alter column demo_key drop not null,
  alter column is_demo set default false,
  add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.incidents drop constraint if exists incidents_is_demo_check;
alter table public.incidents drop constraint if exists incidents_real_owner_check;
alter table public.incidents add constraint incidents_real_owner_check
  check (is_demo = true or created_by is not null) not valid;
alter table public.incidents validate constraint incidents_real_owner_check;

alter table public.evidence alter column is_demo set default false,
  add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.evidence drop constraint if exists evidence_is_demo_check;
alter table public.facts alter column is_demo set default false,
  add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.facts drop constraint if exists facts_is_demo_check;
alter table public.facts alter column field_key set not null;
alter table public.timeline_events alter column is_demo set default false,
  add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.timeline_events drop constraint if exists timeline_events_is_demo_check;
alter table public.timeline_events alter column event_key set not null;
alter table public.complaints alter column is_demo set default false,
  add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.complaints drop constraint if exists complaints_is_demo_check;
alter table public.complaint_events alter column is_demo set default false;
alter table public.complaint_events drop constraint if exists complaint_events_is_demo_check;

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
drop trigger if exists protect_incident_identity on public.incidents;
create trigger protect_incident_identity before update on public.incidents
  for each row execute function public.prevent_incident_identity_mutation();
revoke all on function public.prevent_incident_identity_mutation() from public, anon, authenticated;

create or replace function public.prevent_child_identity_mutation()
returns trigger language plpgsql set search_path = pg_catalog, public
as $$
begin
  if new.is_demo is distinct from old.is_demo or new.created_by is distinct from old.created_by then
    raise exception 'evidence identity fields cannot be changed';
  end if;
  return new;
end;
$$;
drop trigger if exists protect_evidence_identity on public.evidence;
create trigger protect_evidence_identity before update on public.evidence for each row execute function public.prevent_child_identity_mutation();
drop trigger if exists protect_facts_identity on public.facts;
create trigger protect_facts_identity before update on public.facts for each row execute function public.prevent_child_identity_mutation();
drop trigger if exists protect_timeline_identity on public.timeline_events;
create trigger protect_timeline_identity before update on public.timeline_events for each row execute function public.prevent_child_identity_mutation();
drop trigger if exists protect_complaints_identity on public.complaints;
create trigger protect_complaints_identity before update on public.complaints for each row execute function public.prevent_child_identity_mutation();
revoke all on function public.prevent_child_identity_mutation() from public, anon, authenticated;

create or replace function public.ensure_incident_owner_membership()
returns trigger language plpgsql security definer
set search_path = pg_catalog, public
as $$
begin
  if new.is_demo = false and new.created_by is not null then
    insert into public.case_members (incident_id, user_id, role)
    values (new.id, new.created_by, 'owner') on conflict (incident_id, user_id) do nothing;
  end if;
  return new;
end;
$$;
drop trigger if exists create_incident_owner_membership on public.incidents;
create trigger create_incident_owner_membership after insert on public.incidents
  for each row execute function public.ensure_incident_owner_membership();
revoke all on function public.ensure_incident_owner_membership() from public, anon, authenticated;

grant usage on schema public to anon, authenticated;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
revoke all on public.case_members from anon, authenticated;
grant select, insert, delete on public.case_members to authenticated;
grant select, insert, update, delete on public.incidents, public.evidence, public.facts, public.timeline_events, public.complaints to authenticated;
grant select, insert, update on public.complaint_events to authenticated;
grant select, insert, update on public.incidents, public.evidence, public.facts, public.timeline_events, public.complaints, public.complaint_events to anon;

alter table public.profiles enable row level security;
drop policy if exists "users can view own profile" on public.profiles;
drop policy if exists "users can update own profile" on public.profiles;
create policy "users can view own profile" on public.profiles for select to authenticated using (id = (select auth.uid()));

alter table public.case_members enable row level security;
drop policy if exists "members can view case memberships" on public.case_members;
drop policy if exists "owners can add case members" on public.case_members;
drop policy if exists "owners can remove case members" on public.case_members;
create policy "users can view own membership" on public.case_members for select to authenticated using (user_id = (select auth.uid()));
create policy "owners can add case members" on public.case_members for insert to authenticated
  with check (public.is_case_owner(incident_id) and role in ('owner', 'collaborator', 'viewer'));
create policy "owners can remove non-owner members" on public.case_members for delete to authenticated
  using (public.is_case_owner(incident_id) and user_id <> (select auth.uid()));

alter table public.incidents enable row level security;
drop policy if exists "demo incidents are visible" on public.incidents;
drop policy if exists "incidents are visible to members or demo" on public.incidents;
drop policy if exists "incidents can be created" on public.incidents;
drop policy if exists "demo incidents can be created" on public.incidents;
drop policy if exists "incidents can be updated" on public.incidents;
drop policy if exists "demo incidents can be updated" on public.incidents;
drop policy if exists "incidents can be deleted by members" on public.incidents;
create policy "public can view demo incidents" on public.incidents for select to anon, authenticated using (is_demo = true);
create policy "members can view real incidents" on public.incidents for select to authenticated using (is_demo = false and public.is_case_member(id));
create policy "public can create demo incidents" on public.incidents for insert to anon, authenticated with check (is_demo = true and created_by is null);
create policy "users can create owned incidents" on public.incidents for insert to authenticated with check (is_demo = false and created_by = (select auth.uid()));
create policy "public can update demo incidents" on public.incidents for update to anon, authenticated using (is_demo = true) with check (is_demo = true and created_by is null);
create policy "members can update real incidents" on public.incidents for update to authenticated using (is_demo = false and public.is_case_member(id)) with check (is_demo = false and public.is_case_member(id));
create policy "owners can delete real incidents" on public.incidents for delete to authenticated using (is_demo = false and public.is_case_owner(id));

alter table public.evidence enable row level security;
drop policy if exists "demo evidence is visible" on public.evidence;
drop policy if exists "evidence is visible to members or demo" on public.evidence;
drop policy if exists "evidence can be created" on public.evidence;
drop policy if exists "demo evidence can be created" on public.evidence;
drop policy if exists "evidence can be updated" on public.evidence;
drop policy if exists "demo evidence can be updated" on public.evidence;
drop policy if exists "evidence can be deleted by members" on public.evidence;
create policy "public can view demo evidence" on public.evidence for select to anon, authenticated using (is_demo = true);
create policy "members can view real evidence" on public.evidence for select to authenticated using (is_demo = false and public.is_case_member(incident_id));
create policy "public can create demo evidence" on public.evidence for insert to anon, authenticated with check (is_demo = true and created_by is null);
create policy "members can create real evidence" on public.evidence for insert to authenticated with check (is_demo = false and created_by = (select auth.uid()) and public.is_case_member(incident_id));
create policy "public can update demo evidence" on public.evidence for update to anon, authenticated using (is_demo = true) with check (is_demo = true and created_by is null);
create policy "members can update real evidence" on public.evidence for update to authenticated using (is_demo = false and public.is_case_member(incident_id)) with check (is_demo = false and public.is_case_member(incident_id));
create policy "owners can delete real evidence" on public.evidence for delete to authenticated using (is_demo = false and public.is_case_owner(incident_id));

alter table public.facts enable row level security;
drop policy if exists "demo facts are visible" on public.facts;
drop policy if exists "facts are visible to members or demo" on public.facts;
drop policy if exists "facts can be created" on public.facts;
drop policy if exists "demo facts can be created" on public.facts;
drop policy if exists "facts can be updated" on public.facts;
drop policy if exists "demo facts can be updated" on public.facts;
drop policy if exists "facts can be deleted by members" on public.facts;
create policy "public can view demo facts" on public.facts for select to anon, authenticated using (is_demo = true);
create policy "members can view real facts" on public.facts for select to authenticated using (is_demo = false and public.is_case_member(incident_id));
create policy "public can create demo facts" on public.facts for insert to anon, authenticated with check (is_demo = true and created_by is null);
create policy "members can create real facts" on public.facts for insert to authenticated with check (is_demo = false and created_by = (select auth.uid()) and public.is_case_member(incident_id));
create policy "public can update demo facts" on public.facts for update to anon, authenticated using (is_demo = true) with check (is_demo = true and created_by is null);
create policy "members can update real facts" on public.facts for update to authenticated using (is_demo = false and public.is_case_member(incident_id)) with check (is_demo = false and public.is_case_member(incident_id));
create policy "owners can delete real facts" on public.facts for delete to authenticated using (is_demo = false and public.is_case_owner(incident_id));

alter table public.timeline_events enable row level security;
drop policy if exists "demo timeline is visible" on public.timeline_events;
drop policy if exists "timeline is visible to members or demo" on public.timeline_events;
drop policy if exists "timeline can be created" on public.timeline_events;
drop policy if exists "demo timeline can be created" on public.timeline_events;
drop policy if exists "timeline can be updated" on public.timeline_events;
drop policy if exists "demo timeline can be updated" on public.timeline_events;
drop policy if exists "timeline can be deleted by members" on public.timeline_events;
create policy "public can view demo timeline" on public.timeline_events for select to anon, authenticated using (is_demo = true);
create policy "members can view real timeline" on public.timeline_events for select to authenticated using (is_demo = false and public.is_case_member(incident_id));
create policy "public can create demo timeline" on public.timeline_events for insert to anon, authenticated with check (is_demo = true and created_by is null);
create policy "members can create real timeline" on public.timeline_events for insert to authenticated with check (is_demo = false and created_by = (select auth.uid()) and public.is_case_member(incident_id));
create policy "public can update demo timeline" on public.timeline_events for update to anon, authenticated using (is_demo = true) with check (is_demo = true and created_by is null);
create policy "members can update real timeline" on public.timeline_events for update to authenticated using (is_demo = false and public.is_case_member(incident_id)) with check (is_demo = false and public.is_case_member(incident_id));
create policy "owners can delete real timeline" on public.timeline_events for delete to authenticated using (is_demo = false and public.is_case_owner(incident_id));

alter table public.complaints enable row level security;
drop policy if exists "demo complaints are visible" on public.complaints;
drop policy if exists "complaints are visible to members or demo" on public.complaints;
drop policy if exists "complaints can be created" on public.complaints;
drop policy if exists "demo complaints can be created" on public.complaints;
drop policy if exists "complaints can be updated" on public.complaints;
drop policy if exists "demo complaints can be updated" on public.complaints;
create policy "public can view demo complaints" on public.complaints for select to anon, authenticated using (is_demo = true);
create policy "members can view real complaints" on public.complaints for select to authenticated using (is_demo = false and public.is_case_member(incident_id));
create policy "public can create demo complaints" on public.complaints for insert to anon, authenticated with check (is_demo = true and created_by is null);
create policy "members can create real complaints" on public.complaints for insert to authenticated with check (is_demo = false and created_by = (select auth.uid()) and public.is_case_member(incident_id));
create policy "public can update demo complaints" on public.complaints for update to anon, authenticated using (is_demo = true) with check (is_demo = true and created_by is null);
create policy "members can update real complaints" on public.complaints for update to authenticated using (is_demo = false and public.is_case_member(incident_id)) with check (is_demo = false and public.is_case_member(incident_id));

alter table public.complaint_events enable row level security;
revoke update, delete on public.complaint_events from anon, authenticated;
drop policy if exists "demo complaint events are visible" on public.complaint_events;
drop policy if exists "complaint events are visible to members or demo" on public.complaint_events;
drop policy if exists "demo complaint events can be created" on public.complaint_events;
drop policy if exists "complaint events can be created" on public.complaint_events;
create policy "public can view demo complaint events" on public.complaint_events for select to anon, authenticated using (
  is_demo = true and exists (select 1 from public.complaints c where c.id = complaint_id and c.is_demo = true)
);
create policy "members can view real complaint events" on public.complaint_events for select to authenticated using (
  is_demo = false and exists (select 1 from public.complaints c where c.id = complaint_id and c.is_demo = false and public.is_case_member(c.incident_id))
);
create policy "public can create demo complaint events" on public.complaint_events for insert to anon, authenticated with check (
  is_demo = true and exists (select 1 from public.complaints c where c.id = complaint_id and c.is_demo = true)
);
create policy "members can create real complaint events" on public.complaint_events for insert to authenticated with check (
  is_demo = false and exists (select 1 from public.complaints c where c.id = complaint_id and c.is_demo = false and public.is_case_member(c.incident_id))
);
