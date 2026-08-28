-- CyberDesk realistic evidence pipeline.
-- Additive and still synthetic/demo-only. No real citizen data is authorized by this migration.

alter table public.evidence
  add column if not exists category text not null default 'other',
  add column if not exists mime_type text,
  add column if not exists upload_status text not null default 'demo',
  add column if not exists extraction_status text not null default 'complete',
  add column if not exists extraction_notes text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'evidence_category_check') then
    alter table public.evidence add constraint evidence_category_check
      check (category in ('transaction', 'bank_communication', 'sms', 'whatsapp_message', 'email', 'screenshot', 'link', 'caller_contact', 'other'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'evidence_upload_status_check') then
    alter table public.evidence add constraint evidence_upload_status_check
      check (upload_status in ('demo', 'uploaded', 'local_only', 'failed'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'evidence_extraction_status_check') then
    alter table public.evidence add constraint evidence_extraction_status_check
      check (extraction_status in ('not_started', 'processing', 'complete', 'fallback', 'failed'));
  end if;
end $$;

alter table public.facts
  add column if not exists evidence_id text references public.evidence(id) on delete cascade,
  add column if not exists field_key text,
  add column if not exists provenance jsonb not null default '{}'::jsonb;

alter table public.timeline_events
  add column if not exists event_key text,
  add column if not exists evidence_id text references public.evidence(id) on delete set null,
  add column if not exists event_time_label text,
  add column if not exists time_precision text not null default 'unknown';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'timeline_events_time_precision_check') then
    alter table public.timeline_events add constraint timeline_events_time_precision_check
      check (time_precision in ('exact', 'date', 'approximate', 'unknown'));
  end if;
end $$;

create unique index if not exists facts_incident_evidence_field_idx
  on public.facts(incident_id, evidence_id, field_key);
create unique index if not exists timeline_events_incident_event_key_idx
  on public.timeline_events(incident_id, event_key);

-- Private bucket. Object access is intentionally server-only because this project has no auth yet.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cyberdesk-evidence',
  'cyberdesk-evidence',
  false,
  5242880,
  array['image/png', 'image/jpeg', 'application/pdf', 'text/plain']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
