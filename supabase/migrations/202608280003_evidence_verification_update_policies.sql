-- Allow the demo verification endpoint to idempotently upsert facts and timeline rows.
-- This remains synthetic-only and does not change the prototype's anonymous access model.

drop policy if exists "demo facts can be updated" on public.facts;
create policy "demo facts can be updated"
  on public.facts
  for update
  to anon, authenticated
  using (is_demo = true)
  with check (is_demo = true);

drop policy if exists "demo timeline can be updated" on public.timeline_events;
create policy "demo timeline can be updated"
  on public.timeline_events
  for update
  to anon, authenticated
  using (is_demo = true)
  with check (is_demo = true);
