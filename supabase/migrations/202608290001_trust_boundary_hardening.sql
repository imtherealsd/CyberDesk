-- CyberDesk trust-boundary and case-consistency hardening.
-- Real case mutations are server-only after API authorization. The public
-- synthetic demo remains available through the anonymous demo routes.

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

-- A real fact is only a confirmed, evidence-backed fact. This is NOT VALID so
-- an existing legacy/demo dataset is not broken, while all new writes are
-- enforced immediately.
alter table public.facts drop constraint if exists facts_real_verified_only;
alter table public.facts add constraint facts_real_verified_only
  check (
    is_demo = true
    or (verification_status = 'confirmed' and verified_at is not null and evidence_id is not null)
  ) not valid;

create or replace function public.validate_real_evidence_relationship()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if new.evidence_id is not null
     and not exists (
       select 1
       from public.evidence e
       where e.id = new.evidence_id
         and e.incident_id = new.incident_id
         and e.is_demo = new.is_demo
     ) then
    raise exception 'child row must reference evidence in the same case';
  end if;

  if new.is_demo = false and new.evidence_id is null then
    raise exception 'real child row must reference evidence in the same case';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_real_fact_evidence_relationship on public.facts;
create trigger validate_real_fact_evidence_relationship
  before insert or update on public.facts
  for each row execute function public.validate_real_evidence_relationship();

drop trigger if exists validate_real_timeline_evidence_relationship on public.timeline_events;
create trigger validate_real_timeline_evidence_relationship
  before insert or update on public.timeline_events
  for each row execute function public.validate_real_evidence_relationship();

create or replace function public.validate_complaint_event_parent()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if not exists (
    select 1
    from public.complaints c
    where c.id = new.complaint_id
      and c.is_demo = new.is_demo
  ) then
    raise exception 'complaint event must use a complaint from the same data boundary';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_complaint_event_parent on public.complaint_events;
create trigger validate_complaint_event_parent
  before insert or update on public.complaint_events
  for each row execute function public.validate_complaint_event_parent();

create or replace function public.prevent_child_case_reassignment()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if new.incident_id is distinct from old.incident_id then
    raise exception 'child rows cannot be moved between cases';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_evidence_case_reassignment on public.evidence;
create trigger prevent_evidence_case_reassignment
  before update on public.evidence
  for each row execute function public.prevent_child_case_reassignment();

drop trigger if exists prevent_fact_case_reassignment on public.facts;
create trigger prevent_fact_case_reassignment
  before update on public.facts
  for each row execute function public.prevent_child_case_reassignment();

drop trigger if exists prevent_timeline_case_reassignment on public.timeline_events;
create trigger prevent_timeline_case_reassignment
  before update on public.timeline_events
  for each row execute function public.prevent_child_case_reassignment();

drop trigger if exists prevent_complaint_case_reassignment on public.complaints;
create trigger prevent_complaint_case_reassignment
  before update on public.complaints
  for each row execute function public.prevent_child_case_reassignment();

create or replace function public.prevent_derived_evidence_reassignment()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if new.evidence_id is distinct from old.evidence_id then
    raise exception 'derived rows cannot change their evidence';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_fact_evidence_reassignment on public.facts;
create trigger prevent_fact_evidence_reassignment
  before update on public.facts
  for each row execute function public.prevent_derived_evidence_reassignment();

drop trigger if exists prevent_timeline_evidence_reassignment on public.timeline_events;
create trigger prevent_timeline_evidence_reassignment
  before update on public.timeline_events
  for each row execute function public.prevent_derived_evidence_reassignment();

revoke all on function public.validate_real_evidence_relationship() from public, anon, authenticated;
revoke all on function public.validate_complaint_event_parent() from public, anon, authenticated;
revoke all on function public.prevent_child_case_reassignment() from public, anon, authenticated;
revoke all on function public.prevent_derived_evidence_reassignment() from public, anon, authenticated;

-- Real content is written by server routes after object-level authorization.
-- Demo policies remain available to the anonymous synthetic routes.
drop policy if exists "users can create owned incidents" on public.incidents;
drop policy if exists "members can update real incidents" on public.incidents;
drop policy if exists "owners can delete real incidents" on public.incidents;

drop policy if exists "members can create real evidence" on public.evidence;
drop policy if exists "members can update real evidence" on public.evidence;
drop policy if exists "owners can delete real evidence" on public.evidence;

drop policy if exists "members can create real facts" on public.facts;
drop policy if exists "members can update real facts" on public.facts;
drop policy if exists "owners can delete real facts" on public.facts;

drop policy if exists "members can create real timeline" on public.timeline_events;
drop policy if exists "members can update real timeline" on public.timeline_events;
drop policy if exists "owners can delete real timeline" on public.timeline_events;

drop policy if exists "members can create real complaints" on public.complaints;
drop policy if exists "members can update real complaints" on public.complaints;

drop policy if exists "members can create real complaint events" on public.complaint_events;

revoke insert, update, delete on public.incidents, public.evidence, public.facts,
  public.timeline_events, public.complaints, public.complaint_events
  from authenticated;
