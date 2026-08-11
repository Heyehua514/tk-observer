begin;
select plan(7);
select is((select count(*) from storage.buckets), 6::bigint);
select results_eq(
  $$ select id from storage.buckets where public = false order by id $$,
  $$ values ('avatars'), ('design-assets'), ('event-materials'), ('finance-receipts'), ('venue-photos'), ('video-files') $$
);
select policies_are('storage', 'objects', array[
  'owners can read private workspace files',
  'owners can upload private workspace files',
  'owners can update private workspace files',
  'owners can delete private workspace files',
  'video collaborators can read video files',
  'video editors can upload video files',
  'video editors can update video files',
  'video editors can delete video files'
]);
select is_empty($$ select id from storage.buckets where public = true $$);
select isnt_empty($$ select id from storage.buckets where file_size_limit is not null $$);
select isnt_empty($$ select id from storage.buckets where allowed_mime_types is not null $$);
select is_empty($$ select id from storage.buckets where id not in ('avatars','design-assets','venue-photos','event-materials','finance-receipts','video-files') $$);
select * from finish();
rollback;
