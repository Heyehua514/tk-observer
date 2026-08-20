begin;
select plan(6);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('94000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'eval-feishu-owner@example.test', '', now(), '{}', '{}', now(), now()),
  ('94000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'eval-feishu-other@example.test', '', now(), '{}', '{}', now(), now());
update public.profiles set status = 'active', role = 'business'
where id in ('94000000-0000-0000-0000-000000000001', '94000000-0000-0000-0000-000000000002');

insert into public.feishu_connections (
  user_id, open_id, access_token_encrypted, refresh_token_encrypted, connected_at
) values (
  '94000000-0000-0000-0000-000000000001', 'owner-open-id', 'encrypted-access', 'encrypted-refresh', now()
);
insert into public.feishu_documents (owner_user, source_type, source_url, source_title, synced_at)
values ('94000000-0000-0000-0000-000000000001', 'doc', 'https://feishu.example/doc/owner', 'Owner document', now());

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"94000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select is(
  (select connected from public.get_my_feishu_connection()), true,
  'owner can read own redacted connection status'
);
select is(
  (select open_id from public.get_my_feishu_connection()), 'owner-open-id',
  'owner status contains linked Feishu account identifier'
);
select is(
  (select count(*) from public.feishu_documents), 1::bigint,
  'owner can read own synchronized documents'
);

select set_config('request.jwt.claims', '{"sub":"94000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
select is(
  (select count(*) from public.get_my_feishu_connection()), 1::bigint,
  'other member receives only own empty connection status'
);
select is(
  (select count(*) from public.feishu_documents), 0::bigint,
  'other member cannot read synchronized documents'
);
select throws_ok(
  $$ insert into public.feishu_connections (user_id, open_id, access_token_encrypted, refresh_token_encrypted, connected_at)
     values ('94000000-0000-0000-0000-000000000002', 'other-open-id', 'forged', 'forged', now()) $$,
  '42501', null, 'members cannot forge a Feishu connection'
);

select * from finish();
rollback;
