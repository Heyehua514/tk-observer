begin;
select plan(7);
select is((select count(*) from storage.buckets), 6::bigint);
select results_eq(
  $$ select id from storage.buckets where public = false order by id $$,
  $$ values ('avatars'), ('design-assets'), ('event-materials'), ('finance-receipts'), ('venue-photos'), ('video-files') $$
);
select is(
  (select count(*) from pg_policies where schemaname = 'storage' and tablename = 'objects'),
  28::bigint,
  'storage objects policies cover owner/video/design/market/material/finance/avatar roles'
);
select is_empty($$ select id from storage.buckets where public = true $$);
select isnt_empty($$ select id from storage.buckets where file_size_limit is not null $$);
select isnt_empty($$ select id from storage.buckets where allowed_mime_types is not null $$);
select is_empty($$ select id from storage.buckets where id not in ('avatars','design-assets','venue-photos','event-materials','finance-receipts','video-files') $$);
select * from finish();
rollback;
