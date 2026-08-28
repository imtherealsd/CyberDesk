-- Private evidence objects use cases/<incident UUID>/<evidence UUID>/<name>.
-- The case UUID is parsed only after validating the fixed path shape.

create or replace function public.is_case_storage_path(object_name text)
returns boolean
language sql
security definer
stable
set search_path = pg_catalog, public
as $$
  select
    (storage.foldername(object_name))[1] = 'cases'
    and (storage.foldername(object_name))[2] ~ '^[0-9a-fA-F-]{36}$'
    and public.is_case_member(((storage.foldername(object_name))[2])::uuid);
$$;

revoke all on function public.is_case_storage_path(text) from public, anon, authenticated;
grant execute on function public.is_case_storage_path(text) to authenticated;

drop policy if exists "case members can read evidence objects" on storage.objects;
drop policy if exists "case members can upload evidence objects" on storage.objects;
drop policy if exists "case members can update evidence objects" on storage.objects;
drop policy if exists "case members can delete evidence objects" on storage.objects;

create policy "case members can read evidence objects" on storage.objects
  for select to authenticated
  using (bucket_id = 'cyberdesk-evidence' and public.is_case_storage_path(name));

create policy "case members can upload evidence objects" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'cyberdesk-evidence' and public.is_case_storage_path(name));

create policy "case members can update evidence objects" on storage.objects
  for update to authenticated
  using (bucket_id = 'cyberdesk-evidence' and public.is_case_storage_path(name))
  with check (bucket_id = 'cyberdesk-evidence' and public.is_case_storage_path(name));

create policy "case members can delete evidence objects" on storage.objects
  for delete to authenticated
  using (bucket_id = 'cyberdesk-evidence' and public.is_case_storage_path(name));
