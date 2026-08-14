begin;
select plan(12);

select has_function('public', 'notify_boss_on_opportunity_won', 'won notification function exists');
select has_trigger(
  'public', 'opportunities', 'opportunities_notify_boss_on_won',
  'won notification trigger exists'
);
select trigger_is(
  'public', 'opportunities', 'opportunities_notify_boss_on_won',
  'public', 'notify_boss_on_opportunity_won'
);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'won-boss@example.test', '', now(), '{}', '{"name":"Boss"}', now(), now()),
  ('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'won-business@example.test', '', now(), '{}', '{"name":"Business"}', now(), now());

update public.profiles
set status = 'active',
    role = case id
      when 'a0000000-0000-0000-0000-000000000001' then 'boss'
      when 'a0000000-0000-0000-0000-000000000002' then 'business'
    end
where id::text like 'a0000000-0000-0000-0000-00000000000%';

insert into public.clients (id, name, industry, source, level)
values ('a1000000-0000-0000-0000-000000000001', '成交通知测试客户', 'brand', 'outbound', 'A');

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"a0000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);

insert into public.opportunities (
  id, client_id, title, type, amount, stage, expected_close
) values (
  'a2000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  '成交通知测试商机', 'channel_order', 50000, 'negotiation', now() + interval '7 days'
);

update public.opportunities set stage = 'won'
where id = 'a2000000-0000-0000-0000-000000000001';

-- 通知计数回 postgres 角色执行：business 的 RLS 只允许读自己的通知，
-- 看不到发给 boss 的通知行，断言前先恢复超级用户可见性。
reset role;

select is(
  (select count(*) from public.notifications
   where recipient_id = 'a0000000-0000-0000-0000-000000000001'
     and type = 'opportunity_won'
     and deleted_at is null),
  1::bigint,
  'won transition creates one notification for boss'
);

select is(
  (select content from public.notifications
   where recipient_id = 'a0000000-0000-0000-0000-000000000001'
   order by created_at desc limit 1),
  '「成交通知测试商机」已成交，金额 500.00 元',
  'notification content carries title and formatted amount'
);

update public.opportunities set stage = 'won'
where id = 'a2000000-0000-0000-0000-000000000001';

select is(
  (select count(*) from public.notifications
   where recipient_id = 'a0000000-0000-0000-0000-000000000001'
     and type = 'opportunity_won'
     and deleted_at is null),
  1::bigint,
  're-updating same stage does not duplicate notification'
);

select is(
  (select count(*) from public.notifications
   where recipient_id = 'a0000000-0000-0000-0000-000000000002'
     and type = 'opportunity_won'),
  0::bigint,
  'business user receives no won notification'
);
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"a0000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);
select throws_ok($$
  insert into public.notifications (
    recipient_id, type, title, content, link
  ) values (
    'a0000000-0000-0000-0000-000000000001', 'opportunity_won',
    '越权创建', '普通成员不能创建成交通知', '/business'
  )
$$, '42501', null, 'business cannot create notifications directly');
reset role;
update public.opportunities set stage = 'negotiation'
where id = 'a2000000-0000-0000-0000-000000000001';
update public.opportunities set stage = 'won'
where id = 'a2000000-0000-0000-0000-000000000001';

select is(
  (select count(*) from public.notifications
   where recipient_id = 'a0000000-0000-0000-0000-000000000001'
     and type = 'opportunity_won'
     and deleted_at is null),
  1::bigint,
  'leaving and re-entering won keeps a single dedup notification'
);

select is(
  (select link from public.notifications
   where recipient_id = 'a0000000-0000-0000-0000-000000000001'
   order by created_at desc limit 1),
  '/business',
  'won notification links to business workbench'
);

select is(
  (select title from public.notifications
   where recipient_id = 'a0000000-0000-0000-0000-000000000001'
   order by created_at desc limit 1),
  '商机已成交',
  'won notification title is 商机已成交'
);

select is(
  (select count(*) from pg_proc
   where proname = 'notify_boss_on_opportunity_won'
     and not proacl is null),
  1::bigint,
  'won notification function is not executable by public'
);

select * from finish();
