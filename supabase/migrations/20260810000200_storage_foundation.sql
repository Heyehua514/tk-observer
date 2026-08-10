insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', false, 52428800, array['image/jpeg','image/png','image/webp','image/heic']),
  ('design-assets', 'design-assets', false, 52428800, array['image/jpeg','image/png','image/webp','image/heic','application/pdf']),
  ('venue-photos', 'venue-photos', false, 52428800, array['image/jpeg','image/png','image/webp','image/heic']),
  ('event-materials', 'event-materials', false, 52428800, array['image/jpeg','image/png','image/webp','image/heic','application/pdf']),
  ('finance-receipts', 'finance-receipts', false, 52428800, array['image/jpeg','image/png','image/webp','image/heic','application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "owners can read private workspace files"
on storage.objects for select to authenticated
using (
  bucket_id = any(array['avatars','design-assets','venue-photos','event-materials','finance-receipts'])
  and public.has_any_role(array['owner'])
);

create policy "owners can upload private workspace files"
on storage.objects for insert to authenticated
with check (
  bucket_id = any(array['avatars','design-assets','venue-photos','event-materials','finance-receipts'])
  and public.has_any_role(array['owner'])
);

create policy "owners can update private workspace files"
on storage.objects for update to authenticated
using (
  bucket_id = any(array['avatars','design-assets','venue-photos','event-materials','finance-receipts'])
  and public.has_any_role(array['owner'])
)
with check (
  bucket_id = any(array['avatars','design-assets','venue-photos','event-materials','finance-receipts'])
  and public.has_any_role(array['owner'])
);

create policy "owners can delete private workspace files"
on storage.objects for delete to authenticated
using (
  bucket_id = any(array['avatars','design-assets','venue-photos','event-materials','finance-receipts'])
  and public.has_any_role(array['owner'])
);