revoke insert, update on public.complaint_events from authenticated;

-- Keep anonymous synthetic writes attached to the synthetic incident only.
drop policy if exists "public can view demo evidence" on public.evidence;
drop policy if exists "public can create demo evidence" on public.evidence;
drop policy if exists "public can update demo evidence" on public.evidence;
create policy "public can view demo evidence" on public.evidence for select to anon, authenticated
  using (is_demo = true and exists (
    select 1 from public.incidents i where i.id = incident_id and i.is_demo = true
  ));
create policy "public can create demo evidence" on public.evidence for insert to anon, authenticated
  with check (is_demo = true and created_by is null and exists (
    select 1 from public.incidents i where i.id = incident_id and i.is_demo = true
  ));
create policy "public can update demo evidence" on public.evidence for update to anon, authenticated
  using (is_demo = true and exists (
    select 1 from public.incidents i where i.id = incident_id and i.is_demo = true
  ))
  with check (is_demo = true and created_by is null and exists (
    select 1 from public.incidents i where i.id = incident_id and i.is_demo = true
  ));

drop policy if exists "public can view demo facts" on public.facts;
drop policy if exists "public can create demo facts" on public.facts;
drop policy if exists "public can update demo facts" on public.facts;
create policy "public can view demo facts" on public.facts for select to anon, authenticated
  using (is_demo = true and exists (
    select 1 from public.incidents i where i.id = incident_id and i.is_demo = true
  ));
create policy "public can create demo facts" on public.facts for insert to anon, authenticated
  with check (is_demo = true and created_by is null and exists (
    select 1 from public.incidents i where i.id = incident_id and i.is_demo = true
  ));
create policy "public can update demo facts" on public.facts for update to anon, authenticated
  using (is_demo = true and exists (
    select 1 from public.incidents i where i.id = incident_id and i.is_demo = true
  ))
  with check (is_demo = true and created_by is null and exists (
    select 1 from public.incidents i where i.id = incident_id and i.is_demo = true
  ));

drop policy if exists "public can view demo timeline" on public.timeline_events;
drop policy if exists "public can create demo timeline" on public.timeline_events;
drop policy if exists "public can update demo timeline" on public.timeline_events;
create policy "public can view demo timeline" on public.timeline_events for select to anon, authenticated
  using (is_demo = true and exists (
    select 1 from public.incidents i where i.id = incident_id and i.is_demo = true
  ));
create policy "public can create demo timeline" on public.timeline_events for insert to anon, authenticated
  with check (is_demo = true and created_by is null and exists (
    select 1 from public.incidents i where i.id = incident_id and i.is_demo = true
  ));
create policy "public can update demo timeline" on public.timeline_events for update to anon, authenticated
  using (is_demo = true and exists (
    select 1 from public.incidents i where i.id = incident_id and i.is_demo = true
  ))
  with check (is_demo = true and created_by is null and exists (
    select 1 from public.incidents i where i.id = incident_id and i.is_demo = true
  ));

drop policy if exists "public can view demo complaints" on public.complaints;
drop policy if exists "public can create demo complaints" on public.complaints;
drop policy if exists "public can update demo complaints" on public.complaints;
create policy "public can view demo complaints" on public.complaints for select to anon, authenticated
  using (is_demo = true and exists (
    select 1 from public.incidents i where i.id = incident_id and i.is_demo = true
  ));
create policy "public can create demo complaints" on public.complaints for insert to anon, authenticated
  with check (is_demo = true and created_by is null and exists (
    select 1 from public.incidents i where i.id = incident_id and i.is_demo = true
  ));
create policy "public can update demo complaints" on public.complaints for update to anon, authenticated
  using (is_demo = true and exists (
    select 1 from public.incidents i where i.id = incident_id and i.is_demo = true
  ))
  with check (is_demo = true and created_by is null and exists (
    select 1 from public.incidents i where i.id = incident_id and i.is_demo = true
  ));

-- Viewers may read evidence objects, but only owners and collaborators may
-- create, replace, or delete them directly through Storage.
drop policy if exists "case members can read evidence objects" on storage.objects;
drop policy if exists "case members can upload evidence objects" on storage.objects;
drop policy if exists "case members can update evidence objects" on storage.objects;
drop policy if exists "case members can delete evidence objects" on storage.objects;

create policy "case members can read evidence objects" on storage.objects
  for select to authenticated
  using (bucket_id = 'cyberdesk-evidence' and public.is_case_storage_path(name));

create policy "case members can upload evidence objects" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'cyberdesk-evidence' and public.is_case_storage_write_path(name));

create policy "case members can update evidence objects" on storage.objects
  for update to authenticated
  using (bucket_id = 'cyberdesk-evidence' and public.is_case_storage_write_path(name))
  with check (bucket_id = 'cyberdesk-evidence' and public.is_case_storage_write_path(name));

create policy "case members can delete evidence objects" on storage.objects
  for delete to authenticated
  using (bucket_id = 'cyberdesk-evidence' and public.is_case_storage_write_path(name));
