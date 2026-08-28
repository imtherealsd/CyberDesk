-- Cover the new evidence reference foreign keys without changing access semantics.
create index if not exists facts_evidence_id_idx on public.facts(evidence_id);
create index if not exists timeline_events_evidence_id_idx on public.timeline_events(evidence_id);
