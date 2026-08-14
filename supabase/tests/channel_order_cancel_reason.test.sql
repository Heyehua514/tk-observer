-- 商务工作台：渠道商单取消原因约束与状态流转。
-- 所属工作台：商务（董雨辰）；权限：business/boss 可读写。
begin;
select plan(8);

select has_column(
  'public', 'channel_orders', 'cancel_reason',
  'channel orders have cancel reason column'
);
select ok(exists(
  select 1 from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  where t.relname = 'channel_orders'
    and c.conname = 'channel_orders_cancel_reason_check'
), 'cancel reason check constraint exists');

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'cancel-boss@example.test', '', now(), '{}', '{"name":"Boss"}', now(), now()),
  ('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'cancel-business@example.test', '', now(), '{}', '{"name":"Business"}', now(), now());

update public.profiles
set status = 'active',
    role = case id
      when '40000000-0000-0000-0000-000000000001' then 'boss'
      when '40000000-0000-0000-0000-000000000002' then 'business'
    end
where id::text like '40000000-0000-0000-0000-00000000000%';

insert into public.clients (id, name, industry, source, level)
values ('41000000-0000-0000-0000-000000000001', '取消测试客户', 'brand', 'outbound', 'A');
insert into public.creators (
  id, nickname, tiktok_url, followers, region, cooperation_status,
  owner_name, is_biz_available
) values (
  '42000000-0000-0000-0000-000000000001', '取消测试达人',
  'https://www.tiktok.com/@cancel-test', 2000, 'US', 'signed', '谢洁', true
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"40000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);

select lives_ok($$
  insert into public.channel_orders (
    id, title, client_id, creator_id, platform, content_type, amount, status
  ) values (
    '43000000-0000-0000-0000-000000000001', '取消测试商单',
    '41000000-0000-0000-0000-000000000001',
    '42000000-0000-0000-0000-000000000001',
    'tiktok', 'spoken_placement', 80000, 'negotiating'
  )
$$, 'business can create channel orders');

select throws_ok($$
  update public.channel_orders set status = 'cancelled'
  where id = '43000000-0000-0000-0000-000000000001'
$$, '23514',
  'new row for relation "channel_orders" violates check constraint "channel_orders_cancel_reason_check"',
  'cancelled orders require a reason');

select lives_ok($$
  update public.channel_orders
  set status = 'cancelled', cancel_reason = '客户预算调整'
  where id = '43000000-0000-0000-0000-000000000001'
$$, 'business can cancel orders with a reason');
select is(
  (select cancel_reason from public.channel_orders
   where id = '43000000-0000-0000-0000-000000000001'),
  '客户预算调整',
  'cancel reason is persisted'
);

select lives_ok($$
  update public.channel_orders set status = 'completed'
  where id = '43000000-0000-0000-0000-000000000001'
$$, 'business can move cancelled orders back to active flow');
select is(
  (select status from public.channel_orders
   where id = '43000000-0000-0000-0000-000000000001'),
  'completed',
  'order status reflects latest transition'
);

select * from finish();
rollback;
